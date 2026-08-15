/**
 * Unified stroke-rounded SVG icon set for the exploded synergy cockpit.
 * Vanilla JS (no Vue) — icons are inline SVG so color/glow stay CSS-driven.
 */

const ATTR = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

const PATHS = {
  // Core layer semantics
  cloudDatabase: `
    <path ${ATTR} d="M7.4 17.2h9.4a3.4 3.4 0 0 0 .4-6.78 5.1 5.1 0 0 0-9.7-1.3A3.7 3.7 0 0 0 7.4 17.2z"/>
    <rect ${ATTR} x="8.2" y="14.4" width="7.6" height="5.2" rx="1.1"/>
    <path ${ATTR} d="M10.2 16.2h3.6M10.2 17.8h2.4"/>`,
  truck: `
    <path ${ATTR} d="M3.2 15.2h11.2V7.4H5.4L3.2 10.2z"/>
    <path ${ATTR} d="M14.4 15.2h4.2L21 11.6h-6.6z"/>
    <circle ${ATTR} cx="7.1" cy="17.4" r="1.55"/>
    <circle ${ATTR} cx="16.6" cy="17.4" r="1.55"/>
    <path ${ATTR} d="M14.4 7.4v4.2"/>`,
  warehouse: `
    <path ${ATTR} d="M3.4 10.2 12 4.6l8.6 5.6V19.4H3.4z"/>
    <path ${ATTR} d="M8.2 19.4V13.2h7.6v6.2"/>
    <path ${ATTR} d="M8.2 15.4h7.6M12 13.2v6.2"/>`,
  bridge: `
    <path ${ATTR} d="M3 17.6h18"/>
    <path ${ATTR} d="M5.2 17.6V14a6.8 6.8 0 0 1 13.6 0v3.6"/>
    <path ${ATTR} d="M8.4 17.6V15.2M12 17.6v-3M15.6 17.6V15.2"/>
    <path ${ATTR} d="M3.4 10.8h2.4M18.2 10.8h2.4"/>`,
  aiChip: `
    <rect ${ATTR} x="7" y="7" width="10" height="10" rx="1.6"/>
    <rect ${ATTR} x="9.4" y="9.4" width="5.2" height="5.2" rx="1"/>
    <path ${ATTR} d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2M6.2 6.2l1.5 1.5M16.3 16.3l1.5 1.5M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5"/>`,
  aiHead: `
    <path ${ATTR} d="M8.2 14.8a4.4 4.4 0 0 1 7.6 0"/>
    <path ${ATTR} d="M8.8 9.4a3.4 3.4 0 0 1 6.4 0"/>
    <path ${ATTR} d="M7.4 11.2H5.8a1.4 1.4 0 0 0 0 2.8h1.2"/>
    <path ${ATTR} d="M16.6 11.2h1.6a1.4 1.4 0 0 1 0 2.8h-1.2"/>
    <circle ${ATTR} cx="10.1" cy="11.1" r=".7" fill="currentColor" stroke="none"/>
    <circle ${ATTR} cx="13.9" cy="11.1" r=".7" fill="currentColor" stroke="none"/>
    <path ${ATTR} d="M12 4.4V3.2M10.4 5.1 9.6 4.1M13.6 5.1l.8-1"/>`,
  road: `
    <path ${ATTR} d="M8.2 3.6 5.4 20.4M15.8 3.6l2.8 16.8"/>
    <path ${ATTR} d="M12 5.2v2.4M12 10.2v2.4M12 15.2v2.4"/>`,
  users: `
    <circle ${ATTR} cx="9" cy="8.2" r="2.4"/>
    <circle ${ATTR} cx="16.2" cy="9" r="2"/>
    <path ${ATTR} d="M3.8 18.4a5.2 5.2 0 0 1 10.4 0"/>
    <path ${ATTR} d="M14.2 18.4a4.2 4.2 0 0 1 6 0"/>`,
  databaseSync: `
    <ellipse ${ATTR} cx="12" cy="6.4" rx="6.2" ry="2.4"/>
    <path ${ATTR} d="M5.8 6.4v4.2c0 1.3 2.8 2.4 6.2 2.4s6.2-1.1 6.2-2.4V6.4"/>
    <path ${ATTR} d="M5.8 10.6v4.2c0 1.3 2.8 2.4 6.2 2.4s6.2-1.1 6.2-2.4v-4.2"/>
    <path ${ATTR} d="M18.8 8.8h2.2v2.2M21 8.8a8.4 8.4 0 0 0-3.2-3"/>`,
  database: `
    <ellipse ${ATTR} cx="12" cy="6.2" rx="6.4" ry="2.5"/>
    <path ${ATTR} d="M5.6 6.2v5c0 1.4 2.9 2.5 6.4 2.5s6.4-1.1 6.4-2.5v-5"/>
    <path ${ATTR} d="M5.6 11.2v5c0 1.4 2.9 2.5 6.4 2.5s6.4-1.1 6.4-2.5v-5"/>`,
  chartUp: `
    <path ${ATTR} d="M4.2 18.6h15.6"/>
    <path ${ATTR} d="M6.2 14.2 10 10.2l3.2 3 5.4-6"/>
    <path ${ATTR} d="M15.2 7.2h3.4v3.4"/>`,
  shieldCheck: `
    <path ${ATTR} d="M12 3.4 19.2 6.2v5.2c0 4.4-3 7.4-7.2 9-4.2-1.6-7.2-4.6-7.2-9V6.2z"/>
    <path ${ATTR} d="m8.8 12.1 2.2 2.2 4.4-4.6"/>`,
  alert: `
    <path ${ATTR} d="M12 4.4 20.4 19.2H3.6z"/>
    <path ${ATTR} d="M12 9.6v5"/>
    <circle ${ATTR} cx="12" cy="16.8" r=".85" fill="currentColor" stroke="none"/>`,
  target: `
    <circle ${ATTR} cx="12" cy="12" r="7.4"/>
    <circle ${ATTR} cx="12" cy="12" r="3.6"/>
    <path ${ATTR} d="M12 3.4v2.2M12 18.4v2.2M3.4 12h2.2M18.4 12h2.2"/>`,
  analytics: `
    <path ${ATTR} d="M4.4 18.6V9.4M10 18.6V5.4M15.6 18.6v-6M21 18.6V8.2"/>`,
  anchor: `
    <circle ${ATTR} cx="12" cy="6.2" r="2.1"/>
    <path ${ATTR} d="M12 8.3v11.2"/>
    <path ${ATTR} d="M7.2 14.2a4.8 4.8 0 0 0 9.6 0M8.4 12.4H5.8M18.2 12.4h-2.6"/>`,
  plane: `
    <path ${ATTR} d="M12 3.2c.95 0 1.55.9 1.55 2.05V9.4l7.05 4.15v2.05l-7.05-2.15v3.95l2.3 1.7v1.55L12 19.55l-3.85 1.05V19.05l2.3-1.7V13.4L3.4 15.6v-2.05L10.45 9.4V5.25C10.45 4.1 11.05 3.2 12 3.2z"/>`,
  train: `
    <rect ${ATTR} x="5.2" y="4.6" width="13.6" height="11.4" rx="2.2"/>
    <path ${ATTR} d="M5.2 12.2h13.6M8.4 16v2.2M15.6 16v2.2M7.2 18.2h9.6"/>
    <circle ${ATTR} cx="9" cy="9.2" r="1.2"/>
    <circle ${ATTR} cx="15" cy="9.2" r="1.2"/>`,
  hub: `
    <path ${ATTR} d="M12 3.6 19 8v8l-7 4.4L5 16V8z"/>
    <circle ${ATTR} cx="12" cy="12" r="2.2"/>
    <path ${ATTR} d="M12 3.6v4.2M19 8l-3.6 2.2M19 16l-3.6-2.2M12 20.4v-4.2M5 16l3.6-2.2M5 8l3.6 2.2"/>`,
  network: `
    <circle ${ATTR} cx="6.2" cy="12" r="2.2"/>
    <circle ${ATTR} cx="17.8" cy="7.2" r="2.2"/>
    <circle ${ATTR} cx="17.8" cy="16.8" r="2.2"/>
    <path ${ATTR} d="M8.3 11.1 15.6 8.1M8.3 12.9 15.6 15.9"/>`,
  coldChain: `
    <path ${ATTR} d="M12 3.6v16.8M4.7 7.8l14.6 8.4M19.3 7.8 4.7 16.2"/>
    <path ${ATTR} d="m10.3 5.4 1.7-1.8 1.7 1.8M10.3 18.6l1.7 1.8 1.7-1.8"/>
    <path ${ATTR} d="m5.1 10.2-.4-2.4 2.4-.4M18.9 13.8l.4 2.4-2.4.4"/>
    <path ${ATTR} d="m16.9 7.4 2.4.4-.4 2.4M7.1 16.6l-2.4-.4.4-2.4"/>`,
  city: `
    <path ${ATTR} d="M3.4 20.4h17.2"/>
    <path ${ATTR} d="M5.8 20.4V9.4l5-2.8v13.8"/>
    <path ${ATTR} d="M10.8 20.4V12h7.4v8.4"/>
    <path ${ATTR} d="M7.6 11.6v1.5M7.6 15.2v1.5M13.4 14.6v1.4M16 14.6v1.4M13.4 17.6v1.4M16 17.6v1.4"/>`,
  waterway: `
    <path ${ATTR} d="M4.8 12.6h14.4l-2.2 4.6H7z"/>
    <path ${ATTR} d="M12 12.6V5.4M12 8.8h4.6L12 5.4"/>
    <path ${ATTR} d="M3.4 19.6c1.5 0 1.5 1.1 3 1.1s1.5-1.1 3-1.1 1.5 1.1 3 1.1 1.5-1.1 3-1.1 1.5 1.1 3 1.1"/>`,
  container: `
    <rect ${ATTR} x="3.4" y="7.8" width="17.2" height="9.4" rx="1.2"/>
    <path ${ATTR} d="M7.7 7.8v9.4M12 7.8v9.4M16.3 7.8v9.4"/>
    <path ${ATTR} d="M6 17.2v1.8M18 17.2v1.8"/>`,
  server: `
    <rect ${ATTR} x="4" y="4.6" width="16" height="6" rx="1.5"/>
    <rect ${ATTR} x="4" y="13.4" width="16" height="6" rx="1.5"/>
    <path ${ATTR} d="M11 7.6h5.4M11 16.4h5.4"/>
    <circle ${ATTR} cx="7.4" cy="7.6" r=".85" fill="currentColor" stroke="none"/>
    <circle ${ATTR} cx="7.4" cy="16.4" r=".85" fill="currentColor" stroke="none"/>`,
  share: `
    <circle ${ATTR} cx="12" cy="6.2" r="2.3"/>
    <circle ${ATTR} cx="6.4" cy="17.4" r="2.3"/>
    <circle ${ATTR} cx="17.6" cy="17.4" r="2.3"/>
    <path ${ATTR} d="M10.6 8.2 8 15.2M13.4 8.2 16 15.2M8.7 17.4h6.6"/>`,
  route: `
    <path ${ATTR} d="M3.4 8.6h11M3.4 15.4h7.4"/>
    <path ${ATTR} d="m14.2 5.4 3.4 3.2-3.4 3.2M10.6 12.2l3.4 3.2-3.4 3.2"/>`,
  play: `
    <path ${ATTR} d="M8.6 5.8 18.2 12l-9.6 6.2z"/>`,
  pause: `
    <path ${ATTR} d="M9.4 5.8v12.4M14.6 5.8v12.4"/>`,
  replay: `
    <path ${ATTR} d="M20 12a8 8 0 1 1-2.7-6"/>
    <path ${ATTR} d="M20.4 4.4v4.4H16"/>`,
};

/** id → icon for dashboard metrics that only carry a semantic id. */
const METRIC_ICON_BY_ID = {
  nationalHubs: 'hub', hubs: 'hub', ports: 'anchor', airports: 'plane',
  stations: 'train', rail: 'train', highways: 'road', road: 'road',
  channels: 'route', deepBerths: 'container', parks: 'warehouse',
  logisticsParks: 'warehouse', coldChainBases: 'coldChain', cities: 'city',
  entities: 'users', connectors: 'network', systems: 'server',
  resources: 'database', auth: 'share', events: 'alert',
  active: 'users', updates: 'databaseSync', sharing: 'share', calls: 'cloudDatabase',
  analysis: 'aiChip', alerts: 'alert', success: 'target', status: 'shieldCheck',
};

/** 中文标签优先匹配：同一个 id 在全国/省级会挂不同口径的指标（如 parks 既是园区也是冷链基地）。 */
const METRIC_ICON_BY_KEYWORD = [
  ['冷链', 'coldChain'], ['枢纽', 'hub'], ['泊位', 'anchor'], ['港', 'anchor'],
  ['机场', 'plane'], ['航空', 'plane'], ['铁路', 'train'], ['班列', 'train'],
  ['高速', 'road'], ['公路', 'road'], ['航道', 'waterway'], ['水运', 'waterway'], ['内河', 'waterway'],
  ['园区', 'warehouse'], ['基地', 'warehouse'], ['仓', 'warehouse'],
  ['通道', 'route'], ['走廊', 'route'], ['线路', 'route'], ['里程', 'route'],
  ['覆盖率', 'target'], ['城市', 'city'], ['地市', 'city'], ['县域', 'city'], ['覆盖', 'city'],
  ['企业', 'users'], ['机构', 'users'], ['主体', 'users'],
  ['系统', 'server'], ['平台', 'server'],
  ['数据资源', 'database'], ['资源', 'database'],
  ['共享', 'share'], ['调用', 'cloudDatabase'], ['服务', 'cloudDatabase'],
  ['分析', 'aiChip'], ['预警', 'alert'], ['异常', 'alert'],
  ['更新', 'databaseSync'], ['成功率', 'target'], ['准点', 'target'],
  ['状态', 'shieldCheck'],
];

/** 少数指标的 id 口径比标签关键词更准确：万吨级泊位要和普通港口泊位区分开。 */
const METRIC_ICON_ID_FIRST = new Set(['deepBerths']);

export function metricIconName(id, label = '') {
  if (METRIC_ICON_ID_FIRST.has(id)) return METRIC_ICON_BY_ID[id];
  const text = String(label ?? '');
  const hit = METRIC_ICON_BY_KEYWORD.find(([keyword]) => text.includes(keyword));
  return hit?.[1] ?? METRIC_ICON_BY_ID[id] ?? 'analytics';
}

/** 指标卡/状态条上的图标：外层类名沿用各页面既有样式，内部换成统一 SVG。 */
export function metricIcon(id, label, { className = '' } = {}) {
  return `<i class="${className}" aria-hidden="true">${iconSvg(metricIconName(id, label))}</i>`;
}

/** 面板标题左侧的小图标。 */
export function panelIcon(name) {
  return `<i class="panel-icon" aria-hidden="true">${iconSvg(name)}</i>`;
}

export function iconSvg(name, { className = '' } = {}) {
  const body = PATHS[name];
  if (!body) return '';
  const cls = className ? ` class="${className}"` : '';
  return `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">${body}</svg>`;
}

/** Primary: dual-hex + platform + halo for the three core layer cards. */
export function renderLayerIcon(tone, iconName, { size = 'lg' } = {}) {
  return `
    <span class="layer-icon layer-icon--${tone} layer-icon--${size}" aria-hidden="true">
      <span class="layer-icon__halo"></span>
      <span class="layer-icon__hex-outer"></span>
      <span class="layer-icon__hex">
        ${iconSvg(iconName, { className: 'layer-icon__svg' })}
      </span>
      <span class="layer-icon__platform"></span>
    </span>`;
}

/** Secondary: compact circular node for relations / loop / KPI. */
export function renderNodeIcon(tone, iconName, { size = 'md' } = {}) {
  return `
    <span class="map-node-icon map-node-icon--${tone} map-node-icon--${size}" aria-hidden="true">
      ${iconSvg(iconName, { className: 'map-node-icon__svg' })}
    </span>`;
}

export const EXPLODED_LAYER_ICONS = {
  digital: { tone: 'digital', icon: 'cloudDatabase' },
  operation: { tone: 'operation', icon: 'truck' },
  infrastructure: { tone: 'infra', icon: 'warehouse' },
};

export const EXPLODED_RELATION_ICONS = {
  support: { tone: 'infra', icon: 'bridge' },
  mapping: { tone: 'operation', icon: 'truck' },
  feedback: { tone: 'digital', icon: 'aiHead' },
};

export const EXPLODED_LOOP_ICONS = {
  facility: { tone: 'infra', icon: 'bridge' },
  business: { tone: 'operation', icon: 'truck' },
  data: { tone: 'digital', icon: 'database' },
  analysis: { tone: 'digital', icon: 'chartUp' },
  feedback: { tone: 'digital', icon: 'target' },
};

export const EXPLODED_KPI_ICONS = {
  nodes: { tone: 'infra', icon: 'hub' },
  tasks: { tone: 'operation', icon: 'truck' },
  updates: { tone: 'digital', icon: 'databaseSync' },
  sharing: { tone: 'digital', icon: 'database' },
  analysis: { tone: 'digital', icon: 'aiChip' },
  efficiency: { tone: 'operation', icon: 'chartUp' },
};

export const STACK_LABEL_ICONS = {
  digital: { tone: 'digital', icon: 'cloudDatabase' },
  operation: { tone: 'operation', icon: 'truck' },
  infrastructure: { tone: 'infra', icon: 'warehouse' },
};
