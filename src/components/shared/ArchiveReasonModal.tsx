"use client";

import { Archive, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ArchiveReasonModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (reason: string) => void;
}

export const ArchiveReasonModal = ({
    open,
    onOpenChange,
    onSave,
}: ArchiveReasonModalProps) => {
    const [reason, setReason] = useState("");
    const maxChars = 200;

    useEffect(() => {
        if (open) {
            setReason("");
        }
    }, [open]);

    const handleSave = () => {
        if (!reason.trim()) return;
        onSave(reason);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-md p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-white/5 space-y-0 relative bg-red-500/5">
                    <div className="flex-1 flex justify-start">
                        <div className="bg-red-500/10 p-2 rounded-full">
                            <Archive className="h-4 w-4 text-red-500" />
                        </div>
                    </div>
                    <DialogTitle className="text-lg font-medium text-red-400">Archive Record</DialogTitle>
                    <div className="flex-1" />
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Reason for Archiving
                        </label>
                        <div className="relative">
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Please enter a reason for archiving this record..."
                                className="min-h-[120px] bg-[#2c2c2e] border-white/10 text-gray-200 resize-none focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:ring-offset-0 placeholder:text-gray-600"
                                maxLength={maxChars}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                                {reason.length}/{maxChars}
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-500 italic">
                            * Archiving will move this record to the archive history.
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 gap-3 sm:gap-0 sm:justify-between grid grid-cols-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 w-full"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!reason.trim()}
                        className="bg-red-500 hover:bg-red-600 text-white font-medium w-full disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
                    >
                        Confirm Archive
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
