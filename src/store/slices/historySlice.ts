import type { StateCreator } from "zustand";
import { generateId } from "@/lib/utils";
import type { CommitLog } from "@/types";
import type { CombinedStore, HistoryActions, HistoryState } from "../types";
import { restoreService } from "@/services/restoreService";
import { toast } from "sonner";

let commitTimer: NodeJS.Timeout | null = null;

export const createHistorySlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	HistoryState & HistoryActions
> = (set, get) => ({
	commits: [],
	undoStack: [],
	redos: [],
	isRestoring: false,

	setIsRestoring: (val: boolean) => set({ isRestoring: val }),

	addCommit: (actionName) => {
		if (commitTimer) {
			clearTimeout(commitTimer);
			commitTimer = null;
		}

		const state = get();
		const snapshot = {
			rowData: structuredClone(state.rowData),
			ordersRowData: structuredClone(state.ordersRowData),
			bookingRowData: structuredClone(state.bookingRowData),
			callRowData: structuredClone(state.callRowData),
			archiveRowData: structuredClone(state.archiveRowData),
			bookingStatuses: structuredClone(state.bookingStatuses),
		};

		const commit: CommitLog = {
			id: generateId(),
			actionName,
			timestamp: new Date().toISOString(),
			snapshot,
		};

		set((state) => {
			// Filter history to keep only last 48 hours for Audit Log
			const fortyEightHoursAgo = new Date();
			fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

			const filteredCommits = state.commits.filter(
				(c) => new Date(c.timestamp) > fortyEightHoursAgo,
			);

			return {
				commits: [...filteredCommits.slice(-49), commit], // Audit Log (Persistent-ish)
				undoStack: [...state.undoStack, commit], // Session Undo History
				redos: [],
			};
		});
	},

	debouncedCommit: (actionName) => {
		if (commitTimer) clearTimeout(commitTimer);
		commitTimer = setTimeout(() => {
			get().addCommit(actionName);
			commitTimer = null;
		}, 1000);
	},

	restoreToCommit: async (commitId) => {
		const state = get();
		const targetCommit = state.commits.find((c) => c.id === commitId);

		if (targetCommit) {
			try {
				set({ isRestoring: true });

				// 1. Sync to Supabase
				await restoreService.restoreSnapshot(targetCommit.snapshot);

				// 2. Update Local State
				set({
					...targetCommit.snapshot,
					redos: [],
					undoStack: [...state.undoStack, targetCommit],
					isRestoring: false,
				});

				// 3. Record the restoration in history
				get().addCommit(`Restored to: ${targetCommit.actionName}`);

				toast.success(`System restored to: ${targetCommit.actionName}`);
			} catch (error) {
				console.error("Restoration failed:", error);
				set({ isRestoring: false });
				toast.error("Restoration failed. Please check your connection.");
			}
		}
	},

	undo: () => {
		const state = get();
		if (state.undoStack.length === 0) return;

		// Current state to be pushed to redo stack
		const currentSnapshot = {
			rowData: structuredClone(state.rowData),
			ordersRowData: structuredClone(state.ordersRowData),
			bookingRowData: structuredClone(state.bookingRowData),
			callRowData: structuredClone(state.callRowData),
			archiveRowData: structuredClone(state.archiveRowData),
			bookingStatuses: structuredClone(state.bookingStatuses),
		};

		const lastCommit = state.undoStack[state.undoStack.length - 1];

		set({
			...lastCommit.snapshot,
			undoStack: state.undoStack.slice(0, -1), // Remove from Session Stack
			redos: [
				...state.redos,
				{
					id: generateId(),
					actionName: "Redo",
					timestamp: new Date().toISOString(),
					snapshot: currentSnapshot,
				},
			],
			// NOTE: We do NOT touch state.commits (Audit Log)
		});
	},

	redo: () => {
		const state = get();
		if (state.redos.length === 0) return;

		const currentSnapshot = {
			rowData: structuredClone(state.rowData),
			ordersRowData: structuredClone(state.ordersRowData),
			bookingRowData: structuredClone(state.bookingRowData),
			callRowData: structuredClone(state.callRowData),
			archiveRowData: structuredClone(state.archiveRowData),
			bookingStatuses: structuredClone(state.bookingStatuses),
		};

		const lastRedo = state.redos[state.redos.length - 1];

		set({
			...lastRedo.snapshot,
			redos: state.redos.slice(0, -1),
			undoStack: [
				...state.undoStack,
				{
					id: generateId(),
					actionName: "Undo",
					timestamp: new Date().toISOString(),
					snapshot: currentSnapshot,
				},
			],
		});
	},

	clearHistory: () => {
		set({ commits: [], undoStack: [], redos: [] });
	},

	commitSave: () => {
		// Ctrl+S functionality: Checkpoint/Save
		get().addCommit("Manual Checkpoint (Saved)");
		set({
			undoStack: [], // Clear session undo history
			redos: [], // Clear redo history
		});
	},
});
