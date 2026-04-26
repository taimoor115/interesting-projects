import { Worker } from "bullmq";
import { eq, inArray, sql } from "drizzle-orm";
import db from "../db/index.js";
import { jobsTable, jobStatusEnumValues } from "../db/schema.js";
import Docker from "dockerode";
const docker = new Docker({
  socketPath: "//./pipe/docker_engine",
});
export const jobDispatchWorker = new Worker(
  "job-dispatcher",
  async () => {
    await db.transaction(async (tx) => {
      console.log("[JOB-DISPATCHER]: START TRANSACTION");
      const statement = sql`
            SELECT id
            FROM ${jobsTable}
            WHERE ${jobsTable.state} = ${jobStatusEnumValues[0]}
            ORDER BY ${jobsTable.createdAt} ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 5        
        `;

      const result = await tx.execute(statement);
      console.log("[JOB-DISPATCHER]: TRANSACTION RESULT", result.rows);

      const jobsIds = result.rows.map((e) => e.id);
      console.log("JOBS IDS 😂", jobsIds);

      if (jobsIds.length > 0) {
        console.log("[JOB-DISPATCHER]: MOVING JOBS STATE TO RUNNABLE STATE");
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
);export const jobCRIWorker = new Worker(
  "jobs-cri-schedular",
  async (jobCtx) => {
    console.log("\n==============================");
    console.log("[CRI-WORKER] TRIGGERED");
    console.log("[CRI-WORKER] Job ID:", jobCtx?.id);
    console.log("[CRI-WORKER] Timestamp:", new Date().toISOString());
    console.log("==============================\n");

    let jobId = null;

    try {
      console.log("[STEP 1] Fetching job from DB...");

      const job = await db.transaction(async (tx) => {
        const result = await tx.execute(sql`
          SELECT id, image, cmd
          FROM ${jobsTable}
          WHERE ${jobsTable.state} = ${jobStatusEnumValues[1]}
          ORDER BY ${jobsTable.createdAt} ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `);

        console.log("[DB] Raw result:", result.rows);

        const jobRow = result.rows[0];
        if (!jobRow) {
          console.log("[DB] No jobs found 🚫");
          return null;
        }

        console.log("[DB] Job locked:", jobRow.id);

        await tx
          .update(jobsTable)
          .set({ state: "RUNNING" })
          .where(eq(jobsTable.id, jobRow.id));

        console.log("[DB] Job marked as RUNNING");

        return jobRow.id;
      });

      if (!job) {
        console.log("[CRI-WORKER] No job to process, exiting...");
        return;
      }

      jobId = job;

      console.log("\n[STEP 2] Fetching full job details...");
      const [fullJob] = await db
        .select()
        .from(jobsTable)
        .where(eq(jobsTable.id, job));

      console.log("[JOB] Details:", {
        id: fullJob.id,
        image: fullJob.image,
        cmd: fullJob.cmd,
      });

      console.log("\n[STEP 3] Checking Docker image...");
      const images = await docker.listImages({
        filters: JSON.stringify({
          reference: [`${fullJob.image}:latest`],
        }),
      });

      console.log("[DOCKER] Images found:", images.length);

      if (!images.length) {
        console.log("[DOCKER] Image missing, pulling:", fullJob.image);

        await new Promise((resolve, reject) => {
          docker.pull(fullJob.image, (err, stream) => {
            if (err) {
              console.error("[DOCKER] Pull error:", err);
              return reject(err);
            }

            docker.modem.followProgress(
              stream,
              (err, res) => {
                if (err) {
                  console.error("[DOCKER] Pull failed:", err);
                  return reject(err);
                }

                console.log("[DOCKER] Pull completed ✅");
                resolve(res);
              },
              (event) => {
                if (event?.status) {
                  console.log("[DOCKER PULL]", event.status);
                }
              },
            );
          });
        });
      }

      console.log("\n[STEP 4] Creating container...");

      const container = await docker.createContainer({
        Image: `${fullJob.image}:latest`,
        Tty: false,
        HostConfig: { AutoRemove: false },
        Cmd: fullJob.cmd,
      });

      console.log("[DOCKER] Container created:", container.id);

      console.log("[STEP 5] Starting container...");
      await container.start();

      console.log("[DOCKER] Container started successfully 🚀");

      console.log("\n[STEP 6] Marking job SUCCESS...");
      await db
        .update(jobsTable)
        .set({ state: "SUCCEEDED" })
        .where(eq(jobsTable.id, job));

      console.log("[CRI-WORKER] JOB COMPLETED SUCCESSFULLY 🎉");
    } catch (err) {
      console.error("\n[CRI-WORKER] ❌ ERROR OCCURRED");
      console.error("Job ID:", jobId);
      console.error("Error:", err);

      if (jobId) {
        await db
          .update(jobsTable)
          .set({ state: "FAILED" })
          .where(eq(jobsTable.id, jobId));

        console.log("[DB] Job marked as FAILED");
      }
    } finally {
      console.log("\n[CRI-WORKER] Cycle finished");
      console.log("==============================\n");
    }
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  },
);
