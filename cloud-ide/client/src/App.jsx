import Terminal from "./component/terminal";

const App = () => {
  return (
    <div className="playground-container">
      <div className="editor-container">
        <div className="editor"></div>
      </div>
      <div className="terminal-container">
        <Terminal />
      </div>
    </div>
  );
};

export default App;
