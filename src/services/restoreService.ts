import { supabase } from "@/lib/supabase";
import type { AppStateSnapshot } from "@/types";
import { orderService } from "./orderService";

export const restoreService = {
    /**
     * Restores the database to a specific snapshot.
     * This is a "git reset --hard" equivalent for the system.
     */
    async restoreSnapshot(snapshot: AppStateSnapshot): Promise<void> {
        // 1. Combine all row data from different stages
        const allRows = [
            ...snapshot.ordersRowData.map((r) => ({ ...r, stage: "orders" as const })),
            ...snapshot.rowData.map((r) => ({ ...r, stage: "main" as const })),
            ...snapshot.bookingRowData.map((r) => ({ ...r, stage: "booking" as const })),
            ...snapshot.callRowData.map((r) => ({ ...r, stage: "call" as const })),
            ...snapshot.archiveRowData.map((r) => ({ ...r, stage: "archive" as const })),
        ];

        console.log("Starting restoration with", allRows.length, "rows");

        // 2. Clear current database state
        // NOTE: We must delete from order_reminders first due to foreign key constraints
        console.log("Deleting existing reminders...");
        const { error: reminderDeleteError } = await supabase
            .from("order_reminders")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (reminderDeleteError) {
            console.error("Reminder deletion failed:", reminderDeleteError);
            throw reminderDeleteError;
        }

        console.log("Deleting existing orders...");
        const { error: deleteError } = await supabase
            .from("orders")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (deleteError) {
            console.error("Order deletion failed:", deleteError);
            throw deleteError;
        }

        if (allRows.length === 0) {
            console.log("No rows to restore, cleanup complete.");
            return;
        }

        console.log("Preparing", allRows.length, "rows for insertion...");
        // We use the same mapping logic as orderService.saveOrder but in bulk
        const supabaseOrders = allRows.map((row) => {
            const { id, stage, reminder, ...rest } = row;

            // Reconstruct metadata from rest fields
            const metadata = { ...rest };
            delete (metadata as any).id;
            delete (metadata as any).stage;
            delete (metadata as any).reminder;

            return {
                id,
                order_number: rest.trackingId || (rest as any).order_number || null,
                customer_name: rest.customerName || (rest as any).customer_name,
                customer_phone: rest.mobile || (rest as any).customer_phone,
                vin: rest.vin,
                company: rest.company,
                stage: stage,
                metadata: metadata,
            };
        });

        // 4. Batch insert orders
        const { data: insertedOrders, error: insertError } = await supabase
            .from("orders")
            .insert(supabaseOrders)
            .select();

        if (insertError) {
            console.error("Batch insert failed:", insertError);
            throw insertError;
        }

        // 5. Restore Reminders
        const remindersToInsert = allRows
            .filter((r) => r.reminder)
            .map((r) => {
                const reminder = r.reminder!;
                let remindAt: string | null = null;

                if (reminder.date && reminder.time) {
                    const [year, month, day] = reminder.date.split("-").map(Number);
                    const [hours, minutes] = reminder.time.split(":").map(Number);
                    const localDate = new Date(year, month - 1, day, hours, minutes);
                    remindAt = localDate.toISOString();
                }

                return {
                    order_id: r.id,
                    title: reminder.subject,
                    remind_at: remindAt,
                    is_completed: false,
                };
            });

        if (remindersToInsert.length > 0) {
            console.log("Inserting", remindersToInsert.length, "reminders...");
            const { error: reminderError } = await supabase
                .from("order_reminders")
                .insert(remindersToInsert);

            if (reminderError) {
                console.error("Reminder restoration failed:", reminderError);
                throw reminderError;
            }
        }

        console.log("Restoration successful!");

        // 6. Handle Booking Statuses if they were ever moved to DB
        // (Currently they seem to be in localStorage, but if persistent definitions were added, 
        // they should be handled here too. Keeping it simpler for now as they are small UI prefs).
    },
};
