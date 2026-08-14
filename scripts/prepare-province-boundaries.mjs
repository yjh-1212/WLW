import { readFile, writeFile } from 'node:fs/promises';

const mainlandSource = new URL('../data/全国市级行政边界_DataV.geojson', import.meta.url);
const taiwanSource = new URL('../data/台湾县市行政边界_g0v.geojson', import.meta.url);
const output = new URL('../public/data/province-boundaries.json', import.meta.url);

const provinceNames = new Map(Object.entries({
  110000: '北京', 120000: '天津', 130000: '河北', 140000: '山西', 150000: '内蒙古',
  210000: '辽宁', 220000: '吉林', 230000: '黑龙江', 310000: '上海', 320000: '江苏',
  330000: '浙江', 340000: '安徽', 350000: '福建', 360000: '江西', 370000: '山东',
  410000: '河南', 420000: '湖北', 430000: '湖南', 440000: '广东', 450000: '广西',
  460000: '海南', 500000: '重庆', 510000: '四川', 520000: '贵州', 530000: '云南',
  540000: '西藏', 610000: '陕西', 620000: '甘肃', 630000: '青海', 640000: '宁夏',
  650000: '新疆', 710000: '台湾', 810000: '香港', 820000: '澳门',
}));

const sqDistance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

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

function simplifyStep(points, first, last, toleranceSq, outputPoints) {
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
  if (splitIndex - first > 1) simplifyStep(points, first, splitIndex, toleranceSq, outputPoints);
  outputPoints.push(points[splitIndex]);
  if (last - splitIndex > 1) simplifyStep(points, splitIndex, last, toleranceSq, outputPoints);
}

function simplifyRing(ring, tolerance) {
  if (!Array.isArray(ring) || ring.length < 4) return [];
  const closed = sqDistance(ring[0], ring.at(-1)) < 1e-12;
  const points = closed ? ring.slice(0, -1) : ring.slice();
  if (points.length < 4) return ring;
  const simplified = [points[0]];
  simplifyStep(points, 0, points.length - 1, tolerance ** 2, simplified);
  simplified.push(points.at(-1));
  if (closed) simplified.push(simplified[0]);
  return simplified.length >= 4
    ? simplified.map(([longitude, latitude]) => [Number(longitude.toFixed(5)), Number(latitude.toFixed(5))])
    : ring;
}

function geometryPaths(geometry, tolerance) {
  if (!geometry) return [];
  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  return polygons.flatMap((polygon) => polygon.map((ring) => simplifyRing(ring, tolerance)).filter((ring) => ring.length >= 4));
}

function geometryCenter(geometry) {
  const paths = geometryPaths(geometry, 0.045);
  const points = paths.flat();
  if (!points.length) return [0, 0];
  const bounds = points.reduce((result, [longitude, latitude]) => ({
    minX: Math.min(result.minX, longitude), maxX: Math.max(result.maxX, longitude),
    minY: Math.min(result.minY, latitude), maxY: Math.max(result.maxY, latitude),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  return [Number(((bounds.minX + bounds.maxX) / 2).toFixed(5)), Number(((bounds.minY + bounds.maxY) / 2).toFixed(5))];
}

const simplifyTaiwanName = (name) => String(name ?? '')
  .replaceAll('臺', '台')
  .replaceAll('縣', '县');

const [mainland, taiwan] = await Promise.all([
  readFile(mainlandSource, 'utf8').then(JSON.parse),
  readFile(taiwanSource, 'utf8').then(JSON.parse),
]);

const provinces = Object.fromEntries([...provinceNames.values()].map((name) => [name, { adcode: null, cities: [] }]));

for (const feature of mainland.features ?? []) {
  const properties = feature.properties ?? {};
  const provinceCode = Number(properties.acroutes?.[1] ?? properties.parent?.adcode ?? (Number(properties.adcode) === 710000 ? 710000 : NaN));
  const provinceName = provinceNames.get(String(provinceCode));
  if (!provinceName || provinceName === '台湾' || !properties.name || !feature.geometry) continue;
  const paths = geometryPaths(feature.geometry, 0.018);
  if (!paths.length) continue;
  provinces[provinceName].adcode = provinceCode;
  provinces[provinceName].cities.push({
    adcode: Number(properties.adcode),
    name: properties.name,
    level: properties.level === 'district' ? '区级' : '地级市',
    center: properties.centroid ?? properties.center ?? geometryCenter(feature.geometry),
    paths,
  });
}

provinces.台湾.adcode = 710000;
for (const feature of taiwan.features ?? []) {
  const name = simplifyTaiwanName(feature.properties?.name ?? feature.properties?.COUNTYNAME);
  const paths = geometryPaths(feature.geometry, 0.012);
  if (!name || !paths.length) continue;
  provinces.台湾.cities.push({
    adcode: feature.properties?.COUNTYSN ?? name,
    name,
    level: name.endsWith('市') ? '市级' : '县级',
    center: geometryCenter(feature.geometry),
    paths,
  });
}

for (const province of Object.values(provinces)) {
  province.cities.sort((a, b) => String(a.adcode).localeCompare(String(b.adcode), 'zh-CN'));
}

const missing = Object.entries(provinces).filter(([, province]) => !province.cities.length).map(([name]) => name);
if (missing.length) throw new Error(`缺少市界数据：${missing.join('、')}`);

const payload = {
  dataset: 'province-city-boundaries-local-source',
  version: '2026-08-12',
  coordinateSystem: 'WGS84-compatible longitude/latitude',
  sources: [
    { name: 'DataV.GeoAtlas', scope: '中国省级区域的地市/区级边界', url: 'https://atlas.datav.aliyun.com/maptool/tools' },
    { name: 'g0v/twgeojson', scope: '台湾省县市边界', url: 'https://github.com/g0v/twgeojson', license: 'CC0-1.0' },
  ],
  note: '用于省市空间层级表达，不作为测绘、导航或行政区划认定依据。',
  provinces,
};

await writeFile(output, `${JSON.stringify(payload)}\n`, 'utf8');
console.log(`Generated ${Object.keys(provinces).length} provinces and ${Object.values(provinces).reduce((sum, province) => sum + province.cities.length, 0)} city-level regions.`);
