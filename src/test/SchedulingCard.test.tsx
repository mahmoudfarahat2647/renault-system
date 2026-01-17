import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SchedulingCard } from "../components/reports/SchedulingCard";
import { useAppStore } from "../store/useStore";

// Mock the useAppStore hook
vi.mock("../store/useStore", () => ({
    useAppStore: vi.fn(),
}));

// Mock UI components
vi.mock("../components/ui/card", () => ({
    Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
    CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
    CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
    CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
    CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
}));

vi.mock("../components/ui/label", () => ({
    Label: ({ children, htmlFor, ...props }: any) => <label data-testid="label" htmlFor={htmlFor} {...props}>{children}</label>,
}));

vi.mock("../components/ui/switch", () => ({
    Switch: ({ checked, onCheckedChange, disabled, id }: any) => (
        <input
            data-testid="switch"
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            disabled={disabled}
            id={id}
        />
    ),
}));

vi.mock("../components/ui/select", () => ({
    Select: ({ children, value, onValueChange, disabled }: any) => (
        <div data-testid="select">
            <select
                data-testid="select-trigger"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                disabled={disabled}
            >
                {children}
            </select>
            <div data-testid="select-content">{children}</div>
        </div>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => <div data-testid="select-content">{children}</div>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
    SelectTrigger: ({ children }: { children: React.ReactNode }) => children,
    SelectValue: ({ placeholder }: { placeholder: string }) => <option value="">{placeholder}</option>,
}));

describe("SchedulingCard", () => {
    const mockFetchReportSettings = vi.fn();
    const mockUpdateReportSettings = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAppStore).mockReturnValue({
            reportSettings: null,
            updateReportSettings: mockUpdateReportSettings,
            fetchReportSettings: mockFetchReportSettings,
        } as any);
    });

    it("should render the card with title and description", () => {
        render(<SchedulingCard isLocked={false} />);

        expect(screen.getByText("Scheduling")).toBeInTheDocument();
        expect(screen.getByText("Configure how often you want to receive automated backups.")).toBeInTheDocument();
    });

    it("should call fetchReportSettings on mount when reportSettings is null", () => {
        render(<SchedulingCard isLocked={false} />);

        expect(mockFetchReportSettings).toHaveBeenCalled();
    });

    it("should not call fetchReportSettings on mount when reportSettings exists", () => {
        vi.mocked(useAppStore).mockReturnValue({
            reportSettings: {
                id: "1",
                emails: [],
                frequency: "Weekly",
                is_enabled: false,
                last_sent_at: null,
            },
            updateReportSettings: mockUpdateReportSettings,
            fetchReportSettings: mockFetchReportSettings,
        } as any);

        render(<SchedulingCard isLocked={false} />);

        expect(mockFetchReportSettings).not.toHaveBeenCalled();
    });

    it("should render loading state when reportSettings is null", () => {
        render(<SchedulingCard isLocked={false} />);

        const switchElement = screen.getByTestId("switch");
        const selectElement = screen.getByTestId("select-trigger");

        expect(switchElement).toBeDisabled();
        expect(selectElement).toBeDisabled();
    });

    it("should render form fields when reportSettings exist", () => {
        vi.mocked(useAppStore).mockReturnValue({
            reportSettings: {
                id: "1",
                emails: [],
                frequency: "Weekly",
                is_enabled: true,
                last_sent_at: null,
            },
            updateReportSettings: mockUpdateReportSettings,
            fetchReportSettings: mockFetchReportSettings,
        } as any);

        render(<SchedulingCard isLocked={false} />);

        const switchElement = screen.getByTestId("switch");
        const selectElement = screen.getByTestId("select-trigger");

        expect(switchElement).not.toBeDisabled();
        expect(selectElement).not.toBeDisabled();
        expect(switchElement).toBeChecked();
        expect(selectElement).toHaveValue("Weekly");
    });

    it("should call updateReportSettings when switch is toggled", async () => {
        vi.mocked(useAppStore).mockReturnValue({
            reportSettings: {
                id: "1",
                emails: [],
                frequency: "Weekly",
                is_enabled: false,
                last_sent_at: null,
            },
            updateReportSettings: mockUpdateReportSettings,
            fetchReportSettings: mockFetchReportSettings,
        } as any);

        render(<SchedulingCard isLocked={false} />);

        const switchElement = screen.getByTestId("switch");
        fireEvent.click(switchElement);

        expect(mockUpdateReportSettings).toHaveBeenCalledWith({ is_enabled: true });
    });

    it("should call updateReportSettings when frequency is changed", async () => {
        vi.mocked(useAppStore).mockReturnValue({
            reportSettings: {
                id: "1",
                emails: [],
                frequency: "Weekly",
                is_enabled: true,
                last_sent_at: null,
            },
            updateReportSettings: mockUpdateReportSettings,
            fetchReportSettings: mockFetchReportSettings,
        } as any);

        render(<SchedulingCard isLocked={false} />);

        const selectElement = screen.getByTestId("select-trigger");
        fireEvent.change(selectElement, { target: { value: "Monthly" } });

        expect(mockUpdateReportSettings).toHaveBeenCalledWith({ frequency: "Monthly" });
    });

    it("should disable all controls when isLocked is true", () => {
        vi.mocked(useAppStore).mockReturnValue({
            reportSettings: {
                id: "1",
                emails: [],
                frequency: "Weekly",
                is_enabled: true,
                last_sent_at: null,
            },
            updateReportSettings: mockUpdateReportSettings,
            fetchReportSettings: mockFetchReportSettings,
        } as any);

        render(<SchedulingCard isLocked={true} />);

        const switchElement = screen.getByTestId("switch");
        const selectElement = screen.getByTestId("select-trigger");

        expect(switchElement).toBeDisabled();
        expect(selectElement).toBeDisabled();
    });

    it("should disable frequency select when automatic backups are disabled", () => {
        vi.mocked(useAppStore).mockReturnValue({
            reportSettings: {
                id: "1",
                emails: [],
                frequency: "Weekly",
                is_enabled: false,
                last_sent_at: null,
            },
            updateReportSettings: mockUpdateReportSettings,
            fetchReportSettings: mockFetchReportSettings,
        } as any);

        render(<SchedulingCard isLocked={false} />);

        const selectElement = screen.getByTestId("select-trigger");
        expect(selectElement).toBeDisabled();
    });

    it("should render all frequency options", () => {
        vi.mocked(useAppStore).mockReturnValue({
            reportSettings: {
                id: "1",
                emails: [],
                frequency: "Weekly",
                is_enabled: true,
                last_sent_at: null,
            },
            updateReportSettings: mockUpdateReportSettings,
            fetchReportSettings: mockFetchReportSettings,
        } as any);

        render(<SchedulingCard isLocked={false} />);

        expect(screen.getByText("Weekly")).toBeInTheDocument();
        expect(screen.getByText("Monthly")).toBeInTheDocument();
        expect(screen.getByText("Yearly")).toBeInTheDocument();
    });

    it("should display correct labels and descriptions", () => {
        render(<SchedulingCard isLocked={false} />);

        expect(screen.getByText("Automatic Backups")).toBeInTheDocument();
        expect(screen.getByText("Enable scheduled reports sent to your email.")).toBeInTheDocument();
        expect(screen.getByText("Frequency")).toBeInTheDocument();
    });
});
