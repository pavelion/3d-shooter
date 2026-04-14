import * as THREE from 'three';
import {
  MAX_HEALTH, MOVE_SPEED, JUMP_VELOCITY, GRAVITY,
  PLAYER_HEIGHT, PLAYER_RADIUS, ARENA_HALF,
  INVULN_TIME, RESPAWN_TIME, WEAPONS, SPAWN_POINTS
} from './constants.js';
import { createCharacterMesh } from './createCharacterMesh.js';

export class Player {
  constructor(index, scene, config) {
    this.index = index;
    this.config = config;
    this.health = MAX_HEALTH;
    this.kills = 0;
    this.deaths = 0;
    this.alive = true;
    this.respawnTimer = 0;
    this.invulnTimer = 0;
    this.shootCooldown = 0;
    this.muzzleTimer = 0;
    this.isBot = false;
    this._platforms = [];

    // Weapon system
    this.weapon = 'pistol';
    this.ammo = Infinity;

    // Physics
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.facing = 0;
    this.grounded = false;

    this.char = createCharacterMesh(config);
    this.mesh = this.char.group;
    scene.add(this.mesh);

    this.walkPhase = 0;
    this.isMoving = false;

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 8),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.shadow = shadow;
    scene.add(shadow);

    this.spawn();
  }

  spawn() {
    const sp = SPAWN_POINTS[this.index % SPAWN_POINTS.length];
    this.pos.set(sp.x, 0, sp.z);
    this.vel.set(0, 0, 0);
    this.health = MAX_HEALTH;
    this.alive = true;
    this.respawnTimer = 0;
    this.invulnTimer = INVULN_TIME;
    this.mesh.visible = true;
    this.shadow.visible = true;
    this.facing = Math.atan2(-sp.x, -sp.z);
    this.weapon = 'pistol';
    this.ammo = Infinity;
  }

  getWeaponDef() { return WEAPONS[this.weapon]; }

  takeDamage(amount) {
    if (!this.alive || this.invulnTimer > 0) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.alive = false;
    this.deaths++;
    this.respawnTimer = RESPAWN_TIME;
    this.mesh.visible = false;
    this.shadow.visible = false;
  }

  update(dt, input, keys, platforms, touch) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.spawn();
      return;
    }

    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.muzzleTimer = Math.max(0, this.muzzleTimer - dt);
    this.char.muzzle.visible = this.muzzleTimer > 0;

    if (this.invulnTimer > 0) {
      this.mesh.visible = Math.floor(this.invulnTimer * 10) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }

    let moveX = 0, moveZ = 0;
    if (input.isDown(keys.left)) moveX -= 1;
    if (input.isDown(keys.right)) moveX += 1;
    if (input.isDown(keys.up)) moveZ -= 1;
    if (input.isDown(keys.down)) moveZ += 1;

    const gp = input.getGamepad(this.index);
    if (gp) {
      const dz = 0.25;
      if (Math.abs(gp.axes[0]) > dz) moveX += gp.axes[0];
      if (Math.abs(gp.axes[1]) > dz) moveZ += gp.axes[1];
    }

    // Touch controls (P1 only)
    if (touch && touch.active && this.index === 0) {
      moveX += touch.moveX;
      moveZ += touch.moveZ;
    }

    const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (mag > 0.01) {
      moveX /= mag; moveZ /= mag;
      this.facing = Math.atan2(moveX, moveZ);
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    this.vel.x = moveX * MOVE_SPEED;
    this.vel.z = moveZ * MOVE_SPEED;

    const touchJump = touch && touch.active && this.index === 0 && touch.jumpPressed;
    const jumpPressed = input.isDown(keys.jump) || (gp && gp.buttons[0] && gp.buttons[0].pressed) || touchJump;
    if (jumpPressed && this.grounded) {
      this.vel.y = JUMP_VELOCITY;
      this.grounded = false;
    }

    this.vel.y += GRAVITY * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;

    this.grounded = false;
    this.resolveCollisions(platforms);

    if (this.pos.y < 0) {
      this.pos.y = 0;
      this.vel.y = 0;
      this.grounded = true;
    }

    const bound = ARENA_HALF - PLAYER_RADIUS - 0.5;
    this.pos.x = Math.max(-bound, Math.min(bound, this.pos.x));
    this.pos.z = Math.max(-bound, Math.min(bound, this.pos.z));

    this.updateMesh(dt);
  }

  updateMesh(dt) {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.facing;

    if (this.isMoving) {
      this.walkPhase += dt * 10;
      const swing = Math.sin(this.walkPhase) * 0.6;
      this.char.rightArm.rotation.x = swing;
      this.char.leftArm.rotation.x = -swing;
      this.char.rightLeg.rotation.x = -swing;
      this.char.leftLeg.rotation.x = swing;
    } else {
      this.walkPhase = 0;
      this.char.rightArm.rotation.x *= 0.85;
      this.char.leftArm.rotation.x *= 0.85;
      this.char.rightLeg.rotation.x *= 0.85;
      this.char.leftLeg.rotation.x *= 0.85;
    }

    this.char.head.position.y = 2.3 + (this.isMoving ? Math.sin(this.walkPhase * 2) * 0.03 : 0);
    this.shadow.position.set(this.pos.x, 0.02, this.pos.z);
    this.shadow.scale.setScalar(Math.max(0.3, 1 - this.pos.y * 0.05));
    this.shadow.material.opacity = Math.max(0.1, 0.3 - this.pos.y * 0.02);
  }

  resolveCollisions(platforms) {
    const px = PLAYER_RADIUS;
    const py = PLAYER_HEIGHT;

    for (const plat of platforms) {
      const pMinX = this.pos.x - px, pMaxX = this.pos.x + px;
      const pMinY = this.pos.y, pMaxY = this.pos.y + py;
      const pMinZ = this.pos.z - px, pMaxZ = this.pos.z + px;

      if (pMaxX <= plat.minX || pMinX >= plat.maxX) continue;
      if (pMaxY <= plat.minY || pMinY >= plat.maxY) continue;
      if (pMaxZ <= plat.minZ || pMinZ >= plat.maxZ) continue;

      const oL = pMaxX - plat.minX, oR = plat.maxX - pMinX;
      const oB = pMaxY - plat.minY, oT = plat.maxY - pMinY;
      const oF = pMaxZ - plat.minZ, oBk = plat.maxZ - pMinZ;

      const mX = Math.min(oL, oR), mY = Math.min(oB, oT), mZ = Math.min(oF, oBk);

      if (mY <= mX && mY <= mZ) {
        if (oT < oB) {
          this.pos.y = plat.maxY;
          if (this.vel.y < 0) { this.vel.y = 0; this.grounded = true; }
        } else {
          this.pos.y = plat.minY - py;
          if (this.vel.y > 0) this.vel.y = 0;
        }
      } else if (mX <= mZ) {
        if (oL < oR) this.pos.x = plat.minX - px;
        else this.pos.x = plat.maxX + px;
        this.vel.x = 0;
      } else {
        if (oF < oBk) this.pos.z = plat.minZ - px;
        else this.pos.z = plat.maxZ + px;
        this.vel.z = 0;
      }
    }
  }

  canShoot(input, keys, touch) {
    if (!this.alive || this.shootCooldown > 0) return false;
    const gp = input.getGamepad(this.index);
    const gpShoot = gp && gp.buttons[2] && gp.buttons[2].pressed;
    const touchShoot = touch && touch.active && this.index === 0 && touch.shootPressed;
    return input.isDown(keys.shoot) || gpShoot || touchShoot;
  }

  shoot() {
    const wpn = this.getWeaponDef();
    this.shootCooldown = wpn.cooldown;
    this.muzzleTimer = 0.08;

    if (this.ammo !== Infinity) {
      this.ammo--;
      if (this.ammo <= 0) {
        this.weapon = 'pistol';
        this.ammo = Infinity;
      }
    }

    const dir = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
    const spawnPos = this.pos.clone();
    spawnPos.y += 1.3;
    spawnPos.add(dir.clone().multiplyScalar(0.8));

    const shots = [];
    for (let i = 0; i < wpn.count; i++) {
      const spreadAngle = wpn.count > 1
        ? (i / (wpn.count - 1) - 0.5) * wpn.spread * 2 + (Math.random() - 0.5) * 0.05
        : 0;
      const shotDir = dir.clone();
      if (spreadAngle !== 0) {
        const cos = Math.cos(spreadAngle), sin = Math.sin(spreadAngle);
        const nx = shotDir.x * cos - shotDir.z * sin;
        const nz = shotDir.x * sin + shotDir.z * cos;
        shotDir.x = nx;
        shotDir.z = nz;
      }
      // Slight vertical randomness for shotgun
      if (wpn.count > 1) {
        shotDir.y += (Math.random() - 0.5) * 0.1;
      }
      shots.push({ pos: spawnPos.clone(), dir: shotDir, owner: this.index, weaponType: this.weapon });
    }
    return shots;
  }
}
