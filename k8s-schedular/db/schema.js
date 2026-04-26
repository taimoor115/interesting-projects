import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
export const jobStatusEnum = pgEnum("job_status", [
  "SUBMITTED",
  "RUNNABLE",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);

export const jobStatusEnumValues = jobStatusEnum.enumValues
export const jobsTable = pgTable("jobs", {
  id: uuid().primaryKey().defaultRandom(),
  image: text("image").notNull(),
  cmd: text(),
  state: jobStatusEnum().default("SUBMITTED"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .defaultNow(),
});
