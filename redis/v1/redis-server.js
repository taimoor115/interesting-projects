const net = require("net");
const Parser = require("redis-parser");

const server = net.createServer((connection) => {
  console.log("=====================Client Connected! ==================");
  const store = {};

  const parser = new Parser({
    returnReply: (reply) => {
      if (!Array.isArray(reply) || reply.length === 0) {
        connection.write("-ERR invalid command format\r\n");
        return;
      }

      const command = (reply[0] || '').toLowerCase();
      
      switch (command) {
        case 'set': {
          if (reply.length < 3) {
            connection.write("-ERR wrong number of arguments for 'set' command\r\n");
            return;
          }
          const key = reply[1];
          const value = reply[2];
          store[key] = value;
          connection.write("+OK\r\n");
          break;
        }
        case 'get': {
          if (reply.length < 2) {
            connection.write("-ERR wrong number of arguments for 'get' command\r\n");
            return;
          }
          const key = reply[1];
          const value = store[key];
          if (value === undefined) {
            connection.write("$-1\r\n");  // Redis nil response
          } else {
            connection.write(`$${value.length}\r\n${value}\r\n`);
          }
          break;
        }
        default:
          connection.write(`-ERR unknown command '${command}'\r\n`);
      }
    },
    returnError: (error) => {
      console.log("Error:", error);
      connection.write(`-ERR ${error.message}\r\n`);
    },
  });

  connection.on("data", (data) => {
    parser.execute(data);
  });

  connection.on("error", (error) => {
    console.error("Connection error:", error);
  });
});

server.listen(8000, () => {
  console.log("Redis server running on port 8000");
});

// Handle server errors
server.on("error", (error) => {
  console.error("Server error:", error);
});
