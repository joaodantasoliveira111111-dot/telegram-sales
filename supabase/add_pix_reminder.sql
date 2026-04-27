ALTER TABLE payments ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;
