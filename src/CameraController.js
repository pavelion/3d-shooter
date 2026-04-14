import * as THREE from 'three';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPos = new THREE.Vector3();
    this.targetDist = 35;
    this.angle = Math.PI * 0.3;
    this.rotation = Math.PI * 0.25;
  }

  update(players, dt) {
    let count = 0;
    const center = new THREE.Vector3();
    let maxDist = 0;

    for (const p of players) {
      if (!p.alive) continue;
      center.add(p.pos);
      count++;
    }
    if (count > 0) {
      center.divideScalar(count);
      for (const p of players) {
        if (!p.alive) continue;
        const d = p.pos.distanceTo(center);
        if (d > maxDist) maxDist = d;
      }
    }

    this.targetPos.lerp(center, dt * 3);
    const desiredDist = Math.max(25, maxDist * 2.5 + 15);
    this.targetDist += (desiredDist - this.targetDist) * dt * 2;

    const cx = this.targetPos.x + Math.sin(this.rotation) * Math.cos(this.angle) * this.targetDist;
    const cy = this.targetPos.y + Math.sin(this.angle) * this.targetDist;
    const cz = this.targetPos.z + Math.cos(this.rotation) * Math.cos(this.angle) * this.targetDist;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.targetPos);
  }
}
