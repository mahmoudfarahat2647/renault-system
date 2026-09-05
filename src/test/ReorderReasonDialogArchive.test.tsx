import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ReorderReasonDialog } from "@/components/shared/ReorderReasonDialog";

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? <div data-testid="reorder-dialog">{children}</div> : null,
	DialogContent: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	DialogDescription: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	DialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}));

describe("ReorderReasonDialog - Archive adoption", () => {
	const archiveProps = {
		open: true,
		onOpenChange: vi.fn(),
		reason: "",
		onReasonChange: vi.fn(),
		onCancel: vi.fn(),
		onConfirm: vi.fn(),
		placeholder: "e.g., Customer called back, error in archive",
		helperText: "This will send the selected items back to the Orders view.",
	};

	it("renders Archive placeholder, renders helperText, and does NOT render srDescription", () => {
		const { container } = render(<ReorderReasonDialog {...archiveProps} />);

		expect(
			screen.getByPlaceholderText(
				"e.g., Customer called back, error in archive",
			),
		).toBeInTheDocument();

		// Helper text element IS rendered
		const helperP = container.querySelector(".text-muted-foreground");
		expect(helperP).not.toBeNull();
		expect(
			screen.getByText(
				"This will send the selected items back to the Orders view.",
			),
		).toBeInTheDocument();

		// No sr-only description element rendered
		const srOnlyEl = container.querySelector(".sr-only");
		expect(srOnlyEl).toBeNull();
	});

	it("keeps Confirm Reorder disabled when reason is blank, and enables it when filled", () => {
		const { rerender } = render(
			<ReorderReasonDialog {...archiveProps} reason="" />,
		);

		const confirmBtn = screen.getByRole("button", {
			name: /confirm reorder/i,
		});
		expect(confirmBtn).toBeDisabled();

		rerender(<ReorderReasonDialog {...archiveProps} reason="   " />);
		expect(confirmBtn).toBeDisabled();

		rerender(
			<ReorderReasonDialog
				{...archiveProps}
				reason="Customer called back, error in archive"
			/>,
		);
		expect(confirmBtn).toBeEnabled();
	});

	it("calls onConfirm when Confirm Reorder is clicked with non-empty reason", () => {
		const onConfirm = vi.fn();
		render(
			<ReorderReasonDialog
				{...archiveProps}
				reason="Valid reason"
				onConfirm={onConfirm}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /confirm reorder/i }));
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("calls onCancel when Cancel is clicked", () => {
		const onCancel = vi.fn();
		render(<ReorderReasonDialog {...archiveProps} onCancel={onCancel} />);

		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});
});
