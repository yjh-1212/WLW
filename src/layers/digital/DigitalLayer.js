import * as THREE from 'three';
import { MAP_THEME, toNumberColor } from '../../theme/mapTheme.js';
import { makeEntityNode, makeWideLine, setGroupOpacity, updateLineResolution } from '../rendering.js';

const CONNECTIONS = [[0, 1], [1, 2], [1, 3], [1, 4], [3, 5], [5, 2], [2, 4]];

export class DigitalLayer extends THREE.Group {
  constructor({ mapFactory, projector, entities, registry }) {
    super();
    this.name = 'DigitalLayerRoot';
    this.filters = { connectors: true, apiRelations: true, epcis: true, ai: true };
    this.sheet = mapFactory.createSheet({ name: 'DigitalMapSheet', role: 'digital', color: MAP_THEME.digitalSurface, opacity: 0.74 });
    // Give the map a thicker physical slab while keeping its top surface at the original Z,
    // so routes/nodes remain correctly seated above the map.
    this.sheet.scale.z = 2.15;
    this.sheet.position.z = -1.24;
    this.add(this.sheet);

    this.relationRoot = new THREE.Group();
    this.relationRoot.name = 'DigitalRelationRoot';
    this.add(this.relationRoot);
    CONNECTIONS.forEach(([from, to], index) => {
      if (!entities[from] || !entities[to]) return;
      const start = projector.fromEntity(entities[from], 4.4);
      const end = projector.fromEntity(entities[to], 4.4);
      const middle = start.clone().lerp(end, 0.5).setZ(7 + index * 0.14);
      const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
      const line = makeWideLine(curve.getPoints(30), {
        color: toNumberColor(MAP_THEME.digital), width: 1.65, opacity: 0.78, dashed: true, dashSize: 0.55, gapSize: 0.48,
      });
      line.userData.phase = index * 0.24;
      this.relationRoot.add(line);
    });

    this.nodeRoot = new THREE.Group();
    this.nodeRoot.name = 'DigitalNodeRoot';
    this.add(this.nodeRoot);
    this.nodeObjects = new Map();
    entities.forEach((entity, index) => {
      const node = makeEntityNode(entity, projector, { color: toNumberColor(MAP_THEME.digital), z: 4.35, scale: 0.95, layer: 'digital' });
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.75, 0.83, 32),
        new THREE.MeshBasicMaterial({ color: toNumberColor(MAP_THEME.digital), transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }),
      );
      halo.position.z = 0.1;
      halo.userData.phase = index * 0.8;
      node.add(halo);
      node.userData.halo = halo;
      this.nodeRoot.add(node);
      this.nodeObjects.set(entity.id, node);
      registry.registerLayerObject(entity.id, 'digital', node);
    });
  }

  setFilter(id, enabled) {
    this.filters[id] = enabled;
    if (id === 'connectors') this.nodeRoot.visible = enabled;
    if (id === 'apiRelations') this.relationRoot.visible = enabled;
  }

  update(elapsed) {
    this.relationRoot.children.forEach((line) => {
      line.material.dashOffset = -((elapsed * 0.45 + line.userData.phase) % 2);
    });
    this.nodeObjects.forEach((node) => {
      const halo = node.userData.halo;
      const pulse = 1 + Math.sin(elapsed * 1.8 + halo.userData.phase) * 0.18;
      halo.scale.setScalar(pulse);
      halo.material.opacity = 0.22 + Math.sin(elapsed * 1.8 + halo.userData.phase) * 0.08;
    });
  }

  setVisualWeight(weight) {
    this.visible = weight > 0.005;
    setGroupOpacity(this, weight);
  }
  resize(width, height) { updateLineResolution(this, width, height); }
}
