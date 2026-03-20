-- Migration: Add reminder_sent column to bookings table
-- Purpose: Track if meeting reminder has been sent (for WF-12 Meeting Reminder workflow)

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Add index for efficient querying of pending reminders
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_pending 
ON bookings (booking_date, start_time, reminder_sent) 
WHERE reminder_sent = false;

COMMENT ON COLUMN bookings.reminder_sent IS 'Tracks if 30-minute reminder notification has been sent for this booking';
