"use client";

import { Archive, Download, Filter, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { RowModals } from "@/components/shared/RowModals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRowModals } from "@/hooks/useRowModals";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function ArchivePage() {
	const { archiveRowData, sendToReorder, deleteOrders, updateOrder } =
		useAppStore();
	const [gridApi, setGridApi] = useState<any>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [reorderReason, setReorderReason] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const {
		activeModal,
		currentRow,
		handleNoteClick,
		handleReminderClick,
		handleAttachClick,
		closeModal,
		saveNote,
		saveReminder,
		saveAttachment,
	} = useRowModals(updateOrder);

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

	const columns = useMemo(() => {
		const baseColumns = getBaseColumns(
			handleNoteClick,
			handleReminderClick,
			handleAttachClick,
		);
		return [
			...baseColumns.slice(0, 3),
			{ headerName: "BOOKING", field: "bookingDate", width: 120 },
			...baseColumns.slice(3),
		];
	}, [handleNoteClick, handleReminderClick, handleAttachClick]);

	return (
		<div className="space-y-4">
			<InfoLabel data={selectedRows[0] || null} />

			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Archive className="h-5 w-5" /> Archive
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
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setShowDeleteConfirm(true)}
							disabled={selectedRows.length === 0}
						>
							<Trash2 className="h-4 w-4 mr-1" /> Delete
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="text-orange-500"
							onClick={() => setIsReorderModalOpen(true)}
							disabled={selectedRows.length === 0}
						>
							<RotateCcw className="h-4 w-4 mr-1" /> Reorder
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => gridApi?.exportDataAsCsv()}
						>
							<Download className="h-4 w-4 mr-1" /> Extract
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowFilters(!showFilters)}
						>
							<Filter className="h-4 w-4 mr-1" /> Filter
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					<DataGrid
						rowData={archiveRowData}
						columnDefs={columns}
						onSelectionChanged={setSelectedRows}
						onGridReady={(api) => setGridApi(api)}
						showFloatingFilters={showFilters}
					/>
				</CardContent>
			</Card>

			<RowModals
				activeModal={activeModal}
				currentRow={currentRow}
				onClose={closeModal}
				onSaveNote={saveNote}
				onSaveReminder={saveReminder}
				onSaveAttachment={saveAttachment}
			/>

			{/* Reorder Reason Modal */}
			<Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reorder - Reason Required</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="reason" className="text-right">
								Reason
							</Label>
							<Input
								id="reason"
								value={reorderReason}
								onChange={(e) => setReorderReason(e.target.value)}
								className="col-span-3"
								placeholder="e.g., Customer called back, error in archive"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsReorderModalOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleConfirmReorder}>Confirm Reorder</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={() => {
					deleteOrders(selectedRows.map((r) => r.id));
					setSelectedRows([]);
					toast.success("Archived record(s) deleted");
				}}
				title="Delete Archived Records"
				description={`Are you sure you want to permanently delete ${selectedRows.length} selected record(s)?`}
				confirmText="Permanently Delete"
			/>
		</div>
	);
}
