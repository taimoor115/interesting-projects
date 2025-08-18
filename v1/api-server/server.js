const express = require("express");
const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 9092;

// Connect to local Redis
const subscriber = new Redis({
  host: "localhost",
  port: 6379,
});

const logsCache = {}; // store logs per projectId
const clients = {};   // SSE clients per projectId

// Subscribe to all log channels
subscriber.psubscribe("logs:*");

subscriber.on("pmessage", (pattern, channel, message) => {
  console.log("Received log:", channel, message);

  // Store in memory
  if (!logsCache[channel]) logsCache[channel] = [];
  logsCache[channel].push(message);

  // Stream to connected SSE clients
  const projectId = channel.split(":")[1];
  if (clients[projectId]) {
    clients[projectId].forEach((res) => {
      res.write(`data: ${message}\n\n`);
    });
  }
});

// HTTP endpoint to fetch logs (Postman-friendly)
app.get("/logs/:projectId", (req, res) => {
  const projectId = req.params.projectId;
  const channel = `logs:${projectId}`;
  const logs = logsCache[channel] || [];
  res.json({ logs });
});

// SSE endpoint for live streaming
app.get("/logs-stream/:projectId", (req, res) => {
  const projectId = req.params.projectId;

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Add client to list
  if (!clients[projectId]) clients[projectId] = [];
  clients[projectId].push(res);

  // Remove client on disconnect
  req.on("close", () => {
    clients[projectId] = clients[projectId].filter((r) => r !== res);
  });
});

app.listen(PORT, () => {
  console.log(`Log server running on http://localhost:${PORT}`);
});













// ============ PRODUCTION_CODE =====================
// const express = require("express");
// const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
// const { generateSlug } = require("random-word-slugs");
// const dotenv = require("dotenv");
// const Redis = require("ioredis");
// const { Server } = require("socket.io");
// dotenv.config("./env");

// const app = express();
// const subscriber = new Redis({
//   host: "localhost", // Use this for Docker on Windows/macOS
//   port: 6379,
// });

// const io = new Server({ cors: "*" });
// app.use(express.json());

// io.on("connection", (socket) => {
//   socket.on("subscribe", (channel) => {
//     socket.join(channel);
//     socket.emit("message", `Joined ${channel}`);
//   });
// });

// io.listen(9002, () => console.log("Socket Server 9002"));

// const PORT = 9000;
// const ecsClient = new ECSClient({
//   region: "us-east-1",
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const config = {
//   CLUSTER: "",
//   TASK: "",
// };

// app.post("/project", async (req, res) => {
//   const { gitURL, slug } = req.body;
//   const projectSlug = slug ? slug : generateSlug();

//   // Spin the container
//   const command = new RunTaskCommand({
//     cluster: config.CLUSTER,
//     taskDefinition: config.TASK,
//     launchType: "FARGATE",
//     count: 1,
//     networkConfiguration: {
//       awsvpcConfiguration: {
//         assignPublicIp: "ENABLED",
//         subnets: ["", "", ""],
//         securityGroups: [""],
//       },
//     },
//     overrides: {
//       containerOverrides: [
//         {
//           name: "",
//           environment: [
//             { name: "GITHUB_REPOSITORY_URL", value: gitURL },
//             { name: "PROJECT_ID", value: projectSlug },
//             {
//               name: "AWS_ACCESS_KEY_ID",
//               value: process.env.AWS_ACCESS_KEY_ID,
//             },
//             {
//               name: "AWS_SECRET_ACCESS_KEY",
//               value: process.env.AWS_SECRET_ACCESS_KEY,
//             },
//           ],
//         },
//       ],
//     },
//   });

//   await ecsClient.send(command);

//   return res.json({
//     status: "queued",
//     data: { projectSlug, url: `http://${projectSlug}.localhost:8000` },
//   });
// });

// async function initRedisSubscribe() {
//   console.log("Subscribed to logs....");
//   subscriber.psubscribe("logs:*");
//   subscriber.on("pmessage", (pattern, channel, message) => {
//     io.to(channel).emit("message", message);
//   });
// }

// initRedisSubscribe();
// app.listen(PORT, () => {
//   console.log(`API server is running on port ${PORT}`);
// });
