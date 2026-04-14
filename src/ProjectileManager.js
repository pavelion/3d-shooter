import * as THREE from 'three';
import { WEAPONS, ARENA_HALF, WALL_HEIGHT, PLAYER_HEIGHT } from './constants.js';

export class ProjectileManager {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];
  }

  spawn(pos, dir, owner, weaponType) {
    const wpn = WEAPONS[weaponType] || WEAPONS.pistol;
    const geo = new THREE.BoxGeometry(wpn.size, wpn.size, wpn.size);
    const mat = new THREE.MeshBasicMaterial({ color: wpn.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    // Add trail for rockets
    let trail = null;
    if (wpn.homing) {
      trail = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15, 0.15),
        new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.6 })
      );
      trail.position.copy(pos);
      this.scene.add(trail);
    }

    this.projectiles.push({
      mesh, trail,
      vel: dir.clone().multiplyScalar(wpn.speed),
      owner, life: wpn.lifetime,
      damage: wpn.damage,
      homing: wpn.homing || false,
      homingStrength: wpn.homingStrength || 0,
      weaponType,
      isParticle: false,
    });
  }

  update(dt, players, platforms) {
    const toRemove = [];

    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) { toRemove.push(i); continue; }

      // Homing logic - steer toward nearest enemy
      if (p.homing && !p.isParticle) {
        let closest = null, closestDist = Infinity;
        for (const player of players) {
          if (player.index === p.owner || !player.alive) continue;
          const d = p.mesh.position.distanceTo(player.pos.clone().setY(player.pos.y + 1.3));
          if (d < closestDist) { closestDist = d; closest = player; }
        }
        if (closest && closestDist < 30) {
          const targetPos = closest.pos.clone();
          targetPos.y += 1.3;
          const toTarget = targetPos.sub(p.mesh.position).normalize();
          const currentDir = p.vel.clone().normalize();
          const steer = toTarget.sub(currentDir).multiplyScalar(p.homingStrength);
          p.vel.add(steer.multiplyScalar(dt * 60));
          // Maintain roughly constant speed
          const wpn = WEAPONS[p.weaponType] || WEAPONS.pistol;
          p.vel.normalize().multiplyScalar(wpn.speed);
        }
      }

      p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
      p.mesh.rotation.x += dt * 10;
      p.mesh.rotation.y += dt * 10;

      // Trail for rockets
      if (p.trail) {
        p.trail.position.copy(p.mesh.position).add(p.vel.clone().normalize().multiplyScalar(-0.5));
        p.trail.rotation.copy(p.mesh.rotation);
      }

      // Platform collision
      let hitWall = false;
      for (const plat of platforms) {
        const pp = p.mesh.position;
        if (pp.x >= plat.minX && pp.x <= plat.maxX &&
            pp.y >= plat.minY && pp.y <= plat.maxY &&
            pp.z >= plat.minZ && pp.z <= plat.maxZ) {
          hitWall = true; break;
        }
      }
      const pos = p.mesh.position;
      if (pos.y < 0 || pos.y > WALL_HEIGHT ||
          Math.abs(pos.x) > ARENA_HALF || Math.abs(pos.z) > ARENA_HALF) {
        hitWall = true;
      }
      if (hitWall) { toRemove.push(i); continue; }

      // Skip particles for player collision
      if (p.isParticle) continue;

      // Player collision
      for (const player of players) {
        if (player.index === p.owner || !player.alive) continue;
        const dx = p.mesh.position.x - player.pos.x;
        const dy = p.mesh.position.y - (player.pos.y + PLAYER_HEIGHT / 2);
        const dz = p.mesh.position.z - player.pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        // Rockets have bigger hit radius
        const hitRadius = p.homing ? 1.2 : 0.8;
        if (dist < hitRadius) {
          const killed = player.takeDamage(p.damage);
          if (killed) {
            const attacker = players.find(pl => pl.index === p.owner);
            if (attacker) attacker.kills++;
          }
          toRemove.push(i);
          this.spawnHitEffect(p.mesh.position.clone(), killed, p.homing);
          break;
        }
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i];
      const proj = this.projectiles[idx];
      this.scene.remove(proj.mesh);
      if (proj.trail) this.scene.remove(proj.trail);
      this.projectiles.splice(idx, 1);
    }
  }

  spawnHitEffect(pos, killed, isExplosion) {
    const count = isExplosion ? 15 : (killed ? 10 : 4);
    const color = killed ? 0xff0000 : (isExplosion ? 0xff6600 : 0xffaa00);
    for (let i = 0; i < count; i++) {
      const size = 0.08 + Math.random() * 0.12;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.copy(pos);
      this.scene.add(mesh);
      const spread = isExplosion ? 10 : 6;
      this.projectiles.push({
        mesh, trail: null,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * spread
        ),
        owner: -1, life: 0.4 + Math.random() * 0.3,
        damage: 0, homing: false, isParticle: true,
      });
    }
  }

  clear() {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
      if (p.trail) this.scene.remove(p.trail);
    }
    this.projectiles = [];
  }
}
