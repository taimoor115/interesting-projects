const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const mime = require("mime-types");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const Redis = require("ioredis");

// Connect to local Redis
const publisher = new Redis({
  host: "host.docker.internal", // Use this for Docker on Windows/macOS
  port: 6379,
});

publisher.on("connect", () => {
  console.log("Connected to Redis locally!");
});

publisher.on("error", (err) => {
  console.error("Redis error:", err);
});

console.warn("===========TESTING=============");

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

  p.stderr.on("data", function (data) {
    console.error("Error:", data.toString());
    publishLog(`error: ${data.toString()}`);
  });

  p.on("close", async function () {
    console.log("Build Complete");
    publishLog("Build Complete");

    const distFolderPath = path.join(outDirPath, "dist");
    if (!fs.existsSync(distFolderPath)) {
      console.error("Dist folder not found!");
      return;
    }

    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    publishLog("Starting to upload");
    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("Uploading", filePath);
      publishLog(`Uploading ${file}`);

      const command = new PutObjectCommand({
        Bucket: "",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath) || "application/octet-stream",
      });

      await s3Client.send(command);
      publishLog(`Uploaded ${file}`);
      console.log("Uploaded", filePath);
    }

    publishLog("Done");
    console.log("Done...");

    publishLog(`Check deploy site ${PROJECT_ID}.localhost:8000`);
  });
}

init();
