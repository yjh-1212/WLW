import * as THREE from 'three';
import { MAP_THEME, toNumberColor } from '../../theme/mapTheme.js';
import { makeEntityNode, makeWideLine, setGroupOpacity, updateLineResolution } from '../rendering.js';

const routeStyle = {
  axis: { color: MAP_THEME.routeAxis, width: 3.3, opacity: 0.94 },
  corridor: { color: MAP_THEME.routeCorridor, width: 2.35, opacity: 0.86 },
  channel: { color: MAP_THEME.routeChannel, width: 1.85, opacity: 0.82, dashed: true },
};

export class InfrastructureLayer extends THREE.Group {
  constructor({ mapFactory, projector, routes, entities, registry }) {
    super();
    this.name = 'InfrastructureLayerRoot';
    this.projector = projector;
    this.routes = routes;
    this.routeObjects = new Map();
    this.nodeObjects = new Map();
    this.filters = { axes: true, corridors: true, channels: true, hubs: true, railway: true };

    this.sheet = mapFactory.createSheet({ name: 'InfrastructureMapSheet', role: 'infrastructure', color: MAP_THEME.infrastructureSurface, opacity: 0.82 });
    // Give the map a thicker physical slab while keeping its top surface at the original Z,
    // so routes/nodes remain correctly seated above the map.
    this.sheet.scale.z = 2.15;
    this.sheet.position.z = -1.24;
    this.add(this.sheet);
    this.routeRoot = new THREE.Group();
    this.routeRoot.name = 'StrategicBackboneRoot';
    this.add(this.routeRoot);
    routes.forEach((route) => this.addRoute(route));

    this.nodeRoot = new THREE.Group();
    this.nodeRoot.name = 'InfrastructureHubRoot';
    this.add(this.nodeRoot);
    entities.forEach((entity) => {
      const node = makeEntityNode(entity, projector, { color: toNumberColor(MAP_THEME.infrastructure), z: 1.55, scale: 1.06, layer: 'infrastructure' });
      this.nodeRoot.add(node);
      this.nodeObjects.set(entity.id, node);
      registry.registerLayerObject(entity.id, 'infrastructure', node);
    });
  }

  addRoute(route) {
    const style = routeStyle[route.type];
    if (!style) return;
    const routeGroup = new THREE.Group();
    routeGroup.name = route.id;
    routeGroup.userData = { kind: 'route', routeId: route.id };
    this.projector.routeSegments(route, 1.34).forEach((points) => {
      if (points.length < 2) return;
      const line = makeWideLine(points, {
        color: toNumberColor(style.color),
        width: style.width,
        opacity: style.opacity,
        dashed: style.dashed,
      });
      line.userData = routeGroup.userData;
      line.material.userData.baseOpacity = style.opacity;
      routeGroup.add(line);
    });
    this.routeObjects.set(route.id, routeGroup);
    this.routeRoot.add(routeGroup);
  }

  setFilter(id, enabled) {
    this.filters[id] = enabled;
    if (id === 'hubs') this.nodeRoot.visible = enabled;
    const type = id === 'axes' ? 'axis' : id === 'corridors' ? 'corridor' : id === 'channels' ? 'channel' : null;
    if (type) this.routes.filter((route) => route.type === type).forEach((route) => { if (this.routeObjects.has(route.id)) this.routeObjects.get(route.id).visible = enabled; });
  }

  highlightRoute(routeId) {
    this.routeObjects.forEach((routeGroup, id) => {
      const active = !routeId || id === routeId;
      const style = routeStyle[this.routes.find((route) => route.id === id).type];
      routeGroup.traverse((line) => {
        if (!line.material?.isLineMaterial) return;
        line.material.opacity = active ? line.material.userData.baseOpacity : 0.1;
        line.material.linewidth = active && routeId ? style.width * 1.35 : style.width;
      });
    });
  }

  setVisualWeight(weight) {
    this.visible = weight > 0.005;
    setGroupOpacity(this, weight);
  }

  resize(width, height) {
    updateLineResolution(this, width, height);
  }
}
