import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
	ReorderReasonDialog,
	type ReorderReasonDialogProps,
} from "@/components/shared/ReorderReasonDialog";

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

const defaultProps: ReorderReasonDialogProps = {
	open: true,
	onOpenChange: vi.fn(),
	reason: "",
	onReasonChange: vi.fn(),
	onCancel: vi.fn(),
	onConfirm: vi.fn(),
	placeholder: "e.g., Wrong part, Customer cancelled",
};

const renderDialog = (props?: Partial<ReorderReasonDialogProps>) =>
	render(<ReorderReasonDialog {...defaultProps} {...props} />);

describe("ReorderReasonDialog", () => {
	it("renders the given placeholder", () => {
		renderDialog({ placeholder: "Test placeholder text" });

		expect(
			screen.getByPlaceholderText("Test placeholder text"),
		).toBeInTheDocument();
	});

	it("renders helperText when passed and not when omitted", () => {
		const { rerender } = render(
			<ReorderReasonDialog
				{...defaultProps}
				helperText="This will send the selected items back to the Orders view."
			/>,
		);

		expect(
			screen.getByText(
				"This will send the selected items back to the Orders view.",
			),
		).toBeInTheDocument();

		rerender(<ReorderReasonDialog {...defaultProps} helperText={undefined} />);

		expect(
			screen.queryByText(
				"This will send the selected items back to the Orders view.",
			),
		).not.toBeInTheDocument();
	});

	it("renders srDescription text when passed", () => {
		const { rerender } = render(
			<ReorderReasonDialog
				{...defaultProps}
				srDescription="Provide a reason why this order is being sent back for reordering."
			/>,
		);

		expect(
			screen.getByText(
				"Provide a reason why this order is being sent back for reordering.",
			),
		).toBeInTheDocument();

		rerender(
			<ReorderReasonDialog {...defaultProps} srDescription={undefined} />,
		);

		expect(
			screen.queryByText(
				"Provide a reason why this order is being sent back for reordering.",
			),
		).not.toBeInTheDocument();
	});

	it('disables "Confirm Reorder" when reason is empty or whitespace and enables when non-whitespace', () => {
		const { rerender } = render(
			<ReorderReasonDialog {...defaultProps} reason="" />,
		);

		const confirmButton = screen.getByRole("button", {
			name: /confirm reorder/i,
		});
		expect(confirmButton).toBeDisabled();

		rerender(<ReorderReasonDialog {...defaultProps} reason="   " />);
		expect(confirmButton).toBeDisabled();

		rerender(
			<ReorderReasonDialog {...defaultProps} reason="Customer cancelled" />,
		);
		expect(confirmButton).toBeEnabled();
	});

	it("calls onConfirm when Confirm Reorder is clicked", () => {
		const onConfirm = vi.fn();
		renderDialog({
			reason: "Wrong part ordered",
			onConfirm,
		});

		fireEvent.click(screen.getByRole("button", { name: /confirm reorder/i }));

		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("calls onCancel and does not call onReasonChange when Cancel is clicked", () => {
		const onCancel = vi.fn();
		const onReasonChange = vi.fn();
		renderDialog({
			reason: "Some reason",
			onCancel,
			onReasonChange,
		});

		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onReasonChange).not.toHaveBeenCalled();
	});
});
