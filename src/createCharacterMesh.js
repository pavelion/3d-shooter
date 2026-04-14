import * as THREE from 'three';
import { faceTexture } from './textures.js';

export function createCharacterMesh(config) {
  const group = new THREE.Group();
  const primaryMat = new THREE.MeshLambertMaterial({ color: config.primary });
  const secondaryMat = new THREE.MeshLambertMaterial({ color: config.secondary });
  const skinMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(config.skin) });

  const headGroup = new THREE.Group();
  const faceTex = faceTexture(config.skin);
  const headMats = [
    skinMat, skinMat, skinMat, skinMat,
    new THREE.MeshLambertMaterial({ map: faceTex }), skinMat,
  ];
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), headMats);
  head.castShadow = true;
  headGroup.add(head);
  headGroup.position.y = 2.3;
  group.add(headGroup);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.5), primaryMat);
  body.position.y = 1.4;
  body.castShadow = true;
  group.add(body);

  const armGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
  const rightArm = new THREE.Group();
  const raMesh = new THREE.Mesh(armGeo, primaryMat);
  raMesh.position.y = -0.35;
  raMesh.castShadow = true;
  rightArm.add(raMesh);
  rightArm.position.set(0.575, 1.8, 0);
  group.add(rightArm);

  const leftArm = new THREE.Group();
  const laMesh = new THREE.Mesh(armGeo, primaryMat);
  laMesh.position.y = -0.35;
  laMesh.castShadow = true;
  leftArm.add(laMesh);
  leftArm.position.set(-0.575, 1.8, 0);
  group.add(leftArm);

  // Gun
  const gun = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.6),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  gun.position.set(0, -0.6, 0.3);
  gun.castShadow = true;
  rightArm.add(gun);

  const legGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
  const rightLeg = new THREE.Group();
  const rlMesh = new THREE.Mesh(legGeo, secondaryMat);
  rlMesh.position.y = -0.35;
  rlMesh.castShadow = true;
  rightLeg.add(rlMesh);
  rightLeg.position.set(0.22, 0.9, 0);
  group.add(rightLeg);

  const leftLeg = new THREE.Group();
  const llMesh = new THREE.Mesh(legGeo, secondaryMat);
  llMesh.position.y = -0.35;
  llMesh.castShadow = true;
  leftLeg.add(llMesh);
  leftLeg.position.set(-0.22, 0.9, 0);
  group.add(leftLeg);

  const muzzle = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  muzzle.position.set(0.575, 1.2, 0.7);
  muzzle.visible = false;
  group.add(muzzle);

  return { group, head: headGroup, rightArm, leftArm, rightLeg, leftLeg, muzzle };
}
