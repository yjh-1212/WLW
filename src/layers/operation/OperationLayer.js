import * as THREE from 'three';
import { MAP_THEME, toNumberColor } from '../../theme/mapTheme.js';
import { makeEntityNode, makeWideLine, setGroupOpacity, updateLineResolution } from '../rendering.js';
import { coastalSegment, isCoastalEntity } from '../../data/chinaCoastalRoute.js';

const makeLngLatCurve = (points) => {
  const curve = new THREE.CurvePath();
  for (let index = 0; index < points.length - 1; index += 1) {
    curve.add(new THREE.LineCurve3(points[index], points[index + 1]));
  }
  return curve;
};

const ROLE_STYLE = {
  coordinator: { color: '#73dfff', scale: 1.16 },
  shipper: { color: '#eaf8a3', scale: 0.88 },
  carrier: { color: '#6da8ff', scale: 0.90 },
  operator: { color: '#a4e8ff', scale: 0.98 },
};

const RELATION_STYLE = {
  collaboration: { color: '#5c9dff', width: 0.72, opacity: 0.40, dashed: true, lift: 1.9 },
  order: { color: '#effb9c', width: 0.92, opacity: 0.78, dashed: true, lift: 1.25 },
  capacity: { color: '#6fcfff', width: 0.98, opacity: 0.74, dashed: false, lift: 1.35 },
  handoff: { color: MAP_THEME.operation, width: 1.12, opacity: 0.88, dashed: false, lift: 2.05 },
  feedback: { color: '#9d8cff', width: 0.82, opacity: 0.62, dashed: true, lift: 1.45 },
  exception: { color: MAP_THEME.danger, width: 1.08, opacity: 0.82, dashed: true, lift: 1.1 },
};

const MODE_STYLE = {
  road: { color: '#45d3ff', label: '公路', dashed: true },
  rail: { color: '#8b6cff', label: '铁路', dashed: false },
  water: { color: '#2ee6d6', label: '水运', dashed: false },
  air: { color: '#ff9a4a', label: '航空', dashed: true },
  multimodal: { color: '#b48cff', label: '多式联运', dashed: false },
  coordination: { color: '#4e83bd', label: '协同', dashed: true },
};

const SANDBOX_MODE = {
  road: { color: '#3d8fb0', dashed: true, lift: 0.07, speed: 0.040, shape: 'dot' },
  rail: { color: '#9db8c6', dashed: false, lift: 0.05, speed: 0.058, shape: 'bar' },
  water: { color: '#2d9a8a', dashed: false, lift: 0.04, speed: 0.026, shape: 'soft' },
  air: { color: '#c48a4a', dashed: true, lift: 0.48, speed: 0.046, shape: 'arc' },
  multimodal: { color: '#6a7eb8', dashed: false, lift: 0.09, speed: 0.038, shape: 'pulse' },
};

const SANDBOX_GRADE = {
  trunk: { width: 2.15, opacity: 0.50, glow: 0.10, particles: 2 },
  regional: { width: 1.28, opacity: 0.38, glow: 0.04, particles: 2 },
  feeder: { width: 0.92, opacity: 0.32, glow: 0, particles: 1 },
};

const SANDBOX_NODE = {
  1: { core: 0.050, rings: [[0.066, 0.082], [0.098, 0.114]], halo: 0.14, breath: 0.028 },
  2: { core: 0.034, rings: [[0.046, 0.060]], halo: 0.07, breath: 0.01 },
  3: { core: 0.020, rings: [], halo: 0, breath: 0 },
};

const SANDBOX_NODE_Z = 2.46;
const SANDBOX_FLOW_Z = 2.50;

const makeSandboxCurve = (start, end, lift, sway) => {
  const middle = start.clone().lerp(end, 0.5);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  middle.x += (-dy / length) * sway;
  middle.y += (dx / length) * sway;
  middle.z = SANDBOX_FLOW_Z + lift;
  return new THREE.QuadraticBezierCurve3(start, middle, end);
};

const makeSandboxCityLabel = (text, tier = 3) => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(384, Math.max(96, text.length * 28 + 28));
  canvas.height = 48;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = `${tier === 1 ? 700 : 600} ${tier === 1 ? 26 : tier === 2 ? 22 : 18}px "Microsoft YaHei", sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.strokeStyle = 'rgba(4, 12, 22, 0.92)';
  context.lineWidth = 5;
  context.strokeText(text, canvas.width / 2, 24);
  context.fillStyle = tier === 1 ? '#e6f4fa' : '#c5d6e0';
  context.fillText(text, canvas.width / 2, 24);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const height = tier === 1 ? 0.52 : tier === 2 ? 0.42 : 0.34;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, transparent: true, depthTest: false, depthWrite: false, opacity: 0.92, toneMapped: false,
  }));
  sprite.scale.set(height * (canvas.width / canvas.height), height, 1);
  sprite.renderOrder = 24;
  sprite.userData = { kind: 'sandbox-label', labelTexture: texture, tier, baseWidth: sprite.scale.x, baseHeight: height };
  return sprite;
};

const makeSandboxTaskLabel = (text) => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 44;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 20px "Microsoft YaHei", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.strokeStyle = 'rgba(4, 12, 22, 0.9)';
  context.lineWidth = 4;
  context.strokeText(text, 160, 22);
  context.fillStyle = '#d7eef6';
  context.fillText(text, 160, 22);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, transparent: true, depthTest: false, depthWrite: false, opacity: 0.9, toneMapped: false,
  }));
  sprite.scale.set(1.55, 0.22, 1);
  sprite.renderOrder = 26;
  sprite.userData = { kind: 'sandbox-task-label', labelTexture: texture };
  return sprite;
};

const FLOW_POINT = new THREE.Vector3();
let flowGlowTexture;

const getFlowGlowTexture = () => {
  if (flowGlowTexture !== undefined) return flowGlowTexture;
  if (typeof document === 'undefined') {
    flowGlowTexture = null;
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,.88)');
  gradient.addColorStop(0.42, 'rgba(180,230,255,.38)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  flowGlowTexture = new THREE.CanvasTexture(canvas);
  flowGlowTexture.colorSpace = THREE.SRGBColorSpace;
  return flowGlowTexture;
};

const makeFlowMaterial = (color, opacity, extra = {}) => new THREE.MeshBasicMaterial({
  color: toNumberColor(color),
  transparent: true,
  opacity,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  ...extra,
});

const DASHBOARD_LABEL_IDS = new Set([
  'OP_NORTHEAST_CENTER', 'OP_ZHENGZHOU_CENTER', 'OP_URUMQI_CENTER', 'OP_CHENGDU_CENTER',
  'OP_CHONGQING_BASE', 'OP_WUHAN_CENTER', 'OP_SHANGHAI_PORT', 'OP_GBA_CENTER',
]);

const VIEW_MATCHERS = {
  overview: (relation) => relation.type !== 'collaboration'
    && relation.type !== 'exception'
    && Number(relation.activity ?? 0) >= 68,
  cargo: (relation) => relation.type === 'handoff',
  tasks: (relation) => Boolean(relation.taskId) || ['order', 'feedback'].includes(relation.type),
  multimodal: (relation) => relation.type === 'handoff' && ['road', 'rail', 'water', 'air'].includes(relation.mode),
  capacity: (relation) => relation.type === 'capacity',
  alerts: (relation) => relation.type === 'exception',
};

const relationFilter = (type) => ({
  handoff: 'cargoFlow',
  capacity: 'capacity',
  order: 'tasks',
  collaboration: 'tasks',
  feedback: 'tasks',
  exception: 'alerts',
})[type] ?? 'cargoFlow';

const operationLabelName = (name) => String(name)
  .replace('粤港澳大湾区运营中心', '广州')
  .replace('长江中游运营中心', '武汉')
  .replace('中原区域运营中心', '郑州')
  .replace('东北区域运营中心', '沈阳')
  .replace('西南区域运营中心', '成都')
  .replace('西北区域运营中心', '乌鲁木齐')
  .replace('重庆整车集散基地', '重庆')
  .replace('上海港运营节点', '上海');

const makeOperationLabel = (entity, color) => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 380;
  canvas.height = 148;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(3, 16, 30, .90)';
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(3, 3, 374, 142, 14);
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.fillRect(3, 22, 5, 84);
  context.fillStyle = '#e9f9ff';
  context.font = '700 28px "Microsoft YaHei", sans-serif';
  context.fillText(operationLabelName(entity.name), 22, 48, 330);
  context.fillStyle = '#83b5c7';
  context.font = '18px "Microsoft YaHei", sans-serif';
  context.fillText(`货运量 ${entity.operation.throughput}`, 22, 86, 330);
  context.fillText(`在途任务 ${Number(entity.operation.tasks).toLocaleString('zh-CN')}单`, 22, 116, 330);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, opacity: 0.96 }));
  sprite.scale.set(6.2, 2.42, 1);
  sprite.renderOrder = 22;
  sprite.userData.kind = 'operation-label';
  sprite.userData.entityId = entity.id;
  return sprite;
};

export class OperationLayer extends THREE.Group {
  constructor({ mapFactory, projector, entities, operationNodes, operationRelations = [], registry }) {
    super();
    this.name = 'OperationLayerRoot';
    this.projector = projector;
    this.entities = operationNodes ?? entities;
    this.entityById = new Map(this.entities.map((entity) => [entity.id, entity]));
    this.relations = [];
    this.filters = { cargoFlow: true, capacity: true, tasks: true, alerts: true };
    this.lodLevel = 0;
    this.focusProvince = null;
    this.viewMode = 'overview';
    this.dashboardActive = false;
    this.explodedPresentation = false;
    this.storyNationalSuppressed = false;
    this.homeOverview = false;
    this.taskRelationIds = new Set();
    this.taskNodeIds = new Set();
    this.alertNodeIds = new Set(operationRelations
      .filter((relation) => relation.type === 'exception')
      .flatMap((relation) => [relation.from, relation.to]));

    this.sheet = mapFactory.createSheet({ name: 'OperationMapSheet', role: 'operation', color: MAP_THEME.operationSurface, opacity: 0.78 });
    this.sheet.scale.z = 0.44;
    this.sheet.position.z = 0.79;
    this.baseSheetScaleZ = 0.44;
    this.add(this.sheet);

    this.flowRoot = new THREE.Group();
    this.flowRoot.name = 'OperationRelationRoot';
    this.add(this.flowRoot);
    operationRelations.forEach((relation, index) => this.addRelation(relation, index));

    this.nodeRoot = new THREE.Group();
    this.nodeRoot.name = 'OperationEntityRoot';
    this.add(this.nodeRoot);
    this.nodeObjects = new Map();
    this.heatRings = new Map();
    this.labelRoot = new THREE.Group();
    this.labelRoot.name = 'OperationBusinessLabels';
    this.add(this.labelRoot);
    this.labelObjects = new Map();
    this.cityRoot = new THREE.Group();
    this.cityRoot.name = 'OperationCityNetwork';
    this.add(this.cityRoot);
    this.cityNodes = new Map();
    this.cityFlows = [];
    this.cityLabels = [];
    this.sandboxHover = { cityId: null, flowId: null };
    this.sandboxIntroOrigin = null;
    this.sandboxScan = null;
    this.sandboxGrid = null;
    this.sandboxBounds = null;
    this.entities.forEach((entity, index) => {
      const style = ROLE_STYLE[entity.networkRole] ?? ROLE_STYLE.operator;
      const activityScale = 0.88 + Math.min(1, Number(entity.operation.activity ?? 70) / 100) * 0.28;
      const node = makeEntityNode(entity, projector, {
        color: toNumberColor(style.color), z: 2.32, scale: style.scale, layer: 'operation',
      });
      node.userData.lod = entity.lod ?? 1;
      node.userData.province = entity.province;
      node.userData.networkRole = entity.networkRole;
      node.userData.phase = index * 0.46;
      node.userData.dashboardScale = activityScale;
      const heatColor = this.alertNodeIds.has(entity.id)
        ? MAP_THEME.danger
        : Number(entity.operation.load ?? 0) >= 86 ? '#ffc65c' : '#43e6ba';
      const heatRing = new THREE.Mesh(
        new THREE.RingGeometry(0.78, 1.02, 40),
        new THREE.MeshBasicMaterial({
          color: toNumberColor(heatColor), transparent: true, opacity: 0.28,
          side: THREE.DoubleSide, depthWrite: false,
        }),
      );
      heatRing.position.z = 0.08;
      heatRing.visible = false;
      heatRing.userData.phase = index * 0.38;
      node.add(heatRing);
      this.nodeRoot.add(node);
      this.nodeObjects.set(entity.id, node);
      this.heatRings.set(entity.id, heatRing);
      registry.registerLayerObject(entity.id, 'operation', node);
    });

    const exception = operationRelations.find((relation) => relation.type === 'exception');
    const exceptionEntity = exception && this.entityById.get(exception.from);
    if (exceptionEntity) {
      this.alert = new THREE.Mesh(
        new THREE.RingGeometry(0.72, 0.94, 32),
        new THREE.MeshBasicMaterial({ color: toNumberColor(MAP_THEME.danger), transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false }),
      );
      this.alert.position.copy(projector.fromEntity(exceptionEntity, 2.22));
      this.alert.userData.province = exceptionEntity.province;
      this.add(this.alert);
    }
    this.refreshVisibility();
  }

  addRelation(relation, index) {
    const from = this.entityById.get(relation.from);
    const to = this.entityById.get(relation.to);
    if (!from || !to) return;
    const semanticStyle = RELATION_STYLE[relation.type] ?? RELATION_STYLE.handoff;
    const modeKey = relation.multimodal ? 'multimodal' : relation.mode;
    const modeStyle = MODE_STYLE[modeKey] ?? MODE_STYLE.coordination;
    const style = {
      ...semanticStyle,
      color: relation.type === 'exception' ? semanticStyle.color : modeStyle.color,
      dashed: relation.type === 'exception' ? true : Boolean(modeStyle.dashed || semanticStyle.dashed),
      width: semanticStyle.width + Math.min(0.38, Number(relation.volume ?? 30) / 180) + (relation.taskId ? 0.1 : 0),
      opacity: Math.min(0.98, 0.34 + Number(relation.activity ?? 70) / 150),
    };
    const start = this.projector.fromEntity(from, 2.36);
    const end = this.projector.fromEntity(to, 2.36);
    const water = relation.mode === 'water' || relation.mode === 'sea';
    const seaPath = Array.isArray(relation.path) && relation.path.length >= 2
      ? relation.path
      : (water && isCoastalEntity(from) && isCoastalEntity(to)
        ? coastalSegment([Number(from.longitude), Number(from.latitude)], [Number(to.longitude), Number(to.latitude)])
        : null);
    let curve;
    let points;
    let distance;
    if (seaPath?.length >= 2) {
      const polyline = seaPath.map((coordinate) => this.projector.fromLngLat(coordinate, start.z));
      curve = makeLngLatCurve(polyline);
      distance = curve.getLength();
      points = curve.getPoints(Math.max(64, Math.round(distance * 4)));
    } else {
      distance = start.distanceTo(end);
      const middle = start.clone().lerp(end, 0.5).setZ(2.5 + Math.min(3.4, style.lift + distance * 0.025));
      curve = new THREE.QuadraticBezierCurve3(start, middle, end);
      points = curve.getPoints(Math.max(36, Math.round(distance * 2.6)));
    }
    const glow = makeWideLine(points, {
      color: toNumberColor(style.color),
      width: style.width * 1.7,
      opacity: Math.min(0.22, style.opacity * 0.28),
      dashed: false,
    });
    glow.material.blending = THREE.AdditiveBlending;
    glow.material.transparent = true;
    glow.material.depthWrite = false;
    glow.material.userData.baseOpacity = glow.material.opacity;
    glow.renderOrder = 8;
    this.flowRoot.add(glow);

    const line = makeWideLine(points, {
      color: toNumberColor(style.color),
      width: style.width,
      opacity: style.opacity,
      dashed: style.dashed,
      dashSize: relation.type === 'collaboration' ? 0.42 : 0.58,
      gapSize: relation.type === 'collaboration' ? 0.55 : 0.38,
    });
    line.userData.phase = index * 0.17;
    line.userData.baseOpacity = style.opacity;
    line.userData.baseWidth = style.width;
    line.userData.mode = relation.mode;
    line.material.userData.baseOpacity = style.opacity;
    line.renderOrder = 9;
    this.flowRoot.add(line);

    const ribbon = makeWideLine(points, {
      color: toNumberColor(style.color),
      width: Math.max(0.48, style.width * 0.36),
      opacity: relation.type === 'collaboration' ? 0.14 : 0.42,
      dashed: true,
      dashSize: 0.36,
      gapSize: 1.08,
    });
    ribbon.material.blending = THREE.AdditiveBlending;
    ribbon.material.transparent = true;
    ribbon.material.depthWrite = false;
    ribbon.material.userData.baseOpacity = ribbon.material.opacity;
    ribbon.renderOrder = 10;
    this.flowRoot.add(ribbon);

    const particles = [];
    let stream = null;
    const animateFlow = relation.type !== 'collaboration';
    const glowMap = getFlowGlowTexture();
    if (animateFlow) {
      const streamCount = Math.max(10, Math.min(24, Math.round(distance * 0.62) + Math.round(Number(relation.volume ?? 30) / 14)));
      const streamGeometry = new THREE.BufferGeometry();
      streamGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(streamCount * 3), 3));
      stream = new THREE.Points(streamGeometry, new THREE.PointsMaterial({
        map: glowMap || undefined,
        color: toNumberColor(style.color),
        size: relation.type === 'handoff' ? 1.35 : 1.05,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }));
      stream.frustumCulled = false;
      stream.renderOrder = 18;
      stream.material.userData.baseOpacity = 0.86;
      stream.userData.offsets = Array.from({ length: streamCount }, (_, particleIndex) => (
        (particleIndex / streamCount + index * 0.07) % 1
      ));
      this.flowRoot.add(stream);

      const cometCount = Math.max(2, Math.min(5, Math.round(Number(relation.volume ?? 30) / 22) + (relation.taskId ? 2 : 1)));
      for (let particleIndex = 0; particleIndex < cometCount; particleIndex += 1) {
        const comet = glowMap
          ? new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowMap,
            color: toNumberColor(style.color),
            transparent: true,
            opacity: 0.96,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }))
          : new THREE.Mesh(
            new THREE.SphereGeometry(relation.type === 'handoff' ? 0.12 : 0.08, 10, 8),
            makeFlowMaterial(style.color, 0.96),
          );
        const baseScale = relation.type === 'handoff' ? 1.55 : 1.22;
        if (comet.isSprite) comet.scale.set(baseScale, baseScale, 1);
        comet.userData.offset = (particleIndex / cometCount + index * 0.11) % 1;
        comet.userData.baseScale = baseScale;
        comet.material.userData.baseOpacity = 0.96;
        comet.renderOrder = 20;
        this.flowRoot.add(comet);
        particles.push(comet);
      }
    }
    this.relations.push({
      relation, from, to, line, glow, ribbon, curve, stream, particles, style,
      speed: 0.046 + Number(relation.activity ?? 70) / 1450,
    });
  }

  disposeObject(object) {
    object.traverse((child) => {
      child.geometry?.dispose?.();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.filter(Boolean).forEach((material) => {
        if (material.map && material.map !== getFlowGlowTexture()) material.map.dispose?.();
        material.dispose?.();
      });
    });
  }

  clearProvincialCityNetwork() {
    [...this.cityRoot.children].forEach((child) => {
      this.cityRoot.remove(child);
      this.disposeObject(child);
    });
    this.cityNodes.clear();
    this.cityFlows = [];
    this.cityLabels = [];
    this.sandboxHover = { cityId: null, flowId: null };
    this.sandboxIntroOrigin = null;
    this.sandboxScan = null;
    this.sandboxGrid = null;
    this.sandboxBounds = null;
    this.sheet.scale.z = this.baseSheetScaleZ;
    this.cityRoot.visible = false;
  }

  setProvincialCityNetwork(network = null) {
    this.clearProvincialCityNetwork();
    const cities = network?.cities ?? [];
    const flows = network?.flows ?? [];
    if (!cities.length) return;
    this.sheet.scale.z = 0.78;
    const nodeColor = '#8ec5d4';
    const xs = [];
    const ys = [];
    cities.forEach((city, index) => {
      if (!Array.isArray(city.center) || city.center.length < 2) return;
      const point = this.projector.fromLngLat(city.center, SANDBOX_NODE_Z);
      xs.push(point.x);
      ys.push(point.y);
      const tier = city.tier ?? (city.capital ? 1 : 3);
      const spec = SANDBOX_NODE[tier] ?? SANDBOX_NODE[3];
      const node = new THREE.Group();
      node.position.copy(point);
      node.userData = {
        kind: 'sandbox-node',
        cityId: city.id,
        city,
        tier,
        phase: index * 0.37,
        capital: Boolean(city.capital),
        alert: Boolean(city.alert),
        introDelay: tier === 1 ? 0.28 : tier === 2 ? 0.46 : 0.62,
        baseScale: 1,
      };
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(spec.core, 14, 12),
        new THREE.MeshBasicMaterial({ color: toNumberColor(city.alert ? '#e07a4a' : nodeColor), transparent: true, opacity: 0.94 }),
      );
      node.add(core);
      spec.rings.forEach((ringSize, ringIndex) => {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(ringSize[0], ringSize[1], 28),
          new THREE.MeshBasicMaterial({
            color: toNumberColor(nodeColor),
            transparent: true,
            opacity: ringIndex ? 0.28 : 0.42,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        ring.position.z = 0.012 + ringIndex * 0.006;
        node.add(ring);
      });
      if (spec.halo > 0) {
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(spec.core * 2.4, spec.core * 2.8, 32),
          new THREE.MeshBasicMaterial({
            color: toNumberColor(nodeColor), transparent: true, opacity: spec.halo,
            side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
          }),
        );
        halo.position.z = 0.006;
        node.userData.halo = halo;
        node.add(halo);
      }
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.18, spec.core * 4.2), 10, 8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      hit.userData = { kind: 'sandbox-node', cityId: city.id, city };
      node.add(hit);
      if (city.alert) {
        const warn = new THREE.Mesh(
          new THREE.SphereGeometry(spec.core * 0.55, 8, 8),
          new THREE.MeshBasicMaterial({ color: toNumberColor('#e07a4a'), transparent: true, opacity: 0.9 }),
        );
        warn.position.set(spec.core * 1.6, spec.core * 1.2, 0.04);
        warn.userData.alertPulse = true;
        node.add(warn);
      }
      const label = makeSandboxCityLabel(city.name, tier);
      if (label) {
        label.position.copy(point).setZ(SANDBOX_NODE_Z + 0.08);
        label.position.y += spec.core + 0.16;
        label.userData.cityId = city.id;
        label.userData.tier = tier;
        label.userData.introDelay = node.userData.introDelay + 0.08;
        this.cityRoot.add(label);
        this.cityLabels.push(label);
      }
      this.cityRoot.add(node);
      this.cityNodes.set(city.id, node);
    });
    if (!xs.length) {
      this.cityRoot.visible = false;
      return;
    }
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    this.sandboxBounds = { minX, maxX, minY, maxY, cx: (minX + maxX) * 0.5, cy: (minY + maxY) * 0.5 };
    const grid = new THREE.GridHelper(Math.max(18, (maxX - minX) * 1.8), 12, 0x16344c, 0x102838);
    grid.rotation.x = Math.PI / 2;
    grid.position.set(this.sandboxBounds.cx, this.sandboxBounds.cy, SANDBOX_NODE_Z - 1.35);
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.055;
      material.depthWrite = false;
    });
    grid.userData.kind = 'sandbox-grid';
    this.sandboxGrid = grid;
    this.cityRoot.add(grid);

    const glowMap = getFlowGlowTexture();
    flows.forEach((flow, index) => {
      const from = this.cityNodes.get(flow.fromId);
      const to = this.cityNodes.get(flow.toId);
      if (!from || !to) return;
      const mode = SANDBOX_MODE[flow.mode] ?? SANDBOX_MODE.road;
      const grade = flow.focus ? { ...SANDBOX_GRADE.trunk, width: 2.45, opacity: 0.85, glow: 0.16, particles: 3 }
        : flow.alert ? { ...SANDBOX_GRADE.regional, opacity: 0.55, glow: 0.08, particles: 2 }
        : flow.active ? { ...SANDBOX_GRADE[flow.grade] ?? SANDBOX_GRADE.regional, opacity: Math.min(0.65, ((SANDBOX_GRADE[flow.grade] ?? SANDBOX_GRADE.regional).opacity) + 0.15) }
        : (SANDBOX_GRADE[flow.grade] ?? SANDBOX_GRADE.feeder);
      const start = from.position.clone().setZ(SANDBOX_FLOW_Z);
      const end = to.position.clone().setZ(SANDBOX_FLOW_Z);
      const distance = start.distanceTo(end);
      const lift = mode.lift + Math.min(flow.mode === 'air' ? 0.7 : 0.18, distance * 0.012);
      const sway = ((index % 2 === 0 ? 1 : -1) * Math.min(0.32, distance * 0.045));
      const curve = makeSandboxCurve(start, end, lift, sway);
      const points = curve.getPoints(Math.max(18, Math.round(distance * 5)));
      const color = flow.alert ? '#c56a46' : mode.color;
      const width = grade.width;
      const glow = grade.glow > 0 ? makeWideLine(points, {
        color: toNumberColor(color), width: width * 1.8, opacity: grade.glow, dashed: false,
      }) : null;
      if (glow) {
        glow.material.blending = THREE.AdditiveBlending;
        glow.material.transparent = true;
        glow.material.depthWrite = false;
        glow.material.userData.baseOpacity = glow.material.opacity;
        glow.renderOrder = 8;
        this.cityRoot.add(glow);
      }
      const line = makeWideLine(points, {
        color: toNumberColor(color),
        width,
        opacity: grade.opacity,
        dashed: Boolean(mode.dashed && flow.grade !== 'trunk'),
        dashSize: flow.mode === 'rail' ? 0.42 : 0.34,
        gapSize: flow.mode === 'rail' ? 0.16 : 0.28,
      });
      line.userData = {
        kind: 'sandbox-flow',
        flowId: flow.id,
        flow,
        phase: index * 0.19,
        introDelay: flow.grade === 'trunk' || flow.focus ? 0.72 : 1.05,
      };
      line.material.userData.baseOpacity = line.material.opacity;
      line.userData.baseWidth = width;
      line.renderOrder = flow.focus ? 12 : 9;
      this.cityRoot.add(line);
      const pick = makeWideLine(points, {
        color: toNumberColor(color), width: Math.max(4.2, width * 2.4), opacity: 0, dashed: false,
      });
      pick.userData = { kind: 'sandbox-flow', flowId: flow.id, flow };
      pick.renderOrder = 7;
      this.cityRoot.add(pick);
      if (flow.alert) {
        const slice = points.slice(Math.floor(points.length * 0.38), Math.floor(points.length * 0.62));
        if (slice.length > 1) {
          const alertLine = makeWideLine(slice, {
            color: toNumberColor('#e07a4a'), width: width * 1.15, opacity: 0.82, dashed: true, dashSize: 0.2, gapSize: 0.16,
          });
          alertLine.userData.alertPulse = true;
          alertLine.material.userData.baseOpacity = 0.82;
          alertLine.renderOrder = 13;
          this.cityRoot.add(alertLine);
          line.userData.alertLine = alertLine;
        }
      }
      const particleCount = flow.grade === 'feeder' && !flow.active ? 1 : Math.min(3, grade.particles);
      const particles = [];
      for (let particleIndex = 0; particleIndex < particleCount; particleIndex += 1) {
        const isBar = mode.shape === 'bar';
        const comet = glowMap
          ? new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowMap,
            color: toNumberColor(color),
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }))
          : new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), makeFlowMaterial(color, 0.88));
        const baseScale = isBar ? 0.42 : mode.shape === 'soft' ? 0.34 : 0.28;
        if (comet.isSprite) comet.scale.set(isBar ? baseScale * 1.8 : baseScale, isBar ? baseScale * 0.45 : baseScale, 1);
        comet.userData.offset = (particleIndex / Math.max(1, particleCount) + index * 0.13) % 1;
        comet.userData.baseScale = baseScale;
        comet.userData.shape = mode.shape;
        comet.material.userData.baseOpacity = 0.88;
        comet.renderOrder = 20;
        comet.visible = false;
        this.cityRoot.add(comet);
        particles.push(comet);
      }
      if (flow.focus) {
        const taskLabel = makeSandboxTaskLabel(`${flow.from} → ${flow.to}`);
        if (taskLabel) {
          const mid = curve.getPointAt(0.52);
          taskLabel.position.copy(mid).setZ(mid.z + 0.12);
          taskLabel.userData.introDelay = 1.35;
          this.cityRoot.add(taskLabel);
          line.userData.taskLabel = taskLabel;
        }
        const target = this.cityNodes.get(flow.toId);
        if (target) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.12, 0.148, 32),
            new THREE.MeshBasicMaterial({
              color: toNumberColor('#d7eef6'), transparent: true, opacity: 0.55,
              side: THREE.DoubleSide, depthWrite: false,
            }),
          );
          ring.position.z = 0.03;
          ring.userData.focusTarget = true;
          target.add(ring);
        }
      }
      this.cityFlows.push({
        id: flow.id,
        flow,
        curve,
        line,
        glow,
        pick,
        stream: null,
        particles,
        speed: mode.speed * (flow.focus ? 1.12 : 1),
        introDelay: line.userData.introDelay,
      });
    });

    if (xs.length) {
      const scan = new THREE.Mesh(
        new THREE.PlaneGeometry((maxX - minX) * 1.25 + 4, 0.55),
        new THREE.MeshBasicMaterial({
          color: toNumberColor('#67c2e0'), transparent: true, opacity: 0, depthWrite: false,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        }),
      );
      scan.position.set(this.sandboxBounds.cx, maxY + 1.2, SANDBOX_NODE_Z + 0.2);
      scan.renderOrder = 30;
      this.sandboxScan = scan;
      this.cityRoot.add(scan);
    }
    this.cityRoot.visible = this.cityNodes.size > 0;
    this.refreshSandboxPresentation(0);
  }

  getSandboxPickMeshes() {
    const meshes = [];
    this.cityNodes.forEach((node) => {
      node.traverse((object) => {
        if (object.isMesh && object.userData?.kind === 'sandbox-node') meshes.push(object);
      });
    });
    return meshes;
  }

  getSandboxPickLines() {
    return this.cityFlows.map((item) => item.pick).filter(Boolean);
  }

  findSandboxCityByName(name) {
    const target = String(name ?? '');
    for (const node of this.cityNodes.values()) {
      const city = node.userData.city;
      if (city?.fullName === target || city?.name === target) return city;
    }
    return null;
  }

  getSandboxHoverInfo() {
    if (this.sandboxHover.flowId) {
      const item = this.cityFlows.find((entry) => entry.id === this.sandboxHover.flowId);
      if (!item) return null;
      const flow = item.flow;
      const modeLabel = (SANDBOX_MODE[flow.mode] && MODE_STYLE[flow.mode]?.label) || '公路';
      return {
        title: `${flow.from} → ${flow.to}`,
        subtitle: `${modeLabel} · 今日 ${flow.volume} · 在途 ${Math.max(1, Math.round(flow.volumeValue * 12))}单 · ${flow.status}`,
      };
    }
    if (this.sandboxHover.cityId) {
      const node = this.cityNodes.get(this.sandboxHover.cityId);
      const city = node?.userData?.city;
      if (!city) return null;
      const related = this.cityFlows.filter((item) => item.flow.fromId === city.id || item.flow.toId === city.id).length;
      const type = city.tier === 1 ? '一级物流枢纽' : city.tier === 2 ? '二级物流节点' : '普通城市节点';
      return {
        title: city.name,
        subtitle: `${type} · 货运量 ${city.volume} · 任务 ${city.tasks} · 关联 ${related} 条`,
      };
    }
    return null;
  }

  setSandboxHover({ cityId = null, flowId = null } = {}) {
    this.sandboxHover = { cityId, flowId };
    this.refreshSandboxPresentation();
  }

  refreshSandboxPresentation(intro = 1) {
    const hoverCity = this.sandboxHover.cityId;
    const hoverFlow = this.sandboxHover.flowId;
    this.cityFlows.forEach((item) => {
      const related = hoverCity
        ? item.flow.fromId === hoverCity || item.flow.toId === hoverCity
        : hoverFlow
          ? item.id === hoverFlow
          : true;
      const dim = hoverCity || hoverFlow ? (related ? 1.28 : 0.22) : 1;
      const appear = THREE.MathUtils.smoothstep(intro - item.introDelay, 0, 0.28);
      const focusBoost = item.flow.focus ? 1.08 : 1;
      item.line.visible = appear > 0.02;
      item.line.material.opacity = item.line.material.userData.baseOpacity * dim * focusBoost * appear * (this.visualWeight ?? 1);
      if (item.glow) {
        item.glow.visible = appear > 0.02;
        item.glow.material.opacity = item.glow.material.userData.baseOpacity * dim * appear * (this.visualWeight ?? 1);
      }
      if (item.line.userData.alertLine) {
        item.line.userData.alertLine.visible = appear > 0.02;
        item.line.userData.alertLine.material.opacity = item.line.userData.alertLine.material.userData.baseOpacity * dim * appear;
      }
      item.particles.forEach((particle) => {
        particle.userData.allowed = appear > 0.85;
      });
      if (item.line.userData.taskLabel) {
        item.line.userData.taskLabel.material.opacity = 0.9 * appear * (intro > 1.35 ? 1 : THREE.MathUtils.smoothstep(intro - 1.35, 0, 0.25));
      }
    });
    this.cityNodes.forEach((node) => {
      const related = hoverFlow
        ? this.cityFlows.some((item) => item.id === hoverFlow && (item.flow.fromId === node.userData.cityId || item.flow.toId === node.userData.cityId))
        : hoverCity
          ? node.userData.cityId === hoverCity
          : true;
      const appear = THREE.MathUtils.smoothstep(intro - node.userData.introDelay, 0, 0.22);
      node.visible = appear > 0.02;
      const hoverScale = hoverCity && node.userData.cityId === hoverCity ? 1.15 : 1;
      node.userData.hoverScale = hoverScale;
      node.traverse((child) => {
        if (!child.material || child.material.opacity === 0) return;
        if (child.material.userData?.baseNodeOpacity == null) child.material.userData.baseNodeOpacity = child.material.opacity;
        const dim = hoverCity || hoverFlow ? (related ? 1 : 0.28) : 1;
        child.material.opacity = child.material.userData.baseNodeOpacity * dim * appear * (this.visualWeight ?? 1);
      });
    });
    this.cityLabels.forEach((label) => {
      const appear = THREE.MathUtils.smoothstep(intro - (label.userData.introDelay ?? 0.5), 0, 0.2);
      label.userData.introOpacity = appear;
    });
  }

  getEntityWorldPosition(entityId) {
    const node = this.nodeObjects.get(entityId);
    if (!node) return null;
    return node.getWorldPosition(new THREE.Vector3());
  }

  getCityWorldPosition(cityId) {
    const node = this.cityNodes.get(cityId);
    if (!node) return null;
    return node.getWorldPosition(new THREE.Vector3());
  }

  getCityFlowWorldPosition(flowId, t = 0.5) {
    const item = this.cityFlows.find((entry) => entry.id === flowId);
    if (!item) return null;
    return this.localToWorld(item.curve.getPointAt(THREE.MathUtils.clamp(Number(t) || 0.5, 0, 1)));
  }

  getRelationWorldPosition(relationId, t = 0.5) {
    const item = this.relations.find((entry) => entry.relation.id === relationId);
    if (!item) return null;
    return this.localToWorld(item.curve.getPointAt(THREE.MathUtils.clamp(Number(t) || 0.5, 0, 1)));
  }

  /**
   * 首页只画主干骨架，比当前 LOD 再稀一档；放大后仍能逐步看到更多要素。
   */
  viewLodLevel() {
    return this.homeOverview ? Math.max(0, this.lodLevel - 1) : this.lodLevel;
  }

  isNodeInView(entity) {
    if (this.focusProvince) return false;
    if ((entity.lod ?? 1) > this.viewLodLevel()) return false;
    return true;
  }

  isRelationInView(item) {
    if (this.focusProvince) return false;
    if ((item.relation.lod ?? 1) > this.viewLodLevel()) return false;
    if (!this.filters[relationFilter(item.relation.type)]) return false;
    if (this.explodedPresentation || this.homeOverview) {
      // 三层分解与首页只保留主干业务流，弱化协同虚线与异常噪点。
      if (item.relation.type === 'collaboration' || item.relation.type === 'exception') return false;
    }
    return true;
  }

  isPrimaryRelation(item) {
    if (this.taskRelationIds.size) return this.taskRelationIds.has(item.relation.id);
    if (!this.dashboardActive) return true;
    return (VIEW_MATCHERS[this.viewMode] ?? VIEW_MATCHERS.overview)(item.relation);
  }

  refreshVisibility() {
    const provincial = Boolean(this.focusProvince);
    // Story scenes own their own markers/routes; keep national operation
    // flows/nodes suppressed so 运营网单层页 / 三层分解 stay untouched.
    const suppressNational = this.storyNationalSuppressed;
    this.flowRoot.visible = !provincial && !suppressNational;
    this.nodeRoot.visible = !provincial && !suppressNational;
    this.cityRoot.visible = provincial && this.cityNodes.size > 0;
    const showNodes = !suppressNational && (this.filters.cargoFlow || this.filters.capacity || this.filters.tasks);
    this.entities.forEach((entity) => {
      const node = this.nodeObjects.get(entity.id);
      const belongsToView = this.viewMode !== 'alerts' || this.alertNodeIds.has(entity.id);
      if (node) {
        const dashboardHub = this.dashboardActive && !provincial && DASHBOARD_LABEL_IDS.has(entity.id);
        node.visible = showNodes && belongsToView && (dashboardHub || this.isNodeInView(entity));
      }
      const heatRing = this.heatRings.get(entity.id);
      if (heatRing) heatRing.visible = !suppressNational && !provincial && this.dashboardActive && belongsToView && DASHBOARD_LABEL_IDS.has(entity.id);
      const label = this.labelObjects.get(entity.id);
      if (label) label.visible = false;
    });
    this.relations.forEach((item) => {
      const visible = !suppressNational && this.isRelationInView(item);
      const primary = this.isPrimaryRelation(item);
      const focused = this.taskRelationIds.has(item.relation.id);
      const color = focused ? '#ffc45f' : item.style.color;
      const weight = this.visualWeight ?? 1;
      const dim = primary ? 1 : (this.viewMode === 'overview' ? 0.22 : 0.04);
      item.flowDim = dim * (focused ? 1.35 : 1);
      item.line.visible = visible;
      if (item.glow) item.glow.visible = visible;
      if (item.ribbon) item.ribbon.visible = visible;
      if (item.stream) item.stream.visible = visible && (primary || this.viewMode === 'overview');
      if (visible) {
        item.line.material.color.set(toNumberColor(color));
        item.line.material.opacity = item.style.opacity * dim * weight;
        item.line.material.linewidth = item.style.width * (focused ? 1.18 : primary ? 1 : (this.viewMode === 'overview' ? 0.42 : 0.32));
        item.line.material.needsUpdate = true;
        if (item.glow) {
          item.glow.material.color.set(toNumberColor(color));
          item.glow.material.opacity = item.glow.material.userData.baseOpacity * dim * (focused ? 1.35 : 1) * weight;
        }
        if (item.ribbon) {
          item.ribbon.material.color.set(toNumberColor(color));
          item.ribbon.material.opacity = item.ribbon.material.userData.baseOpacity * dim * weight;
        }
        if (item.stream) {
          item.stream.material.color.set(toNumberColor(color));
          item.stream.material.opacity = item.stream.material.userData.baseOpacity * (primary ? 1 : 0.28) * weight;
        }
      }
      item.particles.forEach((particle) => {
        particle.visible = visible && primary;
        particle.material.color.set(toNumberColor(color));
        particle.material.opacity = (primary ? particle.material.userData.baseOpacity : 0) * weight;
      });
    });
    if (this.alert) {
      this.alert.visible = !suppressNational
        && !provincial
        && !this.homeOverview
        && this.filters.alerts
        && this.lodLevel >= 1;
    }
  }

  setLod(level = 0, focusProvince = null) {
    this.lodLevel = level;
    this.focusProvince = focusProvince;
    if (!focusProvince) this.clearProvincialCityNetwork();
    this.refreshVisibility();
  }

  setExplodedPresentation(enabled = false) {
    this.explodedPresentation = Boolean(enabled);
    if (this.sheet) this.sheet.scale.z = enabled ? 0.48 : 0.44;
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

  setViewMode(mode = 'overview') {
    this.viewMode = VIEW_MATCHERS[mode] ? mode : 'overview';
    this.taskRelationIds.clear();
    this.taskNodeIds.clear();
    this.labelRoot.visible = false;
    this.refreshVisibility();
  }

  setTaskFocus(relationIds = []) {
    this.taskRelationIds = new Set(relationIds);
    this.taskNodeIds = new Set(this.relations
      .filter((item) => this.taskRelationIds.has(item.relation.id))
      .flatMap((item) => [item.from.id, item.to.id]));
    this.refreshVisibility();
  }

  setDashboardActive(enabled) {
    this.dashboardActive = Boolean(enabled);
    this.nodeObjects.forEach((node) => {
      node.scale.setScalar(this.dashboardActive ? node.userData.dashboardScale : 1);
    });
    this.labelRoot.visible = false;
    this.refreshVisibility();
  }

  update(elapsed) {
    const dash = elapsed * 0.62;
    const flowBoost = this.dashboardActive ? 1.55 : 1;
    if (this.cityRoot.visible) {
      if (this.sandboxIntroOrigin == null) this.sandboxIntroOrigin = elapsed;
      const intro = elapsed - this.sandboxIntroOrigin;
      this.refreshSandboxPresentation(intro);
      if (this.sandboxScan && this.sandboxBounds) {
        if (intro < 1.65) {
          const scanT = THREE.MathUtils.smoothstep(intro, 0.32, 1.55);
          this.sandboxScan.visible = true;
          this.sandboxScan.position.y = THREE.MathUtils.lerp(this.sandboxBounds.maxY + 1.1, this.sandboxBounds.minY - 1.1, scanT);
          this.sandboxScan.material.opacity = Math.sin(scanT * Math.PI) * 0.14;
        } else {
          this.sandboxScan.visible = false;
          this.sandboxScan.material.opacity = 0;
        }
      }
    }
    this.relations.forEach((item) => {
      if (!item.line.visible) return;
      const phase = item.line.userData.phase;
      if (item.line.material.dashed) item.line.material.dashOffset = -((dash + phase) % 4);
      if (item.ribbon?.material.dashed) item.ribbon.material.dashOffset = -((dash * 1.45 + phase) % 5);
      if (item.glow?.visible) {
        const pulse = 0.74 + Math.sin(elapsed * 2.15 + phase) * 0.26;
        item.glow.material.opacity = item.glow.material.userData.baseOpacity * pulse * (item.flowDim ?? 1) * (this.visualWeight ?? 1);
      }
      const speed = item.speed * flowBoost;
      item.particles.forEach((particle) => {
        if (!particle.visible) return;
        const t = (elapsed * speed + particle.userData.offset) % 1;
        particle.position.copy(item.curve.getPointAt(t, FLOW_POINT));
        const fade = Math.sin(t * Math.PI);
        particle.material.opacity = particle.material.userData.baseOpacity * fade * (this.visualWeight ?? 1);
        if (particle.isSprite) {
          const scale = particle.userData.baseScale * (0.72 + fade * 0.85);
          particle.scale.set(scale, scale, 1);
        }
      });
      if (item.stream?.visible) {
        const positions = item.stream.geometry.attributes.position.array;
        const offsets = item.stream.userData.offsets;
        const streamSpeed = speed * 0.78;
        for (let index = 0; index < offsets.length; index += 1) {
          const t = (elapsed * streamSpeed + offsets[index]) % 1;
          item.curve.getPointAt(t, FLOW_POINT);
          positions[index * 3] = FLOW_POINT.x;
          positions[index * 3 + 1] = FLOW_POINT.y;
          positions[index * 3 + 2] = FLOW_POINT.z;
        }
        item.stream.geometry.attributes.position.needsUpdate = true;
      }
    });
    this.cityFlows.forEach((item) => {
      if (!this.cityRoot.visible || !item.line.visible) return;
      const phase = item.line.userData.phase ?? 0;
      if (item.line.material.dashed) item.line.material.dashOffset = -((dash + phase) % 4);
      if (item.line.userData.alertLine?.material.dashed) {
        item.line.userData.alertLine.material.dashOffset = -((dash * 1.6 + phase) % 3);
        item.line.userData.alertLine.material.opacity = item.line.userData.alertLine.material.userData.baseOpacity
          * (0.55 + Math.sin(elapsed * 4.2) * 0.35);
      }
      item.particles.forEach((particle) => {
        const allowed = Boolean(particle.userData.allowed);
        particle.visible = allowed;
        if (!allowed) return;
        const t = (elapsed * item.speed + particle.userData.offset) % 1;
        particle.position.copy(item.curve.getPointAt(t, FLOW_POINT));
        const fade = 0.55 + Math.sin(t * Math.PI) * 0.45;
        particle.material.opacity = particle.material.userData.baseOpacity * fade * (this.visualWeight ?? 1);
        if (particle.isSprite) {
          const bar = particle.userData.shape === 'bar';
          const scale = particle.userData.baseScale * (0.82 + fade * 0.28);
          particle.scale.set(bar ? scale * 1.8 : scale, bar ? scale * 0.42 : scale, 1);
        }
      });
    });
    this.cityNodes.forEach((node) => {
      if (!this.cityRoot.visible || !node.visible) return;
      const spec = SANDBOX_NODE[node.userData.tier] ?? SANDBOX_NODE[3];
      const breath = spec.breath ? 1 + Math.sin(elapsed * 1.15 + node.userData.phase) * spec.breath : 1;
      node.scale.setScalar(breath * (node.userData.hoverScale ?? 1));
      if (node.userData.halo) {
        node.userData.halo.material.opacity = spec.halo
          * (0.82 + Math.sin(elapsed * 1.05 + node.userData.phase) * 0.12)
          * (this.visualWeight ?? 1);
      }
      node.traverse((child) => {
        if (!child.userData?.alertPulse) return;
        child.material.opacity = 0.55 + Math.sin(elapsed * 4.4) * 0.35;
      });
    });
    this.nodeObjects.forEach((node) => {
      if (!node.visible || node.userData.networkRole !== 'coordinator') return;
      const pulse = this.fadeVisuals ? 1 : 1 + Math.sin(elapsed * 1.7 + node.userData.phase) * 0.055;
      const dashboardScale = this.dashboardActive ? node.userData.dashboardScale : 1;
      node.scale.setScalar(dashboardScale * pulse);
    });
    this.heatRings.forEach((ring) => {
      if (!ring.visible) return;
      const pulse = 1 + Math.sin(elapsed * 1.35 + ring.userData.phase) * 0.13;
      ring.scale.setScalar(pulse);
      ring.material.opacity = (0.20 + Math.sin(elapsed * 1.35 + ring.userData.phase) * 0.08) * (this.visualWeight ?? 1);
    });
    if (this.alert?.visible) {
      const pulse = this.fadeVisuals ? 1 : 1 + Math.sin(elapsed * 2.2) * 0.16;
      this.alert.scale.setScalar(pulse);
      this.alert.material.opacity = (this.fadeVisuals ? 0.46 : 0.46 + Math.sin(elapsed * 2.2) * 0.14) * (this.visualWeight ?? 1);
    }
  }

  updateSandboxLabels(camera, width, height) {
    if (!this.cityLabels.length || !this.cityRoot.visible) return;
    const canProject = Boolean(camera && width > 1 && height > 1);
    const world = new THREE.Vector3();
    const candidates = [];
    this.cityLabels.forEach((label) => {
      const node = this.cityNodes.get(label.userData.cityId);
      if (!node?.visible) {
        label.visible = false;
        return;
      }
      const appear = label.userData.introOpacity ?? 1;
      if (appear < 0.2) {
        label.visible = false;
        return;
      }
      if (!canProject) {
        label.visible = true;
        label.material.opacity = 0.92 * appear;
        return;
      }
      label.getWorldPosition(world);
      const clip = world.project(camera);
      if (clip.z < -1 || clip.z > 1 || Math.abs(clip.x) > 1.2 || Math.abs(clip.y) > 1.2) {
        label.visible = false;
        return;
      }
      const distance = camera.position.distanceTo(world);
      const projectedHeight = (label.userData.baseHeight / Math.max(0.001, 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance)) * height;
      candidates.push({
        label,
        tier: label.userData.tier ?? 3,
        focus: this.sandboxHover.cityId === label.userData.cityId,
        x: (clip.x + 1) * 0.5 * width,
        y: (1 - clip.y) * 0.5 * height,
        width: Math.max(12, projectedHeight * (label.userData.baseWidth / label.userData.baseHeight)),
        height: Math.max(10, projectedHeight),
        appear,
      });
    });
    if (!canProject) return;
    candidates.sort((left, right) => (
      Number(right.focus) - Number(left.focus)
      || left.tier - right.tier
    ));
    const kept = [];
    this.cityLabels.forEach((label) => { label.visible = false; });
    candidates.forEach((item) => {
      const overlaps = kept.some((other) => (
        Math.abs(item.x - other.x) < (item.width + other.width) * 0.42
        && Math.abs(item.y - other.y) < (item.height + other.height) * 0.48
      ));
      if (overlaps && item.tier === 3 && !item.focus) return;
      if (overlaps && item.tier === 2 && kept.some((other) => other.tier === 1) && !item.focus) return;
      item.label.visible = true;
      item.label.material.opacity = 0.92 * item.appear;
      kept.push(item);
    });
  }

  setVisualWeight(weight, options = {}) {
    this.visualWeight = weight;
    this.fadeVisuals = Boolean(options.fade);
    this.visible = options.preserveSheet ? true : weight > 0.005;
    setGroupOpacity(this, weight, options);
    this.refreshVisibility();
  }

  resize(width, height) { updateLineResolution(this, width, height); }
}
