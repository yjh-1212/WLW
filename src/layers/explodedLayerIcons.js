import * as THREE from 'three';

const mat = (color, { emissiveIntensity = 0.55, metalness = 0.22, roughness = 0.42, opacity = 1 } = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity,
    metalness,
    roughness,
    transparent: opacity < 0.99,
    opacity,
  });

const accentMat = (color) => new THREE.MeshBasicMaterial({
  color,
  transparent: true,
  opacity: 0.92,
});

function addPedestal(root, color, scale = 1) {
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72 * scale, 0.86 * scale, 0.12 * scale, 24),
    mat(color, { emissiveIntensity: 0.28, metalness: 0.12, roughness: 0.62, opacity: 0.92 }),
  );
  disc.rotation.x = Math.PI / 2;
  disc.position.z = 0.06 * scale;
  root.add(disc);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.92 * scale, 1.08 * scale, 36),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  ring.position.z = 0.08 * scale;
  root.add(ring);
  return disc;
}

function makeWarehouse(color, scale) {
  const g = new THREE.Group();
  addPedestal(g, color, scale);
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.15 * scale, 0.78 * scale, 0.72 * scale),
    mat(color),
  );
  body.position.z = 0.52 * scale;
  g.add(body);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.82 * scale, 0.42 * scale, 4),
    mat(color, { emissiveIntensity: 0.72, roughness: 0.34 }),
  );
  roof.rotation.y = Math.PI / 4;
  roof.rotation.x = Math.PI / 2;
  roof.position.z = 1.08 * scale;
  g.add(roof);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.34 * scale, 0.08 * scale, 0.42 * scale),
    accentMat(0xffffff),
  );
  door.position.set(0, 0.42 * scale, 0.42 * scale);
  g.add(door);
  return g;
}

function makePort(color, scale) {
  const g = new THREE.Group();
  addPedestal(g, color, scale);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.2 * scale, 0.55 * scale, 0.22 * scale),
    mat(color, { emissiveIntensity: 0.4 }),
  );
  base.position.z = 0.24 * scale;
  g.add(base);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07 * scale, 0.09 * scale, 1.15 * scale, 8),
    mat(color),
  );
  mast.rotation.x = Math.PI / 2;
  mast.position.set(-0.28 * scale, 0, 0.78 * scale);
  g.add(mast);
  const boom = new THREE.Mesh(
    new THREE.BoxGeometry(0.92 * scale, 0.1 * scale, 0.1 * scale),
    mat(color, { emissiveIntensity: 0.7 }),
  );
  boom.position.set(0.12 * scale, 0, 1.22 * scale);
  g.add(boom);
  const hook = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * scale, 10, 8),
    accentMat(color),
  );
  hook.position.set(0.48 * scale, 0, 0.86 * scale);
  g.add(hook);
  return g;
}

function makeHub(color, scale) {
  const g = new THREE.Group();
  addPedestal(g, color, scale);
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28 * scale, 0.42 * scale, 0.95 * scale, 6),
    mat(color),
  );
  tower.rotation.x = Math.PI / 2;
  tower.position.z = 0.68 * scale;
  g.add(tower);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.22 * scale, 12, 10),
    accentMat(color),
  );
  cap.position.z = 1.22 * scale;
  g.add(cap);
  for (let i = 0; i < 3; i += 1) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.72 * scale, 0.08 * scale, 0.08 * scale),
      mat(color, { emissiveIntensity: 0.65 }),
    );
    arm.position.z = 0.55 * scale;
    arm.rotation.z = (i * Math.PI) / 3;
    g.add(arm);
  }
  return g;
}

function makeStation(color, scale) {
  const g = new THREE.Group();
  addPedestal(g, color, scale);
  const hall = new THREE.Mesh(
    new THREE.BoxGeometry(1.28 * scale, 0.5 * scale, 0.55 * scale),
    mat(color),
  );
  hall.position.z = 0.42 * scale;
  g.add(hall);
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(1.42 * scale, 0.62 * scale, 0.08 * scale),
    mat(color, { emissiveIntensity: 0.7 }),
  );
  canopy.position.z = 0.78 * scale;
  g.add(canopy);
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(1.1 * scale, 0.12 * scale, 0.06 * scale),
    accentMat(0xffffff),
  );
  rail.position.set(0, 0.34 * scale, 0.18 * scale);
  g.add(rail);
  return g;
}

function makeTruck(color, scale) {
  const g = new THREE.Group();
  addPedestal(g, color, scale * 0.95);
  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(0.95 * scale, 0.55 * scale, 0.48 * scale),
    mat(color),
  );
  cargo.position.set(-0.08 * scale, 0, 0.48 * scale);
  g.add(cargo);
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(0.42 * scale, 0.5 * scale, 0.4 * scale),
    mat(color, { emissiveIntensity: 0.7 }),
  );
  cab.position.set(0.52 * scale, 0, 0.44 * scale);
  g.add(cab);
  [-0.28, 0.38].forEach((x) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.58 * scale, 12),
      accentMat(0x1a2430),
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x * scale, 0, 0.18 * scale);
    g.add(wheel);
  });
  return g;
}

function makeContainer(color, scale) {
  const g = new THREE.Group();
  addPedestal(g, color, scale * 0.9);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.05 * scale, 0.55 * scale, 0.5 * scale),
    mat(color),
  );
  box.position.z = 0.42 * scale;
  g.add(box);
  for (let i = -1; i <= 1; i += 1) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 * scale, 0.58 * scale, 0.52 * scale),
      mat(color, { emissiveIntensity: 0.75 }),
    );
    rib.position.set(i * 0.28 * scale, 0, 0.42 * scale);
    g.add(rib);
  }
  return g;
}

function makeCloud(color, scale) {
  const g = new THREE.Group();
  addPedestal(g, color, scale * 0.9);
  const spheres = [
    [0, 0, 0.55, 0.38],
    [-0.32, 0.05, 0.48, 0.28],
    [0.34, -0.02, 0.5, 0.3],
    [0.08, 0.18, 0.72, 0.24],
  ];
  spheres.forEach(([x, y, z, r]) => {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(r * scale, 14, 12),
      mat(color, { emissiveIntensity: 0.68, metalness: 0.08, roughness: 0.35 }),
    );
    cloud.position.set(x * scale, y * scale, z * scale);
    g.add(cloud);
  });
  return g;
}

function makeDatabase(color, scale) {
  const g = new THREE.Group();
  addPedestal(g, color, scale * 0.9);
  [0.28, 0.55, 0.82].forEach((z, index) => {
    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42 * scale, 0.42 * scale, 0.2 * scale, 20),
      mat(color, { emissiveIntensity: 0.45 + index * 0.12 }),
    );
    disk.rotation.x = Math.PI / 2;
    disk.position.z = z * scale;
    g.add(disk);
  });
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36 * scale, 0.36 * scale, 0.7 * scale, 18),
    mat(color, { emissiveIntensity: 0.35, opacity: 0.88 }),
  );
  core.rotation.x = Math.PI / 2;
  core.position.z = 0.55 * scale;
  g.add(core);
  return g;
}

function makeChip(color, scale) {
  const g = new THREE.Group();
  addPedestal(g, color, scale * 0.88);
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.95 * scale, 0.95 * scale, 0.12 * scale),
    mat(color, { emissiveIntensity: 0.4 }),
  );
  board.position.z = 0.28 * scale;
  g.add(board);
  const die = new THREE.Mesh(
    new THREE.BoxGeometry(0.42 * scale, 0.42 * scale, 0.18 * scale),
    accentMat(color),
  );
  die.position.z = 0.42 * scale;
  g.add(die);
  for (let i = 0; i < 4; i += 1) {
    const pin = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * scale, 0.7 * scale, 0.05 * scale),
      mat(color, { emissiveIntensity: 0.8 }),
    );
    pin.position.z = 0.24 * scale;
    pin.rotation.z = (i * Math.PI) / 2;
    g.add(pin);
  }
  return g;
}

const BUILDERS = {
  warehouse: makeWarehouse,
  port: makePort,
  hub: makeHub,
  station: makeStation,
  truck: makeTruck,
  container: makeContainer,
  cloud: makeCloud,
  database: makeDatabase,
  chip: makeChip,
};

export function createExplodedLayerIcon(kind, color, { scale = 1 } = {}) {
  const builder = BUILDERS[kind] ?? makeHub;
  const root = builder(color, scale);
  root.name = `ExplodedIcon:${kind}`;
  root.userData = {
    kind: 'exploded-layer-icon',
    iconKind: kind,
    baseZ: 0,
    phase: Math.random() * Math.PI * 2,
  };
  root.frustumCulled = false;
  root.renderOrder = 12;
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.renderOrder = 12;
    object.frustumCulled = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material) return;
      material.depthTest = false;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
  });
  return root;
}

/** Sparse national landmarks for the exploded three-layer presentation. */
export const EXPLODED_ICON_PLACEMENTS = {
  infrastructure: [
    { name: '北京', lngLat: [116.40, 39.90], kind: 'hub', scale: 1.15 },
    { name: '上海', lngLat: [121.47, 31.23], kind: 'port', scale: 1.12 },
    { name: '广州', lngLat: [113.26, 23.13], kind: 'warehouse', scale: 1.05 },
    { name: '成都', lngLat: [104.06, 30.67], kind: 'hub', scale: 1.0 },
    { name: '西安', lngLat: [108.94, 34.34], kind: 'station', scale: 1.0 },
    { name: '大连', lngLat: [121.62, 38.92], kind: 'port', scale: 0.95 },
    { name: '武汉', lngLat: [114.31, 30.59], kind: 'warehouse', scale: 1.0 },
    { name: '乌鲁木齐', lngLat: [87.62, 43.82], kind: 'station', scale: 0.92 },
  ],
  operation: [
    { name: '天津', lngLat: [117.20, 39.13], kind: 'truck', scale: 1.05 },
    { name: '苏州', lngLat: [120.62, 31.32], kind: 'container', scale: 1.0 },
    { name: '杭州', lngLat: [120.15, 30.28], kind: 'truck', scale: 1.0 },
    { name: '重庆', lngLat: [106.55, 29.56], kind: 'container', scale: 1.05 },
    { name: '深圳', lngLat: [114.07, 22.62], kind: 'truck', scale: 1.08 },
    { name: '青岛', lngLat: [120.38, 36.07], kind: 'container', scale: 0.98 },
    { name: '长沙', lngLat: [112.98, 28.21], kind: 'truck', scale: 0.95 },
    { name: '兰州', lngLat: [103.82, 36.07], kind: 'container', scale: 0.92 },
  ],
  digital: [
    { name: '北京', lngLat: [116.40, 39.90], kind: 'cloud', scale: 1.12 },
    { name: '上海', lngLat: [121.47, 31.23], kind: 'database', scale: 1.08 },
    { name: '深圳', lngLat: [114.07, 22.62], kind: 'chip', scale: 1.05 },
    { name: '杭州', lngLat: [120.15, 30.28], kind: 'cloud', scale: 1.0 },
    { name: '贵阳', lngLat: [106.63, 26.65], kind: 'database', scale: 1.05 },
    { name: '武汉', lngLat: [114.31, 30.59], kind: 'chip', scale: 0.98 },
    { name: '南京', lngLat: [118.78, 32.07], kind: 'cloud', scale: 0.95 },
    { name: '厦门', lngLat: [118.09, 24.48], kind: 'database', scale: 0.92 },
  ],
};
