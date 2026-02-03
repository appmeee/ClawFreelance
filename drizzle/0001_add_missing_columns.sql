-- Create milestone_status enum if not exists (needed for task_milestones)
DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'verification', 'completed', 'disputed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add task_visibility enum if not exists
DO $$ BEGIN
  CREATE TYPE task_visibility AS ENUM ('public', 'private', 'unlisted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add visibility column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS visibility task_visibility DEFAULT 'public' NOT NULL;
--> statement-breakpoint
-- Add is_milestone_based column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_milestone_based boolean DEFAULT false NOT NULL;
--> statement-breakpoint
-- Create task_milestones table if not exists
CREATE TABLE IF NOT EXISTS task_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  percentage integer NOT NULL,
  status milestone_status DEFAULT 'pending' NOT NULL,
  "order" integer NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create task_invites table if not exists
CREATE TABLE IF NOT EXISTS task_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  invite_code varchar(255) UNIQUE,
  expires_at timestamp,
  max_uses integer DEFAULT 1 NOT NULL,
  uses integer DEFAULT 0 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);
