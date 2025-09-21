import { useRef } from "react";
import { useEffect } from "react";
import { Terminal as XTerminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import socket from "../../socket";
const Terminal = () => {
  const terminalRef = useRef(null);
  const isRendered = useRef(false);
  useEffect(() => {
    // if (isRendered.current) return;
    // isRendered.current = true;
    const terminal = new XTerminal({
      rows: 30,
    });

    console.log("testinasd");

    terminal.open(terminalRef.current);
    // Focus the terminal so user can type
    terminal.focus();

    terminal.onData((data) => {
      socket.emit("terminal:write", data);
    });

    socket.on("terminal:data", (data) => {
      terminal.write(data);
    });

    return () => {
      socket.off("terminal:data");
      terminal.dispose();
    };
  }, []);
  return (
    <>
      <div ref={terminalRef} id="terminal" />
    </>
  );
};

export default Terminal;
