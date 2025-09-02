const { SMTPServer } = require("smtp-server");

const server = new SMTPServer({
  // onAuth(auth, session, callback) {
  //     if (auth.username !== "user" || auth.password !== "pass") {
  //         return callback(new Error("Invalid username or password"));
  //     }
  //     callback(null, { user: 123 });
  // },
  allowInsecureAuth: true,
  authOptional: true,
  onConnect(session, cb) {
    console.log("New Connection", session.id);
    cb();
  },
  onMailFrom(address, session, callback) {
    console.log(`Mail from: ${address.address} ${session.id}`);
    callback();
  },

  onRcptTo(address, session, callback) {
    console.log(`Mail to: ${address.address} ${session.id}`);
    callback();
  },
  onData(stream, session, callback) {
    console.log(`Data ${session.id}`);
    stream.on("data", (data) => {
      console.log(data);
    });
    stream.on("end", () => {
      console.log("End");
      callback();
    });
  },
});

server.listen(25, () => {
  console.warn(`Server is running on the port 25`);
});
