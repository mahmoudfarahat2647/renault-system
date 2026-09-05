import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMainSheetModals } from "@/app/(app)/main-sheet/useMainSheetModals";

describe("useMainSheetModals", () => {
	it("initializes with all modals closed and an empty reorderReason", () => {
		const { result } = renderHook(() => useMainSheetModals());

		expect(result.current.isReorderModalOpen).toBe(false);
		expect(result.current.reorderReason).toBe("");
		expect(result.current.isBookingModalOpen).toBe(false);
		expect(result.current.showDeleteConfirm).toBe(false);
	});

	describe("reorder modal", () => {
		it("openReorder() opens modal; closeReorder() closes it and leaves reorderReason unchanged", () => {
			const { result } = renderHook(() => useMainSheetModals());

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
			const { result } = renderHook(() => useMainSheetModals());

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
			const { result } = renderHook(() => useMainSheetModals());

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

	describe("booking calendar modal", () => {
		it("openBooking() and closeBooking() toggle isBookingModalOpen only", () => {
			const { result } = renderHook(() => useMainSheetModals());

			act(() => {
				result.current.openBooking();
			});
			expect(result.current.isBookingModalOpen).toBe(true);
			expect(result.current.isReorderModalOpen).toBe(false);
			expect(result.current.showDeleteConfirm).toBe(false);

			act(() => {
				result.current.closeBooking();
			});
			expect(result.current.isBookingModalOpen).toBe(false);
		});

		it("setBookingModalOpen() directly controls isBookingModalOpen for onOpenChange", () => {
			const { result } = renderHook(() => useMainSheetModals());

			act(() => {
				result.current.setBookingModalOpen(true);
			});
			expect(result.current.isBookingModalOpen).toBe(true);

			act(() => {
				result.current.setBookingModalOpen(false);
			});
			expect(result.current.isBookingModalOpen).toBe(false);
		});
	});

	describe("delete confirm modal", () => {
		it("openDeleteConfirm() and closeDeleteConfirm() toggle showDeleteConfirm only", () => {
			const { result } = renderHook(() => useMainSheetModals());

			act(() => {
				result.current.openDeleteConfirm();
			});
			expect(result.current.showDeleteConfirm).toBe(true);
			expect(result.current.isReorderModalOpen).toBe(false);
			expect(result.current.isBookingModalOpen).toBe(false);

			act(() => {
				result.current.closeDeleteConfirm();
			});
			expect(result.current.showDeleteConfirm).toBe(false);
		});

		it("setShowDeleteConfirm() directly controls showDeleteConfirm for onOpenChange", () => {
			const { result } = renderHook(() => useMainSheetModals());

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
			const { result } = renderHook(() => useMainSheetModals());

			// Open reorder
			act(() => {
				result.current.openReorder();
				result.current.setReorderReason("Test reason");
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.isBookingModalOpen).toBe(false);
			expect(result.current.showDeleteConfirm).toBe(false);

			// Open booking
			act(() => {
				result.current.openBooking();
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.isBookingModalOpen).toBe(true);
			expect(result.current.showDeleteConfirm).toBe(false);
			expect(result.current.reorderReason).toBe("Test reason");

			// Open delete confirm
			act(() => {
				result.current.openDeleteConfirm();
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.isBookingModalOpen).toBe(true);
			expect(result.current.showDeleteConfirm).toBe(true);
			expect(result.current.reorderReason).toBe("Test reason");

			// Close booking & delete confirm - reorder remains open with reason intact
			act(() => {
				result.current.closeBooking();
				result.current.closeDeleteConfirm();
			});
			expect(result.current.isReorderModalOpen).toBe(true);
			expect(result.current.isBookingModalOpen).toBe(false);
			expect(result.current.showDeleteConfirm).toBe(false);
			expect(result.current.reorderReason).toBe("Test reason");

			// Reset reorder clears reason and closes reorder modal
			act(() => {
				result.current.resetReorder();
			});
			expect(result.current.isReorderModalOpen).toBe(false);
			expect(result.current.isBookingModalOpen).toBe(false);
			expect(result.current.showDeleteConfirm).toBe(false);
			expect(result.current.reorderReason).toBe("");
		});
	});
});
