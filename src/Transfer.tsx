import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";

type Mode = "send" | "receive";
type TransferProps = { mode: Mode; onExit: () => void };
const CHUNK_SIZE = 16 * 1024;
const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    }, 12000);
    const check = () => {
      if (pc.iceGatheringState === "complete") {
        window.clearTimeout(timeout);
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", check);
  });
}
function formatBytes(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
  return (n / 1048576).toFixed(1) + " MB";
}

export default function Transfer({ mode, onExit }: TransferProps) {
  const pc = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | null>(null);
  const scanner = useRef<Html5Qrcode | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const receivedBytes = useRef(0);
  const fileSizeRef = useRef(0);
  const filenameRef = useRef("received-file");
  const scanParts = useRef(new Map<string, { total: number; parts: Map<number, string> }>());
  const [qr, setQr] = useState("");
  const [qrId, setQrId] = useState("");
  const [qrPage, setQrPage] = useState(0);
  const qrParts = qr ? (qr.match(/[\s\S]{1,700}/g) || [qr]) : [];
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("received-file");
  const [fileSize, setFileSize] = useState(0);
  const [progress, setProgress] = useState(0);
  const [readyToDownload, setReadyToDownload] = useState(false);
  const [status, setStatus] = useState("尚未配對");
  const [error, setError] = useState("");

  useEffect(() => {
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.current = peer;
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        setConnected(true); setStatus("已連線，可以傳輸檔案");
      } else if (peer.connectionState === "failed") {
        setStatus("連線失敗；請重新配對或嘗試同一個 Wi-Fi 網路");
      } else if (peer.connectionState === "disconnected") setStatus("連線中斷");
    };
    peer.ondatachannel = (event) => attachChannel(event.channel);
    return () => {
      void stopScanner();
      channel.current?.close();
      peer.close();
    };
  }, []);

  function attachChannel(dc: RTCDataChannel) {
    channel.current = dc;
    dc.binaryType = "arraybuffer";
    dc.bufferedAmountLowThreshold = 256 * 1024;
    dc.onopen = () => { setConnected(true); setStatus("已連線，可以傳輸檔案"); };
    dc.onclose = () => { setConnected(false); setStatus("資料通道已關閉"); };
    dc.onerror = () => setError("WebRTC 資料通道發生錯誤。");
    dc.onmessage = (event) => {
      if (typeof event.data === "string") {
        if (event.data.startsWith("FILE_META:")) {
          try {
            const meta = JSON.parse(event.data.slice(10));
            chunks.current = []; receivedBytes.current = 0;
            filenameRef.current = String(meta.name || "received-file");
            fileSizeRef.current = Number(meta.size) || 0;
            setFilename(filenameRef.current);
            setFileSize(fileSizeRef.current); setProgress(0); setReadyToDownload(false);
            setStatus("正在接收：" + String(meta.name || "檔案"));
          } catch { setError("無法讀取檔案資訊。"); }
        } else if (event.data === "FILE_DONE") {
          setReadyToDownload(true); setProgress(100); setStatus("接收完成：" + filenameRef.current);
        } else if (event.data.startsWith("FILE_ERROR:")) setError(event.data.slice(11));
        return;
      }
      if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
        chunks.current.push(event.data);
        receivedBytes.current += event.data instanceof Blob ? event.data.size : event.data.byteLength;
        setProgress(fileSizeRef.current > 0 ? Math.min(99, Math.round(receivedBytes.current / fileSizeRef.current * 100)) : 0);
      }
    };
  }

  async function createOffer() {
    setError("");
    try {
      const peer = pc.current;
      if (!peer) throw new Error("WebRTC 尚未初始化");
      const dc = peer.createDataChannel("filefly-files", { ordered: true });
      attachChannel(dc); setStatus("正在準備配對 QR Code…");
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await waitForIceGathering(peer);
      setQr(JSON.stringify(peer.localDescription));
      setQrId(Math.random().toString(36).slice(2, 10)); setQrPage(0);
      setStatus("請讓接收端掃描此 Offer QR Code");
    } catch (e) { setError(e instanceof Error ? e.message : "建立配對資料失敗"); }
  }

  async function createAnswer(text: string) {
    setError("");
    try {
      const peer = pc.current;
      if (!peer) throw new Error("WebRTC 尚未初始化");
      const offer = JSON.parse(text) as RTCSessionDescriptionInit;
      if (offer.type !== "offer" || !offer.sdp) throw new Error("這不是有效的 Offer QR Code");
      setStatus("正在建立 Answer…");
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await waitForIceGathering(peer);
      setQr(JSON.stringify(peer.localDescription));
      setQrId(Math.random().toString(36).slice(2, 10)); setQrPage(0);
      setStatus("請讓傳送端掃描此 Answer QR Code");
    } catch (e) { setError(e instanceof Error ? e.message : "讀取 Offer 失敗"); }
  }

  async function acceptAnswer(text: string) {
    setError("");
    try {
      const answer = JSON.parse(text) as RTCSessionDescriptionInit;
      if (answer.type !== "answer" || !answer.sdp) throw new Error("這不是有效的 Answer QR Code");
      await pc.current?.setRemoteDescription(answer);
      setQr(""); setStatus("Answer 已接收，正在連線…");
    } catch (e) { setError(e instanceof Error ? e.message : "讀取 Answer 失敗"); }
  }

  async function stopScanner() {
    const current = scanner.current;
    scanner.current = null;
    if (!current) return;
    try { if (current.isScanning) await current.stop(); current.clear(); } catch { /* camera already stopped */ }
    setScanning(false);
  }

  async function scanQr(callback: (value: string) => Promise<void>) {
    setError(""); setStatus("請允許相機權限，並對準另一台裝置的 QR Code"); setScanning(true);
    scanParts.current.clear();
    try {
      const reader = new Html5Qrcode("filefly-reader");
      scanner.current = reader;
      await reader.start({ facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        async (value) => {
          if (value.startsWith("FILEFLY1|")) {
            const fields = value.split("|");
            if (fields.length < 5) return;
            const id = fields[1], index = Number(fields[2]), total = Number(fields[3]);
            if (!Number.isInteger(index) || !Number.isInteger(total) || index < 1 || total < 1 || index > total) return;
            let entry = scanParts.current.get(id);
            if (!entry) { entry = { total, parts: new Map<number, string>() }; scanParts.current.set(id, entry); }
            entry.parts.set(index, fields.slice(4).join("|"));
            setStatus("已掃描配對資料 " + entry.parts.size + " / " + total + " 張 QR Code；請繼續掃描");
            if (entry.parts.size < total) return;
            const full = Array.from({ length: total }, (_, i) => entry?.parts.get(i + 1) || "").join("");
            await stopScanner(); await callback(full); return;
          }
          await stopScanner(); await callback(value);
        }, () => undefined);
    } catch (e) {
      await stopScanner();
      setError("無法啟動相機：" + (e instanceof Error ? e.message : String(e)) + "。請確認使用 HTTPS 並允許相機權限。");
    }
  }

  async function sendFile() {
    const dc = channel.current;
    if (!file || !dc || dc.readyState !== "open") { setError("請先連線，並選擇檔案。"); return; }
    setError(""); setProgress(0); setStatus("正在傳送：" + file.name);
    try {
      dc.send("FILE_META:" + JSON.stringify({ name: file.name, size: file.size, type: file.type }));
      let offset = 0;
      while (offset < file.size) {
        if (dc.readyState !== "open") throw new Error("連線已中斷");
        while (dc.bufferedAmount > 512 * 1024) {
          await new Promise((resolve) => window.setTimeout(resolve, 25));
          if (dc.readyState !== "open") throw new Error("連線已中斷");
        }
        const buffer = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
        dc.send(buffer); offset += buffer.byteLength;
        setProgress(Math.round(offset / file.size * 100));
      }
      dc.send("FILE_DONE"); setProgress(100); setStatus("傳送完成：" + file.name);
    } catch (e) { setError(e instanceof Error ? e.message : "檔案傳送失敗"); }
  }

  function download() {
    const url = URL.createObjectURL(new Blob(chunks.current));
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="transfer">
      <div className="transfer-heading"><h2>{mode === "send" ? "📤 傳送檔案" : "📥 接收檔案"}</h2><span className={"status-dot " + (connected ? "online" : "")} /></div>
      <p className="status-text">{status}</p>
      {error && <div className="error" role="alert">{error}</div>}
      {mode === "send" && !qr && !connected && <button onClick={createOffer}>建立配對 QR Code</button>}
      {qr && <div className="qr-panel">
        <p>{mode === "send" ? "步驟 1：讓接收端掃描此 Offer QR Code" : "請讓傳送端掃描此 Answer QR Code"}</p>
        <QRCodeCanvas value={"FILEFLY1|" + qrId + "|" + (qrPage + 1) + "|" + qrParts.length + "|" + qrParts[qrPage]} size={280} level="L" marginSize={3} />
        {qrParts.length > 1 && <div className="qr-navigation">
          <button className="secondary" disabled={qrPage === 0} onClick={() => setQrPage(qrPage - 1)}>上一張</button>
          <span>第 {qrPage + 1} / {qrParts.length} 張</span>
          <button className="secondary" disabled={qrPage + 1 >= qrParts.length} onClick={() => setQrPage(qrPage + 1)}>下一張</button>
        </div>}
        {mode === "send" && !connected && <button className="secondary" onClick={() => scanQr(acceptAnswer)}>步驟 2：掃描接收端 Answer QR Code</button>}
      </div>}
      {mode === "receive" && !connected && !qr && <button onClick={() => scanQr(createAnswer)}>掃描傳送端 Offer QR Code</button>}
      <div id="filefly-reader" className="reader" />
      {scanning && <p className="scan-hint">相機啟動中…請將 QR Code 放入取景框。</p>}
      {connected && mode === "send" && <div className="file-panel">
        <label htmlFor="file-input">選擇要傳送的檔案</label>
        <input id="file-input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {file && <p className="file-info">{file.name} · {formatBytes(file.size)}</p>}
        <button disabled={!file} onClick={sendFile}>傳送檔案</button>
      </div>}
      {(connected || readyToDownload) && <div className="progress-panel">
        <div className="progress-label"><span>{readyToDownload ? "已接收" : "傳輸進度"}</span><span>{progress}%</span></div>
        <progress value={progress} max={100} />
        {mode === "receive" && fileSize > 0 && <p className="file-info">{filename} · {formatBytes(receivedBytes.current)} / {formatBytes(fileSize)}</p>}
        {readyToDownload && <button onClick={download}>下載 {filename}</button>}
      </div>}
      <button className="secondary" onClick={onExit}>返回</button>
    </section>
  );
}
