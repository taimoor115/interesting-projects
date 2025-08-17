const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const mime = require("mime-types");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Starting build server script...");
  const outputDir = path.join(__dirname, "output");
  console.log(`Output directory: ${outputDir}`);

  const p = exec(`cd ${outputDir} && npm install && npm run build`);
  p.stdout.on("data", function (data) {
    console.log(`stdout: ${data?.toString()}`);
  });

  p.stdout.on("error", function (err) {
    console.error(`Error: ${err?.toString()}`);
  });

  p.on("close", async function (code) {
    if (code === 0) {
      console.log("Build completed successfully.");
      const distFolder = path.join(outputDir, "dist");
      const distFolderContent = fs.readdirSync(distFolder, {
        recursive: true,
      });

      for (const file of distFolderContent) {
        const filePath = path.join(distFolder, file);
        console.log(`Uploading file: ${filePath}`);

        if (fs.lstatSync(filePath).isDirectory()) continue;

        const command = new PutObjectCommand({
          Bucket: "s3-assets-store",
          Key: `__outputs/${PROJECT_ID}/${filePath}`,
          Body: fs.createReadStream(filePath),
          ContentType: mime.lookup(filePath),
        });

        const result = await s3Client.send(command);
        console.log("🚀 ~ init ~ result:", result);
      }
    } else {
      console.error(`Build process exited with code ${code}`);
    }
  });
}

init();
