import * as THREE from 'three';
import { MAP_THEME, toNumberColor } from '../../theme/mapTheme.js';
import { makeEntityNode, makeWideLine, setGroupOpacity, updateLineResolution } from '../rendering.js';

const FLOW_ROUTES = ['A2', 'A3', 'A4', 'C3', 'C5'];

export class OperationLayer extends THREE.Group {
  constructor({ mapFactory, projector, routes, entities, registry }) {
    super();
    this.name = 'OperationLayerRoot';
    this.projector = projector;
    this.flows = [];
    this.filters = { cargoFlow: true, capacity: true, tasks: true, alerts: true };
    this.sheet = mapFactory.createSheet({ name: 'OperationMapSheet', role: 'operation', color: MAP_THEME.operationSurface, opacity: 0.78 });
    // Give the map a thicker physical slab while keeping its top surface at the original Z,
    // so routes/nodes remain correctly seated above the map.
    this.sheet.scale.z = 2.15;
    this.sheet.position.z = -1.24;
    this.add(this.sheet);

    this.flowRoot = new THREE.Group();
    this.flowRoot.name = 'CargoFlowRoot';
    this.add(this.flowRoot);
    routes.filter((route) => FLOW_ROUTES.includes(route.id)).forEach((route, routeIndex) => this.addFlow(route, routeIndex));

    this.nodeRoot = new THREE.Group();
    this.nodeRoot.name = 'OperationEntityRoot';
    this.add(this.nodeRoot);
    this.nodeObjects = new Map();
    entities.forEach((entity) => {
      const node = makeEntityNode(entity, projector, { color: toNumberColor(MAP_THEME.operation), z: 2.35, scale: 1.00, layer: 'operation' });
      this.nodeRoot.add(node);
      this.nodeObjects.set(entity.id, node);
      registry.registerLayerObject(entity.id, 'operation', node);
    });

    const alertEntity = entities[0];
    if (alertEntity) {
      this.alert = new THREE.Mesh(
        new THREE.RingGeometry(0.75, 0.96, 32),
        new THREE.MeshBasicMaterial({ color: toNumberColor(MAP_THEME.danger), transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
      );
      this.alert.position.copy(projector.fromEntity(alertEntity, 2.2));
      this.alert.userData.baseScale = 1;
      this.add(this.alert);
    }
  }

  addFlow(route, routeIndex) {
    const basePoints = this.projector.routeSegments(route, 2.45)[0] ?? [];
    if (basePoints.length < 2) return;
    const curvePoints = basePoints.map((point, index) => {
      const t = index / Math.max(1, basePoints.length - 1);
      return point.clone().setZ(2.2 + Math.sin(Math.PI * t) * 3.4);
    });
    const curve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.35);
    const sampled = curve.getPoints(Math.max(32, curvePoints.length * 10));
    const line = makeWideLine(sampled, { color: toNumberColor(MAP_THEME.operation), width: 2.15, opacity: 0.72 });
    this.flowRoot.add(line);
    const particles = [];
    for (let index = 0; index < 3; index += 1) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 10, 8),
        new THREE.MeshBasicMaterial({ color: toNumberColor(index === 0 ? '#e9f8a8' : MAP_THEME.operation) }),
      );
      particle.userData.offset = (index / 3 + routeIndex * 0.11) % 1;
      this.flowRoot.add(particle);
      particles.push(particle);
    }
    this.flows.push({ curve, particles, speed: 0.035 + routeIndex * 0.006 });
  }

  setFilter(id, enabled) {
    this.filters[id] = enabled;
    if (id === 'cargoFlow') this.flowRoot.visible = enabled;
    if (id === 'capacity' || id === 'tasks') this.nodeRoot.visible = this.filters.capacity || this.filters.tasks;
    if (id === 'alerts' && this.alert) this.alert.visible = enabled;
  }

  update(elapsed) {
    this.flows.forEach((flow) => flow.particles.forEach((particle) => {
      const t = (elapsed * flow.speed + particle.userData.offset) % 1;
      particle.position.copy(flow.curve.getPointAt(t));
    }));
    if (this.alert?.visible) {
      const pulse = 1 + Math.sin(elapsed * 2.2) * 0.16;
      this.alert.scale.setScalar(pulse);
      this.alert.material.opacity = 0.48 + Math.sin(elapsed * 2.2) * 0.16;
    }
  }

  setVisualWeight(weight) {
    this.visible = weight > 0.005;
    setGroupOpacity(this, weight);
  }
  resize(width, height) { updateLineResolution(this, width, height); }
}
