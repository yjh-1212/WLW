import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { MAP_THEME, toNumberColor } from '../theme/mapTheme.js';

export class PenetrationController {
  constructor({ registry, selectionRoot }) {
    this.registry = registry;
    this.root = selectionRoot;
    this.entityId = null;
    this.geometry = new LineGeometry();
    this.material = new LineMaterial({
      color: toNumberColor(MAP_THEME.primary),
      linewidth: 2.2,
      transparent: true,
      opacity: 0.9,
      dashed: true,
      dashSize: 0.65,
      gapSize: 0.42,
      depthTest: false,
    });
    this.line = new Line2(this.geometry, this.material);
    this.line.visible = false;
    this.line.renderOrder = 20;
    this.root.add(this.line);
  }

  activate(entityId) {
    this.clearHighlight();
    this.entityId = entityId;
    this.line.visible = true;
    const references = this.registry.getReferences(entityId);
    Object.values(references).forEach((node) => this.setNodeHighlight(node, true));
    this.update();
  }

  highlightOnly(entityId) {
    this.clearHighlight();
    this.entityId = entityId;
    this.line.visible = false;
    const references = this.registry.getReferences(entityId);
    Object.values(references).forEach((node) => this.setNodeHighlight(node, true));
  }

  clear() {
    this.clearHighlight();
    this.entityId = null;
    this.line.visible = false;
  }

  clearHighlight() {
    if (!this.entityId) return;
    Object.values(this.registry.getReferences(this.entityId)).forEach((node) => this.setNodeHighlight(node, false));
  }

  setNodeHighlight(node, active) {
    node.traverse((object) => {
      if (!object.material?.color) return;
      if (!object.userData.originalColor) object.userData.originalColor = object.material.color.clone();
      object.material.color.copy(active ? new THREE.Color(MAP_THEME.primary) : object.userData.originalColor);
      if ('emissive' in object.material) {
        object.material.emissive.set(active ? MAP_THEME.primary : '#000000');
        object.material.emissiveIntensity = active ? 0.7 : 0.25;
      }
    });
  }

  update() {
    if (!this.entityId || !this.line.visible) return;
    const references = this.registry.getReferences(this.entityId);
    const ordered = ['infrastructure', 'operation', 'digital']
      .map((layer) => references[layer])
      .filter(Boolean)
      .map((node) => node.getWorldPosition(new THREE.Vector3()));
    if (ordered.length < 2) return;
    this.geometry.setPositions(ordered.flatMap((point) => [point.x, point.y, point.z + 1]));
    this.line.computeLineDistances();
  }

  resize(width, height) {
    this.material.resolution.set(width, height);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
