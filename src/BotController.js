import * as THREE from 'three';
import {
  MOVE_SPEED, JUMP_VELOCITY, GRAVITY,
  ARENA_HALF, PLAYER_RADIUS, BOT_DIFFICULTY
} from './constants.js';

export class BotController {
  constructor(player, difficulty = 'normal') {
    this.player = player;
    this.difficulty = difficulty;
    const diff = BOT_DIFFICULTY[difficulty] || BOT_DIFFICULTY.normal;
    this.diffSettings = diff;
    this.targetEnemy = null;
    this.moveDir = new THREE.Vector2();
    this.wantJump = false;
    this.wantShoot = false;
    this.retargetTimer = 0;
    this.strafeDir = 1;
    this.strafeTimer = 0;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.jumpTimer = 0;
    this.pickupTarget = null;
    // Apply difficulty settings
    this.reactionDelay = diff.reactionDelayMin + Math.random() * (diff.reactionDelayMax - diff.reactionDelayMin);
    this.aimInaccuracy = diff.aimInaccuracyMin + Math.random() * (diff.aimInaccuracyMax - diff.aimInaccuracyMin);
    this.shootProbability = diff.shootProbability;
    this.reactionTimer = this.reactionDelay;
  }

  update(dt, players, pickups) {
    if (!this.player.alive) return;

    this.retargetTimer -= dt;
    this.strafeTimer -= dt;
    this.wanderTimer -= dt;
    this.jumpTimer -= dt;
    this.wantJump = false;
    this.wantShoot = false;
    this.moveDir.set(0, 0);

    if (this.retargetTimer <= 0 || !this.targetEnemy || !this.targetEnemy.alive) {
      const diff = this.diffSettings;
      this.retargetTimer = diff.retargetMin + Math.random() * (diff.retargetMax - diff.retargetMin);
      this.targetEnemy = this.findClosestEnemy(players);
      this.reactionTimer = this.reactionDelay;
    }

    // Seek health if low
    const shouldHeal = this.player.health < 50;
    if (shouldHeal) {
      const healthPickup = this.findClosestPickup(pickups, 'health');
      if (healthPickup) this.pickupTarget = healthPickup;
    }

    // Also seek weapon pickups occasionally
    if (!shouldHeal && this.player.weapon === 'pistol' && Math.random() < 0.01) {
      const wpnPickup = this.findClosestPickup(pickups, 'weapon');
      if (wpnPickup) this.pickupTarget = wpnPickup;
    }

    if (this.strafeTimer <= 0) {
      this.strafeDir = Math.random() > 0.5 ? 1 : -1;
      this.strafeTimer = 1.0 + Math.random() * 2.0;
    }

    if (this.pickupTarget && shouldHeal) {
      const dx = this.pickupTarget.mesh.position.x - this.player.pos.x;
      const dz = this.pickupTarget.mesh.position.z - this.player.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.5) this.moveDir.set(dx / dist, dz / dist);
      if (this.jumpTimer <= 0 && this.player.grounded && Math.random() < this.diffSettings.jumpChance) {
        this.wantJump = true; this.jumpTimer = 0.8;
      }
    } else if (this.targetEnemy) {
      const dx = this.targetEnemy.pos.x - this.player.pos.x;
      const dz = this.targetEnemy.pos.z - this.player.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 18) {
        this.moveDir.set(dx / dist * 0.8, dz / dist * 0.8);
      } else if (dist < 6) {
        const bx = -dx / dist, bz = -dz / dist;
        const sx = -bz * this.strafeDir, sz = bx * this.strafeDir;
        this.moveDir.set(bx * 0.3 + sx * 0.7, bz * 0.3 + sz * 0.7);
      } else {
        const sx = -dz / dist * this.strafeDir, sz = dx / dist * this.strafeDir;
        this.moveDir.set(dx / dist * 0.2 + sx * 0.8, dz / dist * 0.2 + sz * 0.8);
      }

      const m = this.moveDir.length();
      if (m > 0.01) this.moveDir.divideScalar(m);

      // Face enemy with inaccuracy
      this.player.facing = Math.atan2(dx, dz) + (Math.random() - 0.5) * this.aimInaccuracy;

      // Reaction timer - don't shoot immediately after seeing enemy
      this.reactionTimer = Math.max(0, this.reactionTimer - dt);

      // Shoot only sometimes and with reaction delay
      if (dist < 22 && this.reactionTimer <= 0 && Math.random() < this.shootProbability * dt * 3) {
        this.wantShoot = true;
      }

      if (this.jumpTimer <= 0 && this.player.grounded) {
        if (Math.random() < this.diffSettings.jumpChance || (dist < 8 && Math.random() < this.diffSettings.combatJumpChance)) {
          this.wantJump = true; this.jumpTimer = 1.0;
        }
        if (this.targetEnemy.pos.y > this.player.pos.y + 1.5 && Math.random() < 0.05) {
          this.wantJump = true; this.jumpTimer = 0.6;
        }
      }
    } else {
      if (this.wanderTimer <= 0) {
        this.wanderAngle += (Math.random() - 0.5) * 2;
        this.wanderTimer = 1 + Math.random() * 2;
      }
      this.moveDir.set(Math.sin(this.wanderAngle), Math.cos(this.wanderAngle));
      if (this.jumpTimer <= 0 && this.player.grounded && Math.random() < 0.005) {
        this.wantJump = true; this.jumpTimer = 1;
      }
    }

    // Apply movement
    const moveX = this.moveDir.x, moveZ = this.moveDir.y;
    const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
    const botSpeed = MOVE_SPEED * this.diffSettings.speedMult;

    if (mag > 0.01) {
      this.player.vel.x = (moveX / mag) * botSpeed;
      this.player.vel.z = (moveZ / mag) * botSpeed;
      if (!this.targetEnemy || !this.wantShoot) {
        this.player.facing = Math.atan2(moveX, moveZ);
      }
      this.player.isMoving = true;
    } else {
      this.player.vel.x = 0;
      this.player.vel.z = 0;
      this.player.isMoving = false;
    }

    if (this.wantJump && this.player.grounded) {
      this.player.vel.y = JUMP_VELOCITY;
      this.player.grounded = false;
    }

    this.player.vel.y += GRAVITY * dt;
    this.player.pos.x += this.player.vel.x * dt;
    this.player.pos.y += this.player.vel.y * dt;
    this.player.pos.z += this.player.vel.z * dt;

    this.player.grounded = false;
    this.player.resolveCollisions(this.player._platforms);

    if (this.player.pos.y < 0) {
      this.player.pos.y = 0; this.player.vel.y = 0; this.player.grounded = true;
    }

    const bound = ARENA_HALF - PLAYER_RADIUS - 0.5;
    this.player.pos.x = Math.max(-bound, Math.min(bound, this.player.pos.x));
    this.player.pos.z = Math.max(-bound, Math.min(bound, this.player.pos.z));

    this.player.updateMesh(dt);
  }

  findClosestEnemy(players) {
    let closest = null, closestDist = Infinity;
    for (const p of players) {
      if (p.index === this.player.index || !p.alive) continue;
      const d = p.pos.distanceTo(this.player.pos);
      if (d < closestDist) { closestDist = d; closest = p; }
    }
    return closest;
  }

  findClosestPickup(pickups, kind) {
    let closest = null, closestDist = Infinity;
    for (const pk of pickups) {
      if (kind === 'health' && pk.type !== 'health') continue;
      if (kind === 'weapon' && pk.type === 'health') continue;
      const dx = pk.mesh.position.x - this.player.pos.x;
      const dz = pk.mesh.position.z - this.player.pos.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < closestDist) { closestDist = d; closest = pk; }
    }
    return closest;
  }
}
