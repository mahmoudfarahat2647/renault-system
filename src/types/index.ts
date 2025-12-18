export type Status =
    | "Pending"
    | "Ordered"
    | "Hold"
    | "Booked"
    | "Archived"
    | "Reorder"
    | "Call";

export interface PendingRow {
    id: string;
    baseId: string;
    trackingId: string;

    // Customer Info
    customerName: string;
    vin: string;
    mobile: string;
    cntrRdg: number;
    model: string;

    // Logistics Info
    partNumber: string;
    description: string;
    requester: string;
    requestedBy?: string;
    partStatus?: string;

    // Workflow Info
    status: Status;
    rDate: string;

    // Warranty Logic
    repairSystem: string;
    startWarranty: string;
    endWarranty: string;
    remainTime: string;

    // Meta / Actions
    noteContent?: string;
    actionNote?: string;
    bookingDate?: string;
    bookingNote?: string;
    hasAttachment?: boolean;
    attachmentPath?: string;
    reminder?: {
        date: string;
        time: string;
        subject: string;
    };
}

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
}

export interface StickyNote {
    id: string;
    content: string;
    color: string;
    createdAt: string;
}

export interface PartStatusDef {
    id: string;
    label: string;
    color: string;
}

export interface CommitLog {
    id: string;
    actionName: string;
    timestamp: string;
    snapshot: AppStateSnapshot;
}

export interface AppStateSnapshot {
    rowData: PendingRow[];
    ordersRowData: PendingRow[];
    bookingRowData: PendingRow[];
    callRowData: PendingRow[];
    archiveRowData: PendingRow[];
}

export interface AppState extends AppStateSnapshot {
    // Auxiliary Data
    todos: TodoItem[];
    notes: StickyNote[];
    partStatuses: PartStatusDef[];

    // Templates
    noteTemplates: string[];
    reminderTemplates: string[];
    bookingTemplates: string[];
    reasonTemplates: string[];

    // History
    commits: CommitLog[];
    redos: CommitLog[];
}
