import http from "http";
import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

app.use(express.static(path.resolve("./public")));
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
