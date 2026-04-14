import * as THREE from 'three';
import {
  PLAYER_CONFIGS, KEY_BINDINGS, MATCH_DURATION,
  KILLS_TO_WIN, PLAYER_RADIUS
} from './constants.js';
import { InputManager } from './InputManager.js';
import { Arena } from './Arena.js';
import { Player } from './Player.js';
import { ProjectileManager } from './ProjectileManager.js';
import { PickupManager } from './PickupManager.js';
import { HUD } from './HUD.js';
import { CameraController } from './CameraController.js';
import { BotController } from './BotController.js';
import { TouchControls } from './TouchControls.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);

    this.input = new InputManager();
    this.touch = new TouchControls();
    this.hud = new HUD();
    this.cameraController = new CameraController(this.camera);

    this.players = [];
    this.bots = [];
    this.arena = null;
    this.projectiles = null;
    this.pickups = null;

    this.playerCount = 2;
    this.botDifficulty = 'normal';
    this.matchTimer = MATCH_DURATION;
    this.gameState = 'menu';
    this.lastTime = performance.now();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupMenu();
    this.setupPauseMenu();
    window._game = this;
    this.startLoop();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setupMenu() {
    const buttons = document.querySelectorAll('.player-count-btns button[data-count]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.playerCount = parseInt(btn.dataset.count);
      });
    });
    const diffBtns = document.querySelectorAll('.bot-diff-btns button[data-diff]');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.botDifficulty = btn.dataset.diff;
      });
    });

    document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    document.getElementById('restartBtn').addEventListener('click', () => this.startGame());

    // Auto-select 1 player on touch devices
    if (this.touch.active) {
      this.playerCount = 1;
      buttons.forEach(b => b.classList.remove('selected'));
      const btn1 = document.querySelector('.player-count-btns button[data-count="1"]');
      if (btn1) btn1.classList.add('selected');
    }
  }

  setupPauseMenu() {
    document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
    document.getElementById('quitBtn').addEventListener('click', () => this.quitToMenu());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.gameState === 'playing') {
          this.pauseGame();
        } else if (this.gameState === 'paused') {
          this.resumeGame();
        }
      }
    });
  }

  pauseGame() {
    this.gameState = 'paused';
    document.getElementById('pauseMenu').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
  }

  resumeGame() {
    this.gameState = 'playing';
    this.lastTime = performance.now();
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }

  quitToMenu() {
    this.gameState = 'menu';
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
  }

  startGame() {
    if (this.arena) {
      while (this.scene.children.length > 0) this.scene.remove(this.scene.children[0]);
    }
    if (this.projectiles) this.projectiles.clear();
    if (this.pickups) this.pickups.clear();

    document.getElementById('menu').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    this.arena = new Arena(this.scene);

    this.players = [];
    this.bots = [];
    for (let i = 0; i < 4; i++) {
      const player = new Player(i, this.scene, PLAYER_CONFIGS[i]);
      this.players.push(player);
      if (i >= this.playerCount) {
        player.isBot = true;
        this.bots.push(new BotController(player, this.botDifficulty));
      }
    }

    this.projectiles = new ProjectileManager(this.scene);
    this.pickups = new PickupManager(this.scene);
    this.pickups.platforms = this.arena.platforms;

    for (const p of this.players) {
      p._platforms = this.arena.platforms;
    }

    this.hud.init(this.players);
    this.matchTimer = MATCH_DURATION;
    this.gameState = 'playing';
  }

  endGame() {
    this.gameState = 'gameover';
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameOver').classList.remove('hidden');

    let maxKills = -1, winner = null;
    for (const p of this.players) {
      if (p.kills > maxKills) { maxKills = p.kills; winner = p; }
    }

    const wc = PLAYER_CONFIGS[winner.index];
    const botTag = winner.isBot ? ' (BOT)' : '';
    document.getElementById('winnerText').innerHTML =
      `<span style="color:${wc.css}">${wc.name}${botTag}</span> WINS!`;

    let scoresHTML = '';
    const sorted = [...this.players].sort((a, b) => b.kills - a.kills);
    for (const p of sorted) {
      const c = PLAYER_CONFIGS[p.index];
      const bt = p.isBot ? ' (BOT)' : '';
      scoresHTML += `<span style="color:${c.css}">${c.name}${bt}</span>: ${p.kills} kills / ${p.deaths} deaths<br>`;
    }
    document.getElementById('finalScores').innerHTML = scoresHTML;
  }

  update(dt) {
    if (this.gameState !== 'playing') return;
    dt = Math.min(dt, 0.05);

    this.matchTimer -= dt;
    this.hud.updateTimer(this.matchTimer);

    if (this.matchTimer <= 0) { this.endGame(); return; }
    for (const p of this.players) {
      if (p.kills >= KILLS_TO_WIN) { this.endGame(); return; }
    }

    const prevHealth = this.players.map(p => ({ health: p.health, alive: p.alive }));

    // Update human players
    for (const p of this.players) {
      if (p.isBot) continue;
      p.update(dt, this.input, KEY_BINDINGS[p.index], this.arena.platforms, this.touch);
    }

    // Update bots
    for (const bot of this.bots) {
      const p = bot.player;
      if (!p.alive) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) p.spawn();
        continue;
      }
      p.invulnTimer = Math.max(0, p.invulnTimer - dt);
      p.shootCooldown = Math.max(0, p.shootCooldown - dt);
      p.muzzleTimer = Math.max(0, p.muzzleTimer - dt);
      p.char.muzzle.visible = p.muzzleTimer > 0;
      if (p.invulnTimer > 0) {
        p.mesh.visible = Math.floor(p.invulnTimer * 10) % 2 === 0;
      } else {
        p.mesh.visible = true;
      }
      bot.update(dt, this.players, this.pickups.pickups);
    }

    // Shooting (human)
    for (const p of this.players) {
      if (p.isBot) continue;
      if (p.canShoot(this.input, KEY_BINDINGS[p.index], this.touch)) {
        const shots = p.shoot();
        for (const s of shots) {
          this.projectiles.spawn(s.pos, s.dir, s.owner, s.weaponType);
        }
      }
    }

    // Bot shooting
    for (const bot of this.bots) {
      const p = bot.player;
      if (p.alive && p.shootCooldown <= 0 && bot.wantShoot) {
        const shots = p.shoot();
        for (const s of shots) {
          this.projectiles.spawn(s.pos, s.dir, s.owner, s.weaponType);
        }
      }
    }

    // Projectiles
    const prevKills = this.players.map(p => p.kills);
    this.projectiles.update(dt, this.players, this.arena.platforms);

    // Kill feed
    for (const p of this.players) {
      if (p.kills > prevKills[p.index]) {
        for (const victim of this.players) {
          if (victim.index !== p.index && prevHealth[victim.index].alive && !victim.alive) {
            const kc = PLAYER_CONFIGS[p.index];
            const vc = PLAYER_CONFIGS[victim.index];
            this.hud.addKillMessage(kc.name, kc.css, vc.name, vc.css);
          }
        }
      }
    }

    // Pickups
    this.pickups.update(dt, this.players);

    // Push players apart
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i], b = this.players[j];
        if (!a.alive || !b.alive) continue;
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = PLAYER_RADIUS * 2.5;
        if (dist < minDist && dist > 0.01) {
          const push = (minDist - dist) * 0.5;
          const nx = dx / dist, nz = dz / dist;
          a.pos.x -= nx * push; a.pos.z -= nz * push;
          b.pos.x += nx * push; b.pos.z += nz * push;
        }
      }
    }

    // Camera
    this.cameraController.update(this.players, dt);

    // HUD
    for (const p of this.players) {
      this.hud.updateHealthBar(p.index, p, this.camera, this.canvas);
      this.hud.updateScore(p.index, p.kills);
    }
  }

  startLoop() {
    // Uses MessageChannel instead of requestAnimationFrame
    // because RAF gets throttled in background/inactive tabs
    const channel = new MessageChannel();
    const targetInterval = 1000 / 60;
    const throttledTick = () => {
      const now = performance.now();
      const elapsed = now - this.lastTime;
      if (elapsed >= targetInterval * 0.8) {
        const dt = Math.min(elapsed / 1000, 0.1);
        this.lastTime = now;
        this.update(dt);
        this.renderer.render(this.scene, this.camera);
        this.input.clearFrame();
      }
      channel.port2.postMessage(null);
    };
    channel.port1.onmessage = throttledTick;
    channel.port2.postMessage(null);
  }
}
