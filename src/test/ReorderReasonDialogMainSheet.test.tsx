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

describe("ReorderReasonDialog - Main Sheet adoption", () => {
	const mainSheetProps = {
		open: true,
		onOpenChange: vi.fn(),
		reason: "",
		onReasonChange: vi.fn(),
		onCancel: vi.fn(),
		onConfirm: vi.fn(),
		placeholder: "e.g., Customer called back, error on main sheet",
	};

	it("renders Main Sheet placeholder, does NOT render helperText, and does NOT render srDescription", () => {
		const { container } = render(<ReorderReasonDialog {...mainSheetProps} />);

		expect(
			screen.getByPlaceholderText(
				"e.g., Customer called back, error on main sheet",
			),
		).toBeInTheDocument();

		// No helper text element rendered
		const helperP = container.querySelector(".text-muted-foreground");
		expect(helperP).toBeNull();

		// No sr-only description element rendered
		const srOnlyEl = container.querySelector(".sr-only");
		expect(srOnlyEl).toBeNull();
	});

	it("keeps Confirm Reorder disabled when reason is blank, and enables it when filled", () => {
		const { rerender } = render(
			<ReorderReasonDialog {...mainSheetProps} reason="" />,
		);

		const confirmBtn = screen.getByRole("button", {
			name: /confirm reorder/i,
		});
		expect(confirmBtn).toBeDisabled();

		rerender(<ReorderReasonDialog {...mainSheetProps} reason="   " />);
		expect(confirmBtn).toBeDisabled();

		rerender(
			<ReorderReasonDialog
				{...mainSheetProps}
				reason="Customer called back, error on main sheet"
			/>,
		);
		expect(confirmBtn).toBeEnabled();
	});

	it("calls onConfirm when Confirm Reorder is clicked with non-empty reason", () => {
		const onConfirm = vi.fn();
		render(
			<ReorderReasonDialog
				{...mainSheetProps}
				reason="Valid reason"
				onConfirm={onConfirm}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /confirm reorder/i }));
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("calls onCancel when Cancel is clicked", () => {
		const onCancel = vi.fn();
		render(<ReorderReasonDialog {...mainSheetProps} onCancel={onCancel} />);

		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});
});
