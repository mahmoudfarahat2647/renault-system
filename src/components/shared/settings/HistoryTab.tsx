"use client";

import { History } from "lucide-react";

export const HistoryTab = () => {
	return (
		<div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
				<History className="h-10 w-10 text-gray-700 mb-4" />
				<p className="text-gray-500 text-sm">
					System History feature has been removed.
				</p>
				<p className="text-gray-600 text-xs mt-2">
					Use the Undo/Redo functionality (Ctrl+Z / Ctrl+Y) for session-based changes.
				</p>
			</div>
		</div>
	);
};
