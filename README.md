# FileFly

QR Code 配對 + WebRTC DataChannel 點對點檔案傳輸。適用於桌面瀏覽器與手機瀏覽器。

## 功能

- 使用 qrcode.react 產生 Offer / Answer QR Code。
- 使用 html5-qrcode 透過相機掃描配對 QR Code。
- 使用瀏覽器原生 WebRTC API 建立點對點連線並傳送檔案。
- 檔案以 16 KiB 區塊傳送並顯示進度。
- 靜態前端，可透過 GitHub Pages 託管；檔案內容不會上傳到網站伺服器。

## 使用方式

1. 裝置 A 開啟 FileFly，選擇「我要傳送檔案」並建立 Offer QR Code。
2. 裝置 B 選擇「我要接收檔案」，掃描 A 的 Offer QR Code。
3. B 顯示 Answer QR Code；在 A 按下掃描按鈕，掃描 B 的 Answer。
4. 等待 WebRTC DataChannel 連線成功。
5. A 選擇檔案並傳送；B 收到完成通知後按「下載」。

相機存取通常要求 HTTPS。GitHub Pages 提供 HTTPS。

## WebRTC API 說明

### RTCPeerConnection
代表本機與遠端裝置之間的 WebRTC 連線。FileFly 透過它建立連線、交換 SDP 描述並協商 ICE 網路路徑。

### createOffer() / createAnswer()
Offer 是發起端提出的連線描述；Answer 是接收端對 Offer 的回覆。此專案將包含 SDP 的 localDescription 編碼成 JSON，放入 QR Code 供另一台裝置掃描。

### setLocalDescription() / setRemoteDescription()
setLocalDescription() 設定本機 Offer 或 Answer。FileFly 等待 ICE gathering 完成後再產生 QR Code，將當時收集到的 ICE 候選位址一併帶入 SDP。另一台裝置掃描後，使用 setRemoteDescription() 設定遠端描述。

### RTCIceGatheringState
ICE gathering 會尋找可能的網路路徑。QR Code 交換方式是帶外 signaling：它取代傳統 signaling 伺服器交換 Offer / Answer 的工作，但不會取代 STUN/TURN 或 ICE 本身。

### RTCDataChannel
透過 RTCPeerConnection.createDataChannel() 建立雙向資料通道。檔案先傳送 FILE_META 中繼資料，再分塊傳送二進位資料，最後送出 FILE_DONE。接收端把區塊組成 Blob，讓使用者下載。

### STUN / TURN 限制
目前設定使用公開 STUN 伺服器 stun:stun.l.google.com:19302 協助尋找可用路徑。某些對稱 NAT、防火牆或受限制的網路會阻止直接連線；這種情況需要自行設定 TURN 中繼伺服器。TURN 可能會中繼檔案流量，與純點對點路徑不同。

## 開發

    npm ci
    npm run dev
    npm run build

## GitHub Pages

儲存庫包含 .github/workflows/deploy.yml。將變更推送到 main 後，GitHub Actions 會建置 Vite 專案並部署 dist/。若 Pages 尚未啟用，請到 Settings → Pages → Build and deployment → Source 選擇 GitHub Actions。

## 隱私與安全

檔案內容不會由 FileFly 上傳到 GitHub Pages；但配對 QR Code 包含網路連線資訊，請只與信任的裝置交換。公開 STUN 服務會看到其正常運作所需的連線請求。請勿掃描陌生人提供的配對碼。

## License

MIT
