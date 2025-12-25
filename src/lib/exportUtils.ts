import type { PendingRow } from "@/types";

/**
 * Exports selected orders to a CSV format optimized for logistics.
 * Columns: Name, VIN, Model, Part Number, Description
 */
export const exportToLogisticsCSV = (selected: PendingRow[]) => {
    if (selected.length === 0) return;

    // Define CSV headers
    const headers = ["Customer Name", "VIN", "Model", "Part Number", "Description"];

    // Map data to rows
    const rows = selected.map(row => [
        `"${(row.customerName || "").replace(/"/g, '""')}"`,
        `"${(row.vin || "").replace(/"/g, '""')}"`,
        `"${(row.model || "").replace(/"/g, '""')}"`,
        `"${(row.partNumber || "").replace(/"/g, '""')}"`,
        `"${(row.description || "").replace(/"/g, '""')}"`
    ]);

    // Create CSV content with UTF-8 BOM for Excel Arabic support
    const csvContent = "\uFEFF" + [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];

    link.setAttribute("href", url);
    link.setAttribute("download", `logistics_export_${timestamp}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
