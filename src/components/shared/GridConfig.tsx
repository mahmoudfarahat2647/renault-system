"use client";

import React from "react";
import { getVinColor } from "@/lib/utils";
import type { PendingRow, PartStatusDef } from "@/types";
import { Paperclip, StickyNote, History } from "lucide-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";

// VIN Cell Renderer - applies unique background color based on VIN
export const VinCellRenderer = (params: ICellRendererParams<PendingRow>) => {
    const vin = params.value as string;
    if (!vin) return null;

    return (
        <div
            className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
            style={{ backgroundColor: getVinColor(vin), color: "#000" }}
        >
            {vin}
        </div>
    );
};

// Action Cell Renderer - shows icons for attachment, note, history
export const ActionCellRenderer = (params: ICellRendererParams<PendingRow>) => {
    const data = params.data;
    if (!data) return null;

    return (
        <div className="flex items-center gap-3 h-full px-2">
            <button
                className={`transition-colors ${data.hasAttachment ? "text-renault-yellow" : "text-gray-600 hover:text-gray-400"}`}
                title="Attachment"
            >
                <Paperclip className="h-3.5 w-3.5" />
            </button>
            <button
                className={`transition-colors ${data.noteContent ? "text-renault-yellow" : "text-gray-600 hover:text-gray-400"}`}
                title="Note"
            >
                <StickyNote className="h-3.5 w-3.5" />
            </button>
            <button
                className={`transition-colors text-gray-600 hover:text-gray-400`}
                title="History"
            >
                <History className="h-3.5 w-3.5" />
            </button>
        </div>
    );
};

// Part Status Renderer - shows colored bullet based on status
interface PartStatusRendererProps extends ICellRendererParams<PendingRow> {
    partStatuses?: PartStatusDef[];
}

export const PartStatusRenderer = (params: PartStatusRendererProps) => {
    const value = params.value as string;
    const statuses = params.partStatuses || [];
    const statusDef = statuses.find((s) => s.label === value);

    if (!value) return null;

    return (
        <div className="flex items-center gap-2">
            <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: statusDef?.color || "#888" }}
            />
            <span className="text-xs">{value}</span>
        </div>
    );
};

// Warranty Info Renderer - shows remaining time with color coding
export const WarrantyRenderer = (params: ICellRendererParams<PendingRow>) => {
    const data = params.data;
    if (!data) return null;

    const isExpired = data.remainTime === "Expired" || data.remainTime === "";

    return (
        <div
            className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-gray-300"}`}
            title={`Start: ${data.startWarranty}\nEnd: ${data.endWarranty}`}
        >
            {data.remainTime || "N/A"}
        </div>
    );
};

// Status Badge Renderer - Minimalist text
export const StatusRenderer = (params: ICellRendererParams<PendingRow>) => {
    const value = params.value as string;
    // Just simple text for the flat look, or minimal coloring if preferred
    return (
        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
            {value}
        </span>
    );
};

// Common column definitions
export const getBaseColumns = (): ColDef<PendingRow>[] => [
    {
        headerName: "",
        field: "id",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
        maxWidth: 50,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: "left",
        suppressMenu: true,
        valueFormatter: () => "", // Hide the ID number
        cellClass: "flex items-center justify-center",
    },
    {
        headerName: "ACTIONS",
        field: "id",
        cellRenderer: ActionCellRenderer,
        width: 100,
        maxWidth: 100,
        sortable: false,
        filter: false,
        suppressMenu: true,
    },
    {
        headerName: "STATS",
        field: "status",
        cellRenderer: StatusRenderer,
        width: 80,
    },
    {
        headerName: "R/DATE",
        field: "rDate",
        width: 100,
    },
    {
        headerName: "CUSTOMER NAME",
        field: "customerName",
        filter: "agTextColumnFilter",
        minWidth: 140,
    },
    {
        headerName: "VIN NO/",
        field: "vin",
        cellRenderer: VinCellRenderer,
        filter: "agTextColumnFilter",
        minWidth: 160,
    },
    {
        headerName: "MOBILE",
        field: "mobile",
        width: 110,
    },
    {
        headerName: "CNTR RDG", // Changed from CNT.
        field: "cntrRdg",
        width: 90,
    },
    {
        headerName: "MODEL",
        field: "model",
        width: 100,
    },
    {
        headerName: "PART NUMBER",
        field: "partNumber",
        filter: "agTextColumnFilter",
        minWidth: 120,
    },
    {
        headerName: "DESCRIPTION",
        field: "description",
        filter: "agTextColumnFilter",
        minWidth: 180,
    },
    {
        headerName: "نظام اصلاح",
        field: "repairSystem",
        width: 100,
    },
    {
        headerName: "مدة ضمان", // Or "WARRANTY REMAIN" based on image? Keeping Arabic as it matches some image texts usually.
        field: "remainTime",
        cellRenderer: WarrantyRenderer,
        width: 100,
    },
    {
        headerName: "ACTION NO.",
        field: "actionNote",
        width: 100,
    },
];

export const getOrdersColumns = (): ColDef<PendingRow>[] => [
    ...getBaseColumns(),
    {
        headerName: "REQUESTER",
        field: "requester",
        width: 120,
    },
];

export const getMainSheetColumns = (): ColDef<PendingRow>[] => [
    ...getBaseColumns(),
    {
        headerName: "PART STATUS",
        field: "partStatus",
        cellRenderer: PartStatusRenderer,
        width: 120,
    },
];

export const getBookingColumns = (): ColDef<PendingRow>[] => [
    ...getBaseColumns(),
    {
        headerName: "BOOKING DATE",
        field: "bookingDate",
        width: 130,
        cellStyle: { color: "#22c55e", fontWeight: 500 },
    },
    {
        headerName: "BOOKING NOTE",
        field: "bookingNote",
        width: 150,
    },
];
