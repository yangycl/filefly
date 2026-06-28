README.md
FileFly

Fast peer-to-peer file transfer using QR code + WebRTC.

No cloud. No upload. Direct device-to-device transfer.

Features
QR code pairing between devices
Peer-to-peer WebRTC connection
No server file transfer (direct P2P)
Mobile-friendly web app
Works in browser (no installation required)
Concept

FileFly uses QR codes to exchange connection data between devices.

Flow:

Sender creates a room
QR code is generated
Receiver scans QR code
WebRTC connection is established
Files are transferred directly (P2P)
Tech Stack
React
TypeScript
WebRTC
qrcode.react
html5-qrcode
Installation

git clone https://github.com/yourname/FileFly.git
cd FileFly
npm install
npm run dev

Build

npm run build

Usage

Sender:

Click Send File
Generate QR code
Share QR with receiver

Receiver:

Click Receive File
Scan QR code
Connect automatically
Roadmap
File chunking system
Progress bar
Multi-file transfer
Encryption support
PWA support
Better mobile UX
Contributing

Pull requests are welcome.

Fork repo
Create branch
Submit PR
Issues

Open an issue if you find bugs or ideas.

License

MIT License
