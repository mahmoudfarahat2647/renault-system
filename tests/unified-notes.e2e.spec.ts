import { expect, test } from "@playwright/test";

test.describe.configure({
	timeout: 180_000,
	mode: "serial",
});

const waitForGridReady = async (page: import("@playwright/test").Page) => {
	await expect
		.poll(
			async () =>
				await page.locator('.ag-center-cols-container .ag-row[row-index="0"]').count(),
			{ timeout: 120_000 },
		)
		.toBeGreaterThan(0);
};

const createOrderIfEmpty = async (page: import("@playwright/test").Page) => {
	const rowCount = await page
		.locator('.ag-center-cols-container .ag-row[row-index="0"]')
		.count();
	if (rowCount > 0) return;

	// Open create dialog (New Logistics Request)
	await page.locator('div.bg-\\[\\#141416\\]').first().locator("button").first().click();
	await expect(page.getByRole("dialog", { name: "New Logistics Request" })).toBeVisible({
		timeout: 30_000,
	});

	const unique = Date.now();
	await page.getByRole("textbox", { name: "Full Name" }).fill(`Test Customer ${unique}`);
	await page.getByRole("textbox", { name: "VF1..." }).fill(`VF1TEST${unique}`);
	await page.getByRole("textbox", { name: "0xxxxxxxxx" }).fill("01000000000");
	await page.getByRole("textbox", { name: "Agent Name" }).fill("E2E");
	await page.getByRole("textbox", { name: "Order SAB" }).fill(`SAB-${unique}`);

	// Vehicle Model: attempt selection if available. This is a Radix-style combobox, not a native <select>.
	const modelTrigger = page.getByRole("combobox").filter({ hasText: "Select model" }).first();
	if (await modelTrigger.count()) {
		await modelTrigger.click();
		const menuOrList = page.locator('[role="listbox"], [role="menu"]').first();
		const firstChoice = menuOrList
			.locator('[role="option"], [role="menuitem"], [role="menuitemradio"]')
			.first();
		if (await firstChoice.count()) {
			await firstChoice.click();
		} else {
			await page.keyboard.press("Escape");
		}
	}

	// Components: fill first row inputs.
	await page.getByRole("textbox", { name: "REF#" }).fill("REF-1");
	await page.getByRole("textbox", { name: "Description" }).fill("E2E seeded part");

	await page.getByRole("button", { name: "Publish" }).click();
	await expect(
		page.getByRole("dialog", { name: "New Logistics Request" }),
	).toBeHidden({ timeout: 60_000 });

	await expect
		.poll(
			async () =>
				await page.locator('.ag-center-cols-container .ag-row[row-index="0"]').count(),
			{ timeout: 120_000 },
		)
		.toBeGreaterThan(0);
};

const closeSidebarIfOverlaying = async (page: import("@playwright/test").Page) => {
	const viewport = page.viewportSize();
	if (!viewport) return;

	const aside = page.locator("aside").first();
	if (!(await aside.count())) return;
	if (!(await aside.isVisible().catch(() => false))) return;

	const box = await aside.boundingBox().catch(() => null);
	if (!box) return;

	// Only treat it as an overlay on small screens.
	if (viewport.width > 700) return;

	// If sidebar covers part of the main content, collapse it using the icon-only toggle.
	if (box.width > viewport.width * 0.3) {
		const toggle = page
			.getByRole("complementary")
			.locator("button")
			.filter({ has: page.locator("img") })
			.first();
		if (await toggle.count()) {
			await toggle.click().catch(() => {});
			await expect(aside).toBeHidden({ timeout: 10_000 }).catch(() => {});
		}
	}
};

const openNotesModalFromFirstRow = async (page: import("@playwright/test").Page) => {
	await waitForGridReady(page);
	await closeSidebarIfOverlaying(page);
	const noteBtn = page.locator(
		'.ag-center-cols-container .ag-row[row-index="0"] button[title="Note"]',
	);
	await noteBtn.scrollIntoViewIfNeeded();
	await noteBtn.click();
	await expect(page.getByRole("dialog", { name: "Notes" })).toBeVisible();
};

const openNotesModalForVin = async (
	page: import("@playwright/test").Page,
	vin: string,
) => {
	await waitForGridReady(page);
	await closeSidebarIfOverlaying(page);

	// If the VIN isn't immediately visible, narrow down using the VIN column filter (AG-Grid floating filter).
	const vinFilter = page.getByRole("textbox", { name: "VIN NO/ Filter Input" }).first();
	if (await vinFilter.count()) {
		await vinFilter.fill(vin);
		// AG-Grid can debounce/async apply filters.
		await page.waitForTimeout(200);
	}

	const row = page
		.locator(".ag-center-cols-container .ag-row")
		.filter({ hasText: vin })
		.first();
	await expect(row).toBeVisible({ timeout: 30_000 });

	const noteBtn = row.locator('button[title="Note"]').first();
	await noteBtn.scrollIntoViewIfNeeded();
	await noteBtn.click();
	await expect(page.getByRole("dialog", { name: "Notes" })).toBeVisible();
};

const closeDialog = async (page: import("@playwright/test").Page) => {
	const close = page.getByRole("button", { name: "Close" });
	if (await close.count()) {
		await close.first().click();
	}
};

const saveNotesInDialog = async (page: import("@playwright/test").Page) => {
	await page.getByRole("button", { name: "SAVE NOTES" }).click();
	await expect(page.getByRole("dialog", { name: "Notes" })).toBeHidden();
};

const existingNotesValue = async (page: import("@playwright/test").Page) => {
	const existing = page.getByRole("textbox", { name: "No notes yet..." });
	await expect(existing).toBeVisible();
	return await existing.inputValue();
};

const addOrdersManualNote = async (page: import("@playwright/test").Page, note: string) => {
	await openNotesModalFromFirstRow(page);
	const editor = page.getByRole("textbox", { name: "Type a note for #orders..." });
	await editor.fill(note);
	await saveNotesInDialog(page);
};

const selectFirstRow = async (page: import("@playwright/test").Page) => {
	await waitForGridReady(page);
	await closeSidebarIfOverlaying(page);
	await page.locator('.ag-center-cols-container .ag-row[row-index="0"]').first().click();
};

const selectedVinFromInfoPanel = async (page: import("@playwright/test").Page) => {
	const vinValue = page.locator(
		'xpath=//*[normalize-space()="vin :"]/following-sibling::*[1]',
	);
	await expect(vinValue).toBeVisible({ timeout: 30_000 });
	return (await vinValue.innerText()).trim();
};

const openBookingModal = async (page: import("@playwright/test").Page) => {
	await selectFirstRow(page);
	const bookingBtn = page.locator("button:has(svg.lucide-calendar)").first();
	await expect(bookingBtn).toBeEnabled();
	await bookingBtn.click();
	await expect(page.getByRole("dialog", { name: "Booking Schedule" })).toBeVisible();
};

const confirmBookingWithNote = async (
	page: import("@playwright/test").Page,
	note: string,
) => {
	await openBookingModal(page);
	await page.getByRole("textbox", { name: "Add initial note..." }).fill(note);
	await page.getByRole("button", { name: /^Confirm Jan/i }).click();
	// After confirming, the dialog content changes and doesn't always expose a Close button.
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog", { name: "Booking Schedule" })).toBeHidden({
		timeout: 30_000,
	});
};

const openArchiveModal = async (page: import("@playwright/test").Page) => {
	await selectFirstRow(page);
	const archiveBtn = page.locator("button:has(svg.lucide-archive)").first();
	await expect(archiveBtn).toBeEnabled();
	await archiveBtn.click();
	await expect(page.getByRole("dialog", { name: "Archive Record" })).toBeVisible();
};

const confirmArchiveWithReason = async (
	page: import("@playwright/test").Page,
	reason: string,
) => {
	await openArchiveModal(page);
	await page.getByRole("textbox", { name: "Reason for Archiving" }).fill(reason);
	await page.getByRole("button", { name: "Confirm Archive" }).click();
	await expect(page.getByRole("dialog", { name: "Archive Record" })).toBeHidden();
};

test.describe("Unified Notes System", () => {
	test.beforeEach(async ({ page }) => {
		page.setDefaultNavigationTimeout(60_000);
		page.setDefaultTimeout(60_000);
		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await createOrderIfEmpty(page);
	});

	test("Booking note history: booking note appears with #booking", async ({ page }) => {
		const unique = `Customer ready for pickup ${Date.now()}`;

		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await createOrderIfEmpty(page);
		await selectFirstRow(page);
		const vin = await selectedVinFromInfoPanel(page);
		await confirmBookingWithNote(page, unique);

		await page.goto("/booking", { waitUntil: "domcontentloaded" });
		await openNotesModalForVin(page, vin);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${unique} #booking`,
		);
		await closeDialog(page);
	});

	test("Archive reason history: archive reason appears with #archive", async ({ page }) => {
		const unique = `Job completed successfully ${Date.now()}`;

		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await createOrderIfEmpty(page);
		await selectFirstRow(page);
		const vin = await selectedVinFromInfoPanel(page);
		await confirmArchiveWithReason(page, unique);

		await page.goto("/archive", { waitUntil: "domcontentloaded" });
		await openNotesModalForVin(page, vin);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${unique} #archive`,
		);
		await closeDialog(page);
	});

	test("Cumulative history: orders + booking + archive notes all preserved", async ({ page }) => {
		const unique = Date.now();
		const ordersNote = `Waiting for customer confirmation ${unique}`;
		const bookingNote = `Confirmed booking ${unique}`;
		const archiveReason = `Service completed ${unique}`;

		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await createOrderIfEmpty(page);
		await selectFirstRow(page);
		const vin = await selectedVinFromInfoPanel(page);
		await addOrdersManualNote(page, ordersNote);
		await confirmBookingWithNote(page, bookingNote);

		await page.goto("/booking", { waitUntil: "domcontentloaded" });
		await openNotesModalForVin(page, vin);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${ordersNote} #orders`,
		);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${bookingNote} #booking`,
		);
		await closeDialog(page);

		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await selectFirstRow(page);
		await confirmArchiveWithReason(page, archiveReason);

		await page.goto("/archive", { waitUntil: "domcontentloaded" });
		await openNotesModalForVin(page, vin);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${ordersNote} #orders`,
		);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${bookingNote} #booking`,
		);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${archiveReason} #archive`,
		);
		await closeDialog(page);
	});
});
