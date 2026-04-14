# Block Arena - 3D Multiplayer Shooter

## Project Overview
Local multiplayer 3D arena shooter (1-4 players) with Minecraft/Roblox-style blocky characters. Bots fill remaining slots to always have 4 players. Deployable as static files to S3.

## Tech Stack
- **Three.js** (r160) via npm - 3D rendering
- **Vanilla JS** (ES modules) - no framework
- **Vite** - dev server and production bundler
- **No game server** - fully static, local multiplayer only

## Project Structure
```
index.html          - HTML structure, inline CSS, UI overlays
vite.config.js      - Vite config (build to dist/)
package.json        - Dependencies: three, vite
src/
  main.js           - Entry point: creates Game instance
  constants.js      - All constants, weapon defs, player configs, key bindings, bot difficulty presets
  textures.js       - Pixel-art texture generators (canvas-based)
  generatePlatforms.js - Random platform layout generator
  InputManager.js   - Keyboard + gamepad input handling
  Arena.js          - Floor, walls, platforms with AABB collision data
  createCharacterMesh.js - Blocky character mesh builder
  Player.js         - Physics, movement, collision, weapon system
  ProjectileManager.js - Bullets, shotgun pellets, homing rockets, hit particles
  PickupManager.js  - Health pickups and weapon crate spawning
  HUD.js            - Score panel, health bars (3D-projected), timer, kill feed
  CameraController.js - Dynamic camera that keeps all players in frame
  BotController.js  - AI with configurable difficulty presets
  TouchControls.js  - Virtual joystick + buttons for mobile (auto-shown on touch devices)
  Game.js           - Main game loop, state management, orchestrates all systems
```

## Key Design Decisions
- **Game loop**: Uses `MessageChannel` instead of `requestAnimationFrame` because RAF gets throttled in background/inactive tabs
- **Collision**: AABB overlap with minimum-overlap-axis resolution
- **Weapons**: Pistol (default, infinite ammo), Shotgun (7 pellets spread, 15 ammo), Rocket (homing, 6 ammo)
- **Bot AI**: Configurable difficulty (easy/normal/hard) via `BOT_DIFFICULTY` presets controlling speed, accuracy, reaction time, shoot probability
- **Always 4 players**: Human count is selectable (1-4), remaining slots filled with bots
- **Random platforms**: `generatePlatforms()` creates a new layout each game (center hill, corners, sides, cover, stepping stones, bonus platforms)
- **Particle projectiles** must have `isParticle: true` and be skipped in player collision checks
- **Character rotation**: `mesh.rotation.y = this.facing` (no `+ Math.PI`). Face texture is on +Z face (index 4)

## Scripts
- `npm run dev` - Start Vite dev server
- `npm run build` - Build to `dist/` for deployment
- `npm run preview` - Preview production build locally

## Deployment
Run `npm run build`, then upload `dist/` contents to any static hosting (S3, CloudFront, etc).

## Controls
- P1: WASD + Space + Q
- P2: Arrows + RShift + /
- P3: IJKL + U + O
- P4: Numpad 8456 + Num0 + Num.
- Gamepad support for all players
- **Mobile**: Virtual joystick (left) + JUMP/FIRE buttons (right), auto-shown on touch devices, controls P1 only, auto-selects 1 player mode
