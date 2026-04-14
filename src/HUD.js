import { MAX_HEALTH, PLAYER_HEIGHT, PLAYER_CONFIGS, WEAPONS } from './constants.js';

export class HUD {
  constructor() {
    this.scorePanel = document.getElementById('scorePanel');
    this.timer = document.getElementById('timer');
    this.killFeed = document.getElementById('killFeed');
    this.healthBarsContainer = document.getElementById('healthBars');
    this.healthBars = [];
  }

  init(players) {
    this.scorePanel.innerHTML = '';
    for (let i = 0; i < players.length; i++) {
      const c = PLAYER_CONFIGS[i];
      const label = players[i].isBot ? '(BOT)' : '';
      const item = document.createElement('div');
      item.className = 'score-item';
      item.innerHTML = `
        <div class="score-color" style="background:${c.css}"></div>
        <span id="score-${i}">0</span> <span style="font-size:0.35rem;opacity:0.6">${label}</span>
      `;
      this.scorePanel.appendChild(item);
    }

    this.healthBarsContainer.innerHTML = '';
    this.healthBars = [];
    for (let i = 0; i < players.length; i++) {
      const c = PLAYER_CONFIGS[i];
      const botTag = players[i].isBot ? ' (BOT)' : '';
      const container = document.createElement('div');
      container.className = 'health-bar-container';
      container.innerHTML = `
        <div class="health-bar-name" style="color:${c.css}">${c.name}${botTag}</div>
        <div class="health-bar-bg">
          <div class="health-bar-fill" style="width:100%;background:${c.css}"></div>
        </div>
        <div class="weapon-label" style="font-size:0.3rem;margin-top:1px;color:#ccc"></div>
      `;
      this.healthBarsContainer.appendChild(container);
      this.healthBars.push({
        container,
        fill: container.querySelector('.health-bar-fill'),
        weaponLabel: container.querySelector('.weapon-label'),
      });
    }
  }

  updateHealthBar(index, player, camera, canvas) {
    const hb = this.healthBars[index];
    if (!hb) return;

    if (!player.alive) {
      hb.container.style.display = 'none';
      return;
    }

    hb.container.style.display = 'block';
    hb.fill.style.width = `${(player.health / MAX_HEALTH) * 100}%`;
    hb.fill.style.background = player.health < 30 ? '#ff3333' : PLAYER_CONFIGS[index].css;

    // Show weapon name if not pistol
    if (player.weapon !== 'pistol') {
      hb.weaponLabel.textContent = `${WEAPONS[player.weapon].name} (${player.ammo})`;
    } else {
      hb.weaponLabel.textContent = '';
    }

    const worldPos = player.pos.clone();
    worldPos.y += PLAYER_HEIGHT + 0.5;
    const screenPos = worldPos.project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * canvas.clientHeight;
    hb.container.style.left = `${x - 30}px`;
    hb.container.style.top = `${y - 20}px`;
  }

  updateScore(index, kills) {
    const el = document.getElementById(`score-${index}`);
    if (el) el.textContent = kills;
  }

  updateTimer(remaining) {
    const min = Math.floor(remaining / 60);
    const sec = Math.floor(remaining % 60);
    this.timer.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    this.timer.style.color = remaining < 30 ? '#ff4444' : '#fff';
  }

  addKillMessage(killerName, killerColor, victimName, victimColor) {
    const msg = document.createElement('div');
    msg.className = 'kill-msg';
    msg.innerHTML = `<span style="color:${killerColor}">${killerName}</span> &#9876; <span style="color:${victimColor}">${victimName}</span>`;
    this.killFeed.appendChild(msg);
    setTimeout(() => msg.remove(), 3500);
  }
}
