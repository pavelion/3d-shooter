import * as THREE from 'three';

export function makePixelTexture(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

export function grassTexture() {
  return makePixelTexture(16, 16, (ctx, w, h) => {
    ctx.fillStyle = '#4a8c3f';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#3d7a33' : '#57a348';
      ctx.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h), 1, 1);
    }
    ctx.strokeStyle = '#3d7a33';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  });
}

export function stoneTexture() {
  return makePixelTexture(16, 16, (ctx, w, h) => {
    ctx.fillStyle = '#777';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, 8, w, 1);
    ctx.fillRect(0, 0, 1, 8);
    ctx.fillRect(8, 8, 1, 8);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#707070' : '#808080';
      ctx.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h), 1, 1);
    }
  });
}

export function woodTexture() {
  return makePixelTexture(16, 16, (ctx, w, h) => {
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = '#7a5c12';
      ctx.fillRect(0, y, w, 1);
    }
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#9a7924';
      ctx.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h), 1, 1);
    }
  });
}

export function faceTexture(skinHex) {
  return makePixelTexture(8, 8, (ctx) => {
    ctx.fillStyle = skinHex;
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(1, 2, 2, 2);
    ctx.fillRect(5, 2, 2, 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(2, 2, 1, 2);
    ctx.fillRect(6, 2, 1, 2);
    ctx.fillStyle = '#553333';
    ctx.fillRect(3, 6, 2, 1);
  });
}

export function pickupTexture() {
  return makePixelTexture(8, 8, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(3, 1, 2, 6);
    ctx.fillRect(1, 3, 6, 2);
  });
}

export function weaponCrateTexture(baseColor) {
  return makePixelTexture(8, 8, (ctx) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 3, 6, 2);
    ctx.fillRect(3, 1, 2, 6);
    ctx.fillStyle = '#333';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 7, 7);
  });
}
