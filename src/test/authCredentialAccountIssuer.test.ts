import { describe, expect, it } from "vitest";

/**
 * Regression tests for Better Auth 1.7 account identity scoping by issuer.
 *
 * In Better Auth 1.7, account lookup for credentials (e.g. signInWithUsernameAndPassword)
 * queries for:
 *   - providerId = 'credential'
 *   - issuer = 'local:credential'
 *   - accountId = userId
 *   - userId = userId
 *
 * These tests ensure:
 * 1. The issuer format and values match Better Auth 1.7 expectations.
 * 2. Pre-1.7 rows without issuer or with mismatched accountId fail resolution.
 * 3. Migration backfill produces rows that resolve properly.
 */

const LOCAL_CREDENTIAL_ISSUER = "local:credential";

function formatOAuthIssuer(providerId: string): string {
	return `local:oauth:${encodeURIComponent(providerId)}`;
}

interface AuthAccountRecord {
	id: string;
	userId: string;
	accountId: string;
	providerId: string;
	issuer: string | null;
	password?: string;
}

/**
 * Simulates Better Auth internalAdapter.findCredentialAccount query logic.
 */
function findCredentialAccount(
	accounts: AuthAccountRecord[],
	userId: string,
): AuthAccountRecord | undefined {
	return accounts.find(
		(account) =>
			account.userId === userId &&
			account.providerId === "credential" &&
			account.issuer === LOCAL_CREDENTIAL_ISSUER &&
			account.accountId === userId,
	);
}

/**
 * Simulates Better Auth internalAdapter.findAccountByKey query logic.
 */
function findAccountByKey(
	accounts: AuthAccountRecord[],
	key: { issuer: string; accountId: string },
): AuthAccountRecord | undefined {
	return accounts.find(
		(account) =>
			account.issuer === key.issuer && account.accountId === key.accountId,
	);
}

describe("Better Auth 1.7 Account Issuer & Identity Scoping", () => {
	describe("Issuer format constants and rules", () => {
		it("uses 'local:credential' for local credential accounts", () => {
			expect(LOCAL_CREDENTIAL_ISSUER).toBe("local:credential");
		});

		it("formats standard OAuth providers with URL-safe provider ID", () => {
			expect(formatOAuthIssuer("google")).toBe("local:oauth:google");
			expect(formatOAuthIssuer("github")).toBe("local:oauth:github");
			expect(formatOAuthIssuer("discord")).toBe("local:oauth:discord");
		});

		it("percent-encodes complex or custom OAuth provider IDs", () => {
			expect(formatOAuthIssuer("team/custom-id")).toBe(
				"local:oauth:team%2Fcustom-id",
			);
		});
	});

	describe("findCredentialAccount resolution", () => {
		const targetUserId = "user-admin-123";

		it("resolves successfully when account has been migrated with issuer and account_id = user_id", () => {
			const accounts: AuthAccountRecord[] = [
				{
					id: "acc-1",
					userId: targetUserId,
					accountId: targetUserId, // synced by migration
					providerId: "credential",
					issuer: "local:credential", // backfilled by migration
					password: "hashed_password",
				},
			];

			const result = findCredentialAccount(accounts, targetUserId);
			expect(result).toBeDefined();
			expect(result?.id).toBe("acc-1");
			expect(result?.issuer).toBe("local:credential");
			expect(result?.accountId).toBe(targetUserId);
		});

		it("fails to resolve when issuer is null (pre-migration unmigrated row)", () => {
			const accounts: AuthAccountRecord[] = [
				{
					id: "acc-legacy-1",
					userId: targetUserId,
					accountId: targetUserId,
					providerId: "credential",
					issuer: null,
					password: "hashed_password",
				},
			];

			const result = findCredentialAccount(accounts, targetUserId);
			expect(result).toBeUndefined();
		});

		it("fails to resolve when issuer is empty string", () => {
			const accounts: AuthAccountRecord[] = [
				{
					id: "acc-legacy-2",
					userId: targetUserId,
					accountId: targetUserId,
					providerId: "credential",
					issuer: "",
					password: "hashed_password",
				},
			];

			const result = findCredentialAccount(accounts, targetUserId);
			expect(result).toBeUndefined();
		});

		it("fails to resolve when accountId does not match userId (legacy synthetic id)", () => {
			const accounts: AuthAccountRecord[] = [
				{
					id: "acc-legacy-3",
					userId: targetUserId,
					accountId: "arbitrary-legacy-account-uuid", // mismatched before migration
					providerId: "credential",
					issuer: "local:credential",
					password: "hashed_password",
				},
			];

			const result = findCredentialAccount(accounts, targetUserId);
			expect(result).toBeUndefined();
		});
	});

	describe("Compound unique key lookup (issuer, accountId)", () => {
		it("uniquely identifies accounts by (issuer, accountId)", () => {
			const accounts: AuthAccountRecord[] = [
				{
					id: "acc-cred",
					userId: "user-1",
					accountId: "user-1",
					providerId: "credential",
					issuer: "local:credential",
				},
				{
					id: "acc-google",
					userId: "user-1",
					accountId: "google-sub-456",
					providerId: "google",
					issuer: "local:oauth:google",
				},
			];

			const credAccount = findAccountByKey(accounts, {
				issuer: "local:credential",
				accountId: "user-1",
			});
			expect(credAccount?.id).toBe("acc-cred");

			const googleAccount = findAccountByKey(accounts, {
				issuer: "local:oauth:google",
				accountId: "google-sub-456",
			});
			expect(googleAccount?.id).toBe("acc-google");
		});
	});
});
