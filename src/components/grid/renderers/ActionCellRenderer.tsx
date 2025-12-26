import { Bell, History, Paperclip, StickyNote } from "lucide-react";
import type { ICellRendererParams } from "ag-grid-community";
import type { PendingRow } from "@/types";

export const ActionCellRenderer = (params: ICellRendererParams<PendingRow>) => {
    const data = params.data;
    if (!data) return null;

    return (
        <div className="flex items-center gap-3 h-full px-2">
            <button
                className={`transition-colors ${data.hasAttachment ? "text-indigo-400" : "text-gray-600 hover:text-gray-400"}`}
                title="Attachment"
                onClick={() => {
                    if (params.colDef?.cellRendererParams?.onAttachClick) {
                        params.colDef.cellRendererParams.onAttachClick(data);
                    }
                }}
            >
                <Paperclip className="h-3.5 w-3.5" />
            </button>
            <button
                className={`transition-colors ${data.actionNote ? "text-renault-yellow" : "text-gray-600 hover:text-gray-400"}`}
                title="Note"
                onClick={() => {
                    if (params.colDef?.cellRendererParams?.onNoteClick) {
                        params.colDef.cellRendererParams.onNoteClick(data);
                    }
                }}
            >
                <StickyNote className="h-3.5 w-3.5" />
            </button>
            <button
                className={`transition-colors ${data.reminder ? "text-renault-yellow" : "text-gray-600 hover:text-gray-400"}`}
                title="Reminder"
                onClick={() => {
                    if (params.colDef?.cellRendererParams?.onReminderClick) {
                        params.colDef.cellRendererParams.onReminderClick(data);
                    }
                }}
            >
                <Bell className="h-3.5 w-3.5" />
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
