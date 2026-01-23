import { describe, expect, it, vi, beforeEach } from "vitest";
import { create } from "zustand";
import { createHistorySlice } from "../store/slices/historySlice";
import type { CombinedStore } from "../store/types";
import { restoreService } from "@/services/restoreService";

// Mock dependencies
vi.mock("@/services/restoreService", () => ({
    restoreService: {
        restoreSnapshot: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("historySlice", () => {
    const createTestStore = () => {
        return create<CombinedStore>(
            (...a) =>
                ({
                    ...createHistorySlice(a[0], a[1], a[2] as any),
                    // Mock row data
                    rowData: [],
                    ordersRowData: [],
                    bookingRowData: [],
                    callRowData: [],
                    archiveRowData: [],
                    bookingStatuses: [],
                }) as any,
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should initialize with empty history", () => {
        const store = createTestStore();
        expect(store.getState().commits).toEqual([]);
        expect(store.getState().isRestoring).toBe(false);
    });

    it("should add a commit with current state snapshot", () => {
        const store = createTestStore();
        const mockRow = { id: "1", customerName: "Test" } as any;

        // Update store with some data
        store.setState({ rowData: [mockRow] });

        store.getState().addCommit("Test Action");

        const commits = store.getState().commits;
        expect(commits).toHaveLength(1);
        expect(commits[0].actionName).toBe("Test Action");
        expect(commits[0].snapshot.rowData).toEqual([mockRow]);
    });

    it("should filter commits older than 48 hours", () => {
        const store = createTestStore();

        // Add an old commit
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 50);

        store.setState({
            commits: [
                {
                    id: "old",
                    actionName: "Old",
                    timestamp: oldDate.toISOString(),
                    snapshot: {} as any,
                },
            ],
        });

        // Add new commit trigger filtering
        store.getState().addCommit("New Action");

        const commits = store.getState().commits;
        expect(commits).toHaveLength(1);
        expect(commits[0].actionName).toBe("New Action");
    });

    it("should restore to a specific commit and sync with database", async () => {
        const store = createTestStore();
        const snapshotData = { rowData: [{ id: "restored" } as any] };

        store.setState({
            commits: [
                {
                    id: "commit-1",
                    actionName: "Save Point",
                    timestamp: new Date().toISOString(),
                    snapshot: snapshotData as any,
                },
            ],
        });

        await store.getState().restoreToCommit("commit-1");

        expect(restoreService.restoreSnapshot).toHaveBeenCalledWith(snapshotData);
        expect(store.getState().rowData).toEqual(snapshotData.rowData);
        expect(store.getState().isRestoring).toBe(false);
    });

    it("should handle restoration errors gracefully", async () => {
        const store = createTestStore();
        vi.mocked(restoreService.restoreSnapshot).mockRejectedValueOnce(new Error("Network Error"));

        store.setState({
            commits: [
                {
                    id: "commit-1",
                    actionName: "Save Point",
                    timestamp: new Date().toISOString(),
                    snapshot: {} as any,
                },
            ],
        });

        await store.getState().restoreToCommit("commit-1");

        expect(store.getState().isRestoring).toBe(false);
        // Local state should NOT have changed if we wanted strict parity, 
        // but currently it remains same as before attempt if error caught early.
    });
});
