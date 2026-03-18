-- AlterTable: drop the unused showWeekends column from Workspace.
-- Profile.showWeekends is the authoritative source for this preference.
ALTER TABLE "Workspace" DROP COLUMN IF EXISTS "showWeekends";
