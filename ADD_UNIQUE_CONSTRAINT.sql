
-- =================================================================
-- ADD UNIQUE CONSTRAINT (CRITICAL FOR UPSERT)
-- =================================================================
-- We need to ensure that (page_index, slot_index) is unique
-- so that when we save, it UPDATES instead of INSERTING duplicates.

-- 1. Clean up any existing duplicates (keep the latest one)
DELETE FROM featured_slots a USING featured_slots b
WHERE a.id < b.id 
  AND a.page_index = b.page_index 
  AND a.slot_index = b.slot_index;

-- 2. Add the unique constraint
ALTER TABLE featured_slots 
DROP CONSTRAINT IF EXISTS featured_slots_page_slot_key;

ALTER TABLE featured_slots
ADD CONSTRAINT featured_slots_page_slot_key UNIQUE (page_index, slot_index);
