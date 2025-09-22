const http = require("http");
const express = require("express");
const { Server: SocketServer } = require("socket.io");
const pty = require("node-pty-prebuilt-multiarch");
const os = require("os");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

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
app.use(cors());
chokidar.watch("./user").on("all", (event, path) => {
  io.emit("file:refresh", path);
  console.log(event, path);
});
app.get("/get-file-tree", async (req, res) => {
  const fileTree = await generateFileTree("./user");
  res.json({ tree: fileTree });
});
async function generateFileTree(directory) {
  const tree = {};
  async function buildTree(currentDir, obj) {
    const files = await fs.readdir(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        obj[file] = {};
        await buildTree(filePath, obj[file]);
      } else {
        obj[file] = null;
      }
    }
  }
  await buildTree(directory, tree);
  return tree;
}

ptyProcess.onData((data) => {
  io.emit("terminal:data", data);
});

server.listen(9000, () => {
  console.log("🚀 Server is running on port 9000");
});
