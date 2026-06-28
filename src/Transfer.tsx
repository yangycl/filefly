import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";


type Mode = "send" | "receive";


type TransferProps = {
  mode: Mode;
  onExit: () => void;
};



export default function Transfer({
  mode,
  onExit,
}: TransferProps) {


  const pc = useRef(
    new RTCPeerConnection()
  );


  const channel =
    useRef<RTCDataChannel | null>(null);


  const [qr, setQr] =
    useState("");


  const [connected, setConnected] =
    useState(false);


  const [file, setFile] =
    useState<File | null>(null);


  const [chunks, setChunks] =
    useState<ArrayBuffer[]>([]);


  const [filename, setFilename] =
    useState("file");


  const scanner =
    useRef<Html5Qrcode | null>(null);





  // ----------------
  // SEND
  // ----------------


  async function createOffer() {


    const dc =
      pc.current.createDataChannel(
        "file"
      );


    channel.current = dc;


    dc.onopen = () => {

      console.log(
        "send connected"
      );

      setConnected(true);
    };



    const offer =
      await pc.current.createOffer();


    await pc.current.setLocalDescription(
      offer
    );


    setQr(
      JSON.stringify(
        pc.current.localDescription
      )
    );

  }






  // ----------------
  // RECEIVE
  // ----------------


  function setupReceiveChannel() {


    pc.current.ondatachannel =
      e => {


        const dc =
          e.channel;


        channel.current = dc;


        dc.binaryType =
          "arraybuffer";



        dc.onopen = () => {

          setConnected(true);

        };



        dc.onmessage =
          event => {


            if(
              event.data === "DONE"
            ){

              return;

            }


            setChunks(
              old => [
                ...old,
                event.data
              ]
            );

          };


      };

  }







  async function createAnswer(
    text:string
  ){


    setupReceiveChannel();



    const offer =
      JSON.parse(text);



    await pc.current.setRemoteDescription(
      offer
    );



    const answer =
      await pc.current.createAnswer();



    await pc.current.setLocalDescription(
      answer
    );



    setQr(
      JSON.stringify(
        pc.current.localDescription
      )
    );

  }






  async function acceptAnswer(
    text:string
  ){


    await pc.current.setRemoteDescription(
      JSON.parse(text)
    );


  }









  async function scan(
    callback:(v:string)=>void
  ){


    scanner.current =
      new Html5Qrcode(
        "reader"
      );


    await scanner.current.start(

      {
        facingMode:"environment"
      },

      {
        fps:10,
        qrbox:250
      },


      async value => {


        await scanner.current?.stop();


        scanner.current?.clear();


        callback(value);

      },


      ()=>{}

    );

  }









  // ----------------
  // FILE SEND
  // ----------------


  function sendFile(){


    if(
      !file ||
      !channel.current
    )
      return;



    const size =
      16 * 1024;


    let offset = 0;



    const reader =
      new FileReader();



    reader.onload = e => {


      if(
        e.target?.result
      ){

        channel.current!
          .send(
            e.target.result
          );

      }


      offset += size;



      if(
        offset < file.size
      ){

        read();

      }else{

        channel.current!
          .send("DONE");

      }

    };



    function read(){

      reader.readAsArrayBuffer(

        file.slice(
          offset,
          offset + size
        )

      );

    }



    read();

  }







  function download(){


    const blob =
      new Blob(
        chunks
      );


    const url =
      URL.createObjectURL(
        blob
      );



    const a =
      document.createElement("a");


    a.href=url;


    a.download =
      filename;



    a.click();


  }









  return (

    <div>


      <h2>
        {mode.toUpperCase()}
      </h2>



      <p>
        {connected
          ? "🟢 Connected"
          : "⚪ Waiting"}
      </p>





      {mode==="send" && !qr && (

        <button
          onClick={createOffer}
        >
          Create QR
        </button>

      )}



      {qr && (

        <div className="qr-box">
          <QRCodeCanvas
            value={qr}
            size={240}
          />
        </div>

      )}







      {mode==="receive" && !connected && (

        <>

          <button
            onClick={()=>scan(createAnswer)}
          >
            Scan Offer
          </button>


          <div id="reader"/>

        </>

      )}






      {mode==="send" && connected && (

        <>

          <input
            type="file"
            onChange={
              e =>
              setFile(
                e.target.files?.[0] ?? null
              )
            }
          />


          <button
            onClick={sendFile}
          >
            Send File
          </button>


        </>

      )}







      {chunks.length > 0 && (

        <button
          onClick={download}
        >
          Download
        </button>

      )}






      <button onClick={onExit}>
        Exit
      </button>


    </div>

  );
}