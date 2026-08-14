import * as THREE from 'three';

export class InteractionManager {
  constructor(runtime) {
    this.runtime = runtime;
    this.canvas = runtime.renderer.domElement;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 0.85;
    this.pointer = new THREE.Vector2();
    this.pointerDown = null;
    this.suppressOrbit = false;
    this.hoveredEntity = null;
    this.hoveredRoute = null;
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerdown', this.onPointerDown, true);
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
    if (nodeHit) {
      if (nodeHit.object.userData.kind === 'sandbox-node') {
        return { kind: 'sandbox-node', object: nodeHit.object, cityId: nodeHit.object.userData.cityId, city: nodeHit.object.userData.city };
      }
      if (nodeHit.object.userData.kind === 'infra-city') {
        return { kind: 'sandbox-city', object: nodeHit.object, cityName: nodeHit.object.userData.city?.name ?? nodeHit.object.userData.city };
      }
      if (nodeHit.object.userData.kind === 'sandbox-city') {
        return { kind: 'sandbox-city', object: nodeHit.object, cityName: nodeHit.object.userData.city };
      }
      return { kind: 'entity', object: nodeHit.object, entityId: nodeHit.object.userData.entityId };
    }
    const facilityHit = this.raycaster.intersectObjects(this.runtime.getInteractiveFacilityObjects(), false)[0];
    if (facilityHit) {
      const feature = facilityHit.object.userData.features?.[facilityHit.index];
      if (feature) return { kind: 'facility', object: facilityHit.object, feature };
    }
    const routeHit = this.raycaster.intersectObjects(this.runtime.getInteractiveRouteObjects(), false)[0];
    if (routeHit) {
      if (routeHit.object.userData.kind === 'sandbox-flow') {
        return { kind: 'sandbox-flow', object: routeHit.object, flowId: routeHit.object.userData.flowId, flow: routeHit.object.userData.flow };
      }
      return { kind: 'route', object: routeHit.object, routeId: routeHit.object.userData.routeId };
    }
    const cityFillHit = this.raycaster.intersectObjects(this.runtime.provinceDrilldown?.getSandboxCityMeshes?.() ?? [], false)[0];
    if (cityFillHit) {
      return { kind: 'sandbox-city', object: cityFillHit.object, cityName: cityFillHit.object.userData.city };
    }
    const provinceHit = this.raycaster.intersectObjects(this.runtime.getInteractiveProvinceMeshes(), false)[0];
    if (provinceHit) return { kind: 'province', object: provinceHit.object, provinceName: provinceHit.object.userData.name };
    return null;
  }

  onPointerMove(event) {
    // 首页开场演出期间不做拾取，避免在地球阶段命中尚未显影的地图要素。
    if (this.runtime.homeIntro?.active) return;
    if (this.pointerDown && !this.suppressOrbit) {
      const drag = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
      if (drag > 6) this.runtime.beginUserCamera?.();
    }
    this.updatePointer(event);
    const hit = this.pick();
    if (this.runtime.provinceOperationView) {
      this.canvas.style.cursor = hit ? 'pointer' : 'grab';
      let cityId = hit?.kind === 'sandbox-node' ? hit.cityId : null;
      let cityName = hit?.kind === 'sandbox-city' ? hit.cityName : null;
      const flowId = hit?.kind === 'sandbox-flow' ? hit.flowId : null;
      if (!cityId && cityName) {
        const city = this.runtime.layers.operation?.findSandboxCityByName?.(cityName);
        cityId = city?.id ?? null;
      }
      if (hit?.kind === 'sandbox-node') cityName = hit.city?.fullName ?? hit.city?.name;
      this.runtime.layers.operation?.setSandboxHover?.({ cityId, flowId });
      this.runtime.provinceDrilldown?.setHoveredCity?.(flowId ? null : cityName);
      const info = this.runtime.layers.operation?.getSandboxHoverInfo?.();
      if (info) this.runtime.ui.showTooltip(event.clientX, event.clientY, info.title, info.subtitle);
      else this.runtime.ui.hideTooltip();
      return;
    }
    if (this.runtime.provinceInfrastructureView) {
      const cityName = hit?.kind === 'sandbox-city' ? hit.cityName : null;
      this.runtime.provinceDrilldown?.setHoveredCity?.(cityName);
      const city = hit?.object?.userData?.city;
      if (city?.name) {
        this.runtime.ui.showTooltip(event.clientX, event.clientY, city.name, city.role ?? `${this.runtime.selectedProvince ?? ''}物流节点`);
        this.canvas.style.cursor = 'pointer';
        return;
      }
    } else {
      this.runtime.provinceDrilldown?.setHoveredCity?.(null);
    }
    const entityId = hit?.kind === 'entity' ? hit.entityId : null;
    const routeId = hit?.kind === 'route' ? hit.routeId : null;
    const facility = hit?.kind === 'facility' ? hit.feature : null;
    const provinceName = hit?.kind === 'province' ? hit.provinceName : null;
    this.hoveredEntity = entityId;
    this.hoveredRoute = routeId;
    this.runtime.hoverProvince(provinceName);
    this.canvas.style.cursor = hit ? 'pointer' : 'grab';
    const provinceDigitalNode = entityId ? this.runtime.getProvinceDigitalNode?.(entityId) : null;
    if (provinceDigitalNode) {
      const metrics = provinceDigitalNode.metrics ?? {};
      this.runtime.ui.showTooltip(
        event.clientX,
        event.clientY,
        provinceDigitalNode.name,
        `接入企业 ${metrics.entities ?? 0} 家 · 今日调用 ${metrics.calls ?? 0} 万次`,
      );
    } else if (entityId) {
      const entity = this.runtime.registry.get(entityId);
      const isOperationNode = this.runtime.stateMachine.state === 'FOCUS_OPERATION' && entity?.networkRole;
      const subtitle = isOperationNode
        ? `发运 ${entity.operation.throughput} · 在途 ${Number(entity.operation.tasks).toLocaleString('zh-CN')} 单 · 活跃 ${entity.operation.activity} · 负载 ${entity.operation.load}%`
        : `${entity.type.toUpperCase()} · ${entity.province}`;
      this.runtime.ui.showTooltip(event.clientX, event.clientY, entity.name, subtitle);
    } else if (routeId) {
      const route = this.runtime.data.routes.find((item) => item.id === routeId);
      if (route) this.runtime.ui.showTooltip(event.clientX, event.clientY, route.name, `${route.id} · ${route.type.toUpperCase()}`);
    } else if (facility) {
      this.runtime.ui.showTooltip(event.clientX, event.clientY, facility.name, `${facility.category} · ${facility.province}`);
    } else if (hit?.kind === 'sandbox-city') {
      this.runtime.ui.showTooltip(event.clientX, event.clientY, hit.cityName, `${this.runtime.selectedProvince ?? ''}地市节点`);
    } else if (provinceName) {
      const summary = this.runtime.getProvinceSummary(provinceName);
      const state = this.runtime.stateMachine.state;
      const subtitle = state === 'FOCUS_OPERATION'
        ? `查看${provinceName}运行态势`
        : state === 'FOCUS_INFRA'
          ? `查看${provinceName}基础设施`
          : `进入省级物流平台 · ${summary?.cityCount ?? 0} 个地市`;
      this.runtime.ui.showTooltip(event.clientX, event.clientY, provinceName, subtitle);
    } else {
      this.runtime.ui.hideTooltip();
    }
  }

  onPointerDown(event) {
    // 开场演出中的第一次点击只用于结束演出，不触发选中。
    if (this.runtime.homeIntro?.active) {
      this.runtime.abortHomeIntro?.();
      return;
    }
    this.pointerDown = { x: event.clientX, y: event.clientY };
    this.updatePointer(event);
    const hit = this.pick();
    this.suppressOrbit = Boolean(hit && (
      hit.kind === 'province' || hit.kind === 'entity' || hit.kind === 'facility' || hit.kind === 'route'
      || hit.kind === 'sandbox-city' || hit.kind === 'sandbox-node' || hit.kind === 'sandbox-flow'
    ));
    if (this.suppressOrbit && !this.runtime.cameraDirector?.programmatic) this.runtime.controls.enabled = false;
  }

  onPointerUp(event) {
    if (this.suppressOrbit && !this.runtime.cameraDirector?.programmatic) this.runtime.controls.enabled = true;
    this.suppressOrbit = false;
    if (!this.pointerDown) return;
    const distance = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
    this.pointerDown = null;
    if (distance > 6) return;
    this.updatePointer(event);
    const hit = this.pick();
    if (hit?.kind === 'sandbox-node' || hit?.kind === 'sandbox-city' || hit?.kind === 'sandbox-flow') return;
    if (hit?.kind === 'entity') {
      this.runtime.selectEntity(hit.entityId);
    }
    if (hit?.kind === 'facility') this.runtime.selectInfrastructureFeature(hit.feature);
    if (hit?.kind === 'route') this.runtime.focusRoute(hit.routeId);
    if (hit?.kind === 'province') {
      if (this.runtime.selectedProvince === hit.provinceName) return;
      this.runtime.drillProvince(hit.provinceName);
    }
  }

  onDoubleClick(event) {
    this.updatePointer(event);
    if (!this.pick()) this.runtime.returnFromProvince();
  }

  onKeyDown(event) {
    if (event.key === 'Escape') this.runtime.handleEscape();
  }

  dispose() {
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown, true);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('dblclick', this.onDoubleClick);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}
