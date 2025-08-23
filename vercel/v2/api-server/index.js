const express = require("express");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { z } = require("zod");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@clickhouse/client");
const { Kafka } = require("kafkajs");

const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 9000;
const prisma = new PrismaClient({});
const clickHouseClient = createClient({
  host: "",
  database: "",
  username: "",
  password: "",
});
const kafka = new Kafka({
  clientId: `api-server`,
  brokers: [""],
  ssl: { ca: fs.readFileSync(path.join(__dirname, "kafka.pem"), "utf-8") },
  sasl: {
    mechanism: "plain",
    username: "",
    password: "",
  },
});

const consumer = kafka.consumer({ groupId: "api-server-logs-consumer" });

const ecsClient = new ECSClient({
  region: "ap-east-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});

const config = {
  CLUSTER: "",
  TASK: "",
};

app.use(express.json());

app.post("/project", async (req, res) => {
  const schema = z.object({
    name: z.string(),
    gitURL: z.string(),
  });
  const safeParseResult = schema.safeParse(req.body);

  if (safeParseResult.error)
    return res.status(400).json({ error: safeParseResult.error });

  const { name, gitURL } = safeParseResult.data;

  const project = await prisma.project.create({
    data: {
      name,
      gitURL,
      subDomain: generateSlug(),
    },
  });

  return res.json({ status: "success", data: { project } });
});
app.post("/deploy", async (req, res) => {
  const { projectId } = req.body;

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) return res.status(404).json({ error: "Project not found" });

  // Check if there is no running deployement
  const deployment = await prisma.deployment.create({
    data: {
      project: { connect: { id: projectId } },
      status: "QUEUED",
    },
  });

  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: ["", "", ""],
        securityGroups: [""],
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "builder-image",
          environment: [
            { name: "GIT_REPOSITORY__URL", value: project.gitURL },
            { name: "PROJECT_ID", value: projectId },
            { name: "DEPLOYEMENT_ID", value: deployment.id },
          ],
        },
      ],
    },
  });

  await ecsClient.send(command);

  return res.json({
    status: "queued",
    data: { projectSlug, url: `http://${projectSlug}.localhost:8000` },
  });
});

async function initKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "container-logs" });
  await consumer.run({
    autoCommit: false,
    eachBatch: async function ({
      batch,
      commitOffsetsIfNecessary,
      heartbeat,
      resolveOffset,
    }) {
      for (const message of batch.messages) {
        const { log, DEPLOYMENT_ID } = JSON.parse(message.value);
        console.log(
          "🚀 ~ initKafkaConsumer ~ DEPLOYMENT_ID:",
          DEPLOYMENT_ID,
          log
        );

        try {
          const { query_id } = await clickHouseClient.insert({
            table: "log_events",
            values: [
              {
                event_id: uuidv4(),
                deployment_id: DEPLOYMENT_ID,
                log: log,
              },
            ],
            format: "JSONEachRow",
          });

          commitOffsetsIfNecessary(message.offset);
          resolveOffset(message.offset);
          await heartbeat();
        } catch (error) {
          console.log("🚀 ~ initKafkaConsumer ~ error:", error);
        }
      }
    },
  });
}

initKafkaConsumer();
app.listen(PORT, () => console.log(`API Server Running..${PORT}`));
