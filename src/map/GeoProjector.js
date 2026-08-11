import * as THREE from 'three';

export const REFERENCE_MAP = Object.freeze({
  centerX: 720,
  centerY: 584,
  scale: 0.076,
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
    const mapX = 218.546 + ((longitude - 73) / (135 - 73)) * (1221.454 - 218.546);
    const mapY = 1004 - ((latitude - 18) / (54 - 18)) * (1004 - 164);
    return this.fromMapPoint([mapX, mapY], z);
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
