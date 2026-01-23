"use client";

import { useCallback } from "react";
import { useAppStore } from "@/store/useStore";
import { toast } from "sonner";

/**
 * Hook to track and manage column layout changes for a specific grid.
 */
export function useColumnLayoutTracker(gridKey: string) {
    const isDirty = useAppStore((state) => state.dirtyLayouts[gridKey] || false);
    const setLayoutDirty = useAppStore((state) => state.setLayoutDirty);
    const clearGridState = useAppStore((state) => state.clearGridState);

    const markDirty = useCallback(() => {
        if (!isDirty) {
            setLayoutDirty(gridKey, true);
        }
    }, [gridKey, isDirty, setLayoutDirty]);

    const saveLayout = useCallback(() => {
        setLayoutDirty(gridKey, false);
        toast.success("Grid layout saved successfully");
    }, [gridKey, setLayoutDirty]);

    const resetLayout = useCallback(() => {
        clearGridState(gridKey);
        setLayoutDirty(gridKey, false);
        toast.info("Grid layout reset to default. Please refresh or navigate back to see changes.");
        // Note: Since gridStateKey is used as initialState, clearing it requires a re-mount or manual API call.
        // For the best UX, we'll let the user know they might need to refresh if the grid doesn't auto-update.
        window.location.reload();
    }, [gridKey, clearGridState, setLayoutDirty]);

    return {
        isDirty,
        markDirty,
        saveLayout,
        resetLayout,
    };
}
