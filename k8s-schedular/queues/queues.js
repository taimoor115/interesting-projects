import { Queue } from "bullmq"


export const jobDispatchSchedular = new Queue("job-dispatcher")
export const jobsScehdular = new Queue("jobs-cri-schedular") 