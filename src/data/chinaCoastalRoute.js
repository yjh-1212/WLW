/**
 * 中国沿海散粮/货运近海走廊（WGS84）。
 * 出渤海湾后绕成山角外海，沿黄海—东海—台湾海峡—南海东侧外海南下，
 * 不进入山东半岛、苏浙闽粤陆地。
 */
export const CHINA_COASTAL_CORRIDOR = [
  // 营口港及辽东湾
  [122.22, 40.65],
  [122.08, 40.42],
  [121.62, 40.08],
  [121.18, 39.52],
  [120.92, 38.92],
  // 渤海海峡水道（旅顺—蓬莱之间）
  [121.02, 38.42],
  [121.55, 38.38],
  [122.35, 38.22],
  // 成山角以东外海
  [123.25, 37.95],
  [123.72, 37.48],
  [123.88, 36.85],
  [123.78, 36.05],
  [123.55, 35.05],
  [123.28, 33.85],
  [123.12, 32.55],
  // 长江口以东
  [123.02, 31.45],
  [123.08, 30.35],
  [122.78, 29.15],
  [122.25, 27.75],
  [121.45, 26.45],
  // 台湾海峡中线偏东、福建岸线以东
  [120.55, 25.35],
  [119.72, 24.35],
  [118.95, 23.35],
  [118.25, 22.35],
  [117.15, 21.62],
  // 粤东—珠江口以南外海，绕雷州半岛东侧与东海岛南侧进湛江港。
  // 最后一段从南侧航道进港，避免从东北方向横切东海岛/雷州半岛陆地。
  [115.75, 21.12],
  [114.35, 20.78],
  [113.15, 20.62],
  [112.10, 20.48],
  [111.30, 20.55],
  [111.05, 20.72],
  [110.85, 20.88],
  [110.72, 21.02],
  [110.62, 21.08],
  [110.53, 21.08],
  [110.46, 21.10],
  [110.41, 21.19],
];

const COASTAL_ENTITY_IDS = new Set([
  'OP_YINGKOU_PORT',
  'OP_BOHAI_SHIPPING',
  'OP_TIANJIN_HUB',
  'OP_QINGDAO_PORT',
  'OP_SHANGHAI_PORT',
  'OP_NINGBO_PORT',
  'OP_XIAMEN_PORT',
  'OP_ZHANJIANG_PORT',
  'OP_GBA_CENTER',
]);

const distance2 = (left, right) => {
  const dx = left[0] - right[0];
  const dy = left[1] - right[1];
  return dx * dx + dy * dy;
};

const nearestIndex = (coordinate, corridor = CHINA_COASTAL_CORRIDOR) => {
  let best = 0;
  let bestDistance = Infinity;
  corridor.forEach((point, index) => {
    const current = distance2(point, coordinate);
    if (current < bestDistance) {
      bestDistance = current;
      best = index;
    }
  });
  return best;
};

const densify = (path, maxStep = 0.28) => {
  const rounded = (value) => Number(value.toFixed(5));
  const points = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    points.push(from);
    const span = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const steps = Math.max(1, Math.ceil(span / maxStep));
    for (let step = 1; step < steps; step += 1) {
      const t = step / steps;
      points.push([
        rounded(from[0] + (to[0] - from[0]) * t),
        rounded(from[1] + (to[1] - from[1]) * t),
      ]);
    }
  }
  points.push(path.at(-1));
  return points;
};

export const coastalSegment = (from, to, corridor = CHINA_COASTAL_CORRIDOR) => {
  if (!from || !to) return [];
  const startIndex = nearestIndex(from, corridor);
  const endIndex = nearestIndex(to, corridor);
  const slice = startIndex <= endIndex
    ? corridor.slice(startIndex, endIndex + 1)
    : corridor.slice(endIndex, startIndex + 1).reverse();
  const path = [from, ...slice, to];
  return densify(path.filter((point, index, list) => (
    index === 0 || distance2(point, list[index - 1]) > 1e-8
  )));
};

export const isCoastalEntity = (entity) => Boolean(entity && COASTAL_ENTITY_IDS.has(entity.id));

export const YINGKOU_TO_ZHANJIANG_SEA = coastalSegment([122.22, 40.65], [110.41, 21.19]);
