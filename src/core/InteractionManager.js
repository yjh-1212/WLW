import * as THREE from 'three';

export class InteractionManager {
  constructor(runtime) {
    this.runtime = runtime;
    this.canvas = runtime.renderer.domElement;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDown = null;
    this.hoveredEntity = null;
    this.hoveredRoute = null;
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('dblclick', this.onDoubleClick);
    window.addEventListener('keydown', this.onKeyDown);
  }

  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.runtime.camera);
  }

  pick() {
    const nodeHit = this.raycaster.intersectObjects(this.runtime.getInteractiveNodeMeshes(), false)[0];
    if (nodeHit) return { kind: 'entity', object: nodeHit.object, entityId: nodeHit.object.userData.entityId };
    const routeHit = this.raycaster.intersectObjects(this.runtime.getInteractiveRouteObjects(), false)[0];
    if (routeHit) return { kind: 'route', object: routeHit.object, routeId: routeHit.object.userData.routeId };
    return null;
  }

  onPointerMove(event) {
    this.updatePointer(event);
    const hit = this.pick();
    const entityId = hit?.kind === 'entity' ? hit.entityId : null;
    const routeId = hit?.kind === 'route' ? hit.routeId : null;
    this.hoveredEntity = entityId;
    this.hoveredRoute = routeId;
    this.canvas.style.cursor = hit ? 'pointer' : 'grab';
    if (entityId) {
      const entity = this.runtime.registry.get(entityId);
      this.runtime.ui.showTooltip(event.clientX, event.clientY, entity.name, `${entity.type.toUpperCase()} · ${entity.province}`);
    } else if (routeId) {
      const route = this.runtime.data.routes.find((item) => item.id === routeId);
      if (route) this.runtime.ui.showTooltip(event.clientX, event.clientY, route.name, `${route.id} · ${route.type.toUpperCase()}`);
    } else {
      this.runtime.ui.hideTooltip();
    }
  }

  onPointerDown(event) {
    this.pointerDown = { x: event.clientX, y: event.clientY };
  }

  onPointerUp(event) {
    if (!this.pointerDown) return;
    const distance = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
    this.pointerDown = null;
    if (distance > 6) return;
    this.updatePointer(event);
    const hit = this.pick();
    if (hit?.kind === 'entity') this.runtime.selectEntity(hit.entityId);
    if (hit?.kind === 'route') this.runtime.focusRoute(hit.routeId);
  }

  onDoubleClick(event) {
    this.updatePointer(event);
    if (!this.pick()) this.runtime.resetView();
  }

  onKeyDown(event) {
    if (event.key === 'Escape') this.runtime.handleEscape();
  }

  dispose() {
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('dblclick', this.onDoubleClick);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}
