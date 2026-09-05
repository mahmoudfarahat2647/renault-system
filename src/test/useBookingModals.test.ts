import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBookingModals } from "@/app/(app)/booking/useBookingModals";

describe("useBookingModals", () => {
	it("initializes with all modals closed and an empty reorderReason", () => {
		const { result } = renderHook(() => useBookingModals());

		expect(result.current.isReorderModalOpen).toBe(false);
		expect(result.current.reorderReason).toBe("");
		expect(result.current.isRebookingModalOpen).toBe(false);
		expect(result.current.showDeleteConfirm).toBe(false);
	});

	describe("reorder modal", () => {
		it("openReorder() opens modal; closeReorder() closes it and leaves reorderReason unchanged", () => {
			const { result } = renderHook(() => useBookingModals());

			act(() => {
				result.current.setReorderReason("Wrong part supplied");
			});
			expect(result.current.reorderReason).toBe("Wrong part supplied");

			act(() => {
				result.current.openReorder();
			});
			expect(result.current.isReorderModalOpen).toBe(true);

			act(() => {
				result.current.closeReorder();
			});
			expect(result.current.isReorderModalOpen).toBe(false);
			expect(result.current.reorderReason).toBe("Wrong part supplied");
		});

		it("resetReorder() closes modal and clears reorderReason to empty string", () => {
			const { result } = renderHook(() => useBookingModals());

			act(() => {
				result.current.openReorder();
				result.current.setReorderReason("Customer cancelled");
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.reorderReason).toBe("Customer cancelled");

			act(() => {
				result.current.resetReorder();
			});
			expect(result.current.isReorderModalOpen).toBe(false);
			expect(result.current.reorderReason).toBe("");
		});

		it("setReorderModalOpen(false) (the onOpenChange path) closes without clearing a set reason", () => {
			const { result } = renderHook(() => useBookingModals());

			act(() => {
				result.current.openReorder();
				result.current.setReorderReason("Part defective");
			});

			act(() => {
				result.current.setReorderModalOpen(false);
			});
			expect(result.current.isReorderModalOpen).toBe(false);
			expect(result.current.reorderReason).toBe("Part defective");

			act(() => {
				result.current.setReorderModalOpen(true);
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.reorderReason).toBe("Part defective");
		});
	});

	describe("rebooking modal", () => {
		it("openRebooking() and closeRebooking() toggle isRebookingModalOpen only", () => {
			const { result } = renderHook(() => useBookingModals());

			act(() => {
				result.current.openRebooking();
			});
			expect(result.current.isRebookingModalOpen).toBe(true);
			expect(result.current.isReorderModalOpen).toBe(false);
			expect(result.current.showDeleteConfirm).toBe(false);

			act(() => {
				result.current.closeRebooking();
			});
			expect(result.current.isRebookingModalOpen).toBe(false);
		});

		it("setRebookingModalOpen() directly controls isRebookingModalOpen for onOpenChange", () => {
			const { result } = renderHook(() => useBookingModals());

			act(() => {
				result.current.setRebookingModalOpen(true);
			});
			expect(result.current.isRebookingModalOpen).toBe(true);

			act(() => {
				result.current.setRebookingModalOpen(false);
			});
			expect(result.current.isRebookingModalOpen).toBe(false);
		});
	});

	describe("delete confirm modal", () => {
		it("openDeleteConfirm() and closeDeleteConfirm() toggle showDeleteConfirm only", () => {
			const { result } = renderHook(() => useBookingModals());

			act(() => {
				result.current.openDeleteConfirm();
			});
			expect(result.current.showDeleteConfirm).toBe(true);
			expect(result.current.isReorderModalOpen).toBe(false);
			expect(result.current.isRebookingModalOpen).toBe(false);

			act(() => {
				result.current.closeDeleteConfirm();
			});
			expect(result.current.showDeleteConfirm).toBe(false);
		});

		it("setShowDeleteConfirm() directly controls showDeleteConfirm for onOpenChange", () => {
			const { result } = renderHook(() => useBookingModals());

			act(() => {
				result.current.setShowDeleteConfirm(true);
			});
			expect(result.current.showDeleteConfirm).toBe(true);

			act(() => {
				result.current.setShowDeleteConfirm(false);
			});
			expect(result.current.showDeleteConfirm).toBe(false);
		});
	});

	describe("cross-independence", () => {
		it("opening one modal does not change the other modals or mutate state unexpectedly", () => {
			const { result } = renderHook(() => useBookingModals());

			// Open reorder
			act(() => {
				result.current.openReorder();
				result.current.setReorderReason("Test reason");
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.isRebookingModalOpen).toBe(false);
			expect(result.current.showDeleteConfirm).toBe(false);

			// Open rebooking
			act(() => {
				result.current.openRebooking();
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.isRebookingModalOpen).toBe(true);
			expect(result.current.showDeleteConfirm).toBe(false);
			expect(result.current.reorderReason).toBe("Test reason");

			// Open delete confirm
			act(() => {
				result.current.openDeleteConfirm();
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.isRebookingModalOpen).toBe(true);
			expect(result.current.showDeleteConfirm).toBe(true);
			expect(result.current.reorderReason).toBe("Test reason");

			// Close rebooking & delete confirm - reorder remains open with reason intact
			act(() => {
				result.current.closeRebooking();
				result.current.closeDeleteConfirm();
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.isRebookingModalOpen).toBe(false);
			expect(result.current.showDeleteConfirm).toBe(false);
			expect(result.current.reorderReason).toBe("Test reason");

			// Reset reorder clears reason and closes reorder modal
			act(() => {
				result.current.resetReorder();
			});
			expect(result.current.isReorderModalOpen).toBe(false);
			expect(result.current.isRebookingModalOpen).toBe(false);
			expect(result.current.showDeleteConfirm).toBe(false);
			expect(result.current.reorderReason).toBe("");
		});
	});
});
