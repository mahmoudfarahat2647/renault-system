# Finding: Better-Auth Session Validation Database Cost Sources

## 1. Executive Summary & Bottom Line Up Front

This diagnosis identifies where Better-Auth session-validation database costs occur across this Next.js 15 App Router application, distinguishing two independent mechanisms: **Source A** (the authoritative root app layout check) and **Source B** (the Header notification polling loop). Code inspection demonstrates that **Source B is the continuous, dominant driver of session database load**, executing an uncached query against `auth_sessions` every 10 seconds per open client tab (~6 queries/minute/tab) regardless of user navigation. In contrast, **Source A is episodic and amortized**, executing strictly on initial hard loads, browser refreshes, post-login redirects, and explicit reload triggers. Because Next.js App Router preserves shared layouts during soft client-side navigation, inter-stage navigation (e.g. moving between Orders and Booking) generates zero layout session checks. However, this architectural property must not be mistaken for zero session database queries during user activity: background polling (Source B) continues unabated. Immediate follow-up levers include verifying function-to-database region colocation in Vercel (a zero-code latency fix) and evaluating `session.cookieCache` (a security/revocation trade-off).

---

## 2. Method & Observability Access

This finding was established via static code inspection, call-graph analysis, and environment auditing of the codebase. Live production runtime metrics could not be extracted within this session due to credential boundaries:

1. **Vercel Runtime Logs / Project Configuration (Unreachable in-session):**
   - The active Vercel API token resolved team `team_orIZumRJZ8gh3AZHyhCu1j0o` ("ll's projects", Hobby plan), but `list_projects` returned empty.
   - Calling `get_project` on `prj_gfg7vrYGD9DSfmhJ3HioCt3RIqJV` (`eimpendingsystem`, referenced in `.vercel/project.json:1`) returned HTTP `404 Not Found`.
   - The runtime logs endpoint returned HTTP `403 Forbidden` ("project does not exist or you do not have access").
   - *Action required:* Runtime logs for `GET /api/notifications` and layout RSC invocations must be inspected by an operator possessing project-level access in the Vercel console.

2. **Sentry Performance Spans (Unauthenticated in-session):**
   - The Sentry MCP connector was unauthenticated during analysis.
   - In-repo configuration (`src/lib/sentry.server.config.ts:7-13`) configures server-side Sentry initialization via `@sentry/nextjs` with `enabled: process.env.NODE_ENV === "production"` and `tracesSampleRate: 0.1` (10% sampling in production). `next.config.ts:68-69` targets organization `koko-sz` and project `pendingsystem`.
   - `@sentry/nextjs` includes automatic instrumentation for Postgres (`pg` pool queries). Therefore, if production telemetry is active, Sentry already records `db.sql.query` spans within the `GET /api/notifications` HTTP transaction and the `(app)` layout RSC transaction.
   - *Action required:* An operator with Sentry access should navigate to:
     - **Project:** `pendingsystem`
     - **Performance / Queries:** Filter transaction `GET /api/notifications`
     - **Spans:** Locate the `SELECT` query against `auth_sessions` and verify its latency distribution; separately inspect the root `(app)` layout RSC transaction for Source A baseline duration.

---

## 3. Source A — App Layout Authoritative Session Check

### Implementation
The application shell enforces authentication at the layout level in `src/app/(app)/layout.tsx:19-22`:
```typescript
const session = await getServerSession();
if (!session) {
    redirect("/login");
}
return <AppShell>{children}</AppShell>;
```
- `getServerSession()` (`src/lib/auth-session.ts:4-6`) invokes `auth.api.getSession({ headers: await headers() })`.
- Better-Auth is initialized in `src/lib/auth.ts:13-42` backed by a Kysely instance with `PostgresDialect` over `pg.Pool` (`src/lib/postgres.ts:49-51`).
- `session` configuration specifies `modelName: "auth_sessions"`, `expiresIn: 28800` (8 hours), and `updateAge: 300` (5 minutes).
- Crucially, **no `session.cookieCache` is configured**. As a consequence, every invocation of `getServerSession()` executes a live SQL query against the `auth_sessions` table (with an additional rolling `updated_at` write when the session record age exceeds `updateAge`).

### Execution Boundary (When It Runs vs. When It Does NOT Run)
- **Runs on:** Initial hard page loads, browser reloads/refreshes, post-login redirects, and explicit JavaScript reloads.
- **Does NOT run on:** Soft (client-side) navigation between sibling routes within `src/app/(app)/*` (e.g. `/orders` to `/booking`).
  - Next.js 15 App Router utilizes partial rendering keyed on the route segment tree; shared parent layouts do not re-render across client-side child transitions.
  - Inspection of `src/` confirms zero occurrences of `router.refresh()`, `revalidatePath()`, or `revalidateTag()`.
  - Inspection of `next.config.ts:4-65` confirms that neither `ppr` (Partial Prerendering), custom `staleTimes`, nor `dynamicIO` are enabled.

### Inventory of Explicit Reload Triggers
Static analysis reveals six locations in `src/` where explicit `window.location.reload()` calls force a full browser reload, thereby re-executing Source A:

1. `src/hooks/useColumnLayoutTracker.ts:82` — `resetLayout()` branch when user-saved default layout exists ("Resetting to your default layout. Refreshing...").
2. `src/hooks/useColumnLayoutTracker.ts:90` — `resetLayout()` branch when restoring factory code default ("Resetting to original layout. Refreshing...").
   *(Correction Note: Brief referenced lines 82 and 90 as "save and reset controls". In code, `saveAsDefault` at lines 54–62 does NOT invoke reload; both lines 82 and 90 reside exclusively within the `resetLayout` control).*
3. `src/components/shared/Header.tsx:462` — Explicit user-facing "Refresh Page" button in the header toolbar (`<button onClick={() => window.location.reload()} title="Refresh Page">`).
4. `src/app/global-error.tsx:64` — "Reload System" / "Refresh Page" button on fatal unhandled application errors.
5. `src/components/orders/OrderFormErrorBoundary.tsx:90` — "Reload Page" button on order modal render failure.
6. `src/components/shared/ClientErrorBoundary.tsx:58` — "Refresh Page" button on chunk load error boundary.

### Client-Side Session Evaluation (`SessionGuard` and `useSessionStatus`)
- `src/components/shared/SessionGuard.tsx:16-68` renders inside `<AppShell>` as a client component. It does **not** gate page rendering and does **not** poll the server on an interval.
  - The call to `authClient.getSession({ fetchOptions: { cache: "no-store" } })` (`SessionGuard.tsx:33`) is strictly user-triggered, firing only when the user clicks the "Stay signed in" action within the expiry warning toast.
- `src/hooks/useSessionStatus.ts:36-81` drives the session expiration countdown:
  - It derives `expiresAt` directly from `authClient.useSession()` cached data (`session?.session?.expiresAt`, line 44).
  - Its 30-second polling interval (`setInterval(..., 30_000)`, line 63) runs **purely in-memory on the client**, calculating remaining time via `Math.floor((expiresAt.getTime() - Date.now()) / 1000)` (line 17).
  - It generates **zero server requests and zero database queries**.
- **Minor third path — `authClient.useSession()` on shell mount.** `authClient.useSession()` is consumed by `SessionGuard.tsx:19`, `Sidebar.tsx:96`, and `useSessionStatus.ts:37`, all inside `<AppShell>`. Better-Auth's client shares one nanostore across these consumers, so shell mount triggers a single `GET /api/auth/get-session`, which itself calls `auth.api.getSession` → one `auth_sessions` read. It is **not** on a timer (it refetches only on the toast's "Stay signed in" action, `SessionGuard.tsx:33`, and on Better-Auth's default client revalidation). Its cost profile therefore matches Source A — roughly one extra DB session read per hard shell mount — not a continuous cost like Source B.

---

## 4. Source B — Header Notification Polling Loop

### Implementation and Call Chain
Every page rendered within `<AppShell>` mounts the shared header component (`src/components/shared/Header.tsx`). Line 64 invokes the notification candidate query:
```
Header.tsx:64 
  └── useNotificationCandidatesQuery() (src/hooks/queries/useNotificationCandidatesQuery.ts:23-60)
        └── fetchDueNotificationCandidates (src/services/notifications/notificationCandidatesService.ts:15-29)
              └── HTTP GET /api/notifications (src/app/api/notifications/route.ts:9-27)
                    └── auth.api.getSession({ headers: req.headers }) (route.ts:10)
```

1. `useNotificationCandidatesQuery.ts:30-35`:
   - Configures a TanStack React Query `useQuery` with `NOTIFICATION_CANDIDATES_QUERY_KEY`.
   - `refetchInterval: 10_000` (10 seconds, line 14).
   - `refetchOnWindowFocus: true` (line 34).
2. `notificationCandidatesService.ts:16`:
   - Executes `fetch("/api/notifications")`.
3. `src/app/api/notifications/route.ts:7,9-12`:
   - `export const runtime = "nodejs"` (Node.js runtime, utilizing the pg pool).
   - Line 10: `const session = await auth.api.getSession({ headers: req.headers });`
   - Line 11: `if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });`

### Resulting Database Cost
Every 10 seconds, for every open tab mounting `<AppShell>`, the client issues a `GET /api/notifications` request. Because Better-Auth has no cookie cache enabled, line 10 performs a **live SELECT against `auth_sessions` in the database**. This results in:
- **6 session-validation database queries per minute per active tab.**
- Continuous background execution regardless of user interaction, idle state, or page navigation.

### Inspection of the Secondary Polling Timer in `Header.tsx`
`src/components/shared/Header.tsx:144-182` establishes a second `setInterval` timer running every 10 seconds (`NOTIFICATION_CHECK_INTERVAL_MS = 10_000`), regulated by `shouldRunNotificationCheck` (`src/components/shared/headerNotificationPolling.ts:10-24`). This timer invokes:
1. `checkNotifications()`:
   - Defined in `src/store/slices/notificationSlice.ts:71-115`.
   - Inspection of lines 95–97 confirms that data is retrieved via `getOrdersQueryAdapter().getDueNotificationCandidates()`, which reads directly from the in-memory React Query cache (`queryClient.getQueryData`).
   - It performs client-side date comparison against existing memory records. **Zero network calls; zero database queries.**
2. `runMaintenance()`:
   - Defined in `src/hooks/useWarrantyExpiryMaintenance.ts:63-120`.
   - Contains an internal rate-limit guard (`MAINTENANCE_INTERVAL_MS = 3_600_000`, 1 hour; lines 79–82). On 99.7% of ticks, it aborts synchronously.
   - When the 1-hour cooldown elapses, it delegates to `orderService.fetchMappedOrders(stage)`, interacting with the Supabase browser client, completely bypassing `/api/notifications` and Better-Auth `getSession`.
- **Conclusion:** The secondary timer in `Header.tsx` is completely benign with respect to session validation costs. **Source B's continuous session database queries stem entirely from `useNotificationCandidatesQuery()`.**

---

## 5. Architectural Anti-Conflation: Soft Navigation vs. Continuous Session Querying

A critical architectural distinction must be maintained to prevent incorrect assumptions during optimization work:

> **The Architectural Rule:**
> "The layout check is not re-run on soft navigation" is **TRUE**.
> "There are no session database calls during navigation" is **FALSE**.

### The Mechanism
1. When a user clicks between sibling route links in the sidebar (e.g. navigating from `/orders` to `/main-sheet` to `/booking`):
   - The App Router router state tree recognizes `(app)/layout.tsx` as an active shared ancestor.
   - Next.js fetches only the client-side RSC payload for the target child segment.
   - `(app)/layout.tsx` is **not** re-rendered, and Source A does not execute.
2. Simultaneously, `Header.tsx` remains continuously mounted within `AppShell`.
   - `useNotificationCandidatesQuery` maintains its 10-second polling cadence.
   - Every 10 seconds, `GET /api/notifications` reaches the server and calls `auth.api.getSession({ headers: req.headers })`.
   - A user navigating actively between stages will still generate approximately 6 `auth_sessions` database hits per minute.

Optimizing or eliminating the layout's `getServerSession` call will have **zero impact** on this continuous baseline load.

---

## 6. Synthesis: Where the Session Validation Cost Actually Falls

| Dimension | Source A: Root App Layout (`(app)/layout.tsx`) | Source B: Notification Poll (`GET /api/notifications`) |
|---|---|---|
| **Trigger Mechanism** | Server Component layout render | Client React Query background interval (`10_000ms`) |
| **Frequency** | Episodic: 1 per hard page load or reload | Continuous: 6 requests per minute per active tab |
| **Navigation Sensitivity** | Bypassed entirely during soft navigation | Completely independent of navigation; persists across all stages |
| **Database Load Profile** | Low aggregate volume (amortized over sessions) | Dominant continuous volume (high aggregate read queries) |
| **User Latency Impact** | Directly blocks Time to First Byte (TTFB) on hard load | Asynchronous background fetch; zero impact on page transition latency |
| **Session Staleness** | Evaluated only at page entry | Evaluated every 10 seconds |

*Assessment (inspection-based, pending Vercel/Sentry verification):*
Source B accounts for the vast majority (>95%) of Better-Auth database queries generated during normal user sessions. Source A represents a latency concern on cold entry rather than a throughput concern on the database.

---

## 7. Recommendation: Instrumentation Strategy

No new instrumentation should be added until existing production telemetry (Vercel runtime logs and Sentry performance spans detailed in Section 2) has been reviewed by an authorized operator.

If production telemetry proves insufficient or dev-mode local benchmarking is desired, instrumentation must adhere strictly to these constraints:
1. It must measure the **awaited execution duration** of `auth.api.getSession`, not promise creation.
2. It must log via `@/lib/logger` (which gates `logger.debug` behind `process.env.NODE_ENV !== "production"`, preventing log pollution in production).
3. It must ship as an isolated, standalone commit/PR, completely decoupled from any feature or refactoring branch.

### Reference Implementation Snippet (for future evaluation)
Target file: `src/lib/auth-session.ts`
```typescript
import { headers } from "next/headers";
import { auth } from "./auth";
import { logger } from "./logger";

export async function getServerSession() {
	const h = await headers();
	const start = performance.now();
	const session = await auth.api.getSession({ headers: h });
	logger.debug("[auth] getServerSession", {
		ms: Math.round(performance.now() - start),
	});
	return session;
}
```
*(Do not implement this snippet as part of this finding).*

---

## 8. Recommendation: Vercel Region Colocation

### Current Repository State
- `vercel.json:1-8` currently declares only a `crons` schedule. It specifies no `regions` array.
- The PostgreSQL database pooler host documented in `AGENTS.md` is `aws-1-eu-central-1.pooler.supabase.com:5432` (Frankfurt, Germany).
- Under Vercel Hobby accounts, Serverless Functions default to `iad1` (Washington, D.C., USA) unless overridden.

### Cost Analysis of Region Mismatch
If the Vercel Serverless Function executing `GET /api/notifications` or `(app)/layout.tsx` runs in `iad1` while connecting to `eu-central-1`:
- Each database round-trip incurs a transatlantic network round-trip time (RTT) of approximately **80–100ms**.
- For Source B (6 queries/minute/tab), this introduces ~600ms of transatlantic network transit time per tab per minute solely to validate authentication.
- For Source A, cold hard page load TTFB is needlessly penalized by transatlantic latency before HTML streaming begins.

### Recommended Action
This is a **zero-code infrastructure decision**:
1. Check real function deployment region via Vercel Dashboard (`Project Settings -> Functions`) or by running `vercel inspect <deployment-url>`.
2. If confirmed in `iad1` (or another non-European region), configure European colocation in `vercel.json`:
   ```json
   {
     "regions": ["fra1"],
     "crons": [
       {
         "path": "/api/maintenance/archive-expired-warranties",
         "schedule": "0 2 * * *"
       }
     ]
   }
   ```
   *(Region `fra1` is adjacent to AWS `eu-central-1`).*

---

## 9. Recommendation: `session.cookieCache`

Better-Auth provides an optional `session.cookieCache` configuration that signs and stores session verification data in a client cookie with a configurable `maxAge`.

### Impact & Trade-Offs
- **Performance:** When active, `auth.api.getSession()` verifies the cryptographic signature on the cookie and skips the database `SELECT` query on `auth_sessions` during the cache window. This would virtually eliminate Source B's continuous database cost.
- **Security & Revocation Semantics:**
  - Standard database session validation reflects administrative session revocation immediately.
  - With `cookieCache`, a revoked session remains valid until the client cookie cache reaches its `maxAge`.
  - **Spec Conflict:** Spec #174 User Story #11 explicitly specifies: *"a server-revoked session stops working on the next hard load exactly as today."* Implementing `cookieCache` alters this behavior.
  - **Caution:**
    > ⚠️ RESTRICTED RULE: This change affects logic or UI. Proceeding would violate the refactor safety rule. Confirm before continuing.

### Recommended Action
Treat `session.cookieCache` as a **dedicated security decision**:
- Do not bundle `cookieCache` into the Booking page pilot or layout refactoring PRs.
- If adopted in a future ticket, restrict `maxAge` to a short window (e.g. 30–60 seconds). This bounds the revocation lag while still collapsing 3–6 notification polling queries per minute down to zero database hits during active sessions.

---

## 10. Scope and Boundaries

- **Deliverable:** This document (`FINDING_SESSION_COST_SOURCES.md`).
- **Code Modifications:** None. Zero files in `src/` have been added, altered, or deleted.
- **Commit Status:** Uncommitted; left for orchestrator review.
