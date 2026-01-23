import { test, expect } from "@playwright/test";

test("System History (Last 48h) is accessible from Settings", async ({ page }) => {
	test.setTimeout(60_000);
	await page.goto("/", { waitUntil: "domcontentloaded" });

	const dashboardLink = page.getByRole("link", { name: "Dashboard" });
	await expect(dashboardLink).toBeVisible();
	await page.waitForLoadState("domcontentloaded");
	await expect(
		page.getByRole("button", { name: "Sync Local Data to Cloud" }),
	).toBeVisible();

	// In dev, Next.js can show an overlay like "Update Available" / ChunkLoadError.
	// Detect the overlay explicitly (don't confuse it with the app's own "Refresh Page" toolbar button).
	const nextUpdateOverlay = page.getByRole("heading", { name: "Update Available" });
	const nextChunkDialog = page.getByRole("dialog", { name: /ChunkLoadError/i });
	for (let attempt = 0; attempt < 2; attempt++) {
		const hasOverlay =
			(await nextUpdateOverlay.isVisible().catch(() => false)) ||
			(await nextChunkDialog.isVisible().catch(() => false));
		if (!hasOverlay) break;
		await page.reload();
		await expect(dashboardLink).toBeVisible();
		await page.waitForLoadState("domcontentloaded");
	}

	const resolveProfileButton = async () => {
		const byRole = page.getByRole("button", {
			name: /Mahmoud Farahat\s+System Creator/i,
		});
		if (await byRole.isVisible().catch(() => false)) return byRole;

		const byCssText = page.locator("button", { hasText: "Mahmoud Farahat" }).first();
		if (await byCssText.isVisible().catch(() => false)) return byCssText;

		// Fallback for browsers where the accessible name may differ.
		const byTextInSidebar = page
			.locator("aside")
			.getByText("Mahmoud Farahat", { exact: true })
			.first()
			.locator("xpath=ancestor::button[1]");
		return byTextInSidebar;
	};

	const profileButton = await resolveProfileButton();
	await expect(profileButton).toBeVisible({ timeout: 15000 });

	const settingsDialog = page.getByRole("dialog");

	const openSettings = async () => {
		await profileButton.evaluate((el) => (el as HTMLButtonElement).click());
	};

	for (let attempt = 0; attempt < 3; attempt++) {
		await openSettings();
		if (await settingsDialog.isVisible().catch(() => false)) break;
		await page.waitForTimeout(300);
	}

	if (!(await settingsDialog.isVisible().catch(() => false))) {
		await page.reload();
		await expect(dashboardLink).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Sync Local Data to Cloud" }),
		).toBeVisible();
		await openSettings();
	}

	await expect(settingsDialog).toBeVisible({ timeout: 20000 });
	await expect(
		settingsDialog.getByRole("heading", { name: "Settings" }),
	).toBeVisible();

	const lastChangesTab = settingsDialog.getByRole("button", { name: "Last Changes" });
	await lastChangesTab.click({ force: true });
	if (!(await settingsDialog.getByRole("heading", { name: "System History (Last 48h)" }).isVisible().catch(() => false))) {
		await lastChangesTab.evaluate((el) => (el as HTMLButtonElement).click());
	}

	await expect(
		settingsDialog.getByRole("heading", { name: "System History (Last 48h)" }),
	).toBeVisible();

	// Assert either empty state or that at least one history item exists.
	const emptyState = settingsDialog.getByText(
		"No activity recorded for this session.",
	);
	if (await emptyState.isVisible().catch(() => false)) {
		await expect(emptyState).toBeVisible();
	} else {
		await expect(settingsDialog.getByRole("button", { name: "Rollback" }).first()).toBeVisible();
	}
});
