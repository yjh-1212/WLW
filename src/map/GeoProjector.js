import * as THREE from 'three';

export const REFERENCE_MAP = Object.freeze({
  centerX: 720,
  centerY: 584,
  scale: 0.076,
});

// The reference SVG uses a conic China projection rather than a rectangular
// longitude/latitude stretch. This Lambert conformal calibration is fitted to
// the SVG's explicit city anchors (Harbin, Urumqi, Xi'an, Wuhan, Kunming,
// Nanning and Lhasa). Region labels such as "Jing-Jin-Ji" are intentionally not
// used as city anchors because their symbols mark a regional center.
const SVG_GEO_CALIBRATION = Object.freeze({
  centralMeridian: 104.82,
  standardParallel: 36.84,
  scale: 1301.79671,
  translateX: 761.189819,
  translateY: -1161.397665,
});

export class GeoProjector {
  constructor(config = REFERENCE_MAP) {
    this.config = config;
  }

  fromMapPoint(point, z = 0) {
    const [x, y] = point;
    return new THREE.Vector3(
      (x - this.config.centerX) * this.config.scale,
      (this.config.centerY - y) * this.config.scale,
      z,
    );
  }

  fromLngLat(coordinate, z = 0) {
    const [longitude, latitude] = coordinate;
    return this.fromMapPoint(this.referencePointFromLngLat([longitude, latitude]), z);
  }

  referencePointFromLngLat(coordinate) {
    const [longitude, latitude] = coordinate.map(Number);
    const calibration = SVG_GEO_CALIBRATION;
    const radians = Math.PI / 180;
    const standardParallel = calibration.standardParallel * radians;
    const phi = latitude * radians;
    const thetaOffset = (longitude - calibration.centralMeridian) * radians;
    const n = Math.sin(standardParallel);
    const f = Math.cos(standardParallel) * (Math.tan(Math.PI / 4 + standardParallel / 2) ** n) / n;
    const rho = f / (Math.tan(Math.PI / 4 + phi / 2) ** n);
    const theta = n * thetaOffset;
    return [
      calibration.translateX + calibration.scale * rho * Math.sin(theta),
      calibration.translateY + calibration.scale * rho * Math.cos(theta),
    ];
  }

  fromEntity(entity, z = 0) {
    // 经纬度是实体位置的唯一事实来源；mapPoint 仅保留为旧数据兼容回退。
    if (Number.isFinite(Number(entity.longitude)) && Number.isFinite(Number(entity.latitude))) {
      return this.fromLngLat([Number(entity.longitude), Number(entity.latitude)], z);
    }
    return this.fromMapPoint(entity.mapPoint, z);
  }

  parseReferencePath(path, z = 0) {
    const values = [...path.matchAll(/[-+]?\d*\.?\d+/g)].map((item) => Number(item[0]));
    const points = [];
    for (let index = 0; index < values.length - 1; index += 2) {
      points.push(this.fromMapPoint([values[index], values[index + 1]], z));
    }
    return points;
  }

  routeSegments(route, z = 0) {
    if (route.path) return [this.parseReferencePath(route.path, z)];
    const geometry = route.geometry?.type === 'Feature' ? route.geometry.geometry : route.geometry;
    if (!geometry) return [];
    const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.type === 'MultiLineString' ? geometry.coordinates : [];
    return lines.map((coordinates) => coordinates.map((coordinate) => this.fromLngLat(coordinate, z)));
  }
}
