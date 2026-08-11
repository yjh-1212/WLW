import { ApiClient } from './ApiClient.js';
import { demoEntities, demoTasks } from './demoData.js';
import { demoLogisticsStory } from './storyDemoData.js';

const asRecords = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.type === 'FeatureCollection') {
    return payload.features.map((feature) => ({
      ...feature.properties,
      id: feature.id ?? feature.properties?.id,
      geometry: feature.geometry,
      longitude: feature.geometry?.type === 'Point' ? feature.geometry.coordinates[0] : feature.properties?.longitude,
      latitude: feature.geometry?.type === 'Point' ? feature.geometry.coordinates[1] : feature.properties?.latitude,
    }));
  }
  return [];
};

const normalizeEntity = (entity) => ({
  coordinate_system: 'WGS84',
  source_type: 'api',
  source_ref: 'api://map/entities',
  verified_status: 'unverified',
  province: '—',
  ...entity,
  infrastructure: { level: '物流节点', lines: 0, capacity: '—', status: '待同步', ...entity.infrastructure },
  operation: { throughput: '—', tasks: 0, load: 0, status: '待同步', ...entity.operation },
  digital: { connectors: 0, resources: 0, apiHealth: 0, latestEvent: '暂无事件', ...entity.digital },
});

const normalizeRoute = (route) => ({
  id: route.id ?? route.code,
  name: route.name ?? route.title ?? '未命名线路',
  type: ({ A: 'axis', C: 'corridor', T: 'channel', axes: 'axis', corridors: 'corridor', channels: 'channel' })[route.type ?? route.routeType ?? route.category]
    ?? route.type ?? route.routeType ?? route.category,
  path: route.path,
  geometry: route.geometry,
});

export class LayerDataManager extends EventTarget {
  constructor() {
    super();
    this.mode = import.meta.env.VITE_DATA_MODE ?? 'demo';
    this.api = new ApiClient({
      baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
      timeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT ?? 8000),
    });
    this.source = 'demo';
    this.ws = null;
  }

  async loadInitial() {
    const routesPromise = fetch('/data/backbone-routes.json').then((response) => {
      if (!response.ok) throw new Error('战略线路资源加载失败');
      return response.json();
    });
    if (this.mode !== 'api') {
      const routes = await routesPromise;
      return { routes: routes.routes, entities: demoEntities, tasks: demoTasks, source: 'demo' };
    }

    try {
      const [routesFallback, entitiesResult, corridorsResult] = await Promise.all([
        routesPromise,
        this.api.get('/map/entities', { bbox: '73,18,135,54', types: 'hub,port,park', lod: 0 }),
        this.api.get('/map/corridors'),
      ]);
      const entityPayload = asRecords(entitiesResult.data ?? entitiesResult.entities ?? entitiesResult);
      const routePayload = asRecords(corridorsResult.data ?? corridorsResult.routes ?? corridorsResult);
      const entities = entityPayload.length ? entityPayload.map(normalizeEntity) : demoEntities;
      const routes = routePayload.length ? routePayload.map(normalizeRoute).filter((route) => route.id && route.type) : routesFallback.routes;
      this.source = 'api';
      this.connectRealtime();
      return { routes, entities, tasks: demoTasks, source: 'api' };
    } catch (error) {
      console.warn('真实数据接口暂不可用，已回退示例数据。', error);
      const routes = await routesPromise;
      this.source = 'demo-fallback';
      this.dispatchEvent(new CustomEvent('degraded', { detail: { error } }));
      return { routes: routes.routes, entities: demoEntities, tasks: demoTasks, source: 'demo-fallback' };
    }
  }

  async loadPenetration(entityId) {
    if (this.mode === 'api') {
      try { return await this.api.get(`/entities/${encodeURIComponent(entityId)}/penetration`); } catch { /* demo fallback */ }
    }
    return demoEntities.find((entity) => entity.id === entityId) ?? null;
  }

  async loadTaskTrace(taskId) {
    if (this.mode === 'api') {
      try { return await this.api.get(`/tasks/${encodeURIComponent(taskId)}/trace`); } catch { /* demo fallback */ }
    }
    return demoTasks.find((task) => task.id === taskId) ?? null;
  }

  async loadStory(storyId = demoLogisticsStory.id) {
    if (this.mode === 'api') {
      try {
        const payload = await this.api.get(`/stories/${encodeURIComponent(storyId)}/timeline`);
        const story = payload.story ?? payload.data ?? payload;
        if (story?.stages?.length && story?.shipment) return story;
      } catch { /* demo fallback */ }
    }
    return structuredClone(demoLogisticsStory);
  }

  connectRealtime() {
    const url = import.meta.env.VITE_WS_URL;
    if (!url || this.ws) return;
    const resolved = url.startsWith('ws') ? url : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${url}`;
    try {
      this.ws = new WebSocket(resolved);
      this.ws.addEventListener('message', (event) => {
        try { this.dispatchEvent(new CustomEvent('realtime', { detail: JSON.parse(event.data) })); } catch { /* ignore malformed delta */ }
      });
      this.ws.addEventListener('close', () => this.dispatchEvent(new CustomEvent('paused')));
    } catch {
      this.dispatchEvent(new CustomEvent('paused'));
    }
  }

  dispose() {
    this.api.cancelAll();
    this.ws?.close();
  }
}
