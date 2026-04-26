import { jobDispatchSchedular, jobsScehdular } from "./queues/queues.js";
import { jobCRIWorker, jobDispatchWorker } from "./worker/index.js";
async function init() {
  Promise.all([
    jobDispatchSchedular.upsertJobScheduler("job-dispatcher", {
      every: 1000 * 2, // 2s
    }),
    jobsScehdular.upsertJobScheduler("jobs-cri-schedular", {
      every: 1000 * 10, // 10s
    }),
  ]);
}
init();
