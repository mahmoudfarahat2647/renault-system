import { describe, it, expect, vi } from "vitest";
import { createInventorySlice } from "../inventorySlice";

describe("inventorySlice", () => {
    const mockSet = vi.fn();
    const mockGet = vi.fn(() => ({
        addCommit: vi.fn(),
        debouncedCommit: vi.fn(),
    })) as any;

    const slice = createInventorySlice(mockSet, mockGet, {} as any);

    it("should initialize with empty arrays", () => {
        expect(slice.rowData).toEqual([]);
        expect(slice.callRowData).toEqual([]);
        expect(slice.archiveRowData).toEqual([]);
    });

    it("sendToArchive should move rows from various sources to archiveRowData", () => {
        const mockState = {
            rowData: [{ id: "1", baseId: "B1", status: "Pending" }],
            callRowData: [{ id: "2", baseId: "B2", status: "Call" }],
            bookingRowData: [{ id: "3", baseId: "B3", status: "Booking" }],
            archiveRowData: [],
        };

        // Get the set function passed to set() call
        slice.sendToArchive(["1", "2", "3"], "Archiving all");

        const setFn = mockSet.mock.calls[0][0];
        const result = setFn(mockState);

        expect(result.archiveRowData).toHaveLength(3);
        expect(result.archiveRowData[0].status).toBe("Archived");
        expect(result.archiveRowData[0].trackingId).toBe("ARCH-B3");
        expect(result.rowData).toHaveLength(0);
        expect(result.callRowData).toHaveLength(0);
        expect(result.bookingRowData).toHaveLength(0);
    });

    it("sendToReorder should move rows to ordersRowData", () => {
        const mockState = {
            bookingRowData: [{ id: "3", baseId: "B3", status: "Booking" }],
            callRowData: [],
            archiveRowData: [],
            ordersRowData: [],
        };

        slice.sendToReorder(["3"], "Needs reorder");

        const setFn = mockSet.mock.calls[1][0]; // second call to mockSet
        const result = setFn(mockState);

        expect(result.ordersRowData).toHaveLength(1);
        expect(result.ordersRowData[0].status).toBe("Reorder");
        expect(result.ordersRowData[0].trackingId).toBe("ORD-B3");
        expect(result.bookingRowData).toHaveLength(0);
    });
});
