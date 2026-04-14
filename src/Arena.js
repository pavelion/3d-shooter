import * as THREE from 'three';
import { ARENA_SIZE, ARENA_HALF, WALL_HEIGHT } from './constants.js';
import { grassTexture, stoneTexture, woodTexture } from './textures.js';
import { generatePlatforms } from './generatePlatforms.js';

export class Arena {
  constructor(scene) {
    this.platforms = [];
    this.buildFloor(scene);
    this.buildWalls(scene);
    this.buildPlatforms(scene);
    this.addLighting(scene);
    scene.background = new THREE.Color(0x87CEEB);
    // No fog - keep arena fully visible
  }

  buildFloor(scene) {
    const tex = grassTexture();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(ARENA_SIZE / 2, ARENA_SIZE / 2);
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(ARENA_SIZE, 0.5, ARENA_SIZE),
      new THREE.MeshLambertMaterial({ map: tex })
    );
    floor.position.set(0, -0.25, 0);
    floor.receiveShadow = true;
    scene.add(floor);
  }

  buildWalls(scene) {
    const tex = stoneTexture();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;

    const wallData = [
      { pos: [0, WALL_HEIGHT / 2, -ARENA_HALF], size: [ARENA_SIZE + 2, WALL_HEIGHT, 1] },
      { pos: [0, WALL_HEIGHT / 2, ARENA_HALF], size: [ARENA_SIZE + 2, WALL_HEIGHT, 1] },
      { pos: [-ARENA_HALF, WALL_HEIGHT / 2, 0], size: [1, WALL_HEIGHT, ARENA_SIZE + 2] },
      { pos: [ARENA_HALF, WALL_HEIGHT / 2, 0], size: [1, WALL_HEIGHT, ARENA_SIZE + 2] },
    ];

    for (const w of wallData) {
      const t = tex.clone();
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(ARENA_SIZE / 2, WALL_HEIGHT / 2);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...w.size), new THREE.MeshLambertMaterial({ map: t }));
      mesh.position.set(...w.pos);
      mesh.receiveShadow = true;
      scene.add(mesh);
      this.platforms.push({
        minX: w.pos[0] - w.size[0] / 2, maxX: w.pos[0] + w.size[0] / 2,
        minY: 0, maxY: w.pos[1] + w.size[1] / 2,
        minZ: w.pos[2] - w.size[2] / 2, maxZ: w.pos[2] + w.size[2] / 2,
      });
    }
  }

  buildPlatforms(scene) {
    const stoneTex = stoneTexture();
    const woodTex = woodTexture();

    const platformDefs = generatePlatforms();
    for (const p of platformDefs) {
      const isWood = p.color === 0x8B6914;
      const baseTex = isWood ? woodTex : stoneTex;
      const t = baseTex.clone();
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(p.w / 2, p.h / 2);

      const tTop = baseTex.clone();
      tTop.wrapS = THREE.RepeatWrapping;
      tTop.wrapT = THREE.RepeatWrapping;
      tTop.repeat.set(p.w / 2, p.d / 2);

      const color = new THREE.Color(p.color);
      const sideMat = new THREE.MeshLambertMaterial({ map: t, color });
      const topMat = new THREE.MeshLambertMaterial({ map: tTop, color: color.clone().multiplyScalar(1.15) });

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(p.w, p.h, p.d),
        [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]
      );
      mesh.position.set(p.x, p.h / 2, p.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      this.platforms.push({
        minX: p.x - p.w / 2, maxX: p.x + p.w / 2,
        minY: 0, maxY: p.h,
        minZ: p.z - p.d / 2, maxZ: p.z + p.d / 2,
      });
    }
  }

  addLighting(scene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffeedd, 0.8);
    dir.position.set(15, 25, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 80;
    dir.shadow.camera.left = -30;
    dir.shadow.camera.right = 30;
    dir.shadow.camera.top = 30;
    dir.shadow.camera.bottom = -30;
    scene.add(dir);
    scene.add(new THREE.HemisphereLight(0x88ccff, 0x445522, 0.3));
  }
}
