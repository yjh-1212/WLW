import * as THREE from 'three';
import { MAP_THEME, toNumberColor } from '../theme/mapTheme.js';

/**
 * 首页开场星空地球。
 *
 * 只服务于首页（MAP_STATES.COMBINED）的开场演出：
 * 星空中的线框地球以中国为正面缓慢自转 → 镜头推进 → 中国地图分层显影后结束。
 * 该模块自带独立 Group 与全部材质，演出结束即销毁，
 * 不修改任何业务图层，也不会被其他页面引用。
 */

const DEG = Math.PI / 180;
const GLOBE_RADIUS = 40;
// 开场正面：中国大陆几何中心。地球从第一帧起就正对中国。
const CHINA_CENTER = { lng: 104, lat: 34 };
// 世界轮廓越靠近中国越亮，形成“中国—亚洲—世界”的三级主次。
const NEAR_FULL_DEGREES = 24;
const NEAR_FADE_DEGREES = 82;
// 星空球跟随相机移动，半径必须落在相机远裁剪面（400）以内、地球背面之外。
const STAR_RADIUS = 330;

// 开场配色：冷灰蓝的世界 + 暖金的中国，与业务图层的三网语义色同源，
// 但整体亮度压得更低，只靠中国一处暖色承担视觉重心。
const PALETTE = {
  world: new THREE.Color(toNumberColor(MAP_THEME.mapOutline)).multiplyScalar(0.26),
  near: new THREE.Color(toNumberColor(MAP_THEME.mapOutline)).multiplyScalar(0.66),
  china: new THREE.Color(toNumberColor(MAP_THEME.infrastructureBright)),
  chinaDot: new THREE.Color(toNumberColor(MAP_THEME.infrastructure)),
  // 飞线从中国的暖金渐变到远端的冷青，暗示“由中国连向世界”。
  corridorFrom: new THREE.Color(toNumberColor(MAP_THEME.infrastructureBright)),
  corridorTo: new THREE.Color(toNumberColor(MAP_THEME.operationBright)),
  corridorFlow: new THREE.Color(toNumberColor(MAP_THEME.operationBright)),
};

// 国际通道飞线：只做“中国连向世界”的意象，不表达任何业务数据。
// 起点是几个中国门户口岸，终点撒向全球主要城市，全部由脚本组合成一张飞线网。
// lines 是该门户最多承接的飞线数：沿海口岸吞吐量大、连线最多，
// 内陆主要城市各留几条，边境门户少而精。
const CORRIDOR_HUBS = [
  { lng: 121.5, lat: 31.2, lines: 6 }, // 上海
  { lng: 113.3, lat: 23.1, lines: 5 }, // 广州
  { lng: 114.1, lat: 22.5, lines: 4 }, // 深圳
  { lng: 121.6, lat: 29.9, lines: 4 }, // 宁波
  { lng: 120.4, lat: 36.1, lines: 4 }, // 青岛
  { lng: 117.2, lat: 39.1, lines: 4 }, // 天津
  { lng: 116.4, lat: 39.9, lines: 4 }, // 北京
  { lng: 118.1, lat: 24.5, lines: 3 }, // 厦门
  { lng: 121.6, lat: 38.9, lines: 3 }, // 大连
  { lng: 114.3, lat: 30.6, lines: 3 }, // 武汉
  { lng: 113.6, lat: 34.7, lines: 3 }, // 郑州
  { lng: 108.9, lat: 34.3, lines: 3 }, // 西安
  { lng: 106.5, lat: 29.6, lines: 3 }, // 重庆
  { lng: 104.1, lat: 30.7, lines: 2 }, // 成都
  { lng: 112.9, lat: 28.2, lines: 2 }, // 长沙
  { lng: 102.7, lat: 25, lines: 2 }, // 昆明
  { lng: 126.5, lat: 45.8, lines: 2 }, // 哈尔滨
  { lng: 87.6, lat: 43.8, lines: 2 }, // 乌鲁木齐
  { lng: 91.1, lat: 29.7, lines: 1 }, // 拉萨
];
const CORRIDOR_TARGETS = [
  { lng: 103.8, lat: 1.3 }, // 新加坡
  { lng: 106.8, lat: -6.2 }, // 雅加达
  { lng: 100.5, lat: 13.7 }, // 曼谷
  { lng: 72.9, lat: 19.1 }, // 孟买
  { lng: 55.3, lat: 25.3 }, // 迪拜
  { lng: 51.4, lat: 35.7 }, // 德黑兰
  { lng: 37.6, lat: 55.8 }, // 莫斯科
  { lng: 30.5, lat: 50.5 }, // 基辅
  { lng: 13.4, lat: 52.5 }, // 柏林
  { lng: 4.5, lat: 51.9 }, // 鹿特丹
  { lng: -0.1, lat: 51.5 }, // 伦敦
  { lng: 2.4, lat: 48.9 }, // 巴黎
  { lng: 28.0, lat: -26.2 }, // 约翰内斯堡
  { lng: 31.2, lat: 30.0 }, // 开罗
  { lng: -74.0, lat: 40.7 }, // 纽约
  { lng: -118.2, lat: 33.7 }, // 洛杉矶
  { lng: -99.1, lat: 19.4 }, // 墨西哥城
  { lng: -46.6, lat: -23.5 }, // 圣保罗
  { lng: 151.2, lat: -33.9 }, // 悉尼
  { lng: 139.7, lat: 35.7 }, // 东京
  { lng: 126.9, lat: 37.6 }, // 首尔
  { lng: -122.4, lat: 37.8 }, // 旧金山
];
// 球面角距。经度差跨 ±180 时按最短弧计算，跨太平洋的目的地才不会被算成“西部门户更近”。
const angularDistance = (a, b) => {
  const half = Math.sin(((b.lat - a.lat) * DEG) / 2) ** 2
    + Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(((b.lng - a.lng) * DEG) / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(half)));
};

/**
 * 组网规则：每个目的地在最近的若干门户中，优先选剩余配额多的两个，
 * 于是配额高的沿海口岸自然承接更多飞线；最后给完全没被选中的门户补一条最近航线，
 * 保证列出的每座城市都在网里。
 */
const CORRIDORS = (() => {
  const remaining = new Map(CORRIDOR_HUBS.map((hub) => [hub, hub.lines]));
  const used = new Map(CORRIDOR_HUBS.map((hub) => [hub, 0]));
  const list = [];
  const connect = (from, to) => {
    remaining.set(from, remaining.get(from) - 1);
    used.set(from, used.get(from) + 1);
    const index = list.length;
    list.push({
      from,
      to,
      // 速度与相位打散，避免所有光点齐步走。
      speed: 0.1 + ((index * 7) % 11) * 0.012,
      phase: ((index * 5) % 13) / 13,
    });
  };

  CORRIDOR_TARGETS.forEach((to) => {
    CORRIDOR_HUBS
      .map((from) => ({ from, distance: angularDistance(from, to) }))
      .sort((a, b) => a.distance - b.distance)
      .filter(({ from }) => remaining.get(from) > 0)
      .slice(0, 7)
      .sort((a, b) => (remaining.get(b.from) - remaining.get(a.from)) || (a.distance - b.distance))
      .slice(0, 2)
      .forEach(({ from }) => connect(from, to));
  });

  CORRIDOR_HUBS.filter((hub) => used.get(hub) === 0).forEach((from) => {
    const [nearest] = [...CORRIDOR_TARGETS]
      .sort((a, b) => angularDistance(from, a) - angularDistance(from, b));
    connect(from, nearest);
  });

  return list;
})();
const CORRIDOR_STEPS = 72;
const CORRIDOR_TAIL = 12;

// 尺寸是屏幕像素（sizeAttenuation 关闭），软边贴图会吃掉边缘，太小会直接看不见。
// 星点撒满整个球壳，33° 视场只能看到约 4%，因此数量要给足才有星空密度。
const STAR_TIERS = [
  { count: 2400, size: 2.6, opacity: 0.42, color: '#8fa9c4', twinkle: 0.06, speed: 0.7 },
  { count: 1100, size: 3.6, opacity: 0.6, color: '#cadff1', twinkle: 0.12, speed: 1.1 },
  { count: 420, size: 5, opacity: 0.82, color: '#ffffff', twinkle: 0.18, speed: 1.6 },
  // 少量暖色星，避免整片星空只有一种色温。
  { count: 110, size: 4.4, opacity: 0.66, color: '#ffd6a3', twinkle: 0.22, speed: 2.1 },
];

// 演出节拍（秒）。总长约 8 秒，可被任意交互跳过。
const TIMELINE = {
  fadeIn: [0.15, 1.3],
  push: [3.6, 6.9],
  // 星球本体、世界轮廓与中国地图三者交叠溶解：任何一帧都不会只剩一张悬空的线框网。
  coreFade: [4.2, 5.4],
  worldFade: [4.2, 5.5],
  chinaFade: [4.7, 6.2],
  reveal: [4.8, 8],
  end: 8.3,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (t) => t * t * (3 - 2 * t);
const ramp = (time, [start, end]) => smoothstep(clamp01((time - start) / (end - start)));

const toSphere = (lng, lat, radius, target = new THREE.Vector3()) => target.set(
  radius * Math.cos(lat * DEG) * Math.cos(lng * DEG),
  radius * Math.cos(lat * DEG) * Math.sin(lng * DEG),
  radius * Math.sin(lat * DEG),
);

const nearnessAt = (() => {
  const center = toSphere(CHINA_CENTER.lng, CHINA_CENTER.lat, 1);
  const point = new THREE.Vector3();
  return (lng, lat) => {
    toSphere(lng, lat, 1, point);
    const degrees = Math.acos(THREE.MathUtils.clamp(point.dot(center), -1, 1)) / DEG;
    const falloff = clamp01((degrees - NEAR_FULL_DEGREES) / (NEAR_FADE_DEGREES - NEAR_FULL_DEGREES));
    return 1 - smoothstep(falloff);
  };
})();

/**
 * 首页开场轮廓数据：世界海岸线 + 中国国界。加载失败时返回 null，开场退化为经纬网地球。
 */
export async function loadWorldOutline() {
  try {
    const response = await fetch('/data/world-outline.json');
    if (!response.ok) return null;
    const payload = await response.json();
    if (!Array.isArray(payload?.rings)) return null;
    return { world: payload.rings, china: Array.isArray(payload.china) ? payload.china : [] };
  } catch {
    return null;
  }
}

export function prefersReducedMotion() {
  return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

function createDotTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.42, 'rgba(255,255,255,0.62)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGlowTexture(inner, mid) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.5, mid);
  gradient.addColorStop(1, 'rgba(2,7,18,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class HomeGlobeIntro {
  constructor({
    scene,
    camera,
    controls,
    rings = null,
    chinaRings = null,
    homeTarget,
    homePosition,
    radius = GLOBE_RADIUS,
    onReveal = () => {},
    onFinish = () => {},
  }) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.radius = radius;
    this.center = homeTarget.clone();
    this.homePosition = homePosition.clone();
    this.onReveal = onReveal;
    this.onFinish = onFinish;

    this.active = true;
    this.startedAt = null;
    this.introPosition = new THREE.Vector3();
    this.introFov = 33;
    this.pushFrom = null;
    this.pushFromFov = this.introFov;
    this.disposables = [];
    this.textures = [];
    this.worldFades = [];
    this.chinaFades = [];
    this.starTiers = [];

    this.root = new THREE.Group();
    this.root.name = 'HomeGlobeIntro';
    this.root.position.copy(this.center);
    this.spinRoot = new THREE.Group();
    this.spinRoot.name = 'HomeGlobeSpin';
    this.root.add(this.spinRoot);

    // 自转从中国略偏东开始，缓慢转到正中，全程中国都在画面中心。
    this.baseSpin = -(90 + CHINA_CENTER.lng + 4.5) * DEG;
    this.spinRate = 1.25 * DEG;
    this.spinDecay = 2.6;

    this.dotTexture = this.trackTexture(createDotTexture());
    this.buildStars();
    this.buildCore();
    this.buildGraticule();
    if (rings?.length) {
      this.buildCoastlines(rings);
      this.buildDots(rings);
    }
    if (chinaRings?.length) this.buildChina(chinaRings);
    this.buildCorridors();
    this.setGroupAlpha(0);
    this.scene.add(this.root);
    this.bindSkipHandlers();
  }

  track(object) {
    this.disposables.push(object);
    return object;
  }

  trackTexture(texture) {
    this.textures.push(texture);
    return texture;
  }

  /**
   * 星空：跟随相机的点云球壳，因此没有视差，看起来像无限远的恒星。
   */
  buildStars() {
    this.starRoot = new THREE.Group();
    this.starRoot.name = 'HomeGlobeStars';
    this.scene.add(this.starRoot);

    STAR_TIERS.forEach((tier, index) => {
      const positions = new Float32Array(tier.count * 3);
      const point = new THREE.Vector3();
      for (let i = 0; i < tier.count; i += 1) {
        // 均匀球面采样，避免两极堆点。
        const z = Math.random() * 2 - 1;
        const angle = Math.random() * Math.PI * 2;
        const ring = Math.sqrt(1 - z * z);
        point.set(ring * Math.cos(angle), ring * Math.sin(angle), z)
          .multiplyScalar(STAR_RADIUS * (0.94 + Math.random() * 0.12));
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const stars = new THREE.Points(geometry, new THREE.PointsMaterial({
        map: this.dotTexture,
        color: new THREE.Color(tier.color),
        size: tier.size,
        sizeAttenuation: false,
        transparent: true,
        opacity: tier.opacity,
        depthWrite: false,
        fog: false,
      }));
      stars.name = `HomeGlobeStars-${index}`;
      stars.renderOrder = -4;
      stars.frustumCulled = false;
      this.starRoot.add(stars);
      this.track(stars);
      this.worldFades.push({ object: stars, opacity: tier.opacity });
      this.starTiers.push({ object: stars, twinkle: tier.twinkle, speed: tier.speed, phase: index * 1.7 });
    });
  }

  buildCore() {
    const geometry = new THREE.SphereGeometry(this.radius * 0.988, 48, 32);
    const material = new THREE.MeshBasicMaterial({
      color: toNumberColor(MAP_THEME.backgroundDeep),
      transparent: true,
      opacity: 0.94,
    });
    this.core = new THREE.Mesh(geometry, material);
    this.core.name = 'HomeGlobeCore';
    this.core.renderOrder = -2;
    this.spinRoot.add(this.core);
    this.track(this.core);

    // 大气边缘光：一层克制的冷色外扩，只用来把星球从星空里托出来。
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.trackTexture(createGlowTexture('rgba(104,186,240,0.30)', 'rgba(44,104,164,0.09)')),
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    }));
    halo.scale.setScalar(this.radius * 2.72);
    halo.renderOrder = -3;
    this.root.add(halo);
    this.track(halo);
    this.worldFades.push({ object: halo, opacity: 0.52 });
  }

  buildGraticule() {
    const positions = [];
    const pushArc = (steps, at) => {
      let previous = null;
      for (let index = 0; index <= steps; index += 1) {
        const { lng, lat } = at(index / steps);
        const point = toSphere(lng, lat, this.radius * 1.001);
        if (previous) positions.push(previous.x, previous.y, previous.z, point.x, point.y, point.z);
        previous = point.clone();
      }
    };
    [-60, -30, 0, 30, 60].forEach((lat) => pushArc(96, (t) => ({ lng: -180 + t * 360, lat })));
    for (let lng = -180; lng < 180; lng += 30) pushArc(56, (t) => ({ lng, lat: -82 + t * 164 }));

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: toNumberColor(MAP_THEME.mapBright),
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    });
    const grid = new THREE.LineSegments(geometry, material);
    grid.name = 'HomeGlobeGraticule';
    this.spinRoot.add(grid);
    this.track(grid);
    this.worldFades.push({ object: grid, opacity: 0.13 });
  }

  buildCoastlines(rings) {
    const positions = [];
    const colors = [];
    const color = new THREE.Color();
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();

    rings.forEach((ring) => {
      for (let index = 1; index < ring.length; index += 1) {
        const [lngA, latA] = ring[index - 1];
        const [lngB, latB] = ring[index];
        // 抽稀后的环可能跨越经度接缝，跳过这类跨屏线段。
        if (Math.abs(lngB - lngA) > 180) continue;
        toSphere(lngA, latA, this.radius * 1.004, from);
        toSphere(lngB, latB, this.radius * 1.004, to);
        positions.push(from.x, from.y, from.z, to.x, to.y, to.z);
        color.copy(PALETTE.world).lerp(PALETTE.near, nearnessAt(lngA, latA));
        colors.push(color.r, color.g, color.b);
        color.copy(PALETTE.world).lerp(PALETTE.near, nearnessAt(lngB, latB));
        colors.push(color.r, color.g, color.b);
      }
    });
    if (!positions.length) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }));
    lines.name = 'HomeGlobeWorldOutline';
    this.spinRoot.add(lines);
    this.track(lines);
    this.worldFades.push({ object: lines, opacity: 0.6 });
  }

  buildDots(rings) {
    const spacing = this.radius * 0.042;
    const positions = [];
    const colors = [];
    const color = new THREE.Color();
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    const point = new THREE.Vector3();

    rings.forEach((ring) => {
      for (let index = 1; index < ring.length; index += 1) {
        const [lngA, latA] = ring[index - 1];
        const [lngB, latB] = ring[index];
        if (Math.abs(lngB - lngA) > 180) continue;
        toSphere(lngA, latA, this.radius, from);
        toSphere(lngB, latB, this.radius, to);
        const steps = Math.max(1, Math.round(from.distanceTo(to) / spacing));
        for (let step = 0; step < steps; step += 1) {
          const t = step / steps;
          const lng = lngA + (lngB - lngA) * t;
          const lat = latA + (latB - latA) * t;
          point.copy(from).lerp(to, t).setLength(this.radius * 1.006);
          positions.push(point.x, point.y, point.z);
          color.copy(PALETTE.world).lerp(PALETTE.near, nearnessAt(lng, lat));
          colors.push(color.r, color.g, color.b);
        }
      }
    });
    if (!positions.length) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const dots = new THREE.Points(geometry, new THREE.PointsMaterial({
      map: this.dotTexture,
      size: 2.5,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }));
    dots.name = 'HomeGlobeWorldDots';
    this.spinRoot.add(dots);
    this.track(dots);
    this.worldFades.push({ object: dots, opacity: 0.62 });
  }

  /**
   * 中国轮廓：球面上唯一的暖色主体，也是推进到中国地图时的形状衔接。
   */
  buildChina(rings) {
    const linePositions = [];
    const dotPositions = [];
    const spacing = this.radius * 0.022;
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    const point = new THREE.Vector3();

    rings.forEach((ring) => {
      for (let index = 1; index < ring.length; index += 1) {
        const [lngA, latA] = ring[index - 1];
        const [lngB, latB] = ring[index];
        if (Math.abs(lngB - lngA) > 180) continue;
        toSphere(lngA, latA, this.radius * 1.009, from);
        toSphere(lngB, latB, this.radius * 1.009, to);
        linePositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
        const steps = Math.max(1, Math.round(from.distanceTo(to) / spacing));
        for (let step = 0; step < steps; step += 1) {
          point.copy(from).lerp(to, step / steps).setLength(this.radius * 1.011);
          dotPositions.push(point.x, point.y, point.z);
        }
      }
    });

    const outlineGeometry = new THREE.BufferGeometry();
    outlineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const outline = new THREE.LineSegments(outlineGeometry, new THREE.LineBasicMaterial({
      color: PALETTE.china.getHex(),
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }));
    outline.name = 'HomeGlobeChinaOutline';
    this.spinRoot.add(outline);
    this.track(outline);
    this.chinaFades.push({ object: outline, opacity: 0.92 });

    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    const dots = new THREE.Points(dotGeometry, new THREE.PointsMaterial({
      map: this.dotTexture,
      color: PALETTE.chinaDot.getHex(),
      size: 2.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    dots.name = 'HomeGlobeChinaDots';
    this.spinRoot.add(dots);
    this.track(dots);
    this.chinaFades.push({ object: dots, opacity: 0.85 });

    // 贴在球面上的一层极淡暖光，让中国从冷色世界里浮出来，不做发光溢出。
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.trackTexture(createGlowTexture('rgba(255,190,104,0.26)', 'rgba(198,124,42,0.07)')),
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    }));
    glow.position.copy(toSphere(CHINA_CENTER.lng, CHINA_CENTER.lat, this.radius * 1.02));
    glow.scale.setScalar(this.radius * 0.86);
    glow.renderOrder = -1;
    this.spinRoot.add(glow);
    this.track(glow);
    this.chinaFades.push({ object: glow, opacity: 0.26 });
  }

  /**
   * 国际通道飞线：静态弧线 + 一段流动的光点尾迹。
   * 弧线两端压暗、弧顶最亮，跨度越大抬得越高；转到地球背面时被本体正常遮挡。
   */
  buildCorridors() {
    const linePositions = [];
    const lineColors = [];
    const endpointPositions = [];
    const endpointColors = [];
    const color = new THREE.Color();
    this.corridors = [];

    CORRIDORS.forEach(({ from, to, speed, phase = 0 }, index) => {
      const start = toSphere(from.lng, from.lat, 1);
      const end = toSphere(to.lng, to.lat, 1);
      // 跨度越大抬得越高，长航线要明显拱出球面轮廓才像“飞”出去；
      // 同一门户射向多地时用微小相位错开弧高，避免弧线彼此贴平重叠。
      const lift = 0.09 + 0.28 * (start.angleTo(end) / Math.PI) + (index % 3) * 0.015;
      const curve = [];
      for (let step = 0; step <= CORRIDOR_STEPS; step += 1) {
        const t = step / CORRIDOR_STEPS;
        curve.push(start.clone().lerp(end, t).normalize()
          .multiplyScalar(this.radius * (1.012 + Math.sin(Math.PI * t) * lift)));
      }
      for (let step = 1; step <= CORRIDOR_STEPS; step += 1) {
        const previous = curve[step - 1];
        const point = curve[step];
        linePositions.push(previous.x, previous.y, previous.z, point.x, point.y, point.z);
        [step - 1, step].forEach((position) => {
          const t = position / CORRIDOR_STEPS;
          color.copy(PALETTE.corridorFrom).lerp(PALETTE.corridorTo, t)
            .multiplyScalar(0.5 + 0.5 * Math.sin(Math.PI * t));
          lineColors.push(color.r, color.g, color.b);
        });
      }

      [curve[0], curve.at(-1)].forEach((point, position) => {
        endpointPositions.push(point.x, point.y, point.z);
        color.copy(position ? PALETTE.corridorTo : PALETTE.corridorFrom);
        endpointColors.push(color.r, color.g, color.b);
      });

      const flowPositions = new Float32Array(CORRIDOR_TAIL * 3);
      const flowColors = new Float32Array(CORRIDOR_TAIL * 3);
      for (let tail = 0; tail < CORRIDOR_TAIL; tail += 1) {
        flowPositions[tail * 3] = curve[0].x;
        flowPositions[tail * 3 + 1] = curve[0].y;
        flowPositions[tail * 3 + 2] = curve[0].z;
        // 头部最亮、向尾部快速压暗，加色混合下等同于淡出。
        color.copy(PALETTE.corridorFlow).multiplyScalar((1 - tail / CORRIDOR_TAIL) ** 2.2);
        flowColors[tail * 3] = color.r;
        flowColors[tail * 3 + 1] = color.g;
        flowColors[tail * 3 + 2] = color.b;
      }
      const flowGeometry = new THREE.BufferGeometry();
      flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
      flowGeometry.setAttribute('color', new THREE.BufferAttribute(flowColors, 3));
      const flow = new THREE.Points(flowGeometry, new THREE.PointsMaterial({
        map: this.dotTexture,
        size: 3.6,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }));
      flow.name = `HomeGlobeCorridorFlow-${index}`;
      flow.frustumCulled = false;
      this.spinRoot.add(flow);
      this.track(flow);
      this.chinaFades.push({ object: flow, opacity: 1 });
      this.corridors.push({ curve, flow, speed, offset: phase });
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
    const lines = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      // 线多了以后单条压暗，靠密度而非亮度形成网感，避免糊成一片。
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    lines.name = 'HomeGlobeCorridors';
    this.spinRoot.add(lines);
    this.track(lines);
    this.chinaFades.push({ object: lines, opacity: 0.4 });

    const endpointGeometry = new THREE.BufferGeometry();
    endpointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(endpointPositions, 3));
    endpointGeometry.setAttribute('color', new THREE.Float32BufferAttribute(endpointColors, 3));
    const endpoints = new THREE.Points(endpointGeometry, new THREE.PointsMaterial({
      map: this.dotTexture,
      size: 3.4,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    endpoints.name = 'HomeGlobeCorridorEndpoints';
    this.spinRoot.add(endpoints);
    this.track(endpoints);
    this.chinaFades.push({ object: endpoints, opacity: 0.62 });
  }

  updateCorridors(time) {
    this.corridors?.forEach(({ curve, flow, speed, offset }) => {
      if (!flow.visible) return;
      const head = (time * speed + offset) % 1;
      const attribute = flow.geometry.getAttribute('position');
      for (let tail = 0; tail < CORRIDOR_TAIL; tail += 1) {
        const t = Math.max(0, head - tail * 0.007);
        const point = curve[Math.round(t * CORRIDOR_STEPS)];
        attribute.setXYZ(tail, point.x, point.y, point.z);
      }
      attribute.needsUpdate = true;
    });
  }

  bindSkipHandlers() {
    this.skipHandler = () => this.skip();
    const target = this.controls?.domElement ?? globalThis;
    this.skipTarget = target;
    ['pointerdown', 'wheel', 'touchstart'].forEach((type) => {
      target.addEventListener(type, this.skipHandler, { passive: true });
    });
    globalThis.addEventListener?.('keydown', this.skipHandler);
  }

  unbindSkipHandlers() {
    if (!this.skipHandler) return;
    ['pointerdown', 'wheel', 'touchstart'].forEach((type) => {
      this.skipTarget?.removeEventListener?.(type, this.skipHandler);
    });
    globalThis.removeEventListener?.('keydown', this.skipHandler);
    this.skipHandler = null;
  }

  setGroupAlpha(alpha) {
    const amount = clamp01(alpha);
    this.groupAlpha = amount;
    [...this.worldFades, ...this.chinaFades].forEach(({ object, opacity }) => {
      const data = object.userData;
      object.material.opacity = opacity * amount * (data.fadeScale ?? 1) * (data.pulse ?? 1);
      object.visible = object.material.opacity > 0.002;
    });
    if (this.core) {
      this.core.material.opacity = 0.94 * amount * (this.core.userData.fadeScale ?? 1);
      this.core.visible = this.core.material.opacity > 0.02;
    }
  }

  /**
   * 计算全球开场机位：让地球在竖直与水平方向都留出边距，视线纬度对准中国。
   */
  updateIntroPose() {
    const halfFov = THREE.MathUtils.degToRad(this.introFov) * 0.5;
    const aspect = this.camera.aspect || 1;
    const halfHorizontal = Math.atan(Math.tan(halfFov) * aspect);
    const limit = Math.max(0.08, Math.min(halfFov, halfHorizontal) * 0.72);
    const distance = this.radius / Math.sin(limit);
    const tilt = THREE.MathUtils.degToRad(30);
    this.introPosition.set(
      this.center.x,
      this.center.y - distance * Math.cos(tilt),
      this.center.z + distance * Math.sin(tilt),
    );
  }

  applyCamera(time) {
    const [pushStart, pushEnd] = TIMELINE.push;
    if (time < pushStart) {
      this.updateIntroPose();
      this.camera.position.copy(this.introPosition);
      this.setFov(this.introFov);
    } else {
      if (!this.pushFrom) {
        this.updateIntroPose();
        this.pushFrom = this.introPosition.clone();
        this.pushFromFov = this.camera.fov;
      }
      const k = smoothstep(clamp01((time - pushStart) / (pushEnd - pushStart)));
      this.camera.position.lerpVectors(this.pushFrom, this.homePosition, k);
      // 轻微抬升，让推进更像飞越而不是直线插值。
      this.camera.position.z += Math.sin(Math.PI * k) * this.radius * 0.22;
      this.setFov(this.pushFromFov + (35 - this.pushFromFov) * k);
    }
    this.controls.target.copy(this.center);
    this.camera.lookAt(this.center);
  }

  setFov(fov) {
    if (Math.abs(this.camera.fov - fov) < 0.01) return;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  applySpin(time) {
    const [pushStart] = TIMELINE.push;
    const steady = Math.min(time, pushStart);
    let rotation = this.baseSpin + this.spinRate * steady;
    if (time > pushStart) {
      const u = clamp01((time - pushStart) / this.spinDecay);
      rotation += this.spinRate * this.spinDecay * (u - (u * u) / 2);
    }
    this.spinRoot.rotation.z = rotation;
  }

  /**
   * 星空随相机平移，只做极慢的整体旋转与呼吸式明暗。
   */
  updateStars(time) {
    if (!this.starRoot) return;
    this.starRoot.position.copy(this.camera.position);
    this.starRoot.rotation.z = time * 0.006;
    this.starTiers.forEach(({ object, twinkle, speed, phase }) => {
      object.userData.pulse = 1 - twinkle * 0.5 * (1 - Math.sin(time * speed + phase));
    });
  }

  update(elapsed) {
    if (!this.active) return;
    if (this.startedAt === null) this.startedAt = elapsed;
    const time = elapsed - this.startedAt;

    const fadeIn = ramp(time, TIMELINE.fadeIn);
    const worldOut = 1 - ramp(time, TIMELINE.worldFade);
    const chinaOut = 1 - ramp(time, TIMELINE.chinaFade);
    const coreOut = 1 - ramp(time, TIMELINE.coreFade);
    this.worldFades.forEach(({ object }) => { object.userData.fadeScale = worldOut; });
    this.chinaFades.forEach(({ object }) => { object.userData.fadeScale = chinaOut; });
    if (this.core) this.core.userData.fadeScale = coreOut;

    this.applySpin(time);
    this.applyCamera(time);
    this.updateStars(time);
    this.updateCorridors(time);
    this.setGroupAlpha(fadeIn);

    // 推进过程中地球略微放大，配合镜头形成穿越感。
    const growth = ramp(time, TIMELINE.push);
    this.root.scale.setScalar(1 + growth * 0.2);

    this.onReveal(ramp(time, TIMELINE.reveal));

    if (time >= TIMELINE.end) this.finish();
  }

  /**
   * 任何交互都结束开场：地图立即完成显影，镜头交回宿主平滑落位。
   */
  skip() {
    if (!this.active) return;
    this.controls.target.copy(this.center);
    this.finish();
  }

  finish() {
    if (!this.active) return;
    this.active = false;
    this.unbindSkipHandlers();
    this.onReveal(1);
    this.dispose();
    this.onFinish();
  }

  dispose() {
    this.active = false;
    this.unbindSkipHandlers();
    this.disposables.forEach((object) => {
      object.parent?.remove(object);
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material?.dispose?.());
    });
    this.disposables = [];
    this.worldFades = [];
    this.chinaFades = [];
    this.starTiers = [];
    this.corridors = [];
    this.textures.forEach((texture) => texture?.dispose?.());
    this.textures = [];
    this.starRoot?.parent?.remove(this.starRoot);
    this.starRoot = null;
    this.root.parent?.remove(this.root);
  }
}
