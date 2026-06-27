import { jsx as _jsx } from "react/jsx-runtime";
import { QRCodeCanvas } from "qrcode.react";
import React, {} from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";
export function generateQRCode(roomId) {
    return roomId;
}
export function Scanner() {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: 250,
        }, false);
        scanner.render((decodedText) => {
            console.log("scan:", decodedText);
            //ex: room id
        }, (error) => {
            // 掃描失敗會一直回報，通常不用處理
        });
        return () => {
            scanner.clear();
        };
    }, []);
    return _jsx("div", { id: "reader" });
}
//# sourceMappingURL=qrcodefun.js.map