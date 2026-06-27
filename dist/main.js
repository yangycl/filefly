import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Scanner } from "./qrcodefun";
export default function Main({ mode, onExit, }) {
    const [roomId, setRoomId] = useState("");
    const [connected, setConnected] = useState(false);
    const [log, setLog] = useState("");
    // --- fake WebRTC placeholder ---
    function logMsg(msg) {
        setLog((p) => p + "\n" + msg);
    }
    // ========== SEND ==========
    async function startSend() {
        const id = crypto.randomUUID();
        setRoomId(id);
        logMsg("Room created: " + id);
        logMsg("Waiting receiver...");
    }
    // ========== RECEIVE ==========
    async function startReceive() {
        logMsg("Waiting scan...");
        const scannedRoom = await Scanner();
        setRoomId(scannedRoom);
        logMsg("Joined room: " + scannedRoom);
        connect(scannedRoom);
    }
    // ========== CONNECT (WebRTC stub) ==========
    function connect(room) {
        logMsg("Connecting to room: " + room);
        setTimeout(() => {
            setConnected(true);
            logMsg("Connected!");
        }, 1000);
    }
    // ========== FILE SEND ==========
    function sendFile() {
        if (!connected)
            return;
        const fakeFile = "hello-file-data";
        logMsg("Sending file...");
        logMsg(fakeFile);
        setTimeout(() => {
            logMsg("File sent!");
        }, 500);
    }
    return (_jsxs("div", { children: [_jsx("h2", { children: mode.toUpperCase() }), _jsx("button", { onClick: onExit, children: "Exit" }), _jsxs("div", { style: { marginTop: 10 }, children: [!connected && mode === "send" && (_jsx("button", { onClick: startSend, children: "Create Room (Send)" })), !connected && mode === "receive" && (_jsx("button", { onClick: startReceive, children: "Scan & Join" })), connected && (_jsx("button", { onClick: sendFile, children: "Send File" }))] }), _jsx("pre", { style: { marginTop: 20 }, children: log })] }));
}
//# sourceMappingURL=main.js.map