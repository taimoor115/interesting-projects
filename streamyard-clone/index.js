import http from "http";
import express from "express";
import { Server as SocketIO } from "socket.io";
import { spawn } from "child_process";

import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new SocketIO(server);
const options = [
  "-i",
  "pipe:0",
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-tune",
  "zerolatency",
  "-b:v",
  "800k",
  "-g",
  "-keyint_min",
  "-crf",
  "25",
  "-pix_fmt",
  "yuv420p",
  "-f",
  "flv",
  `rtmp://a.rtmp.youtube.com/live2`, // output (placeholder RTMP URL)
];

const ffmpegProcess = spawn("ffmpeg", options);
ffmpegProcess.stdout.on("data", (data) => {
  console.log("FFPEG stdout data", data);
});

ffmpegProcess.stderr.on("data", (data) => {
  console.error("FFMPEG stderr data", data);
});

ffmpegProcess.on("close", (data) => {
  console.log("FFMPEG process closed with code:", data);
});

io.on("connection", (socket) => {
  console.log("Testing....", socket.id);
  socket.on("stream_data", (data) => {
    console.log(data);
    ffmpegProcess.stdin.write(data, (err) => {
      console.error("Error writing data to ffmpegProcess stdin:", err);
    });
  });
});



app.use(express.static(path.resolve("./public")));
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
