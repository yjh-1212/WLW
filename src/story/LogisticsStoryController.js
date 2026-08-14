import * as THREE from 'three';
import { MAP_STATES } from '../core/MapStateMachine.js';
import { MAP_THEME, toNumberColor } from '../theme/mapTheme.js';

const STACK = Object.freeze({
  scale: 0.94,
  // Keep story routes/nodes flush with the national exploded sheets
  // (infrastructure -8 / operation 9 / digital 26) instead of floating high above.
  infrastructure: -7.6,
  operation: 9.4,
  digital: 26.4,
  platform: 28.6,
});

const MODE_STYLE = Object.freeze({
  vehicle: { color: '#f5ff8a', casing: '#2a2208', radius: 0.11, label: '商品车运输' },
  road: { color: '#ffbd59', casing: '#2a1708', radius: 0.10, label: '公路' },
  rail: { color: '#80dfff', casing: '#061923', radius: 0.12, label: '铁路' },
  sea: { color: '#56e6ff', casing: '#05202a', radius: 0.15, label: '海运' },
});

const formatCostChange = (value) => {
  const amount = Number(value ?? 0);
  if (!amount) return '持平';
  return `${amount < 0 ? '↓' : '↑'}${Math.abs(amount)}%`;
};

const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const STORY_LABEL_VISUAL_SCALE = 1.52;
const smoothStep = (value, start = 0, end = 1) => {
  const amount = clamp01((value - start) / Math.max(0.001, end - start));
  return amount * amount * (3 - 2 * amount);
};

const setVisualOpacity = (root, opacity) => {
  if (!root) return;
  const amount = clamp01(opacity);
  root.visible = amount > 0.005;
  root.userData.storyVisualOpacity = amount;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.storyOpacity === undefined) {
        material.userData.storyOpacity = material.opacity ?? 1;
        material.transparent = true;
        material.depthTest = false;
        material.depthWrite = false;
      }
      const nextOpacity = material.userData.storyOpacity * amount;
      if (Math.abs(material.opacity - nextOpacity) > 0.001) material.opacity = nextOpacity;
    });
  });
};

const glowMaterial = (color, opacity = 1, blending = THREE.AdditiveBlending) => new THREE.MeshBasicMaterial({
  color: toNumberColor(color), transparent: true, opacity, depthTest: false, depthWrite: false, blending,
});

const makeTube = (curve, color, radius = 0.075, opacity = 0.7, segments = 96) => {
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(12, segments), radius, 6, false),
    glowMaterial(color, opacity),
  );
  tube.frustumCulled = false;
  tube.renderOrder = 22;
  return tube;
};

function makeLabelSprite(text, color, { width = 10.5, height = 2.45, scale = 1, priority = 8 } = {}) {
  const materialOptions = { color: 0xffffff, transparent: true, depthTest: false, depthWrite: false };
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const lines = String(text).split('\n').slice(0, 2);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(3, 16, 28, 0.96)';
    context.strokeStyle = color;
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(8, 8, 496, 112, 18);
    context.fill();
    context.stroke();
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#e8fbff';
    context.font = `700 ${lines.length > 1 ? 40 : 46}px "Microsoft YaHei", sans-serif`;
    context.fillText(lines[0], 256, lines.length > 1 ? 46 : 64);
    if (lines[1]) {
      context.fillStyle = color;
      context.font = '600 30px "Microsoft YaHei", sans-serif';
      context.fillText(lines[1], 256, 90);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    materialOptions.map = texture;
  } else {
    materialOptions.opacity = 0;
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial(materialOptions));
  sprite.scale.set(width * scale * STORY_LABEL_VISUAL_SCALE, height * scale * STORY_LABEL_VISUAL_SCALE, 1);
  sprite.renderOrder = 40;
  sprite.userData.kind = 'story-label';
  sprite.userData.labelPriority = priority;
  return sprite;
}

function makeBeacon(color, label, { scale = 1, labelOffset = 1.05, labelWidth = 11.6, labelHeight = 2.7 } = {}) {
  const root = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.10 * scale, 0.18 * scale, 0.55 * scale, 8), glowMaterial(color, 0.74));
  stem.rotation.x = Math.PI / 2;
  stem.position.z = 0.28 * scale;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.28 * scale, 14, 10), glowMaterial('#ffffff', 0.96));
  core.position.z = 0.62 * scale;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42 * scale, 0.54 * scale, 32), glowMaterial(color, 0.66));
  ring.position.z = 0.06;
  root.add(stem, core, ring);
  if (label) {
    const labelSprite = makeLabelSprite(label, color, { width: labelWidth, height: labelHeight, scale: 0.92 * scale, priority: 12 });
    labelSprite.position.set(0, 0, labelOffset * scale);
    root.add(labelSprite);
    root.userData.label = labelSprite;
  }
  root.userData.core = core;
  root.userData.ring = ring;
  return root;
}

function makePlatformPod(platform, color) {
  const root = new THREE.Group();
  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.72, 0.34, 40),
    new THREE.MeshBasicMaterial({ color: toNumberColor('#071f31'), transparent: true, opacity: 0.88, depthTest: false, depthWrite: false }),
  );
  deck.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.57, 0.10, 8, 48), glowMaterial(color, 0.82));
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.47, 1), glowMaterial('#e9fcff', 0.95));
  core.position.z = 0.42;
  const label = makeLabelSprite(`${platform.name}\n${platform.capability}`, color, { width: 12.2, height: 2.85, scale: 0.86, priority: 11 });
  label.position.z = 1.35;
  root.add(deck, rim, core, label);
  root.userData = { core, rim, label, platformId: platform.id };
  return root;
}

function makeModeMarker(mode) {
  const style = MODE_STYLE[mode] ?? MODE_STYLE.road;
  const root = new THREE.Group();
  if (mode === 'sea') {
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.65, 5), glowMaterial(style.color, 0.96, THREE.NormalBlending));
    hull.rotation.z = -Math.PI / 2;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.42), glowMaterial('#eafcff', 0.92, THREE.NormalBlending));
    cabin.position.z = 0.34;
    root.add(hull, cabin);
  } else if (mode === 'rail') {
    const engine = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.54, 0.50), glowMaterial(style.color, 0.95, THREE.NormalBlending));
    const wagon = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.50, 0.42), glowMaterial('#dff8ff', 0.72, THREE.NormalBlending));
    wagon.position.x = -1.18;
    root.add(engine, wagon);
  } else if (mode === 'vehicle') {
    [-0.58, 0, 0.58].forEach((offset, index) => {
      const car = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.27, 0.22), glowMaterial(index === 1 ? '#ffffff' : style.color, 0.96, THREE.NormalBlending));
      car.position.x = offset;
      root.add(car);
    });
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.55, 0.42), glowMaterial(style.color, 0.96, THREE.NormalBlending));
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.60, 0.58), glowMaterial('#fff4d1', 0.96, THREE.NormalBlending));
    cab.position.x = 0.68;
    root.add(body, cab);
  }
  root.traverse((object) => { object.renderOrder = 32; });
  root.visible = false;
  return root;
}

export class LogisticsStoryController {
  constructor(runtime) {
    this.runtime = runtime;
    this.root = new THREE.Group();
    this.root.name = 'IndustrialGoodsThreeNetworkStory';
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
    this.visualStoryVersion = null;
    this.audioContext = null;
    this.contractThumpPlayed = false;
    this.cameraFollow = true;
    this.followingMarker = false;
    this.cameraMoveUntil = 0;
    this.followDelta = 0.016;
    this.followAnchor = new THREE.Vector3();
    this.followScratch = {
      marker: new THREE.Vector3(),
      target: new THREE.Vector3(),
      position: new THREE.Vector3(),
    };
    this.handleControlStart = () => {
      if (!this.active) return;
      this.setCameraFollow(false, { recenter: false });
    };
    this.runtime.controls.addEventListener?.('start', this.handleControlStart);
  }

  worldCoordinate(coordinates, z) {
    const point = this.runtime.projector.fromLngLat(coordinates, 0);
    return new THREE.Vector3(point.x * STACK.scale, point.y * STACK.scale, z);
  }

  makePolylineCurve(coordinates, z) {
    const points = coordinates.map((coordinate) => this.worldCoordinate(coordinate, z));
    const curve = new THREE.CurvePath();
    for (let index = 0; index < points.length - 1; index += 1) curve.add(new THREE.LineCurve3(points[index], points[index + 1]));
    return curve;
  }

  makeDataArc(start, end, color, offset = 2.8) {
    const middle = start.clone().lerp(end, 0.5);
    middle.z += offset;
    const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
    const root = new THREE.Group();
    root.add(makeTube(curve, color, 0.045, 0.38, 40));
    const packet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), glowMaterial('#ffffff', 0.96));
    packet.renderOrder = 31;
    root.add(packet);
    root.userData = { curve, packet };
    return root;
  }

  coordinatesInProvince(coordinates, provinceName) {
    if (!Array.isArray(coordinates) || !provinceName) return true;
    const province = this.runtime.data?.provinceBoundaries?.provinces?.[provinceName];
    if (!province) return true;
    const points = province.cities.flatMap((city) => city.paths.flat());
    if (!points.length) return true;
    const longitudes = points.map((point) => point[0]);
    const latitudes = points.map((point) => point[1]);
    const margin = 0.18;
    return coordinates[0] >= Math.min(...longitudes) - margin
      && coordinates[0] <= Math.max(...longitudes) + margin
      && coordinates[1] >= Math.min(...latitudes) - margin
      && coordinates[1] <= Math.max(...latitudes) + margin;
  }

  setProvinceScopedStoryVisuals(enabled) {
    const provinceName = enabled ? (this.runtime.storyProvinceFocus ?? this.story?.ui?.focusProvince) : null;
    const stageId = this.story?.stages?.[this.stageIndex]?.id;
    const keepTrustedSpace = ['platform_space', 'transport_demand', 'capacity_response', 'route_solve', 'consensus'].includes(stageId);
    const setScopedVisibility = (root, coordinates) => {
      root.visible = Boolean(!provinceName || this.coordinatesInProvince(coordinates, provinceName));
    };
    this.platformPods.forEach((pod) => {
      const platform = this.story.platforms.find((item) => item.id === pod.userData.platformId);
      pod.userData.storyBaseScale ??= pod.scale.clone();
      pod.scale.copy(pod.userData.storyBaseScale).multiplyScalar(provinceName && platform?.id === 'trustedSpace' ? 0.56 : 1);
      pod.visible = Boolean((keepTrustedSpace && platform?.id === 'trustedSpace') || !provinceName || this.coordinatesInProvince(platform?.coordinates, provinceName));
    });
    this.platformTethers.forEach(({ tether, platform }) => {
      tether.visible = Boolean((keepTrustedSpace && platform.id === 'trustedSpace') || !provinceName || this.coordinatesInProvince(platform.coordinates, provinceName));
    });
    this.digitalSubjects.beacons.forEach((beacon) => {
      const subject = this.story.subjects.find((item) => item.id === beacon.userData.subjectId);
      setScopedVisibility(beacon, subject?.coordinates);
    });
    const localPlatformIds = new Set(
      (this.story.platforms ?? [])
        .filter((platform) => platform.id !== 'trustedSpace' && (!provinceName || this.coordinatesInProvince(platform.coordinates, provinceName)))
        .map((platform) => platform.id),
    );
    this.operationSubjects.beacons.forEach((beacon) => {
      const subject = this.story.subjects.find((item) => item.id === beacon.userData.subjectId);
      beacon.visible = Boolean(!provinceName || localPlatformIds.has(subject?.platformId));
      const label = beacon.userData.label;
      if (!label) return;
      label.userData.storyBaseScale ??= label.scale.clone();
      label.scale.copy(label.userData.storyBaseScale).multiplyScalar(provinceName ? 0.78 : 1);
    });
    this.infrastructureBeacons.forEach((beacon) => {
      const node = this.story.execution.nodes.find((item) => item.id === beacon.userData.nodeId);
      setScopedVisibility(beacon, node?.coordinates);
    });
    this.subjectDataArcs.forEach((arc, index) => setScopedVisibility(arc, this.story.subjects[index]?.coordinates));
    const trustedSpace = this.story.platforms.find((item) => item.id === 'trustedSpace');
    const trustedSpaceInProvince = !provinceName || this.coordinatesInProvince(trustedSpace?.coordinates, provinceName);
    this.platformPackets.forEach((arc) => { arc.visible = trustedSpaceInProvince; });
    const demandLabel = this.demandStream?.userData?.label;
    if (demandLabel) {
      demandLabel.userData.storyBaseScale ??= demandLabel.scale.clone();
      demandLabel.scale.copy(demandLabel.userData.storyBaseScale).multiplyScalar(provinceName ? 0.58 : 1);
    }
    if (provinceName) {
      this.demandStream.visible = stageId === 'transport_demand';
      this.capacityStreams.forEach((stream) => { stream.visible = false; });
      this.aiHub.visible = false;
      this.consensusGroup.visible = false;
      this.candidateCorridors.forEach((candidate) => { candidate.root.visible = false; });
    }
    [this.digitalRoutes, this.operationRoutes, this.infrastructureRoutes].forEach((bundle) => {
      bundle.legs.forEach((leg) => {
        const scoped = !provinceName || (leg.path ?? []).every((point) => this.coordinatesInProvince(point, provinceName));
        leg.root.visible = scoped;
      });
    });
    [this.platformToDigital, this.digitalToOperation, this.operationToInfrastructure, this.feedbackBeams].forEach((group) => {
      group.userData.beams.forEach((beam) => setScopedVisibility(beam, beam.userData.coordinates));
    });
  }

  makeDataStreamArc(start, end, color, label, offset = 3.2, packetCount = 7, labelPosition = 0.18, labelScale = 0.56) {
    const middle = start.clone().lerp(end, 0.5);
    middle.z += offset;
    const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
    const root = new THREE.Group();
    root.add(makeTube(curve, color, 0.055, 0.42, 56));
    const packets = Array.from({ length: packetCount }, (_, index) => {
      const packet = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.18, 0.16),
        glowMaterial(index % 3 === 0 ? '#ffffff' : color, 0.98),
      );
      packet.userData.offset = index / packetCount;
      packet.renderOrder = 34;
      root.add(packet);
      return packet;
    });
    if (label) {
      const labelSprite = makeLabelSprite(label, color, { width: 12.6, height: 2.85, scale: labelScale, priority: 14 });
      labelSprite.position.copy(curve.getPointAt(labelPosition));
      labelSprite.position.z += 0.55;
      root.add(labelSprite);
      root.userData.label = labelSprite;
    }
    root.userData = { ...root.userData, curve, packets };
    return root;
  }

  buildCandidateCorridor(candidate, z) {
    const root = new THREE.Group();
    root.name = `CandidateRoute-${candidate.id}`;
    const curve = this.makePolylineCurve(candidate.path, z);
    root.add(makeTube(curve, '#06131f', 0.22, 0.82, 120));
    root.add(makeTube(curve, candidate.color, 0.105, 0.96, 120));
    const particles = Array.from({ length: 8 }, (_, index) => {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), glowMaterial(index % 2 ? '#ffffff' : candidate.color, 0.94));
      particle.userData.offset = index / 8;
      particle.renderOrder = 33;
      root.add(particle);
      return particle;
    });
    const label = makeLabelSprite(`${candidate.id}  ${candidate.name}\n匹配度 ${candidate.score}%`, candidate.color, { width: 10.4, height: 2.55, scale: 0.61, priority: 15 });
    label.position.copy(curve.getPointAt(candidate.id === 'B' ? 0.52 : 0.67));
    label.position.z += 0.75;
    root.add(label);
    this.root.add(root);
    return { root, curve, particles, candidate };
  }

  buildRouteLayer(routeLegs, z, name) {
    const root = new THREE.Group();
    root.name = name;
    const legs = new Map();
    routeLegs.forEach((leg, index) => {
      if (!Array.isArray(leg.path) || leg.path.length < 2) return;
      const style = MODE_STYLE[leg.mode] ?? MODE_STYLE.road;
      const curve = this.makePolylineCurve(leg.path, z + index * 0.018);
      const legGroup = new THREE.Group();
      legGroup.name = `${name}-${leg.id}`;
      const segments = Math.min(560, Math.max(28, leg.path.length * 3));
      legGroup.add(makeTube(curve, style.casing, style.radius * 1.9, 0.76, segments));
      legGroup.add(makeTube(curve, leg.color ?? style.color, style.radius, 0.94, segments));
      const particles = Array.from({ length: 5 }, (_, particleIndex) => {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.12 + (particleIndex % 2) * 0.025, 8, 6), glowMaterial(particleIndex % 2 ? '#ffffff' : style.color, 0.90));
        particle.userData.offset = particleIndex / 5;
        particle.renderOrder = 30;
        legGroup.add(particle);
        return particle;
      });
      const marker = makeModeMarker(leg.mode);
      legGroup.add(marker);
      root.add(legGroup);
      legs.set(leg.id, { ...leg, style, root: legGroup, curve, length: curve.getLength(), particles, marker });
    });
    this.root.add(root);
    return { root, legs };
  }

  buildSubjectLayer(subjects, z, name, color) {
    const root = new THREE.Group();
    root.name = name;
    const beacons = [];
    subjects.forEach((subject, index) => {
      const caption = subject.task ? `${subject.name}\n${subject.task}` : `${subject.name}\n${subject.role}`;
      const beacon = makeBeacon(color, caption, {
        scale: 0.84,
        labelOffset: 2.05 + (index % 2) * 0.36,
        labelWidth: subject.task ? 10.6 : 9.8,
        labelHeight: 2.42,
      });
      beacon.position.copy(this.worldCoordinate(subject.coordinates, z));
      if (beacon.userData.label) beacon.userData.label.position.x = index % 2 ? 1.15 : -1.15;
      beacon.userData.phase = index * 0.61;
      beacon.userData.subjectId = subject.id;
      root.add(beacon);
      beacons.push(beacon);
    });
    this.root.add(root);
    return { root, beacons };
  }

  buildVerticalGroup(coordinates, startZ, endZ, color, name) {
    const root = new THREE.Group();
    root.name = name;
    const beams = coordinates.map((coordinate) => {
      const beam = this.makeVerticalBeam(this.worldCoordinate(coordinate, startZ), this.worldCoordinate(coordinate, endZ), color);
      beam.userData.coordinates = coordinate;
      root.add(beam);
      return beam;
    });
    root.userData.beams = beams;
    this.root.add(root);
    return root;
  }

  makePlatformTether(coordinates, topZ, color, labelText) {
    const root = new THREE.Group();
    const base = this.worldCoordinate(coordinates, STACK.digital + 0.22);
    const height = Math.max(0.1, topZ - base.z);
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height, 8, 1, true), glowMaterial(color, 0.34));
    line.rotation.x = Math.PI / 2;
    line.position.set(base.x, base.y, base.z + height / 2);
    line.renderOrder = 20;
    const anchor = new THREE.Mesh(new THREE.RingGeometry(0.52, 0.68, 32), glowMaterial(color, 0.76));
    anchor.position.copy(base);
    anchor.renderOrder = 24;
    const cap = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.48, 28), glowMaterial('#ffffff', 0.62));
    cap.position.set(base.x, base.y, topZ);
    cap.renderOrder = 24;
    root.add(line, anchor, cap);
    if (labelText) {
      const label = makeLabelSprite(labelText, color, { width: 7.8, height: 2.0, scale: 0.62 });
      label.position.set(base.x, base.y, base.z + 0.75);
      root.add(label);
    }
    return root;
  }

  buildVisuals(story) {
    if (this.visualStoryVersion === `${story.id}:${story.version}`) return;
    this.clearVisuals();
    this.visualStoryVersion = `${story.id}:${story.version}`;
    const routeLegs = this.runtime.data?.infrastructure?.storyRoutes?.[story.id]?.legs
      ?? this.runtime.data?.infrastructure?.storyRoute?.legs
      ?? story.execution?.routeLegs
      ?? [];
    this.routeLegs = routeLegs;

    this.platformNetwork = new THREE.Group();
    this.platformNetwork.name = 'TrustedDataSpaceAndProvincialPlatforms';
    this.platformPoints = new Map();
    this.platformPods = [];
    const platformColor = (platformId) => platformId === 'trustedSpace' ? '#8df4c2'
      : platformId === story.flow?.originPlatformId ? '#70ddff'
        : platformId === story.flow?.transitPlatformId ? '#ffbd59' : '#ffd47d';
    story.platforms.forEach((platform, index) => {
      const color = platformColor(platform.id);
      const point = this.worldCoordinate(platform.coordinates, STACK.platform + Number(platform.heightOffset ?? 0));
      const pod = makePlatformPod(platform, color);
      pod.position.copy(point);
      pod.userData.phase = index * 0.78;
      this.platformNetwork.add(pod);
      this.platformPoints.set(platform.id, point);
      this.platformPods.push(pod);
    });
    this.platformTethers = [];
    story.platforms.forEach((platform) => {
      const color = platformColor(platform.id);
      const tether = this.makePlatformTether(platform.coordinates, this.platformPoints.get(platform.id)?.z ?? STACK.platform, color, null);
      this.platformNetwork.add(tether);
      this.platformTethers.push({ tether, platform });
    });
    this.platformPackets = [];
    const trustedSpacePoint = this.platformPoints.get('trustedSpace') ?? new THREE.Vector3(0, 0, STACK.platform);
    story.platforms.filter((platform) => platform.id !== 'trustedSpace').forEach((platform, index) => {
      const arc = this.makeDataArc(this.platformPoints.get(platform.id), trustedSpacePoint, index % 2 ? MAP_THEME.primarySoft : MAP_THEME.digitalBright, 0.85 + index * 0.12);
      this.platformNetwork.add(arc);
      this.platformPackets.push(arc);
    });
    this.root.add(this.platformNetwork);

    this.digitalSubjects = this.buildSubjectLayer(story.subjects.filter((subject) => subject.layers.includes('digital')), STACK.digital + 0.28, 'DigitalTradeSubjects', MAP_THEME.digitalBright);
    this.subjectArcsGroup = new THREE.Group();
    this.subjectArcsGroup.name = 'DigitalSubjectPlatformLinks';
    this.subjectDataArcs = [];
    story.subjects.forEach((subject, index) => {
      const platformPoint = this.platformPoints.get(subject.platformId) ?? trustedSpacePoint;
      const arc = this.makeDataArc(this.worldCoordinate(subject.coordinates, STACK.digital + 0.28), platformPoint, index % 2 ? MAP_THEME.primarySoft : MAP_THEME.digitalBright, 0.7 + (index % 3) * 0.18);
      this.subjectArcsGroup.add(arc);
      this.subjectDataArcs.push(arc);
    });
    this.root.add(this.subjectArcsGroup);

    this.overviewEndpoints = new THREE.Group();
    this.overviewEndpoints.name = 'ShipmentIntentEndpoints';
    const originSubject = story.subjects.find((subject) => subject.id === story.flow?.originSubjectId) ?? story.subjects[0];
    const destinationSubject = story.subjects.find((subject) => subject.id === story.flow?.destinationSubjectId) ?? story.subjects.at(-1);
    const overviewOrigin = this.worldCoordinate(originSubject.coordinates, STACK.digital + 0.28);
    const overviewDestination = this.worldCoordinate(destinationSubject.coordinates, STACK.digital + 0.28);
    const intentMiddle = overviewOrigin.clone().lerp(overviewDestination, 0.5);
    intentMiddle.z += 1.8;
    this.overviewEndpoints.add(makeTube(new THREE.QuadraticBezierCurve3(overviewOrigin, intentMiddle, overviewDestination), '#f5ff8a', 0.045, 0.20, 64));
    const originBeacon = makeBeacon('#f5ff8a', `${originSubject.name}\n${originSubject.role}`, { scale: 0.92, labelOffset: 1.15 });
    const destinationBeacon = makeBeacon('#8df4c2', `${destinationSubject.name}\n${destinationSubject.role}`, { scale: 0.92, labelOffset: 1.15 });
    originBeacon.position.copy(overviewOrigin);
    destinationBeacon.position.copy(overviewDestination);
    this.overviewEndpoints.add(originBeacon, destinationBeacon);
    this.overviewEndpointBeacons = [originBeacon, destinationBeacon];
    this.root.add(this.overviewEndpoints);

    this.digitalRoutes = this.buildRouteLayer(routeLegs, STACK.digital + 0.18, 'DigitalSolvedRoute');
    const selectedCandidate = story.candidates.find((candidate) => candidate.selected) ?? story.candidates[0];
    const selectedLabel = makeLabelSprite(`${selectedCandidate.id}  ${selectedCandidate.name}\n${selectedCandidate.transitTime} · 资源匹配 ${selectedCandidate.score}%`, selectedCandidate.color, { width: 10.8, height: 2.55, scale: 0.62, priority: 16 });
    selectedLabel.position.copy(this.worldCoordinate(story.flow?.routeLabelCoordinate ?? selectedCandidate.path?.at(Math.floor(selectedCandidate.path.length / 2)) ?? [114.31, 30.59], STACK.digital + 0.95));
    this.digitalRoutes.root.add(selectedLabel);
    this.candidateCorridors = story.candidates
      .filter((candidate) => !candidate.selected && Array.isArray(candidate.path))
      .map((candidate, index) => this.buildCandidateCorridor(candidate, STACK.digital + 0.28 + index * 0.08));

    this.operationSubjects = this.buildSubjectLayer(story.subjects.filter((subject) => subject.layers.includes('operation')), STACK.operation + 0.22, 'OperationParticipants', MAP_THEME.operationBright);
    this.operationRoutes = this.buildRouteLayer(routeLegs, STACK.operation + 0.16, 'OperationTaskRoute');
    this.infrastructureRoutes = this.buildRouteLayer(routeLegs, STACK.infrastructure + 0.18, 'InfrastructureExecutionRoute');

    this.infrastructureNodes = new THREE.Group();
    this.infrastructureNodes.name = 'InfrastructureExecutionNodes';
    this.infrastructureBeacons = [];
    story.execution.nodes.forEach((node, index) => {
      const beacon = makeBeacon(MAP_THEME.infrastructureBright, `${node.name}\n${node.role}`, { scale: 0.88, labelOffset: 1.1 + (index % 2) * 0.18, labelWidth: 12.4, labelHeight: 2.8 });
      beacon.position.copy(this.worldCoordinate(node.coordinates, STACK.infrastructure + 0.28));
      beacon.userData.phase = index * 0.57;
      beacon.userData.nodeId = node.id;
      this.infrastructureNodes.add(beacon);
      this.infrastructureBeacons.push(beacon);
    });
    this.root.add(this.infrastructureNodes);

    const subjectById = new Map(story.subjects.map((subject) => [subject.id, subject]));
    const aiPoint = trustedSpacePoint.clone();
    aiPoint.z += 0.45;

    this.aiHub = new THREE.Group();
    this.aiHub.name = 'TransportPlanDecisionHub';
    this.aiHub.position.copy(aiPoint);
    this.aiCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 1), glowMaterial('#f5ffff', 0.98));
    this.aiRings = [
      new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.075, 8, 64), glowMaterial('#65dcff', 0.86)),
      new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.055, 8, 64), glowMaterial('#8df4c2', 0.72)),
      new THREE.Mesh(new THREE.TorusGeometry(2.24, 0.040, 8, 64), glowMaterial('#f5ff8a', 0.58)),
    ];
    this.aiRings[1].rotation.x = Math.PI / 2.65;
    this.aiRings[2].rotation.y = Math.PI / 2.4;
    this.aiMatchingLabel = makeLabelSprite('物流可信数据空间\n运输方案计算中……', '#8df4c2', { width: 13.4, height: 3.15, scale: 0.84, priority: 22 });
    this.aiMatchingLabel.position.z = 1.55;
    this.aiSelectedLabel = makeLabelSprite(`${selectedCandidate.id} 方案已优选\n${selectedCandidate.transitTime} · 成本 ${formatCostChange(selectedCandidate.costChange)} · 匹配 ${selectedCandidate.score}%`, '#f4ff78', { width: 14.2, height: 3.15, scale: 0.84, priority: 23 });
    this.aiSelectedLabel.position.z = 1.55;
    this.aiHub.add(this.aiCore, ...this.aiRings, this.aiMatchingLabel, this.aiSelectedLabel);
    this.root.add(this.aiHub);

    const demandSource = subjectById.get(story.flow?.originSubjectId) ?? originSubject;
    this.demandStream = this.makeDataStreamArc(
      this.worldCoordinate(demandSource.coordinates, STACK.digital + 0.28),
      trustedSpacePoint,
      '#f5ff8a',
      `运输需求\n${story.shipment.cargo} ${story.shipment.quantity} ${story.shipment.unit} · ${story.flow?.originProvince}→${story.flow?.destinationProvince} · ${story.shipment.serviceLevel}`,
      1.1,
      10,
      0.30,
      0.68,
    );
    this.root.add(this.demandStream);

    this.capacityStreams = story.capacityResponses.map((response, index) => {
      const subject = subjectById.get(response.subjectId);
      const stream = this.makeDataStreamArc(
        this.worldCoordinate(subject.coordinates, STACK.digital + 0.28),
        aiPoint,
        response.color,
        `${response.actor}\n${response.items.join(' · ')}`,
        1.2 + (index % 3) * 0.25,
        6 + (index % 2),
        0.12 + index * 0.15,
        0.86,
      );
      this.root.add(stream);
      return stream;
    });

    const consensusPoint = aiPoint.clone();
    consensusPoint.z += 10.8;
    this.consensusGroup = new THREE.Group();
    this.consensusGroup.name = 'MultimodalConsensusAndDigitalContract';
    this.consensusGroup.position.copy(consensusPoint);
    const consensusRadius = 5.0;
    const localPoints = story.confirmations.map((_, index) => {
      const angle = Math.PI / 2 + index * Math.PI * 2 / story.confirmations.length;
      return new THREE.Vector3(Math.cos(angle) * consensusRadius, Math.sin(angle) * consensusRadius, 0);
    });
    this.consensusNodes = story.confirmations.map((confirmation, index) => {
      const root = new THREE.Group();
      root.position.copy(localPoints[index]);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.67, 36), glowMaterial(confirmation.color, 0.86));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.31, 14, 10), glowMaterial('#ffffff', 0.96));
      const actorLabel = makeLabelSprite(confirmation.actor, confirmation.color, { width: 6.8, height: 1.95, scale: 0.66, priority: 15 });
      actorLabel.position.z = 0.85;
      const statusLabel = makeLabelSprite(confirmation.status, '#8df4c2', { width: 7.6, height: 1.95, scale: 0.64, priority: 16 });
      statusLabel.position.z = -0.85;
      root.add(ring, core, actorLabel, statusLabel);
      this.consensusGroup.add(root);

      const nextPoint = localPoints[(index + 1) % localPoints.length];
      const edgeCurve = new THREE.LineCurve3(localPoints[index], nextPoint);
      const edge = makeTube(edgeCurve, confirmation.color, 0.065, 0.84, 20);
      this.consensusGroup.add(edge);
      const beam = makeTube(new THREE.LineCurve3(localPoints[index], new THREE.Vector3()), confirmation.color, 0.085, 0.90, 20);
      this.consensusGroup.add(beam);
      return { root, ring, core, statusLabel, edge, beam };
    });
    this.consensusCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, 2), glowMaterial('#ffffff', 0.98));
    this.consensusAgreementLabel = makeLabelSprite('联运方案已达成', '#f4ff78', { width: 10.5, height: 2.45, scale: 0.82, priority: 24 });
    this.consensusAgreementLabel.position.z = 1.25;
    this.digitalContractLabel = makeLabelSprite('DIGITAL CONTRACT\n数字合约生效', '#8df4c2', { width: 12.5, height: 3.0, scale: 0.92, priority: 25 });
    this.digitalContractLabel.position.z = 1.4;
    this.contractShockwaves = [0, 1, 2].map((index) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.88, 1.04, 72), glowMaterial(index === 1 ? '#8df4c2' : '#ffffff', 0.92));
      ring.userData.delay = index * 0.07;
      this.consensusGroup.add(ring);
      return ring;
    });
    this.consensusGroup.add(this.consensusCore, this.consensusAgreementLabel, this.digitalContractLabel);
    this.root.add(this.consensusGroup);

    this.exceptionAlert = null;
    if (story.exception?.coordinates) {
      this.exceptionAlert = makeBeacon(MAP_THEME.danger, `${story.exception.title}\n${story.exception.expectedDelay}`, { scale: 1.08, labelOffset: 1.25 });
      this.exceptionAlert.name = 'TransitExceptionAlert';
      this.exceptionAlert.position.copy(this.worldCoordinate(story.exception.coordinates, STACK.infrastructure + 0.45));
      this.root.add(this.exceptionAlert);
    }

    const keyCoordinates = story.execution.nodes.map((node) => node.coordinates);
    this.platformToDigital = this.buildVerticalGroup(
      (story.visuals?.platformSubjectIds ?? [originSubject.id, destinationSubject.id]).map((id) => subjectById.get(id)?.coordinates).filter(Boolean),
      STACK.platform, STACK.digital + 0.28, MAP_THEME.digitalBright, 'PlatformToDigitalEvents',
    );
    this.digitalToOperation = this.buildVerticalGroup(
      (story.visuals?.operationSubjectIds ?? story.subjects.map((subject) => subject.id))
        .map((id) => subjectById.get(id)?.coordinates).filter(Boolean),
      STACK.digital + 0.28, STACK.operation + 0.28, MAP_THEME.operationBright, 'DigitalToOperationTasks',
    );
    this.operationToInfrastructure = this.buildVerticalGroup(
      keyCoordinates, STACK.operation + 0.28, STACK.infrastructure + 0.28, MAP_THEME.infrastructureBright, 'OperationToInfrastructureOrders',
    );
    this.feedbackBeams = this.buildVerticalGroup(
      keyCoordinates.filter((_, index) => index % 2 === 0), STACK.infrastructure + 0.28, STACK.platform, MAP_THEME.primarySoft, 'ExecutionEventFeedback',
    );

    this.resetVisuals();
  }

  clearVisuals() {
    [...this.root.children].forEach((child) => {
      child.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => { material.map?.dispose?.(); material.dispose?.(); });
        else { object.material?.map?.dispose?.(); object.material?.dispose?.(); }
      });
      child.removeFromParent();
    });
  }

  makeVerticalBeam(start, end, color) {
    const height = Math.abs(start.z - end.z);
    const root = new THREE.Group();
    root.position.set(start.x, start.y, Math.min(start.z, end.z) + height / 2);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, height, 10, 1, true), glowMaterial(color, 0.78));
    beam.rotation.x = Math.PI / 2;
    beam.renderOrder = 27;
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, height, 12, 1, true), glowMaterial(color, 0.12));
    halo.rotation.x = Math.PI / 2;
    halo.renderOrder = 26;
    const particles = Array.from({ length: 5 }, (_, index) => {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.19, 9, 7), glowMaterial(index % 2 ? '#ffffff' : color, 0.94));
      particle.userData.offset = index / 5;
      particle.renderOrder = 28;
      root.add(particle);
      return particle;
    });
    root.add(beam, halo);
    root.userData = { height, particles };
    return root;
  }

  animateVerticalGroup(group, progress, reverse = false) {
    group?.userData.beams?.forEach((beam, beamIndex) => {
      const height = beam.userData.height ?? 0;
      beam.userData.particles.forEach((particle) => {
        const travel = (progress * 1.75 + particle.userData.offset + beamIndex * 0.11) % 1;
        particle.position.z = height * (reverse ? travel - 0.5 : 0.5 - travel);
        particle.scale.setScalar(0.78 + Math.sin(travel * Math.PI) * 0.58);
      });
    });
  }

  animateArcPackets(arcs, elapsed, speed = 0.34) {
    arcs.forEach((arc, index) => {
      const t = (elapsed * speed + index / Math.max(1, arcs.length)) % 1;
      arc.userData.packet.position.copy(arc.userData.curve.getPointAt(t));
      arc.userData.packet.scale.setScalar(0.82 + Math.sin(elapsed * 4.2 + index) * 0.18);
    });
  }

  animateDataStreams(streams, elapsed, speed = 0.72) {
    (Array.isArray(streams) ? streams : [streams]).filter(Boolean).forEach((stream, streamIndex) => {
      stream.userData.packets.forEach((packet, packetIndex) => {
        const t = (elapsed * speed + packet.userData.offset + streamIndex * 0.09) % 1;
        packet.position.copy(stream.userData.curve.getPointAt(t));
        const tangent = stream.userData.curve.getTangentAt(Math.min(0.999, t));
        packet.rotation.z = Math.atan2(tangent.y, tangent.x);
        packet.scale.setScalar(0.72 + Math.sin(t * Math.PI) * 0.65);
        packet.material.opacity = 0.38 + Math.sin(t * Math.PI) * 0.60;
      });
    });
  }

  animateCandidateCorridor(corridor, elapsed, speed = 0.24) {
    corridor?.particles.forEach((particle) => {
      const t = (elapsed * speed + particle.userData.offset) % 1;
      particle.position.copy(corridor.curve.getPointAt(t));
    });
  }

  animateBundlePackets(bundle, elapsed, speed = 0.18) {
    let legIndex = 0;
    bundle?.legs.forEach((leg) => {
      leg.particles.forEach((particle) => {
        const t = (elapsed * speed + particle.userData.offset + legIndex * 0.13) % 1;
        particle.position.copy(leg.curve.getPointAt(t));
      });
      legIndex += 1;
    });
  }

  setRouteHighlight(bundle, activeIds, inactiveOpacity = 0.16) {
    if (!bundle) return;
    const active = new Set(activeIds);
    bundle.legs.forEach((leg, id) => setVisualOpacity(leg.root, active.size === 0 || active.has(id) ? 1 : inactiveOpacity));
  }

  animateLegSequence(bundle, ids, progress, timeWeights = null) {
    if (!bundle) return;
    const legs = ids.map((id) => bundle.legs.get(id)).filter(Boolean);
    bundle.legs.forEach((leg) => {
      leg.marker.visible = false;
      leg.particles.forEach((particle) => { particle.visible = false; });
    });
    if (!legs.length) return;
    const rawWeights = Array.isArray(timeWeights) && timeWeights.length === legs.length
      ? timeWeights.map((weight) => Math.max(0.001, weight))
      : legs.map((leg) => Math.max(0.001, leg.length));
    const total = rawWeights.reduce((sum, weight) => sum + weight, 0);
    let remaining = clamp01(progress) * total;
    let active = legs.at(-1);
    let local = 1;
    for (let index = 0; index < legs.length; index += 1) {
      const leg = legs[index];
      const weight = rawWeights[index];
      if (remaining <= weight) {
        active = leg;
        local = remaining / weight;
        break;
      }
      remaining -= weight;
    }
    active.marker.visible = true;
    active.marker.position.copy(active.curve.getPointAt(clamp01(local)));
    const tangent = active.curve.getTangentAt(Math.min(0.999, clamp01(local)));
    active.marker.rotation.z = Math.atan2(tangent.y, tangent.x);
    active.particles.forEach((particle, index) => {
      particle.visible = true;
      particle.position.copy(active.curve.getPointAt(Math.max(0, local - (index + 1) * 0.018)));
    });
  }

  resetVisuals() {
    [this.platformNetwork, this.digitalSubjects?.root, this.subjectArcsGroup, this.overviewEndpoints, this.digitalRoutes?.root, this.aiHub,
      this.demandStream, ...(this.capacityStreams ?? []), ...(this.candidateCorridors ?? []).map((candidate) => candidate.root),
      this.consensusGroup,
      this.operationSubjects?.root, this.operationRoutes?.root, this.infrastructureRoutes?.root,
      this.infrastructureNodes, this.platformToDigital, this.digitalToOperation,
      this.operationToInfrastructure, this.feedbackBeams, this.exceptionAlert]
      .forEach((group) => setVisualOpacity(group, 0));
    this.contractShockwaves?.forEach((ring) => ring.scale.setScalar(1));
    this.contractThumpPlayed = false;
    this.recombined = false;
  }

  primeAudio() {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.audioContext ??= new AudioContextClass();
    this.audioContext.resume?.().catch?.(() => {});
  }

  playContractThump() {
    if (this.contractThumpPlayed) return;
    this.contractThumpPlayed = true;
    const context = this.audioContext;
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    [86, 48].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(28, now + 0.46 + index * 0.08);
      gain.gain.setValueAtTime(index ? 0.16 : 0.23, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.62);
    });
  }

  start(story) {
    // 首页开场演出必须先收尾，否则会把开场机位记成业务流程的返回视角。
    this.runtime.abortHomeIntro?.();
    this.story = story;
    this.buildVisuals(story);
    this.active = true;
    this.playing = true;
    this.completed = false;
    this.elapsed = 0;
    this.stageIndex = -1;
    this.lastTimestamp = performance.now();
    this.lastUiUpdate = 0;
    this.weights = { infrastructure: 1, operation: 1, digital: 1 };
    // Stories share the three-sheet stack visual, but keep an independent
    // return snapshot so 三层分解 / other modes are not mutated permanently.
    if (!this.runtime.storyReturnSnapshot) {
      this.runtime.storyReturnSnapshot = this.runtime.captureViewSnapshot?.() ?? null;
    }
    this.cameraFollow = false;
    this.followingMarker = false;
    this.cameraMoveUntil = 0;
    this.followAnchor.set(0, 0, 0);
    this.root.visible = true;
    this.setProvinceStoryGeometry(false, 0.001, true);
    this.resetVisuals();
    this.primeAudio();
    this.runtime.controls.enabled = true;
    this.runtime.clearStoryProvinceFocus?.();
    this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
    this.runtime.setStorySheetWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
    // Isolate national layer chrome for the whole story; sheets stay, flows/routes do not.
    this.runtime.setStoryContentIsolation?.(true);
    this.runtime.ui.showStory(story);
    this.runtime.cameraUserOverride = false;
    this.runtime.setState(MAP_STATES.EXPLODED, { story: true });
    this.runtime.enforceStorySheetSolidity?.();
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
    this.runtime.setStoryContentIsolation?.(false);
    this.runtime.clearStoryProvinceFocus?.();
    this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
    this.runtime.setStorySheetWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
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
    // Preserve the closed-loop result instead of replacing the finale with the
    // dense national base network as soon as playback reaches 100%.
    this.root.visible = true;
    this.runtime.controls.enabled = true;
    this.cameraFollow = false;
    this.followingMarker = false;
    this.runtime.ui.completeStory(this.story);
  }

  update(timestamp = performance.now()) {
    if (!this.active || !this.playing || !this.story) return;
    // Playback follows wall-clock time so a low frame rate cannot stretch a
    // 72/90-second presentation into several minutes.
    const delta = Math.max(0, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    this.elapsed = Math.min(this.story.duration, this.elapsed + delta);
    this.followDelta = delta;
    const index = this.story.stages.findIndex((stage) => this.elapsed >= stage.start && this.elapsed < stage.end);
    const safeIndex = index === -1 ? this.story.stages.length - 1 : index;
    const stage = this.story.stages[safeIndex];
    if (safeIndex !== this.stageIndex) {
      this.stageIndex = safeIndex;
      this.enterStage(stage, safeIndex);
    }
    const progress = clamp01((this.elapsed - stage.start) / Math.max(0.001, stage.end - stage.start));
    this.updateVisuals(stage.id, progress, this.elapsed);
    this.updateFollowCamera(stage.id);
    const sheetUpperFade = 1 - smoothStep(progress, 0.56, 0.94);
    if (stage.id === 'drill_operation') {
      this.runtime.setStoryLayerWeights?.({ infrastructure: 0, operation: 1, digital: this.weights.digital });
      this.runtime.setStorySheetWeights?.({ infrastructure: 1, operation: 1, digital: sheetUpperFade });
    }
    if (stage.id === 'drill_infrastructure') {
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: this.weights.operation, digital: 0 });
      this.runtime.setStorySheetWeights?.({ infrastructure: 1, operation: sheetUpperFade, digital: 0 });
    }
    this.runtime.enforceStorySheetSolidity?.();
    if (timestamp - this.lastUiUpdate > 80) {
      this.runtime.ui.updateStoryProgress(this.elapsed / this.story.duration, progress, stage);
      this.lastUiUpdate = timestamp;
    }
    if (this.elapsed >= this.story.duration) this.complete();
  }

  enterStage(stage, index) {
    this.runtime.ui.updateStoryStage(stage, index, this.story);
    if (stage.id === 'overview') {
      this.setWeights({ infrastructure: 1, operation: 1, digital: 1 }, 0.6);
    } else if (stage.id === 'platform_space') {
      this.setWeights({ infrastructure: 1, operation: 1, digital: 1 }, 0.55);
      this.runtime.setStoryContentIsolation?.(true);
      if (this.story.ui?.focusProvince) {
        this.runtime.focusStoryProvince?.(this.story.ui.focusProvince);
        this.setProvinceScopedStoryVisuals(true);
      }
    } else if (stage.id === 'transport_demand') {
      Object.assign(this.weights, { infrastructure: 0, operation: 0, digital: 1 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 0, operation: 0, digital: 1 });
    } else if (['capacity_response', 'route_solve', 'consensus'].includes(stage.id)) {
      this.runtime.clearStoryProvinceFocus?.();
      this.setProvinceScopedStoryVisuals(false);
      Object.assign(this.weights, { infrastructure: 0, operation: 0, digital: 1 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 0, operation: 0, digital: 1 });
    } else if (stage.id === 'drill_operation') {
      if (this.story.ui?.focusProvince) {
        this.runtime.focusStoryProvince?.(this.story.ui.focusProvince);
        this.setProvinceScopedStoryVisuals(true);
      }
      Object.assign(this.weights, { infrastructure: 0, operation: 1, digital: 1 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 0, operation: 1, digital: 1 });
    } else if (stage.id === 'operation_dispatch') {
      Object.assign(this.weights, { infrastructure: 0, operation: 1, digital: 0 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 0, operation: 1, digital: 0 });
    } else if (stage.id === 'drill_infrastructure') {
      Object.assign(this.weights, { infrastructure: 1, operation: 1, digital: 0 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 1, digital: 0 });
    } else if (stage.id === 'local_assembly') {
      Object.assign(this.weights, { infrastructure: 1, operation: 0, digital: 0 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 0, digital: 0 });
    } else if (stage.id === 'origin_execute') {
      Object.assign(this.weights, { infrastructure: 1, operation: 0, digital: 0 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 0, digital: 0 });
      this.runtime.clearStoryProvinceFocus?.();
      this.setProvinceScopedStoryVisuals(false);
    } else if (stage.id === 'digital_penetration') {
      this.runtime.clearStoryProvinceFocus?.();
      Object.assign(this.weights, { infrastructure: 1, operation: 1, digital: 1 });
      this.runtime.layers.infrastructure.setVisualWeight(1);
      this.runtime.layers.operation.setVisualWeight(1);
      this.runtime.layers.digital.setVisualWeight(1);
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
    } else if (stage.id === 'regional_collaboration') {
      Object.assign(this.weights, { infrastructure: 1, operation: 1, digital: 1 });
      this.runtime.layers.infrastructure.setVisualWeight(1);
      this.runtime.layers.operation.setVisualWeight(1);
      this.runtime.layers.digital.setVisualWeight(1);
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
    } else if (stage.id === 'transit_exception') {
      Object.assign(this.weights, { infrastructure: 1, operation: 0, digital: 0 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 0, digital: 0 });
    } else if (stage.id === 'destination_execute') {
      Object.assign(this.weights, { infrastructure: 1, operation: 0, digital: 0 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 0, digital: 0 });
    } else if (['coastal_execute', 'sea_departure'].includes(stage.id)) {
      Object.assign(this.weights, { infrastructure: 1, operation: 0, digital: 0 });
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 0, digital: 0 });
    } else if (stage.id === 'feedback') {
      Object.assign(this.weights, { infrastructure: 1, operation: 1, digital: 1 });
      this.runtime.layers.infrastructure.setVisualWeight(1);
      this.runtime.layers.operation.setVisualWeight(1);
      this.runtime.layers.digital.setVisualWeight(1);
      this.runtime.setStoryLayerWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
    }
    this.setStageSheetContext(stage.id);
    this.followingMarker = false;
    this.applyStageCamera(stage.id, 0.9);
  }

  setStageSheetContext(stageId) {
    const threeSheetStages = new Set([
      'overview', 'platform_space', 'transport_demand', 'capacity_response', 'route_solve', 'consensus',
      'drill_operation', 'digital_penetration', 'regional_collaboration', 'feedback',
    ]);
    if (threeSheetStages.has(stageId)) {
      this.runtime.setStorySheetWeights?.({ infrastructure: 1, operation: 1, digital: 1 });
    } else if (['operation_dispatch', 'drill_infrastructure'].includes(stageId)) {
      this.runtime.setStorySheetWeights?.({ infrastructure: 1, operation: 1, digital: 0 });
    } else {
      this.runtime.setStorySheetWeights?.({ infrastructure: 1, operation: 0, digital: 0 });
    }
  }

  setWeights(values, duration) {
    this.runtime.animations.to(this.weights, values, duration, 'easeInOut');
  }

  setProvinceStoryGeometry(compact, duration = 0.7, force = false) {
    const scaleZ = compact ? 0.5 : 1;
    const offsetZ = compact ? 1 : 0;
    if (force || duration <= 0.001) {
      this.root.scale.set(1, 1, scaleZ);
      this.root.position.set(0, 0, offsetZ);
      return;
    }
    this.runtime.animations.to(this.root.scale, { x: 1, y: 1, z: scaleZ }, duration, 'easeInOut');
    this.runtime.animations.to(this.root.position, { x: 0, y: 0, z: offsetZ }, duration, 'easeInOut');
  }

  cameraSafeShift() {
    const width = this.runtime.canvas?.parentElement?.clientWidth ?? 1440;
    const configuredShift = this.story?.ui?.cameraSafeArea ?? {};
    return width <= 850
      ? new THREE.Vector3(Number(configuredShift.mobileX ?? 0), Number(configuredShift.mobileY ?? -6), 0)
      : new THREE.Vector3(Number(configuredShift.desktopX ?? 7), Number(configuredShift.desktopY ?? 0), 0);
  }

  moveCamera(target, offset, duration, fov = 35) {
    if (!this.cameraFollow) return;
    const framedTarget = target.clone().add(this.cameraSafeShift());
    this.followingMarker = false;
    this.cameraMoveUntil = performance.now() + Math.max(0.2, duration) * 1000;
    this.runtime.cameraDirector.moveTo(framedTarget.clone().add(offset), framedTarget, duration, { fov });
  }

  moveStoryLocation(coordinates, z, offset, duration, fov = 35) {
    this.moveCamera(this.worldCoordinate(coordinates, z), offset, duration, fov);
  }

  setCameraFollow(enabled, { recenter = true } = {}) {
    this.cameraFollow = Boolean(enabled);
    this.runtime.ui.setStoryCameraFollow?.(this.cameraFollow);
    if (!this.cameraFollow) {
      this.followingMarker = false;
      this.runtime.cameraDirector.cancelMove?.();
      return;
    }
    if (!recenter || this.stageIndex < 0) return;
    const stageId = this.story?.stages?.[this.stageIndex]?.id;
    this.followingMarker = false;
    this.applyStageCamera(stageId, 0.65);
  }

  toggleCameraFollow() {
    this.setCameraFollow(!this.cameraFollow);
  }

  applyStageCamera(stageId, duration = 0.75) {
    if (!this.cameraFollow) return;
    if (stageId === 'overview') {
      // Stay on the national exploded stack framing instead of diving into a city.
      this.moveStackOverview(duration);
    } else if (stageId === 'platform_space') {
      if (this.runtime.storyProvinceFocus) this.focusProvinceStoryCamera(duration);
      else this.movePlatformOverview(duration);
    } else if (stageId === 'transport_demand') {
      this.moveStoryLayerOverview('digital', duration);
    } else if (['capacity_response', 'route_solve', 'consensus'].includes(stageId)) {
      this.moveCorridorOverview(Math.max(duration, 1.05));
    } else if (['drill_operation', 'operation_dispatch'].includes(stageId)) {
      this.moveStoryLayerOverview('operation', duration);
    } else if (stageId === 'drill_infrastructure') {
      this.moveStoryLayerOverview('infrastructure', duration);
    } else if (stageId === 'local_assembly') {
      this.moveStoryLayerDetail('infrastructure', duration);
    } else if (stageId === 'origin_execute') {
      const originNode = this.story.execution.nodes[0];
      this.moveStoryLocation(originNode?.coordinates ?? [122.22, 40.65], STACK.infrastructure + 0.4, new THREE.Vector3(4, -108, 92), duration, 36);
    } else if (stageId === 'digital_penetration') {
      this.moveStackOverview(duration);
    } else if (stageId === 'regional_collaboration') {
      this.movePlatformOverview(duration);
    } else if (stageId === 'transit_exception') {
      this.moveStoryLocation(this.story.exception?.coordinates ?? [121.47, 31.23], 8, new THREE.Vector3(1, -56, 58), duration, 34);
    } else if (stageId === 'destination_execute') {
      const destinationNode = this.story.execution.nodes.at(-1);
      const destinationCoordinate = this.story.ui?.destinationCoordinate ?? destinationNode?.coordinates ?? [121.60, 31.28];
      this.moveStoryLocation(destinationCoordinate, STACK.infrastructure + 0.4, new THREE.Vector3(3, -82, 86), duration, 35);
    } else if (['coastal_execute', 'sea_departure'].includes(stageId)) {
      const stageLegs = this.story.visuals?.executionStageLegs?.[stageId]?.ids ?? [];
      const activeLeg = this.routeLegs.find((leg) => stageLegs.includes(leg.id));
      const routeMidpoint = activeLeg?.path?.at(Math.floor((activeLeg.path?.length ?? 1) / 2));
      const focusCoordinate = stageId === 'sea_departure'
        ? this.story.ui?.departureCoordinate ?? routeMidpoint ?? [122.05, 31.05]
        : routeMidpoint ?? [122.05, 31.05];
      this.moveStoryLocation(focusCoordinate, STACK.infrastructure + 0.4, new THREE.Vector3(3, -82, 86), duration, 35);
    } else if (stageId === 'feedback') {
      if (Array.isArray(this.story.ui?.completionCoordinate)) {
        this.moveStoryLocation(this.story.ui.completionCoordinate, 30, new THREE.Vector3(2, -58, 64), duration);
      } else {
        this.moveStackOverview(duration);
      }
    }
  }

  focusProvinceStoryCamera(duration = 0.9) {
    const name = this.runtime.storyProvinceFocus;
    const bounds = this.runtime.baseMap?.getProvinceBounds?.(name, this.runtime.baseSheet);
    if (!bounds) {
      this.movePlatformOverview(duration);
      return;
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.y);
    const distance = THREE.MathUtils.clamp(span * 5.4, 92, 148);
    const target = new THREE.Vector3(center.x, center.y, 8);
    const offset = new THREE.Vector3(distance * 0.03, -distance * 0.78, distance * 0.82);
    this.moveCamera(target, offset, duration, 26);
  }

  findVisibleFollowMarker() {
    const bundles = [this.infrastructureRoutes, this.operationRoutes, this.digitalRoutes];
    for (let index = 0; index < bundles.length; index += 1) {
      const legs = bundles[index]?.legs;
      if (!legs) continue;
      for (const leg of legs.values()) {
        if (leg.marker?.visible) return leg.marker;
      }
    }
    return null;
  }

  getFollowFraming(stageId) {
    if (['destination_execute', 'sea_departure'].includes(stageId)) {
      return { offset: new THREE.Vector3(3, -82, 86), fov: 35 };
    }
    return { offset: new THREE.Vector3(4, -108, 92), fov: 36 };
  }

  updateFollowCamera(stageId) {
    if (!this.cameraFollow || !this.active) return;
    const markerStages = new Set(['origin_execute', 'coastal_execute', 'destination_execute', 'sea_departure']);
    if (!markerStages.has(stageId)) {
      this.followingMarker = false;
      return;
    }
    const marker = this.findVisibleFollowMarker();
    if (!marker) return;
    if (performance.now() < this.cameraMoveUntil) return;
    const point = marker.getWorldPosition(this.followScratch.marker);
    if (!this.followingMarker) {
      this.runtime.cameraDirector.cancelMove?.();
      this.followingMarker = true;
      this.followAnchor.copy(this.runtime.controls.target).sub(this.cameraSafeShift());
    }
    const dt = THREE.MathUtils.clamp(this.followDelta || 0.016, 0.008, 0.05);
    this.followAnchor.lerp(point, 1 - Math.exp(-dt / 1.8));
    const { offset, fov } = this.getFollowFraming(stageId);
    this.smoothFollow(this.followAnchor, offset, fov, 1 - Math.exp(-dt / 0.55));
  }

  smoothFollow(target, offset, fov, damping = 0.04) {
    const framedTarget = this.followScratch.target.copy(target).add(this.cameraSafeShift());
    const desiredPosition = this.followScratch.position.copy(framedTarget).add(offset);
    this.runtime.camera.position.lerp(desiredPosition, damping);
    this.runtime.controls.target.lerp(framedTarget, damping);
    if (Number.isFinite(fov)) {
      const nextFov = THREE.MathUtils.lerp(this.runtime.camera.fov, fov, damping);
      if (Math.abs(nextFov - this.runtime.camera.fov) > 0.05) {
        this.runtime.camera.fov = nextFov;
        this.runtime.camera.updateProjectionMatrix();
      }
    }
  }

  moveStackOverview(duration) {
    this.moveCamera(new THREE.Vector3(0, 0, 25), new THREE.Vector3(4, -112, 88), duration, 37);
  }

  movePlatformOverview(duration) {
    // A lower, wider angle separates the three co-registered map sheets on
    // screen while keeping the digital-platform nodes close to the top sheet.
    this.moveCamera(new THREE.Vector3(0, 0, 36), new THREE.Vector3(3, -128, 88), duration, 38);
  }

  moveCorridorOverview(duration) {
    const origin = this.story.ui?.focusCoordinate
      ?? this.story.execution?.nodes?.[0]?.coordinates
      ?? [104, 35];
    const destination = this.story.ui?.destinationCoordinate
      ?? this.story.execution?.nodes?.at(-1)?.coordinates
      ?? origin;
    const start = this.worldCoordinate(origin, 28);
    const end = this.worldCoordinate(destination, 28);
    const span = start.distanceTo(end);
    const mid = start.clone().lerp(end, 0.5);
    mid.z = 28;
    const distance = THREE.MathUtils.clamp(Math.max(span * 2.8, 132), 132, 172);
    this.moveCamera(mid, new THREE.Vector3(3, -distance * 0.76, distance * 0.64), duration, 37);
  }

  moveOperationOverview(duration) {
    this.moveCamera(new THREE.Vector3(0, 0, 22), new THREE.Vector3(4, -112, 86), duration, 36);
  }

  moveInfrastructureOverview(duration) {
    this.moveCamera(new THREE.Vector3(0, 0, 8), new THREE.Vector3(4, -112, 88), duration, 36);
  }

  moveStoryLayerOverview(layerName, duration) {
    if (!this.runtime.storyProvinceFocus || !Array.isArray(this.story.ui?.focusCoordinate)) {
      if (layerName === 'digital') this.movePlatformOverview(duration);
      else if (layerName === 'operation') this.moveOperationOverview(duration);
      else this.moveInfrastructureOverview(duration);
      return;
    }
    const localZ = layerName === 'digital' ? STACK.digital + 0.35 : layerName === 'operation' ? STACK.operation + 0.35 : STACK.infrastructure + 0.35;
    const compactZ = 1 + localZ * 0.5;
    this.moveStoryLocation(this.story.ui.focusCoordinate, compactZ, new THREE.Vector3(0, -38, 46), duration, 30);
  }

  moveStoryLayerDetail(layerName, duration) {
    if (!this.runtime.storyProvinceFocus || !Array.isArray(this.story.ui?.focusCoordinate)) {
      this.moveStoryLayerOverview(layerName, duration);
      return;
    }
    const localZ = layerName === 'digital' ? STACK.digital + 0.35 : layerName === 'operation' ? STACK.operation + 0.35 : STACK.infrastructure + 0.35;
    const compactZ = 1 + localZ * 0.5;
    this.moveStoryLocation(this.story.ui.focusCoordinate, compactZ, new THREE.Vector3(0, -30, 38), duration, 30);
  }

  updateVisuals(stageId, progress, elapsed) {
    const platformStage = ['platform_space', 'transport_demand', 'capacity_response', 'route_solve', 'consensus', 'regional_collaboration'].includes(stageId);
    const digitalStage = ['transport_demand', 'capacity_response', 'route_solve', 'consensus', 'digital_penetration', 'regional_collaboration'].includes(stageId);
    const trustedSpaceStage = ['transport_demand', 'capacity_response', 'route_solve', 'consensus'].includes(stageId);
    const upperFade = 1 - smoothStep(progress, 0.04, 0.72);
    const currentFade = smoothStep(progress, 0.05, 0.70);
    const drillStrength = smoothStep(progress, 0, 0.14) * (1 - smoothStep(progress, 0.72, 0.96));
    const provinceScoped = Boolean(this.runtime.storyProvinceFocus)
      && ['platform_space', 'transport_demand', 'capacity_response', 'route_solve', 'consensus', 'drill_operation', 'operation_dispatch', 'drill_infrastructure', 'local_assembly'].includes(stageId);

    if (stageId === 'drill_operation') {
      Object.assign(this.weights, { infrastructure: 0, operation: 1, digital: upperFade });
    } else if (stageId === 'drill_infrastructure') {
      Object.assign(this.weights, { infrastructure: 1, operation: upperFade, digital: 0 });
    }

    const platformOpacity = stageId === 'feedback' ? currentFade : ['transit_exception', 'digital_penetration'].includes(stageId) ? 0.72 : stageId === 'platform_space' ? 1 : trustedSpaceStage ? 0.92 : stageId === 'drill_operation' ? upperFade : 0;
    setVisualOpacity(this.platformNetwork, platformOpacity);
    if (trustedSpaceStage) {
      this.platformPods.forEach((pod) => setVisualOpacity(pod, pod.userData.platformId === 'trustedSpace' ? 1 : 0));
      this.platformTethers.forEach(({ tether, platform }) => setVisualOpacity(tether, platform.id === 'trustedSpace' ? 0.74 : 0));
      this.platformPackets.forEach((arc) => setVisualOpacity(arc, 0));
    } else {
      // Restore children hidden by a previous trusted-space-only stage.
      this.platformPods.forEach((pod) => setVisualOpacity(pod, platformOpacity));
      this.platformTethers.forEach(({ tether }) => setVisualOpacity(tether, platformOpacity));
      this.platformPackets.forEach((arc) => setVisualOpacity(arc, platformOpacity));
    }
    setVisualOpacity(this.overviewEndpoints, stageId === 'overview' ? 1 : 0);
    setVisualOpacity(this.digitalSubjects.root, stageId === 'platform_space' ? 0.34 : digitalStage ? (stageId === 'route_solve' ? 0.62 : stageId === 'consensus' ? 0.32 : 1) : stageId === 'drill_operation' ? upperFade : 0);
    setVisualOpacity(this.subjectArcsGroup, stageId === 'platform_space' ? 0.58 : 0);
    setVisualOpacity(this.aiHub, ['capacity_response', 'route_solve'].includes(stageId) ? 1 : 0);
    setVisualOpacity(this.demandStream, stageId === 'transport_demand' ? 1 : 0);
    this.capacityStreams.forEach((stream) => setVisualOpacity(stream, stageId === 'capacity_response' ? 1 : 0));
    setVisualOpacity(this.digitalRoutes.root, stageId === 'route_solve' ? currentFade : stageId === 'consensus' ? 0.36 : ['digital_penetration', 'regional_collaboration'].includes(stageId) ? 1 : stageId === 'drill_operation' ? upperFade : 0);
    this.candidateCorridors.forEach((candidate) => setVisualOpacity(candidate.root, stageId === 'route_solve' ? currentFade : 0));
    setVisualOpacity(this.consensusGroup, stageId === 'consensus' ? 1 : 0);
    setVisualOpacity(this.platformToDigital, stageId === 'transport_demand' ? 0.58 : stageId === 'regional_collaboration' ? 1 : 0);
    setVisualOpacity(this.digitalToOperation, stageId === 'drill_operation' ? drillStrength : stageId === 'digital_penetration' ? 1 : 0);

    const operationOpacity = stageId === 'drill_operation' ? currentFade : ['operation_dispatch', 'digital_penetration', 'regional_collaboration'].includes(stageId) ? 1 : stageId === 'drill_infrastructure' ? upperFade : 0;
    setVisualOpacity(this.operationSubjects.root, operationOpacity);
    // Downward conduction keeps the operation sheet clean: only subjects + beams.
    // National operation flows stay suppressed by story isolation; story routes wait for dispatch.
    setVisualOpacity(this.operationRoutes.root, stageId === 'drill_operation' ? 0 : operationOpacity);
    setVisualOpacity(this.operationToInfrastructure, stageId === 'drill_infrastructure' ? drillStrength : stageId === 'digital_penetration' ? 1 : 0);

    const infrastructureStage = ['local_assembly', 'origin_execute', 'transit_exception', 'digital_penetration', 'regional_collaboration', 'coastal_execute', 'destination_execute', 'sea_departure'].includes(stageId);
    setVisualOpacity(this.infrastructureRoutes.root, stageId === 'drill_infrastructure' ? currentFade * 0.55 : infrastructureStage ? 1 : stageId === 'feedback' ? 0.42 : 0);
    setVisualOpacity(this.infrastructureNodes, stageId === 'drill_infrastructure' ? currentFade : infrastructureStage ? 1 : stageId === 'feedback' ? 0.55 : 0);
    setVisualOpacity(this.feedbackBeams, stageId === 'feedback' ? currentFade : 0);
    setVisualOpacity(this.exceptionAlert, stageId === this.story.exception?.stageId ? 1 : 0);

    const platformLabelIds = stageId === 'platform_space'
      ? new Set(this.platformPods.map((pod) => pod.userData.platformId))
      : trustedSpaceStage ? new Set(['trustedSpace'])
      : ['transit_exception', 'digital_penetration', 'regional_collaboration'].includes(stageId) ? new Set([this.story.flow?.originPlatformId, this.story.flow?.destinationPlatformId])
          : stageId === 'feedback' ? new Set(['trustedSpace', this.story.flow?.destinationPlatformId]) : new Set();
    this.platformPods.forEach((pod) => setVisualOpacity(pod.userData.label, platformLabelIds.has(pod.userData.platformId) ? 1 : 0));

    const digitalLabelIds = stageId === 'transport_demand' ? new Set([this.story.flow?.originSubjectId]) : new Set();
    this.digitalSubjects.beacons.forEach((beacon) => setVisualOpacity(beacon.userData.label, digitalLabelIds.has(beacon.userData.subjectId) ? 0.82 : 0));

    const operationLabelIds = new Set(this.story.visuals?.operationLabelIds ?? []);
    this.operationSubjects.beacons.forEach((beacon, index) => {
      const listed = operationLabelIds.has(beacon.userData.subjectId);
      const operationStage = ['drill_operation', 'operation_dispatch'].includes(stageId);
      const show = (operationStage || ['digital_penetration', 'regional_collaboration'].includes(stageId)) && listed;
      const reveal = stageId === 'drill_operation'
        ? smoothStep(progress, 0.08 + index * 0.12, 0.24 + index * 0.12)
        : 1;
      setVisualOpacity(beacon.userData.label, show ? operationOpacity * reveal : 0);
    });

    const infrastructureLabelsByStage = this.story.visuals?.infrastructureLabelsByStage ?? {};
    const infrastructureLabelIds = new Set(infrastructureLabelsByStage[stageId] ?? []);
    this.infrastructureBeacons.forEach((beacon) => setVisualOpacity(beacon.userData.label, infrastructureLabelIds.has(beacon.userData.nodeId) ? 0.88 : 0));
    if (provinceScoped) this.setProvinceScopedStoryVisuals(true);

    if (platformStage || stageId === 'feedback') {
      this.platformPods.forEach((pod, index) => {
        const pulse = 1 + Math.sin(elapsed * 2.0 + pod.userData.phase) * 0.055;
        pod.userData.core.scale.setScalar(pulse);
        pod.userData.rim.rotation.z = elapsed * (index % 2 ? -0.55 : 0.55);
      });
      this.animateArcPackets(this.platformPackets, elapsed, 0.25);
    }
    if (stageId === 'overview') {
      this.overviewEndpointBeacons.forEach((beacon, index) => beacon.userData.ring.scale.setScalar(1 + Math.sin(elapsed * 2.2 + index * Math.PI) * 0.14));
    }
    if (stageId === 'platform_space') this.animateArcPackets(this.subjectDataArcs, elapsed, 0.31);
    if (digitalStage) {
      this.digitalSubjects.beacons.forEach((beacon, index) => beacon.userData.ring.scale.setScalar(1 + Math.sin(elapsed * 2.5 + index) * 0.13));
    }
    if (stageId === 'transport_demand') {
      this.animateDataStreams(this.demandStream, elapsed, 0.78);
    }
    if (stageId === 'capacity_response') {
      setVisualOpacity(this.aiMatchingLabel, 1);
      setVisualOpacity(this.aiSelectedLabel, 0);
      this.animateDataStreams(this.capacityStreams, elapsed, 0.92);
      this.aiCore.scale.setScalar(1 + Math.sin(elapsed * 8.5) * 0.16);
      this.aiRings.forEach((ring, index) => {
        ring.rotation.z = elapsed * (index % 2 ? -2.4 : 2.8) * (1 + index * 0.12);
      });
    }
    if (stageId === 'route_solve') {
      const reveal = smoothStep(progress, 0.04, 0.28);
      const selection = smoothStep(progress, 0.48, 0.78);
      if (progress <= 0.70) {
        this.digitalRoutes.legs.forEach((leg) => {
          leg.marker.visible = false;
          leg.particles.forEach((particle) => { particle.visible = true; });
        });
      }
      setVisualOpacity(this.digitalRoutes.root, reveal);
      this.candidateCorridors.forEach((candidate) => {
        setVisualOpacity(candidate.root, reveal * (1 - selection * 0.92));
        this.animateCandidateCorridor(candidate, elapsed, 0.28);
      });
      setVisualOpacity(this.aiMatchingLabel, 1 - selection);
      setVisualOpacity(this.aiSelectedLabel, selection);
      this.aiCore.scale.setScalar(1 + Math.sin(elapsed * 11.0) * 0.18 + selection * 0.24);
      this.aiRings.forEach((ring, index) => {
        ring.rotation.z = elapsed * (index % 2 ? -3.4 : 3.8) * (1 + index * 0.16);
        ring.scale.setScalar(1 + selection * (0.24 + index * 0.08));
      });
      this.setRouteHighlight(this.digitalRoutes, this.routeLegs.map((leg) => leg.id), 1);
      this.animateBundlePackets(this.digitalRoutes, elapsed, 0.16);
      if (progress > 0.70) this.animateLegSequence(this.digitalRoutes, this.routeLegs.map((leg) => leg.id), (progress - 0.70) / 0.30);
    }
    if (stageId === 'consensus') {
      this.consensusCore.rotation.z = elapsed * 2.8;
      this.consensusCore.scale.setScalar(0.86 + smoothStep(progress, 0.45, 0.72) * 0.68);
      this.consensusNodes.forEach((node, index) => {
        const confirmed = smoothStep(progress, 0.06 + index * 0.09, 0.13 + index * 0.09);
        const beamIn = smoothStep(progress, 0.54 + index * 0.025, 0.62 + index * 0.025);
        setVisualOpacity(node.root, 0.28 + confirmed * 0.72);
        setVisualOpacity(node.statusLabel, confirmed);
        setVisualOpacity(node.edge, confirmed);
        setVisualOpacity(node.beam, beamIn);
        node.ring.rotation.z = elapsed * (index % 2 ? -1.2 : 1.2);
        node.core.scale.setScalar(0.82 + confirmed * 0.42 + Math.sin(elapsed * 5 + index) * 0.06);
      });
      const agreementIn = smoothStep(progress, 0.56, 0.68);
      const contractIn = smoothStep(progress, 0.70, 0.79);
      setVisualOpacity(this.consensusAgreementLabel, agreementIn * (1 - contractIn));
      setVisualOpacity(this.digitalContractLabel, contractIn);
      if (progress >= 0.70) this.playContractThump();
      this.contractShockwaves.forEach((ring) => {
        const wave = clamp01((progress - 0.70 - ring.userData.delay) / 0.24);
        ring.scale.setScalar(1 + wave * 13);
        setVisualOpacity(ring, wave > 0 && wave < 1 ? (1 - wave) * 0.88 : 0);
      });
    }
    if (stageId === 'drill_operation') this.animateVerticalGroup(this.digitalToOperation, progress);
    if (stageId === 'operation_dispatch') {
      this.setRouteHighlight(this.operationRoutes, this.routeLegs.map((leg) => leg.id), 1);
      this.animateBundlePackets(this.operationRoutes, elapsed, 0.20);
      this.animateLegSequence(this.operationRoutes, this.routeLegs.map((leg) => leg.id), progress);
      this.operationSubjects.beacons.forEach((beacon, index) => beacon.userData.ring.scale.setScalar(1 + Math.sin(elapsed * 2.3 + index) * 0.11));
    }
    if (stageId === 'drill_infrastructure') this.animateVerticalGroup(this.operationToInfrastructure, progress);
    if (stageId === 'digital_penetration') {
      this.animateVerticalGroup(this.digitalToOperation, progress);
      this.animateVerticalGroup(this.operationToInfrastructure, progress);
      this.animateBundlePackets(this.digitalRoutes, elapsed, 0.30);
    }
    if (stageId === 'regional_collaboration') {
      this.animateVerticalGroup(this.platformToDigital, progress, true);
      this.animateArcPackets(this.platformPackets, elapsed, 0.46);
      this.animateBundlePackets(this.digitalRoutes, elapsed, 0.25);
    }
    const stageLegs = this.story.visuals?.executionStageLegs?.[stageId];
    if (stageLegs) {
      this.setRouteHighlight(this.infrastructureRoutes, stageLegs.ids);
      this.animateLegSequence(this.infrastructureRoutes, stageLegs.ids, progress, stageLegs.weights);
      if (stageId === this.story.exception?.stageId && this.exceptionAlert) {
        const alertPulse = 1 + Math.sin(elapsed * 7.5) * 0.16;
        this.exceptionAlert.userData.ring.scale.setScalar(alertPulse);
        this.exceptionAlert.userData.core.scale.setScalar(0.9 + Math.sin(elapsed * 9) * 0.14);
      }
    } else if (stageId === 'feedback') {
      this.setRouteHighlight(this.infrastructureRoutes, [], 1);
      this.animateVerticalGroup(this.feedbackBeams, progress, true);
      this.animateArcPackets(this.platformPackets, elapsed, 0.33);
    }
    if (infrastructureStage) {
      this.infrastructureBeacons.forEach((beacon, index) => beacon.userData.ring.scale.setScalar(1 + Math.sin(elapsed * 2.2 + index * 0.6) * 0.10));
    }
  }

  resize() { /* story geometry uses world-space tubes and sprites */ }

  updateScreenLayerLabels() {
    if (!this.active || !this.runtime.ui?.updateStoryLayerLabelPositions) return;
    const height = this.runtime.canvas?.parentElement?.clientHeight ?? 0;
    if (!height) return;
    this.runtime.scene.updateMatrixWorld(true);
    this.runtime.camera.updateMatrixWorld();
    const anchor = this.runtime.projector.fromLngLat([84, 35], 0.8);
    const raw = {};
    ['digital', 'operation', 'infrastructure'].forEach((layerName) => {
      const layer = this.runtime.layers[layerName];
      const world = anchor.clone().applyMatrix4(layer.matrixWorld);
      const screen = world.project(this.runtime.camera);
      raw[layerName] = (1 - screen.y) * 0.5 * height - 26;
    });
    const positions = {
      digital: THREE.MathUtils.clamp(raw.digital, 64, Math.max(64, height - 220)),
      operation: 0,
      infrastructure: 0,
    };
    positions.operation = Math.max(raw.operation, positions.digital + 62);
    positions.infrastructure = Math.max(raw.infrastructure, positions.operation + 62);
    const overflow = Math.max(0, positions.infrastructure - (height - 70));
    if (overflow) Object.keys(positions).forEach((key) => { positions[key] -= overflow; });
    this.runtime.ui.updateStoryLayerLabelPositions(positions);
  }

  declutterLabels() {
    if (!this.active || !this.root.visible) return;
    const width = this.runtime.canvas?.parentElement?.clientWidth ?? 0;
    const height = this.runtime.canvas?.parentElement?.clientHeight ?? 0;
    if (!width || !height) return;
    const labels = [];
    this.root.traverse((object) => {
      if (!object.isSprite || object.userData.kind !== 'story-label') return;
      if (object.userData.declutterHidden) {
        object.visible = (object.material?.opacity ?? 0) > 0.01;
        object.userData.declutterHidden = false;
      }
      let ancestor = object.parent;
      let hierarchyVisible = object.visible;
      while (ancestor && hierarchyVisible) {
        hierarchyVisible = ancestor.visible;
        ancestor = ancestor.parent;
      }
      if (!hierarchyVisible || (object.material?.opacity ?? 0) <= 0.04) return;
      labels.push(object);
    });
    this.runtime.scene.updateMatrixWorld(true);
    this.runtime.camera.updateMatrixWorld();
    const cameraRight = new THREE.Vector3().setFromMatrixColumn(this.runtime.camera.matrixWorld, 0).normalize();
    const cameraUp = new THREE.Vector3().setFromMatrixColumn(this.runtime.camera.matrixWorld, 1).normalize();
    const projected = labels.map((label) => {
      const centerWorld = label.getWorldPosition(new THREE.Vector3());
      const scale = label.getWorldScale(new THREE.Vector3());
      const center = centerWorld.clone().project(this.runtime.camera);
      const right = centerWorld.clone().addScaledVector(cameraRight, scale.x * 0.5).project(this.runtime.camera);
      const top = centerWorld.clone().addScaledVector(cameraUp, scale.y * 0.5).project(this.runtime.camera);
      const x = (center.x + 1) * width * 0.5;
      const y = (1 - center.y) * height * 0.5;
      const halfWidth = THREE.MathUtils.clamp(Math.abs(right.x - center.x) * width * 0.5, 30, 140);
      const halfHeight = THREE.MathUtils.clamp(Math.abs(top.y - center.y) * height * 0.5, 12, 42);
      return {
        label,
        priority: label.userData.labelPriority ?? 8,
        offscreen: center.z < -1 || center.z > 1 || x + halfWidth < 0 || x - halfWidth > width || y + halfHeight < 0 || y - halfHeight > height,
        rect: { left: x - halfWidth, right: x + halfWidth, top: y - halfHeight, bottom: y + halfHeight },
      };
    }).sort((a, b) => b.priority - a.priority || a.rect.top - b.rect.top);
    const accepted = [];
    projected.forEach((item) => {
      const overlaps = accepted.some((other) => !(
        item.rect.right + 5 < other.left || item.rect.left - 5 > other.right
        || item.rect.bottom + 4 < other.top || item.rect.top - 4 > other.bottom
      ));
      const show = !item.offscreen && !overlaps;
      item.label.visible = show;
      item.label.userData.declutterHidden = !show;
      if (show) accepted.push(item.rect);
    });
  }

  dispose() {
    this.clearVisuals();
    this.audioContext?.close?.().catch?.(() => {});
    this.runtime.controls.removeEventListener?.('start', this.handleControlStart);
    this.root.removeFromParent();
  }
}
