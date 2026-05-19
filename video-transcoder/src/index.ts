import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import type { S3Event } from "aws-lambda";

// ─── Config (set these in your .env or environment) ──────────────────────────
const AWS_REGION = process.env.AWS_REGION || "ap-south-1";
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || "";
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || ""; // full SQS URL
const ECS_CLUSTER = process.env.ECS_CLUSTER || ""; // e.g. "video-transcoder-cluster"
const ECS_TASK_DEF = process.env.ECS_TASK_DEFINITION || ""; // e.g. "video-transcoder-task:1"
const ECS_CONTAINER_NAME = process.env.ECS_CONTAINER_NAME || ""; // container name in task def
const ECS_SUBNET_1 = process.env.ECS_SUBNET_1 || ""; // e.g. "subnet-0abc1234"
const ECS_SUBNET_2 = process.env.ECS_SUBNET_2 || ""; // e.g. "subnet-0def5678" (optional)
// ─────────────────────────────────────────────────────────────────────────────

const credentials = {
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
};

const sqsClient = new SQSClient({ region: AWS_REGION, credentials });
const ecsClient = new ECSClient({ region: AWS_REGION, credentials });

async function spinFargateContainer(bucketName: string, key: string) {
  console.log(
    `[ECS] Launching Fargate task → bucket: ${bucketName} | key: ${key}`,
  );

  const subnets = [ECS_SUBNET_1, ECS_SUBNET_2].filter(Boolean);

  const command = new RunTaskCommand({
    cluster: ECS_CLUSTER,
    taskDefinition: ECS_TASK_DEF,
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets,
        assignPublicIp: "ENABLED",
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: ECS_CONTAINER_NAME,
          environment: [
            { name: "BUCKET_NAME", value: bucketName },
            { name: "KEY", value: key },
          ],
        },
      ],
    },
  });

  const response = await ecsClient.send(command);

  const task = response.tasks?.[0];
  console.log(
    `[ECS] Task launched ✓ | taskArn: ${task?.taskArn} | status: ${task?.lastStatus}`,
  );

  if (response.failures && response.failures.length > 0) {
    console.error(
      "[ECS] Failures:",
      JSON.stringify(response.failures, null, 2),
    );
    throw new Error(`ECS task launch failed: ${response.failures[0].reason}`);
  }

  return task;
}

async function processMessage(body: string, receiptHandle: string) {
  const event = JSON.parse(body) as S3Event;

  // S3 test event — skip silently
  if ("Event" in event && (event as any).Event === "s3:TestEvent") {
    console.log("[SQS] Skipping S3 test event");
    await deleteMessage(receiptHandle);
    return;
  }

  if (!event.Records || event.Records.length === 0) {
    console.warn("[SQS] No records in event, skipping");
    return;
  }

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const eventName = record.eventName;

    console.log(
      `[S3] Event: ${eventName} | Bucket: ${bucketName} | Key: ${key}`,
    );

    if (!eventName.startsWith("ObjectCreated")) {
      console.log(`[S3] Skipping non-upload event: ${eventName}`);
      continue;
    }

    await spinFargateContainer(bucketName, key);
  }

  await deleteMessage(receiptHandle);
}

async function deleteMessage(receiptHandle: string) {
  await sqsClient.send(
    new DeleteMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      ReceiptHandle: receiptHandle,
    }),
  );
  console.log("[SQS] Message deleted ✓");
}

async function init() {
  console.log("[INIT] Video Transcoder Orchestrator started");
  console.log(`[INIT] Region: ${AWS_REGION} | Queue: ${SQS_QUEUE_URL}`);

  const receiveCommand = new ReceiveMessageCommand({
    QueueUrl: SQS_QUEUE_URL,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20, // long polling — reduces cost & latency
  });

  while (true) {
    try {
      const { Messages } = await sqsClient.send(receiveCommand);

      if (!Messages || Messages.length === 0) {
        console.log("[SQS] Queue empty, polling...");
        continue;
      }

      for (const message of Messages) {
        const { Body, MessageId, ReceiptHandle } = message;

        console.log(`[SQS] Message received | id: ${MessageId}`);

        if (!Body || !ReceiptHandle) {
          console.warn("[SQS] Empty body or missing receipt handle, skipping");
          continue;
        }

        await processMessage(Body, ReceiptHandle);
      }
    } catch (error) {
      console.error("[ERROR] Orchestrator error:", error);
      // wait 5s before retrying to avoid hammering on persistent errors
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

init();
