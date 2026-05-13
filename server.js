const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');
const dgram = require('dgram');
const path = require('path');
const fs = require('fs');
const url = require('url');

const PORT = 3000;
const OPENTRACK_PORT = 4242;

const app = express();

// Allow SharedArrayBuffer (needed by GaussianSplats3D worker sorter)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

app.use(express.static(path.join(__dirname)));

// List scene files from the scenes/ directory
app.get('/api/scenes', (req, res) => {
  const scenesDir = path.join(__dirname, 'scenes');
  try {
    const files = fs.readdirSync(scenesDir).filter(f =>
      f.endsWith('.splat') || f.endsWith('.ply') || f.endsWith('.spz') || f.endsWith('.ksplat')
    );
    res.json(files);
  } catch {
    res.json([]);
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast a message to all connected clients except the sender
function broadcast(sender, data) {
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on('connection', (ws, req) => {
  const params = new url.URLSearchParams((req.url.split('?')[1]) || '');
  const role = params.get('role') || 'controller';
  ws.clientRole = role;

  console.log(`[WS] ${role} connected (${wss.clients.size} total)`);

  ws.on('message', (data) => {
    // ws v8+ delivers Buffer; coerce to string so it broadcasts as a text frame
    broadcast(ws, data.toString());
  });

  ws.on('close', () => {
    console.log(`[WS] ${role} disconnected`);
    // Notify viewers that a tracker disconnected
    if (role === 'tracker') {
      const msg = JSON.stringify({ type: 'tracker_disconnected' });
      broadcast(ws, msg);
    }
  });

  ws.on('error', (err) => {
    console.error(`[WS] error on ${role}:`, err.message);
  });
});

// ── OpenTrack UDP listener ──────────────────────────────────────────────────
// Supports both FreeTrack 2.0 (6×float = 24 bytes) and newer (6×double = 48 bytes)
// Coordinate order: x, y, z, yaw, pitch, roll  (units: cm / degrees)
const udp = dgram.createSocket('udp4');

udp.on('message', (buf) => {
  try {
    let x, y, z, yaw, pitch, roll;
    if (buf.length >= 48) {
      x     = buf.readDoubleLE(0);
      y     = buf.readDoubleLE(8);
      z     = buf.readDoubleLE(16);
      yaw   = buf.readDoubleLE(24);
      pitch = buf.readDoubleLE(32);
      roll  = buf.readDoubleLE(40);
    } else if (buf.length >= 24) {
      x     = buf.readFloatLE(0);
      y     = buf.readFloatLE(4);
      z     = buf.readFloatLE(8);
      yaw   = buf.readFloatLE(12);
      pitch = buf.readFloatLE(16);
      roll  = buf.readFloatLE(20);
    } else {
      return;
    }

    const msg = JSON.stringify({ type: 'pose_opentrack', x, y, z, yaw, pitch, roll });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.clientRole !== 'tracker') {
        client.send(msg);
      }
    });
  } catch (e) {
    // ignore malformed packets
  }
});

udp.on('error', (err) => {
  console.warn('[UDP] OpenTrack listener error:', err.message);
});

udp.bind(OPENTRACK_PORT, () => {
  console.log(`[UDP] OpenTrack listening on port ${OPENTRACK_PORT}`);
});

server.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║           SplatTrack is running          ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Controller : http://localhost:${PORT}       ║`);
  console.log(`║  Projector  : http://localhost:${PORT}?projector ║`);
  console.log(`║  On network : http://${localIP}:${PORT}     ║`);
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Tracker    : http://${localIP}:${PORT}/quest-tracker.html`);
  console.log(`║  OpenTrack  : UDP → port ${OPENTRACK_PORT} (legacy/desktop)`);
  console.log('╚══════════════════════════════════════════╝\n');
});

function getLocalIP() {
  const { networkInterfaces } = require('os');
  for (const iface of Object.values(networkInterfaces())) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return '0.0.0.0';
}
