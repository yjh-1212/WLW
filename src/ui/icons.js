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
    <path ${ATTR} d="M12 3.6 14.4 11.2 20.6 13.2 14.4 14.4 12 20.6 9.6 14.4 3.4 13.2 9.6 11.2z"/>`,
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
};

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
