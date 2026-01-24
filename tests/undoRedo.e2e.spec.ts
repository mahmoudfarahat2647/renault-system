import { expect, test } from "@playwright/test";

test.describe.configure({
	timeout: 180_000,
	mode: "serial",
});

const headerUndoButton = (page: import("@playwright/test").Page) =>
	page.getByRole("button", { name: "Undo (Cmd+Z)" });

const headerRedoButton = (page: import("@playwright/test").Page) =>
	page.getByRole("button", { name: "Redo (Cmd+Shift+Z)" });

const headerSaveButton = (page: import("@playwright/test").Page) =>
	page.getByRole("button", { name: "Save Changes (Cmd+S)" });

const globalSearchInput = (page: import("@playwright/test").Page) =>
	page.getByRole("textbox", { name: "Search system (Cmd+K)..." });

const waitForOrdersGridReady = async (page: import("@playwright/test").Page) => {
	// On slow CI/dev machines, the Orders page can render skeletons before AG-Grid mounts.
	// Wait for at least one real data row.
	await expect
		.poll(
			async () =>
				await page.locator('.ag-center-cols-container .ag-row').count(),
			{ timeout: 120_000 },
		)
		.toBeGreaterThan(0);
};

const firstGridNoteButton = (page: import("@playwright/test").Page) =>
	page
		.locator('.ag-center-cols-container .ag-row').first()
		.locator('button[title="Note"]');

const firstRow = (page: import("@playwright/test").Page) =>
	page.locator('.ag-center-cols-container .ag-row').first();

const selectFirstRow = async (page: import("@playwright/test").Page) => {
	await waitForOrdersGridReady(page);
	await firstRow(page).click();
	// Make sure the info panel is populated (VIN should not be "-")
	await expect(page.getByText(/^vin :/i)).toBeVisible();
};

const partStateValue = (page: import("@playwright/test").Page) =>
	// In the info panel, label/value are sibling nodes in the same row.
	page.locator(
		'xpath=//*[normalize-space()="part state :"]/following-sibling::*[1]',
	);

const openUpdatePartStatusDropdown = async (
	page: import("@playwright/test").Page,
) => {
	// The dropdown trigger is icon-only and doesn't have a stable accessible name.
	// Use a stable anchor within the OrdersToolbar DOM: the green "Commit" button.
	const toolbar = page.locator('div.bg-\\[\\#141416\\]').first();
	await expect(toolbar).toBeVisible({ timeout: 30_000 });

	const buttons = toolbar.locator("button");
	const count = await buttons.count();
	expect(count).toBeGreaterThan(0);

	// Find the commit button index within the toolbar.
	let commitIndex = -1;
	for (let i = 0; i < count; i++) {
		const className = (await buttons.nth(i).getAttribute("class")) || "";
		if (className.includes("bg-green-600")) {
			commitIndex = i;
			break;
		}
	}
	if (commitIndex <= 0) {
		throw new Error("Could not locate Commit button inside Orders toolbar");
	}

	// The Part Status dropdown trigger is immediately before the Commit button in OrdersToolbar.tsx.
	const trigger = buttons.nth(commitIndex - 1);
	await expect(trigger).toBeEnabled({ timeout: 30_000 });
	await trigger.click();

	await expect(
		page.getByRole("menuitem", { name: "Arrived", exact: true }),
	).toBeVisible({ timeout: 30_000 });
};

const choosePartStatus = async (
	page: import("@playwright/test").Page,
	statusLabel: string,
) => {
	// Avoid matching e.g. "Not Arrived" when selecting "Arrived"
	const escaped = statusLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	await page
		.getByRole("menuitem")
		.filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`) })
		.click();
};

const openNotesModal = async (page: import("@playwright/test").Page) => {
	await waitForOrdersGridReady(page);
	await firstRow(page).scrollIntoViewIfNeeded();
	await firstRow(page).hover();
	await expect(firstGridNoteButton(page)).toBeVisible({ timeout: 30_000 });
	await firstGridNoteButton(page).click({ force: true });
	await expect(page.getByRole("dialog", { name: "Notes" })).toBeVisible();
};

const closeNotesModal = async (page: import("@playwright/test").Page) => {
	await page.getByRole("button", { name: "Close" }).click();
	await expect(page.getByRole("dialog", { name: "Notes" })).toBeHidden();
};

const saveNotes = async (page: import("@playwright/test").Page) => {
	await page.getByRole("button", { name: "SAVE NOTES" }).click();
	await expect(page.getByRole("dialog", { name: "Notes" })).toBeHidden();
};

const getExistingNotesValue = async (page: import("@playwright/test").Page) => {
	const existing = page.getByRole("textbox", { name: "No notes yet..." });
	await expect(existing).toBeVisible();
	return await existing.inputValue();
};

test.describe("Undo/Redo (session-only) - real user behavior", () => {
	test.beforeEach(async ({ page }) => {
		page.setDefaultNavigationTimeout(120_000);
		page.setDefaultTimeout(60_000);
		await page.goto("/orders", { waitUntil: "networkidle", timeout: 120_000 });
		await waitForOrdersGridReady(page);
		await expect(headerUndoButton(page)).toBeVisible();
		await expect(headerRedoButton(page)).toBeVisible();
	});

	test("1/2/6) Undo (Ctrl+Z) restores last mutation; Redo (Ctrl+Y / Ctrl+Shift+Z) reapplies; header buttons reflect enabled state", async ({ page }) => {
		// Initial state: no undo/redo
		await expect(headerUndoButton(page)).toBeDisabled();
		await expect(headerRedoButton(page)).toBeDisabled();

		// STABILITY FIX: Identify the row by a unique value (VIN) to prevent errors if the grid re-sorts
		await waitForOrdersGridReady(page);
		const row0 = firstRow(page);
		const vinCell = row0.locator('[col-id="vin"], [col-id="vin_no"]').first();
		const vinText = (await vinCell.innerText()).trim();
		const targetRow = page.locator(`.ag-row:has-text("${vinText}")`).first();

		await targetRow.click();
		await expect(page.getByText(/^vin :/i)).toBeVisible();
		const beforePartState = (await partStateValue(page).innerText()).trim();

		// Mutation: update part status via store-driven action (pushUndo happens in inventorySlice)
		await openUpdatePartStatusDropdown(page);
		await choosePartStatus(page, "Arrived");

		// STABILITY FIX: Wait for success toast to appear
		await expect(
			page.getByText('Part status updated to "Arrived"'),
		).toBeVisible({ timeout: 10_000 });

		// STABILITY FIX: Wait for the toast to disappear (mutation fully processed)
		await expect(
			page.getByText('Part status updated to "Arrived"'),
		).toBeHidden({ timeout: 10_000 });

		// After mutation: undo enabled, redo still disabled
		await expect(headerUndoButton(page)).toBeEnabled();
		await expect(headerRedoButton(page)).toBeDisabled();

		// STABILITY FIX: Re-select the row by VIN to ensure InfoPanel is refreshed
		await targetRow.click();

		// STABILITY FIX: Use expect.poll with ample timeout for InfoPanel to reflect update
		await expect
			.poll(
				async () => (await partStateValue(page).innerText()).trim(),
				{
					timeout: 20_000,
					intervals: [1000, 2000],
					message: `Expected part state for VIN ${vinText} to become "Arrived"`
				}
			)
			.toContain("Arrived");

		// Undo: Ctrl+Z
		await page.keyboard.press("Control+z");

		// STABILITY FIX: Wait for redo button to become enabled (undo completed)
		await expect(headerRedoButton(page)).toBeEnabled({ timeout: 10_000 });

		// STABILITY FIX: Re-select the row by VIN after undo
		await targetRow.click();

		// STABILITY FIX: Use expect.poll to verify the part state reverted
		await expect
			.poll(
				async () => (await partStateValue(page).innerText()).trim(),
				{
					timeout: 15_000,
					intervals: [1000, 2000],
					message: `Expected part state for VIN ${vinText} to revert to "${beforePartState}"`
				}
			)
			.toContain(beforePartState);

		// Redo: Ctrl+Y
		await page.keyboard.press("Control+y");

		// STABILITY FIX: Wait for redo button to become disabled (redo completed)
		await expect(headerRedoButton(page)).toBeDisabled({ timeout: 10_000 });
		await expect(headerUndoButton(page)).toBeEnabled();

		// STABILITY FIX: Re-select the row by VIN after redo
		await targetRow.click();

		// STABILITY FIX: Use expect.poll to verify "Arrived" is back after redo
		await expect
			.poll(
				async () => (await partStateValue(page).innerText()).trim(),
				{
					timeout: 15_000,
					intervals: [1000, 2000],
					message: `Expected part state for VIN ${vinText} to reapplied to "Arrived"`
				}
			)
			.toContain("Arrived");

		// Undo again then redo via Ctrl+Shift+Z
		await page.keyboard.press("Control+z");
		await expect(headerRedoButton(page)).toBeEnabled({ timeout: 10_000 });

		await page.keyboard.press("Control+Shift+z");
		await expect(headerRedoButton(page)).toBeDisabled({ timeout: 10_000 });

		// STABILITY FIX: Final verification - re-select and poll for "Arrived"
		await targetRow.click();
		await expect
			.poll(
				async () => (await partStateValue(page).innerText()).trim(),
				{
					timeout: 15_000,
					intervals: [1000, 2000],
					message: `Final check: Expected part state for VIN ${vinText} to be "Arrived"`
				}
			)
			.toContain("Arrived");
	});

	test("3/6) Ctrl+S clears undo/redo stacks and disables Undo/Redo buttons", async ({ page }) => {
		await expect(headerUndoButton(page)).toBeDisabled();

		await selectFirstRow(page);
		await openUpdatePartStatusDropdown(page);
		await choosePartStatus(page, "Arrived");

		// STABILITY FIX: Wait for success toast to confirm mutation completed
		await expect(
			page.getByText('Part status updated to "Arrived"'),
		).toBeVisible({ timeout: 10_000 });

		// STABILITY FIX: Wait for toast to disappear before checking button state
		await expect(
			page.getByText('Part status updated to "Arrived"'),
		).toBeHidden({ timeout: 10_000 });

		await expect(headerUndoButton(page)).toBeEnabled();
		await expect(headerRedoButton(page)).toBeDisabled();

		// Ctrl+S
		await page.keyboard.press("Control+s");

		// STABILITY FIX: Wait for save operation to complete (look for success message or button state change)
		await expect(headerUndoButton(page)).toBeDisabled({ timeout: 10_000 });
		await expect(headerRedoButton(page)).toBeDisabled();
	});

	test("4) Keyboard safety guards: Undo/Redo should NOT trigger while typing in Input, Textarea, or AG-Grid cell editor", async ({ page }) => {
		// Prepare undo state
		await selectFirstRow(page);
		await openUpdatePartStatusDropdown(page);
		await choosePartStatus(page, "Arrived");

		// STABILITY FIX: Wait for success toast to confirm mutation completed
		await expect(
			page.getByText('Part status updated to "Arrived"'),
		).toBeVisible({ timeout: 10_000 });
		await expect(
			page.getByText('Part status updated to "Arrived"'),
		).toBeHidden({ timeout: 10_000 });

		await expect(headerUndoButton(page)).toBeEnabled();

		// Guard 1: INPUT (global search)
		await globalSearchInput(page).click();
		await page.keyboard.type("typing");
		await page.keyboard.press("Control+z");
		await expect(headerUndoButton(page)).toBeEnabled();

		// Guard 2: TEXTAREA (note editor)
		await openNotesModal(page);
		const noteEditor = page.getByRole("textbox", {
			name: "Type a note for #orders...",
		});
		await noteEditor.click();
		await page.keyboard.type("more text");
		await page.keyboard.press("Control+z");
		// Global undo should not have run; stack should still exist
		await closeNotesModal(page);
		await expect(headerUndoButton(page)).toBeEnabled();

		// Guard 3: AG-Grid cell editor (.ag-cell-edit-wrapper)
		// Try to enter edit mode on a cell and ensure undo shortcut does not trigger global undo.
		const statusCell = page
			.locator('.ag-center-cols-container .ag-row:first-child .ag-cell[col-id="status"]')
			.first();
		await statusCell.dblclick();

		// If the editor wrapper appears, verify Ctrl+Z doesn't run global undo.
		const editorWrapper = page.locator(".ag-cell-edit-wrapper");
		if (await editorWrapper.count()) {
			await editorWrapper.first().click();
			await page.keyboard.press("Control+z");
			await expect(headerUndoButton(page)).toBeEnabled();
		}

		// STABILITY FIX: Re-select row to refresh InfoPanel before sanity check
		await firstRow(page).click();

		// Sanity: mutation still present (undo did not fire)
		await expect
			.poll(
				async () => (await partStateValue(page).innerText()).trim(),
				{ timeout: 30_000 },
			)
			.toContain("Arrived");
	});

	test("5) Page refresh clears all undo/redo history", async ({ page }) => {
		await selectFirstRow(page);
		await openUpdatePartStatusDropdown(page);
		await choosePartStatus(page, "Arrived");

		// STABILITY FIX: Wait for success toast to confirm mutation completed before reload
		await expect(
			page.getByText('Part status updated to "Arrived"'),
		).toBeVisible({ timeout: 10_000 });
		await expect(
			page.getByText('Part status updated to "Arrived"'),
		).toBeHidden({ timeout: 10_000 });

		await expect(headerUndoButton(page)).toBeEnabled();

		await page.reload();
		await expect(headerUndoButton(page)).toBeDisabled();
		await expect(headerRedoButton(page)).toBeDisabled();
	});
});
