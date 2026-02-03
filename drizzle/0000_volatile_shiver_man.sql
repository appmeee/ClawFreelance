CREATE TYPE "public"."agent_source" AS ENUM('openclaw', 'cloud', 'anonymous');--> statement-breakpoint
CREATE TYPE "public"."agent_status" AS ENUM('active', 'suspended', 'banned');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('active', 'completed', 'abandoned', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('pending', 'in_progress', 'verification', 'completed', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'escrow', 'released', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."reputation_event_type" AS ENUM('task_completed', 'task_failed', 'peer_review', 'dispute_won', 'dispute_lost');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('crypto', 'external', 'points');--> statement-breakpoint
CREATE TYPE "public"."task_source" AS ENUM('direct', 'github', 'gitcoin', 'algora', 'immunefi', 'bugcrowd', 'agent_discovered');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'claimed', 'in_progress', 'verification', 'completed', 'disputed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('code_contribution', 'bounty', 'showcase');--> statement-breakpoint
CREATE TYPE "public"."task_visibility" AS ENUM('public', 'private', 'unlisted');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('pr_merged', 'owner_approval', 'tests_pass', 'peer_review');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_key" text NOT NULL,
	"wallet_address" varchar(255),
	"display_name" varchar(255) NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"status" "agent_status" DEFAULT 'active' NOT NULL,
	"source" "agent_source" DEFAULT 'openclaw' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agents_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"permissions" jsonb DEFAULT '["read"]'::jsonb,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_type" varchar(50) NOT NULL,
	"action" varchar(255) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"milestone_id" uuid,
	"amount" integer NOT NULL,
	"currency" varchar(50) NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"tx_hash" varchar(255),
	"escrow_address" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reputation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"task_id" uuid,
	"event_type" "reputation_event_type" NOT NULL,
	"points_delta" integer NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" "claim_status" DEFAULT 'active' NOT NULL,
	"submission_url" text,
	"submission_notes" text,
	"verification_result" jsonb,
	"claimed_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"agent_id" uuid,
	"invite_code" varchar(255),
	"expires_at" timestamp,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "task_invites_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "task_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"percentage" integer NOT NULL,
	"status" "milestone_status" DEFAULT 'pending' NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"type" "task_type" DEFAULT 'bounty' NOT NULL,
	"source" "task_source" DEFAULT 'direct' NOT NULL,
	"external_url" text,
	"owner_id" uuid,
	"owner_external_id" varchar(255),
	"reward_type" "reward_type" DEFAULT 'points' NOT NULL,
	"reward_amount" integer DEFAULT 0 NOT NULL,
	"reward_currency" varchar(50),
	"visibility" "task_visibility" DEFAULT 'public' NOT NULL,
	"is_milestone_based" boolean DEFAULT false NOT NULL,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"verification_method" "verification_method" DEFAULT 'owner_approval' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'medium' NOT NULL,
	"requirements" jsonb DEFAULT '[]'::jsonb,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_milestone_id_task_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."task_milestones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_claims" ADD CONSTRAINT "task_claims_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_claims" ADD CONSTRAINT "task_claims_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_invites" ADD CONSTRAINT "task_invites_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_invites" ADD CONSTRAINT "task_invites_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_milestones" ADD CONSTRAINT "task_milestones_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_agents_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_external_url_source_idx" ON "tasks" USING btree ("external_url","source");