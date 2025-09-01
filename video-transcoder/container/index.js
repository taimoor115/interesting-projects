const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs").promises;
const fsOld = require("fs");
const ffmpeg = require("fluent-ffmpeg");

const RESOLUTIONS = [
  {
    name: "360p",
    width: 480,
    height: 360,
  },
  {
    name: "480p",
    width: 858,
    height: 480,
  },
  {
    name: "720p",
    width: 1280,
    height: 720,
  },
];

const s3 = new S3Client({
  region: "",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});

const BUCKET = process.env.BUCKET_NAME;
const KEY = process.env.KEY;

async function init() {
  console.log("Downloading video from S3...");
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: KEY,
  });

  const result = await s3.send(command);

  const originalFilePath = "original-video.mp4";

  await fs.writeFile(originalFilePath, result.Body);

  const originalVideoPath = path.resolve(originalFilePath);

  const promises = RESOLUTIONS.map((resolution) => {
    const output = `video-${resolution.name}.mp4`;
    console.log("Starting.....");

    return new Promise((resolve) => {
      console.log(`Processing video to ${resolution.name}...`);
      ffmpeg(originalVideoPath)
        .output(output)
        .withVideoCodec("libx264")
        .withAudioCodec("aac")
        .withSize(`${resolution.width}x${resolution.height}`)
        .on("end", async () => {
          const command = new PutObjectCommand({
            Bucket: "",
            Key: `transcoded/video-${resolution.name}.mp4`,
            Body: fsOld.createReadStream(path.resolve(output)),
          });

          await s3.send(command);
          console.log(`Uploading ${output} to S3...`);
          resolve(output);
        })
        .format("mp4")
        .run();
    });
  });

  await Promise.all(promises);
  console.log("All videos uploaded successfully");
  process.exit(0);
}

init();
