import * as THREE from 'three';
import {
  CORRIDOR_COLORS,
  CORRIDOR_LINE_STYLE,
  REGION_DEMO_THEME,
  SHANDONG_REAL_STATS,
  shandongKpiMetrics,
  shandongRegionDemo,
} from '../data/shandongRegionDemoData.js';
import { MAP_STATES } from '../core/MapStateMachine.js';
import { toNumberColor } from '../theme/mapTheme.js';
import { makeWideLine, updateLineResolution } from '../layers/rendering.js';

const SCALE = 1;
const Z_BASE = 1.52;
const THEME = REGION_DEMO_THEME;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothStep = (v, lo = 0, hi = 1) => {
  const t = clamp01((v - lo) / Math.max(0.001, hi - lo));
  return t * t * (3 - 2 * t);
};

const glowMat = (color, opacity = 1, blending = THREE.NormalBlending) => new THREE.MeshBasicMaterial({
  color: toNumberColor(color),
  transparent: true,
  opacity,
  depthTest: false,
  depthWrite: false,
  blending,
  toneMapped: false,
});

function sampleCurve(curve, count = 48) {
  if (curve.getPoints) return curve.getPoints(Math.max(2, count - 1));
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const u = i / (count - 1);
    pts.push(curve.getPoint(u));
  }
  return pts.filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
}

function makeSprite(text, color, {
  width = 4.8, height = 1.05, scale = 1, fontSize = 40, tint = false,
} = {}) {
  const opts = {
    color: 0xffffff, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
  };
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(5,12,24,0.92)';
    ctx.lineWidth = 8;
    ctx.font = `700 ${fontSize}px "Microsoft YaHei",sans-serif`;
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = tint ? color : '#eaf6fb';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    opts.map = tex;
  } else {
    opts.opacity = 0;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial(opts));
  const w = width * scale;
  const h = height * scale;
  s.scale.set(w, h, 1);
  s.userData.baseScale = { x: w, y: h };
  s.renderOrder = 40;
  return s;
}

function makeDigitalRoute(curve, {
  color,
  width = 2.6,
  opacity = 0.86,
  dashed = true,
  dashSize = 1.15,
  gapSize = 0.42,
  samples = 48,
  phase = 0,
  resolution = null,
  packetCount = 3,
  packetSize = 0.05,
  speed = 0.032,
} = {}) {
  const group = new THREE.Group();
  const points = sampleCurve(curve, samples);
  const hex = toNumberColor(color);
  const line = makeWideLine(points, {
    color: hex,
    width,
    opacity,
    dashed,
    dashSize,
    gapSize,
  });
  line.material.transparent = true;
  line.material.depthTest = false;
  line.material.depthWrite = false;
  line.material.toneMapped = false;
  line.material.userData.baseOp = opacity;
  line.userData.phase = phase;
  line.renderOrder = 28;
  line.frustumCulled = false;
  const resX = Number(resolution?.x) || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const resY = Number(resolution?.y) || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  line.material.resolution.set(resX || 1920, resY || 1080);
  group.add(line);

  const coreGeom = new THREE.BufferGeometry().setFromPoints(points);
  const coreMat = dashed
    ? new THREE.LineDashedMaterial({
      color: hex, dashSize, gapSize, transparent: true, opacity, depthTest: false, depthWrite: false, toneMapped: false,
    })
    : new THREE.LineBasicMaterial({
      color: hex, transparent: true, opacity, depthTest: false, depthWrite: false, toneMapped: false,
    });
  coreMat.userData.baseOp = opacity;
  const core = new THREE.Line(coreGeom, coreMat);
  if (dashed) core.computeLineDistances();
  core.renderOrder = 27;
  core.frustumCulled = false;
  group.add(core);

  const packets = [];
  for (let slot = 0; slot < packetCount; slot += 1) {
    const packet = new THREE.Mesh(
      new THREE.OctahedronGeometry(packetSize, 0),
      new THREE.MeshBasicMaterial({
        color: hex, transparent: true, opacity: 0.92, depthTest: false, depthWrite: false, toneMapped: false,
      }),
    );
    packet.userData.offset = ((phase * 0.13) + slot / Math.max(1, packetCount)) % 1;
    packet.userData.spin = 1.4 + (slot % 3) * 0.5;
    packet.renderOrder = 32;
    packet.visible = false;
    group.add(packet);
    packets.push(packet);
  }

  return { group, curve, points, line, core, packets, speed };
}

function driveDigitalRoute(item, elapsed, appear = 1, { lineOp = 1 } = {}) {
  const fade = clamp01(appear);
  const visible = fade > 0.02;
  const op = fade * lineOp;
  const phase = item.line?.userData.phase ?? 0;
  [item.line, item.core].forEach((mesh) => {
    if (!mesh?.material) return;
    mesh.visible = visible;
    mesh.material.opacity = (mesh.material.userData.baseOp ?? 0.86) * op;
    if (mesh.material.dashed || mesh.material.isLineDashedMaterial) {
      mesh.material.dashOffset = -((elapsed * 0.38 + phase) % 2);
    }
  });
  const speed = item.speed ?? 0.032;
  item.packets?.forEach((packet) => {
    if (!visible || !item.curve) {
      packet.visible = false;
      return;
    }
    const u = (elapsed * speed + packet.userData.offset) % 1;
    const t = u < 0.002 ? 0.002 : u > 0.998 ? 0.998 : u;
    const point = item.curve.getPointAt?.(t) ?? item.curve.getPoint(t);
    if (!point) {
      packet.visible = false;
      return;
    }
    packet.visible = true;
    packet.position.copy(point);
    packet.rotation.x = elapsed * packet.userData.spin;
    packet.rotation.z = elapsed * packet.userData.spin * 0.7;
    packet.material.opacity = 0.94 * Math.min(1, Math.sin(Math.PI * u) * 2.4) * fade;
  });
}

function makeIndustrySpot(color) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), glowMat(color, 0.96));
  core.position.z = 0.1;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.062, 0.09, 24), glowMat(color, 0.72));
  ring.position.z = 0.02;
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.12, 24), glowMat(color, 0));
  ripple.position.z = 0.01;
  g.add(core, ring, ripple);
  g.userData = { core, ring, ripple, color };
  return g;
}

function makeHubNode(kind) {
  const g = new THREE.Group();
  const coreSize = kind === 'port' ? 0.055 : kind === 'core' ? 0.05 : 0.038;
  const core = new THREE.Mesh(new THREE.SphereGeometry(coreSize, 12, 10), glowMat(THEME.hubFill, 0.96));
  core.position.z = 0.12;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(coreSize + 0.018, coreSize + 0.042, 28),
    glowMat(THEME.hubRing, 0.78),
  );
  ring.position.z = 0.03;
  g.add(core, ring);
  let ring2 = null;
  let ripple = null;
  if (kind === 'port') {
    ring2 = new THREE.Mesh(
      new THREE.RingGeometry(coreSize + 0.052, coreSize + 0.07, 28),
      glowMat(THEME.port, 0.42),
    );
    ring2.position.z = 0.02;
    ripple = new THREE.Mesh(
      new THREE.RingGeometry(coreSize + 0.08, coreSize + 0.11, 28),
      glowMat(THEME.port, 0),
    );
    ripple.position.z = 0.015;
    g.add(ring2, ripple);
  }
  g.userData = { core, ring, ring2, ripple, kind };
  return g;
}

function setSpriteOpacity(sprite, opacity, scaleMul = 1) {
  if (!sprite?.userData?.baseScale) return;
  const { x, y } = sprite.userData.baseScale;
  sprite.scale.set(x * scaleMul, y * scaleMul, 1);
  if (sprite.material) sprite.material.opacity = opacity;
}

export class ShandongRegionDemoController {
  constructor(runtime) {
    this.runtime = runtime;
    this.root = new THREE.Group();
    this.root.name = 'ShandongRegionDemo';
    this.root.visible = false;
    this.runtime.scene.add(this.root);
    this.active = false;
    this.playing = false;
    this.completed = false;
    this.elapsed = 0;
    this.stageIndex = -1;
    this.lastTimestamp = 0;
    this.lastUiUpdate = 0;
    this.built = false;
    this.demo = shandongRegionDemo;
    this.handleControlStart = () => {
      if (!this.active) return;
      this.cameraFollow = false;
      this.runtime.ui.setStoryCameraFollow?.(false);
    };
    this.runtime.controls.addEventListener?.('start', this.handleControlStart);
    this.cameraFollow = true;
  }

  get story() { return this.active || this.completed ? this.demo : null; }

  worldCoord(lngLat, z = Z_BASE) {
    const p = this.runtime.projector.fromLngLat(lngLat, 0);
    return new THREE.Vector3(p.x * SCALE, p.y * SCALE, z);
  }

  mapSurfaceZ() {
    const fill = this.runtime.provinceDrilldown?.cityFills?.[0];
    if (!fill) return Z_BASE;
    fill.updateWorldMatrix?.(true, false);
    return fill.getWorldPosition(new THREE.Vector3()).z + 0.12;
  }

  syncRootToMap() {
    this.root.position.z = this.mapSurfaceZ() - Z_BASE;
  }

  polylineCurve(coords, z) {
    const pts = coords.map((c) => this.worldCoord(c, z));
    if (pts.length === 2) {
      const mid = pts[0].clone().lerp(pts[1], 0.5);
      mid.z += Math.min(1.15, pts[0].distanceTo(pts[1]) * 0.12);
      return new THREE.QuadraticBezierCurve3(pts[0], mid, pts[1]);
    }
    pts.forEach((point, index) => {
      if (index > 0 && index < pts.length - 1) point.z += 0.28;
    });
    return new THREE.CatmullRomCurve3(pts);
  }

  viewportSize() {
    const parent = this.runtime.canvas?.parentElement;
    const width = parent?.clientWidth || this.runtime.renderer?.domElement?.clientWidth || 1920;
    const height = parent?.clientHeight || this.runtime.renderer?.domElement?.clientHeight || 1080;
    return { width, height };
  }

  syncLineResolution() {
    const { width, height } = this.viewportSize();
    if (!width || !height) return;
    updateLineResolution(this.root, width, height);
  }

  // ──────────── build ────────────
  rebuildVisuals() {
    while (this.root.children.length) {
      const child = this.root.children[0];
      this.root.remove(child);
      child.traverse((object) => {
        object.geometry?.dispose?.();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          material?.map?.dispose?.();
          material?.dispose?.();
        });
      });
    }
    this.built = false;
    this.outlineTrail = null;
    this.build();
    this.syncLineResolution();
  }

  build() {
    if (this.built) return;
    this.built = true;
    const demo = this.demo;
    const cityMap = new Map(demo.cities.map((c) => [c.id, c]));
    const industryMap = new Map(demo.industries.map((ind) => [ind.id, ind]));

    const occupancy = new Map();
    this.industrySpots = [];
    demo.industries.forEach((ind) => {
      ind.cities.forEach((cityId) => {
        const city = cityMap.get(cityId);
        if (!city) return;
        const slot = occupancy.get(cityId) ?? 0;
        occupancy.set(cityId, slot + 1);
        const angle = slot * 2.15;
        const lng = city.lng + Math.cos(angle) * 0.07;
        const lat = city.lat + Math.sin(angle) * 0.055;
        const spot = makeIndustrySpot(ind.color);
        spot.position.copy(this.worldCoord([lng, lat], Z_BASE + 0.22));
        spot.visible = false;
        this.root.add(spot);
        this.industrySpots.push({ spot, ind, city });
      });
    });

    this.industryLabels = demo.industries.map((ind) => {
      const label = makeSprite(ind.name, ind.color, {
        width: Math.max(4.2, ind.name.length * 0.92), height: 0.88, fontSize: 36, tint: true,
      });
      label.position.copy(this.worldCoord(ind.labelCoord, Z_BASE + 0.58));
      label.visible = false;
      this.root.add(label);
      return { label, ind };
    });

    const lineResolution = new THREE.Vector2(this.viewportSize().width, this.viewportSize().height);

    const makeSoftArc = (fromObj, toObj, color, lift, opts = {}, index = 0) => {
      const start = this.worldCoord([fromObj.lng, fromObj.lat], Z_BASE + 0.22);
      const end = this.worldCoord([toObj.lng, toObj.lat], Z_BASE + 0.22);
      const mid = start.clone().lerp(end, 0.5);
      mid.z += lift;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const flow = makeDigitalRoute(curve, {
        color,
        width: 2.4,
        opacity: 0.86,
        dashed: true,
        dashSize: 0.36,
        gapSize: 0.22,
        samples: 36,
        phase: index * 0.21,
        resolution: lineResolution,
        packetCount: 2,
        packetSize: 0.045,
        speed: 0.052,
        ...opts,
      });
      flow.group.visible = false;
      this.root.add(flow.group);
      return flow;
    };

    this.clusterArcs = (demo.industryClusters ?? []).map((link) => {
      const industry = industryMap.get(link.industry);
      const fromObj = cityMap.get(link.from);
      const toObj = cityMap.get(link.to);
      if (!industry || !fromObj || !toObj) return null;
      return { ...makeSoftArc(fromObj, toObj, industry.color, 0.38), link, industry };
    }).filter(Boolean);

    this.hubFlowArcs = (demo.hubFlows ?? []).map((flow) => {
      const industry = industryMap.get(flow.industry);
      const fromObj = cityMap.get(flow.from);
      const toObj = cityMap.get(flow.to);
      if (!industry || !fromObj || !toObj) return null;
      return {
        ...makeSoftArc(fromObj, toObj, industry.color, 0.55, {
          width: 2.6, opacity: 0.9, packetCount: 2, packetSize: 0.05, speed: 0.058,
        }),
        flow,
        industry,
      };
    }).filter(Boolean);

    this.hubNodes = (demo.hubs ?? []).map((hub) => {
      const city = cityMap.get(hub.id);
      if (!city) return null;
      const node = makeHubNode(hub.kind);
      node.position.copy(this.worldCoord([city.lng, city.lat], Z_BASE + 0.2));
      node.visible = false;
      this.root.add(node);
      const label = makeSprite(hub.name, THEME.hubFill, {
        width: hub.kind === 'port' ? 3.4 : 2.8, height: 0.76, fontSize: 32, tint: true,
      });
      label.position.copy(this.worldCoord([city.lng, city.lat + 0.18], Z_BASE + 0.52));
      label.visible = false;
      this.root.add(label);
      return { node, label, hub, city };
    }).filter(Boolean);

    this.corridorVisuals = demo.corridors.map((corridor, index) => {
      const curve = this.polylineCurve(corridor.path, Z_BASE + 0.22);
      const style = CORRIDOR_LINE_STYLE[corridor.family] ?? CORRIDOR_LINE_STYLE.land;
      const flow = makeDigitalRoute(curve, {
        color: corridor.color,
        width: style.width,
        opacity: style.opacity,
        dashed: style.dashed,
        dashSize: style.dashSize,
        gapSize: style.gapSize,
        samples: 64,
        phase: index * 0.21,
        resolution: lineResolution,
        packetCount: style.packetCount,
        packetSize: style.packetSize,
        speed: style.speed,
      });
      flow.group.visible = false;
      this.root.add(flow.group);
      const mapLabel = corridor.mapLabel
        ? makeSprite(corridor.mapLabel, corridor.color, { width: 5.0, height: 1.05, fontSize: 42, tint: true })
        : null;
      if (mapLabel && corridor.labelCoord) {
        mapLabel.position.copy(this.worldCoord(corridor.labelCoord, Z_BASE + 0.6));
        mapLabel.visible = false;
        this.root.add(mapLabel);
      }
      const originLabel = corridor.originLabel
        ? makeSprite(corridor.originLabel, corridor.color, { width: 5.2, height: 1.0, fontSize: 38, tint: true })
        : null;
      if (originLabel && corridor.originCoord) {
        originLabel.position.copy(this.worldCoord(corridor.originCoord, Z_BASE + 0.58));
        originLabel.visible = false;
        this.root.add(originLabel);
      }
      const extLabel = corridor.externalLabel
        ? makeSprite(corridor.externalLabel, corridor.core ?? corridor.color, {
          width: 4.6, height: 0.98, fontSize: 40, tint: true,
        })
        : null;
      if (extLabel && corridor.externalCoord) {
        extLabel.position.copy(this.worldCoord(corridor.externalCoord, Z_BASE + 0.55));
        extLabel.visible = false;
        this.root.add(extLabel);
      }
      return { ...flow, corridor, mapLabel, originLabel, extLabel };
    });

    this.seaVisuals = demo.seaRoutes.map((sr, index) => {
      const fromCity = cityMap.get(sr.from);
      if (!fromCity) return null;
      const start = this.worldCoord([fromCity.lng, fromCity.lat], Z_BASE + 0.22);
      const end = this.worldCoord(sr.target, Z_BASE + 0.22);
      const mid = start.clone().lerp(end, 0.5);
      mid.z += 1.05;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const seaStyle = CORRIDOR_LINE_STYLE.sea;
      const flow = makeDigitalRoute(curve, {
        color: CORRIDOR_COLORS.sea,
        width: seaStyle.width,
        opacity: seaStyle.opacity,
        dashed: seaStyle.dashed,
        dashSize: seaStyle.dashSize,
        gapSize: seaStyle.gapSize,
        samples: 48,
        phase: index * 0.21,
        resolution: lineResolution,
        packetCount: seaStyle.packetCount,
        packetSize: seaStyle.packetSize,
        speed: seaStyle.speed,
      });
      const label = makeSprite(sr.label, CORRIDOR_COLORS.sea, {
        width: 3.6, height: 0.86, fontSize: 36, tint: true,
      });
      label.position.copy(this.worldCoord(sr.target, Z_BASE + 0.62));
      flow.group.add(label);
      flow.group.visible = false;
      this.root.add(flow.group);
      return { ...flow, sr, label };
    }).filter(Boolean);

    this.seaLaneLabel = null;
    if (demo.seaLaneLabel) {
      this.seaLaneLabel = makeSprite(demo.seaLaneLabel.text, CORRIDOR_COLORS.sea, {
        width: 4.4, height: 0.95, fontSize: 38, tint: true,
      });
      this.seaLaneLabel.position.copy(this.worldCoord(demo.seaLaneLabel.coord, Z_BASE + 0.62));
      this.seaLaneLabel.visible = false;
      this.root.add(this.seaLaneLabel);
    }

    this.capitalLabels = (demo.otherProvinceCapitals ?? []).map((cap) => {
      const g = new THREE.Group();
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glowMat(THEME.outerLabel, 0.78));
      const label = makeSprite(cap.name, THEME.outerLabel, {
        width: Math.max(3.4, cap.name.length * 1.15), height: 0.86, fontSize: 36, tint: true,
      });
      label.position.z = 0.48;
      g.add(dot, label);
      g.position.copy(this.worldCoord([cap.lng, cap.lat], Z_BASE + 0.08));
      g.visible = true;
      this.root.add(g);
      return { group: g, cap };
    });

    this.buildOutlineTrail();
  }

  buildOutlineTrail() {
    const rings = this.runtime.baseMap?.provinceRings?.get(this.demo.province) ?? [];
    const outer = rings[0]?.outer;
    if (!outer?.length) {
      this.outlineTrail = null;
      return;
    }
    const points = outer.map(([x, y]) => new THREE.Vector3(x, y, Z_BASE - 0.02));
    this.outlinePoints = points;
    this.outlineIndex = 0;
    const geometry = new THREE.BufferGeometry();
    const seed = points.slice(0, 28);
    geometry.setFromPoints(seed);
    const material = new THREE.PointsMaterial({
      color: toNumberColor(THEME.shandongOutline),
      size: 0.08,
      transparent: true,
      opacity: 0.42,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.outlineTrail = new THREE.Points(geometry, material);
    this.outlineTrail.frustumCulled = false;
    this.outlineTrail.renderOrder = 18;
    this.root.add(this.outlineTrail);
  }

  // ──────────── lifecycle ────────────
  start() {
    this.runtime.abortHomeIntro?.();
    this.active = true;
    this.playing = true;
    this.completed = false;
    this.elapsed = 0;
    this.stageIndex = -1;
    this.lastTimestamp = performance.now();
    this.lastUiUpdate = 0;
    this.cameraFollow = true;
    if (!this.runtime.storyReturnSnapshot) {
      this.runtime.storyReturnSnapshot = this.runtime.captureViewSnapshot?.() ?? null;
    }
    this.runtime.controls.enabled = true;
    this.runtime.cameraUserOverride = false;
    this.runtime.enterRegionDemoView?.(this.demo.province);
    this.runtime.setState(MAP_STATES.COMBINED, { story: true });
    this.runtime.setStorySheetWeights?.({ infrastructure: 0, operation: 0, digital: 0 });
    this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 0, digital: 0 });
    this.runtime.setStorySheetWeights?.({ infrastructure: 0, operation: 0, digital: 0 });
    this.rebuildVisuals();
    this.root.visible = true;
    this.root.scale.set(1, 1, 1);
    this.syncRootToMap();
    this.resetVisibility();
    this.showHud();
    this.focusShandong(2.4, { fromNational: true });
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
    this.runtime.controls.enabled = true;
    this.runtime.ui.setStoryPlayback('playing');
  }

  stop({ restoreScene = true, hideUi = true } = {}) {
    if (!this.active && !this.completed) return;
    this.active = false;
    this.playing = false;
    this.completed = false;
    this.root.visible = false;
    this.runtime.controls.enabled = true;
    this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
    this.runtime.setStorySheetWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
    this.runtime.exitRegionDemoView?.();
    this.runtime.setStoryContentIsolation?.(false);
    if (hideUi) this.runtime.ui.hideStory();
    if (restoreScene) {
      const snapshot = this.runtime.storyReturnSnapshot;
      this.runtime.storyReturnSnapshot = null;
      if (snapshot && this.runtime.restoreViewSnapshot) this.runtime.restoreViewSnapshot(snapshot);
      else this.runtime.applyState({ state: this.runtime.stateMachine.state, context: {} }, true);
    }
  }

  complete() {
    this.active = false;
    this.playing = false;
    this.completed = true;
    this.root.visible = true;
    this.runtime.controls.enabled = true;
    this.runtime.ui.completeStory(this.demoAsStory());
  }

  toggleCameraFollow() {
    this.cameraFollow = !this.cameraFollow;
    this.runtime.ui.setStoryCameraFollow?.(this.cameraFollow);
    if (this.cameraFollow && this.stageIndex >= 0) {
      this.applyStageCam(this.demo.stages[this.stageIndex]?.id, 0.65);
    }
  }

  // ──────────── update loop ────────────
  update(timestamp = performance.now()) {
    if (!this.active || !this.playing) return;
    const delta = Math.max(0, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    this.elapsed = Math.min(this.demo.duration, this.elapsed + delta);

    const idx = this.demo.stages.findIndex((s) => this.elapsed >= s.start && this.elapsed < s.end);
    const safe = idx === -1 ? this.demo.stages.length - 1 : idx;
    const stage = this.demo.stages[safe];
    if (safe !== this.stageIndex) {
      this.stageIndex = safe;
      this.enterStage(stage, safe);
    }
    const progress = clamp01((this.elapsed - stage.start) / Math.max(0.001, stage.end - stage.start));
    this.syncRootToMap();
    this.syncLineResolution();
    this.updateVisuals(stage.id, progress, this.elapsed);
    this.updateOutlineTrail(this.elapsed);

    if (timestamp - this.lastUiUpdate > 80) {
      this.runtime.ui.updateStoryProgress(this.elapsed / this.demo.duration, progress, stage);
      this.lastUiUpdate = timestamp;
    }
    if (this.elapsed >= this.demo.duration) this.complete();
  }

  enterStage(stage, index) {
    this.runtime.ui.updateStoryStage(stage, index, this.demoAsStory());
    this.applyStageCam(stage.id, 0.9);
  }

  applyStageCam(stageId, dur = 0.75) {
    if (!this.cameraFollow) return;
    this.focusShandong(dur);
  }

  focusShandong(dur, { fromNational = false } = {}) {
    this.runtime.focusRegionDemoCamera?.(dur, { fromNational });
  }

  moveCam(position, target, duration, fov = 35) {
    if (!this.cameraFollow) return;
    this.runtime.cameraDirector.moveTo(position, target, duration, { fov });
  }

  updateOutlineTrail(elapsed) {
    if (!this.outlineTrail || !this.outlinePoints?.length) return;
    const total = this.outlinePoints.length;
    const windowSize = Math.min(32, total);
    this.outlineIndex = (elapsed * 28) % total;
    const start = Math.floor(this.outlineIndex);
    const segment = [];
    for (let i = 0; i < windowSize; i += 1) segment.push(this.outlinePoints[(start + i) % total]);
    this.outlineTrail.geometry.setFromPoints(segment);
    this.outlineTrail.visible = elapsed < 11;
  }

  // ──────────── visual updates ────────────
  resetVisibility() {
    this.industrySpots?.forEach(({ spot }) => { spot.visible = false; });
    this.industryLabels?.forEach(({ label }) => { label.visible = false; });
    this.clusterArcs?.forEach(({ group }) => { group.visible = false; });
    this.hubFlowArcs?.forEach(({ group }) => { group.visible = false; });
    this.hubNodes?.forEach(({ node, label }) => {
      node.visible = false;
      if (label) label.visible = false;
    });
    this.corridorVisuals?.forEach(({ group, extLabel, mapLabel, originLabel }) => {
      group.visible = false;
      if (extLabel) extLabel.visible = false;
      if (mapLabel) mapLabel.visible = false;
      if (originLabel) originLabel.visible = false;
    });
    this.seaVisuals?.forEach(({ group }) => { group.visible = false; });
    if (this.seaLaneLabel) this.seaLaneLabel.visible = false;
    this.capitalLabels?.forEach(({ group }) => { group.visible = true; });
  }

  updateVisuals(stageId, progress, elapsed) {
    const t = elapsed;
    const corridorPhase = smoothStep(t, 11, 11.7);

    this.industrySpots?.forEach(({ spot, ind }, index) => {
      const appear = smoothStep(t, ind.start, ind.start + 0.5);
      const dim = 1 - 0.62 * corridorPhase;
      spot.visible = appear > 0.01 && t >= 5;
      if (!spot.visible) return;
      spot.scale.setScalar((0.82 + 0.18 * appear) * (0.78 + 0.22 * dim));
      const { ring, ripple, core } = spot.userData;
      const rippleT = clamp01((t - ind.start) / 0.55);
      if (ripple) {
        ripple.scale.setScalar(1 + 1.7 * rippleT);
        ripple.material.opacity = appear * 0.42 * (1 - rippleT) * dim;
      }
      if (ring) {
        const breath = 1 + 0.07 * Math.sin((t / 1.8) * Math.PI * 2 + index);
        ring.scale.setScalar(breath);
        ring.material.opacity = 0.55 * appear * dim;
      }
      if (core) core.material.opacity = 0.92 * appear * (0.45 + 0.55 * dim);
    });

    this.industryLabels?.forEach(({ label, ind }) => {
      const appear = smoothStep(t, ind.start + 0.12, ind.start + 0.55);
      const keep = t < 11 ? 1 : 1 - smoothStep(t, 11, 11.55);
      const opacity = appear * keep;
      label.visible = appear > 0.08 && opacity > 0.05 && t >= 5;
      setSpriteOpacity(label, opacity, t < 11 ? 1 : 0.72);
    });

    const clusterAmt = t < 7
      ? 0
      : t < 10.55
        ? smoothStep(t, 7, 7.55)
        : 1 - smoothStep(t, 10.55, 11);
    this.clusterArcs?.forEach((item, i) => {
      item.group.visible = clusterAmt > 0.02;
      if (item.group.visible) driveDigitalRoute(item, t, clusterAmt);
      else item.group.visible = false;
      if (item.group.visible) item.group.renderOrder = 20 + i;
    });

    const hubFlowAmt = t < 9
      ? 0
      : t < 11
        ? smoothStep(t, 9, 9.55)
        : 1 - smoothStep(t, 11, 11.22);
    this.hubFlowArcs?.forEach((item) => {
      item.group.visible = hubFlowAmt > 0.02;
      if (item.group.visible) driveDigitalRoute(item, t, hubFlowAmt);
    });

    this.hubNodes?.forEach(({ node, label, hub }, index) => {
      const appear = smoothStep(t, hub.appear, hub.appear + 0.4);
      node.visible = appear > 0.02 && t >= 9;
      if (label) {
        label.visible = appear > 0.2 && t >= 9;
        setSpriteOpacity(label, appear * (0.55 + 0.45 * corridorPhase), 0.92 + 0.08 * corridorPhase);
      }
      if (!node.visible) return;
      const bright = 0.55 + 0.45 * appear;
      node.scale.setScalar(0.85 + 0.15 * appear);
      const { core, ring, ring2, ripple, kind } = node.userData;
      const after = t >= 11;
      if (core) {
        core.material.color.set(toNumberColor(
          kind === 'core' && after ? THEME.coreHub : kind === 'port' && after ? THEME.port : THEME.hubFill,
        ));
        core.material.opacity = bright;
      }
      if (ring) {
        ring.material.color.set(toNumberColor(kind === 'port' && after ? THEME.port : THEME.hubRing));
        const breath = 1 + 0.08 * Math.sin((t / 1.8) * Math.PI * 2 + index);
        ring.scale.setScalar(breath);
        ring.material.opacity = 0.7 * bright;
      }
      if (ring2) ring2.material.opacity = (after ? 0.5 : 0.28) * bright;
      if (ripple && hub.pulse != null) {
        const local = t - hub.pulse;
        if (local >= 0 && local <= 1.15) {
          const k = local / 1.15;
          ripple.scale.setScalar(1 + 2.4 * k);
          ripple.material.opacity = 0.55 * (1 - k);
        } else {
          ripple.material.opacity = 0;
          ripple.scale.setScalar(1);
        }
      }
    });

    this.corridorVisuals?.forEach((item) => {
      const onset = item.corridor.onset;
      const appear = t < 11 ? 0 : smoothStep(t, onset, onset + 0.9);
      item.group.visible = appear > 0.01;
      if (item.group.visible) {
        driveDigitalRoute(item, t, appear);
      }
      const labelAmt = appear;
      if (item.mapLabel) {
        item.mapLabel.visible = labelAmt > 0.35;
        setSpriteOpacity(item.mapLabel, labelAmt * 0.92);
      }
      if (item.originLabel) {
        item.originLabel.visible = labelAmt > 0.4;
        setSpriteOpacity(item.originLabel, labelAmt * 0.9);
      }
      if (item.extLabel) {
        item.extLabel.visible = labelAmt > 0.45;
        setSpriteOpacity(item.extLabel, labelAmt * 0.88);
      }
    });

    this.seaVisuals?.forEach((item) => {
      const onset = item.sr.onset;
      const appear = t < 15 ? 0 : smoothStep(t, onset, onset + 1.05);
      item.group.visible = appear > 0.01;
      if (item.group.visible) {
        driveDigitalRoute(item, t, appear);
        if (item.label?.material) item.label.material.opacity = appear * 0.85;
      }
    });

    if (this.seaLaneLabel) {
      const appear = t < 15 ? 0 : smoothStep(t, this.demo.seaLaneLabel.onset, this.demo.seaLaneLabel.onset + 0.6);
      this.seaLaneLabel.visible = appear > 0.12;
      setSpriteOpacity(this.seaLaneLabel, appear * 0.88);
    }
  }

  demoAsStory() {
    return {
      id: this.demo.id,
      title: this.demo.title,
      duration: this.demo.duration,
      stages: this.demo.stages,
      chapters: this.demo.chapters,
      shipment: {
        cargo: '国家物流枢纽',
        quantity: SHANDONG_REAL_STATS.nationalHubCities,
        unit: '个',
        origin: '山东',
        destination: '全国',
        serviceLevel: `${SHANDONG_REAL_STATS.cityCount}个地市`,
      },
      flow: { originProvince: '山东', destinationProvince: '全国' },
      ui: {
        captionIndex: '山东省区域物流平台',
        captionTitle: '山东省区域物流平台',
        captionSubtitle: '一张图汇聚全省物流资源，一张网连接国内国际通道',
        liveCaption: 'stage',
        completeIndex: '全省格局',
        completeCaptionIndex: '山东省区域物流平台',
        shipmentLabels: { cargo: '国家物流枢纽', route: '覆盖范围', requirement: '城市节点' },
        completionMetrics: shandongKpiMetrics,
        stageMetrics: {
          sd_focus: shandongKpiMetrics,
          sd_industry: [['重点产业', '5类'], ['物流枢纽', '济南临沂青岛日照'], ['货流方向', '向枢纽聚集']],
          sd_corridors: [['国内陆路', '北南西'], ['港口集疏运', '胶东/鲁西南'], ['国际通道', '海运+班列']],
          sd_network: shandongKpiMetrics,
          sd_overview: shandongKpiMetrics,
        },
      },
      result: {
        title: '山东省区域物流平台',
        subtitle: '一张图汇聚全省物流资源，一张网连接国内国际物流通道',
        productionImpact: '全省物流一张图',
        actualDuration: '30s',
        eventCount: 0,
      },
      candidates: [],
      capacityResponses: [],
      confirmations: [],
      platforms: [],
      subjects: [],
      execution: { modes: [], nodes: [] },
    };
  }

  showHud() {
    const storyLike = this.demoAsStory();
    this.runtime.ui.showStory(storyLike);
  }
}
