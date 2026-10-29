// Meme Duel - Card Game Logic Engine

// Sound Engine using Web Audio API (No external sound files required)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'attack') {
        // Punch / Slash impact sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'guard') {
        // Metallic shield sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'heal') {
        // Sparkle / Healing chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'skill') {
        // Mystical special skill tone
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'draw') {
        // Card flip swish
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'victory') {
        // Fanfare notes
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.type = 'triangle';
          o.frequency.value = freq;
          const startT = now + idx * 0.12;
          g.gain.setValueAtTime(0.25, startT);
          g.gain.linearRampToValueAtTime(0.01, startT + 0.25);
          o.start(startT);
          o.stop(startT + 0.25);
        });
      }
    } catch (e) {
      console.warn("Audio play error", e);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

const sfx = new SoundFX();

// Game State Class
class MemeGame {
  constructor() {
    this.mode = 'bot'; // 'bot', 'multiplayer', or 'pvp'
    this.turn = 'p1';
    this.round = 1;
    this.gameOver = false;
    this.pendingCard = null;
    this.selectedAttacker = null;
    this.suppressNextCardClick = false;
    this.p1TurnCount = 0;
    this.isBotThinking = false;
    this.isResolvingCombat = false;
    this.combatGeneration = 0;

    // Multiplayer Networking State
    this.isMultiplayer = false;
    this.roomCode = null;
    this.myRole = null; // 'host' (P1) or 'guest' (P2)
    this.pollTimer = null;
    this.lastEventId = 0;
    this.processedEvents = new Set();
    this.peer = null;
    this.peerConn = null;

    this.p1 = this.createPlayer("ผู้เล่น 1 (Player 1)");
    this.p2 = this.createPlayer("บ็อตเพื่อนยาก (AI Bot)");

    this.initElements();
    this.bindEvents();
    this.initDexFilters();
    this.renderDex();
    this.renderPrintSheets();
    this.startNewGame();
    this.fetchServerInfo();
  }

  createPlayer(name) {
    return {
      name: name,
      maxHp: 30,
      hp: 30,
      shield: 0,
      energy: 2,
      maxEnergy: 2,
      deck: [],
      hand: [],
      discard: [],
      board: [],
      poison: 0,
      weaken: 0,
      silenced: false,
      blinded: false
    };
  }

  initElements() {
    // Buttons & Selects
    this.gameModeSelect = document.getElementById('gameModeSelect');
    this.restartBtn = document.getElementById('restartBtn');
    this.rulesBtn = document.getElementById('rulesBtn');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.endTurnBtn = document.getElementById('endTurnBtn');

    // Multiplayer Elements
    this.openRoomModalBtn = document.getElementById('openRoomModalBtn');
    this.roomModal = document.getElementById('roomModal');
    this.createRoomBtn = document.getElementById('createRoomBtn');
    this.createdRoomCodeBox = document.getElementById('createdRoomCodeBox');
    this.displayRoomCode = document.getElementById('displayRoomCode');
    this.hostWaitingStatus = document.getElementById('hostWaitingStatus');
    this.hostServerInfoBox = document.getElementById('hostServerInfoBox');
    this.hostServerUrlInput = document.getElementById('hostServerUrlInput');
    this.copyServerLinkBtn = document.getElementById('copyServerLinkBtn');
    this.joinRoomInput = document.getElementById('joinRoomInput');
    this.joinRoomBtn = document.getElementById('joinRoomBtn');
    this.joinStatusText = document.getElementById('joinStatusText');
    this.activeRoomBadge = document.getElementById('activeRoomBadge');
    this.activeRoomCodeText = document.getElementById('activeRoomCodeText');
    this.playerRoleText = document.getElementById('playerRoleText');

    // UI Zones
    this.p1Panel = document.getElementById('p1Panel');
    this.p2Panel = document.getElementById('p2Panel');
    this.turnBanner = document.getElementById('turnBanner');
    this.combatLog = document.getElementById('combatLog');
    this.p1HandZone = document.getElementById('p1HandZone');
    this.p2HandZone = document.getElementById('p2HandZone');
    this.p1BoardZone = document.getElementById('p1BoardZone');
    this.p2BoardZone = document.getElementById('p2BoardZone');
    this.battleTickerMsg = document.getElementById('battleTickerMsg');

    // Stats Elements P1
    this.p1Name = document.getElementById('p1Name');
    this.p1HpText = document.getElementById('p1HpText');
    this.p1HpFill = document.getElementById('p1HpFill');
    this.p1ShieldText = document.getElementById('p1ShieldText');
    this.p1ShieldFill = document.getElementById('p1ShieldFill');
    this.p1EnergyText = document.getElementById('p1EnergyText');
    this.p1EnergyOrbs = document.getElementById('p1EnergyOrbs');
    this.p1DeckCount = document.getElementById('p1DeckCount');

    // Stats Elements P2
    this.p2Name = document.getElementById('p2Name');
    this.p2HpText = document.getElementById('p2HpText');
    this.p2HpFill = document.getElementById('p2HpFill');
    this.p2ShieldText = document.getElementById('p2ShieldText');
    this.p2ShieldFill = document.getElementById('p2ShieldFill');
    this.p2EnergyText = document.getElementById('p2EnergyText');
    this.p2EnergyOrbs = document.getElementById('p2EnergyOrbs');
    this.p2DeckCount = document.getElementById('p2DeckCount');

    // Modals
    this.cardActionModal = document.getElementById('cardActionModal');
    this.rulesModal = document.getElementById('rulesModal');
    this.gameOverModal = document.getElementById('gameOverModal');
    this.winnerTitle = document.getElementById('winnerTitle');
    this.winnerMessage = document.getElementById('winnerMessage');
  }

  bindEvents() {
    // Mode Switch
    this.gameModeSelect.addEventListener('change', (e) => {
      this.mode = e.target.value;
      if (this.mode === 'multiplayer') {
        this.openRoomModal();
      } else {
        this.leaveMultiplayer();
        if (this.mode === 'bot') {
          this.p2.name = "บ็อตเพื่อนยาก (AI Bot)";
        } else {
          this.p2.name = "ผู้เล่น 2 (Player 2)";
        }
        this.startNewGame();
      }
    });

    // Open Room Modal Button
    if (this.openRoomModalBtn) {
      this.openRoomModalBtn.addEventListener('click', () => {
        this.openRoomModal();
      });
    }

    // Host & Join Room Buttons
    if (this.createRoomBtn) {
      this.createRoomBtn.addEventListener('click', () => {
        this.hostRoom();
      });
    }

    if (this.joinRoomBtn) {
      this.joinRoomBtn.addEventListener('click', () => {
        this.joinRoom();
      });
    }

    if (this.joinRoomInput) {
      this.joinRoomInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this.joinRoom();
        }
      });
    }

    if (this.copyServerLinkBtn && this.hostServerUrlInput) {
      this.copyServerLinkBtn.addEventListener('click', () => {
        const text = this.hostServerUrlInput.value;
        if (text) {
          navigator.clipboard.writeText(text).then(() => {
            const orig = this.copyServerLinkBtn.innerText;
            this.copyServerLinkBtn.innerText = "✓ คัดลอกแล้ว!";
            setTimeout(() => { this.copyServerLinkBtn.innerText = orig; }, 1800);
          }).catch(() => {
            this.hostServerUrlInput.select();
            document.execCommand('copy');
          });
        }
      });
    }

    this.restartBtn.addEventListener('click', () => this.handleRestartClick());

    this.soundToggleBtn.addEventListener('click', () => {
      const isMuted = sfx.toggleMute();
      this.soundToggleBtn.innerHTML = isMuted ? '🔇 เสียง: ปิด' : '🔊 เสียง: เปิด';
    });

    this.rulesBtn.addEventListener('click', () => {
      this.rulesModal.classList.add('active');
    });

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.rulesModal.classList.remove('active');
        this.gameOverModal.classList.remove('active');
        if (this.roomModal) this.roomModal.classList.remove('active');
      });
    });

    this.endTurnBtn.addEventListener('click', () => this.endCurrentTurn());

    // Navigation Tabs
    document.querySelectorAll('.nav-tabs .nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-tabs .nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = document.getElementById(btn.dataset.tab);
        if (targetTab) targetTab.classList.add('active');
      });
    });

    // Card preview / summon button
    document.getElementById('actSummonBtn').addEventListener('click', () => {
      if (this.pendingCard) {
        this.summonMinion(this.pendingCard.card, this.pendingCard.playerKey);
        this.closeCardAction();
      }
    });

    document.getElementById('actCancelBtn').addEventListener('click', () => {
      this.closeCardAction();
    });

    // Print Button
    document.getElementById('triggerPrintBtn').addEventListener('click', () => {
      window.print();
    });

    // Targeting works with clicks/taps and drag-and-drop.
    this.p1BoardZone.addEventListener('click', (event) => this.handleMinionLaneClick(event, this.p1BoardZone));
    this.p2BoardZone.addEventListener('click', (event) => this.handleMinionLaneClick(event, this.p2BoardZone));
    this.p1BoardZone.addEventListener('dragstart', (event) => this.handleMinionDragStart(event));
    this.p2BoardZone.addEventListener('dragstart', (event) => this.handleMinionDragStart(event));
    this.p1BoardZone.addEventListener('dragover', (event) => event.preventDefault());
    this.p2BoardZone.addEventListener('dragover', (event) => event.preventDefault());
    this.p1BoardZone.addEventListener('drop', (event) => this.handleLaneDrop(event, this.p1BoardZone));
    this.p2BoardZone.addEventListener('drop', (event) => this.handleLaneDrop(event, this.p2BoardZone));

    this.p1HeroWrap = document.getElementById('p1HeroWrap');
    this.p2HeroWrap = document.getElementById('p2HeroWrap');
    this.p1HeroWrap.addEventListener('click', () => this.handleHeroTarget('bottom'));
    this.p2HeroWrap.addEventListener('click', () => this.handleHeroTarget('top'));
    [this.p1HeroWrap, this.p2HeroWrap].forEach((heroWrap) => {
      heroWrap.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.handleHeroTarget(heroWrap === this.p1HeroWrap ? 'bottom' : 'top');
      });
      heroWrap.addEventListener('dragover', (event) => event.preventDefault());
      heroWrap.addEventListener('drop', (event) => {
        event.preventDefault();
        const minion = this.readDraggedMinion(event);
        if (minion) this.attackWithMinion(minion.playerKey, minion.minionId, { type: 'hero', targetPlayerKey: heroWrap === this.p1HeroWrap ? this.getMyPlayerKey() : this.getOpponentPlayerKey() });
      });
    });
  }

  getServerBaseUrl() {
    if (window.location.protocol.startsWith('http')) {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  }

  async fetchServerInfo() {
    try {
      // If hosted online (e.g. Render, cloud domain, or public IP)
      if (window.location.protocol.startsWith('http') &&
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1') {
        if (this.hostServerUrlInput) {
          this.hostServerUrlInput.value = window.location.origin;
        }
        return;
      }

      const res = await fetch(`${this.getServerBaseUrl()}/api/info`);
      if (res.ok) {
        const data = await res.json();
        if (data.ips && data.ips.length > 0) {
          const primaryIp = data.ips[0].address;
          const shareUrl = `http://${primaryIp}:${data.port || 3000}`;
          if (this.hostServerUrlInput) {
            this.hostServerUrlInput.value = shareUrl;
          }
        }
      }
    } catch (e) {
      // Offline or local file mode
    }
  }

  openRoomModal() {
    if (this.roomModal) {
      this.roomModal.classList.add('active');
      this.fetchServerInfo();
    }
  }

  leaveMultiplayer() {
    this.stopPolling();
    this.isMultiplayer = false;
    this.roomCode = null;
    this.myRole = null;
    if (this.peerConn) {
      try { this.peerConn.close(); } catch (e) {}
      this.peerConn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    if (this.activeRoomBadge) {
      this.activeRoomBadge.style.display = 'none';
    }
  }

  getMyPlayerKey() {
    if (this.isMultiplayer) {
      return this.myRole === 'guest' ? 'p2' : 'p1';
    }
    return 'p1';
  }

  getOpponentPlayerKey() {
    if (this.isMultiplayer) {
      return this.myRole === 'guest' ? 'p1' : 'p2';
    }
    return 'p2';
  }

  async hostRoom() {
    if (this.createRoomBtn) {
      this.createRoomBtn.disabled = true;
      this.createRoomBtn.innerText = "⏳ กำลังสร้างห้อง...";
    }

    let code = null;
    try {
      const res = await fetch(`${this.getServerBaseUrl()}/api/room/create`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          code = data.code;
        }
      }
    } catch (e) {
      console.warn("HTTP room create failed, using local generation:", e);
    }

    if (!code) {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    }

    this.isMultiplayer = true;
    this.myRole = 'host';
    this.roomCode = code;
    this.lastEventId = 0;
    this.processedEvents.clear();

    this.p1.name = "คุณ (Player 1 - Host)";
    this.p2.name = "เพื่อน (Player 2 - Guest)";

    if (this.createdRoomCodeBox) this.createdRoomCodeBox.style.display = 'flex';
    if (this.displayRoomCode) this.displayRoomCode.innerText = code;
    if (this.hostWaitingStatus) this.hostWaitingStatus.innerText = "⏳ กำลังรอเพื่อนกรอกโค้ดเข้าร่วม...";
    if (this.hostServerInfoBox) {
      this.hostServerInfoBox.style.display = 'block';
      if (this.hostServerUrlInput) {
        if (window.location.protocol.startsWith('http') &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1') {
          this.hostServerUrlInput.value = window.location.origin;
        } else if (!this.hostServerUrlInput.value) {
          const hostUrl = window.location.protocol.startsWith('http')
            ? window.location.origin
            : 'http://localhost:3000';
          this.hostServerUrlInput.value = hostUrl;
        }
      }
    }

    if (this.activeRoomBadge) this.activeRoomBadge.style.display = 'inline-flex';
    if (this.activeRoomCodeText) this.activeRoomCodeText.innerText = code;
    if (this.playerRoleText) this.playerRoleText.innerText = "เครื่องที่ 1 (Host)";

    if (this.createRoomBtn) {
      this.createRoomBtn.disabled = false;
      this.createRoomBtn.innerText = "สร้างห้องใหม่สำเร็จ!";
    }

    this.initPeerHost(code);
    this.startPolling(code);
    this.addLog(`🏰 คุณสร้างห้องรหัส [ ${code} ] สำเร็จแล้ว! กำลังรอเพื่อนเข้าร่วม...`, 'skill');
  }

  async joinRoom() {
    const inputCode = this.joinRoomInput ? this.joinRoomInput.value.trim() : '';
    if (!/^\d{4}$/.test(inputCode)) {
      if (this.joinStatusText) {
        this.joinStatusText.style.color = '#f87171';
        this.joinStatusText.innerText = "⚠️ กรุณากรอกโค้ดตัวเลข 4 หลักให้ถูกต้อง";
      }
      return;
    }

    if (this.joinRoomBtn) {
      this.joinRoomBtn.disabled = true;
      this.joinRoomBtn.innerText = "⏳ กำลังเข้าร่วม...";
    }
    if (this.joinStatusText) {
      this.joinStatusText.style.color = '#38bdf8';
      this.joinStatusText.innerText = `⏳ กำลังค้นหาห้อง ${inputCode}...`;
    }

    let serverSuccess = false;
    try {
      const res = await fetch(`${this.getServerBaseUrl()}/api/room/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inputCode })
      });
      const data = await res.json();
      if (data.success) {
        serverSuccess = true;
      } else {
        if (this.joinStatusText) {
          this.joinStatusText.style.color = '#f87171';
          this.joinStatusText.innerText = data.message || "ไม่พบห้องรหัสนี้ กรุณาตรวจสอบโค้ด 4 หลัก";
        }
        if (this.joinRoomBtn) {
          this.joinRoomBtn.disabled = false;
          this.joinRoomBtn.innerText = "เข้าร่วมห้อง";
        }
        return;
      }
    } catch (e) {
      console.warn("HTTP join failed, attempting PeerJS directly:", e);
    }

    this.isMultiplayer = true;
    this.myRole = 'guest';
    this.roomCode = inputCode;
    this.lastEventId = 0;
    this.processedEvents.clear();

    this.p1.name = "เพื่อน (Player 1 - Host)";
    this.p2.name = "คุณ (Player 2 - Guest)";

    if (this.activeRoomBadge) this.activeRoomBadge.style.display = 'inline-flex';
    if (this.activeRoomCodeText) this.activeRoomCodeText.innerText = inputCode;
    if (this.playerRoleText) this.playerRoleText.innerText = "เครื่องที่ 2 (Guest)";

    if (this.joinStatusText) {
      this.joinStatusText.style.color = '#4ade80';
      this.joinStatusText.innerText = `✓ เข้าร่วมห้อง ${inputCode} แล้ว! กำลังรับข้อมูลเกม...`;
    }

    this.initPeerGuest(inputCode);
    this.startPolling(inputCode);
    this.addLog(`🚪 คุณเข้าร่วมห้อง [ ${inputCode} ] สำเร็จแล้ว! กำลังเชื่อมต่อกับโฮสต์...`, 'skill');
  }

  startPolling(code) {
    this.stopPolling();
    this.pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`${this.getServerBaseUrl()}/api/room/poll?code=${code}&since=${this.lastEventId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.events)) {
          data.events.forEach(evt => {
            this.lastEventId = Math.max(this.lastEventId, evt.id || 0);
            this.handleNetworkEvent(evt);
          });
        }
      } catch (e) {
        // network poll err
      }
    }, 450);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  initPeerHost(code) {
    if (typeof Peer === 'undefined') return;
    try {
      if (this.peer) this.peer.destroy();
      this.peer = new Peer('memeduel-' + code);
      this.peer.on('connection', (conn) => {
        this.peerConn = conn;
        conn.on('data', (data) => {
          this.handleNetworkEvent({ action: data, playerKey: 'p2' });
        });
        if (this.myRole === 'host') {
          this.startNewMultiplayerGame();
        }
      });
      this.peer.on('error', (err) => {
        console.log("PeerJS Host (HTTP fallback active):", err);
      });
    } catch (e) {
      console.log("PeerJS error:", e);
    }
  }

  initPeerGuest(code) {
    if (typeof Peer === 'undefined') return;
    try {
      if (this.peer) this.peer.destroy();
      this.peer = new Peer();
      this.peer.on('open', () => {
        this.peerConn = this.peer.connect('memeduel-' + code);
        this.peerConn.on('data', (data) => {
          this.handleNetworkEvent({ action: data, playerKey: 'p1' });
        });
      });
      this.peer.on('error', (err) => {
        console.log("PeerJS Guest (HTTP fallback active):", err);
      });
    } catch (e) {
      console.log("PeerJS error:", e);
    }
  }

  broadcastAction(action) {
    if (!this.isMultiplayer || !this.roomCode) return;

    if (!action.actionId) {
      action.actionId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    this.processedEvents.add(action.actionId);

    // 1. Send via PeerJS WebRTC if open
    if (this.peerConn && this.peerConn.open) {
      try {
        this.peerConn.send(action);
      } catch (e) {
        console.warn("PeerJS send failed:", e);
      }
    }

    // 2. Send via HTTP server relay
    const payload = {
      code: this.roomCode,
      playerKey: this.getMyPlayerKey(),
      action: action
    };

    fetch(`${this.getServerBaseUrl()}/api/room/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn("HTTP action broadcast error:", err);
    });
  }

  handleNetworkEvent(evt) {
    if (!evt) return;

    // Host receives GUEST_JOINED
    if (evt.type === 'GUEST_JOINED' && this.myRole === 'host') {
      if (!this.p1.hand || this.p1.hand.length === 0 || this.gameOver) {
        this.startNewMultiplayerGame();
      }
      return;
    }

    const action = evt.action;
    if (!action) return;

    if (action.actionId) {
      if (this.processedEvents.has(action.actionId)) return;
      this.processedEvents.add(action.actionId);
    }

    if (action.type === 'INIT_GAME') {
      this.p1.deck = [...action.p1Deck];
      this.p2.deck = [...action.p2Deck];
      this.p1.hand = [...action.p1Hand];
      this.p2.hand = [...action.p2Hand];
      this.p1.board = [];
      this.p2.board = [];
      this.p1.discard = [];
      this.p2.discard = [];
      this.selectedAttacker = null;
      this.p1.hp = 30;
      this.p2.hp = 30;
      this.p1.shield = 0;
      this.p2.shield = 0;
      this.p1.energy = 2;
      this.p2.energy = 2;
      this.p1.maxEnergy = 2;
      this.p2.maxEnergy = 2;
      this.round = action.round || 1;
      this.p1TurnCount = 1;
      this.isResolvingCombat = false;
      this.combatGeneration++;
      this.turn = action.turn || 'p1';
      this.gameOver = false;
      this.isBotThinking = false;

      if (this.roomModal) this.roomModal.classList.remove('active');
      if (this.gameOverModal) this.gameOverModal.classList.remove('active');

      sfx.play('victory');
      this.addLog(`🎉 เชื่อมต่อสำเร็จ! เริ่มต้นการดวลการ์ด (ห้อง ${this.roomCode})`, 'victory');
      this.updateUI();
      return;
    }

    if (action.type === 'SUMMON_MINION') {
      if (evt.playerKey !== this.getMyPlayerKey()) {
        this.summonMinion(action.card, evt.playerKey, false, action.minionId);
      }
      return;
    }

    if (action.type === 'ATTACK_MINION') {
      if (evt.playerKey !== this.getMyPlayerKey()) {
        this.attackWithMinion(action.playerKey, action.minionId, {
          type: action.targetType,
          targetPlayerKey: action.targetPlayerKey,
          targetMinionId: action.targetMinionId
        }, false);
      }
      return;
    }

    if (action.type === 'END_TURN') {
      if (evt.playerKey !== this.getMyPlayerKey()) {
        this.endCurrentTurn(false);
      }
      return;
    }

    if (action.type === 'RESTART_REQUEST') {
      if (this.myRole === 'host') {
        this.startNewMultiplayerGame();
      }
      return;
    }
  }

  startNewMultiplayerGame() {
    this.gameOver = false;
    this.round = 1;
    this.turn = 'p1';
    this.isBotThinking = false;
    this.isResolvingCombat = false;
    this.combatGeneration++;
    this.p1TurnCount = 1;
    this.selectedAttacker = null;
    this.combatLog.innerHTML = '';
    this.closeCardAction();

    const p1Deck = this.shuffleDeck(CARDS_DATA);
    const p2Deck = this.shuffleDeck(CARDS_DATA);
    const p1Hand = p1Deck.splice(0, 4);
    const p2Hand = p2Deck.splice(0, 4);

    this.p1.hp = 30;
    this.p2.hp = 30;
    this.p1.shield = 0;
    this.p2.shield = 0;
    this.p1.energy = 2;
    this.p2.energy = 2;
    this.p1.maxEnergy = 2;
    this.p2.maxEnergy = 2;
    this.p1.deck = p1Deck;
    this.p2.deck = p2Deck;
    this.p1.hand = p1Hand;
    this.p2.hand = p2Hand;
    this.p1.discard = [];
    this.p2.discard = [];
    this.p1.board = [];
    this.p2.board = [];
    this.selectedAttacker = null;

    this.broadcastAction({
      type: 'INIT_GAME',
      p1Deck: this.p1.deck,
      p2Deck: this.p2.deck,
      p1Hand: this.p1.hand,
      p2Hand: this.p2.hand,
      round: 1,
      turn: 'p1'
    });

    if (this.roomModal) this.roomModal.classList.remove('active');
    if (this.gameOverModal) this.gameOverModal.classList.remove('active');

    sfx.play('victory');
    this.addLog(`🎉 เพื่อนเข้าห้องแล้ว! เริ่มต้นการดวลการ์ด 2 เครื่อง!`, 'victory');
    this.updateUI();
  }

  handleRestartClick() {
    if (this.isMultiplayer) {
      if (this.myRole === 'host') {
        this.startNewMultiplayerGame();
      } else {
        this.broadcastAction({ type: 'RESTART_REQUEST' });
        this.addLog(`⏳ ส่งคำขอเริ่มเกมใหม่ไปยังเครื่องโฮสต์แล้ว...`);
      }
    } else {
      this.startNewGame();
    }
  }

  showClashCard(card, player, choice) {
    const stage = document.getElementById('duelStage');
    if (!stage) return;

    const prev = stage.querySelector('.live-played-card');
    if (prev) prev.remove();

    const isAttack = (choice === 'attack');
    const badgeText = isAttack
      ? `⚔️ โจมตี ${card.atk} ดาเมจ + สกิล!`
      : `🛡️ ป้องกัน +${card.def} เกราะ!`;
    const badgeColor = isAttack ? '#dc2626' : '#15803d';

    const showEl = document.createElement('div');
    showEl.className = 'live-played-card';
    showEl.innerHTML = `
      <div class="clash-badge" style="background: ${badgeColor};">${player.name}: ${badgeText}</div>
      <div class="clash-card-frame">
        <img src="${card.image}" alt="${card.name}" />
        <div class="clash-card-name">${card.name}</div>
      </div>
      <div class="clash-skill-desc">${card.skill.name}: ${card.skill.desc}</div>
    `;
    stage.appendChild(showEl);
    setTimeout(() => {
      showEl.classList.add('fade-out');
      setTimeout(() => showEl.remove(), 400);
    }, 2200);
  }

  shuffleDeck(cards) {
    const deck = [...cards];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  startNewGame() {
    if (this.isMultiplayer) {
      if (this.myRole === 'host') {
        this.startNewMultiplayerGame();
      } else {
        this.broadcastAction({ type: 'RESTART_REQUEST' });
        this.addLog(`⏳ ส่งคำขอเริ่มเกมใหม่ไปยังเครื่องโฮสต์แล้ว...`);
      }
      return;
    }

    this.gameOver = false;
    this.round = 1;
    this.turn = 'p1';
    this.isBotThinking = false;
    this.isResolvingCombat = false;
    this.combatGeneration++;
    this.p1TurnCount = 0;
    this.selectedAttacker = null;
    this.combatLog.innerHTML = '';
    this.closeCardAction();

    // Close Game Over Modal if open
    if (this.gameOverModal) {
      this.gameOverModal.classList.remove('active');
    }

    // Always ensure Arena tab is selected and active
    document.querySelectorAll('.nav-tabs .nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === 'tab-arena');
    });
    document.querySelectorAll('.tab-content').forEach(t => {
      t.classList.toggle('active', t.id === 'tab-arena');
    });

    this.p1 = this.createPlayer("ผู้เล่น 1 (Player 1)");
    this.p2 = this.createPlayer(this.mode === 'bot' ? "บ็อตเพื่อนยาก (AI Bot)" : "ผู้เล่น 2 (Player 2)");

    this.p1.deck = this.shuffleDeck(CARDS_DATA);
    this.p2.deck = this.shuffleDeck(CARDS_DATA);

    // Initial draw: 4 cards each
    for (let i = 0; i < 4; i++) {
      this.drawCard(this.p1, false);
      this.drawCard(this.p2, false);
    }

    this.addLog(`🎉 เริ่มต้นเกมใหม่! โหมด: ${this.mode === 'bot' ? 'ดวลกับบ็อต AI' : 'ดวลกับเพื่อน 2 คน'}`, 'victory');
    this.startTurn('p1');
    this.updateUI();
  }

  drawCard(player, notify = true) {
    if (player.deck.length === 0) {
      if (player.discard.length > 0) {
        player.deck = this.shuffleDeck(player.discard);
        player.discard = [];
        if (notify) this.addLog(`♻️ กองการ์ดของ ${player.name} ถูกสับใหม่จากสุสาน!`);
      } else {
        if (notify) this.addLog(`⚠️ การ์ดหมดกองแล้ว ไม่มีให้จั่ว!`);
        return;
      }
    }

    if (player.hand.length >= 7) {
      if (notify) this.addLog(`⚠️ มือของ ${player.name} เต็มแล้ว (สูงสุด 7 ใบ)!`);
      return;
    }

    const card = player.deck.pop();
    player.hand.push(card);
    if (notify) {
      sfx.play('draw');
      this.addLog(`🃏 ${player.name} จั่วการ์ด: "${card.name}"`);
    }
  }

  startTurn(playerKey) {
    this.turn = playerKey;
    this.selectedAttacker = null;
    const player = playerKey === 'p1' ? this.p1 : this.p2;
    const opponent = playerKey === 'p1' ? this.p2 : this.p1;

    // Increase max energy once each time player one starts a turn, up to six.
    if (playerKey === 'p1') {
      this.round++;
      const targetMax = Math.min(2 + this.p1TurnCount, 6);
      this.p1TurnCount++;
      this.p1.maxEnergy = targetMax;
      this.p2.maxEnergy = targetMax;
    }

    player.energy = player.maxEnergy;
    player.board.forEach((minion) => {
      minion.canAttack = true;
      minion.summoningSick = false;
    });

    // Reset temporary debuffs/effects
    player.silenced = false;

    // Poison Damage Check
    if (player.poison > 0) {
      player.hp = Math.max(0, player.hp - player.poison);
      this.addLog(`🧪 ${player.name} โดนพิษกัดกร่อน -${player.poison} HP!`, 'damage');
      player.poison--;
      if (player.hp <= 0) {
        this.handleGameOver(opponent);
        return;
      }
    }

    // Draw 1 card at turn start
    this.drawCard(player, true);

    this.addLog(`👉 เทิร์นของ ${player.name} (Energy: ${player.energy}/${player.maxEnergy})`);
    this.updateUI();

    if (playerKey === 'p2' && this.mode === 'bot' && !this.gameOver) {
      this.playBotTurn();
    }
  }

  endCurrentTurn(isLocal = true) {
    if (this.gameOver || this.isBotThinking || this.isResolvingCombat) return;

    if (this.isMultiplayer && isLocal && this.turn !== this.getMyPlayerKey()) {
      this.addLog(`⏳ ยังไม่ใช่เทิร์นของคุณ!`);
      return;
    }

    if (this.turn === 'p1') {
      this.startTurn('p2');
    } else {
      this.startTurn('p1');
    }

    if (this.isMultiplayer && isLocal) {
      this.broadcastAction({
        type: 'END_TURN',
        playerKey: this.getMyPlayerKey()
      });
    }
  }

  openCardAction(card, playerKey) {
    if (this.gameOver || this.isBotThinking) return;
    if (this.turn !== playerKey) {
      this.addLog(`⏳ ยังไม่ใช่เทิร์นของคุณ!`);
      return;
    }

    if (this.isMultiplayer && playerKey !== this.getMyPlayerKey()) {
      return;
    }

    const player = playerKey === 'p1' ? this.p1 : this.p2;
    if (player.energy < card.cost) {
      this.addLog(`❌ มานาไม่พอ! ต้องการ ${card.cost} แต้ม (คุณมี ${player.energy})`);
      return;
    }
    if (player.board.length >= 7) {
      this.addLog(`สนามของ ${player.name} เต็มแล้ว (สูงสุด 7 มินเนียน)`);
      return;
    }

    this.pendingCard = { card, playerKey };

    // Populate modal preview
    document.getElementById('actionModalImg').src = card.image;
    document.getElementById('actionModalTitle').innerText = card.name;
    document.getElementById('actionModalSub').innerText = card.sub;
    document.getElementById('actionModalCost').innerText = card.cost;
    document.getElementById('actionModalAtk').innerText = card.atk;
    document.getElementById('actionModalDef').innerText = card.def;
    document.getElementById('actionModalSkill').innerText = `${card.skill.name}: ${card.skill.desc}`;
    document.getElementById('actionModalQuote').innerText = `"${card.quote}"`;

    this.cardActionModal.classList.add('active');
  }

  closeCardAction() {
    this.pendingCard = null;
    this.cardActionModal.classList.remove('active');
  }

  executeCardAction(actionData, _choice, isLocal = true) {
    this.summonMinion(actionData.card, actionData.playerKey, isLocal);
  }

  summonMinion(card, playerKey, isLocal = true, sharedId = null) {
    if (this.gameOver || !card || this.turn !== playerKey) return;
    if (this.isMultiplayer && isLocal && playerKey !== this.getMyPlayerKey()) return;

    const player = this[playerKey];
    const opponent = this[playerKey === 'p1' ? 'p2' : 'p1'];
    if (!player || player.energy < card.cost || player.board.length >= 7) return;

    const handIndex = player.hand.findIndex((held) => held.id === card.id);
    if (handIndex === -1) return;

    player.energy -= card.cost;
    const playedCard = player.hand.splice(handIndex, 1)[0];
    const minionId = sharedId || `${playerKey}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const minion = {
      id: minionId,
      card: playedCard,
      atk: playedCard.atk,
      health: playedCard.def,
      maxHealth: playedCard.def,
      taunt: playedCard.category === 'Tank',
      canAttack: false,
      summoningSick: true
    };
    player.board.push(minion);

    this.addLog(`✨ ${player.name} อัญเชิญ "${playedCard.name}" ลงสนาม`,'skill');
    sfx.play('skill');

    if (!player.silenced) {
      this.triggerCardSkill(playedCard, player, opponent, 'summon');
    } else {
      this.addLog(`🤐 ${player.name} ถูกใบ้ เอฟเฟกต์อัญเชิญไม่ทำงาน`);
    }

    if (this.isMultiplayer && isLocal) {
      this.broadcastAction({ type: 'SUMMON_MINION', card: playedCard, playerKey, minionId });
    }

    this.updateUI();
    this.showSummonEffect(minionId, playerKey);
    if (opponent.hp <= 0) this.handleGameOver(player);
    else if (player.hp <= 0) this.handleGameOver(opponent);
  }

  showSummonEffect(minionId, playerKey) {
    const token = document.querySelector(`[data-minion-id="${minionId}"]`);
    if (!token) return;
    token.classList.add('minion-summoning');
    token.dataset.summoningPlayer = playerKey;
    setTimeout(() => token.classList.remove('minion-summoning'), 850);
  }

  getOtherPlayerKey(playerKey) {
    return playerKey === 'p1' ? 'p2' : 'p1';
  }

  handleMinionLaneClick(event, lane) {
    const token = event.target.closest('.minion-token');
    if (!token) return;
    this.handleMinionClick(token.dataset.playerKey, token.dataset.minionId);
  }

  handleMinionClick(playerKey, minionId) {
    if (this.isResolvingCombat || (this.mode === 'bot' && this.isBotThinking)) return;
    const minion = this[playerKey]?.board.find((unit) => unit.id === minionId);
    if (!minion) return;

    if (this.selectedAttacker && this.selectedAttacker.playerKey === this.turn && playerKey !== this.turn) {
      this.attackWithMinion(this.turn, this.selectedAttacker.minionId, {
        type: 'minion', targetPlayerKey: playerKey, targetMinionId: minionId
      });
      return;
    }

    if (playerKey !== this.turn || !minion.canAttack || this.gameOver) return;
    this.selectedAttacker = { playerKey, minionId };
    this.updateUI();
    this.addLog(`เลือก ${minion.card.name} แล้ว — แตะมินเนียนศัตรูหรือฮีโร่เพื่อโจมตี`);
  }

  handleHeroTarget(position) {
    if (!this.selectedAttacker) return;
    const targetPlayerKey = position === 'bottom' ? this.getMyPlayerKey() : this.getOpponentPlayerKey();
    if (targetPlayerKey === this.selectedAttacker.playerKey) return;
    this.attackWithMinion(this.selectedAttacker.playerKey, this.selectedAttacker.minionId, {
      type: 'hero', targetPlayerKey
    });
  }

  handleMinionDragStart(event) {
    const token = event.target.closest('.minion-token');
    if (!token || !event.dataTransfer) return;
    event.dataTransfer.setData('application/x-ashigame-minion', JSON.stringify({
      playerKey: token.dataset.playerKey,
      minionId: token.dataset.minionId
    }));
    event.dataTransfer.effectAllowed = 'move';
  }

  readDraggedMinion(event) {
    if (!event.dataTransfer) return null;
    const payload = event.dataTransfer.getData('application/x-ashigame-minion');
    if (!payload) return null;
    try { return JSON.parse(payload); } catch (_error) { return null; }
  }

  handleLaneDrop(event, lane) {
    event.preventDefault();
    const playerKey = lane.dataset.playerKey;
    const draggedMinion = this.readDraggedMinion(event);
    if (draggedMinion) {
      this.attackWithMinion(draggedMinion.playerKey, draggedMinion.minionId, {
        type: 'minion', targetPlayerKey: playerKey,
        targetMinionId: event.target.closest('.minion-token')?.dataset.minionId || null
      });
      return;
    }

    if (playerKey !== this.turn) return;
    const cardId = event.dataTransfer?.getData('application/x-ashigame-card');
    if (!cardId) return;
    const card = this[playerKey].hand.find((held) => String(held.id) === cardId);
    if (card) this.summonMinion(card, playerKey);
  }

  attackWithMinion(playerKey, minionId, target, isLocal = true) {
    if (this.gameOver || this.isResolvingCombat || !target || this.turn !== playerKey) return;
    if (this.isMultiplayer && isLocal && playerKey !== this.getMyPlayerKey()) return;

    const attacker = this[playerKey]?.board.find((unit) => unit.id === minionId);
    const defenderKey = this.getOtherPlayerKey(playerKey);
    const defender = this[defenderKey];
    if (!attacker || !attacker.canAttack) return;

    const taunts = defender.board.filter((unit) => unit.taunt);
    if (target.type === 'hero' && taunts.length > 0) {
      this.addLog(`🛡️ ต้องโจมตีมินเนียนยั่วยุของ ${defender.name} ก่อน`);
      this.selectedAttacker = null;
      this.updateUI();
      return;
    }

    const targetMinion = target.type === 'minion'
      ? defender.board.find((unit) => unit.id === target.targetMinionId)
      : null;
    if (target.type === 'minion' && (!targetMinion || target.targetPlayerKey !== defenderKey)) return;
    if (target.type === 'minion' && taunts.length && !targetMinion.taunt) {
      this.addLog(`🛡️ ต้องโจมตีมินเนียนยั่วยุก่อน`);
      return;
    }
    if (target.type === 'hero' && target.targetPlayerKey !== defenderKey) return;

    attacker.canAttack = false;
    this.isResolvingCombat = true;
    this.selectedAttacker = null;
    this.animateMinionAttack(playerKey, minionId, target);
    sfx.play('attack');
    if (this.isMultiplayer && isLocal) {
      this.broadcastAction({
        type: 'ATTACK_MINION', playerKey, minionId,
        targetType: target.type,
        targetPlayerKey: target.targetPlayerKey,
        targetMinionId: target.targetMinionId || null
      });
    }

    const attackPower = attacker.atk;
    const retaliation = targetMinion ? targetMinion.atk : 0;
    const generation = this.combatGeneration;
    setTimeout(() => {
      if (generation !== this.combatGeneration) return;
      const currentAttacker = this[playerKey].board.find((unit) => unit.id === minionId);
      const combatHits = [];
      if (target.type === 'hero') {
        this.dealDamage(defender, attackPower, attacker.card.name);
      } else if (targetMinion) {
        this.damageMinion(targetMinion, attackPower, attacker.card.name);
        combatHits.push({ minionId: targetMinion.id, amount: attackPower });
        if (currentAttacker && retaliation > 0) {
          this.damageMinion(currentAttacker, retaliation, targetMinion.card.name);
          combatHits.push({ minionId: currentAttacker.id, amount: retaliation });
        }
      }

      this.removeDefeatedMinions(this.p1);
      this.removeDefeatedMinions(this.p2);
      this.updateUI();
      combatHits.forEach((hit) => this.showMinionImpact(hit.minionId, hit.amount));
      this.showTargetImpact(target);
      this.isResolvingCombat = false;
      if (defender.hp <= 0) this.handleGameOver(this[playerKey]);
      else if (this[playerKey].hp <= 0) this.handleGameOver(defender);
    }, 480);
  }

  animateMinionAttack(playerKey, minionId, target) {
    const attacker = document.querySelector(`[data-minion-id="${minionId}"]`);
    if (attacker) {
      attacker.classList.add(playerKey === this.getMyPlayerKey() ? 'attack-up' : 'attack-down');
      setTimeout(() => attacker.classList.remove('attack-up', 'attack-down'), 520);
    }
  }

  damageMinion(minion, amount, sourceName) {
    minion.health -= amount;
    this.addLog(`💥 ${sourceName} สร้างความเสียหาย ${amount} ให้ ${minion.card.name} (${Math.max(0, minion.health)} HP)`,'damage');
  }

  showMinionImpact(minionId, amount) {
    const token = document.querySelector(`[data-minion-id="${minionId}"]`);
    if (!token) return;
    const float = document.createElement('span');
    float.className = 'minion-damage-pop';
    float.textContent = `-${amount}`;
    token.appendChild(float);
    token.classList.add('battle-hit');
    setTimeout(() => {
      float.remove();
      token.classList.remove('battle-hit');
    }, 850);
  }

  showTargetImpact(target) {
    const targetEl = target.type === 'hero'
      ? (target.targetPlayerKey === this.getMyPlayerKey() ? this.p1HeroWrap : this.p2HeroWrap)
      : document.querySelector(`[data-minion-id="${target.targetMinionId}"]`);
    if (!targetEl) return;
    targetEl.classList.add('battle-hit');
    setTimeout(() => targetEl.classList.remove('battle-hit'), 500);
  }

  removeDefeatedMinions(player) {
    player.board = player.board.filter((minion) => {
      if (minion.health > 0) return true;
      player.discard.push(minion.card);
      this.addLog(`💀 ${minion.card.name} พ่ายแพ้และถูกส่งไปสุสาน`);
      return false;
    });
  }

  showFloatingText(player, text, type = 'dmg') {
    const myKey = this.getMyPlayerKey();
    const isMe = (player === this[myKey]);
    const wrap = isMe ? document.getElementById('p1HeroWrap') : document.getElementById('p2HeroWrap');
    if (!wrap) return;
    const socket = wrap.querySelector('.hero-portrait-socket');
    if (!socket) return;

    const floatEl = document.createElement('div');
    floatEl.className = `floating-dmg ${type}`;
    floatEl.innerText = text;
    socket.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1200);
  }

  triggerArenaShake() {
    const board = document.querySelector('.tabletop-board');
    if (board) {
      board.classList.remove('board-impact-shake');
      void board.offsetWidth;
      board.classList.add('board-impact-shake');
      setTimeout(() => board.classList.remove('board-impact-shake'), 450);
    }
  }

  dealDamage(target, amount, sourceName, isTrueDamage = false) {
    if (amount >= 7) {
      this.triggerArenaShake();
    }

    let finalHpDmg = amount;
    if (!isTrueDamage && target.shield > 0) {
      if (target.shield >= amount) {
        target.shield -= amount;
        finalHpDmg = 0;
        this.showFloatingText(target, `-${amount} 🛡️`, 'shield');
        this.addLog(`🛡️ เกราะของ ${target.name} ดูดซับดาเมจ ${amount} หน่วย (เหลือเกราะ ${target.shield})`);
      } else {
        finalHpDmg = amount - target.shield;
        this.showFloatingText(target, `แตก! 🛡️`, 'shield');
        this.addLog(`🛡️ เกราะของ ${target.name} แตก! ซับไป ${target.shield} หน่วย`);
        target.shield = 0;
      }
    }

    if (finalHpDmg > 0) {
      target.hp = Math.max(0, target.hp - finalHpDmg);
      this.showFloatingText(target, `-${finalHpDmg} 💥`, 'dmg');
      this.addLog(`💥 ${target.name} ได้รับความเสียหาย ${finalHpDmg} หน่วย! (เหลือ ${target.hp} HP)`, 'damage');
    }
  }

  triggerCardSkill(card, user, target, stance) {
    const skill = card.skill;
    sfx.play('skill');
    this.addLog(`✨ [สกิล] ${user.name} ร่าย "${skill.name}": ${skill.desc}`, 'skill');

    switch (skill.type) {
      case 'heal_shield':
        user.hp = Math.min(user.maxHp, user.hp + (skill.healVal || 4));
        user.shield += (skill.shieldVal || 3);
        sfx.play('heal');
        break;

      case 'shield_reflect':
        user.shield += (skill.shieldVal || 5);
        this.dealDamage(target, skill.dmgVal || 4, user.name, true);
        break;

      case 'true_damage':
        this.dealDamage(target, skill.dmgVal || 5, user.name, true);
        break;

      case 'damage_weaken':
        this.dealDamage(target, skill.dmgVal || 4, user.name);
        target.weaken = skill.weakenVal || 2;
        break;

      case 'recoil_attack':
        this.dealDamage(target, skill.extraDmg || 4, user.name);
        user.hp = Math.max(0, user.hp - (skill.selfDmg || 2));
        this.addLog(`💥 โดนแรงสะท้อน! ${user.name} เสียเลือด ${skill.selfDmg || 2} HP`);
        break;

      case 'evade_strike':
        this.dealDamage(target, skill.dmgVal || 5, user.name);
        user.shield += (skill.shieldVal || 4);
        break;

      case 'discard_enemy':
        this.dealDamage(target, skill.dmgVal || 2, user.name);
        if (target.hand.length > 0) {
          const randIdx = Math.floor(Math.random() * target.hand.length);
          const discarded = target.hand.splice(randIdx, 1)[0];
          target.discard.push(discarded);
          this.addLog(`🗑️ ${target.name} ตกใจจนทำ "${discarded.name}" หลุดมือทิ้งลงสุสาน!`);
        }
        break;

      case 'super_shield':
        user.shield += (skill.shieldVal || 8);
        user.hp = Math.min(user.maxHp, user.hp + (skill.healVal || 2));
        sfx.play('heal');
        break;

      case 'break_guard':
        if (target.shield > 0) {
          this.addLog(`🔨 หมัดทลายเกราะ! ลบล้างเกราะ ${target.shield} ของ ${target.name} ทิ้งทั้งหมด!`);
          target.shield = 0;
        }
        this.dealDamage(target, skill.dmgVal || 8, user.name);
        break;

      case 'poison_drain':
        this.dealDamage(target, skill.dmgVal || 4, user.name);
        target.poison += (skill.poisonVal || 3);
        this.addLog(`🧪 ${target.name} สูดควันพิษเข้าไป ติดพิษสะสม ${target.poison} หน่วย!`);
        break;

      case 'steal_energy':
        if (target.energy > 0) {
          target.energy = Math.max(0, target.energy - 1);
          user.energy += 1;
          this.addLog(`⚡ ${user.name} ฉก Energy จาก ${target.name} มาได้ 1 แต้ม!`);
        }
        this.drawCard(user, true);
        break;

      case 'weaken_heal':
        user.hp = Math.min(user.maxHp, user.hp + (skill.healVal || 4));
        target.weaken = 3;
        sfx.play('heal');
        break;

      case 'berserk_buff':
        const bonus = (skill.boostAtk || 6) + user.shield;
        user.shield = 0;
        this.dealDamage(target, bonus, user.name);
        this.addLog(`🔥 บ้าคลั่งขั้นสุด! สละเกราะแปลงเป็นพลังหมัดระเบิด ${bonus} ดาเมจ!`);
        break;

      case 'lifesteal':
        const drain = skill.dmgVal || 6;
        this.dealDamage(target, drain, user.name);
        user.hp = Math.min(user.maxHp, user.hp + drain);
        sfx.play('heal');
        this.addLog(`🩸 ดูดเลือดคืนชีพ! ${user.name} ได้รับ HP ฟื้นฟู +${drain}`);
        break;

      case 'quick_draw':
        this.dealDamage(target, skill.dmgVal || 4, user.name);
        this.drawCard(user, true);
        this.drawCard(user, true);
        break;

      case 'grant_energy':
        user.energy += (skill.energyVal || 2);
        user.shield += (skill.shieldVal || 4);
        break;

      case 'nuke_strike':
        this.dealDamage(target, skill.dmgVal || 10, user.name);
        break;

      case 'silence_skill':
        this.dealDamage(target, skill.dmgVal || 4, user.name);
        target.silenced = true;
        this.addLog(`🤫 ${target.name} ถูกสั่งห้ามพูด ติดสถานะใบ้สกิลในเทิร์นหน้า!`);
        break;

      case 'cleanse_heal':
        user.poison = 0;
        user.weaken = 0;
        user.blinded = false;
        user.hp = Math.min(user.maxHp, user.hp + (skill.healVal || 6));
        sfx.play('heal');
        this.addLog(`✨ ล้างมลทินและดีบัฟทั้งหมดสะอาดเกลี้ยง!`);
        break;

      case 'blind_enemy':
        this.dealDamage(target, skill.dmgVal || 5, user.name);
        target.blinded = true;
        this.addLog(`😎 ${target.name} โดนพ่นหมึกเข้าตา ติดสถานะตาบอด!`);
        break;

      case 'steal_hand_card':
        this.dealDamage(target, skill.dmgVal || 7, user.name);
        if (target.hand.length > 0 && user.hand.length < 7) {
          const stolenIdx = Math.floor(Math.random() * target.hand.length);
          const stolenCard = target.hand.splice(stolenIdx, 1)[0];
          user.hand.push(stolenCard);
          this.addLog(`💋 ดาเมจเย้ายวน! ขโมยการ์ด "${stolenCard.name}" มาครอบครอง!`);
        }
        break;
    }
  }

  playBotTurn() {
    this.isBotThinking = true;
    this.addLog(`🤖 บ็อตกำลังวางแผนลงมินเนียนและเลือกเป้าหมาย...`);

    const botStep = () => {
      if (this.gameOver || this.turn !== 'p2') {
        this.isBotThinking = false;
        return;
      }

      const affordableCards = this.p2.hand
        .filter((card) => card.cost <= this.p2.energy)
        .sort((a, b) => (b.atk + b.def + b.cost) - (a.atk + a.def + a.cost));

      if (affordableCards.length && this.p2.board.length < 7) {
        const chosenCard = affordableCards[0];
        this.addLog(`🤖 บ็อตอัญเชิญ "${chosenCard.name}"`);
        this.summonMinion(chosenCard, 'p2', false);
        setTimeout(botStep, 720);
        return;
      }

      const readyMinion = this.p2.board.find((minion) => minion.canAttack);
      if (readyMinion) {
        const enemyTaunts = this.p1.board.filter((minion) => minion.taunt);
        const enemyBoard = enemyTaunts.length ? enemyTaunts : this.p1.board;
        const profitableTrade = enemyBoard
          .filter((minion) => readyMinion.atk >= minion.health)
          .sort((a, b) => a.atk - b.atk)[0];

        if (profitableTrade || enemyTaunts.length) {
          const target = profitableTrade || [...enemyTaunts].sort((a, b) => a.health - b.health)[0];
          this.attackWithMinion('p2', readyMinion.id, {
            type: 'minion', targetPlayerKey: 'p1', targetMinionId: target.id
          }, false);
        } else {
          this.attackWithMinion('p2', readyMinion.id, { type: 'hero', targetPlayerKey: 'p1' }, false);
        }
        setTimeout(botStep, 760);
        return;
      }

      this.isBotThinking = false;
      this.addLog(`🤖 บ็อตจบรอบการเล่น`);
      this.endCurrentTurn();
    };

    setTimeout(botStep, 700);
  }

  handleGameOver(winner) {
    this.gameOver = true;
    sfx.play('victory');
    this.addLog(`🏆 เกมจบลงแล้ว! ผู้ชนะคือ: ${winner.name}!`, 'victory');

    const myKey = this.getMyPlayerKey();
    const isMe = (winner === this[myKey]);

    if (this.isMultiplayer) {
      this.winnerTitle.innerText = isMe ? `🎉 คุณคือผู้ชนะ!` : `💀 เพื่อนของคุณเป็นฝ่ายชนะ!`;
      this.winnerMessage.innerText = isMe
        ? "ยินดีด้วย! คุณเกรียนและแกร่งที่สุดในศึกดวลครั้งนี้!"
        : "เพื่อนสอนเชิงเข้าให้แล้ว! กดปุ่มรีแมตช์ด้านล่างเพื่อล้างแค้นได้เลย!";
    } else {
      this.winnerTitle.innerText = `🎉 ผู้ชนะคือ ${winner.name}!`;
      this.winnerMessage.innerText = winner === this.p1
        ? "ยินดีด้วย! คุณเกรียนและแกร่งที่สุดในวงเพื่อน!"
        : "บ็อตสอนเชิงคุณเข้าให้แล้ว! ลองล้างแค้นอีกสักเกมไหม?";
    }
    this.gameOverModal.classList.add('active');
  }

  addLog(msg, type = '') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerText = msg;
    this.combatLog.appendChild(div);
    this.combatLog.scrollTop = this.combatLog.scrollHeight;
  }

  updateUI() {
    const myKey = this.getMyPlayerKey();
    const oppKey = this.getOpponentPlayerKey();

    const myPlayer = this[myKey];
    const oppPlayer = this[oppKey];

    // Update Bottom Stats (My Hero)
    this.p1Name.innerText = myPlayer.name;
    this.p1HpText.innerText = `${myPlayer.hp}`;
    if (this.p1HpFill) this.p1HpFill.style.width = `${(myPlayer.hp / myPlayer.maxHp) * 100}%`;
    
    if (this.p1ShieldText) {
      if (myPlayer.shield > 0) {
        this.p1ShieldText.classList.remove('hidden');
        this.p1ShieldText.innerText = `+${myPlayer.shield}`;
      } else {
        this.p1ShieldText.classList.add('hidden');
      }
    }
    if (this.p1ShieldFill) this.p1ShieldFill.style.width = `${Math.min(100, (myPlayer.shield / 20) * 100)}%`;
    this.p1EnergyText.innerText = `${myPlayer.energy}/${myPlayer.maxEnergy}`;
    if (this.p1DeckCount) this.p1DeckCount.innerText = `${myPlayer.deck.length}`;

    // Update Top Stats (Opponent Hero)
    this.p2Name.innerText = oppPlayer.name;
    this.p2HpText.innerText = `${oppPlayer.hp}`;
    if (this.p2HpFill) this.p2HpFill.style.width = `${(oppPlayer.hp / oppPlayer.maxHp) * 100}%`;
    
    if (this.p2ShieldText) {
      if (oppPlayer.shield > 0) {
        this.p2ShieldText.classList.remove('hidden');
        this.p2ShieldText.innerText = `+${oppPlayer.shield}`;
      } else {
        this.p2ShieldText.classList.add('hidden');
      }
    }
    if (this.p2ShieldFill) this.p2ShieldFill.style.width = `${Math.min(100, (oppPlayer.shield / 20) * 100)}%`;
    this.p2EnergyText.innerText = `${oppPlayer.energy}/${oppPlayer.maxEnergy}`;
    if (this.p2DeckCount) this.p2DeckCount.innerText = `${oppPlayer.deck.length} ใบในสำรับ`;

    // Energy Crystals Bottom (My Hero)
    this.p1EnergyOrbs.innerHTML = '';
    for (let i = 0; i < myPlayer.maxEnergy; i++) {
      const gem = document.createElement('div');
      gem.className = `mana-gem ${i < myPlayer.energy ? 'filled' : ''}`;
      this.p1EnergyOrbs.appendChild(gem);
    }

    // Energy Crystals Top (Opponent Hero)
    this.p2EnergyOrbs.innerHTML = '';
    for (let i = 0; i < oppPlayer.maxEnergy; i++) {
      const gem = document.createElement('div');
      gem.className = `mana-gem ${i < oppPlayer.energy ? 'filled' : ''}`;
      this.p2EnergyOrbs.appendChild(gem);
    }

    // Turn Highlights
    const p1Wrap = document.getElementById('p1HeroWrap');
    const p2Wrap = document.getElementById('p2HeroWrap');

    const isMyTurn = (this.turn === myKey);

    if (isMyTurn) {
      this.turnBanner.innerText = `⚔️ เทิร์นของคุณ! (${myPlayer.name})`;
      this.turnBanner.style.borderColor = '#22c55e';
      this.turnBanner.style.color = '#4ade80';
      if (p1Wrap) p1Wrap.classList.add('active-turn');
      if (p2Wrap) p2Wrap.classList.remove('active-turn');
      this.endTurnBtn.disabled = false;
      this.endTurnBtn.classList.remove('disabled');
      this.endTurnBtn.innerHTML = `<span>จบเทิร์น<br><small style="font-size:9.5px;letter-spacing:1px;opacity:0.9;">END TURN</small></span>`;
    } else {
      this.turnBanner.innerText = `⏳ เทิร์นของ ${oppPlayer.name}`;
      this.turnBanner.style.borderColor = 'var(--gold-dark)';
      this.turnBanner.style.color = 'var(--gold-highlight)';
      if (p1Wrap) p1Wrap.classList.remove('active-turn');
      if (p2Wrap) p2Wrap.classList.add('active-turn');
      this.endTurnBtn.disabled = true;
      this.endTurnBtn.classList.add('disabled');
      this.endTurnBtn.innerHTML = `<span>เทิร์นศัตรู<br><small style="font-size:9.5px;letter-spacing:1px;opacity:0.85;">ENEMY TURN</small></span>`;
    }

    // Render Hands
    // Bottom: My Hand (Face Up with Artwork)
    this.renderHand(myPlayer, this.p1HandZone, myKey, false);

    // Top: Opponent Hand (Card Backs - Completely Hidden in Multiplayer & Bot Mode!)
    const isOpponentHidden = this.isMultiplayer || (this.mode === 'bot');
    this.renderHand(oppPlayer, this.p2HandZone, oppKey, isOpponentHidden);

    this.p1BoardZone.dataset.playerKey = myKey;
    this.p2BoardZone.dataset.playerKey = oppKey;
    this.renderMinions(myPlayer, this.p1BoardZone, myKey);
    this.renderMinions(oppPlayer, this.p2BoardZone, oppKey);
    document.getElementById('p1MinionCount').innerText = `${myPlayer.board.length}/7`;
    document.getElementById('p2MinionCount').innerText = `${oppPlayer.board.length}/7`;
    if (this.selectedAttacker) {
      const unit = this[this.selectedAttacker.playerKey].board.find((entry) => entry.id === this.selectedAttacker.minionId);
      const targetBoard = this.selectedAttacker.playerKey === myKey ? this.p2BoardZone : this.p1BoardZone;
      const targetHero = this.selectedAttacker.playerKey === myKey ? this.p2HeroWrap : this.p1HeroWrap;
      const enemyTokens = [...targetBoard.querySelectorAll('.minion-token')];
      const tauntTokens = enemyTokens.filter((token) => token.classList.contains('has-taunt'));
      const validTokens = tauntTokens.length ? tauntTokens : enemyTokens;
      validTokens.forEach((token) => token.classList.add('valid-target'));
      this.p1HeroWrap.classList.toggle('valid-target', tauntTokens.length === 0 && targetHero === this.p1HeroWrap);
      this.p2HeroWrap.classList.toggle('valid-target', tauntTokens.length === 0 && targetHero === this.p2HeroWrap);
      this.battleTickerMsg.innerText = unit
        ? `เลือก ${unit.card.name} แล้ว — แตะมินเนียนศัตรูหรือฮีโร่เพื่อโจมตี`
        : 'เลือกมินเนียนพร้อมโจมตี แล้วแตะเป้าหมาย';
      this.battleTickerMsg.classList.add('targeting');
    } else {
      this.p1HeroWrap.classList.remove('valid-target');
      this.p2HeroWrap.classList.remove('valid-target');
      this.battleTickerMsg.innerText = this.turn === myKey
        ? 'เล่นการ์ดเพื่ออัญเชิญ แล้วเลือกมินเนียนเพื่อโจมตี'
        : `${oppPlayer.name} กำลังเล่นเทิร์น`;
      this.battleTickerMsg.classList.remove('targeting');
    }
  }

  renderHand(player, container, playerKey, isCardBack = false) {
    container.innerHTML = '';

    if (isCardBack) {
      for (let i = 0; i < player.hand.length; i++) {
        const back = document.createElement('div');
        back.className = 'enemy-card-back';
        back.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
        container.appendChild(back);
      }
      return;
    }

    const isMyTurn = (this.turn === playerKey);
    const totalCards = player.hand.length;
    player.hand.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card-item';
      cardEl.draggable = isMyTurn && player.energy >= card.cost && player.board.length < 7;
      if (!isMyTurn || player.energy < card.cost || player.board.length >= 7) {
        cardEl.classList.add('unplayable');
      }
      cardEl.dataset.cat = card.category;

      // Arc Fan Geometry with preserved CSS variables
      const mid = (totalCards - 1) / 2;
      const offset = index - mid;
      const rotateDeg = offset * 4;
      const translateY = Math.abs(offset) * 6;
      const translateX = offset * 48;

      cardEl.style.setProperty('--card-tx', `${translateX}px`);
      cardEl.style.setProperty('--card-ty', `${translateY}px`);
      cardEl.style.setProperty('--card-rot', `${rotateDeg}deg`);
      cardEl.style.zIndex = index + 1;

      cardEl.innerHTML = `
        <div class="card-mana-gem">${card.cost}</div>
        <div class="card-class-seal">${card.category}</div>
        <div class="card-art-frame">
          <img src="${card.image}" alt="${card.name}" loading="lazy" draggable="false" />
        </div>
        <div class="card-banner-ribbon">
          <div class="card-title-text">${card.name}</div>
        </div>
        <div class="card-rules-parchment">
          <div class="skill-headline">${card.skill.name}</div>
          <div class="skill-description">${card.skill.desc}</div>
        </div>
        <div class="stat-crest attack-crest" title="พลังโจมตี (ATK)">${card.atk}</div>
        <div class="stat-crest defense-crest" title="พลังชีวิต (HP)">${card.def}</div>
      `;

      cardEl.addEventListener('click', () => {
        if (this.suppressNextCardClick) return;
        this.openCardAction(card, playerKey);
      });

      cardEl.addEventListener('dragstart', (event) => {
        if (!cardEl.draggable || !event.dataTransfer) {
          event.preventDefault();
          return;
        }
        this.suppressNextCardClick = true;
        event.dataTransfer.setData('application/x-ashigame-card', String(card.id));
        event.dataTransfer.effectAllowed = 'move';
        cardEl.classList.add('is-dragging');
      });
      cardEl.addEventListener('dragend', () => {
        cardEl.classList.remove('is-dragging');
        setTimeout(() => { this.suppressNextCardClick = false; }, 120);
      });

      container.appendChild(cardEl);
    });
  }

  renderMinions(player, container, playerKey) {
    container.innerHTML = '';
    player.board.forEach((minion) => {
      const token = document.createElement('button');
      token.type = 'button';
      token.className = 'minion-token';
      token.dataset.minionId = minion.id;
      token.dataset.playerKey = playerKey;
      token.draggable = minion.canAttack && this.turn === playerKey;
      if (minion.canAttack && this.turn === playerKey) token.classList.add('can-attack');
      if (minion.taunt) token.classList.add('has-taunt');
      if (this.selectedAttacker?.minionId === minion.id && this.selectedAttacker?.playerKey === playerKey) {
        token.classList.add('is-selected');
      }

      token.innerHTML = `
        <span class="minion-aura"></span>
        <span class="minion-art"><img src="${minion.card.image}" alt="" draggable="false" /></span>
        ${minion.taunt ? '<span class="minion-taunt">TAUNT</span>' : ''}
        <span class="minion-name">${minion.card.name}</span>
        <span class="minion-stat minion-atk">${minion.atk}</span>
        <span class="minion-stat minion-health">${minion.health}</span>
        ${minion.summoningSick ? '<span class="sleeping-mark" title="เทิร์นนี้ยังโจมตีไม่ได้">☾</span>' : ''}
      `;
      token.title = `${minion.card.name} — ATK ${minion.atk} / HP ${minion.health}${minion.taunt ? ' / Taunt' : ''}`;
      container.appendChild(token);
    });
  }

  initDexFilters() {
    this.currentDexFilter = 'all';
    this.currentDexSearch = '';

    const filterPills = document.querySelectorAll('#dexFilterPills .filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentDexFilter = pill.dataset.filter;
        this.renderDex();
      });
    });

    const searchInput = document.getElementById('dexSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentDexSearch = e.target.value.toLowerCase().trim();
        this.renderDex();
      });
    }
  }

  renderDex() {
    const grid = document.getElementById('dexGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const filter = this.currentDexFilter || 'all';
    const query = this.currentDexSearch || '';

    const filtered = CARDS_DATA.filter(c => {
      const matchCat = (filter === 'all') || (c.category === filter);
      const matchQuery = !query || 
        c.name.toLowerCase().includes(query) || 
        c.sub.toLowerCase().includes(query) ||
        c.skill.name.toLowerCase().includes(query) ||
        c.quote.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px; font-size: 15px;">🔍 ไม่พบการ์ดที่ตรงกับคำค้นหา</div>`;
      return;
    }

    filtered.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card-item';
      cardEl.dataset.cat = card.category;
      cardEl.style.position = 'relative';
      cardEl.innerHTML = `
        <div class="card-mana-gem">${card.cost}</div>
        <div class="card-class-seal">${card.categoryName}</div>
        <div class="card-art-frame">
          <img src="${card.image}" alt="${card.name}" loading="lazy" />
        </div>
        <div class="card-banner-ribbon">
          <div class="card-title-text">${card.name}</div>
        </div>
        <div class="card-rules-parchment" style="margin-bottom: 8px;">
          <div class="skill-headline">${card.skill.name}</div>
          <div class="skill-description">${card.skill.desc}</div>
          <div style="font-size: 8.5px; font-style: italic; color: #8c6209; margin-top: 4px;">"${card.quote}"</div>
        </div>
        <div class="stat-crest attack-crest" title="พลังโจมตี (ATK)">${card.atk}</div>
        <div class="stat-crest defense-crest" title="พลังชีวิต (HP)">${card.def}</div>
      `;
      grid.appendChild(cardEl);
    });
  }

  renderPrintSheets() {
    const container = document.getElementById('printSheetsContainer');
    if (!container) return;
    container.innerHTML = '';

    // Standard 3x3 (9 cards per sheet)
    const cardsPerSheet = 9;
    const totalSheets = Math.ceil(CARDS_DATA.length / cardsPerSheet);

    for (let s = 0; s < totalSheets; s++) {
      const sheet = document.createElement('div');
      sheet.className = 'a4-sheet';

      const start = s * cardsPerSheet;
      const end = Math.min(start + cardsPerSheet, CARDS_DATA.length);
      const sheetCards = CARDS_DATA.slice(start, end);

      const header = document.createElement('div');
      header.className = 'sheet-title';
      header.innerText = `Meme Duel Card Game — แผ่นพิมพ์การ์ดที่ ${s + 1}/${totalSheets} (ขนาด A4 ตัดตามเส้นประ)`;
      sheet.appendChild(header);

      sheetCards.forEach(c => {
        const cardBox = document.createElement('div');
        cardBox.className = 'print-card';
        cardBox.innerHTML = `
          <div class="print-card-header">
            <div class="print-cost">${c.cost}</div>
            <div class="print-title">${c.name}</div>
          </div>
          <div class="print-img">
            <img src="${c.image}" alt="${c.name}" />
          </div>
          <div class="print-skill-box">
            <span class="print-skill-name">⭐ ${c.skill.name}</span>
            <div>${c.skill.desc}</div>
          </div>
          <div class="print-footer">
            <span class="print-atk">⚔️ ATK ${c.atk}</span>
            <span class="print-def">❤️ HP ${c.def}</span>
          </div>
        `;
        sheet.appendChild(cardBox);
      });

      // Fill remaining slots on last sheet with Card Backs
      if (sheetCards.length < cardsPerSheet) {
        const fillCount = cardsPerSheet - sheetCards.length;
        for (let f = 0; f < fillCount; f++) {
          const backCard = document.createElement('div');
          backCard.className = 'print-card card-back';
          backCard.innerHTML = `
            <div class="print-card-back-inner">
              <div class="back-logo">🃏</div>
              <div class="back-text">MEME DUEL</div>
              <div style="font-size: 6pt; color: #aaa;">FRIENDS EDITION</div>
            </div>
          `;
          sheet.appendChild(backCard);
        }
      }

      container.appendChild(sheet);
    }

    // Extra Sheet: 9 Card Backs for printing back-side!
    const backSheet = document.createElement('div');
    backSheet.className = 'a4-sheet';
    const backHeader = document.createElement('div');
    backHeader.className = 'sheet-title';
    backHeader.innerText = `Meme Duel Card Game — แผ่นพิมพ์หลังการ์ด (Card Back Template) สำหรับพิมพ์หลังหรือประกบกระดาษ`;
    backSheet.appendChild(backHeader);

    for (let b = 0; b < 9; b++) {
      const backCard = document.createElement('div');
      backCard.className = 'print-card card-back';
      backCard.innerHTML = `
        <div class="print-card-back-inner">
          <div class="back-logo">🃏</div>
          <div class="back-text">MEME DUEL</div>
          <div style="font-size: 6pt; color: #ffa502;">FRIENDS EDITION</div>
          <div style="font-size: 5pt; color: #888;">มิตรภาพไม่พัง ก็ตังค์ไม่เหลือ</div>
        </div>
      `;
      backSheet.appendChild(backCard);
    }
    container.appendChild(backSheet);
  }
}

// Instantiate game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.memeGame = new MemeGame();
});
