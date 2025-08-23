-- CreateEnum
CREATE TYPE "public"."DeploymentStatus" AS ENUM ('NOT_STARTED', 'QUEUED', 'IN_PROGRESS', 'READY', 'FAIL');

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "git_url" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "custom_domain" TEXT
);

-- CreateTable
CREATE TABLE "public"."Deployment" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" "public"."DeploymentStatus" NOT NULL DEFAULT 'NOT_STARTED'
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_id_key" ON "public"."Project"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_id_key" ON "public"."Deployment"("id");

-- AddForeignKey
ALTER TABLE "public"."Deployment" ADD CONSTRAINT "Deployment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
