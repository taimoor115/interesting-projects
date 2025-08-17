const express = require("express");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { generateSlug } = require("random-word-slugs");
const dotenv = require("dotenv");
const { Server } = require("socket-io");
const Redis = require("ioredis");
dotenv.config("./env");

const subscriber = new Redis({
  host:
    process.env.REDIS_HOST ||
    "redis-18742.c252.ap-southeast-1-1.ec2.redns.redis-cloud.com",
  port: parseInt(process.env.REDIS_PORT || "18742", 10),
  password: process.env.REDIS_PASSWORD || "",
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  lazyConnect: true,
});

const io = new Server({ cors: "*" });

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

io.listen(9002, () => console.log("Socket Server 9002"));

app.use(express.json());

const PORT = 9000;
const ecsClient = new ECSClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const config = {
  CLUSTER: "",
  TASK: "",
};

app.post("/project", async (req, res) => {
  const { gitURL, slug } = req.body;
  const projectSlug = slug ? slug : generateSlug();

  // Spin the container
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
          name: "",
          environment: [
            { name: "GITHUB_REPOSITORY_URL", value: gitURL },
            { name: "PROJECT_ID", value: projectSlug },
            {
              name: "AWS_ACCESS_KEY_ID",
              value: process.env.AWS_ACCESS_KEY_ID,
            },
            {
              name: "AWS_SECRET_ACCESS_KEY",
              value: process.env.AWS_SECRET_ACCESS_KEY,
            },
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

async function initRedisSubscribe() {
  console.log("Subscribed to logs....");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
}

initRedisSubscribe();
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});
