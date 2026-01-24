import { ChevronRight, MessageSquare, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BookingStatus, PendingRow } from "@/types";

interface BookingSidebarHeaderProps {
	selectedRows: PendingRow[];
	preBookingStatus: string;
	setPreBookingStatus: (status: string) => void;
	bookingStatuses: BookingStatus[];
	bookingNote: string;
	setBookingNote: (note: string) => void;
	onClose: () => void;
}

export const BookingSidebarHeader = ({
	selectedRows,
	preBookingStatus,
	setPreBookingStatus,
	bookingStatuses,
	bookingNote,
	setBookingNote,
	onClose,
}: BookingSidebarHeaderProps) => {
	if (selectedRows.length === 0)
		return (
			<button
				type="button"
				onClick={onClose}
				className="absolute right-4 top-4 z-50 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
			>
				<X className="h-4 w-4" />
			</button>
		);

	return (
		<div className="p-6 border-b border-indigo-500/10 bg-indigo-500/[0.02] space-y-4">
			<button
				type="button"
				onClick={onClose}
				className="absolute right-4 top-4 z-50 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
			>
				<X className="h-4 w-4" />
			</button>
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
						New Booking
					</div>
					<h3 className="text-xs font-medium text-gray-400">
						{selectedRows.length} Items • {selectedRows[0]?.customerName}
					</h3>
				</div>
				<Popover>
					<PopoverTrigger asChild>
						<button
							type="button"
							className={cn(
								"h-6 px-2 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors flex items-center gap-1.5",
								preBookingStatus
									? "bg-white/10 border-white/20 text-white"
									: "bg-transparent border-dashed border-gray-700 text-gray-600 hover:text-gray-400",
							)}
						>
							<div
								className={cn(
									"w-1.5 h-1.5 rounded-full",
									preBookingStatus ? "bg-renault-yellow" : "bg-gray-700",
								)}
							/>
							{preBookingStatus || "Set Status"}
							<ChevronRight className="h-3 w-3 opacity-50" />
						</button>
					</PopoverTrigger>
					<PopoverContent
						align="end"
						side="bottom"
						className="w-48 p-1 bg-[#0f0f11] border-white/10"
					>
						<div className="space-y-0.5">
							{bookingStatuses.map((status) => (
								<button
									type="button"
									key={status.label}
									onClick={() => setPreBookingStatus(status.label)}
									className={cn(
										"w-full text-left px-3 py-2 text-xs font-medium rounded hover:bg-white/5 flex items-center gap-2",
										preBookingStatus === status.label
											? "text-renault-yellow bg-white/5"
											: "text-gray-400",
									)}
								>
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: status.color }}
									/>
									{status.label}
								</button>
							))}
						</div>
					</PopoverContent>
				</Popover>
			</div>
			<div className="relative">
				<MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500/50 pointer-events-none" />
				<Input
					value={bookingNote}
					onChange={(e) => setBookingNote(e.target.value)}
					placeholder="Add initial note..."
					className="w-full pl-10 pr-3 h-9 bg-white/[0.02] border-indigo-500/20 rounded-lg focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30 text-sm text-gray-300 placeholder:text-gray-600 transition-all"
				/>
			</div>
		</div>
	);
};
