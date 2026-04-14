import * as THREE from 'three';
import {
  ARENA_SIZE, MAX_HEALTH, PICKUP_HEAL,
  PICKUP_SPAWN_INTERVAL, MAX_PICKUPS,
  WEAPON_SPAWN_INTERVAL, MAX_WEAPON_PICKUPS, WEAPONS
} from './constants.js';
import { pickupTexture, weaponCrateTexture } from './textures.js';

export class PickupManager {
  constructor(scene) {
    this.scene = scene;
    this.pickups = [];
    this.platforms = [];
    this.spawnTimer = PICKUP_SPAWN_INTERVAL / 2;
    this.weaponSpawnTimer = WEAPON_SPAWN_INTERVAL / 2;
    this.healthTex = pickupTexture();
    this.geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  }

  findValidSpawn() {
    for (let attempt = 0; attempt < 20; attempt++) {
      const x = (Math.random() - 0.5) * (ARENA_SIZE - 8);
      const z = (Math.random() - 0.5) * (ARENA_SIZE - 8);
      let inside = false;
      let onTopY = 0;
      for (const plat of this.platforms) {
        if (x >= plat.minX - 0.5 && x <= plat.maxX + 0.5 &&
            z >= plat.minZ - 0.5 && z <= plat.maxZ + 0.5) {
          if (plat.maxY > 0.5) {
            inside = true;
            onTopY = plat.maxY;
          }
        }
      }
      if (!inside) return { x, z, y: 0.8 };
      // 50% chance: place on top of the platform
      if (Math.random() < 0.5) return { x, z, y: onTopY + 0.8 };
    }
    // Fallback: just place it somewhere open
    return { x: (Math.random() - 0.5) * 10, z: (Math.random() - 0.5) * 10, y: 0.8 };
  }

  update(dt, players) {
    // Health spawns
    this.spawnTimer -= dt;
    const healthCount = this.pickups.filter(p => p.type === 'health').length;
    if (this.spawnTimer <= 0 && healthCount < MAX_PICKUPS) {
      this.spawnHealth();
      this.spawnTimer = PICKUP_SPAWN_INTERVAL;
    }

    // Weapon spawns
    this.weaponSpawnTimer -= dt;
    const weaponCount = this.pickups.filter(p => p.type !== 'health').length;
    if (this.weaponSpawnTimer <= 0 && weaponCount < MAX_WEAPON_PICKUPS) {
      this.spawnWeapon();
      this.weaponSpawnTimer = WEAPON_SPAWN_INTERVAL;
    }

    const toRemove = [];
    for (let i = 0; i < this.pickups.length; i++) {
      const pk = this.pickups[i];
      pk.mesh.rotation.y += dt * 2;
      pk.mesh.position.y = pk.baseY + Math.sin(Date.now() * 0.003 + pk.phase) * 0.2;
      pk.glow.material.opacity = 0.15 + Math.sin(Date.now() * 0.005) * 0.1;
      pk.glow.position.copy(pk.mesh.position);

      for (const player of players) {
        if (!player.alive) continue;
        const dx = pk.mesh.position.x - player.pos.x;
        const dz = pk.mesh.position.z - player.pos.z;
        const dy = pk.mesh.position.y - (player.pos.y + 1);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.5) {
          if (pk.type === 'health') {
            if (player.health >= MAX_HEALTH) continue;
            player.health = Math.min(MAX_HEALTH, player.health + PICKUP_HEAL);
          } else {
            // Weapon pickup
            player.weapon = pk.type;
            player.ammo = WEAPONS[pk.type].ammo;
          }
          toRemove.push(i);
          break;
        }
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i];
      this.scene.remove(this.pickups[idx].mesh);
      this.scene.remove(this.pickups[idx].glow);
      this.pickups.splice(idx, 1);
    }
  }

  spawnHealth() {
    const mat = new THREE.MeshLambertMaterial({ map: this.healthTex });
    const mesh = new THREE.Mesh(this.geo, mat);
    const sp = this.findValidSpawn();
    mesh.position.set(sp.x, sp.y, sp.z);
    this.scene.add(mesh);

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.2 })
    );
    glow.position.copy(mesh.position);
    this.scene.add(glow);
    this.pickups.push({ mesh, glow, baseY: sp.y, phase: Math.random() * Math.PI * 2, type: 'health' });
  }

  spawnWeapon() {
    const weaponTypes = ['shotgun', 'rocket'];
    const type = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    const color = type === 'shotgun' ? '#ff8800' : '#ff2200';
    const tex = weaponCrateTexture(color);
    const mat = new THREE.MeshLambertMaterial({ map: tex });
    const mesh = new THREE.Mesh(this.geo, mat);
    const sp = this.findValidSpawn();
    mesh.position.set(sp.x, sp.y, sp.z);
    this.scene.add(mesh);

    const glowColor = type === 'shotgun' ? 0xff8800 : 0xff2200;
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.25 })
    );
    glow.position.copy(mesh.position);
    this.scene.add(glow);
    this.pickups.push({ mesh, glow, baseY: sp.y, phase: Math.random() * Math.PI * 2, type });
  }

  clear() {
    for (const pk of this.pickups) {
      this.scene.remove(pk.mesh);
      this.scene.remove(pk.glow);
    }
    this.pickups = [];
  }
}
