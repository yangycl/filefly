import { useState } from "react";
import Transfer from "./Transfer";
import "./App.css";

type Mode = "idle" | "send" | "receive";
export default function App() {
  const [mode, setMode] = useState<Mode>("idle");
  return (
    <main className="container">
      <header className="hero">
        <div className="brand-mark">✦</div>
        <div className="title">FileFly</div>
        <p className="subtitle">用 QR Code 配對，透過 WebRTC 點對點傳送檔案</p>
      </header>
      {mode === "idle" ? <>
        <section className="card">
          <h2>不經雲端，直接傳輸</h2>
          <p>用另一台裝置掃描 QR Code 配對。檔案內容直接經由 WebRTC 傳送，不會上傳到 GitHub。</p>
          <button onClick={() => setMode("send")}>📤 我要傳送檔案</button>
          <button className="secondary" onClick={() => setMode("receive")}>📥 我要接收檔案</button>
        </section>
        <section className="card explanation">
          <h3>如何配對？</h3>
          <ol>
            <li>傳送端建立 Offer QR Code。</li>
            <li>接收端掃描 Offer，產生 Answer QR Code。</li>
            <li>傳送端再掃描 Answer，等待 WebRTC 連線。</li>
            <li>連線成功後選擇檔案並傳送。</li>
          </ol>
        </section>
        <p className="privacy-note">相機掃描需要 HTTPS 與相機權限。某些網路環境可能需要 TURN 中繼服務。</p>
      </> : <Transfer mode={mode} onExit={() => setMode("idle")} />}
      <footer>FileFly · QR pairing + WebRTC DataChannel</footer>
    </main>
  );
}
