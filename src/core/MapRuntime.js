import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AnimationManager } from './AnimationManager.js';
import { CameraDirector } from './CameraDirector.js';
import { InteractionManager } from './InteractionManager.js';
import { MAP_STATES, MapStateMachine, stateToLayer } from './MapStateMachine.js';
import { ChinaBaseMap } from '../map/ChinaBaseMap.js';
import { GeoProjector } from '../map/GeoProjector.js';
import { EntityRegistry } from '../data/EntityRegistry.js';
import { LODManager } from '../data/LODManager.js';
import { InfrastructureLayer } from '../layers/infrastructure/InfrastructureLayer.js';
import { OperationLayer } from '../layers/operation/OperationLayer.js';
import { DigitalLayer } from '../layers/digital/DigitalLayer.js';
import { PenetrationController } from '../interaction/PenetrationController.js';
import { LogisticsStoryController } from '../story/LogisticsStoryController.js';
import { MAP_THEME, toNumberColor } from '../theme/mapTheme.js';

const layerState = {
  combined: {
    infrastructure: { x: 0, y: 0, z: 0.0, scale: 1, weight: 0.84 },
    operation: { x: 0, y: 0, z: 0.55, scale: 1, weight: 0.58 },
    digital: { x: 0, y: 0, z: 1.1, scale: 1, weight: 0.52 },
  },
  // Co-axial vertical stack: all three maps keep the exact same planar registration.
  // Equal scale and Z-only separation make cross-layer relationships readable at a glance.
  exploded: {
    infrastructure: { x: 0, y: 0, z: 0, scale: 0.94, weight: 1.0 },
    operation: { x: 0, y: 0, z: 18, scale: 0.94, weight: 1.0 },
    digital: { x: 0, y: 0, z: 36, scale: 0.94, weight: 1.0 },
  },
};

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
    this.controls.minDistance = 42;
    this.controls.maxDistance = 320;
    // Allow a broad top-down-to-grazing pitch range while preventing the camera
    // from crossing underneath the map stack.
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(4);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
    this.controls.target.set(0, 0, 0);

    this.cameraDirector = new CameraDirector(this.camera, this.controls, this.animations);
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
      entities: this.data.entities,
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

    this.selectionRoot = new THREE.Group();
    this.selectionRoot.name = 'SelectionRoot';
    this.scene.add(this.selectionRoot);
    this.penetration = new PenetrationController({ registry: this.registry, selectionRoot: this.selectionRoot });
    this.story = new LogisticsStoryController(this);
    this.interaction = new InteractionManager(this);

    this.stateMachine.addEventListener('change', (event) => this.applyState(event.detail));
    this.lod.addEventListener('change', (event) => this.ui.updateLod(event.detail.level, event.detail.focusRegion));
    this.controls.addEventListener('change', () => this.lod.updateByDistance(this.camera.position.distanceTo(this.controls.target)));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas.parentElement);
    this.resize();
    this.applyState({ state: MAP_STATES.COMBINED, previous: null, context: {} }, false);
    this.animate();
    return this;
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight(0xcfeeff, 0x020712, 1.48));
    const key = new THREE.DirectionalLight(0xeaf8ff, 1.92);
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
    const grid = new THREE.GridHelper(156, 26, 0x1679a7, 0x0d314c);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -3.2;
    grid.material.transparent = true;
    grid.material.opacity = 0.16;
    this.scene.add(grid);

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
    rings.position.z = -3.05;
    this.scene.add(rings);

    const baseHalo = new THREE.Mesh(
      new THREE.RingGeometry(33, 57, 96),
      new THREE.MeshBasicMaterial({ color: toNumberColor(MAP_THEME.operation), transparent: true, opacity: 0.055, side: THREE.DoubleSide, depthWrite: false }),
    );
    baseHalo.position.z = -3.0;
    baseHalo.scale.y = 0.58;
    this.scene.add(baseHalo);
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
    const sampleEntities = this.data.entities.slice(0, 7);
    sampleEntities.forEach((entity, index) => {
      const point = this.projector.fromEntity(entity, 0);
      const infra = layerState.exploded.infrastructure;
      const operation = layerState.exploded.operation;
      const digital = layerState.exploded.digital;
      const points = [
        new THREE.Vector3(point.x * infra.scale, point.y * infra.scale + infra.y, infra.z + 2.0 * infra.scale),
        new THREE.Vector3(point.x * operation.scale, point.y * operation.scale + operation.y, operation.z + 2.8 * operation.scale),
        new THREE.Vector3(point.x * digital.scale, point.y * digital.scale + digital.y, digital.z + 4.7 * digital.scale),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const rail = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: toNumberColor(MAP_THEME.primarySoft),
          transparent: true,
          opacity: 0.11,
          depthWrite: false,
        }),
      );
      rail.renderOrder = 3;
      this.stackConnectorRoot.add(rail);
      const material = new THREE.LineDashedMaterial({
        color: toNumberColor(index % 2 === 0 ? MAP_THEME.primarySoft : MAP_THEME.digitalBright),
        transparent: true,
        opacity: 0.34,
        dashSize: 0.58,
        gapSize: 0.46,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      line.renderOrder = 4;
      this.stackConnectorRoot.add(line);
      points.forEach((p, pointIndex) => {
        const marker = new THREE.Mesh(
          new THREE.RingGeometry(0.25, 0.39, 22),
          new THREE.MeshBasicMaterial({
            color: toNumberColor(pointIndex === 0 ? MAP_THEME.infrastructureBright : pointIndex === 1 ? MAP_THEME.operationBright : MAP_THEME.digitalBright),
            transparent: true,
            opacity: 0.76,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        marker.position.copy(p);
        marker.renderOrder = 5;
        this.stackConnectorRoot.add(marker);
      });
    });
    this.networkStackRoot.add(this.stackConnectorRoot);
  }

  setState(state, context = {}) {
    if ((this.story?.active || this.story?.completed) && !context.story) this.story.stop({ restoreScene: false });
    this.stateMachine.setState(state, context);
  }

  async toggleStory() {
    if (this.story?.active) {
      if (this.story.playing) this.story.pause();
      else this.story.resume();
      return;
    }
    const story = await this.dataManager.loadStory();
    this.ui.closeRightDrawer();
    this.story.start(story);
  }

  stopStory() {
    this.story?.stop({ restoreScene: true });
  }

  applyState({ state, context }, animate = true) {
    const duration = animate ? (state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION ? 1 : 0.65) : 0.001;
    let config = layerState.combined;
    let baseOpacity = 0.72;
    if (state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION) {
      config = layerState.exploded;
      baseOpacity = 0.10;
      this.cameraDirector.setExploded(true);
    } else if (stateToLayer[state]) {
      config = this.focusLayerConfig(stateToLayer[state]);
      baseOpacity = 0.18;
      this.cameraDirector.setExploded(false);
    } else if (state === MAP_STATES.TASK_TRACE) {
      config = this.focusLayerConfig('operation');
      baseOpacity = 0.16;
      this.cameraDirector.setExploded(false);
    } else {
      this.cameraDirector.setExploded(false);
    }

    // Keep the geographic planes parallel; the camera supplies the perspective.
    this.animations.to(this.networkStackRoot.rotation, { x: 0, y: 0, z: 0 }, duration);
    if (this.stackConnectorRoot) this.stackConnectorRoot.visible = state === MAP_STATES.EXPLODED;
    Object.entries(config).forEach(([key, target]) => this.animateLayer(this.layers[key], target, duration));
    this.updateLayerSheetOpacity(state, config);
    this.baseMap.setSheetOpacity(this.baseSheet, baseOpacity);
    this.ui.updateMode(state, stateToLayer[state] ?? null, context);
    if (state !== MAP_STATES.PENETRATION) this.penetration?.clear();
  }

  updateLayerSheetOpacity(state, config) {
    const solidSheets = state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION;
    this.layers.infrastructure?.setStackOcclusion(solidSheets);
    Object.entries(config).forEach(([key, target]) => {
      const sheet = this.layers[key]?.sheet;
      if (!sheet) return;
      const sheetOpacity = solidSheets ? 1 : sheet.userData.baseOpacity * target.weight;
      this.baseMap.setSheetOpacity(sheet, sheetOpacity);
    });
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

  resetView() {
    const interruptedStory = Boolean(this.story?.active || this.story?.completed);
    if (interruptedStory) this.story.stop({ restoreScene: false });
    this.selectedEntityId = null;
    this.selectedRouteId = null;
    this.penetration?.clear();
    this.ui.closeRightDrawer();
    this.layers.infrastructure.highlightRoute(null);
    this.lod.setFocus(null);
    this.cameraDirector.reset();
    this.ui.setSpatialContext(null);
    if (interruptedStory || this.stateMachine.state === MAP_STATES.PENETRATION || this.stateMachine.state === MAP_STATES.TASK_TRACE) {
      this.setState(MAP_STATES.COMBINED);
    }
  }

  selectEntity(entityId) {
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: true });
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

  setLayerFilter(layer, id, enabled) {
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: true });
    this.layers[layer]?.setFilter(id, enabled);
  }

  setLayerFilters(layer, ids, enabled) {
    if (this.story?.active || this.story?.completed) this.story.stop({ restoreScene: true });
    ids.forEach((id) => this.layers[layer]?.setFilter(id, enabled));
  }

  getInteractiveNodeMeshes() {
    const meshes = [];
    this.registry.references.forEach((references) => Object.values(references).forEach((node) => {
      if (!node.visible || !node.parent?.visible) return;
      node.traverse((object) => { if (object.isMesh) meshes.push(object); });
    }));
    return meshes;
  }

  getInteractiveRouteObjects() {
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
    const state = this.stateMachine.state;
    if (stateToLayer[state] && stateToLayer[state] !== 'infrastructure') return [];
    if (state === MAP_STATES.TASK_TRACE || !this.layers.infrastructure.visible) return [];
    return [...this.layers.infrastructure.facilityObjects.values()].filter((object) => object.visible);
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
    this.setState(MAP_STATES.COMBINED);
  }

  resize() {
    const { clientWidth: width, clientHeight: height } = this.canvas.parentElement;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    Object.values(this.layers ?? {}).forEach((layer) => layer.resize(width, height));
    this.penetration?.resize(width, height);
  }

  animate = () => {
    const elapsed = this.clock.getElapsedTime();
    this.animations.update();
    this.story?.update();
    this.controls.update();
    this.story?.updateScreenLayerLabels();
    this.story?.declutterLabels();
    this.layers?.operation.update(elapsed);
    this.layers?.digital.update(elapsed);
    if (this.starField) this.starField.rotation.z = elapsed * 0.0035;
    this.penetration?.update();
    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.animate);
  };

  dispose() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.interaction?.dispose();
    this.penetration?.dispose();
    this.story?.dispose();
    this.baseMap?.dispose();
    this.controls?.dispose();
    this.renderer?.dispose();
  }
}
