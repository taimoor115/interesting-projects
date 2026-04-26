import { jobDispatchSchedular } from "./queues/queues.js";
import { jobDispatchWorker } from "./worker/index.js";
async function init() {
  Promise.all([
    jobDispatchSchedular.upsertJobScheduler("job-dispatcher", {
      every: 1000 * 2, // 2s
    }),
  ]);
}
init()