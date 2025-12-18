"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoLabel } from "@/components/shared/InfoLabel";
import type { PendingRow } from "@/types";
import { Archive, Trash2, Filter, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function ArchivePage() {
    const { archiveRowData, deleteOrders } = useAppStore();
    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);

    // Add BOOKING column and ACTION column to base columns
    const columns = useMemo(() => {
        const baseColumns = getBaseColumns();
        return [
            ...baseColumns.slice(0, 3),
            {
                headerName: "BOOKING",
                field: "bookingDate",
                width: 120,
            },
            ...baseColumns.slice(3),
        ];
    }, []);

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
    };

    const handleDelete = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        deleteOrders(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) permanently deleted`);
    };

    return (
        <div className="space-y-4">
            {/* Info Label Component */}
            <InfoLabel data={selectedRows[0] || null} />

            {/* Header Card */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Archive className="h-5 w-5" />
                                Archive
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Historical records
                            </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {archiveRowData.length} archived items
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={selectedRows.length === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-500"
                            disabled={selectedRows.length === 0}
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reorder
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Extract
                        </Button>
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-1" />
                            Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Data Grid */}
            <Card>
                <CardContent className="p-0">
                    <DataGrid
                        rowData={archiveRowData}
                        columnDefs={columns}
                        onSelectionChanged={handleSelectionChanged}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
