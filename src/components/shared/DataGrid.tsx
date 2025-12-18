"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridReadyEvent, GridApi } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import type { PendingRow } from "@/types";

export interface DataGridProps {
    rowData: PendingRow[];
    columnDefs: ColDef[];
    onSelectionChanged?: (selectedRows: PendingRow[]) => void;
    onGridReady?: (api: GridApi) => void;
    height?: string;
}

export const DataGrid = React.memo(function DataGrid({
    rowData,
    columnDefs,
    onSelectionChanged,
    onGridReady,
    height = "calc(100vh - 280px)",
}: DataGridProps) {
    const gridRef = useRef<AgGridReact>(null);

    const defaultColDef = useMemo<ColDef>(
        () => ({
            sortable: true,
            filter: true,
            resizable: true,
            flex: 1,
            minWidth: 100,
        }),
        []
    );

    const handleGridReady = useCallback(
        (params: GridReadyEvent) => {
            if (onGridReady) {
                onGridReady(params.api);
            }
        },
        [onGridReady]
    );

    const handleSelectionChanged = useCallback(() => {
        if (gridRef.current && onSelectionChanged) {
            const selectedRows = gridRef.current.api.getSelectedRows();
            onSelectionChanged(selectedRows);
        }
    }, [onSelectionChanged]);

    return (
        <div className="ag-theme-alpine-dark w-full h-full" style={{ height: height || "100%", width: "100%" }}>
            <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection="multiple"
                suppressRowClickSelection
                onGridReady={handleGridReady}
                onSelectionChanged={handleSelectionChanged}
                animateRows
                pagination
                paginationPageSize={25}
                paginationPageSizeSelector={[10, 25, 50, 100]}
            />
        </div>
    );
});
