/**
 * 生成首页开场地球用的世界海岸线轮廓与中国国界轮廓。
 *
 * 数据源：world-atlas (Natural Earth 110m land / countries)，TopoJSON。
 * 输出：public/data/world-outline.json —— 已抽稀的经纬度折线环，
 * 只用于首页开场的线框地球，不参与业务图层。
 *
 * 用法：node scripts/prepare-world-outline.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const LAND_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';
const COUNTRIES_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const landCache = new URL('../data/world-land-110m.json', import.meta.url);
const countriesCache = new URL('../data/world-countries-110m.json', import.meta.url);
const output = new URL('../public/data/world-outline.json', import.meta.url);

// 抽稀容差（度）。开场地球只需要可辨识的大陆轮廓，不需要海岸细节。
const TOLERANCE = 0.42;
// 小于该跨度（度）的环视为噪点岛屿，直接丢弃。
const MIN_SPAN = 2.4;
// 中国是开场主角，容差更细、保留更小的岛屿（海南、台湾）。
const CHINA_TOLERANCE = 0.2;
const CHINA_MIN_SPAN = 0.7;
// Natural Earth 把台湾单列为一个要素，中国轮廓必须把它并回来。
const CHINA_IDS = new Set(['156', '158']);

function sqSegmentDistance(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;
  if (dx || dy) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyStep(points, first, last, toleranceSq, kept) {
  let maxDistance = toleranceSq;
  let splitIndex = 0;
  for (let index = first + 1; index < last; index += 1) {
    const distance = sqSegmentDistance(points[index], points[first], points[last]);
    if (distance > maxDistance) {
      splitIndex = index;
      maxDistance = distance;
    }
  }
  if (!splitIndex) return;
  if (splitIndex - first > 1) simplifyStep(points, first, splitIndex, toleranceSq, kept);
  kept.push(points[splitIndex]);
  if (last - splitIndex > 1) simplifyStep(points, splitIndex, last, toleranceSq, kept);
}

function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const kept = [points[0]];
  simplifyStep(points, 0, points.length - 1, tolerance * tolerance, kept);
  kept.push(points.at(-1));
  return kept;
}

async function loadTopology(url, cache) {
  try {
    return JSON.parse(await readFile(cache, 'utf8'));
  } catch {
    process.stdout.write(`下载 ${url}\n`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`轮廓数据下载失败：${response.status}`);
    const raw = await response.text();
    await mkdir(new URL('.', cache), { recursive: true });
    await writeFile(cache, raw);
    return JSON.parse(raw);
  }
}

function decodeArcs(topology) {
  const [scaleX, scaleY] = topology.transform.scale;
  const [translateX, translateY] = topology.transform.translate;
  return topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scaleX + translateX, y * scaleY + translateY];
    });
  });
}

function ringFromArcIndexes(indexes, arcs) {
  const ring = [];
  indexes.forEach((index) => {
    const arc = index < 0 ? arcs[~index].slice().reverse() : arcs[index];
    arc.forEach((point, position) => {
      if (position === 0 && ring.length) return;
      ring.push(point);
    });
  });
  return ring;
}

function spanOf(ring) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  ring.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return Math.max(maxX - minX, maxY - minY);
}

function polygonsOf(geometries) {
  return geometries.flatMap((geometry) => (
    geometry.type === 'MultiPolygon' ? geometry.arcs : [geometry.arcs]
  ));
}

function buildRings(geometries, arcs, { tolerance, minSpan }) {
  const rings = [];
  polygonsOf(geometries).forEach((polygon) => {
    polygon.forEach((indexes) => {
      const ring = ringFromArcIndexes(indexes, arcs);
      if (ring.length < 4 || spanOf(ring) < minSpan) return;
      const simplified = simplify(ring, tolerance)
        .map(([lng, lat]) => [Number(lng.toFixed(2)), Number(lat.toFixed(2))]);
      if (simplified.length < 4) return;
      rings.push(simplified);
    });
  });
  return rings.sort((a, b) => spanOf(b) - spanOf(a));
}

const landTopology = await loadTopology(LAND_URL, landCache);
const land = landTopology.objects.land;
const rings = buildRings(
  land.type === 'GeometryCollection' ? land.geometries : [land],
  decodeArcs(landTopology),
  { tolerance: TOLERANCE, minSpan: MIN_SPAN },
);

const countriesTopology = await loadTopology(COUNTRIES_URL, countriesCache);
const chinaGeometries = countriesTopology.objects.countries.geometries
  .filter((geometry) => CHINA_IDS.has(String(geometry.id)));
if (!chinaGeometries.length) throw new Error('countries-110m 中未找到中国要素');
const china = buildRings(
  chinaGeometries,
  decodeArcs(countriesTopology),
  { tolerance: CHINA_TOLERANCE, minSpan: CHINA_MIN_SPAN },
);

const countPoints = (list) => list.reduce((total, ring) => total + ring.length, 0);
const payload = {
  version: '1.1.0',
  source: 'Natural Earth 110m land + countries via world-atlas',
  license: 'Public domain (Natural Earth)',
  usage: '首页开场星空地球轮廓，仅用于视觉演出',
  toleranceDegrees: TOLERANCE,
  ringCount: rings.length,
  pointCount: countPoints(rings),
  chinaRingCount: china.length,
  chinaPointCount: countPoints(china),
  rings,
  china,
};

await writeFile(output, `${JSON.stringify(payload)}\n`);
process.stdout.write(
  `已生成世界 ${rings.length} 环 / ${payload.pointCount} 点，中国 ${china.length} 环 / ${payload.chinaPointCount} 点\n`,
);
