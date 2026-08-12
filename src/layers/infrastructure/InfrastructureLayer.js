import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { MAP_THEME, toNumberColor } from '../../theme/mapTheme.js';
import { makeEntityNode, makeWideLine, setGroupOpacity, updateLineResolution } from '../rendering.js';

const routeStyle = {
  axis: { color: MAP_THEME.routeAxis, width: 3.3, opacity: 0.94 },
  corridor: { color: MAP_THEME.routeCorridor, width: 2.35, opacity: 0.86 },
  channel: { color: MAP_THEME.routeChannel, width: 1.85, opacity: 0.82, dashed: true },
};

const facilityIconSize = {
  nationalHubs: 17,
  coldChainBases: 15.5,
  logisticsParks: 15.5,
};

function createFacilityIconTexture(layer) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  const color = layer.color ?? '#ffffff';
  const center = 48;

  context.clearRect(0, 0, 96, 96);
  const halo = context.createRadialGradient(center, center, 12, center, center, 43);
  halo.addColorStop(0, `${color}48`);
  halo.addColorStop(0.62, `${color}18`);
  halo.addColorStop(1, `${color}00`);
  context.fillStyle = halo;
  context.fillRect(0, 0, 96, 96);

  context.save();
  context.translate(center, center);
  context.shadowColor = color;
  context.shadowBlur = 9;
  context.fillStyle = 'rgba(3, 13, 17, 0.9)';
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.beginPath();
  context.arc(0, 0, 29, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.shadowBlur = 0;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (layer.id === 'nationalHubs') {
    context.lineWidth = 3.6;
    context.beginPath();
    for (let index = 0; index < 6; index += 1) {
      const angle = Math.PI / 3 * index - Math.PI / 2;
      const x = Math.cos(angle) * 18;
      const y = Math.sin(angle) * 18;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.stroke();
    for (let index = 0; index < 3; index += 1) {
      const angle = Math.PI / 3 * index;
      context.beginPath();
      context.moveTo(-Math.cos(angle) * 14, -Math.sin(angle) * 14);
      context.lineTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
      context.stroke();
    }
    context.fillStyle = color;
    context.beginPath();
    context.arc(0, 0, 5.2, 0, Math.PI * 2);
    context.fill();
  } else if (layer.id === 'coldChainBases') {
    context.lineWidth = 3.2;
    for (let index = 0; index < 6; index += 1) {
      const angle = Math.PI / 3 * index - Math.PI / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(cos * 20, sin * 20);
      context.moveTo(cos * 12, sin * 12);
      context.lineTo(cos * 8 + Math.cos(angle + Math.PI / 3) * 7, sin * 8 + Math.sin(angle + Math.PI / 3) * 7);
      context.moveTo(cos * 12, sin * 12);
      context.lineTo(cos * 8 + Math.cos(angle - Math.PI / 3) * 7, sin * 8 + Math.sin(angle - Math.PI / 3) * 7);
      context.stroke();
    }
    context.fillStyle = color;
    context.beginPath();
    context.arc(0, 0, 3.8, 0, Math.PI * 2);
    context.fill();
  } else {
    context.lineWidth = 3.2;
    [-13, 0, 13].forEach((offset, index) => {
      const top = index === 1 ? -17 : -12;
      context.beginPath();
      context.moveTo(offset - 7, 17);
      context.lineTo(offset - 7, top);
      context.lineTo(offset, top - 6);
      context.lineTo(offset + 7, top);
      context.lineTo(offset + 7, 17);
      context.stroke();
    });
    context.beginPath();
    context.moveTo(-22, 18);
    context.lineTo(22, 18);
    context.stroke();
  }
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export class InfrastructureLayer extends THREE.Group {
  constructor({ mapFactory, projector, routes, entities, registry, infrastructureData }) {
    super();
    this.name = 'InfrastructureLayerRoot';
    this.projector = projector;
    this.routes = routes;
    this.routeObjects = new Map();
    this.nodeObjects = new Map();
    this.infrastructureData = infrastructureData ?? { transport: { layers: [] }, facilities: { layers: [] } };
    this.filters = { axes: true, corridors: true, channels: true, hubs: true };

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

    this.transportRoot = new THREE.Group();
    this.transportRoot.name = 'MajorTransportNetworkRoot';
    this.transportObjects = new Map();
    this.add(this.transportRoot);
    this.infrastructureData.transport?.layers?.forEach((layer) => this.addTransportLayer(layer));

    this.facilityRoot = new THREE.Group();
    this.facilityRoot.name = 'LogisticsFacilityPointRoot';
    this.facilityObjects = new Map();
    this.add(this.facilityRoot);
    this.infrastructureData.facilities?.layers?.forEach((layer) => this.addFacilityLayer(layer));

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
      line.material.depthTest = false;
      line.material.depthWrite = false;
      line.renderOrder = 14;
      line.userData = routeGroup.userData;
      line.material.userData.baseOpacity = style.opacity;
      routeGroup.add(line);
    });
    this.routeObjects.set(route.id, routeGroup);
    this.routeRoot.add(routeGroup);
  }

  addTransportLayer(layer) {
    const segments = layer.segments ?? [];
    if (segments.length < 4) return;
    const positions = new Float32Array((segments.length / 4) * 6);
    let positionIndex = 0;
    for (let index = 0; index < segments.length; index += 4) {
      const start = this.projector.fromLngLat([segments[index], segments[index + 1]], Number(layer.z ?? 1.22));
      const end = this.projector.fromLngLat([segments[index + 2], segments[index + 3]], Number(layer.z ?? 1.22));
      positions[positionIndex++] = start.x;
      positions[positionIndex++] = start.y;
      positions[positionIndex++] = start.z;
      positions[positionIndex++] = end.x;
      positions[positionIndex++] = end.y;
      positions[positionIndex++] = end.z;
    }
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);
    const isRailway = layer.id === 'majorRailways';
    const lineGroup = new THREE.Group();
    lineGroup.name = layer.id;
    lineGroup.userData = { kind: 'transport-layer', layerId: layer.id };
    const buildLine = ({ name, color, width, opacity, dashed = false, renderOrder }) => {
      const material = new LineMaterial({
        color: toNumberColor(color),
        linewidth: width,
        worldUnits: false,
        transparent: true,
        opacity,
        depthTest: false,
        depthWrite: false,
        dashed,
        dashScale: 1,
        dashSize: 0.72,
        gapSize: 0.5,
        alphaToCoverage: false,
      });
      material.userData.baseOpacity = opacity;
      const line = new LineSegments2(geometry, material);
      line.name = name;
      if (dashed) line.computeLineDistances();
      line.frustumCulled = false;
      line.renderOrder = renderOrder;
      line.userData = lineGroup.userData;
      return line;
    };
    lineGroup.add(buildLine({
      name: `${layer.id}-casing`,
      color: isRailway ? '#06131b' : '#24160c',
      width: isRailway ? 4.0 : 4.4,
      opacity: isRailway ? 0.86 : 0.84,
      renderOrder: isRailway ? 10 : 8,
    }));
    lineGroup.add(buildLine({
      name: `${layer.id}-route`,
      color: layer.color,
      width: isRailway ? 1.9 : 2.2,
      opacity: Number(layer.opacity ?? 0.94),
      dashed: isRailway,
      renderOrder: isRailway ? 11 : 9,
    }));
    this.filters[layer.id] = true;
    this.transportObjects.set(layer.id, lineGroup);
    this.transportRoot.add(lineGroup);
  }

  addFacilityLayer(layer) {
    const points = layer.points ?? [];
    if (!points.length) return;
    const positions = new Float32Array(points.length * 3);
    points.forEach((feature, index) => {
      const point = this.projector.fromLngLat(feature.coordinates, 2.42);
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const iconTexture = createFacilityIconTexture(layer);
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      map: iconTexture,
      size: facilityIconSize[layer.id] ?? 15,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.96,
      alphaTest: 0.045,
      depthTest: false,
      depthWrite: false,
    });
    const pointCloud = new THREE.Points(geometry, material);
    pointCloud.name = layer.id;
    pointCloud.renderOrder = 18;
    pointCloud.userData = { kind: 'facility-layer', layerId: layer.id, features: points };
    this.filters[layer.id] = true;
    this.facilityObjects.set(layer.id, pointCloud);
    this.facilityRoot.add(pointCloud);
  }

  setFilter(id, enabled) {
    this.filters[id] = enabled;
    if (id === 'hubs') this.nodeRoot.visible = enabled;
    if (this.transportObjects.has(id)) this.transportObjects.get(id).visible = enabled;
    if (this.facilityObjects.has(id)) this.facilityObjects.get(id).visible = enabled;
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

  setStackOcclusion(enabled) {
    [this.routeRoot, this.transportRoot, this.facilityRoot].forEach((root) => {
      root.traverse((object) => {
        if (!object.material) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          material.depthTest = enabled;
          material.needsUpdate = true;
        });
      });
    });
  }

  setVisualWeight(weight, options) {
    this.visible = weight > 0.005;
    setGroupOpacity(this, weight, options);
  }

  resize(width, height) {
    updateLineResolution(this, width, height);
  }
}
