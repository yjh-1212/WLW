/**
 * 中国沿海散粮/货运近海走廊（WGS84）。
 * 出渤海湾后绕成山角外海，沿黄海—东海—台湾海峡—南海东侧外海南下，
 * 不进入山东半岛、苏浙闽粤陆地。
 */
export const YINGKOU_SEA_BERTH = Object.freeze([122.14, 40.65]);
export const ZHANJIANG_SEA_BERTH = Object.freeze([110.46, 21.10]);

export const CHINA_COASTAL_CORRIDOR = [
  // 营口港及辽东湾
  YINGKOU_SEA_BERTH,
  [122.08, 40.42],
  [121.62, 40.08],
  [121.18, 39.52],
  [120.92, 38.92],
  // 渤海海峡中部水道（旅顺—蓬莱之间），随后向东拉开与山东半岛的距离
  [121.02, 38.42],
  [121.85, 38.68],
  [123.05, 38.78],
  [124.35, 38.45],
  // 成山角以东外海，额外留出一整段可见海面，避免线宽/透视下仍像压住山东半岛
  [125.15, 37.75],
  [125.45, 36.80],
  [125.35, 35.80],
  [125.10, 34.75],
  [124.80, 33.70],
  [124.55, 32.55],
  // 长江口以东
  [124.25, 31.45],
  [124.00, 30.35],
  [123.55, 29.15],
  [123.20, 28.00],
  [122.70, 26.90],
  // 台湾海峡中部：东离宁德—福州—平潭，西不过台湾岛西北岸与澎湖
  [122.20, 26.20],
  [121.35, 25.55],
  [120.85, 25.00],
  [120.45, 24.40],
  [120.10, 23.70],
  [119.50, 22.90],
  [118.60, 22.20],
  [117.50, 21.50],
  // 粤东—珠江口以南保持近海弧线，绕雷州半岛东侧与东海岛南侧进湛江港。
  [116.50, 20.70],
  [115.20, 19.95],
  [113.65, 19.85],
  [112.35, 19.85],
  [111.45, 20.00],
  // 最后一段从南侧航道进港，避免从东北方向横切东海岛/雷州半岛陆地。
  [111.10, 20.25],
  [111.05, 20.72],
  [110.85, 20.88],
  [110.72, 21.02],
  [110.62, 21.08],
  [110.53, 21.08],
  ZHANJIANG_SEA_BERTH,
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

export const YINGKOU_TO_ZHANJIANG_SEA = coastalSegment(YINGKOU_SEA_BERTH, ZHANJIANG_SEA_BERTH);
