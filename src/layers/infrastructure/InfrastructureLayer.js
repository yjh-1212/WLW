import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { MAP_THEME, toNumberColor } from '../../theme/mapTheme.js';
import { makeEntityNode, makeWideLine, setGroupOpacity, updateLineResolution } from '../rendering.js';
import { normalizeProvinceName } from '../../data/demoData.js';

const routeStyle = {
  axis: { color: MAP_THEME.routeAxis, width: 3.3, opacity: 0.94 },
  corridor: { color: MAP_THEME.routeCorridor, width: 2.35, opacity: 0.86 },
  channel: { color: MAP_THEME.routeChannel, width: 1.85, opacity: 0.82, dashed: true },
};

const classifyFacilityKind = (point = {}) => {
  const text = `${point.category ?? ''} ${point.name ?? ''}`;
  if (/空港|机场|航空/.test(text)) return 'air';
  if (/港口|港区|水运|码头/.test(text)) return 'port';
  if (/陆港|铁路|货站|编组/.test(text)) return 'rail';
  return 'road';
};

const makeDirectionLabel = (text) => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(384, Math.max(128, text.length * 28 + 28));
  canvas.height = 48;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '700 22px "Microsoft YaHei", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.strokeStyle = 'rgba(4, 12, 22, 0.92)';
  context.lineWidth = 5;
  context.strokeText(text, canvas.width / 2, 24);
  context.fillStyle = '#9ee7ff';
  context.fillText(text, canvas.width / 2, 24);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(text.length * 0.42 + 0.8, 0.7), material);
  mesh.userData.labelTexture = texture;
  return mesh;
};

const facilityIconSize = {
  nationalHubs: 17,
  coldChainBases: 15.5,
  logisticsParks: 15.5,
  railFreight: 14,
  roadFreight: 14,
  airPortFacilities: 15,
};

const makeCityLabel = (text, { size = 28, accent = '#8fe7ff' } = {}) => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d');
  const font = `700 ${size}px "Microsoft YaHei", "Noto Sans SC", sans-serif`;
  measure.font = font;
  const textWidth = Math.ceil(measure.measureText(text).width);
  const padX = 16;
  const padY = 10;
  canvas.width = Math.min(640, Math.max(96, textWidth + padX * 2));
  canvas.height = size + padY * 2;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  context.lineWidth = 7;
  context.strokeStyle = 'rgba(2, 8, 16, 0.96)';
  context.strokeText(text, x, y);
  context.fillStyle = accent;
  context.fillText(text, x, y);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  material.userData.alwaysTransparent = true;
  const worldHeight = size >= 32 ? 1.05 : size >= 26 ? 0.88 : 0.72;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(worldHeight * (canvas.width / canvas.height), worldHeight),
    material,
  );
  label.renderOrder = 24;
  label.userData.labelTexture = texture;
  label.userData.kind = 'infra-city-label';
  return label;
};

const makeHexagonMesh = (radius, color) => {
  const shape = new THREE.Shape();
  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 3 * index - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.96 }),
  );
};

const makeOutboundArrow = (direction, color) => {
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.38, 10),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );
  cone.rotation.z = Math.atan2(direction.y, direction.x) - Math.PI / 2;
  return cone;
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
  } else if (layer.id === 'railFreight') {
    context.lineWidth = 3.2;
    context.beginPath();
    context.moveTo(-20, -8);
    context.lineTo(20, -8);
    context.moveTo(-20, 8);
    context.lineTo(20, 8);
    context.stroke();
    for (let offset = -16; offset <= 16; offset += 8) {
      context.beginPath();
      context.moveTo(offset, -11);
      context.lineTo(offset, 11);
      context.stroke();
    }
  } else if (layer.id === 'roadFreight') {
    context.lineWidth = 3.4;
    context.strokeRect(-16, -11, 32, 22);
    context.beginPath();
    context.moveTo(-16, 0);
    context.lineTo(16, 0);
    context.stroke();
    context.fillStyle = color;
    context.beginPath();
    context.arc(0, 0, 4, 0, Math.PI * 2);
    context.fill();
  } else if (layer.id === 'airPortFacilities') {
    context.lineWidth = 3.2;
    context.beginPath();
    context.moveTo(0, -20);
    context.lineTo(4, -4);
    context.lineTo(20, 2);
    context.lineTo(4, 6);
    context.lineTo(0, 20);
    context.lineTo(-4, 6);
    context.lineTo(-20, 2);
    context.lineTo(-4, -4);
    context.closePath();
    context.stroke();
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
    this.focusProvince = null;
    this.provinceContains = null;
    this.storyNationalSuppressed = false;
    this.homeOverview = false;

    this.sheet = mapFactory.createSheet({ name: 'InfrastructureMapSheet', role: 'infrastructure', color: MAP_THEME.infrastructureSurface, opacity: 0.82 });
    // Keep a shallow physical slab. Its top remains around Z=1.31 so routes
    // stay seated while close oblique views do not expose tall striped walls.
    this.sheet.scale.z = 0.44;
    this.sheet.position.z = 0.79;
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
      node.userData.province = entity.province;
      this.nodeRoot.add(node);
      this.nodeObjects.set(entity.id, node);
      registry.registerLayerObject(entity.id, 'infrastructure', node);
    });

    this.cityRoot = new THREE.Group();
    this.cityRoot.name = 'ProvincialCityNodeRoot';
    this.cityRoot.visible = false;
    this.add(this.cityRoot);
    this.skeletonRoot = new THREE.Group();
    this.skeletonRoot.name = 'ProvincialSkeletonRoot';
    this.skeletonRoot.visible = false;
    this.add(this.skeletonRoot);
    this.outboundRoot = new THREE.Group();
    this.outboundRoot.name = 'ProvincialOutboundChannelRoot';
    this.outboundRoot.visible = false;
    this.add(this.outboundRoot);
    this.weakRoot = new THREE.Group();
    this.weakRoot.name = 'ProvincialWeakAreaRoot';
    this.weakRoot.visible = false;
    this.add(this.weakRoot);
    this.cityNodes = new Map();
    this.freightObjects = new Map();
    this.pulseRings = [];
    this.provinceAnalysis = null;
    this.suppressFocusApply = 0;
    this.transportClipCache = new Map();
    [
      { id: 'railFreight', color: '#7ec8ff', size: 14 },
      { id: 'roadFreight', color: '#ffc45f', size: 14 },
      { id: 'airPortFacilities', color: '#9ee0ff', size: 15 },
    ].forEach((spec) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        map: createFacilityIconTexture(spec),
        size: spec.size,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.96,
        alphaTest: 0.045,
        depthTest: false,
        depthWrite: false,
      });
      const cloud = new THREE.Points(geometry, material);
      cloud.name = spec.id;
      cloud.visible = false;
      cloud.renderOrder = 19;
      cloud.userData = { kind: 'facility-layer', layerId: spec.id, features: [] };
      this.facilityRoot.add(cloud);
      this.freightObjects.set(spec.id, cloud);
    });
  }

  addRoute(route) {
    const style = routeStyle[route.type];
    if (!style) return;
    const routeGroup = new THREE.Group();
    routeGroup.name = route.id;
    const sourceSegments = this.projector.routeSegments(route, 1.34).filter((points) => points.length >= 2);
    routeGroup.userData = { kind: 'route', routeId: route.id, style, sourceSegments };
    this.paintRouteSegments(routeGroup, sourceSegments);
    this.routeObjects.set(route.id, routeGroup);
    this.routeRoot.add(routeGroup);
  }

  paintRouteSegments(routeGroup, segments) {
    const style = routeGroup.userData.style;
    const resolution = routeGroup.children[0]?.material?.resolution?.clone();
    while (routeGroup.children.length) {
      const child = routeGroup.children[0];
      routeGroup.remove(child);
      child.geometry?.dispose();
      child.material?.dispose();
    }
    segments.forEach((points) => {
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
      line.userData = { kind: 'route', routeId: routeGroup.userData.routeId };
      line.material.userData.baseOpacity = style.opacity;
      if (resolution) line.material.resolution.copy(resolution);
      routeGroup.add(line);
    });
  }

  clipPolyline(points) {
    if (!this.provinceContains) return points.length >= 2 ? [points] : [];
    const runs = [];
    let current = [];
    points.forEach((point, index) => {
      const inside = this.provinceContains(point.x, point.y);
      const neighborInside = (index > 0 && this.provinceContains(points[index - 1].x, points[index - 1].y))
        || (index < points.length - 1 && this.provinceContains(points[index + 1].x, points[index + 1].y));
      if (inside || neighborInside) {
        current.push(point);
        return;
      }
      if (current.length >= 2) runs.push(current);
      current = [];
    });
    if (current.length >= 2) runs.push(current);
    return runs;
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
    lineGroup.userData = {
      kind: 'transport-layer',
      layerId: layer.id,
      sourcePositions: positions,
      lineGeometry: geometry,
    };
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

  getEntityWorldPosition(entityId) {
    const node = this.nodeObjects.get(entityId);
    if (!node || !node.visible) return null;
    return node.getWorldPosition(new THREE.Vector3());
  }

  getFeatureWorldPosition(featureId) {
    for (const cloud of this.facilityObjects.values()) {
      const feature = (cloud.userData.features ?? []).find((item) => item.id === featureId);
      if (!feature) continue;
      if (this.focusProvince && normalizeProvinceName(feature.province) !== normalizeProvinceName(this.focusProvince)) continue;
      return this.projector.fromLngLat(feature.coordinates, 2.42);
    }
    return null;
  }

  getCityWorldPosition(cityId) {
    const node = this.cityNodes.get(cityId);
    if (node) return node.getWorldPosition(new THREE.Vector3());
    const city = this.provinceAnalysis?.cities?.find((item) => item.id === cityId);
    if (!city?.center) return null;
    return this.projector.fromLngLat(city.center, 2.55);
  }

  clearProvinceAnalysis() {
    const disposeGroup = (group) => {
      while (group.children.length) {
        const child = group.children[0];
        group.remove(child);
        child.traverse?.((object) => {
          object.geometry?.dispose?.();
          object.material?.map?.dispose?.();
          object.material?.dispose?.();
        });
      }
    };
    disposeGroup(this.cityRoot);
    disposeGroup(this.skeletonRoot);
    disposeGroup(this.outboundRoot);
    disposeGroup(this.weakRoot);
    this.cityNodes.clear();
    this.pulseRings = [];
    this.provinceAnalysis = null;
    this.cityRoot.visible = false;
    this.skeletonRoot.visible = false;
    this.outboundRoot.visible = false;
    this.weakRoot.visible = false;
    this.freightObjects.forEach((cloud) => { cloud.visible = false; });
  }

  setProvinceAnalysis(analysis = null) {
    this.clearProvinceAnalysis();
    this.provinceAnalysis = analysis;
    if (!analysis) {
      this.applyProvinceFocus();
      return;
    }
    (analysis.cities ?? []).forEach((city) => {
      const point = this.projector.fromLngLat(city.center, 2.52);
      const root = new THREE.Group();
      root.position.copy(point);
      root.userData = { kind: 'infra-city', cityId: city.id, city };
      const isCore = city.tier === 1;
      const isRegional = city.tier === 2;
      const color = isCore ? 0xffc45f : isRegional ? 0xff9a3a : 0x6ec4e6;
      if (isCore) {
        const glow = new THREE.Mesh(
          new THREE.CircleGeometry(1.35, 36),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1, depthWrite: false }),
        );
        glow.position.z = -0.04;
        glow.userData = root.userData;
        root.add(glow);
        const hex = makeHexagonMesh(0.42, color);
        hex.userData = root.userData;
        root.add(hex);
        [0.58, 0.82].forEach((radius, index) => {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(radius, radius + 0.06, 36),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: index ? 0.22 : 0.55, side: THREE.DoubleSide, depthWrite: false }),
          );
          ring.position.z = 0.02;
          ring.userData = { ...root.userData, pulse: true, pulsePhase: index };
          root.add(ring);
          this.pulseRings.push(ring);
        });
      } else {
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(isRegional ? 0.2 : 0.12, 14, 14),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.96 }),
        );
        core.userData = root.userData;
        root.add(core);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(isRegional ? 0.28 : 0.18, isRegional ? 0.36 : 0.24, 28),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: isRegional ? 0.72 : 0.4, side: THREE.DoubleSide, depthWrite: false }),
        );
        ring.position.z = 0.02;
        ring.userData = root.userData;
        root.add(ring);
      }
      if (city.label !== false) {
        const label = makeCityLabel(city.name, {
          size: isCore ? 34 : isRegional ? 28 : 24,
          accent: isCore ? '#ffd27a' : isRegional ? '#ffb56a' : '#8fe7ff',
        });
        if (label) {
          label.position.set(0, isCore ? 0.92 : isRegional ? 0.72 : 0.56, 0.08);
          root.add(label);
        }
      }
      this.cityRoot.add(root);
      this.cityNodes.set(city.id, root);
    });
    (analysis.skeleton ?? []).forEach((edge) => {
      if (!edge.from || !edge.to) return;
      const start = this.projector.fromLngLat(edge.from, 2.18);
      const end = this.projector.fromLngLat(edge.to, 2.18);
      const trunk = edge.grade !== 'feeder';
      const glow = makeWideLine([start, end], {
        color: toNumberColor('#1d6f62'),
        width: trunk ? 6.2 : 3.6,
        opacity: 0.28,
      });
      glow.material.depthTest = false;
      glow.renderOrder = 15;
      this.skeletonRoot.add(glow);
      const line = makeWideLine([start, end], {
        color: toNumberColor('#4EE8C4'),
        width: trunk ? 3.15 : 1.85,
        opacity: trunk ? 0.92 : 0.7,
      });
      line.material.depthTest = false;
      line.renderOrder = 16;
      this.skeletonRoot.add(line);
    });
    const provinceName = this.focusProvince ? normalizeProvinceName(this.focusProvince) : null;
    const airFeatures = (this.facilityObjects.get('nationalHubs')?.userData.features ?? [])
      .filter((feature) => (!provinceName || normalizeProvinceName(feature.province) === provinceName)
        && ['air', 'port'].includes(classifyFacilityKind(feature)));
    airFeatures.forEach((feature) => {
      if (!feature.coordinates) return;
      const start = this.projector.fromLngLat(feature.coordinates, 2.46);
      const nearest = (analysis.cities ?? []).reduce((best, city) => {
        const dx = city.center[0] - feature.coordinates[0];
        const dy = city.center[1] - feature.coordinates[1];
        const dist = Math.hypot(dx, dy);
        return !best || dist < best.dist ? { city, dist } : best;
      }, null)?.city;
      if (!nearest) return;
      const end = this.projector.fromLngLat(nearest.center, 2.46);
      const link = makeWideLine([start, end], {
        color: toNumberColor('#8fd4ff'),
        width: 0.85,
        opacity: 0.42,
      });
      link.material.depthTest = false;
      link.renderOrder = 14;
      this.skeletonRoot.add(link);
    });
    const gateways = (analysis.cities ?? []).filter((city) => city.tier <= 2);
    (analysis.neighbors ?? []).forEach((neighbor) => {
      const originCity = gateways.reduce((best, city) => {
        const dx = city.center[0] - neighbor.center[0];
        const dy = city.center[1] - neighbor.center[1];
        const dist = Math.hypot(dx, dy);
        return !best || dist < best.dist ? { city, dist } : best;
      }, null)?.city;
      const origin = originCity?.center ?? analysis.provinceCenter;
      if (!origin || !neighbor.center) return;
      const start = this.projector.fromLngLat(origin, 2.22);
      const target = this.projector.fromLngLat(neighbor.center, 2.22);
      const direction = target.clone().sub(start);
      const length = direction.length() || 1;
      direction.multiplyScalar(1 / length);
      let border = start.clone().add(direction.clone().multiplyScalar(Math.min(4.2, length * 0.18)));
      if (this.provinceContains) {
        for (let step = 0.4; step < 18; step += 0.35) {
          const sample = start.clone().add(direction.clone().multiplyScalar(step));
          if (!this.provinceContains(sample.x, sample.y)) {
            border = sample;
            break;
          }
        }
      }
      const inner = border.clone().add(direction.clone().multiplyScalar(-0.55));
      const end = border.clone().add(direction.clone().multiplyScalar(2.35));
      const line = makeWideLine([inner, end], {
        color: toNumberColor('#5ad6ff'),
        width: 2.35,
        opacity: 0.9,
        dashed: true,
        dashSize: 0.38,
        gapSize: 0.24,
      });
      line.material.depthTest = false;
      line.renderOrder = 20;
      line.userData = { kind: 'outbound-channel', neighbor: neighbor.name };
      this.outboundRoot.add(line);
      const arrow = makeOutboundArrow(direction, toNumberColor('#7ee7ff'));
      arrow.position.copy(end).setZ(2.35);
      arrow.renderOrder = 21;
      this.outboundRoot.add(arrow);
      const label = makeDirectionLabel(`至${neighbor.name}`);
      if (label) {
        label.position.copy(end).add(direction.clone().multiplyScalar(0.55)).setZ(2.72);
        label.renderOrder = 22;
        this.outboundRoot.add(label);
      }
    });
    if (this.weakRoot) this.weakRoot.visible = false;
    if (!this.suppressFocusApply) this.applyProvinceFocus();
  }

  beginFocusBatch() {
    this.suppressFocusApply += 1;
  }

  endFocusBatch() {
    this.suppressFocusApply = Math.max(0, this.suppressFocusApply - 1);
    if (!this.suppressFocusApply && (this.focusProvince || this.provinceAnalysis)) this.applyProvinceFocus();
  }

  applyProvinceFocus() {
    const normalized = this.focusProvince ? normalizeProvinceName(this.focusProvince) : null;
    const analysis = this.provinceAnalysis;
    const backboneOn = !analysis || this.filters.provincialBackbone !== false;
    this.facilityObjects.forEach((cloud) => {
      if (this.freightObjects.has(cloud.name)) return;
      const features = cloud.userData.features ?? [];
      let visible = normalized
        ? features.filter((feature) => normalizeProvinceName(feature.province) === normalized)
        : features;
      if (analysis && cloud.name === 'nationalHubs') {
        visible = [];
      }
      const positions = new Float32Array(Math.max(visible.length, 1) * 3);
      visible.forEach((feature, index) => {
        const point = this.projector.fromLngLat(feature.coordinates, 2.42);
        positions[index * 3] = point.x;
        positions[index * 3 + 1] = point.y;
        positions[index * 3 + 2] = point.z;
      });
      cloud.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      cloud.geometry.setDrawRange(0, visible.length);
      cloud.visible = this.filters[cloud.name] !== false && visible.length > 0;
    });
    if (analysis) {
      const hubLayer = this.facilityObjects.get('nationalHubs');
      const hubPoints = (hubLayer?.userData.features ?? []).filter((feature) => normalizeProvinceName(feature.province) === normalized);
      const grouped = { railFreight: [], roadFreight: [], airPortFacilities: [] };
      hubPoints.forEach((feature) => {
        const kind = classifyFacilityKind(feature);
        if (kind === 'rail') grouped.railFreight.push(feature);
        else if (kind === 'air' || kind === 'port') grouped.airPortFacilities.push(feature);
        else grouped.roadFreight.push(feature);
      });
      this.freightObjects.forEach((cloud, id) => {
        const visible = grouped[id] ?? [];
        const positions = new Float32Array(Math.max(visible.length, 1) * 3);
        visible.forEach((feature, index) => {
          const point = this.projector.fromLngLat(feature.coordinates, 2.48);
          positions[index * 3] = point.x;
          positions[index * 3 + 1] = point.y;
          positions[index * 3 + 2] = point.z;
        });
        cloud.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        cloud.geometry.setDrawRange(0, visible.length);
        cloud.userData.features = visible;
        cloud.visible = this.filters[id] !== false && visible.length > 0;
      });
    } else {
      this.freightObjects.forEach((cloud) => { cloud.visible = false; });
    }
    this.nodeObjects.forEach((node) => {
      node.visible = !analysis && (!normalized || normalizeProvinceName(node.userData.province) === normalized);
    });
    this.nodeRoot.visible = !analysis && this.filters.hubs !== false && this.filters.nationalHubs !== false;
    this.transportObjects.forEach((group) => {
      const source = group.userData.sourcePositions;
      const geometry = group.userData.lineGeometry;
      if (!source || !geometry) return;
      const isRailway = group.name === 'majorRailways';
      const transportOn = analysis
        ? isRailway ? this.filters.railFreight !== false : this.filters.roadFreight !== false
        : this.filters[group.name] !== false;
      let clipped = source;
      const clipKey = this.provinceContains ? `${normalized || 'province'}|${analysis ? 'analysis' : 'clip'}|${group.name}` : 'national';
      if (this.provinceContains) {
        clipped = this.transportClipCache.get(clipKey);
        if (!clipped) {
          const kept = [];
          for (let index = 0; index < source.length; index += 6) {
            const startInside = this.provinceContains(source[index], source[index + 1]);
            const endInside = this.provinceContains(source[index + 3], source[index + 4]);
            const midInside = this.provinceContains(
              (source[index] + source[index + 3]) * 0.5,
              (source[index + 1] + source[index + 4]) * 0.5,
            );
            const dx = source[index] - source[index + 3];
            const dy = source[index + 1] - source[index + 4];
            const span = Math.hypot(dx, dy);
            const keepRoad = isRailway || span > 0.58;
            if ((startInside || endInside || midInside) && keepRoad) {
              kept.push(
                source[index], source[index + 1], source[index + 2],
                source[index + 3], source[index + 4], source[index + 5],
              );
            }
          }
          clipped = kept.length ? new Float32Array(kept) : new Float32Array(6);
          this.transportClipCache.set(clipKey, clipped);
        }
        group.visible = transportOn && clipped.length > 6;
      } else {
        group.visible = transportOn;
      }
      if (group.userData.clipKey !== clipKey) {
        geometry.setPositions(clipped);
        group.userData.clipKey = clipKey;
      }
      group.traverse((line) => {
        if (!line.material) return;
        if (analysis) line.material.opacity = (line.material.userData.baseOpacity ?? line.material.opacity) * (isRailway ? 0.62 : 0.28);
        else line.material.opacity = line.material.userData.baseOpacity ?? line.material.opacity;
        if (line.isLineSegments2 && line.material?.dashed) line.computeLineDistances();
      });
    });
    this.routeObjects.forEach((routeGroup) => {
      if (analysis) {
        routeGroup.visible = false;
        return;
      }
      const sourceSegments = routeGroup.userData.sourceSegments ?? [];
      if (this.provinceContains) {
        const clipped = sourceSegments.flatMap((points) => this.clipPolyline(points));
        this.paintRouteSegments(routeGroup, clipped);
        routeGroup.userData.clipApplied = true;
        const type = this.routes.find((route) => route.id === routeGroup.userData.routeId)?.type;
        const filterId = type === 'axis' ? 'axes' : type === 'corridor' ? 'corridors' : type === 'channel' ? 'channels' : null;
        routeGroup.visible = (!filterId || this.filters[filterId] !== false) && clipped.length > 0;
        return;
      }
      if (routeGroup.userData.clipApplied) {
        this.paintRouteSegments(routeGroup, sourceSegments);
        routeGroup.userData.clipApplied = false;
      }
      const type = this.routes.find((route) => route.id === routeGroup.userData.routeId)?.type;
      const filterId = type === 'axis' ? 'axes' : type === 'corridor' ? 'corridors' : type === 'channel' ? 'channels' : null;
      routeGroup.visible = (!filterId || this.filters[filterId] !== false) && sourceSegments.length > 0;
    });
    if (this.cityRoot) this.cityRoot.visible = Boolean(analysis) && this.filters.cityNodes !== false;
    if (this.skeletonRoot) this.skeletonRoot.visible = Boolean(analysis) && backboneOn;
    if (this.outboundRoot) this.outboundRoot.visible = Boolean(analysis) && this.filters.outboundChannels !== false;
    if (this.weakRoot) this.weakRoot.visible = false;
  }

  setFocusProvince(provinceName = null, contains = null) {
    this.focusProvince = provinceName || null;
    this.provinceContains = typeof contains === 'function' ? contains : null;
    if (!provinceName) this.clearProvinceAnalysis();
    if (!this.suppressFocusApply) this.applyProvinceFocus();
  }

  setFilter(id, enabled) {
    this.filters[id] = enabled;
    if (id === 'provincialBackbone' && !this.provinceAnalysis) {
      ['axes', 'corridors', 'channels', 'majorRailways', 'majorRoads'].forEach((key) => { this.filters[key] = enabled; });
    }
    if (id === 'hubs' || id === 'nationalHubs') {
      const hubsOn = this.filters.nationalHubs !== false && this.filters.hubs !== false;
      this.nodeRoot.visible = hubsOn && !this.provinceAnalysis;
      if (this.facilityObjects.has('nationalHubs')) this.facilityObjects.get('nationalHubs').visible = this.filters.nationalHubs !== false && !this.provinceAnalysis;
    }
    if (this.transportObjects.has(id)) this.transportObjects.get(id).visible = enabled;
    if (this.facilityObjects.has(id) && id !== 'nationalHubs') this.facilityObjects.get(id).visible = enabled;
    const type = id === 'axes' ? 'axis' : id === 'corridors' ? 'corridor' : id === 'channels' ? 'channel' : null;
    if (type) this.routes.filter((route) => route.type === type).forEach((route) => { if (this.routeObjects.has(route.id)) this.routeObjects.get(route.id).visible = enabled; });
    if (this.cityRoot && id === 'cityNodes') this.cityRoot.visible = enabled && Boolean(this.provinceAnalysis);
    if (this.skeletonRoot && id === 'provincialBackbone') this.skeletonRoot.visible = enabled && Boolean(this.provinceAnalysis);
    if (this.outboundRoot && id === 'outboundChannels') this.outboundRoot.visible = enabled && Boolean(this.provinceAnalysis);
    if (this.weakRoot) this.weakRoot.visible = false;
    if (!this.suppressFocusApply && (this.focusProvince || this.provinceAnalysis)) this.applyProvinceFocus();
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
    [this.routeRoot, this.transportRoot, this.facilityRoot, this.cityRoot, this.skeletonRoot, this.outboundRoot, this.weakRoot].forEach((root) => {
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
    this.visible = options?.preserveSheet ? true : weight > 0.005;
    this.visualWeight = weight;
    setGroupOpacity(this, weight, options);
    if (this.explodedPresentation) this.applyExplodedDensity(weight);
    else if (this.homeOverview) this.applyHomeDensity(weight);
    this.applyStoryNationalSuppression();
  }

  /**
   * 首页开场态：只留战略骨架通道与国家级枢纽，公路铁路网与园区点云不参与。
   */
  setHomeOverview(enabled = false) {
    this.homeOverview = Boolean(enabled);
    if (this.homeOverview) this.applyHomeDensity(this.visualWeight ?? 1);
    else if (!this.explodedPresentation) this.clearExplodedDensity();
    if (this.transportRoot) this.transportRoot.visible = !this.homeOverview && !this.explodedPresentation;
    this.applyStoryNationalSuppression();
  }

  applyHomeDensity(weight = 1) {
    const w = THREE.MathUtils.clamp(Number.isFinite(weight) ? Number(weight) : 1, 0, 1);
    this.facilityObjects.forEach((cloud, id) => {
      const material = cloud.material;
      if (!material) return;
      if (material.userData.baseOpacity == null) material.userData.baseOpacity = material.opacity;
      if (material.userData.baseSize == null) material.userData.baseSize = material.size;
      const hub = id === 'nationalHubs';
      material.opacity = material.userData.baseOpacity * w * (hub ? 0.62 : 0);
      material.size = material.userData.baseSize * (hub ? 0.74 : 0.2);
      cloud.visible = hub && this.filters[id] !== false;
      material.needsUpdate = true;
    });
  }

  /**
   * 三层分解：只留骨干通道 + 少量核心枢纽，公路铁路网和园区降为极弱背景。
   */
  setExplodedPresentation(enabled = false) {
    this.explodedPresentation = Boolean(enabled);
    if (this.sheet) this.sheet.scale.z = enabled ? 0.62 : 0.44;
    if (this.nodeRoot) {
      this.nodeRoot.visible = !enabled && !this.provinceAnalysis
        && this.filters.hubs !== false && this.filters.nationalHubs !== false;
    }
    if (this.transportRoot) this.transportRoot.visible = !enabled;
    if (enabled) this.applyExplodedDensity(this.visualWeight ?? 1);
    else this.clearExplodedDensity();
    this.applyStoryNationalSuppression();
  }

  setStoryNationalSuppressed(enabled = false) {
    this.storyNationalSuppressed = Boolean(enabled);
    if (!enabled) {
      this.setExplodedPresentation(this.explodedPresentation);
      return;
    }
    this.applyStoryNationalSuppression();
  }

  applyStoryNationalSuppression() {
    if (!this.storyNationalSuppressed) return;
    [this.routeRoot, this.transportRoot, this.facilityRoot, this.nodeRoot, this.outboundRoot, this.weakRoot]
      .forEach((root) => { if (root) root.visible = false; });
  }

  clearExplodedDensity() {
    this.facilityObjects.forEach((cloud, id) => {
      const material = cloud.material;
      if (!material) return;
      if (material.userData.baseOpacity != null) material.opacity = material.userData.baseOpacity;
      if (material.userData.baseSize != null) material.size = material.userData.baseSize;
      cloud.visible = this.filters[id] !== false;
      material.needsUpdate = true;
    });
    [this.routeRoot, this.transportRoot].forEach((root) => {
      root?.traverse((object) => {
        const material = object.material;
        if (!material) return;
        if (material.userData.baseOpacity != null) material.opacity = material.userData.baseOpacity;
        if (material.userData.baseLinewidth != null) material.linewidth = material.userData.baseLinewidth;
        material.needsUpdate = true;
      });
    });
  }

  applyExplodedDensity(weight = 1) {
    const w = THREE.MathUtils.clamp(Number(weight) || 1, 0, 1);
    this.facilityObjects.forEach((cloud, id) => {
      const material = cloud.material;
      if (!material) return;
      if (material.userData.baseOpacity == null) material.userData.baseOpacity = material.opacity;
      if (material.userData.baseSize == null) material.userData.baseSize = material.size;
      if (id === 'nationalHubs') {
        material.opacity = material.userData.baseOpacity * w * 0.55;
        material.size = material.userData.baseSize * 0.72;
        cloud.visible = this.filters[id] !== false;
      } else {
        material.opacity = material.userData.baseOpacity * w * 0.06;
        material.size = Math.max(3, material.userData.baseSize * 0.22);
        cloud.visible = false;
      }
      material.needsUpdate = true;
    });

    const dimLines = (root, trunkTest) => {
      root?.traverse((object) => {
        const material = object.material;
        if (!material || material.linewidth == null && !object.isLine2 && !object.isLineSegments2) return;
        if (material.userData.baseOpacity == null) material.userData.baseOpacity = material.opacity;
        if (material.userData.baseLinewidth == null && material.linewidth != null) {
          material.userData.baseLinewidth = material.linewidth;
        }
        const trunk = trunkTest(object);
        material.opacity = material.userData.baseOpacity * w * (trunk ? 1.08 : 0.12);
        if (material.linewidth != null && material.userData.baseLinewidth != null) {
          material.linewidth = material.userData.baseLinewidth * (trunk ? 1.35 : 0.4);
        }
        material.needsUpdate = true;
      });
    };

    dimLines(this.routeRoot, (object) => {
      const style = object.parent?.userData?.style ?? object.userData?.style;
      return Boolean(style && style.width >= 2.3);
    });
    dimLines(this.transportRoot, () => false);
  }

  update(elapsed = 0, camera = null) {
    this.pulseRings.forEach((ring) => {
      const phase = ring.userData.pulsePhase ?? 0;
      const wave = (Math.sin(elapsed * 1.55 + phase * 1.15) + 1) * 0.5;
      ring.scale.setScalar(1 + wave * 0.14);
      ring.material.opacity = (phase ? 0.12 : 0.38) + wave * 0.2;
    });
    if (!camera) return;
    this.outboundRoot?.traverse((object) => {
      if (!object.userData?.labelTexture) return;
      object.quaternion.copy(camera.quaternion);
    });
  }

  resize(width, height) {
    updateLineResolution(this, width, height);
  }
}
