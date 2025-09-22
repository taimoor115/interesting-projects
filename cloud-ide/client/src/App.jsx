import { useEffect } from "react";
import Terminal from "./component/terminal";
import { useState } from "react";
import FileTree from "./component/tree";
import socket from "../socket";

const App = () => {
  const [tree, setTree] = useState({});

  const fetchFileTree = async () => {
    try {
      const response = await fetch("http://localhost:9000/get-file-tree");
      const data = await response.json();
      setTree(data.tree);
    } catch (error) {
      console.error("Error fetching file tree:", error);
    }
  };

  useEffect(() => {
    socket.on("file:refresh", fetchFileTree);
    return () => {
      socket.off("file:refresh", fetchFileTree);
    };
  }, []);

  useEffect(() => {
    fetchFileTree();
  }, []);
  return (
    <div className="playground-container">
      <div className="editor-container">
        <div className="files">
          <FileTree
            onSelect={(path) => {
              // setSelectedFileContent("");
              // setSelectedFile(path);
            }}
            tree={tree}
          />
        </div>
        <div className="editor"></div>
      </div>
      <div className="terminal-container">
        <Terminal />
      </div>
    </div>
  );
};

export default App;
