"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBookingColumns } from "@/components/shared/GridConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoLabel } from "@/components/shared/InfoLabel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PendingRow } from "@/types";
import { Calendar, Archive, RotateCcw, Filter, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function BookingPage() {
    const { bookingRowData, sendToArchive, sendToReorder, deleteOrders } =
        useAppStore();
    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [reorderReason, setReorderReason] = useState("");

    const columns = useMemo(() => getBookingColumns(), []);

    // Count unique VINs
    const uniqueVins = new Set(bookingRowData.map((r) => r.vin)).size;

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
    };

    const handleArchive = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        sendToArchive(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) archived`);
    };

    const handleOpenReorderModal = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        setIsReorderModalOpen(true);
    };

    const handleConfirmReorder = () => {
        if (!reorderReason.trim()) {
            toast.error("Please provide a reason for reorder");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        sendToReorder(ids, reorderReason);
        setSelectedRows([]);
        setIsReorderModalOpen(false);
        setReorderReason("");
        toast.success(`${ids.length} row(s) sent back to Orders (Reorder)`);
    };

    const handleDelete = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        deleteOrders(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) deleted`);
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
                                <Calendar className="h-5 w-5" />
                                Service Appointments
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Scheduled maintenance
                            </p>
                        </div>
                        <div className="text-sm">
                            <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded">
                                Unique Bookings
                            </span>
                            <span className="ml-2 text-renault-yellow font-semibold">
                                {uniqueVins} Unique ({bookingRowData.length} Lines)
                            </span>
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
                            onClick={handleArchive}
                            disabled={selectedRows.length === 0}
                        >
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-500"
                            onClick={handleOpenReorderModal}
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
                        rowData={bookingRowData}
                        columnDefs={columns}
                        onSelectionChanged={handleSelectionChanged}
                    />
                </CardContent>
            </Card>

            {/* Reorder Modal */}
            <Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-orange-500">
                            Reorder - Reason Required
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Reason for Reorder</Label>
                            <Input
                                value={reorderReason}
                                onChange={(e) => setReorderReason(e.target.value)}
                                placeholder="e.g., Wrong part, Customer cancelled"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            This will send the selected items back to the Orders view.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsReorderModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="renault"
                            onClick={handleConfirmReorder}
                            disabled={!reorderReason.trim()}
                        >
                            Confirm Reorder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
