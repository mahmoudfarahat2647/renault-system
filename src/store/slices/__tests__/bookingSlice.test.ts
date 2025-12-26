import { describe, it, expect, vi } from "vitest";
import { createBookingSlice } from "../bookingSlice";

describe("bookingSlice", () => {
    const mockSet = vi.fn();
    const mockGet = vi.fn(() => ({
        addCommit: vi.fn(),
        debouncedCommit: vi.fn(),
    })) as any;

    const slice = createBookingSlice(mockSet, mockGet, {} as any);

    it("should initialize with default booking statuses", () => {
        expect(slice.bookingRowData).toEqual([]);
        expect(slice.bookingStatuses).toHaveLength(3);
        expect(slice.bookingStatuses[0].label).toBe("Add");
    });

    it("sendToBooking should move rows to bookingRowData", () => {
        const mockState = {
            rowData: [{ id: "1", baseId: "B1", status: "Pending" }],
            ordersRowData: [{ id: "2", baseId: "B2", status: "Order" }],
            callRowData: [{ id: "3", baseId: "B3", status: "Call" }],
            bookingRowData: [],
        };

        slice.sendToBooking(["1", "2"], "2024-12-25", "Christmas booking", "add");

        const setFn = mockSet.mock.calls[0][0];
        const result = setFn(mockState);

        expect(result.bookingRowData).toHaveLength(2);
        expect(result.bookingRowData[0].status).toBe("Booked");
        expect(result.bookingRowData[0].bookingDate).toBe("2024-12-25");
        expect(result.rowData).toHaveLength(0);
        expect(result.ordersRowData).toHaveLength(0);
        expect(result.callRowData).toHaveLength(1);
    });

    it("addBookingStatusDef should add a new status", () => {
        const mockState = {
            bookingStatuses: [],
        };

        slice.addBookingStatusDef({ id: "test", label: "Test", color: "blue" });

        const setFn = mockSet.mock.calls[1][0];
        const result = setFn(mockState);

        expect(result.bookingStatuses).toHaveLength(1);
        expect(result.bookingStatuses[0].id).toBe("test");
    });
});
