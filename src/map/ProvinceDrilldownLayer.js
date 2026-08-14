import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { MAP_THEME, toNumberColor } from '../theme/mapTheme.js';

// The overlay root is attached directly to the selected province group. This
// value is therefore local to the extruded province instead of being a brittle
// world-space offset that has to account for the province focus lift.
const PROVINCE_LOCAL_SURFACE_Z = 1.24;

const roleStyle = {
  infrastructure: { color: MAP_THEME.infrastructureBright, labelColor: '#FFF3D6', surfaceZ: PROVINCE_LOCAL_SURFACE_Z, boundaryWidth: 1.92 },
  operation: { color: MAP_THEME.operationBright, labelColor: '#E3F7FF', surfaceZ: PROVINCE_LOCAL_SURFACE_Z, boundaryWidth: 1.92 },
  digital: { color: MAP_THEME.digitalBright, labelColor: '#E5FFF2', surfaceZ: PROVINCE_LOCAL_SURFACE_Z, boundaryWidth: 1.92 },
};

function displayCityName(name) {
  const text = String(name ?? '');
  return text
    .replace(/土家族苗族自治县$/u, '')
    .replace(/苗族土家族自治县$/u, '')
    .replace(/土家族自治县$/u, '')
    .replace(/苗族自治县$/u, '')
    .replace(/回族自治县$/u, '')
    .replace(/自治县$/u, '')
    || text;
}

function shortAdminName(name) {
  return String(name ?? '')
    .replace(/蒙古族藏族自治州$/u, '州')
    .replace(/藏族自治州$/u, '州')
    .replace(/回族自治州$/u, '州')
    .replace(/自治州$/u, '州')
    .replace(/地区$/u, '')
    .replace(/市$/u, '');
}

function cityLabelPriority(cityName, distanceFromCenter) {
  const name = String(cityName ?? '');
  let score = 12;
  if (name.endsWith('区')) score = 26;
  else if (name.endsWith('市')) score = 22;
  else if (name.endsWith('县')) score = 11;
  score -= Math.min(10, displayCityName(name).length);
  score += Math.max(0, 14 - distanceFromCenter * 1.8);
  return score;
}

function makeCityLabel(cityName, point, role, priority = 12) {
  const { labelColor } = roleStyle[role];
  const text = displayCityName(cityName);
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(512, Math.max(128, text.length * 40 + 36));
  canvas.height = 64;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '700 28px "Microsoft YaHei", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.strokeStyle = 'rgba(6, 16, 24, 0.88)';
  context.lineWidth = 6;
  context.strokeText(text, canvas.width / 2, 32);
  context.fillStyle = '#ffffff';
  context.fillText(text, canvas.width / 2, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const material = new THREE.MeshBasicMaterial({
    color: toNumberColor(labelColor),
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    fog: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  material.userData.alwaysTransparent = true;
  const labelHeight = 0.68;
  const labelWidth = labelHeight * (canvas.width / canvas.height);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(labelWidth, labelHeight), material);
  label.name = `${cityName}-${role}-municipal-label`;
  label.position.copy(point);
  label.renderOrder = 21;
  label.userData = {
    kind: 'municipal-label',
    city: cityName,
    role,
    labelTexture: texture,
    priority,
    baseWidth: labelWidth,
    baseHeight: labelHeight,
  };
  return label;
}

function makePlatformNode(province, point, role) {
  const { color, surfaceZ } = roleStyle[role];
  const colorNumber = toNumberColor(color);
  const root = new THREE.Group();
  root.name = `${province}-${role}-province-platform`;
  root.position.copy(point).setZ(surfaceZ);
  root.userData = { kind: 'province-platform', province, role };

  [0.66, 1.05].forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.06, radius, 40),
      new THREE.MeshBasicMaterial({ color: colorNumber, transparent: true, opacity: index ? 0.20 : 0.64, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.position.z = 0.08 + index * 0.03;
    root.add(ring);
  });

  return root;
}

export class ProvinceDrilldownLayer {
  constructor({ projector, provinceData, layers, scene }) {
    this.projector = projector;
    this.provinceData = provinceData;
    this.layers = layers;
    this.scene = scene;
    this.roots = new Map();
    this.markerNodes = new Map();
    this.cityLabels = [];
    this.cityFills = [];
    this.lineMaterials = [];
    this.resolution = new THREE.Vector2(1, 1);
    this.labelWorld = new THREE.Vector3();
    this.currentProvince = null;
    this.explodedActive = false;
    this.sandboxMode = false;
    this.sandboxRole = 'operation';
    this.hoveredCityName = null;
    this.weakCityNames = new Set();
    this.weakHighlight = false;
    this.roleWeights = { infrastructure: 1, operation: 1, digital: 1 };

    this.connectorGeometry = new LineGeometry();
    this.connectorMaterial = new LineMaterial({
      color: toNumberColor(MAP_THEME.primarySoft),
      linewidth: 2.4,
      transparent: true,
      opacity: 0.88,
      dashed: true,
      dashSize: 0.62,
      gapSize: 0.42,
      depthTest: false,
      depthWrite: false,
    });
    this.connector = new Line2(this.connectorGeometry, this.connectorMaterial);
    this.connector.name = 'ProvincePlatformVerticalConnector';
    this.connector.visible = false;
    this.connector.renderOrder = 28;
    this.scene.add(this.connector);
  }

  showProvince(provinceName, worldCenter, { accent, sandbox = false, sandboxRole = 'operation' } = {}) {
    const province = this.provinceData?.provinces?.[provinceName];
    if (!province) return null;
    this.clearProvince();
    this.currentProvince = provinceName;
    this.sandboxMode = Boolean(sandbox);
    this.sandboxRole = sandbox ? sandboxRole : 'operation';
    const center = worldCenter?.clone?.() ?? this.projector.fromLngLat(province.cities[0]?.center ?? [104, 35]);
    const activityFills = [0x0f5a8c, 0x1468a0, 0x1a74b0, 0x2080be, 0x2688c8];
    const infraFills = [0x0c2438, 0x102c44, 0x143450, 0x183c58, 0x0e283e];

    Object.entries(roleStyle).forEach(([role, baseStyle]) => {
      if (this.sandboxMode && role !== this.sandboxRole) return;
      const style = this.sandboxMode
        ? this.sandboxRole === 'infrastructure'
          ? { ...baseStyle, color: '#6a8498', labelColor: '#E8F4FF', boundaryWidth: 0.78 }
          : { ...baseStyle, color: '#4aa0c8', labelColor: '#D4ECF6', boundaryWidth: 0.82 }
        : accent && role === 'operation'
          ? { ...baseStyle, color: accent, labelColor: '#D8FFF4' }
          : baseStyle;
      const root = new THREE.Group();
      root.name = `${provinceName}-${role}-city-boundaries`;
      const positions = [];
      const centroids = [];
      const cityLabels = new THREE.Group();
      cityLabels.name = `${provinceName}-${role}-municipal-labels`;
      const cityFills = new THREE.Group();
      cityFills.name = `${provinceName}-${role}-municipal-fills`;
      let sandboxRadius = 2.4;
      province.cities.forEach((city, cityIndex) => {
        city.paths.forEach((path, pathIndex) => {
          const points = path.map((coordinate) => this.projector.fromLngLat(coordinate, style.surfaceZ));
          for (let index = 0; index < points.length - 1; index += 1) {
            positions.push(points[index].x, points[index].y, points[index].z, points[index + 1].x, points[index + 1].y, points[index + 1].z);
          }
          if (this.sandboxMode && points.length >= 4) {
            try {
              const shape = new THREE.Shape();
              points.forEach((point, index) => {
                if (index === 0) shape.moveTo(point.x, point.y);
                else shape.lineTo(point.x, point.y);
              });
              const fillPalette = this.sandboxRole === 'infrastructure' ? infraFills : activityFills;
              const fill = new THREE.Mesh(
                new THREE.ShapeGeometry(shape),
                new THREE.MeshStandardMaterial({
                  color: fillPalette[(cityIndex + pathIndex) % fillPalette.length],
                  emissive: this.sandboxRole === 'infrastructure' ? 0x14344c : 0x1a6aaa,
                  emissiveIntensity: this.sandboxRole === 'infrastructure' ? 0.08 : 0.12 + (cityIndex % 5) * 0.02,
                  metalness: 0.06,
                  roughness: 0.78,
                  transparent: true,
                  opacity: this.sandboxRole === 'infrastructure' ? 0.78 : 0.92,
                  depthWrite: true,
                }),
              );
              fill.position.z = style.surfaceZ + 0.008;
              fill.renderOrder = 4;
              fill.userData = {
                kind: 'sandbox-city',
                city: city.name,
                displayName: displayCityName(city.name),
                baseColor: fill.material.color.getHex(),
                baseEmissive: fill.material.emissiveIntensity,
                baseEmissiveColor: fill.material.emissive.getHex(),
              };
              cityFills.add(fill);
              this.cityFills.push(fill);
            } catch {
              // Skip degenerate municipal polygons rather than breaking the sandbox.
            }
          }
        });
        const point = this.projector.fromLngLat(city.center, style.surfaceZ + 0.025);
        centroids.push(point.x, point.y, point.z);
        const planarDistance = Math.hypot(point.x - center.x, point.y - center.y);
        sandboxRadius = Math.max(sandboxRadius, planarDistance);
        if (!this.sandboxMode) {
          const label = makeCityLabel(city.name, point.clone().setZ(style.surfaceZ + 0.045), role, cityLabelPriority(city.name, planarDistance));
          cityLabels.add(label);
          this.cityLabels.push(label);
        }
      });

      if (this.sandboxMode) {
        const radius = Math.min(9.2, sandboxRadius * 1.12 + 0.35);
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(radius, 48),
          new THREE.MeshBasicMaterial({
            color: 0x020814, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide,
          }),
        );
        shadow.position.set(center.x, center.y, style.surfaceZ - 0.72);
        shadow.scale.set(1, 1, 1);
        shadow.renderOrder = 1;
        shadow.userData.kind = 'sandbox-shadow';
        root.add(shadow);
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(radius * 0.9, radius * 1.16, 64),
          new THREE.MeshBasicMaterial({
            color: this.sandboxRole === 'infrastructure' ? 0x3a6a88 : 0x1a6a98, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide,
          }),
        );
        halo.position.set(center.x, center.y, style.surfaceZ - 0.68);
        halo.scale.set(1, 1, 1);
        halo.renderOrder = 2;
        halo.userData.kind = 'sandbox-halo';
        root.add(halo);
        root.add(cityFills);
      }

      const boundaryGeometry = new LineSegmentsGeometry();
      boundaryGeometry.setPositions(positions);
      const boundaryMaterial = new LineMaterial({
        color: toNumberColor(style.color),
        linewidth: style.boundaryWidth,
        transparent: false,
        opacity: 1,
        depthTest: true,
        depthWrite: false,
      });
      if (this.sandboxMode) {
        boundaryMaterial.transparent = true;
        boundaryMaterial.opacity = 0.28;
      }
      boundaryMaterial.resolution.copy(this.resolution);
      boundaryMaterial.userData.provinceStoryOpacity = boundaryMaterial.opacity;
      const boundaries = new LineSegments2(boundaryGeometry, boundaryMaterial);
      boundaries.name = `${provinceName}-${role}-municipal-lines`;
      boundaries.frustumCulled = false;
      boundaries.renderOrder = this.sandboxMode ? 6 : 18;
      root.add(boundaries);
      this.lineMaterials.push(boundaryMaterial);

      const centroidGeometry = new THREE.BufferGeometry();
      centroidGeometry.setAttribute('position', new THREE.Float32BufferAttribute(centroids, 3));
      const centroidMaterial = new THREE.PointsMaterial({
        color: toNumberColor(style.color), size: role === 'digital' ? 3.4 : 2.8,
        sizeAttenuation: false, transparent: true, opacity: 0.88, depthTest: true, depthWrite: false,
      });
      const cityPoints = new THREE.Points(centroidGeometry, centroidMaterial);
      cityPoints.name = `${provinceName}-${role}-municipal-centroids`;
      cityPoints.renderOrder = 19;
      if (!accent && !this.sandboxMode) root.add(cityPoints);
      else {
        centroidGeometry.dispose();
        centroidMaterial.dispose();
      }
      if (!this.sandboxMode) root.add(cityLabels);

      const platformNode = makePlatformNode(provinceName, center, role);
      if (!this.sandboxMode) root.add(platformNode);
      this.markerNodes.set(role, platformNode);
      const provinceGroup = this.layers[role]?.sheet?.userData?.provinces?.get(provinceName);
      (provinceGroup ?? this.layers[role]).add(root);
      this.roots.set(role, root);
    });
    return province;
  }

  setWeakCities(names = []) {
    this.weakCityNames = new Set(names);
    this.applyWeakHighlight();
  }

  setWeakHighlight(enabled = false) {
    this.weakHighlight = Boolean(enabled);
    this.applyWeakHighlight();
  }

  cityNameMatches(fill, name) {
    if (!name) return false;
    const target = shortAdminName(name);
    return [fill.userData.city, fill.userData.displayName].some((value) => shortAdminName(value) === target);
  }

  applyWeakHighlight() {
    this.cityFills.forEach((fill) => {
      const weak = this.weakHighlight && [...this.weakCityNames].some((name) => this.cityNameMatches(fill, name));
      fill.material.color.set(weak ? 0x6a3a22 : fill.userData.baseColor);
      fill.material.emissive.setHex(weak ? 0x4a2210 : (fill.userData.baseEmissiveColor ?? 0x14344c));
      fill.material.emissiveIntensity = weak ? 0.22 : fill.userData.baseEmissive;
      fill.material.needsUpdate = true;
    });
  }

  setHoveredCity(cityName = null) {
    this.hoveredCityName = cityName || null;
    this.cityFills.forEach((fill) => {
      const active = this.cityNameMatches(fill, this.hoveredCityName);
      const weak = this.weakHighlight && [...this.weakCityNames].some((name) => this.cityNameMatches(fill, name));
      const hoverFill = this.sandboxRole === 'infrastructure' ? 0x2a5a78 : 0x2a9ad4;
      fill.material.color.set(active ? hoverFill : weak ? 0x6a3a22 : fill.userData.baseColor);
      fill.material.emissiveIntensity = active ? 0.28 : weak ? 0.22 : fill.userData.baseEmissive;
      fill.material.needsUpdate = true;
    });
    this.lineMaterials.forEach((material) => {
      if (!this.sandboxMode) return;
      const hoverLine = this.sandboxRole === 'infrastructure' ? '#8eb0c4' : '#6ec4e6';
      const baseLine = this.sandboxRole === 'infrastructure' ? '#6a8498' : '#4aa0c8';
      material.opacity = this.hoveredCityName ? 0.55 : 0.42;
      material.color.set(this.hoveredCityName ? toNumberColor(hoverLine) : toNumberColor(baseLine));
    });
  }

  getSandboxCityMeshes() {
    return this.cityFills.filter((mesh) => mesh.visible && mesh.parent?.visible);
  }

  setExploded(active) {
    this.explodedActive = Boolean(active);
    const activeRoles = Object.values(this.roleWeights).filter((weight) => weight > 0.05).length;
    this.connector.visible = Boolean(this.explodedActive && this.currentProvince && activeRoles > 1);
    this.markerNodes.forEach((node) => { node.visible = this.explodedActive; });
  }

  setRoleWeights(weights = {}) {
    Object.keys(roleStyle).forEach((role) => {
      const amount = THREE.MathUtils.clamp(Number(weights[role] ?? 0), 0, 1);
      this.roleWeights[role] = amount;
      const root = this.roots.get(role);
      if (!root) return;
      root.visible = amount > 0.005;
      root.traverse((object) => {
        if (!object.material) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material.userData.provinceStoryOpacity === undefined) material.userData.provinceStoryOpacity = material.opacity ?? 1;
          material.opacity = material.userData.provinceStoryOpacity * amount;
          material.transparent = Boolean(material.userData.alwaysTransparent || amount < 0.995);
          material.depthWrite = false;
          material.needsUpdate = true;
        });
      });
    });
    this.setExploded(this.explodedActive);
  }

  updateCityLabels(camera, width, height) {
    if (!this.cityLabels.length) return;
    const canProject = Boolean(camera && width > 1 && height > 1);
    const roleRank = { digital: 3, operation: 2, infrastructure: 1 };
    const candidates = [];
    this.cityLabels.forEach((label) => {
      const weight = this.roleWeights[label.userData.role] ?? 0;
      if (!label.parent?.visible || weight < 0.18) {
        label.visible = false;
        return;
      }
      label.scale.set(1, 1, 1);
      if (!canProject) {
        label.visible = true;
        return;
      }
      const world = label.getWorldPosition(this.labelWorld);
      const distance = camera.position.distanceTo(world);
      const clip = world.project(camera);
      if (clip.z < -1 || clip.z > 1 || Math.abs(clip.x) > 1.18 || Math.abs(clip.y) > 1.18) {
        label.visible = false;
        return;
      }
      const projectedHeight = (label.userData.baseHeight / Math.max(0.001, 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance)) * height;
      candidates.push({
        label,
        weight,
        score: weight * 10 + (roleRank[label.userData.role] ?? 0),
        priority: Number(label.userData.priority ?? 0),
        x: (clip.x + 1) * 0.5 * width,
        y: (1 - clip.y) * 0.5 * height,
        width: Math.max(12, projectedHeight * (label.userData.baseWidth / label.userData.baseHeight)),
        height: Math.max(10, projectedHeight),
      });
    });
    if (!canProject) return;
    const bestByCity = new Map();
    candidates.forEach((item) => {
      const previous = bestByCity.get(item.label.userData.city);
      if (!previous || item.score > previous.score) bestByCity.set(item.label.userData.city, item);
    });
    const operationOnly = this.roleWeights.operation > 0.5
      && this.roleWeights.infrastructure < 0.18
      && this.roleWeights.digital < 0.18;
    const denseSandbox = this.sandboxMode;
    const ranked = [...bestByCity.values()]
      .filter((item) => !((operationOnly || denseSandbox) && /[县旗]$/u.test(String(item.label.userData.city))))
      .sort((left, right) => (right.priority - left.priority) || (right.score - left.score));
    const kept = [];
    this.cityLabels.forEach((label) => { label.visible = false; });
    ranked.forEach((item) => {
      const overlaps = kept.some((other) => (
        Math.abs(item.x - other.x) < (item.width + other.width) * (operationOnly ? 0.34 : 0.48)
        && Math.abs(item.y - other.y) < (item.height + other.height) * (operationOnly ? 0.4 : 0.58)
      ));
      if (overlaps) return;
      item.label.visible = true;
      kept.push(item);
    });
  }

  update(elapsed = 0, camera = null, width = 0, height = 0) {
    this.markerNodes.forEach((node, role) => {
      node.rotation.z = role === 'digital' ? Math.sin(elapsed * 0.6) * 0.04 : 0;
      node.children.forEach((child) => {
        if (child.geometry?.type === 'RingGeometry') child.rotation.z = elapsed * (role === 'infrastructure' ? 0.26 : role === 'operation' ? -0.32 : 0.42);
      });
    });
    this.updateCityLabels(camera, width, height);
    if (!this.connector.visible || this.markerNodes.size < 2) return;
    const points = ['infrastructure', 'operation', 'digital']
      .filter((role) => this.roleWeights[role] > 0.05)
      .map((role) => this.markerNodes.get(role)?.getWorldPosition(new THREE.Vector3()))
      .filter(Boolean)
      .map((point) => point.add(new THREE.Vector3(0, 0, 2.1)));
    this.connectorGeometry.setPositions(points.flatMap((point) => [point.x, point.y, point.z]));
    this.connector.computeLineDistances();
  }

  resize(width, height) {
    this.resolution.set(width, height);
    this.connectorMaterial.resolution.set(width, height);
    this.lineMaterials.forEach((material) => material.resolution.set(width, height));
  }

  clearProvince() {
    this.roots.forEach((root) => {
      root.parent?.remove(root);
      root.traverse((object) => {
        object.geometry?.dispose?.();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach((material) => {
          material.map?.dispose?.();
          material.dispose?.();
        });
      });
    });
    this.roots.clear();
    this.markerNodes.clear();
    this.cityLabels = [];
    this.cityFills = [];
    this.lineMaterials = [];
    this.currentProvince = null;
    this.sandboxMode = false;
    this.sandboxRole = 'operation';
    this.hoveredCityName = null;
    this.weakCityNames = new Set();
    this.weakHighlight = false;
    this.connector.visible = false;
  }

  dispose() {
    this.clearProvince();
    this.scene.remove(this.connector);
    this.connectorGeometry.dispose();
    this.connectorMaterial.dispose();
  }
}
