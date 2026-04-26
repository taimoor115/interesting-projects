import { Worker } from "bullmq";
import { inArray, sql } from "drizzle-orm";
import db from "../db/index.js";
import { jobsTable, jobStatusEnumValues } from "../db/schema.js";
export const jobDispatchWorker = new Worker(
  "job-dispatcher",
  async () => {
    await db.transaction(async (tx) => {
      console.log("START TRANSACTION");
      const statement = sql`
            SELECT id
            FROM ${jobsTable}
            WHERE ${jobsTable.state} = ${jobStatusEnumValues[0]}
            ORDER BY ${jobsTable.createdAt} ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 5        
        `;

      const result = await tx.execute(statement);
      console.log("TRANSACTION RESULT", result.rows);

      const jobsIds = result.rows.map((e) => e.id);
      console.log("JOBS IDS 😂", jobsIds);

      if (jobsIds.length > 0) {
        console.log("MOVING JOBS STATE TO RUNNABLE STATE");
        await tx
          .update(jobsTable)
          .set({ state: "RUNNABLE" })
          .where(inArray(jobsTable.id, jobsIds));
      }
    });
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  },
);
