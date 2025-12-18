"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getOrdersColumns } from "@/components/shared/GridConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PendingRow } from "@/types";
import { generateId, getCalculatorValues } from "@/lib/utils";
import {
    Plus,
    Printer,
    Send,
    Phone,
    FileSpreadsheet,
    Filter,
    Download,
    Tag,
    Calendar,
    Folder,
    Trash2,
    CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export default function OrdersPage() {
    const { ordersRowData, addOrders, commitToMainSheet, deleteOrders } = useAppStore();
    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        customerName: "",
        vin: "",
        mobile: "",
        cntrRdg: "",
        model: "",
        partNumber: "",
        description: "",
        repairSystem: "Mechanical",
        startWarranty: new Date().toISOString().split("T")[0],
        requester: "",
    });

    const columns = useMemo(() => getOrdersColumns(), []);

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
    };

    const selectedOrder = selectedRows.length > 0 ? selectedRows[0] : null;

    const handleCreateOrder = () => {
        const warrantyCalc = getCalculatorValues(formData.startWarranty);
        const baseId = Date.now().toString().slice(-6);

        const newOrder: PendingRow = {
            id: generateId(),
            baseId,
            trackingId: `ORD-${baseId}`,
            customerName: formData.customerName,
            vin: formData.vin,
            mobile: formData.mobile,
            cntrRdg: parseInt(formData.cntrRdg) || 0,
            model: formData.model,
            partNumber: formData.partNumber,
            description: formData.description,
            repairSystem: formData.repairSystem,
            startWarranty: formData.startWarranty,
            endWarranty: warrantyCalc.endDate,
            remainTime: warrantyCalc.remainTime,
            status: "Ordered",
            rDate: new Date().toISOString().split("T")[0],
            requester: formData.requester,
        };

        addOrders([newOrder]);
        setIsCreateModalOpen(false);
        toast.success("Order created successfully");

        // Reset form
        setFormData({
            customerName: "",
            vin: "",
            mobile: "",
            cntrRdg: "",
            model: "",
            partNumber: "",
            description: "",
            repairSystem: "Mechanical",
            startWarranty: new Date().toISOString().split("T")[0],
            requester: "",
        });
    };

    const handleCommitToMainSheet = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one order");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        commitToMainSheet(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} order(s) committed to Main Sheet`);
    };

    const handleDelete = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one order");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        deleteOrders(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} order(s) deleted`);
    };

    return (
        <TooltipProvider>
            <div className="space-y-6 h-full flex flex-col">


                {/* Info Label Component */}
                <InfoLabel data={selectedOrder} />

                <Card className="flex-1 flex flex-col border-none bg-transparent shadow-none">
                    <CardContent className="p-0 flex-1 flex flex-col space-y-4">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between bg-[#141416] p-1.5 rounded-lg border border-white/5">
                            {/* Left Group */}
                            <div className="flex items-center gap-1.5">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="bg-renault-yellow hover:bg-renault-yellow/90 text-black border-none rounded-md h-8 w-8"
                                            size="icon"
                                            onClick={() => setIsCreateModalOpen(true)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Create Order</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-md h-8 w-8">
                                            <Tag className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reserve</TooltipContent>
                                </Tooltip>

                                <div className="w-px h-5 bg-white/10 mx-1" />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8">
                                            <Send className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Share to Logistics</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8">
                                            <Printer className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Print Order</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-green-500/80 hover:text-green-500 hover:bg-green-500/10 h-8 w-8">
                                            <Calendar className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Booking</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-orange-500/80 hover:text-orange-500 hover:bg-orange-500/10 h-8 w-8">
                                            <Phone className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Send to Call List</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8">
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Extract</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8">
                                            <Filter className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 w-8">
                                            <Folder className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Set Path</TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Right Group */}
                            <div className="flex items-center gap-1.5">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                                            onClick={handleDelete}
                                            disabled={selectedRows.length === 0}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="bg-green-600 hover:bg-green-500 text-white border-none rounded-md h-8 w-8"
                                            size="icon"
                                            onClick={handleCommitToMainSheet}
                                            disabled={selectedRows.length === 0}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Commit to Main Sheet</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Data Grid with Error Boundary and Dynamic Height */}
                        <div className="flex-1 min-h-[500px] border border-white/10 rounded-xl overflow-hidden">
                            <DataGrid
                                rowData={ordersRowData}
                                columnDefs={columns}
                                onSelectionChanged={handleSelectionChanged}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Create Order Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="bg-gradient-to-r from-indigo-500 to-blue-500 -m-6 mb-4 p-6 text-white rounded-t-lg">
                                Create New Order
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Customer Name</Label>
                                <Input
                                    value={formData.customerName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, customerName: e.target.value })
                                    }
                                    placeholder="Enter customer name"
                                />
                            </div>
                            <div>
                                <Label>VIN Number</Label>
                                <Input
                                    value={formData.vin}
                                    onChange={(e) =>
                                        setFormData({ ...formData, vin: e.target.value })
                                    }
                                    placeholder="Enter VIN"
                                />
                            </div>
                            <div>
                                <Label>Mobile</Label>
                                <Input
                                    value={formData.mobile}
                                    onChange={(e) =>
                                        setFormData({ ...formData, mobile: e.target.value })
                                    }
                                    placeholder="Enter mobile number"
                                />
                            </div>
                            <div>
                                <Label>Odometer (km)</Label>
                                <Input
                                    type="number"
                                    value={formData.cntrRdg}
                                    onChange={(e) =>
                                        setFormData({ ...formData, cntrRdg: e.target.value })
                                    }
                                    placeholder="Enter reading"
                                />
                            </div>
                            <div>
                                <Label>Model</Label>
                                <Input
                                    value={formData.model}
                                    onChange={(e) =>
                                        setFormData({ ...formData, model: e.target.value })
                                    }
                                    placeholder="e.g., Megane IV"
                                />
                            </div>
                            <div>
                                <Label>Part Number</Label>
                                <Input
                                    value={formData.partNumber}
                                    onChange={(e) =>
                                        setFormData({ ...formData, partNumber: e.target.value })
                                    }
                                    placeholder="Enter part number"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Description</Label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Enter part description"
                                />
                            </div>
                            <div>
                                <Label>Repair System</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.repairSystem}
                                    onChange={(e) =>
                                        setFormData({ ...formData, repairSystem: e.target.value })
                                    }
                                >
                                    <option value="Mechanical">Mechanical</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Body">Body</option>
                                    <option value="ضمان">ضمان (Warranty)</option>
                                </select>
                            </div>
                            <div>
                                <Label>Warranty Start Date</Label>
                                <Input
                                    type="date"
                                    value={formData.startWarranty}
                                    onChange={(e) =>
                                        setFormData({ ...formData, startWarranty: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Requester</Label>
                                <Input
                                    value={formData.requester}
                                    onChange={(e) =>
                                        setFormData({ ...formData, requester: e.target.value })
                                    }
                                    placeholder="Branch/Person name"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="renault" onClick={handleCreateOrder}>
                                Create Order
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
