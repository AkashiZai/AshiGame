// Automated Verification for Multiplayer 4-Digit Room System
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

console.log("=== RUNNING MULTIPLAYER VERIFICATION TESTS ===");

const serverProcess = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

function cleanup() {
  serverProcess.kill('SIGINT');
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTests() {
  try {
    // Wait for server to boot
    await wait(800);

    // Test 0: Verify /health (for Render deployment)
    console.log("\n[Test 0] Testing /health endpoint (Render health check)...");
    const healthRes = await request('GET', '/health');
    if (healthRes.status !== 200 || healthRes.body.status !== 'ok') {
      throw new Error(`Failed /health: ${JSON.stringify(healthRes)}`);
    }
    console.log(`✓ /health returned 200 OK (status: "${healthRes.body.status}")`);

    // Test 1: Verify /api/info
    console.log("\n[Test 1] Testing /api/info endpoint...");
    const infoRes = await request('GET', '/api/info');
    if (infoRes.status !== 200 || !infoRes.body.ips || typeof infoRes.body.port !== 'number') {
      throw new Error(`Failed /api/info: ${JSON.stringify(infoRes)}`);
    }
    console.log(`✓ /api/info returned port ${infoRes.body.port} and ${infoRes.body.ips.length} network interface(s).`);

    // Test 2: Host Creates Room
    console.log("\n[Test 2] Testing /api/room/create...");
    const createRes = await request('POST', '/api/room/create');
    if (createRes.status !== 200 || !createRes.body.success || !/^\d{4}$/.test(createRes.body.code)) {
      throw new Error(`Failed /api/room/create: ${JSON.stringify(createRes)}`);
    }
    const roomCode = createRes.body.code;
    console.log(`✓ Room created successfully! 4-Digit Code: ${roomCode}`);

    // Test 3: Join non-existent room
    console.log("\n[Test 3] Testing Join invalid room code...");
    const badJoinRes = await request('POST', '/api/room/join', { code: '99999' });
    if (badJoinRes.status !== 404 || badJoinRes.body.success !== false) {
      throw new Error(`Expected 404 for invalid room, got: ${JSON.stringify(badJoinRes)}`);
    }
    console.log(`✓ Invalid room correctly rejected with message: "${badJoinRes.body.message}"`);

    // Test 4: Guest Joins Room with 4-Digit Code
    console.log("\n[Test 4] Testing Guest Join with valid 4-Digit Code...");
    const joinRes = await request('POST', '/api/room/join', { code: roomCode });
    if (joinRes.status !== 200 || !joinRes.body.success || joinRes.body.code !== roomCode) {
      throw new Error(`Failed /api/room/join: ${JSON.stringify(joinRes)}`);
    }
    console.log(`✓ Guest successfully joined room ${roomCode}!`);

    // Test 5: Host Polls and receives GUEST_JOINED
    console.log("\n[Test 5] Testing Host polling for GUEST_JOINED event...");
    const hostPollRes = await request('GET', `/api/room/poll?code=${roomCode}&since=0`);
    if (hostPollRes.status !== 200 || !hostPollRes.body.success || !hostPollRes.body.guestConnected) {
      throw new Error(`Host poll failed: ${JSON.stringify(hostPollRes)}`);
    }
    const guestJoinedEvt = hostPollRes.body.events.find(e => e.type === 'GUEST_JOINED');
    if (!guestJoinedEvt) {
      throw new Error("Expected GUEST_JOINED event in poll response!");
    }
    console.log(`✓ Host received GUEST_JOINED event! (guestConnected=true)`);

    // Test 6: Host sends INIT_GAME action
    console.log("\n[Test 6] Testing Host sending INIT_GAME action...");
    const initPayload = {
      code: roomCode,
      playerKey: 'p1',
      action: {
        type: 'INIT_GAME',
        p1Hand: [1, 2, 3, 4],
        p2Hand: [5, 6, 7, 8],
        round: 1,
        turn: 'p1'
      }
    };
    const actionRes = await request('POST', '/api/room/action', initPayload);
    if (actionRes.status !== 200 || !actionRes.body.success) {
      throw new Error(`Failed to send INIT_GAME action: ${JSON.stringify(actionRes)}`);
    }
    console.log(`✓ INIT_GAME event registered with eventId: ${actionRes.body.eventId}`);

    // Test 7: Guest polls and receives INIT_GAME
    console.log("\n[Test 7] Testing Guest polling and receiving INIT_GAME...");
    const guestPollRes = await request('GET', `/api/room/poll?code=${roomCode}&since=1`);
    const initEvt = guestPollRes.body.events.find(e => e.action && e.action.type === 'INIT_GAME');
    if (!initEvt) {
      throw new Error(`Guest did not receive INIT_GAME event: ${JSON.stringify(guestPollRes)}`);
    }
    console.log(`✓ Guest successfully received INIT_GAME event synchronized!`);

    // Test 8: Guest plays a card (PLAY_CARD)
    console.log("\n[Test 8] Testing Guest PLAY_CARD action...");
    const playRes = await request('POST', '/api/room/action', {
      code: roomCode,
      playerKey: 'p2',
      action: {
        type: 'PLAY_CARD',
        card: { id: 5, name: 'เบนเท็น สี่แขนร่างสอง', atk: 10, def: 5 },
        choice: 'attack'
      }
    });
    if (playRes.status !== 200 || !playRes.body.success) {
      throw new Error(`Failed PLAY_CARD: ${JSON.stringify(playRes)}`);
    }
    console.log(`✓ Guest played card registered with eventId: ${playRes.body.eventId}`);

    // Test 9: Host polls and receives Guest's PLAY_CARD
    console.log("\n[Test 9] Testing Host receives Guest's PLAY_CARD...");
    const hostPollPlayRes = await request('GET', `/api/room/poll?code=${roomCode}&since=${actionRes.body.eventId}`);
    const playEvt = hostPollPlayRes.body.events.find(e => e.action && e.action.type === 'PLAY_CARD');
    if (!playEvt || playEvt.playerKey !== 'p2' || playEvt.action.choice !== 'attack') {
      throw new Error(`Host did not receive correct PLAY_CARD: ${JSON.stringify(hostPollPlayRes)}`);
    }
    console.log(`✓ Host received PLAY_CARD from Guest (playerKey=p2, choice=attack, card="${playEvt.action.card.name}")!`);

    console.log("\n========================================================");
    console.log("🎉 ALL MULTIPLAYER 4-DIGIT ROOM TESTS PASSED 100%!");
    console.log("========================================================");
    cleanup();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ MULTIPLAYER VERIFICATION FAILED:", err);
    cleanup();
    process.exit(1);
  }
}

runTests();
