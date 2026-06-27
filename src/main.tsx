import { useState } from "react";
import { Scanner } from "./qrcodefun";
import "./App.css";

type Mode = "send" | "receive";

export default function Main({
  mode,
  onExit,
}: {
  mode: Mode;
  onExit: () => void;
}) {
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState("");

  function logMsg(msg: string) {
    setLog((p) => p + "\n" + msg);
  }

  async function startSend() {
    const id = crypto.randomUUID();
    setRoomId(id);

    logMsg("Room created: " + id);
  }

  async function startReceive() {
    const scanned = await Scanner();
    setRoomId(scanned);

    logMsg("Joined: " + scanned);

    setTimeout(() => {
      setConnected(true);
      logMsg("Connected!");
    }, 1000);
  }

  function sendFile() {
    logMsg("Sending file...");
    setTimeout(() => logMsg("Done"), 500);
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{mode.toUpperCase()}</strong>
        <button className="secondary" onClick={onExit}>
          Exit
        </button>
      </div>

      {!connected && mode === "send" && (
        <button onClick={startSend}>Create Room</button>
      )}

      {!connected && mode === "receive" && (
        <button onClick={startReceive}>Scan QR</button>
      )}

      {connected && (
        <button onClick={sendFile}>Send File</button>
      )}

      <div className="log" style={{ marginTop: 12 }}>
        {log}
      </div>
    </div>
  );
}