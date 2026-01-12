

```markdown
# 📹 Mediasoup Multi-Host Video Platform (SFU)

> **⚠️ EDUCATIONAL PROJECT DISCLAIMER**
> This project was implemented strictly for **learning purposes** to understand the internals of WebRTC, Media Servers, and Signaling. It is a functional prototype designed to demonstrate how **Selective Forwarding Units (SFU)** work. It is not currently intended for production use without further security and scalability enhancements.

## 📖 Overview

This is a real-time multi-user video conferencing application. Unlike standard peer-to-peer (Mesh) WebRTC which struggles with more than 3-4 users, this project uses a **Media Server (SFU)** architecture. This allows the application to handle multiple participants efficiently by routing video streams through a central server rather than connecting every user to every other user directly.

### Key Concepts Explored
* **WebRTC:** The core standard for real-time audio/video communication.
* **SFU (Selective Forwarding Unit):** The architecture used in this project. The server receives a stream from a user and "forwards" it to other participants without modifying the video. This is CPU efficient.
* **MCU (Multipoint Control Unit):** *Contrast concept.* An MCU decodes all streams, mixes them into one single video, and encodes it again. We chose SFU (Mediasoup) over MCU because MCU is extremely CPU-intensive and expensive to run.
* **Signaling:** The handshake process (exchanging SDP/ICE candidates) done via WebSockets (Socket.io) before media flows.

## 🛠️ Tech Stack

* **Frontend:** Next.js (React), Socket.io-client
* **Backend:** Node.js, Express, Socket.io
* **Media Server:** [Mediasoup](https://mediasoup.org/) (A cutting-edge SFU library for Node.js)
* **Language:** JavaScript / TypeScript

## 🚀 Installation & Setup

This project is set up as a monorepo containing `client` and `server`.

### 1. Backend (Media Server)
The backend handles signaling and media routing.

```bash
cd server
npm install
# Start the server (Runs on port 3016)
node index.js

```

**Configuration (`server/config.js`):**
If running locally, keep `announcedIp` as `127.0.0.1`.
If running on a network (LAN/WiFi), update `announcedIp` to your machine's local IP (e.g., `192.168.x.x`).

### 2. Frontend (Client)

The frontend connects to the backend and renders the video grid.

```bash
cd client
npm install
# Start the client (Runs on port 3000)
npm run dev

```

**Configuration (`client/pages/room.js`):**
Ensure the socket connection points to your server:

```javascript
const socket = io("http://localhost:3016"); // Or your LAN IP

```

## 📱 Running on Mobile / LAN

To test with multiple devices (e.g., Laptop + Phone), you cannot use `localhost`.

1. **Find your IP:** Run `ipconfig` (Win) or `ifconfig` (Mac/Linux) to find your LAN IP (e.g., `10.197.253.108`).
2. **Server Config:** Update `server/config.js` -> `announcedIp: '10.197.253.108'`.
3. **Client Config:** Update `client/pages/room.js` -> `io("http://10.197.253.108:3016")`.
4. **Next.js Config:** Update `client/next.config.mjs` to allow the IP in `allowedDevOrigins`.
5. **HTTPS (Critical):** Browsers block cameras on insecure (HTTP) IPs.
* **Recommended:** Use [ngrok](https://ngrok.com) to tunnel your localhost: `ngrok http 3000`.



## 🧩 Architecture Flow

1. **Join:** User connects via Socket.io.
2. **Capabilities:** Client asks Server: "What codecs (VP8/H264) do you support?"
3. **Transport:** Client creates a `SendTransport` (to upload video) and `RecvTransport` (to download others).
4. **Produce:** Client sends video to the server.
5. **Consume:** Other clients are notified (`newProducer` event) and subscribe to the new stream.

## 🐛 Troubleshooting

* **Black Screen (Local):** Another app (Zoom/Teams) might be using the camera. Close them.
* **Black Screen (Remote):** Likely an IP issue. The server must "announce" a reachable IP, not `127.0.0.1` if users are on different devices.
* **`navigator.mediaDevices` is undefined:** You are not using HTTPS or localhost. Browser security blocks the camera.

## 📜 License

MIT License. Free for educational use.

```

```