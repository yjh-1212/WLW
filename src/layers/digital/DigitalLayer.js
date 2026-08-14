import * as THREE from 'three';
import { MAP_THEME, toNumberColor } from '../../theme/mapTheme.js';
import { makeEntityNode, makeWideLine, setGroupOpacity, updateLineResolution } from '../rendering.js';

const ROLE_STYLE = {
  platform: { color: '#4ec8ff', scale: 1.28 },
  'trusted-space': { color: '#7ef0c8', scale: 1.24 },
  access: { color: '#7de9ff', scale: 0.78 },
  data: { color: '#6df0a8', scale: 0.82 },
  service: { color: '#ffca72', scale: 0.88 },
  event: { color: '#c9a6ff', scale: 1.02 },
  agent: { color: '#bc93ff', scale: 1.04 },
  operator: { color: '#ffb45c', scale: 0.94 },
};

const RELATION_STYLE = {
  access: { color: '#5fcfff', width: 1.60, opacity: 0.78, dashed: false, lift: 0.85 },
  api: { color: '#5fcfff', width: 1.45, opacity: 0.70, dashed: false, lift: 1.45 },
  authorization: { color: '#6df0a8', width: 2.05, opacity: 0.82, dashed: false, lift: 1.85 },
  event: { color: '#ba8cff', width: 1.55, opacity: 0.78, dashed: true, lift: 1.05 },
  decision: { color: '#ba8cff', width: 1.90, opacity: 0.82, dashed: false, lift: 1.65 },
  feedback: { color: '#6df0a8', width: 1.35, opacity: 0.58, dashed: true, lift: 1.25 },
  corridor: { color: '#ffb45c', width: 2.60, opacity: 0.86, dashed: true, lift: 2.35 },
};

const relationFilter = (type) => ({
  access: 'connectors',
  api: 'apiRelations',
  authorization: 'contracts',
  feedback: 'apiRelations',
  event: 'epcis',
  decision: 'ai',
  corridor: 'corridors',
})[type] ?? 'apiRelations';

const nodeFilter = (role) => ({
  access: 'connectors',
  data: 'epcis',
  event: 'epcis',
  service: 'apiRelations',
  agent: 'ai',
  operator: 'corridors',
})[role] ?? 'connectors';

// 数字网的流动用“数据包列车”表达：每条关系挂多枚等距包体，形态与节奏按关系语义区分。
const PACKET_PLAN = {
  access: { count: 2, size: 0.13, shape: 'octa', speed: 0.030 },
  api: { count: 2, size: 0.12, shape: 'box', speed: 0.026 },
  authorization: { count: 3, size: 0.15, shape: 'octa', speed: 0.022 },
  event: { count: 3, size: 0.11, shape: 'box', speed: 0.038 },
  decision: { count: 2, size: 0.19, shape: 'tetra', speed: 0.034 },
  feedback: { count: 1, size: 0.11, shape: 'tetra', speed: 0.020 },
  corridor: { count: 4, size: 0.20, shape: 'octa', speed: 0.016 },
};

const RIPPLE_ROLES = new Set(['platform', 'trusted-space', 'event']);

// ── 省级视角：地市节点 / 协同关系 / 出省通道，尺度按放大后的省域重新标定 ──
const PROVINCE_NODE_Z = 2.48;
const PROVINCE_FLOW_Z = 2.52;

const PROVINCE_ROLE_STYLE = {
  platform: { color: '#4ec8ff', core: 0.052, rings: [[0.074, 0.088], [0.106, 0.118]], halo: 0.150, filter: 'cities' },
  logistics: { color: '#7de9ff', core: 0.031, rings: [[0.045, 0.055]], halo: 0.070, filter: 'enterprises' },
  shipper: { color: '#6df0a8', core: 0.029, rings: [[0.043, 0.052]], halo: 0.062, filter: 'enterprises' },
  park: { color: '#ffca72', core: 0.031, rings: [[0.045, 0.054]], halo: 0.070, filter: 'parks' },
  public: { color: '#c9a6ff', core: 0.027, rings: [], halo: 0.050, filter: 'services' },
};

const PROVINCE_RELATION_STYLE = {
  share: { color: '#5fcfff', width: 1.40, opacity: 0.74, dashed: false, sway: 0.052, packets: 2, speed: 0.052, size: 0.020 },
  call: { color: '#6df0a8', width: 1.22, opacity: 0.66, dashed: false, sway: -0.046, packets: 2, speed: 0.064, size: 0.018 },
  collaboration: { color: '#ba8cff', width: 1.05, opacity: 0.52, dashed: true, sway: 0.088, packets: 1, speed: 0.040, size: 0.016 },
};

const PROVINCE_CORRIDOR_STYLE = {
  color: '#ffb45c', width: 1.95, opacity: 0.82, dashed: true, packets: 2, speed: 0.034, size: 0.024,
};

const provinceCityLabel = (text, tier = 3) => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(384, Math.max(96, text.length * 30 + 32));
  canvas.height = 48;
  const context = canvas.getContext('2d');
  const size = tier === 1 ? 27 : tier === 2 ? 23 : 20;
  context.font = `${tier === 1 ? 700 : 600} ${size}px "Microsoft YaHei", sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.strokeStyle = 'rgba(3, 18, 14, 0.94)';
  context.lineWidth = 5;
  context.strokeText(text, canvas.width / 2, 24);
  context.fillStyle = tier === 1 ? '#eafff6' : '#bfe4d6';
  context.fillText(text, canvas.width / 2, 24);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const height = tier === 1 ? 0.115 : tier === 2 ? 0.092 : 0.078;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, transparent: true, depthTest: false, depthWrite: false, opacity: 0.94, toneMapped: false,
  }));
  sprite.scale.set(height * (canvas.width / canvas.height), height, 1);
  sprite.renderOrder = 30;
  sprite.userData = { kind: 'province-city-label', labelTexture: texture };
  return sprite;
};

const disposeSubtree = (root) => {
  root.traverse((object) => {
    if (object.userData?.labelTexture) object.userData.labelTexture.dispose();
    if (object.geometry && !object.userData?.sharedGeometry) object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material?.dispose?.());
  });
};

const packetGeometries = new Map();
const getPacketGeometry = (shape, size) => {
  const key = `${shape}:${size}`;
  if (!packetGeometries.has(key)) {
    const geometry = shape === 'box'
      ? new THREE.BoxGeometry(size * 1.6, size * 1.6, size * 1.6)
      : shape === 'tetra'
        ? new THREE.TetrahedronGeometry(size * 1.35, 0)
        : new THREE.OctahedronGeometry(size, 0);
    packetGeometries.set(key, geometry);
  }
  return packetGeometries.get(key);
};

export class DigitalLayer extends THREE.Group {
  constructor({ mapFactory, projector, entities, digitalNodes, digitalRelations = [], registry }) {
    super();
    this.name = 'DigitalLayerRoot';
    this.projector = projector;
    this.entities = digitalNodes ?? entities;
    this.entityById = new Map(this.entities.map((entity) => [entity.id, entity]));
    this.relations = [];
    this.filters = { connectors: true, apiRelations: true, epcis: true, contracts: true, corridors: true, ai: true };
    this.lodLevel = 0;
    this.focusProvince = null;
    this.explodedPresentation = false;
    this.storyNationalSuppressed = false;
    this.homeOverview = false;

    this.sheet = mapFactory.createSheet({ name: 'DigitalMapSheet', role: 'digital', color: MAP_THEME.digitalSurface, opacity: 0.74 });
    this.sheet.scale.z = 0.44;
    this.sheet.position.z = 0.79;
    this.add(this.sheet);

    this.relationRoot = new THREE.Group();
    this.relationRoot.name = 'DigitalRelationRoot';
    this.add(this.relationRoot);
    digitalRelations.forEach((relation, index) => this.addRelation(relation, index));

    this.nodeRoot = new THREE.Group();
    this.nodeRoot.name = 'DigitalNodeRoot';
    this.add(this.nodeRoot);
    this.nodeObjects = new Map();
    this.entities.forEach((entity, index) => {
      const style = ROLE_STYLE[entity.networkRole] ?? ROLE_STYLE.service;
      const node = makeEntityNode(entity, projector, {
        color: toNumberColor(style.color), z: 2.22, scale: style.scale, layer: 'digital',
      });
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.70 * style.scale, 0.80 * style.scale, 32),
        new THREE.MeshBasicMaterial({ color: toNumberColor(style.color), transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
      );
      halo.position.z = 0.09;
      halo.userData.phase = index * 0.63;
      node.add(halo);
      if (entity.networkRole === 'platform' || entity.networkRole === 'trusted-space') {
        const outer = new THREE.Mesh(
          new THREE.RingGeometry(0.92 * style.scale, 1.06 * style.scale, 40),
          new THREE.MeshBasicMaterial({ color: toNumberColor(style.color), transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
        );
        outer.position.z = 0.08;
        node.add(outer);
      }
      if (RIPPLE_ROLES.has(entity.networkRole)) {
        node.userData.ripples = [0, 1, 2].map((slot) => {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.88 * style.scale, 0.95 * style.scale, 44),
            new THREE.MeshBasicMaterial({
              color: toNumberColor(style.color), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
            }),
          );
          ring.position.z = 0.07;
          ring.renderOrder = 12;
          ring.userData.offset = (slot / 3 + index * 0.11) % 1;
          node.add(ring);
          return ring;
        });
      }
      if ((entity.lod ?? 1) === 0 && (entity.networkRole === 'platform' || entity.networkRole === 'trusted-space')) {
        const sweep = new THREE.Mesh(
          new THREE.RingGeometry(1.08 * style.scale, 1.22 * style.scale, 48, 1, 0, Math.PI * 0.45),
          new THREE.MeshBasicMaterial({
            color: toNumberColor(style.color), transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false,
          }),
        );
        sweep.position.z = 0.06;
        sweep.renderOrder = 11;
        sweep.userData.spin = index % 2 === 0 ? 0.62 : -0.48;
        node.add(sweep);
        node.userData.sweep = sweep;
      }
      node.userData.halo = halo;
      node.userData.lod = entity.lod ?? 1;
      node.userData.province = entity.province;
      node.userData.networkRole = entity.networkRole;
      this.nodeRoot.add(node);
      this.nodeObjects.set(entity.id, node);
      registry.registerLayerObject(entity.id, 'digital', node);
    });
    this.refreshVisibility();
  }

  addRelation(relation, index) {
    const from = this.entityById.get(relation.from);
    const to = this.entityById.get(relation.to);
    if (!from || !to) return;
    const style = RELATION_STYLE[relation.type] ?? RELATION_STYLE.api;
    const start = this.projector.fromEntity(from, 2.30);
    const end = this.projector.fromEntity(to, 2.30);
    const distance = start.distanceTo(end);
    const middle = start.clone().lerp(end, 0.5).setZ(2.7 + Math.min(3.0, style.lift + distance * 0.018));
    const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
    const line = makeWideLine(curve.getPoints(Math.max(26, Math.round(distance * 2))), {
      color: toNumberColor(style.color),
      width: style.width,
      opacity: style.opacity,
      dashed: style.dashed,
      dashSize: relation.type === 'corridor' ? 1.15 : relation.type === 'authorization' ? 0.36 : 0.52,
      gapSize: relation.type === 'corridor' ? 0.42 : relation.type === 'authorization' ? 0.28 : 0.46,
    });
    line.userData.phase = index * 0.21;
    this.relationRoot.add(line);

    const plan = PACKET_PLAN[relation.type] ?? PACKET_PLAN.api;
    const packets = [];
    for (let slot = 0; slot < plan.count; slot += 1) {
      const packet = new THREE.Mesh(
        getPacketGeometry(plan.shape, plan.size),
        new THREE.MeshBasicMaterial({ color: toNumberColor(style.color), transparent: true, opacity: 0.92, depthWrite: false }),
      );
      packet.userData.offset = ((index * 0.13) + slot / plan.count) % 1;
      packet.userData.spin = 1.4 + (slot % 3) * 0.5;
      packet.renderOrder = 14;
      this.relationRoot.add(packet);
      packets.push(packet);
    }
    this.relations.push({ relation, from, to, curve, line, packets, speed: plan.speed + (index % 5) * 0.002 });
  }

  /**
   * 省级下钻用完全独立的一套要素：地市节点、地市名称、省内协同关系与出省通道箭头。
   * 与全国网的节点/关系互不复用，全国要素在下钻期间整体隐藏。
   */
  setProvinceNetwork(network = null) {
    this.clearProvinceNetwork();
    const nodes = network?.nodes ?? [];
    if (!nodes.length) return;
    const relations = network.relations ?? [];
    const corridors = network.corridors ?? [];

    this.provinceRoot = new THREE.Group();
    this.provinceRoot.name = 'DigitalProvinceRoot';
    this.add(this.provinceRoot);
    this.provinceNodes = new Map();
    this.provinceRelations = [];
    this.provinceCorridors = [];

    const xs = [];
    const ys = [];
    nodes.forEach((city, index) => {
      const style = PROVINCE_ROLE_STYLE[city.networkRole] ?? PROVINCE_ROLE_STYLE.logistics;
      const point = this.projector.fromLngLat(city.center ?? [city.longitude, city.latitude], PROVINCE_NODE_Z);
      xs.push(point.x);
      ys.push(point.y);
      const node = new THREE.Group();
      node.position.copy(point);
      node.userData = {
        kind: 'entity',
        entityId: city.id,
        layer: 'digital',
        networkRole: city.networkRole,
        filter: style.filter,
        phase: index * 0.41,
      };
      const color = toNumberColor(style.color);
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(style.core, 14, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.96 }),
      );
      core.userData = node.userData;
      node.add(core);
      style.rings.forEach((radius, ringIndex) => {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(radius[0], radius[1], 30),
          new THREE.MeshBasicMaterial({
            color, transparent: true, opacity: ringIndex ? 0.26 : 0.44, side: THREE.DoubleSide, depthWrite: false,
          }),
        );
        ring.position.z = 0.010 + ringIndex * 0.005;
        node.add(ring);
      });
      if (style.halo > 0) {
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(style.core * 2.3, style.core * 2.9, 32),
          new THREE.MeshBasicMaterial({
            color, transparent: true, opacity: style.halo, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
          }),
        );
        halo.position.z = 0.006;
        node.userData.halo = halo;
        node.add(halo);
      }
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.075, style.core * 2.2), 10, 8),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hit.userData = node.userData;
      node.add(hit);
      const label = provinceCityLabel(city.city ?? city.name, city.tier ?? 3);
      if (label) {
        label.position.set(0, style.core * 2.4 + 0.055, 0.05);
        node.userData.label = label;
        node.add(label);
      }
      this.provinceRoot.add(node);
      this.provinceNodes.set(city.id, node);
    });

    const spanX = Math.max(0.4, Math.max(...xs) - Math.min(...xs));
    const spanY = Math.max(0.4, Math.max(...ys) - Math.min(...ys));
    const reach = Math.hypot(spanX, spanY) * 0.22;

    relations.forEach((relation, index) => {
      const from = this.provinceNodes.get(relation.from);
      const to = this.provinceNodes.get(relation.to);
      if (!from || !to) return;
      const style = PROVINCE_RELATION_STYLE[relation.type] ?? PROVINCE_RELATION_STYLE.share;
      const curve = this.makeProvinceCurve(from.position, to.position, style.sway);
      const item = this.addProvinceFlow(curve, style, index, 'links');
      item.relation = relation;
      this.provinceRelations.push(item);
    });

    corridors.forEach((corridor, index) => {
      const gateway = this.provinceNodes.get(corridor.from);
      if (!gateway || !Array.isArray(corridor.target)) return;
      const outward = this.projector.fromLngLat(corridor.target, PROVINCE_NODE_Z)
        .sub(gateway.position).setZ(0).normalize().multiplyScalar(reach);
      const tip = gateway.position.clone().add(outward).setZ(PROVINCE_FLOW_Z);
      const curve = this.makeProvinceCurve(gateway.position, tip, 0);
      const item = this.addProvinceFlow(curve, PROVINCE_CORRIDOR_STYLE, index, 'crossProvince');
      item.corridor = corridor;
      item.tip = tip;
      const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.034, 0.086, 12),
        new THREE.MeshBasicMaterial({ color: toNumberColor(PROVINCE_CORRIDOR_STYLE.color), transparent: true, opacity: 0.88 }),
      );
      head.position.copy(tip);
      head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward.clone().normalize());
      head.renderOrder = 16;
      this.provinceRoot.add(head);
      item.head = head;
      this.provinceCorridors.push(item);
    });

    this.refreshVisibility();
  }

  makeProvinceCurve(start, end, sway = 0) {
    const middle = start.clone().lerp(end, 0.5);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    middle.x += (-dy / length) * sway;
    middle.y += (dx / length) * sway;
    middle.z = PROVINCE_FLOW_Z + 0.03;
    return new THREE.QuadraticBezierCurve3(start.clone().setZ(PROVINCE_FLOW_Z), middle, end.clone().setZ(PROVINCE_FLOW_Z));
  }

  addProvinceFlow(curve, style, index, filter) {
    const line = makeWideLine(curve.getPoints(34), {
      color: toNumberColor(style.color),
      width: style.width,
      opacity: style.opacity,
      dashed: style.dashed,
      dashSize: filter === 'crossProvince' ? 0.09 : 0.05,
      gapSize: filter === 'crossProvince' ? 0.042 : 0.038,
    });
    line.userData.phase = index * 0.27;
    this.provinceRoot.add(line);
    const packets = [];
    for (let slot = 0; slot < style.packets; slot += 1) {
      const packet = new THREE.Mesh(
        getPacketGeometry('octa', style.size),
        new THREE.MeshBasicMaterial({ color: toNumberColor(style.color), transparent: true, opacity: 0.9, depthWrite: false }),
      );
      packet.userData.sharedGeometry = true;
      packet.userData.offset = ((index * 0.17) + slot / style.packets) % 1;
      packet.renderOrder = 18;
      this.provinceRoot.add(packet);
      packets.push(packet);
    }
    return { curve, line, packets, speed: style.speed, filter };
  }

  clearProvinceNetwork() {
    if (!this.provinceRoot) return;
    this.remove(this.provinceRoot);
    disposeSubtree(this.provinceRoot);
    this.provinceRoot = null;
    this.provinceNodes = new Map();
    this.provinceRelations = [];
    this.provinceCorridors = [];
  }

  hasProvinceNetwork() { return Boolean(this.provinceRoot); }

  getProvinceEntityWorldPosition(id) {
    const node = this.provinceNodes?.get(id);
    return node ? node.getWorldPosition(new THREE.Vector3()) : null;
  }

  getProvinceCorridorWorldPosition(id) {
    const item = this.provinceCorridors?.find((entry) => entry.corridor?.id === id);
    return item?.tip ? item.tip.clone() : null;
  }

  refreshProvinceVisibility() {
    if (!this.provinceRoot) return;
    const showLabels = this.filters.cities !== false;
    this.provinceNodes.forEach((node) => {
      const visible = this.filters[node.userData.filter] !== false;
      node.visible = visible;
      if (node.userData.label) node.userData.label.visible = visible && showLabels;
    });
    const setFlow = (item) => {
      const visible = this.filters[item.filter] !== false;
      item.line.visible = visible;
      item.packets.forEach((packet) => { packet.visible = visible; });
      if (item.head) item.head.visible = visible;
    };
    this.provinceRelations.forEach(setFlow);
    this.provinceCorridors.forEach(setFlow);
  }

  updateProvinceNetwork(elapsed, weight) {
    if (!this.provinceRoot) return;
    const animateFlow = (item) => {
      if (item.line.visible && item.line.material.dashed) {
        item.line.material.dashOffset = -((elapsed * 0.12 + item.line.userData.phase) % 1);
      }
      item.packets.forEach((packet) => {
        if (!packet.visible) return;
        const t = (elapsed * item.speed + packet.userData.offset) % 1;
        packet.position.copy(item.curve.getPointAt(t));
        packet.material.opacity = 0.92 * Math.min(1, Math.sin(Math.PI * t) * 2.6) * weight;
      });
    };
    this.provinceRelations.forEach(animateFlow);
    this.provinceCorridors.forEach(animateFlow);
    this.provinceNodes.forEach((node) => {
      if (!node.visible) return;
      const halo = node.userData.halo;
      if (!halo) return;
      const pulse = 1 + Math.sin(elapsed * 1.9 + node.userData.phase) * 0.20;
      halo.scale.setScalar(pulse);
      halo.material.opacity = (0.16 + Math.sin(elapsed * 1.9 + node.userData.phase) * 0.07) * weight;
    });
  }

  /**
   * 首页只画主干骨架，比当前 LOD 再稀一档；放大后仍能逐步看到更多要素。
   */
  viewLodLevel() {
    return this.homeOverview && !this.focusProvince ? Math.max(0, this.lodLevel - 1) : this.lodLevel;
  }

  isNodeInView(entity) {
    if ((entity.lod ?? 1) > this.viewLodLevel()) return false;
    if (this.focusProvince && entity.province !== this.focusProvince) return false;
    if (entity.networkRole === 'platform' || entity.networkRole === 'trusted-space') {
      return this.filters.connectors || this.filters.apiRelations || this.filters.contracts;
    }
    return this.filters[nodeFilter(entity.networkRole)];
  }

  isRelationInView(item) {
    if ((item.relation.lod ?? 1) > this.viewLodLevel()) return false;
    if (!this.filters[relationFilter(item.relation.type)]) return false;
    if (!this.focusProvince) return true;
    return item.from.province === this.focusProvince && item.to.province === this.focusProvince;
  }

  refreshVisibility() {
    const suppressNational = this.storyNationalSuppressed && !this.focusProvince;
    if (this.relationRoot) this.relationRoot.visible = !suppressNational;
    if (this.nodeRoot) this.nodeRoot.visible = !suppressNational;
    this.entities.forEach((entity) => {
      const node = this.nodeObjects.get(entity.id);
      if (node) node.visible = !suppressNational && this.isNodeInView(entity);
    });
    this.relations.forEach((item) => {
      const visible = !suppressNational && this.isRelationInView(item);
      item.line.visible = visible;
      item.packets.forEach((packet) => { packet.visible = visible; });
    });
    this.refreshProvinceVisibility();
  }

  getEntityWorldPosition(entityId) {
    const node = this.nodeObjects.get(entityId);
    if (!node) return null;
    return node.getWorldPosition(new THREE.Vector3());
  }

  setLod(level = 0, focusProvince = null) {
    this.lodLevel = level;
    this.focusProvince = focusProvince;
    this.refreshVisibility();
  }

  setExplodedPresentation(enabled = false) {
    this.explodedPresentation = Boolean(enabled);
    if (this.sheet) this.sheet.scale.z = enabled ? 0.32 : 0.44;
    this.refreshVisibility();
  }

  setStoryNationalSuppressed(enabled = false) {
    this.storyNationalSuppressed = Boolean(enabled);
    this.refreshVisibility();
  }

  setHomeOverview(enabled = false) {
    this.homeOverview = Boolean(enabled);
    this.refreshVisibility();
  }

  setFilter(id, enabled) {
    this.filters[id] = enabled;
    this.refreshVisibility();
  }

  update(elapsed) {
    this.relations.forEach((item) => {
      if (item.line.visible && item.line.material.dashed) item.line.material.dashOffset = -((elapsed * 0.38 + item.line.userData.phase) % 2);
      item.packets.forEach((packet) => {
        if (!packet.visible) return;
        const t = (elapsed * item.speed + packet.userData.offset) % 1;
        packet.position.copy(item.curve.getPointAt(t));
        packet.rotation.x = elapsed * packet.userData.spin;
        packet.rotation.z = elapsed * packet.userData.spin * 0.7;
        // 首尾淡入淡出，使数据包看起来是从节点里发出、被节点吸收
        const fade = Math.min(1, Math.sin(Math.PI * t) * 2.4);
        packet.material.opacity = 0.94 * fade * (this.visualWeight ?? 1);
      });
    });
    const weight = this.visualWeight ?? 1;
    this.nodeObjects.forEach((node) => {
      if (!node.visible) return;
      const halo = node.userData.halo;
      const pulse = this.fadeVisuals ? 1 : 1 + Math.sin(elapsed * 1.8 + halo.userData.phase) * 0.16;
      halo.scale.setScalar(pulse);
      halo.material.opacity = (this.fadeVisuals ? 0.20 : 0.22 + Math.sin(elapsed * 1.8 + halo.userData.phase) * 0.07) * weight;
      const ripples = node.userData.ripples;
      if (ripples) {
        ripples.forEach((ring) => {
          const t = (elapsed * 0.30 + ring.userData.offset) % 1;
          ring.scale.setScalar(1 + t * 1.62);
          ring.material.opacity = (this.fadeVisuals ? 0 : (1 - t) * (1 - t) * 0.22) * weight;
        });
      }
      const sweep = node.userData.sweep;
      if (sweep) {
        sweep.rotation.z = elapsed * sweep.userData.spin;
        sweep.material.opacity = (this.fadeVisuals ? 0.10 : 0.24 + Math.sin(elapsed * 2.1) * 0.10) * weight;
      }
    });
    this.updateProvinceNetwork(elapsed, weight);
  }

  setVisualWeight(weight, options = {}) {
    this.visualWeight = weight;
    this.fadeVisuals = Boolean(options.fade);
    this.visible = options.preserveSheet ? true : weight > 0.005;
    setGroupOpacity(this, weight, options);
  }

  resize(width, height) { updateLineResolution(this, width, height); }
}
