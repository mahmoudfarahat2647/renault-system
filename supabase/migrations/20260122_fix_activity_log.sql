-- 1. Ensure recent_activity table exists with documented schema
CREATE TABLE IF NOT EXISTS public.recent_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_name TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Robust Cleanup: Find and drop any trigger function that mentions "activity_log"
-- This uses a dynamic SQL approach to identify triggers that might be causing the "relation activity_log does not exist" error.
DO $$
DECLARE
    row RECORD;
BEGIN
    FOR row IN 
        SELECT DISTINCT tr.trigger_name, tr.event_object_table
        FROM information_schema.triggers tr
        WHERE tr.event_object_table = 'orders'
    LOOP
        -- Check the associated function source for "activity_log"
        IF EXISTS (
            SELECT 1 
            FROM pg_proc p 
            JOIN pg_trigger t ON t.tgfoid = p.oid 
            WHERE t.tgname = row.trigger_name 
              AND p.prosrc ILIKE '%activity_log%'
        ) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', row.trigger_name, row.event_object_table);
        END IF;
    END LOOP;
END $$;

-- 3. Create/Replace the correct logging function
CREATE OR REPLACE FUNCTION public.fn_log_order_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.recent_activity (action_name, timestamp)
    VALUES (
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'Created order ' || COALESCE(NEW.order_number, NEW.id::text)
            WHEN TG_OP = 'UPDATE' THEN 'Updated order ' || COALESCE(NEW.order_number, NEW.id::text)
            WHEN TG_OP = 'DELETE' THEN 'Deleted order ' || COALESCE(OLD.order_number, OLD.id::text)
            ELSE TG_OP || ' on order'
        END,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the robust trigger
DROP TRIGGER IF EXISTS tr_log_order_activity ON public.orders;
CREATE TRIGGER tr_log_order_activity
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_order_activity();
