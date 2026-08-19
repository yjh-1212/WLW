import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AnimationManager } from './AnimationManager.js';
import { CameraDirector } from './CameraDirector.js';
import { InteractionManager } from './InteractionManager.js';
import { MAP_STATES, MapStateMachine, resolveDrillNetworkLayer, stateToLayer } from './MapStateMachine.js';
import { ChinaBaseMap } from '../map/ChinaBaseMap.js';
import { GeoProjector } from '../map/GeoProjector.js';
import { ProvinceDrilldownLayer } from '../map/ProvinceDrilldownLayer.js';
import { EntityRegistry } from '../data/EntityRegistry.js';
import { LODManager } from '../data/LODManager.js';
import { InfrastructureLayer } from '../layers/infrastructure/InfrastructureLayer.js';
import { OperationLayer } from '../layers/operation/OperationLayer.js';
import { DigitalLayer } from '../layers/digital/DigitalLayer.js';
import { PenetrationController } from '../interaction/PenetrationController.js';
import { LogisticsStoryController } from '../story/LogisticsStoryController.js';
import { ShandongRegionDemoController } from '../story/ShandongRegionDemoController.js';
import { STORY_IDS } from '../data/LayerDataManager.js';
import { HomeGlobeIntro, loadWorldOutline, prefersReducedMotion } from '../intro/HomeGlobeIntro.js';
import { MAP_THEME, toNumberColor } from '../theme/mapTheme.js';
import { makeWideLine, updateLineResolution } from '../layers/rendering.js';
import { createExplodedLayerIcon, EXPLODED_ICON_PLACEMENTS } from '../layers/explodedLayerIcons.js';
import { normalizeProvinceName } from '../data/demoData.js';

const layerState = {
  // 首页是基础/运营/数字三张网的叠合视图，三层都要读得出来，
  // 因此权重拉高并把 Z 拉开一点，避免运营和数字要素被基础设施埋住。
  combined: {
    infrastructure: { x: 0, y: 0, z: 0.0, scale: 1, weight: 0.90 },
    operation: { x: 0, y: 0, z: 0.9, scale: 1, weight: 0.82 },
    digital: { x: 0, y: 0, z: 1.8, scale: 1, weight: 0.88 },
  },
  // Co-axial vertical stack: all three maps keep the exact same planar registration.
  // Equal scale and Z-only separation make cross-layer relationships readable at a glance.
  exploded: {
    // 第二层略下压，三层更接近平行货架间距。
    infrastructure: { x: 0, y: 0, z: -8, scale: 1.02, weight: 1.0 },
    operation: { x: 0, y: 0, z: 9, scale: 1.02, weight: 1.0 },
    digital: { x: 0, y: 0, z: 26, scale: 1.02, weight: 1.0 },
  },
  provinceExploded: {
    infrastructure: { x: 0, y: 0, z: 0, scale: 0.98, weight: 1.0 },
    operation: { x: 0, y: 0, z: 8, scale: 0.98, weight: 1.0 },
    digital: { x: 0, y: 0, z: 16, scale: 0.98, weight: 1.0 },
  },
};

// 首页把三张网的地图板压得很淡：中国轮廓由底图承担，通道、枢纽与协同线成为主视觉。
const homeSheetFactor = { infrastructure: 0.42, operation: 0.24, digital: 0.24 };

export { normalizeProvinceName };

export class MapRuntime {
  constructor({ canvas, ui, data, dataManager }) {
    this.canvas = canvas;
    this.ui = ui;
    this.data = data;
    this.dataManager = dataManager;
    this.animations = new AnimationManager();
    this.projector = new GeoProjector();
    this.registry = new EntityRegistry(data.entities);
    this.lod = new LODManager();
    this.stateMachine = new MapStateMachine();
    this.selectedEntityId = null;
    this.selectedRouteId = null;
    this.selectedProvince = null;
    this.provinceEntryState = null;
    this.provinceOperationView = false;
    this.provinceInfrastructureView = false;
    this.provinceDigitalView = false;
    this.networkFocusLayer = null;
    this.cameraUserOverride = false;
    this.savedLayerCamera = null;
    this.filterBatch = 0;
    this.hoveredProvince = null;
    this.provinceIsolationVisibility = new Map();
    this.storyContentVisibility = new Map();
    this.storyProvinceFocus = null;
    this.regionDemoProvince = null;
    this.storyLayerWeights = { infrastructure: 1, operation: 1, digital: 1 };
    this.storySheetWeights = { infrastructure: 1, operation: 1, digital: 1 };
    this.storyReturnSnapshot = null;
    this.explodedFocusLayer = null;
    this.homeIntro = null;
    this.homeIntroPlayed = false;
    this.homeIntroReveal = 1;
    this.stackFlows = [];
    this.clock = new THREE.Clock();
    this.frameId = null;
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(toNumberColor(MAP_THEME.backgroundDeep), 0.0024);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 400);
    // The map is built in the XY plane, therefore Z is its physical up axis.
    // Matching the camera up vector to the scene makes pitch interaction intuitive.
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0, -18, 118);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.rotateSpeed = 0.78;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 360;
    // Allow a broad top-down-to-grazing pitch range while preventing the camera
    // from crossing underneath the map stack.
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(4);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(68);
    this.controls.target.set(0, 0, 0);

    this.cameraDirector = new CameraDirector(this.camera, this.controls, this.animations);
    this.controls.addEventListener('start', () => this.beginUserCamera());
    this.addLights();
    this.addAmbientGrid();
    this.addStarField();

    this.baseMap = await new ChinaBaseMap().load();
    this.baseMapRoot = new THREE.Group();
    this.baseMapRoot.name = 'BaseMapRoot';
    this.baseSheet = this.baseMap.createSheet({ name: 'NationalBaseMap', role: 'base', color: MAP_THEME.map, opacity: 0.76 });
    this.baseSheet.position.z = -2.4;
    this.baseMapRoot.add(this.baseSheet);
    this.scene.add(this.baseMapRoot);

    this.networkStackRoot = new THREE.Group();
    this.networkStackRoot.name = 'NetworkStackRoot';
    this.scene.add(this.networkStackRoot);
    const layerArgs = {
      mapFactory: this.baseMap,
      projector: this.projector,
      routes: this.data.routes,
      entities: this.data.infrastructureEntities ?? this.data.entities,
      operationNodes: this.data.operationNodes,
      operationRelations: this.data.operationRelations,
      digitalNodes: this.data.digitalNodes,
      digitalRelations: this.data.digitalRelations,
      registry: this.registry,
      infrastructureData: this.data.infrastructure,
    };
    this.layers = {
      infrastructure: new InfrastructureLayer(layerArgs),
      operation: new OperationLayer(layerArgs),
      digital: new DigitalLayer(layerArgs),
    };
    Object.values(this.layers).forEach((layer) => this.networkStackRoot.add(layer));
    this.addStackConnectors();
    this.addExplodedLayerIcons();
    this.provinceDrilldown = new ProvinceDrilldownLayer({
      projector: this.projector,
      provinceData: this.data.provinceBoundaries,
      layers: this.layers,
      scene: this.scene,
    });

    this.selectionRoot = new THREE.Group();
    this.selectionRoot.name = 'SelectionRoot';
    this.scene.add(this.selectionRoot);
    this.penetration = new PenetrationController({ registry: this.registry, selectionRoot: this.selectionRoot });
    this.story = new LogisticsStoryController(this);
    this.shandongDemo = new ShandongRegionDemoController(this);
    this.interaction = new InteractionManager(this);

    this.stateMachine.addEventListener('change', (event) => this.applyState(event.detail));
    this.lod.addEventListener('change', (event) => {
      this.ui.updateLod(event.detail.level, event.detail.focusRegion);
      this.layers.operation?.setLod(event.detail.level, event.detail.focusRegion);
      this.layers.digital?.setLod(event.detail.level, event.detail.focusRegion);
    });
    this.layers.operation.setLod(this.lod.level ?? 0, null);
    this.layers.digital.setLod(this.lod.level ?? 0, null);
    this.controls.addEventListener('change', () => this.lod.updateByDistance(this.camera.position.distanceTo(this.controls.target)));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas.parentElement);
    this.resize();
    this.applyState({ state: MAP_STATES.COMBINED, previous: null, context: {} }, false);
    await this.startHomeIntro();
    this.animate();
    return this;
  }

  /**
   * 首页开场：星空中正对中国的线框地球 → 镜头推进 → 中国物流网络定格。
   * 首屏与每次点击“首页”都会重播；任何交互或切到其他页面都会立即结束它，
   * 因此不会影响三层分解、单层网络页与省级页的相机与图层表现。
   */
  async startHomeIntro() {
    if (this.homeIntroPlayed) return;
    this.homeIntroPlayed = true;
    if (this.stateMachine.state !== MAP_STATES.COMBINED || this.cameraUserOverride) return;
    if (prefersReducedMotion()) return;
    const search = globalThis.location?.search ?? '';
    if (new URLSearchParams(search).get('intro') === '0') return;
    // 先收起中国地图专属附件，避免地球阶段先闪一下南海附图与指北针。
    this.ui?.setHomeIntroActive?.(true);
    // 轮廓数据只取一次：重播时等待的是已兑现的 Promise，不会先闪一帧中国地图。
    this.worldOutlinePromise ??= loadWorldOutline();
    const outline = await this.worldOutlinePromise;
    if (this.stateMachine.state !== MAP_STATES.COMBINED || this.cameraUserOverride) {
      this.ui?.setHomeIntroActive?.(false);
      return;
    }
    this.cameraDirector.cancelMove();
    this.controls.enabled = false;
    this.applyHomeIntroReveal(0);
    this.homeIntro = new HomeGlobeIntro({
      scene: this.scene,
      camera: this.camera,
      controls: this.controls,
      rings: outline?.world ?? null,
      chinaRings: outline?.china ?? null,
      homePosition: this.cameraDirector.homePosition,
      homeTarget: this.cameraDirector.homeTarget,
      onReveal: (progress) => this.applyHomeIntroReveal(progress),
      onFinish: () => this.completeHomeIntro(),
    });
  }

  /**
   * 点击“首页”重播开场：把一次性播放标记与用户视角覆盖清掉，再从地球重新开始。
   */
  replayHomeIntro() {
    this.homeIntroPlayed = false;
    this.cameraUserOverride = false;
    void this.startHomeIntro();
  }

  /**
   * 分层显影：先中国轮廓，再物流主通道，最后核心节点与协同关系。
   */
  applyHomeIntroReveal(progress) {
    const amount = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1);
    this.homeIntroReveal = amount;
    const stage = (start, end) => {
      const t = THREE.MathUtils.clamp((amount - start) / (end - start), 0, 1);
      return t * t * (3 - 2 * t);
    };
    const outline = stage(0, 0.4);
    const reveal = {
      infrastructure: stage(0.16, 0.62),
      operation: stage(0.42, 0.86),
      digital: stage(0.62, 1),
    };
    if (this.baseSheet) {
      this.baseSheet.visible = outline > 0.01;
      this.baseMap.setSheetOpacity(this.baseSheet, 0.72 * outline);
    }
    this.setFloorHudAmount(outline);
    Object.entries(layerState.combined).forEach(([role, target]) => {
      const layer = this.layers?.[role];
      if (!layer) return;
      const weight = target.weight * reveal[role];
      layer.visible = true;
      layer.setVisualWeight(weight, { fade: weight < 0.995, preserveSheet: true });
      if (layer.sheet) {
        const factor = homeSheetFactor[role] ?? 1;
        this.baseMap.setSheetOpacity(layer.sheet, (layer.sheet.userData.baseOpacity ?? 1) * weight * factor);
      }
    });
  }

  /**
   * 地面 HUD（网格、椭圆环、光晕）属于中国地图的陈设，地球阶段整体收起。
   */
  setFloorHudAmount(amount) {
    if (!this.floorHudRoot) return;
    if (this.regionDemoProvince) {
      this.floorHudRoot.visible = false;
      return;
    }
    const value = THREE.MathUtils.clamp(Number(amount), 0, 1);
    this.floorHudRoot.visible = value > 0.02;
    this.floorHudRoot.traverse((object) => {
      const material = object.material;
      if (!material) return;
      if (material.userData.hudBaseOpacity == null) material.userData.hudBaseOpacity = material.opacity ?? 1;
      material.opacity = material.userData.hudBaseOpacity * value;
    });
  }

  abortHomeIntro({ restoreScene = true } = {}) {
    const intro = this.homeIntro;
    if (!intro) return;
    this.homeIntro = null;
    intro.dispose();
    this.completeHomeIntro({ restoreScene });
  }

  completeHomeIntro({ restoreScene = true } = {}) {
    // 开场被打断时相机还停在推进途中，需要一段平滑落位；自然结束时它已在定格机位。
    const interrupted = this.camera.position.distanceTo(this.cameraDirector.homePosition) > 2;
    this.homeIntro = null;
    this.homeIntroReveal = 1;
    this.controls.enabled = true;
    this.ui?.setHomeIntroActive?.(false);
    this.applyHomeIntroReveal(1);
    if (restoreScene && this.stateMachine.state === MAP_STATES.COMBINED) {
      this.applyState({ state: MAP_STATES.COMBINED, context: this.stateMachine.context ?? {} }, interrupted);
    }
    this.lod?.updateByDistance?.(this.camera.position.distanceTo(this.controls.target));
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight(0xcfeeff, 0x020712, 1.62));
    const key = new THREE.DirectionalLight(0xeaf8ff, 2.08);
    key.position.set(-28, 36, 84);
    this.scene.add(key);
    const coolRim = new THREE.DirectionalLight(toNumberColor(MAP_THEME.operationBright), 1.20);
    coolRim.position.set(38, -34, 36);
    this.scene.add(coolRim);
    const warmRim = new THREE.DirectionalLight(toNumberColor(MAP_THEME.infrastructureBright), 0.92);
    warmRim.position.set(-44, -18, 22);
    this.scene.add(warmRim);
    const digitalRim = new THREE.PointLight(toNumberColor(MAP_THEME.digitalBright), 9.5, 120, 2);
    digitalRim.position.set(18, 15, 34);
    this.scene.add(digitalRim);
    const mapGlow = new THREE.PointLight(toNumberColor(MAP_THEME.primarySoft), 10.5, 120, 2);
    mapGlow.position.set(-8, -4, 24);
    this.scene.add(mapGlow);
  }

  addAmbientGrid() {
    // Keep the floor HUD clearly below the exploded infrastructure sheet (z ≈ -8).
    const floorZ = -16;
    // 整个地面 HUD 收进一个组，首页开场的地球阶段可以整体收起。
    this.floorHudRoot = new THREE.Group();
    this.floorHudRoot.name = 'MapFloorHud';
    this.scene.add(this.floorHudRoot);

    const grid = new THREE.GridHelper(156, 26, 0x1679a7, 0x0d314c);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = floorZ - 0.2;
    grid.material.transparent = true;
    grid.material.opacity = 0.16;
    this.floorHudRoot.add(grid);

    const rings = new THREE.Group();
    rings.name = 'ChinaMapHudRings';
    [34, 44, 55].forEach((radius, index) => {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.58, 0, Math.PI * 2);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(160));
      const material = new THREE.LineBasicMaterial({
        color: toNumberColor(index === 0 ? MAP_THEME.primarySoft : (index === 1 ? MAP_THEME.operation : MAP_THEME.digital)),
        transparent: true,
        opacity: 0.22 - index * 0.045,
        depthWrite: false,
      });
      rings.add(new THREE.LineLoop(geometry, material));
    });
    rings.position.z = floorZ - 0.05;
    this.floorHudRoot.add(rings);

    const baseHalo = new THREE.Mesh(
      new THREE.RingGeometry(33, 57, 96),
      new THREE.MeshBasicMaterial({ color: toNumberColor(MAP_THEME.operation), transparent: true, opacity: 0.055, side: THREE.DoubleSide, depthWrite: false }),
    );
    baseHalo.position.z = floorZ;
    baseHalo.scale.y = 0.58;
    this.floorHudRoot.add(baseHalo);
  }

  addExplodedLayerIcons() {
    this.explodedLayerIcons = [];
    const palette = {
      infrastructure: toNumberColor(MAP_THEME.infrastructureBright),
      operation: toNumberColor(MAP_THEME.operationBright),
      digital: toNumberColor(MAP_THEME.digitalBright),
    };
    Object.entries(EXPLODED_ICON_PLACEMENTS).forEach(([role, sites]) => {
      const layer = this.layers[role];
      if (!layer) return;
      const root = new THREE.Group();
      root.name = `ExplodedIcons:${role}`;
      root.visible = false;
      sites.forEach((site) => {
        const point = this.projector.fromLngLat(site.lngLat, 0);
        const icon = createExplodedLayerIcon(site.kind, palette[role], { scale: (site.scale ?? 1) * 1.45 });
        const baseZ = 0.95 + (site.scale ?? 1) * 0.12;
        icon.position.set(point.x, point.y, baseZ);
        icon.userData.baseZ = baseZ;
        icon.userData.role = role;
        icon.visible = true;
        root.add(icon);
        this.explodedLayerIcons.push(icon);
      });
      layer.add(root);
      layer.userData.explodedIconRoot = root;
    });
  }

  setExplodedLayerIconsVisible(enabled = false) {
    Object.values(this.layers ?? {}).forEach((layer) => {
      if (layer?.userData?.explodedIconRoot) layer.userData.explodedIconRoot.visible = Boolean(enabled);
    });
  }

  updateExplodedLayerIcons(elapsed = 0) {
    if (!this.explodedLayerIcons?.length) return;
    if (this.stateMachine.state !== MAP_STATES.EXPLODED || this.selectedProvince) return;
    if (this.story?.active || this.story?.completed || this.stateMachine.context?.story) return;
    const focus = this.explodedFocusLayer;
    this.explodedLayerIcons.forEach((icon) => {
      const role = icon.userData.role;
      const focused = !focus || focus === role;
      icon.visible = focused;
      if (!focused) return;
      const phase = icon.userData.phase ?? 0;
      const bob = Math.sin(elapsed * 1.35 + phase) * 0.08;
      icon.position.z = (icon.userData.baseZ ?? 0.95) + bob;
      icon.rotation.z = Math.sin(elapsed * 0.55 + phase) * 0.06;
      icon.scale.setScalar(focus === role ? 1.08 : 1);
    });
  }

  addStarField() {
    const count = 260;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 2] = -6 - Math.random() * 32;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: toNumberColor(MAP_THEME.primarySoft),
      size: 0.22,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    this.starField = new THREE.Points(geometry, material);
    this.starField.name = 'AmbientStarField';
    this.scene.add(this.starField);
  }

  addStackConnectors() {
    this.stackConnectorRoot = new THREE.Group();
    this.stackConnectorRoot.name = 'ThreeNetworkVerticalLinks';
    this.stackConnectorRoot.visible = false;
    this.stackFlows = [];

    // 核心穿透区：控制在 8 个。郑州作为三层协同核心，光柱更粗。
    const hubs = [
      { name: '北京', lngLat: [116.40, 39.90], core: true },
      { name: '上海', lngLat: [121.47, 31.23], core: true },
      { name: '郑州', lngLat: [113.62, 34.75], core: true, synergy: true },
      { name: '武汉', lngLat: [114.31, 30.59], core: false },
      { name: '广州', lngLat: [113.26, 23.13], core: false },
      { name: '成都', lngLat: [104.06, 30.67], core: false },
      { name: '重庆', lngLat: [106.55, 29.56], core: false },
      { name: '西安', lngLat: [108.94, 34.34], core: false },
    ];

    const infra = layerState.exploded.infrastructure;
    const operation = layerState.exploded.operation;
    const digital = layerState.exploded.digital;
    const layerPoint = (lngLat, layerCfg, pad) => {
      const p = this.projector.fromLngLat(lngLat, 0);
      return new THREE.Vector3(
        p.x * layerCfg.scale,
        p.y * layerCfg.scale + (layerCfg.y ?? 0),
        layerCfg.z + pad * layerCfg.scale,
      );
    };

    hubs.forEach((hub) => {
      const a = layerPoint(hub.lngLat, infra, 2.1);
      const b = layerPoint(hub.lngLat, operation, 2.6);
      const c = layerPoint(hub.lngLat, digital, 3.4);

      // 不做体积光柱：只用细虚线轨 + 层间节点环 + 粒子流表达关系。
      const rail = makeWideLine([a, b, c], {
        color: toNumberColor(hub.core ? MAP_THEME.primarySoft : MAP_THEME.mapOutline),
        width: hub.core ? 1.15 : 0.7,
        opacity: hub.core ? 0.34 : 0.18,
        dashed: true,
        dashSize: 0.55,
        gapSize: 0.42,
      });
      rail.material.depthWrite = false;
      rail.material.depthTest = false;
      rail.material.transparent = true;
      rail.renderOrder = 4;
      this.stackConnectorRoot.add(rail);

      [
        [a, MAP_THEME.infrastructureBright, hub.synergy ? 0.62 : 0.38],
        [b, MAP_THEME.operationBright, hub.synergy ? 0.56 : 0.34],
        [c, MAP_THEME.digitalBright, hub.synergy ? 0.52 : 0.32],
      ].forEach(([point, color, ringRadius], index) => {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(ringRadius * 0.55, ringRadius, 28),
          new THREE.MeshBasicMaterial({
            color: toNumberColor(color),
            transparent: true,
            opacity: hub.core ? 0.82 : 0.48,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        ring.position.copy(point);
        ring.renderOrder = 6;
        this.stackConnectorRoot.add(ring);
        if (hub.core && index === 2) {
          const pulse = new THREE.Mesh(
            new THREE.RingGeometry(ringRadius * 1.05, ringRadius * 1.55, 28),
            new THREE.MeshBasicMaterial({
              color: toNumberColor(MAP_THEME.digital),
              transparent: true,
              opacity: 0.28,
              side: THREE.DoubleSide,
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          pulse.position.copy(point);
          pulse.userData.pulse = true;
          pulse.renderOrder = 5;
          this.stackConnectorRoot.add(pulse);
        }
      });

      this.addStackFlow(a, b, {
        kind: 'support',
        color: MAP_THEME.infrastructureBright,
        count: hub.core ? 5 : 2,
        speed: 0.18,
        size: hub.core ? 0.36 : 0.24,
      });
      this.addStackFlow(b, c, {
        kind: 'mapping',
        color: MAP_THEME.operationBright,
        count: hub.core ? 5 : 2,
        speed: 0.16,
        size: hub.core ? 0.34 : 0.22,
      });

      if (hub.core) {
        const side = hub.synergy ? 4.2 : (hub.lngLat[0] - 110) * 0.12;
        const midOp = new THREE.Vector3(
          (c.x + b.x) * 0.5 + side,
          (c.y + b.y) * 0.5 - 2.4,
          (c.z + b.z) * 0.55,
        );
        const midInfra = new THREE.Vector3(
          (c.x + a.x) * 0.5 - side * 0.7,
          (c.y + a.y) * 0.5 - 3.2,
          (c.z + a.z) * 0.38,
        );
        this.addStackArcFlow(c, midOp, b, {
          kind: 'feedback',
          color: MAP_THEME.digital,
          count: 4,
          speed: 0.14,
          size: 0.3,
        });
        this.addStackArcFlow(c, midInfra, a, {
          kind: 'feedback',
          color: MAP_THEME.digitalBright,
          count: hub.synergy ? 4 : 2,
          speed: 0.12,
          size: 0.28,
        });
      }
    });

    this.networkStackRoot.add(this.stackConnectorRoot);
  }

  addStackFlow(from, to, { kind, color, count, speed, size }) {
    const dir = new THREE.Vector3().subVectors(to, from);
    for (let i = 0; i < count; i += 1) {
      const sprite = this.makeStackParticle(color, size);
      const offset = i / count;
      sprite.position.lerpVectors(from, to, offset);
      this.stackConnectorRoot.add(sprite);
      this.stackFlows.push({
        kind,
        mesh: sprite,
        from: from.clone(),
        to: to.clone(),
        mid: null,
        offset,
        speed,
      });
    }
  }

  addStackArcFlow(from, mid, to, { kind, color, count, speed, size }) {
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const line = makeWideLine(curve.getPoints(24), {
      color: toNumberColor(color),
      width: 2.4,
      opacity: 0.55,
    });
    line.material.blending = THREE.AdditiveBlending;
    line.material.depthWrite = false;
    line.material.depthTest = false;
    line.material.transparent = true;
    line.renderOrder = 4;
    line.userData.feedbackArc = true;
    this.stackConnectorRoot.add(line);
    for (let i = 0; i < count; i += 1) {
      const sprite = this.makeStackParticle(color, size);
      const offset = i / count;
      sprite.position.copy(curve.getPoint(offset));
      this.stackConnectorRoot.add(sprite);
      this.stackFlows.push({
        kind,
        mesh: sprite,
        from: from.clone(),
        to: to.clone(),
        mid: mid.clone(),
        curve,
        offset,
        speed,
      });
    }
  }

  makeStackParticle(color, size = 0.25) {
    const material = new THREE.MeshBasicMaterial({
      color: toNumberColor(color),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12), material);
    mesh.renderOrder = 8;
    return mesh;
  }

  updateStackConnectors(elapsed = 0) {
    if (!this.stackConnectorRoot?.visible) return;
    this.stackFlows.forEach((flow) => {
      const speed = flow.speed * (flow.speedBoost ?? 1);
      const t = (flow.offset + elapsed * speed) % 1;
      if (flow.curve) flow.mesh.position.copy(flow.curve.getPoint(t));
      else flow.mesh.position.lerpVectors(flow.from, flow.to, t);
      const fade = t < 0.12 ? t / 0.12 : t > 0.88 ? (1 - t) / 0.12 : 1;
      if (flow.mesh.visible) flow.mesh.material.opacity = 0.35 + fade * 0.65;
      flow.mesh.scale.setScalar(0.8 + fade * 0.55);
    });
    this.stackConnectorRoot.children.forEach((child) => {
      if (child.material?.dashed) {
        child.material.dashOffset = -((elapsed * 0.42) % 2);
      }
      if (!child.userData?.pulse) return;
      const wave = 0.5 + 0.5 * Math.sin(elapsed * 1.25);
      child.scale.setScalar(1 + wave * 0.28);
      const base = child.userData.baseOpacity ?? 0.18;
      child.material.opacity = base + wave * 0.22;
    });
  }

  /**
   * 三层分解 Hover / 点击聚焦：突出一层并压暗另外两层，同时强化对应关系流。
   * focus: 'infrastructure' | 'operation' | 'digital' | 'all' | null
   */
  setExplodedLayerFocus(focus = null) {
    const next = focus === 'all' ? null : focus;
    this.explodedFocusLayer = next;
    const storyPresentation = Boolean(this.story?.active || this.story?.completed || this.shandongDemo?.active || this.shandongDemo?.completed || this.stateMachine.context?.story);
    if (this.stateMachine.state !== MAP_STATES.EXPLODED || this.selectedProvince || storyPresentation) return;

    if (!next) {
      this.setStoryLayerWeights({ infrastructure: 1, operation: 1, digital: 1 });
      this.setStackFlowEmphasis(null);
      return;
    }
    if (next === 'infrastructure') {
      this.setStoryLayerWeights({ infrastructure: 1, operation: 0.35, digital: 0.22 });
      this.setStackFlowEmphasis('support');
    } else if (next === 'operation') {
      this.setStoryLayerWeights({ infrastructure: 0.5, operation: 1, digital: 0.5 });
      this.setStackFlowEmphasis(['support', 'mapping']);
    } else if (next === 'digital') {
      this.setStoryLayerWeights({ infrastructure: 0.25, operation: 0.45, digital: 1 });
      this.setStackFlowEmphasis('feedback');
    }
  }

  setStackFlowEmphasis(kinds = null) {
    if (!this.stackConnectorRoot) return;
    const allow = kinds == null ? null : new Set(Array.isArray(kinds) ? kinds : [kinds]);
    this.stackFlows.forEach((flow) => {
      const on = !allow || allow.has(flow.kind);
      flow.mesh.visible = on;
      flow.speedBoost = on ? 1.35 : 0.55;
    });
    this.stackConnectorRoot.children.forEach((child) => {
      if (child.userData?.feedbackArc) child.visible = !allow || allow.has('feedback');
    });
  }

  /** 约 8 秒一轮的网络呼吸：基础 → 运营 → 数字 → 反哺 */
  updateExplodedBreathing(elapsed = 0) {
    if (this.stateMachine.state !== MAP_STATES.EXPLODED || this.selectedProvince) return;
    if (this.explodedFocusLayer) return;
    if (this.story?.active || this.story?.completed) return;
    const cycle = 8.5;
    const phase = (elapsed % cycle) / cycle;
    let weights = { infrastructure: 0.78, operation: 0.78, digital: 0.78 };
    let emphasis = null;
    if (phase < 0.22) {
      const t = phase / 0.22;
      weights = { infrastructure: 0.78 + 0.22 * t, operation: 0.72, digital: 0.55 };
      emphasis = 'support';
    } else if (phase < 0.48) {
      const t = (phase - 0.22) / 0.26;
      weights = { infrastructure: 0.7, operation: 0.78 + 0.22 * t, digital: 0.68 };
      emphasis = ['support', 'mapping'];
    } else if (phase < 0.72) {
      const t = (phase - 0.48) / 0.24;
      weights = { infrastructure: 0.5, operation: 0.72, digital: 0.78 + 0.22 * t };
      emphasis = 'mapping';
    } else {
      const t = (phase - 0.72) / 0.28;
      weights = {
        infrastructure: 0.55 + 0.2 * t,
        operation: 0.7 + 0.18 * t,
        digital: 1 - 0.15 * t,
      };
      emphasis = 'feedback';
    }
    this.setStoryLayerWeights(weights);
    this.setStackFlowEmphasis(emphasis);
  }

  setState(state, context = {}) {
    // 页面切换优先于开场演出，避免开场相机与目标页面相机互相拉扯。
    this.abortHomeIntro({ restoreScene: false });
    if ((this.story?.active || this.story?.completed) && !context.story) this.story.stop({ restoreScene: false });

    const networkFocus = state === MAP_STATES.FOCUS_INFRA
      || state === MAP_STATES.FOCUS_OPERATION
      || state === MAP_STATES.FOCUS_DIGITAL;
    // Top-bar 基础 / 运营 / 数字 always open that network's national page.
    // Provincial drill passes context.province and keeps the provincial session.
    if (networkFocus && !context.story && !context.province) {
      this.enterNationalNetwork(state, context);
      return;
    }

    // 首页与三层分解是三张网的组合视图：从任意单层页回来时把三层要素恢复成全量。
    const stackedView = state === MAP_STATES.COMBINED || state === MAP_STATES.EXPLODED;
    if (stackedView && !context.story && !context.province && !this.selectedProvince) {
      this.networkFocusLayer = null;
      this.ui?.resetStackedViewFilters?.();
    }

    this.stateMachine.setState(state, {
      ...context,
      province: context.province ?? this.selectedProvince ?? undefined,
    });

    // 点击“首页”每次都从开场地球重新开始；省级会话与业务流程走各自的视角，不重播。
    if (state === MAP_STATES.COMBINED && !context.story && !context.province && !this.selectedProvince) {
      this.replayHomeIntro();
    }
  }

  /**
   * Force a clean national 基础 / 运营 / 数字 page.
   * Used by top-bar switches so repeated province ↔ network hops cannot leave stale flags.
   */
  enterNationalNetwork(state, context = {}) {
    this.networkFocusLayer = stateToLayer[state] ?? null;
    this.clearProvinceView();
    this.ui?.resetNationalNetworkCockpits?.(this.networkFocusLayer);
    this.cameraUserOverride = false;
    this.savedLayerCamera = null;
    this.stateMachine.setState(state, {
      ...context,
      network: this.networkFocusLayer,
      force: true,
    });
  }

  clearProvinceView() {
    this.cameraUserOverride = false;
    this.selectedEntityId = null;
    this.selectedRouteId = null;
    this.penetration?.clear();
    this.ui.closeRightDrawer();
    this.layers.infrastructure.highlightRoute(null);
    this.hoverProvince(null);
    this.layers.operation?.setProvincialCityNetwork(null);
    this.layers.digital?.clearProvinceNetwork();
    this.setProvinceIsolation(false);
    this.setStoryContentIsolation(false);
    this.clearStoryProvinceFocus();
    this.exitRegionDemoView();
    this.setProvinceSheetSolidity(false);
    this.selectedProvince = null;
    this.provinceEntryState = null;
    this.provinceOperationView = false;
    this.provinceInfrastructureView = false;
    this.provinceDigitalView = false;
    this.baseMap.setProvinceFocus(null);
    this.provinceDrilldown?.clearProvince();
    this.lod.setFocus(null);
    this.ui.setSpatialContext(null);
    this.ui.closeProvincePlatform();
  }

  activeDemo() {
    if (this.shandongDemo?.active || this.shandongDemo?.completed) return this.shandongDemo;
    return this.story;
  }

  async toggleStory(storyId) {
    const runningDemo = this.activeDemo();
    const currentId = runningDemo?.story?.id;
    if (runningDemo?.active) {
      if (!storyId || currentId === storyId) {
        if (runningDemo.playing) runningDemo.pause();
        else runningDemo.resume();
        return;
      }
      runningDemo.stop({ restoreScene: false });
    }
    const startId = storyId || currentId;
    if (runningDemo?.completed) {
      runningDemo.stop({ restoreScene: false, hideUi: Boolean(storyId && storyId !== currentId) });
    }
    if (!startId) return;

    if (this.selectedProvince) this.resetView();
    this.ui.closeRightDrawer();

    if (startId === STORY_IDS.SHANDONG_REGION) {
      this.shandongDemo.start();
      return;
    }

    const story = await this.dataManager.loadStory(startId);
    this.story.start(story);
  }

  stopStory() {
    this.activeDemo()?.stop({ restoreScene: true });
  }

  captureViewSnapshot() {
    return {
      state: this.stateMachine.state,
      context: { ...(this.stateMachine.context ?? {}) },
      cameraUserOverride: this.cameraUserOverride,
      explodedFocusLayer: this.explodedFocusLayer,
      camera: {
        position: this.camera.position.clone(),
        target: this.controls.target.clone(),
        fov: this.camera.fov,
      },
    };
  }

  restoreViewSnapshot(snapshot, { animate = true } = {}) {
    if (!snapshot?.state) {
      this.cameraUserOverride = false;
      this.setState(MAP_STATES.COMBINED);
      return;
    }
    const { story: _story, ...context } = snapshot.context ?? {};
    this.cameraUserOverride = true;
    this.setStoryLayerWeights({ infrastructure: 1, operation: 1, digital: 1 });
    this.setStorySheetWeights({ infrastructure: 1, operation: 1, digital: 1 });
    this.setStoryContentIsolation(false);
    this.clearStoryProvinceFocus();
    this.stateMachine.setState(snapshot.state, { ...context, force: true });
    this.cameraDirector.moveTo(
      snapshot.camera.position,
      snapshot.camera.target,
      animate ? 0.85 : 0.001,
      { fov: snapshot.camera.fov },
    );
    this.cameraUserOverride = Boolean(snapshot.cameraUserOverride);
    if (snapshot.state === MAP_STATES.EXPLODED && !this.selectedProvince) {
      this.setExplodedLayerFocus(snapshot.explodedFocusLayer ?? null);
    }
  }

  applyState({ state, context }, animate = true) {
    const duration = animate ? (state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION ? 1 : 0.65) : 0.001;
    let config = layerState.combined;
    let baseOpacity = 0.72;
    const storyPresentation = Boolean(context.story || this.story?.active || this.story?.completed || this.shandongDemo?.active || this.shandongDemo?.completed);
    const provincePlatformOnly = Boolean(
      this.selectedProvince
      && !storyPresentation
      && !this.provinceOperationView
      && !this.provinceInfrastructureView
      && !this.provinceDigitalView,
    );
    if (this.regionDemoProvince) {
      config = {
        infrastructure: { ...layerState.combined.infrastructure, weight: 0 },
        operation: { ...layerState.combined.operation, weight: 0 },
        digital: { ...layerState.combined.digital, weight: 0 },
      };
      baseOpacity = 0.92;
    } else if (state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION || (provincePlatformOnly && state === MAP_STATES.FOCUS_DIGITAL)) {
      config = (this.selectedProvince || this.regionDemoProvince) ? layerState.provinceExploded : layerState.exploded;
      // 全国三层分解时基础设施会落到 baseSheet 之下；底图必须关掉，否则会出现灰色残影。
      baseOpacity = (this.selectedProvince || this.regionDemoProvince) ? 0.10 : 0;
    } else if (stateToLayer[state]) {
      config = this.focusLayerConfig(stateToLayer[state]);
      baseOpacity = 0.18;
    } else if (state === MAP_STATES.TASK_TRACE) {
      config = this.focusLayerConfig('operation');
      baseOpacity = 0.16;
    }

    // Keep the geographic planes parallel; the camera supplies the perspective.
    this.animations.to(this.networkStackRoot.rotation, { x: 0, y: 0, z: 0 }, duration);
    if (this.selectedProvince && !storyPresentation) {
      this.provinceDrilldown?.setRoleWeights(Object.fromEntries(
        Object.entries(config).map(([role, target]) => [role, target.weight]),
      ));
      this.controls.enabled = true;
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
    }
    const explodedNational = state === MAP_STATES.EXPLODED && !this.selectedProvince && !storyPresentation;
    if (this.stackConnectorRoot) {
      // These generic sample links explain the normal exploded view, but they
      // are unrelated to a shipment story and become visual noise there.
      this.stackConnectorRoot.visible = state === MAP_STATES.EXPLODED && !this.selectedProvince && !storyPresentation;
    }
    this.layers?.infrastructure?.setExplodedPresentation?.(explodedNational);
    this.layers?.operation?.setExplodedPresentation?.(explodedNational);
    this.layers?.digital?.setExplodedPresentation?.(explodedNational);
    // 首页只呈现主干骨架：通道、核心枢纽与主干业务流，避免开场就是满屏密集点线。
    const homeNational = state === MAP_STATES.COMBINED && !this.selectedProvince && !storyPresentation;
    this.homeOverviewActive = homeNational;
    this.layers?.infrastructure?.setHomeOverview?.(homeNational);
    this.layers?.operation?.setHomeOverview?.(homeNational);
    this.layers?.digital?.setHomeOverview?.(homeNational);
    this.setExplodedLayerIconsVisible(explodedNational);
    if (!explodedNational) {
      this.explodedFocusLayer = null;
      this.setStackFlowEmphasis(null);
    }
    this.provinceDrilldown?.setExploded(
      state === MAP_STATES.EXPLODED
      || state === MAP_STATES.PENETRATION
      || (provincePlatformOnly && state === MAP_STATES.FOCUS_DIGITAL),
    );
    Object.entries(config).forEach(([key, target]) => this.animateLayer(this.layers[key], target, duration));
    if (explodedNational) this.layers?.infrastructure?.setExplodedPresentation?.(true);
    this.updateLayerSheetOpacity(state, config);
    this.baseMap.setSheetOpacity(this.baseSheet, baseOpacity);
    // 全国分解态把底图藏到栈底以下，避免与基础设施板叠出灰色幽灵轮廓。
    if (this.baseSheet) {
      this.baseSheet.visible = baseOpacity > 0.01;
      this.baseSheet.position.z = this.baseSheet.visible ? -2.4 : -28;
    }
    if (this.regionDemoProvince) this.hideRegionDemoLayerSheets();
    this.ui.updateMode(state, stateToLayer[state] ?? null, context);
    if (!storyPresentation && !this.selectedProvince && stateToLayer[state]) {
      this.networkFocusLayer = stateToLayer[state];
    } else if (!storyPresentation && !stateToLayer[state] && !this.selectedProvince) {
      this.networkFocusLayer = null;
    }
    const focusedLayer = stateToLayer[state] ?? (state === MAP_STATES.TASK_TRACE ? 'operation' : null);
    // 首页与三层分解都要看到运营网和数字网的完整骨架，不能停在只有少数节点的 LOD 0。
    const stackedView = state === MAP_STATES.COMBINED
      || state === MAP_STATES.EXPLODED
      || state === MAP_STATES.PENETRATION;
    const stackedLod = stackedView ? Math.max(1, this.lod.level) : this.lod.level;
    const operationLod = this.selectedProvince ? 2 : focusedLayer === 'operation' ? Math.max(1, this.lod.level) : stackedLod;
    const digitalLod = this.selectedProvince ? 2 : focusedLayer === 'digital' ? Math.max(1, this.lod.level) : stackedLod;
    this.layers.operation?.setLod(operationLod, this.selectedProvince);
    this.layers.digital?.setLod(digitalLod, this.selectedProvince);
    const operationDashboardActive = state === MAP_STATES.FOCUS_OPERATION && !storyPresentation;
    this.layers.operation?.setDashboardActive(operationDashboardActive);
    if (operationDashboardActive) this.layers.operation?.setViewMode(this.ui.operationMode ?? 'overview');
    if (explodedNational && this.explodedFocusLayer) this.setExplodedLayerFocus(this.explodedFocusLayer);
    this.updateCameraForState(state, animate);
    if (state !== MAP_STATES.PENETRATION) this.penetration?.clear();
  }

  beginUserCamera() {
    this.abortHomeIntro();
    this.cameraDirector.cancelMove();
    this.cameraUserOverride = true;
  }

  beginFilterBatch() {
    this.filterBatch += 1;
    this.layers.infrastructure?.beginFocusBatch?.();
  }

  endFilterBatch() {
    this.filterBatch = Math.max(0, this.filterBatch - 1);
    this.layers.infrastructure?.endFocusBatch?.();
    if (!this.filterBatch && this.selectedProvince) this.maintainProvinceIsolation();
  }

  captureLayerCamera() {
    this.savedLayerCamera = {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
      fov: this.camera.fov,
    };
  }

  nudgeCameraZoom(factor = 1) {
    this.beginUserCamera();
    const offset = this.camera.position.clone().sub(this.controls.target);
    const next = THREE.MathUtils.clamp(
      offset.length() * factor,
      this.controls.minDistance,
      this.controls.maxDistance,
    );
    offset.setLength(next);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  resetProvinceFraming() {
    this.cameraUserOverride = false;
    this.updateCameraForState(this.stateMachine.state, true);
  }

  updateCameraForState(state, animate = true) {
    if (this.cameraUserOverride) return;
    if (this.regionDemoProvince && (this.shandongDemo?.active || this.shandongDemo?.completed)) return;
    if (this.selectedProvince) {
      const sheet = state === MAP_STATES.FOCUS_OPERATION
        ? (this.layers.operation?.sheet ?? this.baseSheet)
        : state === MAP_STATES.FOCUS_INFRA
          ? (this.layers.infrastructure?.sheet ?? this.baseSheet)
          : state === MAP_STATES.FOCUS_DIGITAL
            ? (this.layers.digital?.sheet ?? this.baseSheet)
            : this.baseSheet;
      sheet?.updateMatrixWorld?.(true);
      const bounds = this.baseMap.getProvinceBounds(this.selectedProvince, sheet);
      const viewport = this.canvas?.parentElement;
      if (bounds) this.cameraDirector.focusProvinceBounds(bounds, {
        exploded: state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION,
        cockpit: (state === MAP_STATES.FOCUS_OPERATION && this.provinceOperationView)
          || (state === MAP_STATES.FOCUS_INFRA && this.provinceInfrastructureView)
          || (state === MAP_STATES.FOCUS_DIGITAL && this.provinceDigitalView),
        fill: state === MAP_STATES.FOCUS_INFRA ? 1.18 : 1.08,
        duration: animate ? 0.85 : 0.001,
        viewWidth: viewport?.clientWidth ?? 0,
        viewHeight: viewport?.clientHeight ?? 0,
        aspect: this.camera.aspect,
      });
      return;
    }
    if (this.savedLayerCamera) {
      const saved = this.savedLayerCamera;
      this.savedLayerCamera = null;
      this.cameraDirector.moveTo(saved.position, saved.target, animate ? 0.85 : 0.001, { fov: saved.fov });
      return;
    }
    if ((state === MAP_STATES.FOCUS_OPERATION || state === MAP_STATES.FOCUS_INFRA || state === MAP_STATES.FOCUS_DIGITAL)
      && !this.stateMachine.context?.operationTaskId) {
      this.cameraDirector.setOperationOverview();
      return;
    }
    this.cameraDirector.setExploded(state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION);
  }

  updateLayerSheetOpacity(state, config) {
    const solidSheets = Boolean(this.selectedProvince) || state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION;
    this.layers.infrastructure?.setStackOcclusion(solidSheets);
    Object.entries(config).forEach(([key, target]) => {
      const sheet = this.layers[key]?.sheet;
      if (!sheet) return;
      const factor = this.homeOverviewActive ? (homeSheetFactor[key] ?? 1) : 1;
      const sheetOpacity = solidSheets ? 1 : sheet.userData.baseOpacity * target.weight * factor;
      this.baseMap.setSheetOpacity(sheet, sheetOpacity, { solid: solidSheets });
    });
  }

  enforceStorySheetSolidity() {
    Object.entries(this.layers).forEach(([role, layer]) => {
      if (!layer?.sheet) return;
      const amount = THREE.MathUtils.clamp(Number(this.storySheetWeights[role] ?? 1), 0, 1);
      layer.visible = true;
      this.baseMap.setSheetOpacity(layer.sheet, amount, { solid: amount > 0.995 });
    });
  }

  setStoryLayerWeights(weights = {}) {
    Object.entries(this.layers).forEach(([role, layer]) => {
      const amount = THREE.MathUtils.clamp(Number(weights[role] ?? 0), 0, 1);
      this.storyLayerWeights[role] = amount;
      layer.setVisualWeight(amount, { fade: amount < 0.995, preserveSheet: true });
      // Keep the layer root alive so its map sheet remains visible even when
      // routes, facilities and nodes are muted for the current story stage.
      layer.visible = true;
    });
    this.provinceDrilldown?.setRoleWeights(weights);
    this.enforceStorySheetSolidity();
    // setVisualWeight → refreshVisibility can resurrect national flows; keep story isolation sticky.
    if (this.story?.active || this.story?.completed || this.shandongDemo?.active || this.shandongDemo?.completed || this.stateMachine.context?.story) {
      this.setStoryContentIsolation(true);
    }
  }

  setStorySheetWeights(weights = {}) {
    Object.entries(this.layers).forEach(([role, layer]) => {
      const amount = THREE.MathUtils.clamp(Number(weights[role] ?? this.storySheetWeights[role] ?? 1), 0, 1);
      this.storySheetWeights[role] = amount;
      layer.visible = true;
      if (layer.sheet) this.baseMap.setSheetOpacity(layer.sheet, amount, { solid: amount > 0.995 });
    });
  }

  setStoryProvinceStack(compact, duration = 0.7) {
    const config = compact ? layerState.provinceExploded : layerState.exploded;
    Object.entries(config).forEach(([key, target]) => this.animateLayer(this.layers[key], target, duration));
    this.setStoryLayerWeights({ infrastructure: 1, operation: 1, digital: 1 });
    this.setStorySheetWeights({ infrastructure: 1, operation: 1, digital: 1 });
  }

  setStoryContentIsolation(enabled) {
    const active = Boolean(enabled);
    this.layers.operation?.setStoryNationalSuppressed?.(active);
    this.layers.digital?.setStoryNationalSuppressed?.(active);
    this.layers.infrastructure?.setStoryNationalSuppressed?.(active);
    const objects = this.getNationalContentObjects();
    if (active) {
      objects.forEach((object) => {
        if (!this.storyContentVisibility.has(object)) this.storyContentVisibility.set(object, object.visible);
        object.visible = false;
      });
      return;
    }
    this.storyContentVisibility.forEach((visible, object) => { object.visible = visible; });
    this.storyContentVisibility.clear();
  }

  hideRegionDemoLayerSheets() {
    Object.values(this.layers ?? {}).forEach((layer) => {
      if (layer?.sheet) layer.sheet.visible = false;
    });
  }

  showRegionDemoLayerSheets() {
    Object.values(this.layers ?? {}).forEach((layer) => {
      if (layer?.sheet) layer.sheet.visible = true;
    });
  }

  getRegionContextBounds(provinceName, sheet = this.baseSheet) {
    const bounds = this.baseMap.getProvinceBounds(provinceName, sheet);
    if (!bounds) return null;
    const expanded = bounds.clone();
    const size = bounds.getSize(new THREE.Vector3());
    expanded.min.x -= size.x * 0.16;
    expanded.max.x += size.x * 0.18;
    expanded.min.y -= size.y * 0.18;
    expanded.max.y += size.y * 0.16;
    return expanded;
  }

  enterRegionDemoView(provinceName, { exploded = false } = {}) {
    if (!provinceName) return null;
    const province = this.data.provinceBoundaries?.provinces?.[provinceName];
    if (!province) return null;
    this.regionDemoProvince = provinceName;
    this.setStoryContentIsolation(true);
    this.baseMap.setProvinceFocus(provinceName, { keepContext: true });
    const hideObjects = this.getNationalContentObjects();
    hideObjects.forEach((object) => {
      if (!this.storyContentVisibility.has(object)) this.storyContentVisibility.set(object, object.visible);
      object.visible = false;
    });
    const bounds = this.baseMap.getProvinceBounds(provinceName, this.baseSheet);
    const center = bounds?.getCenter(new THREE.Vector3()) ?? new THREE.Vector3();
    this.provinceDrilldown?.showProvince(provinceName, center, {
      sandbox: true,
      sandboxRole: 'infrastructure',
      showLabels: true,
      spotlight: false,
      hostSheet: this.baseSheet,
      regionDemo: true,
    });
    this.setFloorHudAmount(0);
    this.provinceDrilldown?.setExploded(false);
    this.lod.setFocus(provinceName);
    this.ui.setSpatialContext(provinceName);
    this.ui.setRegionDemoPure?.(true);
    if (this.baseSheet) {
      this.baseSheet.visible = true;
      this.baseSheet.position.z = -2.4;
      this.baseMap.setSheetOpacity(this.baseSheet, 0.92);
    }
    this.hideRegionDemoLayerSheets();
    return bounds;
  }

  exitRegionDemoView() {
    if (!this.regionDemoProvince && !this.ui?.root?.querySelector('.region-demo-pure')) {
      this.ui.setRegionDemoPure?.(false);
      return;
    }
    this.regionDemoProvince = null;
    this.baseMap.setProvinceFocus(null);
    this.provinceDrilldown?.clearProvince();
    this.setProvinceSheetSolidity(false);
    this.showRegionDemoLayerSheets();
    this.lod.setFocus(null);
    this.ui.setSpatialContext(null);
    this.ui.setRegionDemoPure?.(false);
    if (this.baseSheet) {
      this.baseSheet.visible = true;
      this.baseSheet.position.z = -2.4;
    }
    this.setFloorHudAmount(this.homeIntroReveal ?? 1);
  }

  focusRegionDemoCamera(duration = 2.2, { fromNational = false } = {}) {
    if (!this.regionDemoProvince) return;
    const sheet = this.baseSheet;
    sheet?.updateMatrixWorld?.(true);
    const bounds = this.getRegionContextBounds(this.regionDemoProvince, sheet);
    if (!bounds) return;
    if (fromNational) {
      this.cameraDirector.snapTo(this.cameraDirector.homePosition, this.cameraDirector.homeTarget, 35);
    }
    this.cameraDirector.focusProvinceBounds(bounds, {
      context: true,
      duration,
      viewWidth: this.canvas?.parentElement?.clientWidth ?? 0,
      viewHeight: this.canvas?.parentElement?.clientHeight ?? 0,
      aspect: this.camera.aspect,
    });
  }

  focusStoryProvince(provinceName) {
    if (!provinceName || this.selectedProvince) return;
    const province = this.data.provinceBoundaries?.provinces?.[provinceName];
    if (!province) return;
    if (this.storyProvinceFocus === provinceName && this.provinceDrilldown?.currentProvince === provinceName) return;
    this.storyProvinceFocus = provinceName;
    this.story?.setProvinceStoryGeometry?.(true);
    this.setStoryProvinceStack(true, 0.7);
    this.baseMap.setProvinceFocus(provinceName);
    const bounds = this.baseMap.getProvinceBounds(provinceName, this.baseSheet);
    const center = bounds?.getCenter(new THREE.Vector3()) ?? new THREE.Vector3();
    this.provinceDrilldown?.showProvince(provinceName, center);
    this.provinceDrilldown?.setExploded(true);
    this.ui.setSpatialContext(provinceName);
  }

  clearStoryProvinceFocus({ restoreCamera = false } = {}) {
    this.story?.setProvinceStoryGeometry?.(false);
    if (!this.storyProvinceFocus) return;
    this.storyProvinceFocus = null;
    this.setStoryProvinceStack(false, 0.7);
    this.baseMap.setProvinceFocus(null);
    this.provinceDrilldown?.clearProvince();
    this.ui.setSpatialContext(null);
    if (restoreCamera) this.cameraDirector.setExploded(true);
  }

  focusLayerConfig(activeLayer) {
    const order = ['infrastructure', 'operation', 'digital'];
    const activeIndex = order.indexOf(activeLayer);
    return Object.fromEntries(order.map((layer, index) => {
      if (layer === activeLayer) return [layer, { x: 0, y: 0, z: 8, scale: 1.06, weight: 1 }];
      const direction = index < activeIndex ? -1 : 1;
      // Focus mode is a strict single-layer view. Hiding the whole inactive
      // layer also covers transport lines and facility points added later.
      return [layer, { x: 0, y: direction * (20 + Math.abs(index - activeIndex) * 6), z: -10, scale: 0.74, weight: 0 }];
    }));
  }

  animateLayer(layer, target, duration) {
    this.animations.to(layer.position, { x: target.x ?? 0, y: target.y, z: target.z }, duration);
    this.animations.to(layer.scale, { x: target.scale, y: target.scale, z: target.scale }, duration);
    layer.setVisualWeight(target.weight);
  }

  getProvinceSummary(provinceName) {
    const province = this.data.provinceBoundaries?.provinces?.[provinceName];
    if (!province) return null;
    const facilityLayers = this.data.infrastructure?.facilities?.layers ?? [];
    const normalizedProvince = normalizeProvinceName(provinceName);
    const counts = Object.fromEntries(facilityLayers.map((layer) => [
      layer.id,
      layer.points.filter((feature) => normalizeProvinceName(feature.province) === normalizedProvince).length,
    ]));
    return {
      province: provinceName,
      adcode: province.adcode,
      cityCount: province.cities.length,
      cities: province.cities.map((city) => city.name),
      cityRecords: province.cities.map((city) => ({ name: city.name, center: city.center })),
      nationalHubs: counts.nationalHubs ?? 0,
      coldChainBases: counts.coldChainBases ?? 0,
      logisticsParks: counts.logisticsParks ?? 0,
      entityCount: this.data.entities.filter((entity) => entity.province === provinceName).length,
    };
  }

  getNationalContentObjects({ keepOperation = false, keepInfrastructure = false } = {}) {
    return [
      keepInfrastructure ? null : this.layers.infrastructure?.routeRoot,
      keepInfrastructure ? null : this.layers.infrastructure?.transportRoot,
      keepInfrastructure ? null : this.layers.infrastructure?.facilityRoot,
      keepInfrastructure ? null : this.layers.infrastructure?.nodeRoot,
      keepInfrastructure ? null : this.layers.infrastructure?.cityRoot,
      keepInfrastructure ? null : this.layers.infrastructure?.skeletonRoot,
      keepInfrastructure ? null : this.layers.infrastructure?.outboundRoot,
      keepInfrastructure ? null : this.layers.infrastructure?.weakRoot,
      keepOperation ? null : this.layers.operation?.flowRoot,
      keepOperation ? null : this.layers.operation?.nodeRoot,
      keepOperation ? null : this.layers.operation?.labelRoot,
      keepOperation ? null : this.layers.operation?.alert,
      this.layers.digital?.relationRoot,
      this.layers.digital?.nodeRoot,
    ].filter(Boolean);
  }

  setProvinceIsolation(enabled) {
    if (!enabled) {
      this.provinceIsolationVisibility.forEach((visible, object) => { object.visible = visible; });
      this.provinceIsolationVisibility.clear();
      this.layers.operation?.setLod(this.lod.level ?? 0, null);
      this.layers.digital?.setLod(this.lod.level ?? 0, null);
      this.layers.infrastructure?.setFocusProvince(null);
      return;
    }

    const hideObjects = this.getNationalContentObjects({
      keepOperation: this.provinceOperationView,
      keepInfrastructure: this.provinceInfrastructureView,
    });
    const hideSet = new Set(hideObjects);
    // Restore objects that were hidden under a previous keep-flag but should stay visible now.
    this.provinceIsolationVisibility.forEach((originalVisible, object) => {
      if (!hideSet.has(object)) object.visible = originalVisible;
    });
    hideObjects.forEach((object) => {
      if (!this.provinceIsolationVisibility.has(object)) {
        this.provinceIsolationVisibility.set(object, object.visible);
      }
      object.visible = false;
    });
    this.layers.operation?.setLod(2, this.selectedProvince);
    this.layers.digital?.setLod(2, this.selectedProvince);
    this.layers.infrastructure?.setFocusProvince(
      this.provinceInfrastructureView ? this.selectedProvince : null,
      this.provincePointTest(),
    );
  }

  maintainProvinceIsolation() {
    if (!this.selectedProvince) return;
    this.setProvinceIsolation(true);
  }

  setProvinceSheetSolidity(enabled) {
    Object.values(this.layers).forEach((layer) => {
      const sheet = layer?.sheet;
      if (!sheet) return;
      sheet.userData.materials.forEach((material) => {
        material.userData.forceOpaque = Boolean(enabled);
      });
      if (enabled) this.baseMap.setSheetOpacity(sheet, 1, { solid: true });
    });
  }

  provincePointTest() {
    if (!this.provinceInfrastructureView || !this.selectedProvince) return null;
    const provinceName = this.selectedProvince;
    return (x, y) => this.baseMap.containsProvincePoint(provinceName, x, y);
  }

  drillProvince(provinceName) {
    // 三层分解页不做省级下钻，避免打断全国三层协同关系阅读。
    if (this.stateMachine.state === MAP_STATES.EXPLODED) return;
    const summary = this.getProvinceSummary(provinceName);
    if (!summary) return;
    const layer = resolveDrillNetworkLayer({
      selectedProvince: this.selectedProvince,
      state: this.stateMachine.state,
      provinceOperationView: this.provinceOperationView,
      provinceInfrastructureView: this.provinceInfrastructureView,
      provinceDigitalView: this.provinceDigitalView,
    });
    const stayOnOperation = layer === 'operation';
    const stayOnInfrastructure = layer === 'infrastructure';
    const stayOnDigital = layer === 'digital';
    if (
      this.selectedProvince === provinceName
      && this.provinceOperationView === stayOnOperation
      && this.provinceInfrastructureView === stayOnInfrastructure
      && this.provinceDigitalView === stayOnDigital
    ) return;
    if (this.selectedProvince) this.clearProvinceView();

    this.captureLayerCamera();
    this.cameraUserOverride = false;
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: false });
    const currentState = stayOnOperation
      ? MAP_STATES.FOCUS_OPERATION
      : stayOnInfrastructure
        ? MAP_STATES.FOCUS_INFRA
        : stayOnDigital
          ? MAP_STATES.FOCUS_DIGITAL
          : (this.stateMachine.state ?? MAP_STATES.EXPLODED);
    this.provinceEntryState = currentState;
    this.networkFocusLayer = stayOnOperation
      ? 'operation'
      : stayOnInfrastructure
        ? 'infrastructure'
        : stayOnDigital
          ? 'digital'
          : this.networkFocusLayer;
    this.selectedEntityId = null;
    this.selectedRouteId = null;
    this.hoveredProvince = null;
    this.penetration?.clear();
    this.layers.infrastructure.highlightRoute(null);
    this.ui.closeRightDrawer();
    this.selectedProvince = provinceName;
    this.provinceOperationView = stayOnOperation;
    this.provinceInfrastructureView = stayOnInfrastructure;
    this.provinceDigitalView = stayOnDigital;
    const singleLayerProvince = stayOnOperation || stayOnInfrastructure || stayOnDigital;
    this.beginFilterBatch();
    this.setProvinceIsolation(true);
    this.baseMap.setProvinceFocus(provinceName, { sandbox: singleLayerProvince });
    this.setProvinceSheetSolidity(true);
    const focusSheet = stayOnInfrastructure
      ? this.layers.infrastructure?.sheet
      : stayOnOperation
        ? this.layers.operation?.sheet
        : stayOnDigital
          ? this.layers.digital?.sheet
          : this.baseSheet;
    const bounds = this.baseMap.getProvinceBounds(provinceName, focusSheet ?? this.baseSheet);
    const center = bounds?.getCenter(new THREE.Vector3()) ?? new THREE.Vector3();
    this.provinceDrilldown.showProvince(provinceName, center, singleLayerProvince
      ? {
        sandbox: true,
        sandboxRole: stayOnInfrastructure ? 'infrastructure' : stayOnDigital ? 'digital' : 'operation',
      }
      : {});
    this.lod.setFocus(provinceName);
    this.ui.setSpatialContext(provinceName);
    this.ui.openProvincePlatform(summary, {
      operationCockpit: stayOnOperation,
      infrastructureCockpit: stayOnInfrastructure,
      digitalCockpit: stayOnDigital,
    });
    if (stayOnOperation) {
      this.layers.operation?.setProvincialCityNetwork(this.ui.getOperationDashboard()?.cityNetwork);
    }
    if (stayOnInfrastructure) {
      const analysis = this.ui.getInfrastructureDashboard()?.analysis;
      this.layers.infrastructure?.setProvinceAnalysis(analysis);
      this.provinceDrilldown?.setWeakCities([]);
      this.provinceDrilldown?.setWeakHighlight(false);
      this.ui.setInfrastructureMode('overview', { syncRuntime: true });
    }
    if (stayOnDigital) {
      this.layers.digital?.setProvinceNetwork(this.ui.getDigitalDashboard()?.digitalNetwork);
      this.ui.setDigitalMode('overview', { syncRuntime: true });
    }
    this.endFilterBatch();
    const nextState = stayOnOperation
      ? MAP_STATES.FOCUS_OPERATION
      : stayOnInfrastructure
        ? MAP_STATES.FOCUS_INFRA
        : stayOnDigital
          ? MAP_STATES.FOCUS_DIGITAL
          : MAP_STATES.EXPLODED;
    this.setState(nextState, { province: provinceName });
  }

  hoverProvince(provinceName) {
    if (this.hoveredProvince === provinceName || this.selectedProvince) return;
    if (this.hoveredProvince) this.baseMap.setProvinceState(this.hoveredProvince, { hovered: false });
    this.hoveredProvince = provinceName || null;
    if (this.hoveredProvince) this.baseMap.setProvinceState(this.hoveredProvince, { hovered: true });
  }

  returnFromProvince() {
    if (!this.selectedProvince) {
      this.resetView();
      return;
    }
    this.resetView({ returnToEntry: true });
  }

  resetView({ returnToEntry = false } = {}) {
    this.cameraUserOverride = false;
    const interruptedStory = Boolean(this.story?.active || this.story?.completed || this.shandongDemo?.active || this.shandongDemo?.completed);
    const drilledProvince = this.selectedProvince;
    const destinationState = returnToEntry && drilledProvince
      ? (this.provinceEntryState ?? MAP_STATES.COMBINED)
      : MAP_STATES.COMBINED;
    if (interruptedStory) {
      this.story.stop({ restoreScene: false });
      this.shandongDemo?.stop({ restoreScene: false });
    }
    this.clearProvinceView();
    if (drilledProvince || interruptedStory || this.stateMachine.state === MAP_STATES.PENETRATION || this.stateMachine.state === MAP_STATES.TASK_TRACE) {
      this.setState(destinationState);
    } else {
      this.cameraDirector.reset();
    }
  }

  getProvinceDigitalNode(id) {
    if (!this.provinceDigitalView) return null;
    return this.ui?.getDigitalDashboard?.()?.digitalNetwork?.nodes?.find((node) => node.id === id) ?? null;
  }

  selectEntity(entityId) {
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: true });
    const provinceNode = this.getProvinceDigitalNode(entityId);
    if (provinceNode) {
      this.selectedEntityId = entityId;
      this.ui.openProvinceDigitalEntity(provinceNode);
      return;
    }
    const entity = this.registry.get(entityId);
    if (!entity) return;
    this.selectedEntityId = entityId;
    this.penetration.highlightOnly(entityId);
    const point = this.projector.fromEntity(entity);
    this.cameraDirector.focusPoint(point, { distance: 64 });
    this.ui.openEntity(entity);
  }

  async activatePenetration(entityId = this.selectedEntityId) {
    if (!entityId) return;
    const entity = await this.dataManager.loadPenetration(entityId);
    this.selectedEntityId = entityId;
    this.setState(MAP_STATES.PENETRATION, { entityId });
    this.penetration.activate(entityId);
    this.ui.openPenetration(entity ?? this.registry.get(entityId));
  }

  focusEntityLayer(layer) {
    const state = {
      infrastructure: MAP_STATES.FOCUS_INFRA,
      operation: MAP_STATES.FOCUS_OPERATION,
      digital: MAP_STATES.FOCUS_DIGITAL,
    }[layer];
    if (!state) return;
    const entityId = this.selectedEntityId;
    this.setState(state, { entityId });
    if (entityId) this.penetration.highlightOnly(entityId);
  }

  focusRoute(routeId) {
    const route = this.data.routes.find((item) => item.id === routeId);
    if (!route) return;
    this.selectedRouteId = routeId;
    this.setState(MAP_STATES.FOCUS_INFRA, { routeId });
    this.layers.infrastructure.highlightRoute(routeId);
    const points = this.projector.routeSegments(route).flat();
    if (points.length) {
      const box = new THREE.Box3().setFromPoints(points);
      this.cameraDirector.focusBounds(box);
    }
    this.ui.openRoute(route);
  }

  selectInfrastructureFeature(feature) {
    if (!feature) return;
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: true });
    this.setState(MAP_STATES.FOCUS_INFRA, { featureId: feature.id });
    const point = this.projector.fromLngLat(feature.coordinates);
    this.cameraDirector.focusPoint(point, { distance: 62 });
    this.ui.openInfrastructureFeature(feature);
  }

  async selectTask(taskId) {
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: true });
    const task = await this.dataManager.loadTaskTrace(taskId);
    if (!task) return;
    this.setState(MAP_STATES.TASK_TRACE, { taskId });
    this.layers.infrastructure.highlightRoute('A2');
    this.ui.openTask(task);
  }

  setOperationViewMode(mode = 'overview') {
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: true });
    this.layers.operation?.setViewMode(mode);
    if (this.stateMachine.state !== MAP_STATES.FOCUS_OPERATION) {
      this.setState(MAP_STATES.FOCUS_OPERATION);
      return;
    }
    if (mode === 'alerts' && !this.selectedProvince) {
      const exception = this.layers.operation?.relations.find((item) => item.relation.type === 'exception');
      if (exception) {
        const points = [exception.curve.getPointAt(0), exception.curve.getPointAt(0.5), exception.curve.getPointAt(1)];
        this.cameraDirector.focusBounds(new THREE.Box3().setFromPoints(points), 0.72);
        return;
      }
    }
    this.updateCameraForState(MAP_STATES.FOCUS_OPERATION, true);
  }

  focusOperationTask(taskId, { openDrawer = true } = {}) {
    const task = this.ui?.getOperationDashboard?.()?.tasks?.find((item) => item.id === taskId)
      ?? this.data.operationDashboard?.tasks?.find((item) => item.id === taskId);
    if (!task) return;
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: true });
    if (this.provinceOperationView && this.selectedProvince) {
      this.ui.setOperationMode('tasks', { syncRuntime: false });
      this.layers.operation?.setViewMode('tasks');
      this.updateCameraForState(MAP_STATES.FOCUS_OPERATION, true);
      if (openDrawer) this.ui.openOperationTask(task);
      else this.ui.closeRightDrawer();
      return;
    }
    this.setState(MAP_STATES.FOCUS_OPERATION, { operationTaskId: task.id });
    this.ui.setOperationMode('tasks', { syncRuntime: false });
    this.layers.operation?.setLod(2, null);
    this.layers.operation?.setTaskFocus(task.relationIds);
    const selectedRelations = this.layers.operation?.relations.filter((item) => task.relationIds.includes(item.relation.id)) ?? [];
    const points = selectedRelations.flatMap((item) => [item.curve.getPointAt(0), item.curve.getPointAt(0.5), item.curve.getPointAt(1)]);
    if (points.length) this.cameraDirector.focusBounds(new THREE.Box3().setFromPoints(points), 0.82);
    if (openDrawer) this.ui.openOperationTask(task);
    else this.ui.closeRightDrawer();
  }

  clearOperationTask() {
    this.layers.operation?.setTaskFocus([]);
    this.layers.operation?.setViewMode('overview');
    if (this.provinceOperationView && this.selectedProvince) {
      this.layers.operation?.setLod(2, this.selectedProvince);
    } else {
      this.layers.operation?.setLod(Math.max(1, this.lod.level), null);
    }
    this.ui.setOperationMode('overview', { syncRuntime: false });
    this.ui.closeRightDrawer();
    this.updateCameraForState(MAP_STATES.FOCUS_OPERATION, true);
  }

  setLayerFilter(layer, id, enabled) {
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: false });
    this.layers[layer]?.setFilter(id, enabled);
    if (!this.filterBatch) this.maintainProvinceIsolation();
    if (layer === 'infrastructure' && this.provinceInfrastructureView) {
      this.provinceDrilldown?.setWeakHighlight(false);
    }
  }

  setLayerFilters(layer, ids, enabled) {
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: false });
    this.beginFilterBatch();
    ids.forEach((id) => this.layers[layer]?.setFilter(id, enabled));
    this.endFilterBatch();
    if (layer === 'infrastructure' && this.provinceInfrastructureView) {
      this.provinceDrilldown?.setWeakHighlight(false);
    }
  }

  getInteractiveNodeMeshes() {
    if (this.provinceDigitalView) {
      const meshes = [];
      this.layers.digital?.provinceNodes?.forEach((node) => {
        if (!node.visible) return;
        node.traverse((object) => { if (object.isMesh) meshes.push(object); });
      });
      return meshes;
    }
    if (this.selectedProvince && !this.provinceOperationView && !this.provinceInfrastructureView) return [];
    const meshes = [];
    this.registry.references.forEach((references) => Object.values(references).forEach((node) => {
      if (!node.visible || !node.parent?.visible) return;
      node.traverse((object) => { if (object.isMesh) meshes.push(object); });
    }));
    if (this.provinceOperationView) {
      meshes.push(...(this.layers.operation?.getSandboxPickMeshes?.() ?? []));
    }
    if (this.provinceInfrastructureView) {
      this.layers.infrastructure?.cityNodes?.forEach((node) => {
        node.traverse((object) => { if (object.isMesh && object.visible) meshes.push(object); });
      });
    }
    return meshes;
  }

  getInteractiveRouteObjects() {
    if (this.selectedProvince && this.provinceOperationView) {
      return this.layers.operation?.getSandboxPickLines?.() ?? [];
    }
    if (this.selectedProvince && this.provinceInfrastructureView) {
      const state = this.stateMachine.state;
      if (stateToLayer[state] && stateToLayer[state] !== 'infrastructure') return [];
      const routes = [];
      this.layers.infrastructure.routeRoot.traverse((object) => {
        if (!object.isLine2 || !object.userData.routeId) return;
        let ancestor = object;
        while (ancestor && ancestor !== this.layers.infrastructure) {
          if (!ancestor.visible) return;
          ancestor = ancestor.parent;
        }
        routes.push(object);
      });
      return routes;
    }
    if (this.selectedProvince) return [];
    const state = this.stateMachine.state;
    if (stateToLayer[state] && stateToLayer[state] !== 'infrastructure') return [];
    if (state === MAP_STATES.TASK_TRACE) return [];
    const routes = [];
    this.layers.infrastructure.routeRoot.traverse((object) => {
      if (!object.isLine2 || !object.userData.routeId) return;
      let ancestor = object;
      while (ancestor && ancestor !== this.layers.infrastructure) {
        if (!ancestor.visible) return;
        ancestor = ancestor.parent;
      }
      routes.push(object);
    });
    return routes;
  }

  getInteractiveFacilityObjects() {
    if (this.selectedProvince && !this.provinceInfrastructureView) return [];
    const state = this.stateMachine.state;
    if (stateToLayer[state] && stateToLayer[state] !== 'infrastructure') return [];
    if (state === MAP_STATES.TASK_TRACE || !this.layers.infrastructure.visible) return [];
    return [...this.layers.infrastructure.facilityObjects.values(), ...(this.layers.infrastructure.freightObjects?.values() ?? [])]
      .filter((object) => object.visible);
  }

  getInteractiveProvinceMeshes() {
    // 首页与三层分解只做全国总览，省级下钻只在基础/运营/数字单层页提供。
    if (this.stateMachine.state === MAP_STATES.COMBINED || this.stateMachine.state === MAP_STATES.EXPLODED) return [];
    const activeLayer = stateToLayer[this.stateMachine.state];
    const activeSheet = activeLayer ? this.layers[activeLayer]?.sheet : this.baseSheet;
    return this.baseMap?.getInteractiveProvinceMeshes(activeSheet) ?? [];
  }

  handleEscape() {
    if (this.story?.active || this.story?.completed) {
      this.story.stop({ restoreScene: true });
      return;
    }
    if (this.stateMachine.state === MAP_STATES.PENETRATION || this.stateMachine.state === MAP_STATES.TASK_TRACE) {
      this.penetration.clear();
      this.ui.closeRightDrawer();
      this.setState(MAP_STATES.EXPLODED);
      return;
    }
    if (this.ui.isRightDrawerOpen()) {
      this.ui.closeRightDrawer();
      return;
    }
    if (this.selectedProvince) {
      this.returnFromProvince();
      return;
    }
    this.setState(MAP_STATES.COMBINED);
  }

  updateOperationOverlays() {
    if (!this.ui?.syncOperationOverlays) return;
    const storyPresentation = Boolean(this.story?.active || this.story?.completed || this.shandongDemo?.active || this.shandongDemo?.completed);
    const state = this.stateMachine.state;
    const layerName = stateToLayer[state];
    const dashboardActive = (state === MAP_STATES.FOCUS_OPERATION
      || state === MAP_STATES.FOCUS_INFRA
      || state === MAP_STATES.FOCUS_DIGITAL)
      && !storyPresentation
      && !this.ui.isRightDrawerOpen?.()
      && !(this.selectedProvince
        && !this.provinceOperationView
        && !this.provinceInfrastructureView
        && !this.provinceDigitalView);
    const layer = this.layers?.[layerName];
    const overlays = layerName === 'operation'
      ? (this.ui?.getOperationDashboard?.()?.mapOverlays ?? this.data?.operationDashboard?.mapOverlays)
      : layerName === 'infrastructure'
        ? (this.ui?.getInfrastructureDashboard?.()?.mapOverlays ?? this.data?.infrastructureDashboard?.mapOverlays)
        : layerName === 'digital'
          ? (this.ui?.getDigitalDashboard?.()?.mapOverlays ?? this.data?.digitalDashboard?.mapOverlays)
          : null;
    if (!dashboardActive || !overlays || !layer) {
      this.ui.syncOperationOverlays([]);
      return;
    }
    const width = this.canvas?.parentElement?.clientWidth ?? 0;
    const height = this.canvas?.parentElement?.clientHeight ?? 0;
    if (!width || !height) {
      this.ui.syncOperationOverlays([]);
      return;
    }
    this.camera.updateMatrixWorld();
    // 兜底坐标是图层局部值：聚焦态整层带 Z 位移与缩放，
    // 必须过一遍图层矩阵，屏幕标签才会落在对应要素上。
    layer.updateWorldMatrix(true, false);
    const onLayer = (coordinate, z) => (Array.isArray(coordinate)
      ? layer.localToWorld(this.projector.fromLngLat(coordinate, z))
      : null);
    const project = (world) => {
      if (!world) return null;
      const clip = world.clone().project(this.camera);
      if (clip.z < -1 || clip.z > 1) return null;
      return { x: (clip.x + 1) * 0.5 * width, y: (1 - clip.y) * 0.5 * height };
    };
    const inMap = (screen) => screen
      && screen.x > 348 && screen.x < width - 348
      && screen.y > (this.selectedProvince ? 108 : 72) && screen.y < height - 88;
    const taskNodes = layerName === 'operation' ? (this.layers.operation.taskNodeIds ?? new Set()) : new Set();
    const hideAlerts = layerName === 'operation' && this.ui.operationMode === 'alerts';
    const provincial = Boolean(this.selectedProvince);
    const hideProvincialInfraCards = layerName === 'infrastructure' && provincial;
    const items = [
      ...(hideProvincialInfraCards ? [] : (overlays.hubs ?? [])).map((hub) => {
        const provincialCard = Boolean(this.selectedProvince && layerName === 'infrastructure' && hub.level);
        const screen = project(
          layer.getProvinceEntityWorldPosition?.(hub.id)
          ?? layer.getEntityWorldPosition?.(hub.id)
          ?? layer.getFeatureWorldPosition?.(hub.id)
          ?? layer.getCityWorldPosition?.(hub.id)
          ?? onLayer(hub.center, 2.55),
        );
        const belongsToTask = !taskNodes.size || taskNodes.has(hub.id);
        return {
          id: hub.id,
          kind: 'hub',
          x: screen?.x ?? 0,
          y: screen?.y ?? 0,
          width: layerName === 'digital' ? 124 : provincialCard ? 176 : provincial ? 132 : 168,
          height: provincialCard ? (hub.kind === 'capital' ? 176 : 156) : 72,
          visible: !hideAlerts && belongsToTask && inMap(screen),
        };
      }),
      ...((layerName === 'digital' ? overlays.corridors : []) ?? []).map((corridor) => {
        // 省级通道标签贴在出省箭头尖端，全国通道标签落在通道中心。
        const screen = project(
          layer.getProvinceCorridorWorldPosition?.(corridor.id)
          ?? onLayer(corridor.center, 2.62),
        );
        const filterId = provincial ? 'crossProvince' : 'corridors';
        return {
          id: corridor.id,
          kind: 'corridor',
          x: screen?.x ?? 0,
          y: screen?.y ?? 0,
          width: provincial ? 60 : 108,
          height: 18,
          visible: this.layers.digital?.filters?.[filterId] !== false && inMap(screen),
        };
      }),
      ...((layerName === 'operation' && !provincial ? overlays.flows : []) ?? []).map((flow) => {
        const screen = project(
          this.layers.operation.getRelationWorldPosition(flow.id, flow.t)
          ?? this.layers.operation.getCityFlowWorldPosition?.(flow.id, flow.t),
        );
        return {
          id: flow.id,
          kind: 'flow',
          x: screen?.x ?? 0,
          y: screen?.y ?? 0,
          width: 72,
          height: 22,
          visible: !hideAlerts && inMap(screen),
        };
      }),
    ];
    if (layerName !== 'digital') {
      const kept = [];
      items.forEach((item) => {
        if (!item.visible) return;
        const overlaps = kept.some((other) => (
          Math.abs(item.x - other.x) < (item.width + other.width) * 0.42
          && Math.abs(item.y - other.y) < (item.height + other.height) * 0.52
        ));
        if (overlaps) {
          item.visible = false;
          return;
        }
        kept.push(item);
      });
    }
    this.ui.syncOperationOverlays(items);
  }

  updateScreenLayerLabels() {
    const state = this.stateMachine.state;
    if (state !== MAP_STATES.EXPLODED && state !== MAP_STATES.PENETRATION && !this.story?.active) return;
    if (!this.ui?.updateLayerLabelPositions) return;
    const width = this.canvas?.parentElement?.clientWidth ?? 0;
    const height = this.canvas?.parentElement?.clientHeight ?? 0;
    if (!width || !height) return;
    this.scene.updateMatrixWorld(true);
    this.camera.updateMatrixWorld();

    const positions = {};
    const focusedProvince = this.selectedProvince ?? this.storyProvinceFocus;
    ['digital', 'operation', 'infrastructure'].forEach((layerName) => {
      const sheet = this.layers[layerName]?.sheet;
      const target = focusedProvince ? sheet?.userData?.provinces?.get(focusedProvince) : sheet;
      if (!target) return;
      const box = new THREE.Box3().setFromObject(target);
      if (box.isEmpty()) return;
      const center = box.getCenter(new THREE.Vector3());
      // Provincial overlays include platform stems and labels above the sheet.
      // Anchor to the map surface instead of the tallest marker, otherwise the
      // HTML label is projected too high and appears to point at the wrong layer.
      const anchorZ = focusedProvince ? box.min.z + 1.3 : box.max.z + 0.6;
      const anchor = new THREE.Vector3(box.min.x, center.y, anchorZ).project(this.camera);
      positions[layerName] = {
        top: THREE.MathUtils.clamp((1 - anchor.y) * 0.5 * height - 26, 24, Math.max(24, height - 76)),
        anchorX: THREE.MathUtils.clamp((anchor.x + 1) * 0.5 * width, 0, width),
      };
    });
    this.ui.updateLayerLabelPositions(positions);
  }

  resize() {
    const { clientWidth: width, clientHeight: height } = this.canvas.parentElement;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    Object.values(this.layers ?? {}).forEach((layer) => layer.resize(width, height));
    if (this.stackConnectorRoot) updateLineResolution(this.stackConnectorRoot, width, height);
    this.shandongDemo?.syncLineResolution();
    this.penetration?.resize(width, height);
    this.provinceDrilldown?.resize(width, height);
  }

  animate = () => {
    const elapsed = this.clock.getElapsedTime();
    this.animations.update();
    this.story?.update();
    this.shandongDemo?.update();
    if (this.homeIntro?.active) this.homeIntro.update(elapsed);
    else if (this.cameraDirector?.programmatic) this.camera.lookAt(this.controls.target);
    else this.controls.update();
    this.updateScreenLayerLabels();
    this.updateOperationOverlays();
    this.story?.declutterLabels();
    const viewport = this.canvas?.parentElement;
    this.layers?.operation.update(elapsed);
    this.layers?.operation.updateSandboxLabels?.(this.camera, viewport?.clientWidth ?? 0, viewport?.clientHeight ?? 0);
    this.layers?.infrastructure?.update?.(elapsed, this.camera);
    this.layers?.digital.update(elapsed);
    this.updateStackConnectors(elapsed);
    this.updateExplodedBreathing(elapsed);
    this.updateExplodedLayerIcons(elapsed);
    if (this.starField) this.starField.rotation.z = elapsed * 0.0035;
    this.provinceDrilldown?.update(elapsed, this.camera, viewport?.clientWidth ?? 0, viewport?.clientHeight ?? 0);
    this.penetration?.update();
    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.animate);
  };

  dispose() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.interaction?.dispose();
    this.penetration?.dispose();
    this.provinceDrilldown?.dispose();
    this.story?.dispose();
    this.baseMap?.dispose();
    this.controls?.dispose();
    this.renderer?.dispose();
  }
}
