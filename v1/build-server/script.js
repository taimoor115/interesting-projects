const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const mime = require("mime-types");
const Redis = require("ioredis");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const publisher = new Redis({
  host:
    process.env.REDIS_HOST ||
    "redis-18742.c252.ap-southeast-1-1.ec2.redns.redis-cloud.com",
  port: parseInt(process.env.REDIS_PORT || "18742", 10),
  password: process.env.REDIS_PASSWORD || "Swkefr8L8Uhaswm7n2IagbU0pAxKPsYw",
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  lazyConnect: true,
});

publisher.on("connect", () => console.log("Redis: connecting..."));
publisher.on("ready", () => console.log("Redis: ready"));
publisher.on("error", (err) => console.error("Redis error:", err));
publisher.on("close", () => console.log("Redis: connection closed"));

(async () => {
  try {
    await publisher.connect();
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;
function publishLog(log) {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}

async function init() {
  console.log("Executing script.js");
  publishLog("Build Started...");
  const outDirPath = path.join(__dirname, "output");

  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", function (data) {
    console.log(data.toString());
    publishLog(data.toString());
  });

  p.stdout.on("error", function (data) {
    console.log("Error", data.toString());
    publishLog(`error: ${data.toString()}`);
  });

  p.on("close", async function () {
    console.log("Build Complete");
    publishLog(`Build Complete`);
    const distFolderPath = path.join(__dirname, "output", "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    publishLog(`Starting to upload`);
    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading", filePath);
      publishLog(`uploading ${file}`);

      const command = new PutObjectCommand({
        Bucket: "vercel-clone-outputs",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      publishLog(`uploaded ${file}`);
      console.log("uploaded", filePath);
    }
    publishLog(`Done`);
    console.log("Done...");
  });
}

init();
