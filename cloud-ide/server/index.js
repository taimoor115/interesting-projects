const http = require("http");
const express = require("express");
const { Server: SocketServer } = require("socket.io");
const pty = require("node-pty-prebuilt-multiarch");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
  },
});

let shell;
if (os.platform() === "win32") {
  shell = "C:\\Program Files\\Git\\bin\\bash.exe";
} else {
  shell = "bash";
}

const ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: process.env.INIT_CWD || process.cwd(),
  env: process.env,
});

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  socket.on("terminal:write", (data) => {
    if (data === "\r") {
      ptyProcess.write("\r");
    } else {
      ptyProcess.write(data);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

ptyProcess.onData((data) => {
  io.emit("terminal:data", data);
});

server.listen(9000, () => {
  console.log("🚀 Server is running on port 9000");
});
