const net = require("net");

const server = net.createServer((connection) => {
  console.log("=====================Client Connected! ==================");
});

server.listen(8000, () => {
  console.log(
    "=========================Connecting to the custom redis server========================="
  );
});
