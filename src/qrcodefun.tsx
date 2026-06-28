import { QRCodeCanvas } from "qrcode.react";
import React, { type JSXElementConstructor } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";


export function generateQRCode(roomId: string) {
  return roomId;
}

import { Html5Qrcode } from "html5-qrcode";

let scanner: Html5Qrcode | null = null;

export function Scanner(): Promise<string> {
  return new Promise((resolve, reject) => {
    const elementId = "qr-reader";

    scanner = new Html5Qrcode(elementId);

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText) => {

          scanner?.stop().then(() => {
            scanner?.clear();
          });

          resolve(decodedText);
        },
        (error) => {

        }
      )
      .catch((err) => {
        reject(err);
      });
  });
}
