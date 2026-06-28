import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Mode = "send" | "receive";

type TransferProps = {
  mode: Mode;
  onExit: () => void;
};


export default function Transfer({
  mode,
  onExit,
}: TransferProps) {

  const [qr, setQr] = useState("");


  function createQR() {

    const payload = {
      type: mode === "send" ? "offer" : "answer",
      room: crypto.randomUUID(),
      time: Date.now(),
    };


    setQr(
      JSON.stringify(payload)
    );
  }


  return (
    <div>

      <h2>
        {mode.toUpperCase()}
      </h2>


      {mode === "send" && (
        <p>
          產生 QR 給接收端掃
        </p>
      )}


      {mode === "receive" && (
        <p>
          等待掃描
        </p>
      )}



      <button onClick={createQR}>
        Generate QR
      </button>


      {qr && (
        <div>

          <QRCodeCanvas
            value={qr}
            size={240}
          />

          <textarea
            readOnly
            value={qr}
            
          />

        </div>
      )}



      <button onClick={onExit}>
        Exit
      </button>

    </div>
  );
}