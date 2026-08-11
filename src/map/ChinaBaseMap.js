import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { MAP_THEME, toNumberColor } from '../theme/mapTheme.js';
import { REFERENCE_MAP } from './GeoProjector.js';

export class ChinaBaseMap {
  constructor() {
    this.definitions = [];
    this.sheets = [];
  }

  async load(url = '/data/china-provinces.svg') {
    const data = await new SVGLoader().loadAsync(url);
    this.definitions = data.paths.flatMap((path, pathIndex) => {
      const name = path.userData?.node?.getAttribute('data-name')
        ?? path.userData?.node?.querySelector?.('title')?.textContent
        ?? `省级区域 ${pathIndex + 1}`;
      return SVGLoader.createShapes(path).map((shape, shapeIndex) => {
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
        emissiveIntensity: role === 'base' ? 0.16 : 0.30,
        metalness: role === 'base' ? 0.06 : 0.18,
        roughness: role === 'base' ? 0.84 : 0.58,
        transparent: opacity < 1,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: opacity > 0.32,
      });
      const mesh = new THREE.Mesh(definition.geometry, material);
      mesh.name = definition.key;
      mesh.userData.kind = 'province';
      mesh.userData.name = definition.name;
      mesh.userData.sheet = role;
      provinceGroups.get(definition.name).add(mesh);

      const edgeGeometry = new THREE.EdgesGeometry(definition.geometry, 34);
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

  setSheetOpacity(sheet, opacity) {
    sheet.userData.materials.forEach((material) => {
      const adjustedOpacity = opacity * (material.userData.opacityFactor ?? 1);
      material.opacity = adjustedOpacity;
      material.transparent = adjustedOpacity < 0.99;
      material.depthWrite = material.isMeshStandardMaterial && adjustedOpacity > 0.32;
    });
  }

  setProvinceState(name, { hovered = false, selected = false } = {}) {
    this.sheets.forEach((sheet) => {
      const province = sheet.userData.provinces.get(name);
      if (!province) return;
      province.children.forEach((object) => {
        if (object.userData.kind === 'province-outline') {
          object.material.color.set(selected ? MAP_THEME.primary : hovered ? MAP_THEME.primarySoft : this.outlineForRole(sheet.userData.role));
          return;
        }
        object.material.color.set(selected ? MAP_THEME.primary : hovered ? MAP_THEME.mapBright : this.colorForRole(sheet.userData.role));
        object.material.emissive.set(selected ? MAP_THEME.primary : this.emissiveForRole(sheet.userData.role));
        object.material.emissiveIntensity = selected ? 0.48 : hovered ? 0.38 : (sheet.userData.role === 'base' ? 0.16 : 0.30);
      });
      province.position.z = selected ? 1.2 : hovered ? 0.5 : 0;
    });
  }

  getProvinceBounds(name, sheet = this.sheets[0]) {
    const province = sheet?.userData.provinces.get(name);
    if (!province) return null;
    return new THREE.Box3().setFromObject(province);
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
