import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export function makeWideLine(points, { color, width = 2, opacity = 1, dashed = false, dashSize = 1, gapSize = 0.65 } = {}) {
  const geometry = new LineGeometry();
  geometry.setPositions(points.flatMap((point) => [point.x, point.y, point.z]));
  const material = new LineMaterial({
    color,
    linewidth: width,
    transparent: opacity < 1,
    opacity,
    dashed,
    dashSize,
    gapSize,
    dashScale: 1,
    depthTest: true,
  });
  const line = new Line2(geometry, material);
  if (dashed) line.computeLineDistances();
  line.frustumCulled = false;
  return line;
}

export function updateLineResolution(root, width, height) {
  root.traverse((object) => {
    if (object.material?.isLineMaterial) object.material.resolution.set(width, height);
  });
}

export function makeEntityNode(entity, projector, { color, z = 2, scale = 1, layer } = {}) {
  const root = new THREE.Group();
  const point = projector.fromEntity(entity, z);
  root.position.copy(point);
  root.userData = { kind: 'entity', entityId: entity.id, layer };

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16 * scale, 0.32 * scale, 1.35 * scale, 7),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.62, metalness: 0.18, roughness: 0.36 }),
  );
  stem.rotation.x = Math.PI / 2;
  stem.position.z = 0.45 * scale;
  stem.userData = root.userData;
  root.add(stem);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.33 * scale, 16, 12),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.98 }),
  );
  head.position.z = 1.08 * scale;
  head.userData = root.userData;
  root.add(head);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.43 * scale, 0.54 * scale, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.position.z = 0.13;
  ring.userData = root.userData;
  root.add(ring);

  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(0.61 * scale, 0.66 * scale, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }),
  );
  glowRing.position.z = 0.11;
  glowRing.userData = root.userData;
  root.add(glowRing);
  root.userData.ring = ring;
  root.userData.glowRing = glowRing;
  return root;
}

export function setGroupOpacity(root, opacity, { fade = false } = {}) {
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.baseOpacity === undefined) material.userData.baseOpacity = material.opacity ?? 1;
      if (material.userData.baseDepthWrite === undefined) material.userData.baseDepthWrite = material.depthWrite;
      material.opacity = material.userData.baseOpacity * opacity;
      material.transparent = material.opacity < 0.99;
      if (fade) material.depthWrite = false;
      else if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) material.depthWrite = material.opacity > 0.32;
      else material.depthWrite = material.userData.baseDepthWrite;
    });
  });
}
