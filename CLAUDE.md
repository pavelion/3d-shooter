# CLAUDE.md — 3D Shooter Game

This file provides guidance for AI assistants working on this codebase. It covers project structure, conventions, development workflows, and key rules to follow.

---

## Project Overview

A browser-based 3D first-person shooter built with **Three.js** and **TypeScript**, bundled with **Vite**. The game runs entirely in the browser with no server-side game logic.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Language | TypeScript |
| 3D Rendering | Three.js |
| Build Tool | Vite |
| Physics | Rapier (WASM) or Cannon.js |
| Audio | Howler.js or Web Audio API |
| Input | Pointer Lock API + custom input manager |
| Linting | ESLint + Prettier |
| Testing | Vitest |

---

## Repository Structure

```
3d-shooter/
├── src/
│   ├── main.ts              # Entry point — bootstraps the game
│   ├── Game.ts              # Top-level game loop and lifecycle
│   ├── core/
│   │   ├── Renderer.ts      # Three.js renderer setup
│   │   ├── Scene.ts         # Scene management
│   │   ├── Camera.ts        # Camera controller (FPS perspective)
│   │   └── InputManager.ts  # Keyboard/mouse/gamepad input
│   ├── entities/
│   │   ├── Player.ts        # Player entity (movement, health, shooting)
│   │   ├── Enemy.ts         # Enemy base class
│   │   ├── Projectile.ts    # Bullet/projectile logic
│   │   └── Weapon.ts        # Weapon definitions and firing logic
│   ├── systems/
│   │   ├── PhysicsSystem.ts # Physics world integration
│   │   ├── CollisionSystem.ts
│   │   ├── AudioSystem.ts
│   │   └── UISystem.ts      # HUD, menus, overlays
│   ├── levels/
│   │   ├── LevelLoader.ts   # Loads map data and spawns entities
│   │   └── Level1.ts        # Level definitions
│   ├── assets/
│   │   ├── models/          # GLTF/GLB 3D models
│   │   ├── textures/        # PNG/KTX2 textures
│   │   ├── sounds/          # OGG/MP3 audio files
│   │   └── maps/            # JSON map/level data
│   └── utils/
│       ├── math.ts          # Vector/quaternion helpers
│       ├── pool.ts          # Object pooling utilities
│       └── debug.ts         # Debug overlays and stats
├── public/                  # Static assets served as-is
├── tests/                   # Unit and integration tests (Vitest)
├── index.html               # HTML entry point
├── vite.config.ts
├── tsconfig.json
├── .eslintrc.json
├── package.json
└── CLAUDE.md
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint and type-check
npm run lint
npm run typecheck
```

---

## Game Architecture

### Game Loop

The main loop lives in `Game.ts` and uses `requestAnimationFrame`. It drives all systems in order each frame:

```
Input → Physics → Game Logic → Rendering → Audio → UI
```

- **Fixed timestep** is used for physics (e.g., 60 Hz) to ensure determinism.
- **Variable timestep** (`delta`) is passed to rendering and non-physics systems.

### Entity-Component Pattern

Entities (Player, Enemy, Projectile) are plain TypeScript classes with `update(delta: number)` methods. Systems operate on collections of entities rather than embedding logic inside them.

### Scene Graph

All renderable entities must add their `THREE.Object3D` to the scene via `Scene.add()` and remove it when destroyed. Entities are responsible for their own mesh lifecycle.

---

## Key Conventions

### TypeScript

- Strict mode is enabled (`"strict": true` in `tsconfig.json`).
- No `any` types — use `unknown` and narrow appropriately.
- Prefer `interface` over `type` for object shapes; use `type` for unions/aliases.
- Export only what is needed — avoid barrel re-exports that create circular dependencies.

### Naming

| Thing | Convention | Example |
|---|---|---|
| Classes | PascalCase | `PlayerController` |
| Files | PascalCase (matches class) | `PlayerController.ts` |
| Functions/variables | camelCase | `fireWeapon()` |
| Constants | SCREAMING_SNAKE | `MAX_HEALTH` |
| Private class fields | `#` prefix | `#velocity` |
| Event names | `kebab-case` strings | `"player-died"` |

### Three.js Conventions

- Reuse `THREE.Vector3` and `THREE.Quaternion` instances where possible — avoid allocating new ones every frame.
- Dispose geometries, materials, and textures explicitly when removing objects from the scene.
- Use `BufferGeometry` exclusively; avoid legacy `Geometry`.
- Group related meshes under a parent `THREE.Group`.

### Performance Rules

- **Object pooling**: Bullets/projectiles must use a pool — never `new Projectile()` in the game loop.
- **Avoid GC pressure**: No new object allocations in hot paths (`update()` methods).
- **Frustum culling**: Enabled by default via Three.js — don't disable it without a reason.
- **LOD**: Use `THREE.LOD` for complex meshes visible at varying distances.

### Physics

- Physics bodies must be created through `PhysicsSystem` — never instantiate the physics engine directly in entities.
- Sync render transform from physics transform at the end of each physics step.
- Colliders and rigid bodies must be cleaned up on entity destroy.

### Audio

- All audio goes through `AudioSystem` — no raw `new Audio()` or direct Web Audio API calls in entity code.
- Sound effects are triggered via `AudioSystem.play(soundId, options)`.

---

## State Management

Game state (health, ammo, score, level) is managed through a central `GameState` object passed by reference to systems. Do not use global variables outside of this object.

```ts
interface GameState {
  player: PlayerState;
  level: LevelState;
  ui: UIState;
}
```

---

## Input Handling

- Pointer Lock is required for FPS mouse look — request it on first user interaction.
- `InputManager` exposes `isKeyDown(key: string)`, `getMouseDelta()`, and `isMouseButtonDown(button: number)`.
- Input state is sampled once per frame at the top of the game loop, not inside individual entity updates.

---

## Asset Pipeline

- 3D models must be in **GLTF 2.0 (.glb)** format.
- Textures should be **KTX2** with Basis Universal compression for production; PNG is acceptable during development.
- Audio files must be provided in **OGG** (primary) with **MP3** fallback for Safari.
- All assets are loaded via an `AssetLoader` that returns typed promises and supports progress callbacks.

---

## Testing

- Unit test pure utilities (`src/utils/`) with Vitest.
- System tests mock Three.js and the physics engine — do not start a real WebGL context in tests.
- Aim for coverage on math utilities, state transitions, and collision detection logic.
- Tests live in `tests/` mirroring the `src/` structure.

---

## Error Handling

- Asset loading failures must show a user-visible error overlay, not just a console error.
- Physics or rendering errors that crash the loop must be caught and display a recovery screen.
- Never silence errors with empty `catch` blocks.

---

## Git Workflow

- Branch naming: `feature/<short-description>`, `fix/<short-description>`, `claude/<task-id>`.
- Commit messages: imperative mood, present tense — `Add enemy patrol AI`, not `Added enemy AI`.
- One logical change per commit.
- Do not commit generated files (`dist/`, `node_modules/`).
- Run `npm run lint && npm run typecheck` before committing.

---

## Common Pitfalls

1. **Memory leaks**: Always dispose Three.js geometries/materials and remove event listeners when entities are destroyed.
2. **Frame-rate dependent logic**: Always use `delta` time — never hardcode frame counts.
3. **Input during pause**: Gate input processing behind a `isPaused` check.
4. **Physics/render desync**: Physics runs on a fixed step; interpolate transforms for smooth rendering.
5. **Asset loading race conditions**: Await the `AssetLoader` before starting the game loop.

---

## AI Assistant Guidelines

- Read existing patterns in the codebase before adding new systems — follow established conventions.
- When adding entities, follow the existing `update(delta: number) / destroy()` lifecycle.
- When touching the physics system, verify cleanup paths — leaking bodies degrades performance over time.
- Prefer editing existing files over creating new ones unless a genuinely new system is needed.
- After making changes, note any files that need corresponding test updates.
- Do not add `console.log` statements to committed code — use the `debug.ts` utility behind a debug flag.
