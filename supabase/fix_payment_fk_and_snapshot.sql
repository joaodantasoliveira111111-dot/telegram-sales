-- 1. Add snapshot columns to preserve plan info even after plan deletion
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS plan_name text,
  ADD COLUMN IF NOT EXISTS plan_price numeric;

-- 2. Backfill snapshot from existing joined data (for payments still linked to a plan)
UPDATE payments p
SET
  plan_name = pl.name,
  plan_price = pl.price
FROM plans pl
WHERE p.plan_id = pl.id
  AND (p.plan_name IS NULL OR p.plan_price IS NULL);

-- 3. Change plan_id FK from CASCADE DELETE → SET NULL
--    (so deleting a plan won't delete payment history)
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_plan_id_fkey;

ALTER TABLE payments
  ADD CONSTRAINT payments_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;

-- 4. Same protection for bot_id
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_bot_id_fkey;

ALTER TABLE payments
  ADD CONSTRAINT payments_bot_id_fkey
  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE SET NULL;
