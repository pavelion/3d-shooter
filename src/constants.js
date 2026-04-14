// ==================== CONSTANTS ====================
export const ARENA_SIZE = 40;
export const ARENA_HALF = ARENA_SIZE / 2;
export const WALL_HEIGHT = 12;
export const GRAVITY = -32;
export const JUMP_VELOCITY = 13;
export const MOVE_SPEED = 11;
export const PLAYER_HEIGHT = 2.7;
export const PLAYER_RADIUS = 0.4;
export const MAX_HEALTH = 100;
export const PICKUP_HEAL = 30;
export const PICKUP_SPAWN_INTERVAL = 7;
export const MAX_PICKUPS = 5;
export const WEAPON_SPAWN_INTERVAL = 10;
export const MAX_WEAPON_PICKUPS = 3;
export const RESPAWN_TIME = 3;
export const INVULN_TIME = 2;
export const MATCH_DURATION = 180;
export const KILLS_TO_WIN = 15;

// ==================== WEAPONS ====================
export const WEAPONS = {
  pistol: {
    name: 'Pistol', damage: 20, cooldown: 0.35, speed: 45, lifetime: 2,
    count: 1, spread: 0, ammo: Infinity, size: 0.2, color: 0xffff00, homing: false
  },
  shotgun: {
    name: 'Shotgun', damage: 9, cooldown: 0.7, speed: 35, lifetime: 1.0,
    count: 7, spread: 0.28, ammo: 15, size: 0.15, color: 0xff8800, homing: false
  },
  rocket: {
    name: 'Rocket', damage: 45, cooldown: 1.4, speed: 18, lifetime: 4.0,
    count: 1, spread: 0, ammo: 6, size: 0.4, color: 0xff2200, homing: true, homingStrength: 3.0
  },
};

export const PLAYER_CONFIGS = [
  { primary: 0x3366ff, secondary: 0x1a3380, skin: '#ffcc99', name: 'Blue', css: '#6699ff' },
  { primary: 0xff3333, secondary: 0x801a1a, skin: '#ffcc99', name: 'Red', css: '#ff6666' },
  { primary: 0x33cc33, secondary: 0x1a661a, skin: '#ffcc99', name: 'Green', css: '#66cc66' },
  { primary: 0xffcc00, secondary: 0x806600, skin: '#ffcc99', name: 'Yellow', css: '#ffcc44' },
];

export const KEY_BINDINGS = [
  { up: 'KeyW', left: 'KeyA', down: 'KeyS', right: 'KeyD', jump: 'Space', shoot: 'KeyQ' },
  { up: 'ArrowUp', left: 'ArrowLeft', down: 'ArrowDown', right: 'ArrowRight', jump: 'ShiftRight', shoot: 'Slash' },
  { up: 'KeyI', left: 'KeyJ', down: 'KeyK', right: 'KeyL', jump: 'KeyU', shoot: 'KeyO' },
  { up: 'Numpad8', left: 'Numpad4', down: 'Numpad5', right: 'Numpad6', jump: 'Numpad0', shoot: 'NumpadDecimal' },
];

// ==================== BOT DIFFICULTY PRESETS ====================
export const BOT_DIFFICULTY = {
  easy: {
    speedMult: 0.7,
    reactionDelayMin: 0.8,
    reactionDelayMax: 1.5,
    aimInaccuracyMin: 0.25,
    aimInaccuracyMax: 0.4,
    shootProbability: 0.2,
    retargetMin: 2.5,
    retargetMax: 4.0,
    jumpChance: 0.008,
    combatJumpChance: 0.012,
  },
  normal: {
    speedMult: 0.85,
    reactionDelayMin: 0.4,
    reactionDelayMax: 1.0,
    aimInaccuracyMin: 0.15,
    aimInaccuracyMax: 0.25,
    shootProbability: 0.4,
    retargetMin: 1.5,
    retargetMax: 2.5,
    jumpChance: 0.015,
    combatJumpChance: 0.025,
  },
  hard: {
    speedMult: 0.98,
    reactionDelayMin: 0.1,
    reactionDelayMax: 0.3,
    aimInaccuracyMin: 0.03,
    aimInaccuracyMax: 0.08,
    shootProbability: 0.75,
    retargetMin: 0.5,
    retargetMax: 1.2,
    jumpChance: 0.025,
    combatJumpChance: 0.045,
  },
};

export const SPAWN_POINTS = [
  { x: -16, z: -16 }, { x: 16, z: -16 },
  { x: -16, z: 16 }, { x: 16, z: 16 },
];
