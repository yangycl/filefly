import { useState } from "react";
import Transfer from "./Transfer";
import "./App.css";

type Mode = "idle" | "send" | "receive";

function App() {
  const [mode, setMode] = useState<Mode>("idle");

  return (
    <div className="container">
      <div className="title">FileFly</div>
      <div className="subtitle">Fast local file transfer</div>

      {mode === "idle" && (
        <div className="card">
          <button onClick={() => setMode("send")}>
            📤 Send File
          </button>

          <button
            className="secondary"
            onClick={() => setMode("receive")}
          >
            📥 Receive File
          </button>
        </div>
      )}

      {mode !== "idle" && (
        <Transfer
          mode={mode}
          onExit={() => setMode("idle")}
        />
      )}
    </div>
  );
}

export default App;
