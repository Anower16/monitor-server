# monitor-server

A small WebRTC signaling server that pairs a **phone** (camera) with a **dashboard** (viewer), so the phone can stream live video to the dashboard as a simple remote monitor.

## How it works
- Each client connects over WebSocket and registers as either the `phone` or the `dashboard`.
- The server relays WebRTC `offer`, `answer` and ICE candidate messages between the two. The video goes peer to peer, not through this server.
- `GET /` reports whether the phone and the dashboard are connected.

## Run
```bash
npm install
npm start          # listens on PORT (default 3000)
```

Built with Node.js, Express and [ws](https://github.com/websockets/ws).
