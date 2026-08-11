import * as THREE from 'three';
import { MAP_STATES } from '../core/MapStateMachine.js';
import { MAP_THEME, toNumberColor } from '../theme/mapTheme.js';

const STACK = Object.freeze({ scale: 0.94, infrastructure: 1.55, operation: 18 + 2.35 * 0.94, digital: 36 + 4.35 * 0.94 });

const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);

const setVisualOpacity = (root, opacity) => {
  root.visible = opacity > 0.005;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.storyOpacity === undefined) material.userData.storyOpacity = material.opacity ?? 1;
      material.transparent = true;
      material.opacity = material.userData.storyOpacity * opacity;
      material.depthWrite = false;
    });
  });
};

const glowMaterial = (color, opacity = 1) => new THREE.MeshBasicMaterial({
  color: toNumberColor(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
});

const makeTube = (curve, color, radius = 0.075, opacity = 0.7) => new THREE.Mesh(
  new THREE.TubeGeometry(curve, 72, radius, 6, false),
  glowMaterial(color, opacity),
);

const makeBeacon = (color) => {
  const root = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), glowMaterial(color, 0.95));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.58, 0.68, 28), glowMaterial(color, 0.58));
  ring.position.z = -0.04;
  root.add(core, ring);
  root.userData.core = core;
  root.userData.ring = ring;
  return root;
};

export class LogisticsStoryController {
  constructor(runtime) {
    this.runtime = runtime;
    this.root = new THREE.Group();
    this.root.name = 'OneOrderThreeNetworksStory';
    this.root.visible = false;
    this.runtime.scene.add(this.root);
    this.active = false;
    this.playing = false;
    this.completed = false;
    this.elapsed = 0;
    this.stageIndex = -1;
    this.lastTimestamp = 0;
    this.lastUiUpdate = 0;
    this.weights = { infrastructure: 1, operation: 1, digital: 1 };
    this.recombined = false;
    this.buildVisuals();
  }

  worldPoint(entityId, z) {
    const entity = this.runtime.registry.get(entityId);
    const point = entity ? this.runtime.projector.fromEntity(entity, 0) : new THREE.Vector3();
    return new THREE.Vector3(point.x * STACK.scale, point.y * STACK.scale, z);
  }

  buildVisuals() {
    const entityIds = ['HUB_SONGYUAN', 'PORT_YINGKOU', 'HUB_ZHENGZHOU', 'HUB_WUHAN', 'PORT_SHANGHAI', 'PORT_GUANGZHOU'];
    this.digitalBusPoint = new THREE.Vector3(0, 0, STACK.digital + 1.15);
    this.operationHubPoint = new THREE.Vector3(0, 0, STACK.operation + 0.7);
    this.yingkouOperationPoint = this.worldPoint('PORT_YINGKOU', STACK.operation);
    this.yingkouInfrastructurePoint = this.worldPoint('PORT_YINGKOU', STACK.infrastructure);

    this.digitalNetwork = new THREE.Group();
    this.digitalNetwork.name = 'StoryDigitalCoordination';
    this.digitalBeacons = [];
    this.dataPackets = [];
    entityIds.forEach((entityId, index) => {
      const point = this.worldPoint(entityId, STACK.digital);
      const beacon = makeBeacon(index === 0 ? MAP_THEME.primarySoft : MAP_THEME.digitalBright);
      beacon.position.copy(point);
      beacon.userData.phase = index * 0.72;
      this.digitalNetwork.add(beacon);
      this.digitalBeacons.push(beacon);
      const middle = point.clone().lerp(this.digitalBusPoint, 0.5);
      middle.z += 3.2 + index * 0.18;
      const curve = new THREE.QuadraticBezierCurve3(point, middle, this.digitalBusPoint);
      this.digitalNetwork.add(makeTube(curve, MAP_THEME.digitalBright, 0.055, 0.38));
      const packet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), glowMaterial(index % 2 ? MAP_THEME.primarySoft : '#ffffff', 1));
      packet.userData = { curve, offset: index / entityIds.length };
      this.digitalNetwork.add(packet);
      this.dataPackets.push(packet);
    });
    this.dataBus = new THREE.Group();
    this.dataBus.position.copy(this.digitalBusPoint);
    const busRing = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.10, 8, 64), glowMaterial(MAP_THEME.digitalBright, 0.86));
    const busCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 1), glowMaterial('#dffaff', 0.96));
    const trustRing = new THREE.Mesh(new THREE.RingGeometry(2.7, 2.78, 64), glowMaterial(MAP_THEME.primarySoft, 0.26));
    this.dataBus.add(busRing, busCore, trustRing);
    this.dataBus.userData = { busRing, busCore, trustRing };
    this.digitalNetwork.add(this.dataBus);
    this.root.add(this.digitalNetwork);

    this.candidateGroup = new THREE.Group();
    this.candidateRoutes = [];
    const routeSets = [
      ['HUB_SONGYUAN', 'PORT_YINGKOU', 'PORT_SHANGHAI', 'PORT_GUANGZHOU'],
      ['HUB_SONGYUAN', 'HUB_ZHENGZHOU', 'HUB_WUHAN', 'PORT_GUANGZHOU'],
      ['HUB_SONGYUAN', 'HUB_CHENGDU', 'HUB_WUHAN', 'PORT_GUANGZHOU'],
    ];
    routeSets.forEach((ids, index) => {
      const points = ids.map((id, pointIndex) => {
        const point = this.worldPoint(id, STACK.digital + 0.18 + index * 0.28);
        if (pointIndex === 1) point.z += 2.6 - index * 0.35;
        return point;
      });
      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35);
      const route = makeTube(curve, index === 0 ? MAP_THEME.primarySoft : MAP_THEME.operationBright, index === 0 ? 0.13 : 0.075, index === 0 ? 0.95 : 0.42);
      route.userData = { selected: index === 0, curve };
      this.candidateGroup.add(route);
      this.candidateRoutes.push(route);
    });
    this.root.add(this.candidateGroup);

    this.contractGroup = new THREE.Group();
    this.contractGroup.position.copy(this.digitalBusPoint);
    this.contractHalo = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.08, 72), glowMaterial('#ffffff', 0.95));
    this.contractSeal = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.16, 10, 64), glowMaterial(MAP_THEME.digitalBright, 0.92));
    this.contractGroup.add(this.contractHalo, this.contractSeal);
    this.root.add(this.contractGroup);

    this.operationNetwork = new THREE.Group();
    this.operationBeacons = [];
    this.operationPackets = [];
    entityIds.forEach((entityId, index) => {
      const point = this.worldPoint(entityId, STACK.operation);
      const beacon = makeBeacon(MAP_THEME.operationBright);
      beacon.position.copy(point);
      beacon.scale.setScalar(0.86);
      beacon.userData.phase = index * 0.64;
      this.operationNetwork.add(beacon);
      this.operationBeacons.push(beacon);
      const middle = point.clone().lerp(this.operationHubPoint, 0.5);
      middle.z += 2.2;
      const curve = new THREE.QuadraticBezierCurve3(point, middle, this.operationHubPoint);
      this.operationNetwork.add(makeTube(curve, MAP_THEME.operationBright, 0.065, 0.42));
      const packet = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), glowMaterial(index % 2 ? MAP_THEME.infrastructureBright : MAP_THEME.operationBright, 1));
      packet.userData = { curve, offset: index / entityIds.length };
      this.operationNetwork.add(packet);
      this.operationPackets.push(packet);
    });
    const operationHub = makeBeacon('#ffffff');
    operationHub.position.copy(this.operationHubPoint);
    operationHub.scale.setScalar(1.45);
    this.operationNetwork.add(operationHub);
    this.root.add(this.operationNetwork);

    const executionIds = ['HUB_SONGYUAN', 'PORT_YINGKOU', 'PORT_SHANGHAI', 'PORT_GUANGZHOU'];
    const operationPoints = executionIds.map((id, index) => {
      const point = this.worldPoint(id, STACK.operation + 0.2);
      if (index === 1) point.z += 2.3;
      return point;
    });
    this.operationCurve = new THREE.CatmullRomCurve3(operationPoints, false, 'catmullrom', 0.32);
    this.operationFlow = new THREE.Group();
    this.operationFlow.add(makeTube(this.operationCurve, MAP_THEME.operationBright, 0.12, 0.78));
    this.cargoParticles = Array.from({ length: 7 }, (_, index) => {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), glowMaterial(index % 2 ? MAP_THEME.infrastructureBright : '#ffffff', 0.96));
      particle.userData.offset = index / 7;
      this.operationFlow.add(particle);
      return particle;
    });
    this.root.add(this.operationFlow);

    const infraPoints = executionIds.map((id, index) => {
      const point = this.worldPoint(id, STACK.infrastructure + 0.32);
      if (index === 1) point.z += 1.7;
      return point;
    });
    this.infrastructureCurve = new THREE.CatmullRomCurve3(infraPoints, false, 'catmullrom', 0.32);
    this.infrastructureFlow = new THREE.Group();
    this.infrastructureFlow.add(makeTube(this.infrastructureCurve, MAP_THEME.infrastructureBright, 0.15, 0.88));
    this.vehicle = new THREE.Group();
    const vehicleBody = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.62, 0.46), glowMaterial(MAP_THEME.infrastructureBright, 0.94));
    const vehicleCab = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.68, 0.62), glowMaterial('#fff1c7', 0.98));
    vehicleCab.position.x = 0.72;
    this.vehicle.add(vehicleBody, vehicleCab);
    this.vehicle.position.copy(this.infrastructureCurve.getPointAt(0));
    this.infrastructureFlow.add(this.vehicle);
    this.transportTrail = Array.from({ length: 6 }, (_, index) => {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.14 - index * 0.012, 8, 6), glowMaterial(MAP_THEME.infrastructureBright, 0.7 - index * 0.08));
      this.infrastructureFlow.add(particle);
      return particle;
    });
    this.root.add(this.infrastructureFlow);

    this.drillOne = this.makeVerticalBeam(this.digitalBusPoint, this.operationHubPoint, MAP_THEME.digitalBright);
    this.drillTwo = this.makeVerticalBeam(this.yingkouOperationPoint, this.yingkouInfrastructurePoint, MAP_THEME.infrastructureBright);
    this.root.add(this.drillOne, this.drillTwo);
    this.taskToken = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 1), glowMaterial('#ffffff', 1));
    this.taskToken.add(new THREE.Mesh(new THREE.SphereGeometry(0.92, 14, 10), glowMaterial(MAP_THEME.primarySoft, 0.13)));
    this.root.add(this.taskToken);

    this.feedbackGroup = new THREE.Group();
    this.feedbackParticles = Array.from({ length: 10 }, (_, index) => {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.12 + (index % 3) * 0.035, 8, 6), glowMaterial(index % 2 ? MAP_THEME.digitalBright : MAP_THEME.primarySoft, 0.88));
      particle.userData.offset = index / 10;
      this.feedbackGroup.add(particle);
      return particle;
    });
    this.root.add(this.feedbackGroup);
    this.resetVisuals();
  }

  makeVerticalBeam(start, end, color) {
    const height = Math.abs(start.z - end.z);
    const root = new THREE.Group();
    root.position.set(start.x, start.y, Math.min(start.z, end.z) + height / 2);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, height, 10, 1, true), glowMaterial(color, 0.68));
    beam.rotation.x = Math.PI / 2;
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, height, 12, 1, true), glowMaterial(color, 0.08));
    halo.rotation.x = Math.PI / 2;
    root.add(beam, halo);
    return root;
  }

  resetVisuals() {
    [this.digitalNetwork, this.candidateGroup, this.contractGroup, this.operationNetwork, this.operationFlow,
      this.infrastructureFlow, this.drillOne, this.drillTwo, this.taskToken, this.feedbackGroup]
      .forEach((group) => setVisualOpacity(group, 0));
    this.contractHalo.scale.setScalar(1);
    this.recombined = false;
  }

  start(story) {
    this.story = story;
    this.active = true;
    this.playing = true;
    this.completed = false;
    this.elapsed = 0;
    this.stageIndex = -1;
    this.lastTimestamp = performance.now();
    this.lastUiUpdate = 0;
    this.weights = { infrastructure: 1, operation: 1, digital: 1 };
    this.root.visible = true;
    this.resetVisuals();
    this.runtime.controls.enabled = false;
    this.runtime.ui.showStory(story);
    this.runtime.setState(MAP_STATES.EXPLODED, { story: true });
  }

  pause() {
    if (!this.active || !this.playing) return;
    this.playing = false;
    this.runtime.ui.setStoryPlayback('paused');
  }

  resume() {
    if (!this.active || this.playing) return;
    this.playing = true;
    this.lastTimestamp = performance.now();
    this.runtime.controls.enabled = false;
    this.runtime.ui.setStoryPlayback('playing');
  }

  stop({ restoreScene = true, hideUi = true } = {}) {
    if (!this.active && !this.completed) return;
    this.active = false;
    this.playing = false;
    this.completed = false;
    this.root.visible = false;
    this.runtime.controls.enabled = true;
    if (hideUi) this.runtime.ui.hideStory();
    if (restoreScene) {
      this.runtime.applyState({ state: this.runtime.stateMachine.state, context: {} }, true);
    }
  }

  complete() {
    this.active = false;
    this.playing = false;
    this.completed = true;
    this.root.visible = false;
    this.runtime.controls.enabled = true;
    if (!this.recombined) this.runtime.setState(MAP_STATES.COMBINED, { story: true });
    this.runtime.ui.completeStory(this.story);
  }

  update(timestamp = performance.now()) {
    if (!this.active || !this.playing || !this.story) return;
    const delta = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    this.elapsed = Math.min(this.story.duration, this.elapsed + delta);
    const index = this.story.stages.findIndex((stage) => this.elapsed >= stage.start && this.elapsed < stage.end);
    const safeIndex = index === -1 ? this.story.stages.length - 1 : index;
    const stage = this.story.stages[safeIndex];
    if (safeIndex !== this.stageIndex) {
      this.stageIndex = safeIndex;
      this.enterStage(stage, safeIndex);
    }
    const progress = clamp01((this.elapsed - stage.start) / Math.max(0.001, stage.end - stage.start));
    this.updateVisuals(stage.id, progress, this.elapsed);
    if (!this.recombined) {
      Object.entries(this.weights).forEach(([layer, weight]) => this.runtime.layers[layer].setVisualWeight(weight));
    }
    if (timestamp - this.lastUiUpdate > 80) {
      this.runtime.ui.updateStoryProgress(this.elapsed / this.story.duration, progress, stage);
      this.lastUiUpdate = timestamp;
    }
    if (this.elapsed >= this.story.duration) this.complete();
  }

  enterStage(stage, index) {
    this.runtime.ui.updateStoryStage(stage, index, this.story);
    const camera = this.runtime.cameraDirector;
    if (stage.id === 'overview') {
      this.setWeights({ infrastructure: 0.88, operation: 0.88, digital: 0.92 }, 0.7);
      camera.setExploded(true);
    } else if (stage.id.startsWith('digital_')) {
      this.setWeights({ infrastructure: 0, operation: 0, digital: 1 }, 0.7);
      this.moveLayerOverview(STACK.digital, 1.1);
    } else if (stage.id === 'drill_operation') {
      // 先淡出数字层，再显示运营层；镜头保持与炸开视图相同的俯视角度。
      this.moveLayerOverview(STACK.operation, 1.5);
    } else if (stage.id === 'operation') {
      this.setWeights({ infrastructure: 0, operation: 1, digital: 0 }, 0.45);
      this.moveLayerOverview(STACK.operation, 0.7);
    } else if (stage.id === 'drill_infrastructure') {
      // 同样先淡出运营层，再以相同俯视角展示基础设施层全貌。
      this.moveLayerOverview(STACK.infrastructure, 1.35);
    } else if (stage.id === 'infrastructure') {
      this.setWeights({ infrastructure: 1, operation: 0, digital: 0 }, 0.45);
      this.moveLayerOverview(STACK.infrastructure, 0.7);
    } else if (stage.id === 'feedback') {
      this.setWeights({ infrastructure: 0.78, operation: 0.72, digital: 0.82 }, 1.0);
      camera.setExploded(true);
    }
  }

  setWeights(values, duration) {
    this.runtime.animations.to(this.weights, values, duration, 'easeInOut');
  }

  moveCamera(target, offset, duration) {
    this.runtime.cameraDirector.moveTo(target.clone().add(offset), target, duration);
  }

  moveLayerOverview(layerZ, duration) {
    // 与三层炸开视角保持同一方向和俯角，仅把观察中心平移到当前层。
    this.moveCamera(new THREE.Vector3(0, 0, layerZ), new THREE.Vector3(6, -138, 102), duration);
  }

  follow(point, offset, amount = 0.032) {
    const desiredPosition = point.clone().add(offset);
    this.runtime.camera.position.lerp(desiredPosition, amount);
    this.runtime.controls.target.lerp(point, amount * 1.35);
  }

  updateVisuals(stageId, progress, elapsed) {
    const digitalActive = ['digital_collect', 'digital_optimize', 'digital_contract', 'drill_operation', 'feedback'].includes(stageId);
    const upperFade = clamp01(1 - progress / 0.22);
    const currentFade = clamp01((progress - 0.22) / 0.28);
    if (stageId === 'drill_operation') {
      Object.assign(this.weights, { infrastructure: 0, operation: currentFade, digital: upperFade });
    } else if (stageId === 'drill_infrastructure') {
      Object.assign(this.weights, { infrastructure: currentFade, operation: upperFade, digital: 0 });
    }
    setVisualOpacity(this.digitalNetwork, digitalActive ? (stageId === 'drill_operation' ? upperFade : 1) : 0);
    setVisualOpacity(this.candidateGroup, ['digital_optimize', 'digital_contract'].includes(stageId) ? 1 : 0);
    setVisualOpacity(this.contractGroup, stageId === 'digital_contract' ? 1 : 0);
    const operationOpacity = stageId === 'drill_operation' ? currentFade : stageId === 'drill_infrastructure' ? upperFade : stageId === 'operation' ? 1 : 0;
    setVisualOpacity(this.operationNetwork, operationOpacity);
    setVisualOpacity(this.operationFlow, stageId === 'operation' ? 1 : 0);
    setVisualOpacity(this.infrastructureFlow, stageId === 'infrastructure' ? 1 : stageId === 'drill_infrastructure' ? currentFade * 0.42 : 0);
    setVisualOpacity(this.drillOne, stageId === 'drill_operation' ? Math.sin(progress * Math.PI) : 0);
    setVisualOpacity(this.drillTwo, stageId === 'drill_infrastructure' ? Math.sin(progress * Math.PI) : 0);
    setVisualOpacity(this.feedbackGroup, stageId === 'feedback' ? 1 : 0);
    setVisualOpacity(this.taskToken, ['digital_contract', 'drill_operation', 'operation', 'drill_infrastructure', 'infrastructure'].includes(stageId) ? 1 : 0);

    if (digitalActive) {
      this.dataBus.rotation.z = elapsed * 1.15;
      this.dataBus.userData.busCore.rotation.set(elapsed * 0.8, elapsed * 1.2, elapsed * 0.55);
      this.dataPackets.forEach((packet, index) => {
        const t = (elapsed * 0.42 + packet.userData.offset) % 1;
        packet.position.copy(packet.userData.curve.getPointAt(t));
        packet.scale.setScalar(0.82 + Math.sin(elapsed * 5 + index) * 0.18);
      });
      this.digitalBeacons.forEach((beacon, index) => {
        const pulse = 1 + Math.sin(elapsed * 2.8 + beacon.userData.phase) * 0.13;
        beacon.scale.setScalar(stageId === 'digital_contract' && index <= Math.floor(progress * 5) ? pulse * 1.32 : pulse);
      });
    }

    if (stageId === 'digital_optimize') {
      this.candidateRoutes.forEach((route, index) => {
        const settle = clamp01((progress - 0.42) / 0.42);
        route.material.opacity = route.material.userData.storyOpacity * (route.userData.selected ? 0.72 + settle * 0.28 : 1 - settle * 0.78);
        route.scale.setScalar(route.userData.selected ? 1 + Math.sin(elapsed * 5) * 0.035 : 1);
      });
    }

    if (stageId === 'digital_contract') {
      const wave = (progress * 2.4) % 1;
      this.contractHalo.scale.setScalar(1 + wave * 9);
      this.contractHalo.material.opacity = (1 - wave) * 0.82;
      this.contractSeal.rotation.z = elapsed * 1.8;
      this.taskToken.position.copy(this.digitalBusPoint);
      this.taskToken.rotation.y = elapsed * 2.2;
    } else if (stageId === 'drill_operation') {
      this.taskToken.position.lerpVectors(this.digitalBusPoint, this.operationHubPoint, progress);
      this.taskToken.rotation.y = elapsed * 2.4;
    } else if (stageId === 'operation') {
      this.operationPackets.forEach((packet, index) => {
        const t = (elapsed * 0.32 + packet.userData.offset) % 1;
        packet.position.copy(packet.userData.curve.getPointAt(t));
      });
      this.cargoParticles.forEach((particle, index) => {
        const t = (progress * 0.88 + particle.userData.offset * 0.10) % 1;
        particle.position.copy(this.operationCurve.getPointAt(t));
      });
      const taskProgress = clamp01(progress * 0.88);
      this.taskToken.position.copy(this.operationCurve.getPointAt(taskProgress));
    } else if (stageId === 'drill_infrastructure') {
      this.taskToken.position.lerpVectors(this.yingkouOperationPoint, this.yingkouInfrastructurePoint, progress);
      this.taskToken.rotation.y = elapsed * 2.4;
    } else if (stageId === 'infrastructure') {
      const t = clamp01(progress * 0.96);
      const position = this.infrastructureCurve.getPointAt(t);
      const tangent = this.infrastructureCurve.getTangentAt(Math.min(0.999, t));
      this.vehicle.position.copy(position);
      this.vehicle.rotation.z = Math.atan2(tangent.y, tangent.x);
      this.taskToken.position.copy(position).add(new THREE.Vector3(0, 0, 0.9));
      this.transportTrail.forEach((particle, index) => {
        particle.position.copy(this.infrastructureCurve.getPointAt(Math.max(0, t - (index + 1) * 0.018)));
      });
    } else if (stageId === 'feedback') {
      this.feedbackParticles.forEach((particle, index) => {
        const local = (progress * 1.35 + particle.userData.offset) % 1;
        const anchor = this.infrastructureCurve.getPointAt(particle.userData.offset);
        particle.position.set(
          anchor.x + Math.sin(elapsed * 2 + index) * 0.7,
          anchor.y + Math.cos(elapsed * 1.6 + index) * 0.5,
          THREE.MathUtils.lerp(STACK.infrastructure + 0.6, STACK.digital + 1.2, local),
        );
      });
      if (progress > 0.64 && !this.recombined) {
        this.recombined = true;
        this.root.visible = false;
        this.runtime.setState(MAP_STATES.COMBINED, { story: true });
      }
    }
  }

  dispose() {
    this.root.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
      else object.material?.dispose?.();
    });
    this.root.removeFromParent();
  }
}
