CREATE TYPE "public"."job_status" AS ENUM('SUBMITTED', 'RUNNABLE', 'RUNNING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "state" "job_status" DEFAULT 'SUBMITTED';