const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Store connected clients
let phoneClient = null;
let dashboardClient = null;

app.get('/', (req, res) => {
  res.json({ 
    status: 'Monitor Signaling Server Running',
    phone: phoneClient ? 'connected' : 'disconnected',
    dashboard: dashboardClient ? 'connected' : 'disconnected'
  });
});

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Register client type
      if (data.type === 'register') {
        if (data.role === 'phone') {
          phoneClient = ws;
          console.log('Phone registered!');
          // Notify dashboard
          if (dashboardClient && dashboardClient.readyState === WebSocket.OPEN) {
            dashboardClient.send(JSON.stringify({ type: 'phone_connected' }));
          }
        } else if (data.role === 'dashboard') {
          dashboardClient = ws;
          console.log('Dashboard registered!');
          // Notify dashboard if phone is connected
          if (phoneClient && phoneClient.readyState === WebSocket.OPEN) {
            dashboardClient.send(JSON.stringify({ type: 'phone_connected' }));
          }
        }
        return;
      }

      // Forward WebRTC signaling messages
      if (data.type === 'offer') {
        // Phone → Dashboard
        if (dashboardClient && dashboardClient.readyState === WebSocket.OPEN) {
          dashboardClient.send(JSON.stringify(data));
          console.log('Offer forwarded to dashboard');
        }
      } else if (data.type === 'answer') {
        // Dashboard → Phone
        if (phoneClient && phoneClient.readyState === WebSocket.OPEN) {
          phoneClient.send(JSON.stringify(data));
          console.log('Answer forwarded to phone');
        }
      } else if (data.type === 'ice_candidate') {
        // Forward ICE candidates both ways
        if (data.role === 'phone' && dashboardClient && dashboardClient.readyState === WebSocket.OPEN) {
          dashboardClient.send(JSON.stringify(data));
        } else if (data.role === 'dashboard' && phoneClient && phoneClient.readyState === WebSocket.OPEN) {
          phoneClient.send(JSON.stringify(data));
        }
      } else if (data.type === 'command') {
        // Dashboard → Phone commands
        if (phoneClient && phoneClient.readyState === WebSocket.OPEN) {
          phoneClient.send(JSON.stringify(data));
          console.log('Command forwarded to phone:', data.action);
        }
      }

    } catch (e) {
      console.error('Message error:', e.message);
    }
  });

  ws.on('close', () => {
    if (ws === phoneClient) {
      phoneClient = null;
      console.log('Phone disconnected');
      if (dashboardClient && dashboardClient.readyState === WebSocket.OPEN) {
        dashboardClient.send(JSON.stringify({ type: 'phone_disconnected' }));
      }
    } else if (ws === dashboardClient) {
      dashboardClient = null;
      console.log('Dashboard disconnected');
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
