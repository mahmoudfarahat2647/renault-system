"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getMainSheetColumns } from "@/components/shared/GridConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoLabel } from "@/components/shared/InfoLabel";
import type { PendingRow } from "@/types";
import {
    FileSpreadsheet,
    Phone,
    Filter,
    Download,
    Lock,
    Unlock,
    Tag,
    Send,
    Printer,
    Calendar,
    Folder,
    Trash2,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function MainSheetPage() {
    const { rowData, sendToCallList, partStatuses, updatePartStatus } = useAppStore();
    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
    const [isLocked, setIsLocked] = useState(false);

    const columns = useMemo(() => getMainSheetColumns(), []);

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
    };

    const handleSendToCallList = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        sendToCallList(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) sent to Call List`);
    };

    const handleUpdatePartStatus = (status: string) => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        selectedRows.forEach((row) => {
            updatePartStatus(row.id, status);
        });
        toast.success(`Part status updated to "${status}"`);
    };

    const handleDelete = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        // Placeholder for delete logic if not yet implemented in store for Main Sheet
        toast.info("Delete functionality for Main Sheet to be implemented");
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Info Label Component */}
                <InfoLabel data={selectedRows[0] || null} />

                {/* Header Card - Header Removed for Compact Layout */}
                <Card className="border-none bg-transparent shadow-none">
                    <CardContent className="p-0">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between bg-[#141416] p-2 rounded-xl border border-white/5">
                            {/* Left Group */}
                            <div className="flex items-center gap-2">
                                {/* Part Statuses mixed in or first? Keeping first as primary action */}
                                {partStatuses.map((status) => (
                                    <Tooltip key={status.id}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUpdatePartStatus(status.label)}
                                                disabled={isLocked || selectedRows.length === 0}
                                                className="hover:bg-white/5"
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: status.color }}
                                                />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Set status: {status.label}</TooltipContent>
                                    </Tooltip>
                                ))}

                                <div className="w-px h-6 bg-white/10 mx-1" />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-lg">
                                            <Tag className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reserve</TooltipContent>
                                </Tooltip>

                                <div className="w-px h-6 bg-white/10 mx-1" />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Share</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Print</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-green-500/80 hover:text-green-500 hover:bg-green-500/10">
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Booking</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleSendToCallList}
                                            disabled={isLocked || selectedRows.length === 0}
                                            className="text-orange-500/80 hover:text-orange-500 hover:bg-orange-500/10"
                                        >
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Send to Call List</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Extract</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                                            <Folder className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Set Path</TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Right Group: Actions */}
                            <div className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                            onClick={handleDelete}
                                            disabled={selectedRows.length === 0}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={`${isLocked ? "text-red-400" : "text-gray-400"} hover:text-white hover:bg-white/5`}
                                            onClick={() => setIsLocked(!isLocked)}
                                        >
                                            {isLocked ? (
                                                <Lock className="h-4 w-4" />
                                            ) : (
                                                <Unlock className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isLocked ? "Unlock Sheet" : "Lock Sheet"}</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Grid */}
                <Card>
                    <CardContent className="p-0">
                        <DataGrid
                            rowData={rowData}
                            columnDefs={columns}
                            onSelectionChanged={handleSelectionChanged}
                        />
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}
