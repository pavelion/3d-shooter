export function generatePlatforms() {
  const rand = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const platforms = [];

  // 1. Center king-of-the-hill (always present, slightly randomized)
  const centerBaseW = rand(10, 14);
  const centerBaseD = rand(10, 14);
  platforms.push({ x: 0, z: 0, w: centerBaseW, d: centerBaseD, h: rand(1.2, 2.0), color: 0x808080 });
  const topW = rand(4, 7);
  const topD = rand(4, 7);
  platforms.push({ x: 0, z: 0, w: topW, d: topD, h: rand(3.0, 4.5), color: 0x909090 });

  // 2. Corner platforms (one per corner, randomized size/height)
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [sx, sz] of corners) {
    const cx = sx * rand(11, 15);
    const cz = sz * rand(11, 15);
    const w = rand(5, 8);
    const d = rand(5, 8);
    const h = rand(1.5, 3.5);
    platforms.push({ x: cx, z: cz, w, d, h, color: 0x8B6914 });
  }

  // 3. Side elevated platforms (2-4 along edges)
  const sideCount = randInt(2, 4);
  const sides = [
    () => ({ x: rand(-3, 3), z: -rand(13, 16) }),
    () => ({ x: rand(-3, 3), z: rand(13, 16) }),
    () => ({ x: -rand(13, 16), z: rand(-3, 3) }),
    () => ({ x: rand(13, 16), z: rand(-3, 3) }),
  ];
  const shuffledSides = sides.sort(() => Math.random() - 0.5);
  for (let i = 0; i < sideCount; i++) {
    const pos = shuffledSides[i]();
    platforms.push({
      x: pos.x, z: pos.z,
      w: rand(3, 6), d: rand(3, 6), h: rand(3.5, 5.5),
      color: 0x666688
    });
  }

  // 4. Cover blocks (4-8 scattered)
  const coverCount = randInt(4, 8);
  for (let i = 0; i < coverCount; i++) {
    let cx, cz;
    for (let attempt = 0; attempt < 10; attempt++) {
      cx = rand(-16, 16);
      cz = rand(-16, 16);
      const dist = Math.sqrt(cx * cx + cz * cz);
      if (dist > 4 && dist < 16) break;
    }
    platforms.push({
      x: cx, z: cz,
      w: rand(1.5, 3), d: rand(1.5, 3), h: rand(1.0, 2.0),
      color: 0x777777
    });
  }

  // 5. Stepping stones toward center (3-6)
  const stepCount = randInt(3, 6);
  for (let i = 0; i < stepCount; i++) {
    const angle = (i / stepCount) * Math.PI * 2 + rand(-0.3, 0.3);
    const radius = rand(3, 7);
    platforms.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      w: rand(1.5, 2.5), d: rand(1.5, 2.5), h: rand(1.5, 2.8),
      color: 0x887766
    });
  }

  // 6. Random floating/elevated blocks (0-3 bonus platforms)
  const bonusCount = randInt(0, 3);
  for (let i = 0; i < bonusCount; i++) {
    platforms.push({
      x: rand(-14, 14), z: rand(-14, 14),
      w: rand(2, 4), d: rand(2, 4), h: rand(4, 6),
      color: 0x886688
    });
  }

  return platforms;
}
