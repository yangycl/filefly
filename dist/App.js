import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Main from "./main";
import "./App.css";
function App() {
    const [mode, setMode] = useState("idle");
    return (_jsxs("div", { className: "container", children: [_jsx("div", { className: "title", children: "FileFloat" }), _jsx("div", { className: "subtitle", children: "Fast local file transfer" }), mode === "idle" && (_jsxs("div", { className: "card", children: [_jsx("button", { onClick: () => setMode("send"), children: "\uD83D\uDCE4 Send File" }), _jsx("button", { className: "secondary", onClick: () => setMode("receive"), children: "\uD83D\uDCE5 Receive File" })] })), mode !== "idle" && (_jsx(Main, { mode: mode, onExit: () => setMode("idle") }))] }));
}
export default App;
//# sourceMappingURL=App.js.map