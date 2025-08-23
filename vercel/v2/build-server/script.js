const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const mime = require("mime-types");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Kafka } = require("kafkajs");
async function cleanupAndExit(code) {
    try {
      await producer.disconnect();
    } catch (e) {
      console.error("Error disconnecting producer:", e);
    }
    try {
      await s3Client.destroy();
    } catch (e) {
      console.error("Error destroying S3 client:", e);
    }
  
    process.exit(code);
  }
  
const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;

const kafka = new Kafka({
  clientId: `docker-build-server-${PROJECT_ID}`,
  brokers: [""],
  ssl: { ca: fs.readFileSync(path.join(__dirname, "kafka.pem"), "utf-8") },
  sasl: {
    mechanism: "plain",
    username: "",
    password: "",
  },
});

async function publishLog(log) {
  await producer.send({
    topic: "",
    messages: [
      {
        key: "log",
        value: JSON.stringify({ PROJECT_ID, DEPLOYMENT_ID, log }),
      },
    ],
  });
}
const producer = kafka.producer();
async function init() {
  await producer.connect();
  console.log("Executing script.js");
  await publishLog("Build Started...");
  const outDirPath = path.join(__dirname, "output");

  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", async function (data) {
    console.log(data.toString());
    await publishLog(data.toString());
  });

  p.stderr.on("data", async function (data) {
    console.error("Error:", data.toString());
    await publishLog(`error: ${data.toString()}`);
  });

  p.on("close", async function () {
    console.log("Build Complete");
    await publishLog("Build Complete");
  
    const distFolderPath = path.join(outDirPath, "dist");
    if (!fs.existsSync(distFolderPath)) {
      console.error("Dist folder not found!");
      await publishLog("Dist folder not found!");
      await cleanupAndExit(1); 
      return;
    }
  
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });
  
    await publishLog("Starting to upload");
  
    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;
  
      console.log("Uploading", filePath);
      await publishLog(`Uploading ${file}`);
  
      const command = new PutObjectCommand({
        Bucket: "",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath) || "application/octet-stream",
      });
  
      await s3Client.send(command);
      await publishLog(`Uploaded ${file}`);
      console.log("Uploaded", filePath);
    }
  
    await publishLog("Done");
    console.log("Done...");
  
    await publishLog(`Check deploy site ${PROJECT_ID}.localhost:8000`);
  
    await cleanupAndExit(0); 
  });
  
}

init();
