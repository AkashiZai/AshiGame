// Meme Duel - Lightweight Zero-Dependency Multiplayer Server
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// In-Memory Room Registry
// roomCode -> { code, hostConnected: bool, guestConnected: bool, events: [], lastUpdated: timestamp }
const rooms = new Map();

// Generate Random 4-Digit Code (e.g. "4829")
function generateRoomCode() {
  let code;
  let attempts = 0;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while (rooms.has(code) && attempts < 100);
  return code;
}

// Clean old rooms (older than 2 hours)
setInterval(() => {
  const now = Date.now();
  for (const [code, r] of rooms.entries()) {
    if (now - r.lastUpdated > 2 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API ROUTES
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() }));
    return;
  }

  if (pathname === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      port: PORT,
      ips: getLocalIPs()
    }));
    return;
  }

  if (pathname === '/api/room/create' && req.method === 'POST') {
    const code = generateRoomCode();
    rooms.set(code, {
      code,
      hostConnected: true,
      guestConnected: false,
      events: [],
      lastUpdated: Date.now()
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, code }));
    return;
  }

  if (pathname === '/api/room/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { code } = JSON.parse(body);
        const room = rooms.get(String(code).trim());
        if (!room) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'ไม่พบห้องรหัสนี้ กรุณาตรวจสอบโค้ด 4 หลัก' }));
          return;
        }

        room.guestConnected = true;
        room.lastUpdated = Date.now();
        // Add Player Joined Event
        room.events.push({
          id: room.events.length + 1,
          type: 'GUEST_JOINED',
          timestamp: Date.now()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, code: room.code }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
      }
    });
    return;
  }

  if (pathname === '/api/room/action' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { code, playerKey, action } = JSON.parse(body);
        const room = rooms.get(String(code).trim());
        if (!room) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Room not found' }));
          return;
        }

        room.lastUpdated = Date.now();
        const eventItem = {
          id: room.events.length + 1,
          playerKey,
          action,
          timestamp: Date.now()
        };
        room.events.push(eventItem);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, eventId: eventItem.id }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
      }
    });
    return;
  }

  if (pathname === '/api/room/poll' && req.method === 'GET') {
    const code = String(parsedUrl.query.code || '').trim();
    const since = parseInt(parsedUrl.query.since || '0', 10);
    const room = rooms.get(code);

    if (!room) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Room not found' }));
      return;
    }

    const newEvents = room.events.filter(e => e.id > since);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      guestConnected: room.guestConnected,
      events: newEvents
    }));
    return;
  }

  // STATIC FILE SERVING
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : decodeURIComponent(pathname));
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// Detect Local IPv4 Addresses
function getLocalIPs() {
  const ifaces = os.networkInterfaces();
  const addresses = [];
  for (const name in ifaces) {
    ifaces[name].forEach(d => {
      if (d.family === 'IPv4' && !d.internal) {
        addresses.push({ name, address: d.address });
      }
    });
  }
  return addresses;
}

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('================================================================');
  console.log('🃏 MEME DUEL - MULTIPLAYER SERVER ONLINE!');
  console.log('================================================================');
  console.log(`💻 บนคอมพิวเตอร์เครื่องนี้เปิดเล่นที่:`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log('');
  console.log(`📱 ให้เพื่อนบนมือถือ / แท็บเล็ต / คอมอีกเครื่อง เปิดเล่นที่:`);
  ips.forEach(ip => {
    console.log(`   👉 http://${ip.address}:${PORT}  (${ip.name})`);
  });
  console.log('================================================================');
  console.log('กด Ctrl+C เพื่อหยุดการทำงานของเซิร์ฟเวอร์');
});
