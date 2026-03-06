-- Align Workspace schema with existing production drift.
-- Safe in environments where the column already exists.
ALTER TABLE "Workspace"
ADD COLUMN IF NOT EXISTS "showWeekends" BOOLEAN NOT NULL DEFAULT true;
