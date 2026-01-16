"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useStore";

interface OrderRadarResult {
    isDuplicate: boolean;
    location: string | null;
    existingDescription: string | null;
}

/**
 * High-performance hook to scan all system lists for duplicates.
 * Scans Orders, Main Sheet, Call List, Booking, and Archive.
 */
export function useOrderRadar(vin: string, partNumber: string): OrderRadarResult {
    const rowData = useAppStore((state) => state.rowData);
    const ordersRowData = useAppStore((state) => state.ordersRowData);
    const callRowData = useAppStore((state) => state.callRowData);
    const bookingRowData = useAppStore((state) => state.bookingRowData);
    const archiveRowData = useAppStore((state) => state.archiveRowData);

    return useMemo(() => {
        if (!vin || !partNumber) {
            return { isDuplicate: false, location: null, existingDescription: null };
        }

        const upperVin = vin.toUpperCase();
        const upperPart = partNumber.toUpperCase();

        // Check each list for duplicates
        const lists: { name: string; rows: any[] }[] = [
            { name: "Main Sheet", rows: rowData },
            { name: "Orders", rows: ordersRowData },
            { name: "Call List", rows: callRowData },
            { name: "Booking", rows: bookingRowData },
            { name: "Archive", rows: archiveRowData },
        ];

        for (const list of lists) {
            const match = list.rows.find(
                (r) =>
                    r.vin?.toUpperCase() === upperVin &&
                    r.partNumber?.toUpperCase() === upperPart,
            );
            if (match) {
                return {
                    isDuplicate: true,
                    location: list.name,
                    existingDescription: match.description,
                };
            }
        }

        // Also check for description mismatches (if part number exists anywhere but with different description)
        for (const list of lists) {
            const match = list.rows.find(
                (r) => r.partNumber?.toUpperCase() === upperPart,
            );
            if (match && match.description) {
                return {
                    isDuplicate: false,
                    location: null,
                    existingDescription: match.description,
                };
            }
        }

        return { isDuplicate: false, location: null, existingDescription: null };
    }, [
        vin,
        partNumber,
        rowData,
        ordersRowData,
        callRowData,
        bookingRowData,
        archiveRowData,
    ]);
}
