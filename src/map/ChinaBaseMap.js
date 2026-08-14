import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { MAP_THEME, toNumberColor } from '../theme/mapTheme.js';
import { REFERENCE_MAP } from './GeoProjector.js';

function toWorldRing(points) {
  return points.map((point) => ([
    point.x * REFERENCE_MAP.scale - REFERENCE_MAP.centerX * REFERENCE_MAP.scale,
    -point.y * REFERENCE_MAP.scale + REFERENCE_MAP.centerY * REFERENCE_MAP.scale,
  ]));
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const currentX = ring[index][0];
    const currentY = ring[index][1];
    const previousX = ring[previous][0];
    const previousY = ring[previous][1];
    const crosses = (currentY > y) !== (previousY > y);
    if (!crosses) continue;
    const atX = ((previousX - currentX) * (y - currentY)) / ((previousY - currentY) || Number.EPSILON) + currentX;
    if (x < atX) inside = !inside;
  }
  return inside;
}

function createTopSurfaceEdges(geometry) {
  const allEdges = new THREE.EdgesGeometry(geometry, 34);
  const source = allEdges.getAttribute('position');
  const topZ = geometry.boundingBox?.max.z ?? 0;
  const positions = [];
  for (let index = 0; index < source.count; index += 2) {
    const firstZ = source.getZ(index);
    const secondZ = source.getZ(index + 1);
    if (Math.abs(firstZ - topZ) > 0.015 || Math.abs(secondZ - topZ) > 0.015) continue;
    positions.push(
      source.getX(index), source.getY(index), firstZ,
      source.getX(index + 1), source.getY(index + 1), secondZ,
    );
  }
  allEdges.dispose();
  const topEdges = new THREE.BufferGeometry();
  topEdges.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return topEdges;
}

export class ChinaBaseMap {
  constructor() {
    this.definitions = [];
    this.sheets = [];
    this.provinceRings = new Map();
    this.focusedProvince = null;
    this.sandboxFocus = false;
  }

  async load(url = '/data/china-provinces.svg') {
    const data = await new SVGLoader().loadAsync(url);
    this.provinceRings = new Map();
    this.definitions = data.paths.flatMap((path, pathIndex) => {
      const name = path.userData?.node?.getAttribute('data-name')
        ?? path.userData?.node?.querySelector?.('title')?.textContent
        ?? `省级区域 ${pathIndex + 1}`;
      return SVGLoader.createShapes(path).map((shape, shapeIndex) => {
        const rings = this.provinceRings.get(name) ?? [];
        const outer = toWorldRing(shape.getPoints());
        if (outer.length >= 3) {
          rings.push({
            outer,
            holes: (shape.holes ?? []).map((hole) => toWorldRing(hole.getPoints())).filter((ring) => ring.length >= 3),
          });
          this.provinceRings.set(name, rings);
        }
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 1.08,
          bevelEnabled: true,
          bevelSegments: 1,
          steps: 1,
          bevelSize: 0.12,
          bevelThickness: 0.11,
          curveSegments: 1,
        });
        geometry.scale(REFERENCE_MAP.scale, -REFERENCE_MAP.scale, 1);
        geometry.translate(
          -REFERENCE_MAP.centerX * REFERENCE_MAP.scale,
          REFERENCE_MAP.centerY * REFERENCE_MAP.scale,
          0,
        );
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        return { name, geometry, key: `${name}-${shapeIndex}` };
      });
    });
    return this;
  }

  createSheet({ name, color = MAP_THEME.map, opacity = 1, role = 'base' } = {}) {
    const root = new THREE.Group();
    root.name = name ?? `${role}-map-sheet`;
    root.userData.role = role;
    root.userData.baseOpacity = opacity;
    root.userData.provinces = new Map();
    root.userData.materials = [];
    root.userData.meshes = [];
    root.userData.edgeGeometries = [];

    const provinceGroups = new Map();
    this.definitions.forEach((definition) => {
      if (!provinceGroups.has(definition.name)) {
        const province = new THREE.Group();
        province.name = definition.name;
        province.userData.kind = 'province';
        province.userData.name = definition.name;
        provinceGroups.set(definition.name, province);
        root.userData.provinces.set(definition.name, province);
        root.add(province);
      }
      const material = new THREE.MeshStandardMaterial({
        color: toNumberColor(color),
        emissive: toNumberColor(this.emissiveForRole(role)),
        emissiveIntensity: role === 'base' ? 0.22 : 0.38,
        metalness: role === 'base' ? 0.06 : 0.18,
        roughness: role === 'base' ? 0.84 : 0.58,
        transparent: opacity < 1,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: opacity > 0.32,
      });
      material.userData.baseEmissiveIntensity = material.emissiveIntensity;
      material.userData.baseMetalness = material.metalness;
      material.userData.baseRoughness = material.roughness;
      material.userData.baseSide = material.side;
      material.userData.baseBlending = material.blending;
      const mesh = new THREE.Mesh(definition.geometry, material);
      mesh.name = definition.key;
      mesh.userData.kind = 'province';
      mesh.userData.name = definition.name;
      mesh.userData.sheet = role;
      provinceGroups.get(definition.name).add(mesh);

      // Only draw the upper province outline. Full ExtrudeGeometry edges also
      // include every vertical vertex and turn an oblique map into a picket
      // fence when the user zooms in.
      const edgeGeometry = createTopSurfaceEdges(definition.geometry);
      const edgeOpacity = opacity * (role === 'base' ? 0.78 : 0.95);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: toNumberColor(this.outlineForRole(role)),
        transparent: true,
        opacity: edgeOpacity,
        depthWrite: false,
      });
      edgeMaterial.userData.opacityFactor = role === 'base' ? 0.78 : 0.95;
      const outline = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      outline.name = `${definition.key}-outline`;
      outline.userData.kind = 'province-outline';
      outline.userData.name = definition.name;
      outline.renderOrder = 2;
      provinceGroups.get(definition.name).add(outline);

      root.userData.materials.push(material);
      root.userData.materials.push(edgeMaterial);
      root.userData.meshes.push(mesh);
      root.userData.edgeGeometries.push(edgeGeometry);
    });
    this.sheets.push(root);
    return root;
  }

  setSheetOpacity(sheet, opacity, { solid = false } = {}) {
    sheet.userData.materials.forEach((material) => {
      const adjustedOpacity = solid ? 1 : opacity * (material.userData.opacityFactor ?? 1);
      material.opacity = adjustedOpacity;
      material.transparent = !solid && adjustedOpacity < 0.99;
      material.depthTest = true;
      material.depthWrite = material.isMeshStandardMaterial && (solid || adjustedOpacity > 0.32);
      if (material.isMeshStandardMaterial) {
        material.side = solid ? THREE.FrontSide : material.userData.baseSide;
        material.blending = solid ? THREE.NoBlending : material.userData.baseBlending;
        material.alphaTest = 0;
        material.premultipliedAlpha = false;
        material.emissiveIntensity = solid ? 0.32 : material.userData.baseEmissiveIntensity;
        material.metalness = solid ? 0.08 : material.userData.baseMetalness;
        material.roughness = solid ? 0.76 : material.userData.baseRoughness;
        const sandbox = this.sandboxFocus ? this.sandboxPalette(sheet.userData.role) : null;
        if (sandbox && material.isMeshStandardMaterial) {
          material.color.set(toNumberColor(sandbox.surface));
          material.emissive.set(toNumberColor(sandbox.glow));
          material.emissiveIntensity = 0.34;
          material.metalness = 0.08;
          material.roughness = 0.72;
        }
      }
      material.needsUpdate = true;
    });
  }

  setProvinceState(name, { hovered = false, selected = false } = {}) {
    this.sheets.forEach((sheet) => {
      const province = sheet.userData.provinces.get(name);
      if (!province) return;
      const role = sheet.userData.role;
      const selectedSurface = role === 'base' ? MAP_THEME.primary : this.colorForRole(role);
      const selectedOutline = role === 'base' ? MAP_THEME.primary : this.outlineForRole(role);
      const selectedEmissive = role === 'base' ? MAP_THEME.primary : this.outlineForRole(role);
      const sandbox = this.sandboxFocus && selected ? this.sandboxPalette(role) : null;
      province.children.forEach((object) => {
        if (object.userData.kind === 'province-outline') {
          object.material.color.set(
            sandbox
              ? sandbox.bright
              : selected ? selectedOutline : hovered ? MAP_THEME.primarySoft : this.outlineForRole(role),
          );
          if (this.sandboxFocus && selected) object.material.opacity = 0.78;
          return;
        }
        if (!object.material) return;
        if (sandbox) {
          object.material.color.set(toNumberColor(sandbox.surface));
          object.material.emissive?.set(toNumberColor(sandbox.glow));
          object.material.emissiveIntensity = 0.34;
          return;
        }
        object.material.color.set(selected ? selectedSurface : hovered ? MAP_THEME.mapBright : this.colorForRole(role));
        object.material.emissive.set(selected ? selectedEmissive : this.emissiveForRole(role));
        object.material.emissiveIntensity = selected ? (role === 'base' ? 0.48 : 0.62) : hovered ? 0.42 : (role === 'base' ? 0.22 : 0.38);
      });
      province.position.z = selected ? 1.2 : hovered ? 0.5 : 0;
      if (this.sandboxFocus && selected) province.position.z = 0.92;
    });
  }

  setProvinceFocus(name = null, { sandbox = false } = {}) {
    this.focusedProvince = name || null;
    this.sandboxFocus = Boolean(name) && sandbox;
    this.sheets.forEach((sheet) => {
      sheet.userData.provinces.forEach((province, provinceName) => {
        province.visible = !this.focusedProvince || provinceName === this.focusedProvince;
      });
    });
    this.definitions.forEach(({ name: provinceName }) => {
      this.setProvinceState(provinceName, { selected: provinceName === this.focusedProvince });
    });
  }

  getInteractiveProvinceMeshes(activeSheet = null) {
    if (this.focusedProvince) return [];
    const sheets = activeSheet ? [activeSheet] : this.sheets;
    return sheets.flatMap((sheet) => sheet?.userData?.meshes?.filter(
      (mesh) => mesh.visible && mesh.parent?.visible && sheet.visible,
    ) ?? []);
  }

  getProvinceBounds(name, sheet = this.sheets[0]) {
    const province = sheet?.userData.provinces.get(name);
    if (!province) return null;
    const box = new THREE.Box3();
    let found = false;
    province.children.forEach((child) => {
      if (child.userData?.kind !== 'province') return;
      box.expandByObject(child);
      found = true;
    });
    return found ? box : new THREE.Box3().setFromObject(province);
  }

  containsProvincePoint(name, x, y) {
    const shapes = (this.provinceRings.get(name) ?? []).filter((shape) => shape.outer.length >= 3);
    if (shapes?.length) {
      return shapes.some((shape) => pointInRing(x, y, shape.outer)
        && shape.holes.every((hole) => !pointInRing(x, y, hole)));
    }
    const bounds = this.getProvinceBounds(name);
    if (!bounds) return false;
    return x >= bounds.min.x && x <= bounds.max.x && y >= bounds.min.y && y <= bounds.max.y;
  }

  sandboxPalette(role) {
    if (role === 'infrastructure') {
      return { surface: MAP_THEME.infrastructureSurface, bright: MAP_THEME.infrastructureBright, glow: MAP_THEME.infrastructure };
    }
    if (role === 'operation') {
      return { surface: MAP_THEME.operationSurface, bright: MAP_THEME.operationBright, glow: MAP_THEME.operation };
    }
    return null;
  }

  colorForRole(role) {
    if (role === 'infrastructure') return MAP_THEME.infrastructureSurface;
    if (role === 'operation') return MAP_THEME.operationSurface;
    if (role === 'digital') return MAP_THEME.digitalSurface;
    return MAP_THEME.map;
  }

  outlineForRole(role) {
    if (role === 'infrastructure') return MAP_THEME.infrastructureBright;
    if (role === 'operation') return MAP_THEME.operationBright;
    if (role === 'digital') return MAP_THEME.digitalBright;
    return MAP_THEME.mapOutline;
  }

  emissiveForRole(role) {
    if (role === 'infrastructure') return MAP_THEME.infrastructureSide;
    if (role === 'operation') return MAP_THEME.operationSide;
    if (role === 'digital') return MAP_THEME.digitalSide;
    return MAP_THEME.surfaceRaised;
  }

  dispose() {
    this.definitions.forEach(({ geometry }) => geometry.dispose());
    this.sheets.forEach((sheet) => {
      sheet.userData.edgeGeometries.forEach((geometry) => geometry.dispose());
      sheet.userData.materials.forEach((material) => material.dispose());
    });
  }
}
