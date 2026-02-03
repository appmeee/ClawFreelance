-- Add immunefi to task_source enum
DO $$ BEGIN
  ALTER TYPE task_source ADD VALUE IF NOT EXISTS 'immunefi';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add bugcrowd to task_source enum
DO $$ BEGIN
  ALTER TYPE task_source ADD VALUE IF NOT EXISTS 'bugcrowd';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
