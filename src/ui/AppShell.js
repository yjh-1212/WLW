import { MAP_STATES } from '../core/MapStateMachine.js';
import { layerCatalog, operationDashboard, infrastructureDashboard, digitalDashboard, explodedDashboard, buildProvinceOperationDashboard, buildProvinceInfrastructureDashboard, buildProvinceDigitalDashboard } from '../data/demoData.js';
import { STORY_IDS } from '../data/LayerDataManager.js';
import {
  iconSvg,
  metricIcon,
  metricIconName,
  panelIcon,
  renderLayerIcon,
  renderNodeIcon,
  EXPLODED_LAYER_ICONS,
  EXPLODED_RELATION_ICONS,
  EXPLODED_LOOP_ICONS,
  EXPLODED_KPI_ICONS,
  STACK_LABEL_ICONS,
} from './icons.js';

const layerLabels = {
  infrastructure: ['基础设施网', 'INFRASTRUCTURE'],
  operation: ['物流运营网', 'OPERATION'],
  digital: ['数字物流网', 'DIGITAL'],
};

const routeTypeLabels = { axis: '主轴', corridor: '走廊', channel: '通道' };
const digitalRoleLabels = {
  platform: '物流平台',
  'trusted-space': '数据共享中心',
  access: '企业接入节点',
  data: '物流数据节点',
  service: '公共服务节点',
  event: '物流动态节点',
  agent: '智能服务节点',
  operator: '交通运营单位',
};
const provinceDigitalRoleLabels = {
  platform: '省级物流平台',
  logistics: '物流企业节点',
  shipper: '货主企业节点',
  park: '园区与枢纽节点',
  public: '政务及公共服务节点',
};

const svgIcon = (path) => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${path}</svg>`;
const operationIcons = {
  cargo: svgIcon('<path d="M3 15.5h12.5V7H3zM15.5 15.5H21l2-4.5h-7.5z" stroke="currentColor" stroke-width="1.6"/><circle cx="7" cy="18" r="1.7" stroke="currentColor" stroke-width="1.6"/><circle cx="17.5" cy="18" r="1.7" stroke="currentColor" stroke-width="1.6"/>'),
  tasks: svgIcon('<rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
  multimodal: svgIcon('<rect x="3.5" y="8" width="7.5" height="8" rx="1" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="8" width="7.5" height="8" rx="1" stroke="currentColor" stroke-width="1.6"/><path d="M7.2 8V6.2h9.6V8M8.8 12h6.4" stroke="currentColor" stroke-width="1.6"/>'),
  capacity: svgIcon('<circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3.4" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.8v2.6M12 17.6v2.6M3.8 12h2.6M17.6 12h2.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
  hubs: svgIcon('<path d="M12 3.5 19.2 8v8L12 20.5 4.8 16V8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.1" stroke="currentColor" stroke-width="1.6"/>'),
  links: svgIcon('<circle cx="6.5" cy="12" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="17.5" cy="7.5" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="17.5" cy="16.5" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M8.7 10.8 15.2 8.4M8.7 13.2 15.2 15.6" stroke="currentColor" stroke-width="1.6"/>'),
  vehicles: svgIcon('<path d="M4 15h11V8.2H6.2L4 11.2zM15 15h4.4L21 12h-6z" stroke="currentColor" stroke-width="1.6"/><circle cx="7.2" cy="17.4" r="1.5" stroke="currentColor" stroke-width="1.6"/><circle cx="16.8" cy="17.4" r="1.5" stroke="currentColor" stroke-width="1.6"/>'),
  online: svgIcon('<path d="M5 15.2a8.2 8.2 0 0 1 14 0M8.2 17.4a4.6 4.6 0 0 1 7.6 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="19.4" r="1.15" fill="currentColor"/>'),
  index: svgIcon('<path d="M5 16.5 9.2 11l3.2 3.6L19 7.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5 7.5H19V12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'),
  ontime: svgIcon('<circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5V12l3.2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
  alerts: svgIcon('<path d="M12 4.2 21 19.5H3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 9.5v5.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="16.8" r=".9" fill="currentColor"/>'),
};

/** 设施类图层行的小图标：点要素靠图标区分类型，线要素继续用 CSS 线型符号。 */
const FACILITY_TOGGLE_ICONS = {
  nationalHubs: 'hub',
  coldChainBases: 'coldChain',
  logisticsParks: 'warehouse',
  cityNodes: 'city',
  railFreight: 'train',
  roadFreight: 'truck',
  airPortFacilities: 'plane',
};

/** 数字物流网要素行：全国与省级两套 id 都映射到同一套图标语义。 */
const DIGITAL_ELEMENT_ICONS = {
  connectors: 'users',
  apiRelations: 'server',
  epcis: 'database',
  contracts: 'share',
  corridors: 'route',
  ai: 'aiChip',
  cities: 'city',
  parks: 'warehouse',
  enterprises: 'users',
  links: 'network',
  crossProvince: 'route',
  services: 'aiChip',
};

const INFRA_FILTER_IDS = ['axes', 'corridors', 'channels', 'hubs', 'majorRailways', 'majorRoads', 'nationalHubs', 'coldChainBases', 'logisticsParks'];
const PROVINCE_INFRA_FILTER_IDS = ['provincialBackbone', 'outboundChannels', 'cityNodes', 'logisticsParks', 'coldChainBases', 'railFreight', 'roadFreight', 'airPortFacilities'];
const DIGITAL_FILTER_IDS = ['connectors', 'apiRelations', 'epcis', 'contracts', 'corridors', 'ai'];
const INFRA_MODE_FILTERS = {
  overview: INFRA_FILTER_IDS,
  rail: ['majorRailways', 'axes', 'corridors', 'hubs'],
  road: ['majorRoads', 'axes', 'channels', 'hubs'],
  water: ['nationalHubs', 'hubs', 'channels'],
  air: ['nationalHubs', 'hubs'],
  hubs: ['nationalHubs', 'hubs'],
  parks: ['logisticsParks', 'coldChainBases', 'hubs'],
};
const DIGITAL_MODE_FILTERS = {
  overview: DIGITAL_FILTER_IDS,
  connectors: ['connectors', 'corridors'],
  apiRelations: ['connectors', 'apiRelations'],
  contracts: ['connectors', 'contracts', 'corridors'],
  epcis: ['connectors', 'epcis'],
  ai: ['connectors', 'ai'],
};
// 省级数字物流网自带一套要素与模式，不复用全国的过滤器 id。
const PROVINCE_DIGITAL_FILTER_IDS = ['cities', 'parks', 'enterprises', 'links', 'crossProvince', 'services'];
const PROVINCE_DIGITAL_MODE_FILTERS = {
  overview: PROVINCE_DIGITAL_FILTER_IDS,
  cities: ['cities', 'enterprises', 'links'],
  parks: ['cities', 'parks', 'links'],
  industry: ['cities', 'enterprises', 'parks', 'links'],
  crossProvince: ['cities', 'crossProvince', 'links'],
  ai: ['cities', 'services', 'links'],
};
const NETWORK_HEADINGS = {
  infrastructure: ['基础设施网络分析', '通道枢纽园区、交通线网与设施连通性'],
  operation: ['物流运营网络分析', '洞察全国货物流向、运输任务、运力协同与运行异常'],
  digital: ['数字物流网络运行态势', '呈现全国物流主体连接、数据共享、服务调用与智能协同情况'],
};

const stateToVisualClass = (state) => state === MAP_STATES.COMBINED ? 'view-combined' : 'view-focus';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const renderLayerRow = ({ layer, id, label, count, countLabel, symbolClass = '', symbolIcon = '', enabled = true, color }) => `
  <div class="layer-row" role="switch" aria-checked="${enabled ? 'true' : 'false'}">
    <span><i class="layer-symbol ${symbolClass}"${color ? ` style="--layer-color:${escapeHtml(color)}"` : ''}>${symbolIcon ? iconSvg(symbolIcon) : ''}</i><b>${escapeHtml(label)}</b>${countLabel != null ? `<small>${escapeHtml(countLabel)}</small>` : (count != null ? `<small>${Number(count).toLocaleString('zh-CN')}</small>` : '')}</span>
    <input type="checkbox" data-layer="${layer}" data-layer-filter="${escapeHtml(id)}" ${enabled ? 'checked' : ''} tabindex="-1"/>
    <i class="toggle" aria-hidden="true"></i>
  </div>`;

const renderLayerMasterControl = (layer, anyEnabled) => `
  <button type="button" class="layer-master-switch${anyEnabled ? '' : ' is-all-off'}" data-layer-toggle-all="${escapeHtml(layer)}" aria-pressed="${anyEnabled ? 'true' : 'false'}" aria-label="${anyEnabled ? '关闭' : '开启'}当前层全部图层元素">
    <i aria-hidden="true">${anyEnabled ? '⊘' : '◎'}</i><b>${anyEnabled ? '全部关闭' : '全部开启'}</b>
  </button>`;

const renderFacilityRankItem = (item, rank) => `<li class="${item.role ? 'has-role' : ''}">
  <em>${rank + 1}</em>
  <b>${escapeHtml(item.name)}</b>
  ${item.role ? `<small class="infra-rank-role">${escapeHtml(item.role)}</small>` : ''}
  <span class="operation-rank-bar" style="--score:${Number(item.score)}%"><i></i></span>
  <strong>${Number(item.count ?? 0).toLocaleString('zh-CN')} 个</strong>
</li>`;

const renderOperationModeSummary = (brief) => `
  <section class="operation-mode-summary" aria-live="polite">
    <header>${panelIcon(metricIconName(null, brief.title))}<b>${escapeHtml(brief.title)}</b><i><em></em>总体畅通</i></header>
    <div>${brief.stats.map(([label, value]) => `<i><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></i>`).join('')}</div>
  </section>`;

const renderRankBar = (score) => `<span class="operation-rank-bar" style="--score:${Number(score)}%"><i></i></span>`;

const renderOperationOverlays = (dashboard = operationDashboard) => `
  <div class="operation-map-overlays" hidden>
    ${(dashboard.mapOverlays?.hubs ?? []).map((hub) => `
      <button type="button" class="operation-hub-callout" data-overlay-id="${escapeHtml(hub.id)}" data-entity-id="${escapeHtml(hub.id)}" data-anchor="${escapeHtml(hub.anchor)}">
        <b>${escapeHtml(hub.name)}</b>
        <span><small>货运量</small><em>${escapeHtml(hub.volume)}</em></span>
        <span><small>在途任务</small><em>${escapeHtml(hub.tasks)}</em></span>
      </button>`).join('')}
    ${(dashboard.mapOverlays?.flows ?? []).map((flow) => `
      <span class="operation-flow-chip" data-overlay-id="${escapeHtml(flow.id)}">${escapeHtml(flow.label)}</span>`).join('')}
  </div>`;

const renderOperationMapChrome = () => `
  <aside class="infra-map-legend operation-map-legend" aria-label="运输方式图例">
    <header>运输方式</header>
    <span><i class="road"></i>公路</span>
    <span><i class="rail"></i>铁路</span>
    <span><i class="water"></i>水运</span>
    <span><i class="air"></i>航空</span>
    <span><i class="multimodal"></i>多式联运</span>
    <header>关键节点</header>
    <span><i class="hub"></i>枢纽节点</span>
    <span><i class="port"></i>重要口岸</span>
  </aside>
  <div class="infra-map-controls operation-map-controls" aria-label="地图控制">
    <button type="button" data-infra-map="zoom-in" title="放大">+</button>
    <button type="button" data-infra-map="zoom-out" title="缩小">−</button>
    <button type="button" data-infra-map="locate" title="定位">定位</button>
    <button type="button" data-infra-map="layers" title="图层">图层</button>
  </div>`;

const renderOperationWorkspaceInner = (dashboard = operationDashboard) => `
  <nav class="operation-subnav" aria-label="运营分析模式">
    ${dashboard.modes.map((mode, index) => `<button type="button" data-operation-mode="${mode.id}" class="${index === 0 ? 'is-active' : ''}">${escapeHtml(mode.label)}</button>`).join('')}
  </nav>
  ${renderOperationMapChrome()}
  ${renderOperationOverlays(dashboard)}
  <aside class="operation-insight-panel" aria-label="运营洞察">
    <header class="operation-insight-head">${panelIcon('chartUp')}<b>运营洞察</b></header>
    <div id="operation-mode-summary">${renderOperationModeSummary(dashboard.modeBriefs.overview)}</div>
    <section class="operation-panel-section operation-ranking" data-operation-views="overview cargo capacity tasks multimodal">
      <header>${panelIcon('analytics')}<b>${escapeHtml(dashboard.rankingTitle ?? '全国物流运行 TOP')}</b><small>实时排行</small></header>
      <div class="operation-panel-tabs">
        <button type="button" class="is-active" data-operation-rank-tab="flows">热门流向</button>
        <button type="button" data-operation-rank-tab="hubs">活跃枢纽</button>
      </div>
      <ol data-operation-rank-panel="flows">${dashboard.hotFlows.map((flow, index) => `<li><em>${index + 1}</em><div><b>${escapeHtml(flow.from)}<i>→</i>${escapeHtml(flow.to)}</b>${renderRankBar(flow.score)}</div><strong>${escapeHtml(flow.volume)}</strong></li>`).join('')}</ol>
      <ol data-operation-rank-panel="hubs" hidden>${dashboard.topHubs.map((hub, index) => `<li><em>${index + 1}</em><div><b>${escapeHtml(hub.name)}</b>${renderRankBar(hub.score)}</div><strong>${escapeHtml(hub.volume)}</strong></li>`).join('')}</ol>
    </section>
    <section class="operation-panel-section operation-alert-overview" data-operation-views="overview alerts">
      <header>${panelIcon('alert')}<b>运行异常</b><button type="button" data-operation-mode="alerts">查看全部 →</button></header>
      <div>${[1, 0, 2, 3].map((order) => dashboard.alertBreakdown[order]).map((item) => `<span><small>${escapeHtml(item.panelLabel)}</small><b>${Number(item.value)}</b></span>`).join('')}</div>
    </section>
    <section class="operation-panel-section operation-alert-card" data-operation-views="alerts">
      <header>${panelIcon('alert')}<b>异常链路</b><small>${escapeHtml(dashboard.activeAlert.level)}</small></header>
      <span>${escapeHtml(dashboard.activeAlert.type)}</span><b>${escapeHtml(dashboard.activeAlert.route)}</b>
      <p>${escapeHtml(dashboard.activeAlert.detail)}</p><em>${escapeHtml(dashboard.activeAlert.action)}</em>
    </section>
  </aside>
  <section class="operation-ticker" aria-label="物流运行状态带">
    ${dashboard.ticker.map((item, index) => `<div class="${index === 0 ? 'is-index' : ''} ${item.id === 'alerts' ? 'is-alert' : ''}"><i>${operationIcons[item.id] ?? operationIcons.index}</i><span><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}</b></span></div>`).join('')}
    <div class="operation-ticker-time"><small>数据更新时间</small><b id="operation-update-time">--:--:--</b><span><i></i>实时更新</span></div>
  </section>`;

const renderOperationWorkspace = (dashboard = operationDashboard) => `
  <div id="operation-workspace">${renderOperationWorkspaceInner(dashboard)}</div>`;

const renderExplodedLoop = (loop = []) => {
  const count = Math.max(loop.length, 1);
  const cx = 100;
  const cy = 100;
  const rx = 62;
  const ry = 56;
  const pointAt = (index, radiusScale = 1) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return {
      x: cx + rx * radiusScale * Math.cos(angle),
      y: cy + ry * radiusScale * Math.sin(angle),
      angle,
    };
  };
  const arcPaths = loop.map((_, index) => {
    const from = pointAt(index, 0.78);
    const to = pointAt((index + 1) % count, 0.78);
    const mid = pointAt(index + 0.5, 0.92);
    return `<path d="M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${mid.x.toFixed(1)} ${mid.y.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}" />`;
  }).join('');

  return `
  <div class="exploded-flow-ring">
    <svg class="exploded-flow-ring__arcs" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <marker id="exploded-loop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 1.2 L 8 5 L 0 8.8 Z" fill="#5ec8ff"/>
        </marker>
      </defs>
      <g fill="none" stroke="#5ec8ff" stroke-width="1.35" stroke-linecap="round" marker-end="url(#exploded-loop-arrow)" opacity="0.88">
        ${arcPaths}
      </g>
    </svg>
    <ol class="exploded-flow-loop" aria-label="协同闭环">
      ${loop.map((item, index) => {
        const icon = EXPLODED_LOOP_ICONS[item.id] ?? { tone: 'digital', icon: 'network' };
        const angle = -90 + (index * 360) / count;
        return `
        <li class="is-${item.id}" style="--a:${angle}">
          ${renderNodeIcon(icon.tone, icon.icon, { size: 'md' })}
          <b>${escapeHtml(item.label)}</b>
        </li>`;
      }).join('')}
    </ol>
  </div>`;
};

const renderExplodedWorkspace = (dashboard = explodedDashboard) => `
  <div id="exploded-workspace" aria-label="三层分解协同关系">
    <header class="exploded-hero">
      <h2>${escapeHtml(dashboard.title)}</h2>
      <p>${escapeHtml(dashboard.subtitle)}</p>
      ${dashboard.status ? `<span class="exploded-status"><i></i>${escapeHtml(dashboard.status)}</span>` : ''}
    </header>

    <div class="exploded-layer-cards" aria-label="三层网络概览">
      ${dashboard.layers.map((layer) => {
        const icon = EXPLODED_LAYER_ICONS[layer.id] ?? { tone: layer.id, icon: 'network' };
        return `
        <button type="button" class="exploded-layer-card is-${layer.id}" data-exploded-focus="${layer.id}">
          <header>
            ${renderLayerIcon(icon.tone, icon.icon)}
            <div><b>${escapeHtml(layer.name)}</b><small>${escapeHtml(layer.lead)}</small></div>
          </header>
          <div class="exploded-layer-metrics">
            ${layer.metrics.map((metric) => `<span><small>${escapeHtml(metric.label)}</small><em>${escapeHtml(metric.value)}</em></span>`).join('')}
          </div>
          <span class="exploded-card-guide" aria-hidden="true"></span>
        </button>`;
      }).join('')}
    </div>

    <div class="exploded-links" aria-hidden="true">
      ${dashboard.links.map((link) => `
        <div class="exploded-link is-${link.id} is-${link.side}">
          <i></i><span>${escapeHtml(link.label)}</span>
        </div>`).join('')}
    </div>

    <aside class="exploded-side" aria-label="三层协同机制">
      <section class="exploded-relations">
        <header>${panelIcon('network')}<b>三层协同机制</b></header>
        ${dashboard.relations.map((item) => {
          const icon = EXPLODED_RELATION_ICONS[item.id] ?? { tone: 'digital', icon: 'network' };
          return `
          <div class="exploded-relation is-${item.id}">
            ${renderNodeIcon(icon.tone, icon.icon, { size: 'md' })}
            <div><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.detail)}</p></div>
          </div>`;
        }).join('')}
      </section>
      <section class="exploded-loop-panel">
        <header>${panelIcon('target')}<b>协同闭环</b></header>
        ${renderExplodedLoop(dashboard.loop)}
      </section>
    </aside>

    <section class="exploded-kpi-strip" aria-label="三层协同关键指标">
      ${dashboard.kpis.map((item) => {
        const icon = EXPLODED_KPI_ICONS[item.id] ?? { tone: item.tone, icon: 'network' };
        return `
        <div class="exploded-kpi is-${item.tone}">
          ${renderNodeIcon(icon.tone, icon.icon, { size: 'sm' })}
          <span><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}</b><em>${escapeHtml(item.delta)}</em></span>
        </div>`;
      }).join('')}
    </section>

    <aside class="exploded-map-legend" aria-label="三层分解图例">
      <header>关系</header>
      ${dashboard.legend.map((item) => `<span class="is-${item.style}"><i></i>${escapeHtml(item.label)}</span>`).join('')}
      <header>层级</header>
      <span class="is-digital"><i class="layer"></i>数字物流网</span>
      <span class="is-operation"><i class="layer"></i>物流运营网</span>
      <span class="is-infra"><i class="layer"></i>基础设施网</span>
    </aside>
  </div>`;


const renderNetworkOverlays = (dashboard, extraClass = '') => `
  <div class="operation-map-overlays ${extraClass}" hidden>
    ${(dashboard.layout === 'provincial' ? [] : (dashboard.mapOverlays?.hubs ?? [])).map((hub) => `
      <button type="button" class="operation-hub-callout" data-overlay-id="${escapeHtml(hub.id)}" data-entity-id="${escapeHtml(hub.id)}" data-anchor="${escapeHtml(hub.anchor)}"${hub.stack ? ` data-stack="${escapeHtml(hub.stack)}"` : ''}>
        <b>${escapeHtml(hub.name)}</b>
        <span><small>${escapeHtml(hub.volume)}</small><em>${escapeHtml(hub.tasks)}</em></span>
      </button>`).join('')}
  </div>`;

const renderInfraMapChrome = (scope = 'provincial') => {
  const provincial = scope === 'provincial';
  return `
  <aside class="infra-map-legend" aria-label="${provincial ? '省级' : '全国'}基础设施图例">
    <header>线路</header>
    ${provincial ? `
      <span><i class="backbone"></i>省内骨干通道</span>
      <span><i class="outbound"></i>出省通道</span>
      <span><i class="rail"></i>铁路货运网络</span>
      <span><i class="road"></i>公路货运网络</span>
    ` : `
      <span><i class="axis"></i>六轴骨架</span>
      <span><i class="corridor"></i>七条走廊</span>
      <span><i class="channel"></i>八条通道</span>
      <span><i class="rail"></i>铁路网络</span>
      <span><i class="road"></i>公路网络</span>
    `}
    <header>节点</header>
    ${provincial ? `
      <span><i class="core"></i>核心枢纽城市</span>
      <span><i class="region"></i>区域物流节点</span>
      <span><i class="park"></i>物流园区</span>
      <span><i class="cold"></i>冷链基地</span>
      <span><i class="rail-node"></i>铁路货运设施</span>
      <span><i class="air-node"></i>航空货运设施</span>
    ` : `
      <span><i class="core"></i>国家物流枢纽</span>
      <span><i class="cold"></i>骨干冷链基地</span>
      <span><i class="park"></i>规模物流园区</span>
    `}
  </aside>
  <div class="infra-map-controls" aria-label="地图控制">
    <button type="button" data-infra-map="zoom-in" title="放大">+</button>
    <button type="button" data-infra-map="zoom-out" title="缩小">−</button>
    <button type="button" data-infra-map="locate" title="定位">定位</button>
    <button type="button" data-infra-map="layers" title="图层">图层</button>
  </div>`;
};

const renderProvinceInfrastructureWorkspaceInner = (dashboard) => `
  <nav class="operation-subnav infra-subnav" aria-label="省级基础设施分析模式">
    ${dashboard.modes.map((mode, index) => `<button type="button" data-infra-mode="${mode.id}" class="${index === 0 ? 'is-active' : ''}">${escapeHtml(mode.label)}</button>`).join('')}
  </nav>
  ${renderNetworkOverlays(dashboard, 'infra-overlays')}
  ${renderInfraMapChrome('provincial')}
  <aside class="operation-insight-panel infra-insight-panel" aria-label="省内设施分析">
    <div class="infra-rank-block">
      <header class="operation-insight-head">${panelIcon('analytics')}<b>${escapeHtml(dashboard.rankingTitle ?? '设施分布 TOP 5')}</b><small>${escapeHtml(dashboard.rankingLabel ?? '本省节点')}</small></header>
      <div class="operation-panel-tabs infra-rank-tabs">
        ${dashboard.rankingTabs.map((tab, index) => `<button type="button" class="${index === 0 ? 'is-active' : ''}" data-infra-rank-tab="${tab.id}">${escapeHtml(tab.label)}</button>`).join('')}
      </div>
      ${dashboard.rankingTabs.map((tab, index) => `<ol class="infra-rank-list" data-infra-rank-panel="${tab.id}" ${index ? 'hidden' : ''}>${(dashboard.rankings[tab.id] ?? []).map(renderFacilityRankItem).join('')}</ol>`).join('')}
    </div>
    <section class="operation-panel-section">
      <header>${panelIcon('warehouse')}<b>重点设施结构</b></header>
      <div class="infra-structure-grid">${(dashboard.facilityStructure ?? []).map((item) => `<span><small>${escapeHtml(item.label)}</small><b>${Number(item.value).toLocaleString('zh-CN')}<em>个</em></b></span>`).join('')}</div>
    </section>
    <section class="operation-panel-section">
      <header>${panelIcon('route')}<b>对外通达方向</b></header>
      <div class="infra-outbound-meta">
        <span><small>对接省份</small><b>${Number(dashboard.outbound?.neighbors ?? 0)}</b></span>
        <span><small>主要出省通道</small><b>${Number(dashboard.outbound?.channels ?? 0)}</b></span>
      </div>
      <div class="infra-outbound">${(dashboard.outbound?.directions ?? []).map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join('')}</div>
    </section>
    <section class="operation-panel-section infra-gauge-card">
      <header>${panelIcon('target')}<b>${escapeHtml(dashboard.connectivity.title ?? '设施连通性指数')}</b></header>
      <div class="infra-gauge"><b>${escapeHtml(dashboard.connectivity.value)}</b><small>${escapeHtml(dashboard.connectivity.label ?? '省内综合指数')}</small></div>
      <div class="infra-regions">${dashboard.connectivity.regions.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join('')}</div>
    </section>
  </aside>
  <div class="network-stat-strip infra-stat-strip" aria-label="省级基础设施关键指标">
    ${dashboard.stats.map(([label, value]) => `<span>${metricIcon(null, label, { className: 'network-stat-icon' })}<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span></span>`).join('')}
    <span class="infra-stat-time"><small>数据更新时间</small><b class="network-update-time">--:--:--</b></span>
  </div>`;

const renderNationalInfrastructureWorkspaceInner = (dashboard = infrastructureDashboard) => `
  <nav class="operation-subnav infra-subnav" aria-label="基础设施分析模式">
    ${dashboard.modes.map((mode, index) => `<button type="button" data-infra-mode="${mode.id}" class="${index === 0 ? 'is-active' : ''}">${escapeHtml(mode.label)}</button>`).join('')}
  </nav>
  ${renderNetworkOverlays(dashboard, 'infra-overlays')}
  ${renderInfraMapChrome('national')}
  <aside class="operation-insight-panel infra-insight-panel" aria-label="基础设施洞察">
    <div class="infra-rank-block">
      <header class="operation-insight-head">${panelIcon('analytics')}<b>${escapeHtml(dashboard.rankingTitle ?? '设施分布 TOP 5')}</b><small>${escapeHtml(dashboard.rankingLabel ?? '设施点数')}</small></header>
      <div class="operation-panel-tabs infra-rank-tabs">
        ${dashboard.rankingTabs.map((tab, index) => `<button type="button" class="${index === 0 ? 'is-active' : ''}" data-infra-rank-tab="${tab.id}">${escapeHtml(tab.label)}</button>`).join('')}
      </div>
      ${dashboard.rankingTabs.map((tab, index) => `<ol class="infra-rank-list" data-infra-rank-panel="${tab.id}" ${index ? 'hidden' : ''}>${(dashboard.rankings[tab.id] ?? []).map(renderFacilityRankItem).join('')}</ol>`).join('')}
    </div>
    <section class="operation-panel-section">
      <header>${panelIcon('bridge')}<b>${escapeHtml(dashboard.projectsTitle ?? '重点基础设施建设')}</b></header>
      ${dashboard.projects.map((item) => `<div class="infra-project"><b>${escapeHtml(item.name)}</b><span><i style="width:${item.progress}%"></i></span><em>${item.progress}% ${escapeHtml(item.status)}</em></div>`).join('')}
    </section>
    <section class="operation-panel-section infra-gauge-card">
      <header>${panelIcon('target')}<b>${escapeHtml(dashboard.connectivity.title ?? '设施连通性指数')}</b></header>
      <div class="infra-gauge"><b>${escapeHtml(dashboard.connectivity.value)}</b><small>${escapeHtml(dashboard.connectivity.label ?? '全国连通指数')}</small></div>
      <div class="infra-regions">${dashboard.connectivity.regions.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join('')}</div>
    </section>
  </aside>
  <div class="network-stat-strip infra-stat-strip" aria-label="基础设施关键指标">
    ${dashboard.stats.map(([label, value]) => `<span>${metricIcon(null, label, { className: 'network-stat-icon' })}<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span></span>`).join('')}
    <span class="infra-stat-time"><small>数据更新时间</small><b class="network-update-time">--:--:--</b></span>
  </div>`;

const renderInfrastructureWorkspaceInner = (dashboard = infrastructureDashboard) => dashboard.layout === 'provincial'
  ? renderProvinceInfrastructureWorkspaceInner(dashboard)
  : renderNationalInfrastructureWorkspaceInner(dashboard);

const renderDigitalMapChrome = (provincial = false) => `
  <aside class="infra-map-legend digital-map-legend" aria-label="数字物流网络图例说明">
    <header>接入主体</header>
    <span><i class="dig-logistics"></i>物流企业</span>
    <span><i class="dig-shipper"></i>货主企业</span>
    ${provincial
      ? '<span><i class="dig-park"></i>园区与枢纽</span>'
      : '<span><i class="dig-operator"></i>交通运营单位</span>'}
    <span><i class="dig-public"></i>政务及公共服务</span>
    <span><i class="dig-platform"></i>平台与系统</span>
    <header>协同关系</header>
    <span><i class="dig-share"></i>数据共享</span>
    <span><i class="dig-call"></i>服务调用</span>
    <span><i class="dig-collaboration"></i>业务协同</span>
    ${provincial
      ? '<span><i class="dig-corridor"></i>跨省通道</span>'
      : '<span><i class="dig-corridor"></i>国家大通道</span>'}
  </aside>
  <div class="infra-map-controls digital-map-controls" aria-label="地图控制">
    <button type="button" data-infra-map="zoom-in" title="放大">+</button>
    <button type="button" data-infra-map="zoom-out" title="缩小">−</button>
    <button type="button" data-infra-map="locate" title="定位">定位</button>
    <button type="button" data-infra-map="layers" title="图层">图层</button>
  </div>`;

const renderDigitalOverlays = (dashboard = digitalDashboard) => `
  <div class="operation-map-overlays digital-overlays" hidden>
    ${(dashboard.mapOverlays?.hubs ?? []).map((hub) => `
      <button type="button" class="operation-hub-callout digital-network-callout" data-overlay-id="${escapeHtml(hub.id)}" data-entity-id="${escapeHtml(hub.id)}" data-anchor="${escapeHtml(hub.anchor)}"${hub.stack ? ` data-stack="${escapeHtml(hub.stack)}"` : ''}>
        <b>${escapeHtml(hub.name)}</b>
        <p>${escapeHtml(hub.description)}</p>
        ${(hub.metrics ?? []).map(([label, value]) => `<span><small>${escapeHtml(label)}</small><em>${escapeHtml(value)}</em></span>`).join('')}
      </button>`).join('')}
    ${(dashboard.mapOverlays?.corridors ?? []).map((corridor) => `
      <span class="digital-corridor-chip${dashboard.layout === 'provincial' ? ' is-outbound' : ''}" data-overlay-id="${escapeHtml(corridor.id)}"><i></i>${escapeHtml(corridor.label)}</span>`).join('')}
  </div>`;

const renderDigitalWorkspaceInner = (dashboard = digitalDashboard) => {
  const provincial = dashboard.layout === 'provincial';
  const [mapTitle, mapLead] = dashboard.mapTitle ?? ['全国数字物流协同网络', '主体连接 · 数据共享 · 服务调用 · 业务协同'];
  return `
  <nav class="operation-subnav digital-subnav" aria-label="数字网络分析模式">
    ${dashboard.modes.map((mode, index) => `<button type="button" data-digital-mode="${mode.id}" class="${index === 0 ? 'is-active' : ''}">${escapeHtml(mode.label)}</button>`).join('')}
  </nav>
  <header class="digital-map-heading"><b>${escapeHtml(mapTitle)}</b><small>${escapeHtml(mapLead)}</small></header>
  ${renderDigitalOverlays(dashboard)}
  ${renderDigitalMapChrome(provincial)}
  <aside class="operation-insight-panel digital-insight-panel" aria-label="数字网络洞察">
    <div>
      <header class="operation-insight-head">${panelIcon('cloudDatabase')}<b>${provincial ? '热门省级物流数据服务' : '热门物流数据服务'}</b><small>TOP5</small></header>
      <ol class="infra-rank-list digital-rank-list">${dashboard.products.map((item, index) => `<li><em>${index + 1}</em><b>${escapeHtml(item.name)}</b><strong>${escapeHtml(item.callsWan ?? 0)}万次</strong></li>`).join('')}</ol>
    </div>
    <section class="operation-panel-section">
      <header>${panelIcon('share')}<b>数据共享与使用</b><small>实时统计</small></header>
      <div class="digital-auth-grid">${dashboard.sharingStats.map((item) => `<span><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}${item.unit ? `<em>${escapeHtml(item.unit)}</em>` : ''}</b></span>`).join('')}</div>
      <div class="digital-sharing-summary">${dashboard.sharingSummary.map((item) => `<span><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}</b></span>`).join('')}</div>
    </section>
    <section class="operation-panel-section digital-outcomes">
      <header>${panelIcon('target')}<b>本网服务成效</b><small>今日</small></header>
      <div>${dashboard.serviceOutcomes.map((item) => `<span><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}</b></span>`).join('')}</div>
    </section>
    <section class="operation-panel-section">
      <header>${panelIcon('databaseSync')}<b>${provincial ? '省级最新动态' : '网络最新动态'}</b><small>最新 ${dashboard.events.length} 条</small></header>
      <div class="digital-event-stream">${dashboard.events.map((item) => `<p><time>${escapeHtml(item.time)}</time><b>${escapeHtml(item.type)}</b><span>${escapeHtml(item.detail)}</span></p>`).join('')}</div>
    </section>
  </aside>
  <section class="operation-ticker digital-ticker" aria-label="今日数字物流网络运行成效">
    ${dashboard.ticker.map((item) => `<div class="${item.id === 'status' ? 'is-status' : ''} ${item.id === 'alerts' ? 'is-alert' : ''}">${metricIcon(item.id, item.label)}<span><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}</b>${item.delta ? `<em>${escapeHtml(item.delta)}</em>` : ''}</span></div>`).join('')}
  </section>`;
};

const renderInfrastructureWorkspace = (dashboard = infrastructureDashboard) => `
  <div id="infrastructure-workspace">${renderInfrastructureWorkspaceInner(dashboard)}</div>`;

const renderDigitalWorkspace = (dashboard = digitalDashboard) => `
  <div id="digital-workspace">${renderDigitalWorkspaceInner(dashboard)}</div>`;

export class AppShell {
  constructor(root) {
    this.root = root;
    this.runtime = null;
    this.data = null;
    this.currentLayer = null;
    this.operationMode = 'overview';
    this.infrastructureMode = 'overview';
    this.digitalMode = 'overview';
    this.infrastructureRankTab = 'hubs';
    this.spatialContext = null;
    this.provinceDashboard = null;
    this.provinceInfrastructureDashboard = null;
    this.provinceDigitalDashboard = null;
    this.explodedPinnedFocus = null;
    this.render();
    this.canvas = this.root.querySelector('#map-canvas');
    this.bindStaticEvents();
    this.startClock();
  }

  render() {
    this.root.innerHTML = `
      <main class="app-shell" aria-label="国家物流网一图三网系统">
        <header class="topbar">
          <div class="brand-block">
            <div class="brand-mark" aria-hidden="true"><span></span><i></i></div>
            <div>
              <div class="brand-en">NATIONAL LOGISTICS NETWORK</div>
              <h1>国家物流网络 <em>一图三网</em></h1>
            </div>
            <div class="operation-page-heading" id="network-page-heading">
              <h2 id="network-page-title">物流运营网络分析</h2>
              <p id="network-page-lead">洞察全国货物流向、运输任务、运力协同与运行异常</p>
            </div>
          </div>
          <nav class="mode-nav" aria-label="地图模式">
            <div class="mode-cluster" aria-label="空间形态">
              <button class="mode-button is-active" data-map-state="COMBINED"><span class="mode-dot"></span>首页</button>
              <button class="mode-button" data-map-state="EXPLODED"><span class="split-icon" aria-hidden="true"></span>三层分解</button>
            </div>
            <span class="nav-separator" aria-hidden="true"></span>
            <div class="mode-cluster network-cluster" aria-label="业务网络">
              <button class="mode-button" data-map-state="FOCUS_INFRA"><i class="network-signal infra"></i>基础</button>
              <button class="mode-button" data-map-state="FOCUS_OPERATION"><i class="network-signal operation"></i>运营</button>
              <button class="mode-button" data-map-state="FOCUS_DIGITAL"><i class="network-signal digital"></i>数字</button>
            </div>
          </nav>
          <div class="top-actions">
            <div class="story-launch-group" aria-label="业务流程">
              <button class="story-launch north-grain" type="button" data-story-id="${STORY_IDS.NORTH_GRAIN}" aria-label="启动北粮南运业务流程">
                <i aria-hidden="true">${iconSvg('play')}</i><span><b>北粮南运</b><small>公铁海多式联运</small></span>
              </button>
              <button class="story-launch auto-parts" id="story-toggle" type="button" data-story-id="${STORY_IDS.AUTO_PARTS}" aria-label="启动汽车出海业务流程">
                <i aria-hidden="true">${iconSvg('play')}</i><span><b>汽车出海</b><small>渝沪协同 · 整车出口</small></span>
              </button>
            </div>
            <div class="search-box">
              <span aria-hidden="true">⌕</span>
              <input id="global-search" type="search" autocomplete="off" placeholder="搜索枢纽、线路、任务..." aria-label="统一搜索" />
              <kbd>⌘ K</kbd>
              <div id="search-results" class="search-results" role="listbox"></div>
            </div>
            <button class="icon-button" id="reset-view" title="复位全国视角" aria-label="复位全国视角">◎</button>
            <button class="icon-button" id="fullscreen" title="全屏" aria-label="全屏">⛶</button>
          </div>
        </header>

        <section class="workspace">
          <div class="map-stage" id="map-stage">
            <canvas id="map-canvas" aria-label="国家物流网 Three.js 交互地图"></canvas>
            <div class="map-aura" aria-hidden="true"></div>
            <div class="scene-caption">
              <div class="caption-index" id="caption-index">01 / NATIONAL PLATFORM VIEW</div>
              <h2 id="scene-title">全国物流网络</h2>
              <p class="caption-en">National Logistics Network</p>
              <p id="scene-subtitle">34 个省级区域</p>
              <p class="caption-networks">基础设施网 / 物流运营网 / 数字物流网融合</p>
            </div>
            <section class="province-platform-card" id="province-platform-card" aria-live="polite" aria-hidden="true">
              <header><span>PROVINCIAL LOGISTICS PLATFORM</span><button type="button" data-return-national aria-label="返回全国视角">×</button></header>
              <div class="platform-title"><i></i><div><h3 id="province-platform-name">省级物流运行平台</h3><p><span></span>省市协同在线</p></div></div>
              <div class="platform-metrics" id="province-platform-metrics"></div>
              <div class="platform-networks">
                <div class="digital"><i>${iconSvg(STACK_LABEL_ICONS.digital.icon)}</i><span><b>数字物流网</b><small>省市数据贯通 · 可信协同</small></span></div>
                <div class="operation"><i>${iconSvg(STACK_LABEL_ICONS.operation.icon)}</i><span><b>物流运营网</b><small>跨市组织调度 · 运行监测</small></span></div>
                <div class="infrastructure"><i>${iconSvg(STACK_LABEL_ICONS.infrastructure.icon)}</i><span><b>基础设施网</b><small>通道枢纽园区 · 资源底座</small></span></div>
              </div>
              <div class="platform-city-strip"><span>覆盖区域</span><div id="province-city-strip"></div></div>
              <button class="platform-return" type="button" data-return-national><span>↺</span> 返回全国平台总览</button>
            </section>
            <button class="province-return-fab" type="button" data-return-national aria-label="返回全国">
              <span>←</span><b>返回全国</b><small>NATIONAL VIEW</small>
            </button>
            <section class="story-hud" id="story-hud" aria-live="polite" aria-hidden="true">
              <header>
                <span class="story-index" id="story-index">00 / STORY</span>
                <span class="story-live"><i></i><b id="story-state">AUTO PLAY</b></span>
              </header>
              <h3 id="story-title">一单贯穿三网</h3>
              <p id="story-subtitle">数字驱动运营，运营调度资源，设施承载物流</p>
              <div class="story-shipment" id="story-shipment"></div>
              <div class="story-actors" id="story-actors" aria-label="当前参与主体"></div>
              <div class="story-metrics" id="story-metrics"></div>
              <div class="story-stage-track" id="story-stage-track"></div>
              <div class="story-progress"><i id="story-progress-bar"></i></div>
              <footer>
                <span id="story-time">00:00 / 01:12</span>
                <div><button id="story-follow" type="button" title="跟随业务镜头；拖拽或滚轮可改为自由视角">◎ 跟随动画</button><button id="story-control" type="button">Ⅱ 暂停</button><button id="story-exit" type="button">退出流程</button></div>
              </footer>
            </section>
            ${renderOperationWorkspace()}
            ${renderInfrastructureWorkspace()}
            ${renderDigitalWorkspace()}
            ${renderExplodedWorkspace()}
            <div class="north-indicator" aria-hidden="true"><i></i><b>N</b></div>

            <div class="stack-layer-labels" aria-label="三网快速切换">
              <button class="stack-layer-label digital" data-map-state="FOCUS_DIGITAL">
                ${renderLayerIcon(STACK_LABEL_ICONS.digital.tone, STACK_LABEL_ICONS.digital.icon, { size: 'sm' })}
                <span><b>数字物流网</b><small>DIGITAL NETWORK</small></span><i></i>
              </button>
              <button class="stack-layer-label operation" data-map-state="FOCUS_OPERATION">
                ${renderLayerIcon(STACK_LABEL_ICONS.operation.tone, STACK_LABEL_ICONS.operation.icon, { size: 'sm' })}
                <span><b>物流运营网</b><small>OPERATION NETWORK</small></span><i></i>
              </button>
              <button class="stack-layer-label infrastructure" data-map-state="FOCUS_INFRA">
                ${renderLayerIcon(STACK_LABEL_ICONS.infrastructure.tone, STACK_LABEL_ICONS.infrastructure.icon, { size: 'sm' })}
                <span><b>基础设施网</b><small>INFRASTRUCTURE</small></span><i></i>
              </button>
            </div>

            <aside class="drawer left-drawer" id="left-drawer" aria-label="图层控制">
              <button class="drawer-handle" id="left-drawer-close" aria-label="关闭图层抽屉">‹</button>
              <div class="drawer-kicker" id="layer-drawer-en">INFRASTRUCTURE</div>
              <h3 id="layer-drawer-title">基础设施网</h3>
              <p class="drawer-lead" id="layer-drawer-lead">国家物流运行所依托的通道、设施与枢纽骨架</p>
              <div id="layer-controls" class="layer-controls"></div>
              <div id="route-browser" class="route-browser"></div>
            </aside>

            <aside class="drawer right-drawer" id="right-drawer" aria-label="对象详情" aria-live="polite">
              <button class="drawer-close" id="right-drawer-close" aria-label="关闭详情">×</button>
              <div id="detail-content"></div>
            </aside>

            <div class="network-legend" aria-label="战略骨架图例">
              <button data-legend-filter="axes" class="is-on"><i class="legend-line axis"></i><span><b>六轴</b><small>核心城市群主轴</small></span></button>
              <button data-legend-filter="corridors" class="is-on"><i class="legend-line corridor"></i><span><b>七廊</b><small>国家级物流走廊</small></span></button>
              <button data-legend-filter="channels" class="is-on"><i class="legend-line channel"></i><span><b>八通道</b><small>轴廊衔接通道</small></span></button>
            </div>

            <div class="south-sea-inset" aria-label="南海诸岛附图">
              <div class="inset-title"><span>南海诸岛</span></div>
              <svg viewBox="0 0 160 214" role="img" aria-label="东沙、西沙、中沙、南沙群岛及黄岩岛、曾母暗沙位置关系示意">
                <defs>
                  <filter id="south-sea-glow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="1.15" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <rect class="inset-frame" x="5" y="5" width="150" height="204" rx="6" />
                <g class="inset-grid" aria-hidden="true">
                  <path d="M55 6V208M105 6V208M6 55H154M6 106H154M6 157H154" />
                </g>
                <g class="boundary-dashes" aria-label="南海断续线示意">
                  <path d="M132 25l-4 13"/><path d="M128 50l-6 13"/><path d="M123 76l-7 14"/>
                  <path d="M119 104l-7 14"/><path d="M109 134l-9 13"/><path d="M91 171l-12 8"/>
                  <path d="M61 190l-14 3"/><path d="M29 162l-2-13"/><path d="M24 119l1-13"/>
                </g>
                <g class="island-groups" filter="url(#south-sea-glow)">
                  <g aria-label="东沙群岛"><path d="M100 29q5-3 9 1q-4 4-9 1z"/><circle cx="105" cy="30" r="1.2"/></g>
                  <g aria-label="西沙群岛"><path d="M45 67l4-3 3 2-3 3zM54 73l3-3 3 2-2 3zM59 63l3-2 2 2-3 2z"/></g>
                  <g aria-label="中沙群岛"><circle cx="78" cy="82" r="1.1"/><circle cx="83" cy="87" r=".9"/><circle cx="75" cy="91" r=".8"/></g>
                  <g aria-label="黄岩岛"><path d="M112 87q4-4 7 0q-3 4-7 1z"/></g>
                  <g aria-label="南沙群岛">
                    <path d="M57 126l3-2 2 2-3 2zM70 132l3-2 2 2-3 2zM84 125l3-2 2 2-3 2z"/>
                    <path d="M49 143l3-2 2 2-3 2zM64 151l3-2 2 2-3 2zM79 145l3-2 2 2-3 2zM94 154l3-2 2 2-3 2z"/>
                    <path d="M58 166l3-2 2 2-3 2zM75 173l3-2 2 2-3 2zM90 166l3-2 2 2-3 2z"/>
                  </g>
                  <g aria-label="曾母暗沙"><circle cx="58" cy="196" r="1.8"/><path d="M54 196h8M58 192v8"/></g>
                </g>
                <g class="island-labels" aria-hidden="true">
                  <text x="92" y="22">东沙群岛</text><text x="30" y="59">西沙群岛</text>
                  <text x="66" y="78">中沙群岛</text><text x="119" y="91">黄岩岛</text>
                  <text x="67" y="119">南沙群岛</text><text x="64" y="202">曾母暗沙</text>
                </g>
              </svg>
              <span class="inset-note">位置关系示意 · 非航海用途</span>
            </div>

            <div id="map-tooltip" class="map-tooltip" role="tooltip"><b></b><span></span></div>
            <div class="map-loading" id="map-loading">
              <div class="loading-mark"><span></span><span></span><span></span></div>
              <strong>正在构建国家物流空间</strong>
              <small>LOADING SPATIAL NETWORK</small>
            </div>
          </div>
        </section>

        <footer class="statusbar">
          <div class="status-context"><span class="status-pulse"></span><strong id="spatial-context">全国视角</strong><span class="chevron">/</span><span id="lod-status">LOD 0</span></div>
          <div class="status-items">
            <span class="status-objects"><i>对象</i><b id="object-count">—</b></span>
            <span class="status-time"><i>数据更新时间</i><b id="data-time">--:--:--</b></span>
            <span class="status-source"><i>数据源</i><b id="data-source">本地业务数据</b></span>
            <span class="service-ok"><i class="status-pulse"></i>服务状态正常</span>
          </div>
          <button id="status-reset"><span>↺</span> 返回全国</button>
        </footer>
      </main>`;
  }

  bindRuntime(runtime, data) {
    this.runtime = runtime;
    this.data = data;
    const facilityCount = data.infrastructure?.facilities?.layers?.reduce((total, layer) => total + layer.count, 0) ?? 0;
    this.root.querySelector('#object-count').textContent = (data.entities.length + facilityCount).toLocaleString('zh-CN');
    this.root.querySelector('#data-source').textContent = data.source === 'api' ? '实时接口 + 本地基础层' : data.source === 'local-fallback' ? '接口回退 + 本地基础层' : '本地业务数据 + 本地基础层';
    this.refreshInfrastructureCockpit();
  }

  bindStaticEvents() {
    this.root.addEventListener('click', (event) => {
      const layerMaster = event.target.closest('#layer-controls [data-layer-toggle-all]');
      if (layerMaster) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleAllLayerElements(layerMaster.dataset.layerToggleAll);
        return;
      }
      const layerRow = event.target.closest('#layer-controls .layer-row');
      if (layerRow) {
        const input = layerRow.querySelector('[data-layer-filter]');
        if (input && this.runtime) {
          event.preventDefault();
          event.stopPropagation();
          input.checked = !input.checked;
          this.applySingleLayerFilter(input);
        }
        return;
      }
      const modeButton = event.target.closest('[data-map-state]');
      if (modeButton && this.runtime) {
        this.runtime.setState(modeButton.dataset.mapState);
        return;
      }
      const explodedFocus = event.target.closest('[data-exploded-focus]');
      if (explodedFocus && this.runtime) {
        event.preventDefault();
        const focus = explodedFocus.dataset.explodedFocus;
        this.setExplodedLayerFocus(focus === 'all' ? null : focus, { pin: true });
        return;
      }
      const legendButton = event.target.closest('[data-legend-filter]');
      if (legendButton && this.runtime) {
        legendButton.classList.toggle('is-on');
        const enabled = legendButton.classList.contains('is-on');
        this.runtime.setLayerFilter('infrastructure', legendButton.dataset.legendFilter, enabled);
        const drawerInput = this.root.querySelector(`#layer-controls input[data-layer="infrastructure"][data-layer-filter="${legendButton.dataset.legendFilter}"]`);
        if (drawerInput) drawerInput.checked = enabled;
        this.updateLayerMasterControl('infrastructure');
      }
      const routeButton = event.target.closest('[data-route-id]');
      if (routeButton && this.runtime) this.runtime.focusRoute(routeButton.dataset.routeId);
      const entityButton = event.target.closest('[data-entity-id]');
      if (entityButton && this.runtime) this.runtime.selectEntity(entityButton.dataset.entityId);
      const provinceButton = event.target.closest('[data-province-name]');
      if (provinceButton && this.runtime) {
        this.runtime.drillProvince(provinceButton.dataset.provinceName);
        this.closeSearch();
      }
      const taskButton = event.target.closest('[data-task-id]');
      if (taskButton && this.runtime) this.runtime.selectTask(taskButton.dataset.taskId);
      // NOTE: #map-stage carries data-operation-mode / data-infra-mode / data-digital-mode
      // attributes for CSS. Scope these to <button> so map-canvas clicks (which live inside
      // #map-stage) are never mistaken for a mode button click.
      const operationModeButton = event.target.closest('button[data-operation-mode]');
      if (operationModeButton && this.runtime) this.setOperationMode(operationModeButton.dataset.operationMode);
      const operationRankButton = event.target.closest('button[data-operation-rank-tab]');
      if (operationRankButton) this.setOperationRankTab(operationRankButton.dataset.operationRankTab);
      const infraModeButton = event.target.closest('button[data-infra-mode]');
      if (infraModeButton && this.runtime) this.setInfrastructureMode(infraModeButton.dataset.infraMode);
      const infraMapButton = event.target.closest('[data-infra-map]');
      if (infraMapButton && this.runtime) {
        const action = infraMapButton.dataset.infraMap;
        if (action === 'zoom-in') this.runtime.nudgeCameraZoom(0.82);
        else if (action === 'zoom-out') this.runtime.nudgeCameraZoom(1.22);
        else if (action === 'locate') this.runtime.resetProvinceFraming();
        else if (action === 'layers') this.toggleInfraMapLegend();
      }
      const infraRankButton = event.target.closest('button[data-infra-rank-tab]');
      if (infraRankButton) this.setInfrastructureRankTab(infraRankButton.dataset.infraRankTab);
      const digitalModeButton = event.target.closest('button[data-digital-mode]');
      if (digitalModeButton && this.runtime) this.setDigitalMode(digitalModeButton.dataset.digitalMode);
      const operationTaskButton = event.target.closest('[data-operation-task]');
      if (operationTaskButton && this.runtime) this.runtime.focusOperationTask(operationTaskButton.dataset.operationTask);
      const operationPenetrateButton = event.target.closest('[data-operation-penetrate]');
      if (operationPenetrateButton && this.runtime) this.runtime.focusOperationTask(operationPenetrateButton.dataset.operationPenetrate, { openDrawer: false });
      if (event.target.closest('[data-operation-clear-task]') && this.runtime) this.runtime.clearOperationTask();
      const facilityButton = event.target.closest('[data-infrastructure-feature-id]');
      if (facilityButton && this.runtime) {
        const feature = this.findInfrastructureFeature(facilityButton.dataset.infrastructureFeatureId);
        if (feature) this.runtime.selectInfrastructureFeature(feature);
      }
      const layerJump = event.target.closest('[data-layer-jump]');
      if (layerJump && this.runtime) this.runtime.focusEntityLayer(layerJump.dataset.layerJump);
      const storyLaunch = event.target.closest('[data-story-id]');
      if (storyLaunch && this.runtime) this.runtime.toggleStory(storyLaunch.dataset.storyId);
      if (event.target.closest('#story-control') && this.runtime) this.runtime.toggleStory();
      if (event.target.closest('#story-follow') && this.runtime) this.runtime.story?.toggleCameraFollow();
      if (event.target.closest('#story-exit') && this.runtime) this.runtime.stopStory();
      if (event.target.closest('#penetration-action') && this.runtime) this.runtime.activatePenetration();
      if (event.target.closest('#right-drawer-close')) this.closeRightDrawer();
      // 单层页收起图层抽屉只是收起面板，不再跳到三层分解。
      if (event.target.closest('#left-drawer-close')) this.root.querySelector('#left-drawer')?.classList.remove('is-open');
      if (event.target.closest('#reset-view')) this.runtime?.resetView();
      if (event.target.closest('#status-reset')) this.runtime?.returnFromProvince();
      if (event.target.closest('#fullscreen')) this.toggleFullscreen();
      if (event.target.closest('[data-return-national]')) this.runtime?.returnFromProvince();
    });
    this.root.addEventListener('change', (event) => {
      const input = event.target.closest('#layer-controls [data-layer-filter]');
      if (!input || !this.runtime) return;
      if (input.closest('.layer-row')) return;
      this.applySingleLayerFilter(input);
    });

    const search = this.root.querySelector('#global-search');
    search.addEventListener('input', () => this.renderSearch(search.value));
    search.addEventListener('focus', () => this.renderSearch(search.value));
    search.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeSearch();
      if (event.key === 'Enter') this.root.querySelector('#search-results button')?.click();
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.search-box')) this.closeSearch();
    });
    window.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        search.focus();
      }
    });

    this.root.addEventListener('pointerover', (event) => {
      const card = event.target.closest('#exploded-workspace [data-exploded-focus]');
      if (!card || !this.runtime || card.dataset.explodedFocus === 'all') return;
      if (this.explodedPinnedFocus) return;
      this.setExplodedLayerFocus(card.dataset.explodedFocus, { pin: false });
    });
    this.root.addEventListener('pointerout', (event) => {
      const card = event.target.closest('#exploded-workspace [data-exploded-focus]');
      if (!card || card.dataset.explodedFocus === 'all') return;
      const next = event.relatedTarget?.closest?.('#exploded-workspace [data-exploded-focus]');
      if (next && next !== card) return;
      if (this.explodedPinnedFocus) return;
      this.setExplodedLayerFocus(null, { pin: false });
    });
  }

  setExplodedLayerFocus(focus = null, { pin = false } = {}) {
    if (pin) this.explodedPinnedFocus = focus;
    const active = pin ? focus : (this.explodedPinnedFocus ?? focus);
    this.runtime?.setExplodedLayerFocus?.(active);
    this.root.querySelectorAll('#exploded-workspace [data-exploded-focus]').forEach((el) => {
      const id = el.dataset.explodedFocus;
      const isRestore = id === 'all';
      el.classList.toggle('is-active', isRestore ? !active : Boolean(active) && id === active);
      el.classList.toggle('is-dimmed', Boolean(active) && !isRestore && id !== active);
    });
  }

  updateMode(state, layer, context = {}) {
    this.root.querySelectorAll('[data-map-state]').forEach((button) => button.classList.toggle('is-active', button.dataset.mapState === state));
    const stage = this.root.querySelector('#map-stage');
    const inProvince = Boolean(this.runtime?.selectedProvince);
    const provinceCockpit = (state === MAP_STATES.FOCUS_OPERATION && this.runtime?.provinceOperationView)
      || (state === MAP_STATES.FOCUS_INFRA && this.runtime?.provinceInfrastructureView)
      || (state === MAP_STATES.FOCUS_DIGITAL && this.runtime?.provinceDigitalView);
    const cockpitPage = (
      (!inProvince && [MAP_STATES.FOCUS_OPERATION, MAP_STATES.FOCUS_INFRA, MAP_STATES.FOCUS_DIGITAL].includes(state))
      || provinceCockpit
    )
      && !context.story
      && !this.runtime?.story?.active
      && !this.runtime?.story?.completed;
    const shell = this.root.querySelector('.app-shell');
    shell?.classList.toggle('operation-page', cockpitPage);
    shell?.classList.toggle('infra-page', cockpitPage && layer === 'infrastructure');
    shell?.classList.toggle('digital-page', cockpitPage && layer === 'digital');
    const explodedPage = state === MAP_STATES.EXPLODED
      && !inProvince
      && !context.story
      && !this.runtime?.story?.active
      && !this.runtime?.story?.completed;
    shell?.classList.toggle('exploded-page', explodedPage);
    stage.classList.toggle('exploded-page', explodedPage);
    // 首页 = 平台开场页：左侧极简文案 + 轻量状态栏，其余面板全部收起。
    // 该类只在全国首页出现，省级、单层页、三层分解与业务流程都不受影响。
    const homePage = state === MAP_STATES.COMBINED
      && !inProvince
      && !context.story
      && !this.runtime?.story?.active
      && !this.runtime?.story?.completed;
    shell?.classList.toggle('home-page', homePage);
    stage.classList.toggle('home-page', homePage);
    if (!explodedPage && this.explodedPinnedFocus) {
      this.explodedPinnedFocus = null;
      this.setExplodedLayerFocus(null, { pin: false });
    }
    const heading = layer === 'infrastructure'
      ? (this.getInfrastructureDashboard()?.heading ?? NETWORK_HEADINGS.infrastructure)
      : layer === 'operation'
        ? (this.getOperationDashboard()?.heading ?? NETWORK_HEADINGS.operation)
        : layer === 'digital' && this.getDigitalDashboard()?.layout === 'provincial'
          ? this.getDigitalDashboard().heading
          : NETWORK_HEADINGS[layer];
    if (heading) {
      this.root.querySelector('#network-page-title').textContent = heading[0];
      this.root.querySelector('#network-page-lead').textContent = heading[1];
    }
    const search = this.root.querySelector('#global-search');
    if (search) {
      search.placeholder = layer === 'operation'
        ? '搜索枢纽、线路、任务...'
        : layer === 'digital'
          ? '搜索主体、数据、事件...'
          : '搜索枢纽、园区、公路、铁路或通道';
    }
    stage.classList.remove('view-combined', 'view-exploded', 'view-focus', 'focus-infrastructure', 'focus-operation', 'focus-digital');
    stage.classList.add(state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION ? 'view-exploded' : stateToVisualClass(state));
    if (layer) stage.classList.add('view-focus', `focus-${layer}`);
    const titles = {
      // 首页是平台开场页：左侧只留极简文案，网络构成由 .caption-networks 一行承载。
      [MAP_STATES.COMBINED]: ['全国物流网络', '34 个省级区域'],
      [MAP_STATES.EXPLODED]: ['全国物流网络三层协同关系', '基础设施支撑运营协同 · 运营过程沉淀数字能力 · 数字能力反哺全网优化'],
      [MAP_STATES.PENETRATION]: ['统一实体三层视图', '基础设施网 · 物流运营网 · 数字物流网'],
      [MAP_STATES.TASK_TRACE]: ['运输任务链路', '基础设施记录 · 运营记录 · 数字事件记录'],
    };
    const provinceName = context.province ?? this.spatialContext;
    let title = layer ? [`${layerLabels[layer][0]} · 单层分析`, this.layerLead(layer)] : titles[state] ?? titles[MAP_STATES.COMBINED];
    if (context.operationTaskId) title = ['运输任务穿透', '当前任务链路高亮 · 关联节点与运力同步展开'];
    if (provinceName) {
      const cityCount = this.provinceSummary?.cityCount ?? this.data?.provinceBoundaries?.provinces?.[provinceName]?.cities?.length ?? 0;
      const regionalTitles = {
        [MAP_STATES.COMBINED]: [`${provinceName}省级物流平台`, `${cityCount} 个地市级边界 · 3 个物流网络图层`],
        [MAP_STATES.EXPLODED]: [`${provinceName}省级物流平台`, `${cityCount} 个地市级边界 · 3 个物流网络图层 · 三层视图`],
        [MAP_STATES.PENETRATION]: [`${provinceName}省级物流平台`, `${cityCount} 个地市级边界 · 统一实体三层数据`],
        [MAP_STATES.TASK_TRACE]: [`${provinceName}省级物流平台`, `${cityCount} 个地市级边界 · 运输任务链路`],
      };
      title = layer
        ? [`${provinceName} · ${layerLabels[layer][0]}`, `${cityCount} 个地市级边界`]
        : regionalTitles[state] ?? regionalTitles[MAP_STATES.COMBINED];
    }
    if (!this.runtime?.story?.active && !this.runtime?.story?.completed) {
      this.root.querySelector('#scene-title').textContent = title[0];
      this.root.querySelector('#scene-subtitle').textContent = title[1];
      this.root.querySelector('#caption-index').textContent = provinceName ? '02 / PROVINCIAL PLATFORM VIEW' : '01 / NATIONAL PLATFORM VIEW';
    }
    this.currentLayer = layer;
    const drawer = this.root.querySelector('#left-drawer');
    const showLayerDrawer = Boolean(layer) && (!inProvince || provinceCockpit);
    drawer.classList.toggle('is-open', showLayerDrawer);
    if (showLayerDrawer) this.renderLayerDrawer(layer);
    if (showLayerDrawer && layer === 'operation') this.setOperationMode(this.operationMode, { syncRuntime: false });
    if (showLayerDrawer && layer === 'infrastructure') this.setInfrastructureMode(this.infrastructureMode, { syncRuntime: false });
    if (showLayerDrawer && layer === 'digital') this.setDigitalMode(this.digitalMode, { syncRuntime: false });
  }

  layerLead(layer) {
    if (layer === 'infrastructure' && this.getInfrastructureDashboard()?.layout === 'provincial') {
      return '看省内骨架、枢纽分布与对外通达';
    }
    if (layer === 'digital' && this.getDigitalDashboard()?.layout === 'provincial') {
      return this.getDigitalDashboard().lead ?? '看省内地市连接、数据共享与出省通道协同';
    }
    return {
      infrastructure: '查看战略骨架、主要交通线网、物流枢纽、冷链基地与规模园区',
      operation: '实时观察货物流向、运力状态、运输任务与风险异常',
      digital: '洞察主体接入、数据流通、可信授权、事件协同与智能应用',
    }[layer];
  }

  renderLayerDrawer(layer) {
    const [title, en] = layerLabels[layer];
    this.root.querySelector('#layer-drawer-title').textContent = layer === 'operation' ? '物流运营网络分析' : title;
    this.root.querySelector('#layer-drawer-en').textContent = layer === 'operation' ? 'OPERATION COCKPIT' : en;
    this.root.querySelector('#layer-drawer-lead').textContent = this.layerLead(layer);
    if (layer === 'operation') {
      this.renderOperationDrawer();
      return;
    }
    if (layer === 'infrastructure') {
      this.renderInfrastructureDrawer();
      return;
    }
    if (layer === 'digital') {
      this.renderDigitalDrawer();
      return;
    }
    const infrastructure = this.data?.infrastructure;
    const groups = layer === 'infrastructure' ? [
      { title: '战略骨架', note: '概化线路', items: layerCatalog.infrastructure },
      {
        title: '主要交通线网', note: 'WGS84',
        items: (infrastructure?.transport?.layers ?? []).map((item) => ({
          ...item,
          count: item.featureCount,
          enabled: true,
        })),
      },
      { title: '物流设施点', note: 'WGS84', items: infrastructure?.facilities?.layers ?? [] },
    ] : [{ items: layerCatalog[layer] }];
    const renderItem = (item) => {
      const enabled = this.runtime?.layers[layer]?.filters?.[item.id] ?? item.enabled ?? true;
      const transportClass = ['majorRoads', 'majorRailways'].includes(item.id) ? `transport ${item.id}` : '';
      const facilityIcon = layer === 'infrastructure' ? FACILITY_TOGGLE_ICONS[item.id] : undefined;
      const facilityClass = facilityIcon ? `facility ${item.id}` : '';
      return renderLayerRow({
        layer,
        id: item.id,
        label: item.label,
        count: item.count ?? 0,
        symbolClass: `${layer} ${transportClass} ${facilityClass}`,
        symbolIcon: facilityIcon ?? '',
        enabled,
        color: item.color,
      });
    };
    const allItems = groups.flatMap((group) => group.items);
    const anyEnabled = allItems.some((item) => this.runtime?.layers[layer]?.filters?.[item.id] ?? item.enabled ?? true);
    this.root.querySelector('#layer-controls').innerHTML = `
      <div class="layer-master-row"><b>图层元素</b>${renderLayerMasterControl(layer, anyEnabled)}</div>
      ${groups.map((group) => `
      <section class="layer-control-group">
        ${group.title ? `<header><b>${escapeHtml(group.title)}</b><small>${escapeHtml(group.note)}</small></header>` : ''}
        ${group.items.map(renderItem).join('')}
      </section>`).join('')}`;
    const routeBrowser = this.root.querySelector('#route-browser');
    if (layer !== 'infrastructure') {
      routeBrowser.innerHTML = `<div class="drawer-callout"><span>LIVE NETWORK</span><b>${layer === 'operation' ? '22 个运营节点 · 35 条业务关系' : '23 个数字节点 · 30 条可信关系'}</b><p>远景呈现全国骨干，拉近后按 LOD 展开接入节点、服务与协同链路。</p></div>`;
      return;
    }
    routeBrowser.innerHTML = ['axis', 'corridor', 'channel'].map((type) => {
      const items = this.data?.routes.filter((route) => route.type === type) ?? [];
      return `<section class="route-section"><header><b>${{ axis: '六轴', corridor: '七廊', channel: '八通道' }[type]}</b><small>${items.length.toString().padStart(2, '0')}</small></header><div>${items.map((route) => `<button data-route-id="${route.id}"><span>${route.id}</span>${escapeHtml(route.name)}</button>`).join('')}</div></section>`;
    }).join('');
  }

  getOperationDashboard() {
    return this.provinceDashboard ?? this.data?.operationDashboard ?? operationDashboard;
  }

  getInfrastructureDashboard() {
    return this.provinceInfrastructureDashboard ?? this.data?.infrastructureDashboard ?? infrastructureDashboard;
  }

  refreshOperationCockpit() {
    const dashboard = this.getOperationDashboard();
    const workspace = this.root.querySelector('#operation-workspace');
    if (workspace) workspace.innerHTML = renderOperationWorkspaceInner(dashboard);
    if (this.currentLayer === 'operation') {
      this.renderOperationDrawer();
      this.setOperationMode(this.operationMode, { syncRuntime: false });
    }
  }

  refreshInfrastructureCockpit() {
    const dashboard = this.getInfrastructureDashboard();
    const workspace = this.root.querySelector('#infrastructure-workspace');
    if (workspace) workspace.innerHTML = renderInfrastructureWorkspaceInner(dashboard);
    if (this.currentLayer === 'infrastructure') {
      this.setInfrastructureMode(this.infrastructureMode, { syncRuntime: false });
      this.setInfrastructureRankTab(this.infrastructureRankTab);
    }
  }

  getDigitalDashboard() {
    return this.provinceDigitalDashboard ?? this.data?.digitalDashboard ?? digitalDashboard;
  }

  refreshDigitalCockpit() {
    const dashboard = this.getDigitalDashboard();
    const workspace = this.root.querySelector('#digital-workspace');
    if (workspace) workspace.innerHTML = renderDigitalWorkspaceInner(dashboard);
    if (this.currentLayer === 'digital') {
      this.renderDigitalDrawer();
      this.setDigitalMode(this.digitalMode, { syncRuntime: false });
    }
  }

  renderOperationDrawer() {
    const dashboard = this.getOperationDashboard();
    const primaryMetrics = dashboard.metrics.filter((metric) => metric.id !== 'alerts');
    const alertMetric = dashboard.metrics.find((metric) => metric.id === 'alerts');
    const scopeTitle = dashboard.scope ? `${dashboard.scope}运营概览` : '运营概览';
    const network = dashboard.liveNetwork;
    const liveItems = [
      ['hubs', '活跃枢纽', `${Number(network.activeHubs).toLocaleString('zh-CN')}`, '个'],
      ['links', '运行关系', `${Number(network.relations).toLocaleString('zh-CN')}`, '条'],
      ['vehicles', '在线车辆', `${Number(network.vehicles).toLocaleString('zh-CN')}`, '辆'],
      ['online', '在线率', network.onlineRate, ''],
    ];
    this.root.querySelector('#layer-controls').innerHTML = `
      <header class="operation-overview-head">
        ${panelIcon('truck')}<b>${escapeHtml(scopeTitle)}</b>
      </header>
      <nav class="operation-object-code" aria-label="运营对象快捷切换">
        <button type="button" data-operation-mode="cargo" title="货物流">货</button>
        <button type="button" data-operation-mode="tasks" title="运输任务">单</button>
        <button type="button" data-operation-mode="capacity" title="运力">运</button>
        <button type="button" data-operation-mode="multimodal" title="多式联运">联</button>
        <button type="button" data-operation-mode="overview" title="综合态势">态</button>
        <button type="button" data-operation-mode="alerts" title="异常">异</button>
      </nav>
      <div class="operation-index-card">
        <header><small>${escapeHtml(dashboard.indexLabel ?? '全国物流运行指数')}</small></header>
        <div>
          <b>${escapeHtml(dashboard.index.value)}<i>${escapeHtml(dashboard.index.grade)}</i></b>
          <svg viewBox="0 0 160 36" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="operation-trend-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#35b9ff" stop-opacity=".42"/><stop offset="1" stop-color="#35b9ff" stop-opacity="0"/></linearGradient></defs><path d="M0 28L16 25L32 26L48 20L64 21L80 14L96 16L112 10L128 12L144 6L160 8V36H0Z" fill="url(#operation-trend-fill)"/><polyline points="0,28 16,25 32,26 48,20 64,21 80,14 96,16 112,10 128,12 144,6 160,8" fill="none" stroke="#4ec8ff" stroke-width="1.8"/></svg>
        </div>
        <footer><em>同比 ${escapeHtml(dashboard.index.yoy ?? '+3.2%')}</em><span>较昨日 ${escapeHtml(dashboard.index.delta)}</span></footer>
      </div>
      <section class="operation-daily-section">
        <header><b>核心指标</b><small>REAL-TIME</small></header>
        <div class="operation-kpi-grid">
        ${primaryMetrics.map((metric) => `<button type="button" class="operation-kpi-card" data-operation-mode="${escapeHtml(metric.id)}">
          <i>${operationIcons[metric.id] ?? metric.icon}</i>
          <span><small>${escapeHtml(metric.note)}</small><b>${escapeHtml(metric.value)}<em>${escapeHtml(metric.unit)}</em></b><p>同比 <strong>${escapeHtml(metric.delta)}</strong></p></span>
        </button>`).join('')}
        </div>
      </section>
      <div class="operation-drawer-tail">
      <button type="button" class="operation-alert-summary" data-operation-mode="alerts">
        <i>${operationIcons.alerts}</i>
        <div>
          <header><span>当前异常</span></header>
          <b>${escapeHtml(alertMetric.value)}<em>${escapeHtml(alertMetric.unit)}</em></b>
        </div>
        <span>${dashboard.alertBreakdown.map((item) => `<small>${escapeHtml(item.label)} <b>${Number(item.value)}</b></small>`).join('')}</span>
      </button>
      <div class="operation-live-card">
        <header><b>实时运营网络</b><span><i></i>LIVE NETWORK</span></header>
        <div>${liveItems.map(([id, label, value, unit]) => `<span><i>${operationIcons[id]}</i><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}${unit ? `<em>${escapeHtml(unit)}</em>` : ''}</b></span>`).join('')}</div>
        <footer>数据更新时间：<b id="operation-drawer-time">--:--:--</b></footer>
      </div>
      </div>`;
    this.root.querySelector('#route-browser').innerHTML = '';
  }

  setOperationMode(mode = 'overview', { syncRuntime = true } = {}) {
    const dashboard = this.getOperationDashboard();
    const validMode = dashboard.modes.some((item) => item.id === mode) ? mode : 'overview';
    this.operationMode = validMode;
    this.root.querySelector('#map-stage')?.setAttribute('data-operation-mode', validMode);
    this.root.querySelectorAll('[data-operation-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.operationMode === validMode);
    });
    const summary = this.root.querySelector('#operation-mode-summary');
    const brief = dashboard.modeBriefs?.[validMode] ?? operationDashboard.modeBriefs.overview;
    if (summary) summary.innerHTML = renderOperationModeSummary(brief);
    if (validMode === 'cargo') this.setOperationRankTab('flows');
    if (validMode === 'capacity') this.setOperationRankTab('hubs');
    this.root.querySelectorAll('[data-operation-views]').forEach((section) => {
      section.hidden = !section.dataset.operationViews.split(/\s+/).includes(validMode);
    });
    if (syncRuntime) {
      this.closeRightDrawer();
      this.runtime?.setOperationViewMode(validMode);
    }
  }

  setOperationRankTab(tab = 'flows') {
    const validTab = tab === 'hubs' ? 'hubs' : 'flows';
    this.root.querySelectorAll('[data-operation-rank-tab]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.operationRankTab === validTab);
    });
    this.root.querySelectorAll('[data-operation-rank-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.operationRankPanel !== validTab;
    });
  }

  renderInfrastructureDrawer() {
    const dashboard = this.getInfrastructureDashboard();
    const provincial = dashboard.layout === 'provincial';
    const renderToggle = (item, layer = 'infrastructure') => {
      const enabled = this.runtime?.layers[layer]?.filters?.[item.id] ?? true;
      const transportClass = ['majorRoads', 'majorRailways', 'provincialBackbone', 'outboundChannels'].includes(item.id) ? `transport ${item.id}` : '';
      const isFacility = FACILITY_TOGGLE_ICONS[item.id] != null;
      const facilityClass = isFacility ? `facility ${item.id}` : '';
      return renderLayerRow({
        layer,
        id: item.id,
        label: item.label,
        symbolClass: `infrastructure ${transportClass} ${facilityClass}`,
        symbolIcon: isFacility ? FACILITY_TOGGLE_ICONS[item.id] : '',
        enabled,
      });
    };
    const toggles = dashboard.layerToggles;
    const lineToggles = provincial ? toggles.filter((item) => ['provincialBackbone', 'outboundChannels'].includes(item.id)) : toggles.filter((item) => ['majorRailways', 'majorRoads', 'axes', 'corridors', 'channels'].includes(item.id));
    const pointToggles = provincial ? toggles.filter((item) => !['provincialBackbone', 'outboundChannels'].includes(item.id)) : toggles.filter((item) => ['nationalHubs', 'coldChainBases', 'logisticsParks'].includes(item.id));
    const anyEnabled = [...lineToggles, ...pointToggles].some((item) => this.runtime?.layers.infrastructure?.filters?.[item.id] ?? true);
    this.root.querySelector('#layer-controls').innerHTML = `
      <header class="operation-overview-head">${panelIcon('warehouse')}<b>${escapeHtml(provincial ? '省级基础设施总览' : '基础设施总览')}</b></header>
      <div class="network-kpi-grid infra-kpi-grid">
        ${dashboard.overviewCards.map((card) => `<div class="network-kpi-card">
          ${metricIcon(card.id, card.label, { className: `network-kpi-icon ${escapeHtml(card.id)}` })}
          <span><small>${escapeHtml(card.label)}</small><b>${escapeHtml(card.value)}<em>${escapeHtml(card.unit)}</em></b></span>
        </div>`).join('')}
      </div>
      <section class="network-layer-section">
        <header><b>${provincial ? '图层控制' : '基础设施图层'}</b>${renderLayerMasterControl('infrastructure', anyEnabled)}</header>
        <div class="layer-control-group"><header><b>${escapeHtml(dashboard.lineGroupTitle ?? '主要交通线网')}</b><small>${provincial ? '省内' : 'WGS84'}</small></header>${lineToggles.map((item) => renderToggle(item)).join('')}</div>
        <div class="layer-control-group"><header><b>${escapeHtml(dashboard.pointGroupTitle ?? '物流设施点')}</b><small>${provincial ? '分析' : 'WGS84'}</small></header>${pointToggles.map((item) => renderToggle(item)).join('')}</div>
      </section>
      <section class="network-legend-card">
        <header><b>图层说明</b></header>
        <div>
          ${provincial ? `<span><i class="rail"></i>骨干</span><span><i class="road"></i>出省</span>
          <span><i class="hub"></i>城市</span><span><i class="park"></i>园区</span>` : `<span><i class="rail"></i>铁路</span><span><i class="road"></i>公路</span>
          <span><i class="hub"></i>枢纽</span><span><i class="park"></i>园区</span>`}
        </div>
      </section>`;
    this.root.querySelector('#route-browser').innerHTML = '';
  }

  renderDigitalDrawer() {
    const dashboard = this.getDigitalDashboard();
    const provincial = dashboard.layout === 'provincial';
    const live = dashboard.liveNetwork;
    const elements = provincial ? (dashboard.elements ?? []) : layerCatalog.digital;
    const anyEnabled = elements.some((item) => this.runtime?.layers.digital?.filters?.[item.id] ?? item.enabled ?? true);
    this.root.querySelector('#layer-controls').innerHTML = `
      <header class="operation-overview-head">${panelIcon('cloudDatabase')}<b>${provincial ? '省级网络概况' : '网络覆盖情况'}</b><small>${escapeHtml(provincial ? (dashboard.scope ?? '省内') : '全国')}</small></header>
      <div class="network-kpi-grid digital-kpi-grid${provincial ? ' is-provincial' : ''}">
        ${dashboard.overviewCards.map((card) => `<div class="network-kpi-card">
          ${metricIcon(card.id, card.label, { className: `network-kpi-icon ${escapeHtml(card.id)}` })}
          <span><small>${escapeHtml(card.label)}</small><b>${escapeHtml(card.value)}<em>${escapeHtml(card.unit)}</em></b></span>
        </div>`).join('')}
      </div>
      ${provincial ? '' : `<div class="digital-coverage-summary">
        ${(dashboard.coverage ?? []).map((item) => `<span><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}</b></span>`).join('')}
      </div>`}
      <section class="network-layer-section">
        <header><b>${provincial ? '省内要素分布' : '网络要素分布'}</b>${renderLayerMasterControl('digital', anyEnabled)}</header>
        ${elements.map((item) => {
          const enabled = this.runtime?.layers.digital?.filters?.[item.id] ?? item.enabled ?? true;
          const icon = DIGITAL_ELEMENT_ICONS[item.id];
          return renderLayerRow({
            layer: 'digital',
            id: item.id,
            label: item.label,
            count: item.count ?? 0,
            countLabel: item.countLabel,
            symbolClass: `digital${icon ? ' element' : ''}`,
            symbolIcon: icon ?? '',
            enabled,
          });
        }).join('')}
      </section>
      <div class="operation-live-card digital-live-card">
        <header><b>${provincial ? '省网运行状态' : '网络运行状态'}</b><span><i></i>${escapeHtml(live.status ?? '正常')}</span></header>
        <div>
          <span><small>在线主体</small><b>${Number(live.subjects ?? 0).toLocaleString('zh-CN')}<em>家</em></b></span>
          <span><small>运行服务</small><b>${Number(live.services ?? 0).toLocaleString('zh-CN')}<em>个</em></b></span>
          <span><small>今日调用</small><b>${escapeHtml(live.calls ?? '0')}<em>次</em></b></span>
        </div>
        <footer class="digital-live-meta">
          <span>数据更新时间 <b class="network-update-time">--:--:--</b></span>
          <span>更新及时率 <b>${escapeHtml(live.timeliness)}</b></span>
          <span>平均服务响应 <b>${escapeHtml(live.response)}</b></span>
        </footer>
      </div>`;
    this.root.querySelector('#route-browser').innerHTML = '';
  }

  applySingleLayerFilter(input) {
    const layer = input.dataset.layer;
    const filterId = input.dataset.layerFilter;
    const enabled = input.checked;
    input.closest('.layer-row')?.setAttribute('aria-checked', enabled ? 'true' : 'false');
    this.runtime?.setLayerFilter(layer, filterId, enabled);
    if (layer === 'infrastructure' && filterId === 'nationalHubs') {
      this.runtime?.setLayerFilter('infrastructure', 'hubs', enabled);
    }
    this.syncLegendFilter(filterId, enabled);
    this.updateLayerMasterControl(layer);
  }

  applyLayerFilterPreset(layer, enabledIds) {
    const enabled = new Set(enabledIds);
    const catalogIds = layer === 'infrastructure'
      ? (this.getInfrastructureDashboard()?.layout === 'provincial' ? PROVINCE_INFRA_FILTER_IDS : INFRA_FILTER_IDS)
      : (this.getDigitalDashboard()?.layout === 'provincial' ? PROVINCE_DIGITAL_FILTER_IDS : DIGITAL_FILTER_IDS);
    const inputIds = [...this.root.querySelectorAll(`#layer-controls input[data-layer="${layer}"][data-layer-filter]`)].map((input) => input.dataset.layerFilter);
    this.runtime?.beginFilterBatch?.();
    [...new Set([...catalogIds, ...inputIds])].forEach((id) => {
      const on = enabled.has(id);
      this.runtime?.setLayerFilter(layer, id, on);
      const input = this.root.querySelector(`#layer-controls input[data-layer="${layer}"][data-layer-filter="${id}"]`);
      if (input) {
        input.checked = on;
        input.closest('.layer-row')?.setAttribute('aria-checked', on ? 'true' : 'false');
      }
      if (layer === 'infrastructure') this.syncLegendFilter(id, on);
    });
    this.runtime?.endFilterBatch?.();
    this.updateLayerMasterControl(layer);
  }

  setInfrastructureMode(mode = 'overview', { syncRuntime = true } = {}) {
    const dashboard = this.getInfrastructureDashboard();
    const validMode = dashboard.modes.some((item) => item.id === mode) ? mode : 'overview';
    this.infrastructureMode = validMode;
    this.root.querySelector('#map-stage')?.setAttribute('data-infra-mode', validMode);
    this.root.querySelectorAll('[data-infra-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.infraMode === validMode);
    });
    if (syncRuntime) {
      this.closeRightDrawer();
      this.applyLayerFilterPreset('infrastructure', dashboard.modeFilters?.[validMode] ?? INFRA_MODE_FILTERS[validMode] ?? INFRA_FILTER_IDS);
    }
  }

  setInfrastructureRankTab(tab = 'hubs') {
    const dashboard = this.getInfrastructureDashboard();
    const validTab = dashboard.rankingTabs.some((item) => item.id === tab) ? tab : (dashboard.rankingTabs[0]?.id ?? 'hubs');
    this.infrastructureRankTab = validTab;
    this.root.querySelectorAll('[data-infra-rank-tab]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.infraRankTab === validTab);
    });
    this.root.querySelectorAll('[data-infra-rank-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.infraRankPanel !== validTab;
    });
  }

  setDigitalMode(mode = 'overview', { syncRuntime = true } = {}) {
    const dashboard = this.getDigitalDashboard();
    const validMode = dashboard.modes.some((item) => item.id === mode) ? mode : 'overview';
    this.digitalMode = validMode;
    this.root.querySelector('#map-stage')?.setAttribute('data-digital-mode', validMode);
    this.root.querySelectorAll('[data-digital-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.digitalMode === validMode);
    });
    if (syncRuntime) {
      this.closeRightDrawer();
      const preset = dashboard.layout === 'provincial'
        ? (PROVINCE_DIGITAL_MODE_FILTERS[validMode] ?? PROVINCE_DIGITAL_FILTER_IDS)
        : (DIGITAL_MODE_FILTERS[validMode] ?? DIGITAL_FILTER_IDS);
      this.applyLayerFilterPreset('digital', preset);
    }
  }

  getActiveWorkspace() {
    if (this.currentLayer === 'infrastructure') return this.root.querySelector('#infrastructure-workspace');
    if (this.currentLayer === 'digital') return this.root.querySelector('#digital-workspace');
    return this.root.querySelector('#operation-workspace');
  }

  toggleAllLayerElements(layer) {
    const inputs = [...this.root.querySelectorAll(`#layer-controls input[data-layer="${layer}"][data-layer-filter]`)];
    if (!inputs.length) return;
    const enableAll = inputs.every((input) => !input.checked);
    const filterIds = inputs.map((input) => input.dataset.layerFilter);
    this.runtime?.setLayerFilters(layer, filterIds, enableAll);
    if (layer === 'infrastructure' && filterIds.includes('nationalHubs')) {
      this.runtime?.setLayerFilter('infrastructure', 'hubs', enableAll);
    }
    inputs.forEach((input) => {
      input.checked = enableAll;
      input.closest('.layer-row')?.setAttribute('aria-checked', enableAll ? 'true' : 'false');
      this.syncLegendFilter(input.dataset.layerFilter, enableAll);
    });
    this.updateLayerMasterControl(layer);
  }

  updateLayerMasterControl(layer) {
    const button = this.root.querySelector(`#layer-controls [data-layer-toggle-all="${layer}"]`);
    if (!button) return;
    const inputs = [...this.root.querySelectorAll(`#layer-controls input[data-layer="${layer}"][data-layer-filter]`)];
    const anyEnabled = inputs.some((input) => input.checked);
    button.classList.toggle('is-all-off', !anyEnabled);
    button.setAttribute('aria-pressed', anyEnabled ? 'true' : 'false');
    button.setAttribute('aria-label', `${anyEnabled ? '关闭' : '开启'}当前层全部图层元素`);
    const icon = button.querySelector('i');
    const label = button.querySelector('b');
    if (icon) icon.textContent = anyEnabled ? '⊘' : '◎';
    if (label) label.textContent = anyEnabled ? '全部关闭' : '全部开启';
  }

  syncLegendFilter(filterId, enabled) {
    const legend = this.root.querySelector(`[data-legend-filter="${filterId}"]`);
    legend?.classList.toggle('is-on', enabled);
  }

  toggleInfraMapLegend() {
    const legend = this.getActiveWorkspace()?.querySelector('.infra-map-legend');
    if (!legend) return;
    legend.classList.toggle('is-collapsed');
  }

  openDigitalEntity(entity) {
    const metrics = entity.digital ?? {};
    const roleLabel = digitalRoleLabels[entity.networkRole] ?? '数字物流节点';
    const technicalNote = entity.networkRole === 'trusted-space'
      ? '技术实现：可信数据空间与用途授权控制'
      : entity.networkRole === 'event'
        ? '技术实现：基于 EPCIS 标准汇聚物流动态'
        : entity.networkRole === 'agent'
          ? '技术实现：AI 分析与智能服务编排'
          : '服务数据由全国数字物流网络实时汇聚';
    this.openRightDrawer(`
      <div class="detail-kicker accent">DIGITAL LOGISTICS NETWORK</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(entity.name)}</h3><p>${escapeHtml(entity.province)} · ${escapeHtml(roleLabel)}</p></div><span class="live-chip"><i></i>运行正常</span></div>
      <div class="digital-entity-metrics">
        <span><small>接入企业</small><b>${Number(metrics.entities ?? 86).toLocaleString('zh-CN')}<em>家</em></b></span>
        <span><small>接入系统</small><b>${Number(metrics.systems ?? metrics.connectors ?? 24).toLocaleString('zh-CN')}<em>个</em></b></span>
        <span><small>可用数据</small><b>${Number(metrics.resources ?? 126).toLocaleString('zh-CN')}<em>项</em></b></span>
        <span><small>今日服务调用</small><b>${escapeHtml(metrics.serviceCalls ?? '1.8万')}<em>次</em></b></span>
        <span><small>今日数据共享</small><b>${escapeHtml(metrics.shares ?? '0.6万')}<em>次</em></b></span>
        <span><small>网络运行状态</small><b class="is-normal">正常</b></span>
      </div>
      <section class="entity-overview"><h4>节点服务说明</h4><p>${escapeHtml(technicalNote)}</p></section>`);
  }

  openProvinceDigitalEntity(node) {
    const metrics = node.metrics ?? {};
    const roleLabel = provinceDigitalRoleLabels[node.networkRole] ?? '省内数字物流节点';
    this.openRightDrawer(`
      <div class="detail-kicker accent">PROVINCIAL DIGITAL NETWORK</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(node.name)}</h3><p>${escapeHtml(node.province)}${escapeHtml(node.city)} · ${escapeHtml(roleLabel)}</p></div><span class="live-chip"><i></i>运行正常</span></div>
      <div class="digital-entity-metrics">
        <span><small>接入企业</small><b>${Number(metrics.entities ?? 0).toLocaleString('zh-CN')}<em>家</em></b></span>
        <span><small>接入系统</small><b>${Number(metrics.systems ?? 0).toLocaleString('zh-CN')}<em>个</em></b></span>
        <span><small>可用数据</small><b>${Number(metrics.resources ?? 0).toLocaleString('zh-CN')}<em>项</em></b></span>
        <span><small>今日服务调用</small><b>${escapeHtml(metrics.calls ?? '0')}万<em>次</em></b></span>
        <span><small>今日数据共享</small><b>${escapeHtml(metrics.shares ?? '0')}万<em>次</em></b></span>
        <span><small>网络运行状态</small><b class="is-normal">正常</b></span>
      </div>
      <section class="entity-overview"><h4>节点服务说明</h4><p>该节点已接入${escapeHtml(node.province)}数字物流网络，向省内主体提供数据共享与服务调用能力。</p></section>`);
  }

  openEntity(entity) {
    if (this.currentLayer === 'digital' || entity.layers?.includes('digital')) {
      this.openDigitalEntity(entity);
      return;
    }
    this.openRightDrawer(`
      <div class="detail-kicker">ENTITY / ${escapeHtml(entity.type).toUpperCase()}</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(entity.name)}</h3><p>${escapeHtml(entity.province)} · ${escapeHtml(entity.id)}</p></div><span class="verified-chip">已加载</span></div>
      <div class="coordinate-line"><span>坐标</span><b>${Number(entity.longitude).toFixed(2)}°E · ${Number(entity.latitude).toFixed(2)}°N</b></div>
      <div class="detail-metrics">
        <div><span>当前负荷</span><b>${entity.operation.load}<i>%</i></b></div>
        <div><span>在途任务</span><b>${entity.operation.tasks}<i>单</i></b></div>
        <div><span>数据连接</span><b>${entity.digital.connectors}<i>个</i></b></div>
      </div>
      ${this.currentLayer
        // 基础 / 运营 / 数字 单层页保持自成一体，不提供跨层穿透入口。
        ? `<section class="entity-overview"><h4>${escapeHtml(layerLabels[this.currentLayer][0])}实体摘要</h4><p>该对象已在${escapeHtml(layerLabels[this.currentLayer][0])}建立统一实体映射，指标随本网数据实时更新。</p></section>`
        : `<section class="entity-overview"><h4>统一实体摘要</h4><p>该对象已在基础设施、物流运营和数字物流三层建立统一实体映射，可进入垂直穿透视图。</p></section>
      <button class="primary-action" id="penetration-action"><span>↕</span><b>查看三层穿透</b><i>ENTER</i></button>`}
      <div class="source-note"><span>DATA PROVENANCE</span><p>${escapeHtml(entity.source_ref)} · ${escapeHtml(entity.verified_status)}</p></div>`);
  }

  openPenetration(entity) {
    if (!entity) return;
    this.openRightDrawer(`
      <div class="detail-kicker accent">VERTICAL PENETRATION</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(entity.name)}</h3><p>统一实体 ID · ${escapeHtml(entity.id)}</p></div><span class="live-chip"><i></i>已贯通</span></div>
      <div class="penetration-stack">
        ${this.penetrationCard('digital', '数字物流网', `${entity.digital.connectors} 个接入节点`, `API 健康度 ${entity.digital.apiHealth}%`, entity.digital.latestEvent)}
        <div class="stack-link"><i></i><span></span><i></i></div>
        ${this.penetrationCard('operation', '物流运营网', `${entity.operation.tasks} 项在途任务`, `负荷 ${entity.operation.load}%`, entity.operation.status)}
        <div class="stack-link"><i></i><span></span><i></i></div>
        ${this.penetrationCard('infrastructure', '基础设施网', entity.infrastructure.level, `${entity.infrastructure.lines} 条接入线路`, entity.infrastructure.status)}
      </div>
      <div class="source-note"><span>DATA PROVENANCE</span><p>实体穿透接口 /api/entities/${escapeHtml(entity.id)}/penetration</p></div>`);
  }

  penetrationCard(layer, title, main, sub, status) {
    return `<button class="penetration-card ${layer}" data-layer-jump="${layer}"><span class="card-index">${{ digital: '03', operation: '02', infrastructure: '01' }[layer]}</span><div><small>${title}</small><b>${escapeHtml(main)}</b><p>${escapeHtml(sub)} · ${escapeHtml(status)}</p></div><i>›</i></button>`;
  }

  openRoute(route) {
    const type = routeTypeLabels[route.type];
    this.openRightDrawer(`
      <div class="detail-kicker">STRATEGIC BACKBONE / ${escapeHtml(route.id)}</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(route.name)}</h3><p>国家综合立体交通网 · ${type}</p></div><span class="route-chip ${route.type}">${type}</span></div>
      <div class="route-code-hero"><span>${escapeHtml(route.id)}</span><div><small>线路类型</small><b>${type}</b></div><div><small>核验状态</small><b>概化</b></div></div>
      <section class="entity-overview"><h4>线路说明</h4><p>依据上传参考图中的主要节点概化绘制，用于验证战略骨架的分层、筛选与交互，不作为测绘或正式业务数据。</p></section>
      <div class="source-note"><span>REAL DATA ENDPOINT</span><p>GET /api/map/corridors · 支持版本与来源字段</p></div>`);
  }

  findInfrastructureFeature(featureId) {
    for (const layer of this.data?.infrastructure?.facilities?.layers ?? []) {
      const feature = layer.points.find((item) => item.id === featureId);
      if (feature) return feature;
    }
    return null;
  }

  openInfrastructureFeature(feature) {
    const sourceLayer = this.data?.infrastructure?.facilities?.layers?.find((layer) => layer.points.some((item) => item.id === feature.id));
    const [longitude, latitude] = feature.coordinates;
    this.openRightDrawer(`
      <div class="detail-kicker">INFRASTRUCTURE / ${escapeHtml(sourceLayer?.label ?? feature.category)}</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(feature.name)}</h3><p>${escapeHtml(feature.province)} · ${escapeHtml(feature.city)}</p></div><span class="verified-chip">本地数据</span></div>
      <div class="coordinate-line"><span>WGS84 坐标</span><b>${Number(longitude).toFixed(6)}°E · ${Number(latitude).toFixed(6)}°N</b></div>
      <div class="detail-metrics facility-metrics">
        <div><span>设施类型</span><b>${escapeHtml(sourceLayer?.label ?? '物流设施')}</b></div>
        <div><span>分类 / 批次</span><b>${escapeHtml(feature.category)}</b></div>
      </div>
      <section class="entity-overview"><h4>点位说明</h4><p>${escapeHtml(this.data?.infrastructure?.facilities?.meta?.note ?? '点位来自本地基础设施数据。')}</p></section>
      <div class="source-note"><span>DATA PROVENANCE</span><p>${escapeHtml(sourceLayer?.source ?? 'data/ 本地 GeoJSON')} · ${escapeHtml(feature.id)}</p></div>`);
  }

  openTask(task) {
    this.openRightDrawer(`
      <div class="detail-kicker accent">TASK TRACE / ${escapeHtml(task.id)}</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(task.name)}</h3><p>${escapeHtml(task.nodes.join(' → '))}</p></div><span class="live-chip"><i></i>${escapeHtml(task.status)}</span></div>
      <div class="task-progress"><header><span>任务进度</span><b>${task.progress}%</b></header><div><i style="width:${task.progress}%"></i></div><p>预计剩余 ${escapeHtml(task.eta)}</p></div>
      <div class="timeline">${task.events.map((event) => `<div><time>${escapeHtml(event.time)}</time><i></i><p><span>${escapeHtml(event.type)}</span><b>${escapeHtml(event.title)}</b></p></div>`).join('')}</div>
      <div class="source-note"><span>REAL DATA ENDPOINT</span><p>GET /api/tasks/${escapeHtml(task.id)}/trace</p></div>`);
  }

  openOperationTask(task) {
    this.openRightDrawer(`
      <div class="detail-kicker accent">OPERATION TASK / ${escapeHtml(task.id)}</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(task.name)}</h3><p>${escapeHtml(task.route)}</p></div><span class="live-chip"><i></i>${escapeHtml(task.status)}</span></div>
      <div class="operation-task-summary"><span>${escapeHtml(task.cargo)}</span><span>${escapeHtml(task.mode)}</span></div>
      ${Number.isFinite(task.progress) ? `<div class="task-progress"><header><span>全程运输进度</span><b>${task.progress}%</b></header><div><i style="width:${task.progress}%"></i></div><p>预计到达 ${escapeHtml(task.eta)}</p></div>` : ''}
      <div class="detail-metrics operation-task-metrics">${task.metrics.map((metric) => `<div><span>${escapeHtml(metric.label)}</span><b>${escapeHtml(metric.value)}</b></div>`).join('')}</div>
      <section class="operation-task-chain"><h4>运输组织链路</h4>${task.nodes.map((node, index) => `<div><i>${String(index + 1).padStart(2, '0')}</i><b>${escapeHtml(node)}</b>${index < task.nodes.length - 1 ? '<span>↓</span>' : ''}</div>`).join('')}</section>
      <button class="secondary-action" type="button" data-operation-clear-task>返回全国运营态势</button>
      <div class="source-note"><span>BUSINESS QUERY</span><p>任务、运力与多式联运节点已按统一任务标识关联</p></div>`);
  }

  openRightDrawer(html) {
    this.root.querySelector('#detail-content').innerHTML = html;
    this.root.querySelector('#right-drawer').classList.add('is-open');
    this.root.querySelector('#map-stage').classList.add('operation-detail-open');
  }

  closeRightDrawer() {
    this.root.querySelector('#right-drawer').classList.remove('is-open');
    this.root.querySelector('#map-stage').classList.remove('operation-detail-open');
  }
  isRightDrawerOpen() { return this.root.querySelector('#right-drawer').classList.contains('is-open'); }

  syncOperationOverlays(items = []) {
    const activeRoot = this.getActiveWorkspace()?.querySelector('.operation-map-overlays');
    this.root.querySelectorAll('.operation-map-overlays').forEach((root) => {
      if (root === activeRoot) return;
      root.hidden = true;
      root.querySelectorAll('.is-visible').forEach((node) => node.classList.remove('is-visible'));
    });
    if (!activeRoot) return;
    const active = items.length > 0;
    activeRoot.hidden = !active;
    if (!active) return;
    items.forEach((item) => {
      const node = activeRoot.querySelector(`[data-overlay-id="${item.id}"]`);
      if (!node) return;
      node.classList.toggle('is-visible', Boolean(item.visible));
      if (!item.visible) return;
      node.style.left = `${item.x}px`;
      node.style.top = `${item.y}px`;
    });
  }

  openProvincePlatform(summary, { operationCockpit = false, infrastructureCockpit = false, digitalCockpit = false } = {}) {
    this.provinceSummary = summary;
    this.root.querySelector('#map-stage').classList.add('province-view');
    if (operationCockpit) {
      const hadInfrastructureDashboard = Boolean(this.provinceInfrastructureDashboard);
      this.provinceInfrastructureDashboard = null;
      this.restoreNationalDigitalCockpit();
      this.provinceDashboard = buildProvinceOperationDashboard(summary, this.data);
      const card = this.root.querySelector('#province-platform-card');
      card.classList.remove('is-open');
      card.setAttribute('aria-hidden', 'true');
      this.operationMode = 'overview';
      this.refreshOperationCockpit();
      if (hadInfrastructureDashboard) this.restoreNationalInfrastructureCockpit();
      return;
    }
    if (infrastructureCockpit) {
      const hadOperationDashboard = Boolean(this.provinceDashboard);
      this.provinceDashboard = null;
      this.restoreNationalDigitalCockpit();
      this.provinceInfrastructureDashboard = buildProvinceInfrastructureDashboard(summary, this.data);
      this.infrastructureMode = 'overview';
      this.infrastructureRankTab = 'count';
      const card = this.root.querySelector('#province-platform-card');
      card.classList.remove('is-open');
      card.setAttribute('aria-hidden', 'true');
      this.refreshInfrastructureCockpit();
      if (hadOperationDashboard) {
        this.operationMode = 'overview';
        this.refreshOperationCockpit();
      }
      return;
    }
    if (digitalCockpit) {
      const hadOperationDashboard = Boolean(this.provinceDashboard);
      const hadInfrastructureDashboard = Boolean(this.provinceInfrastructureDashboard);
      this.provinceDashboard = null;
      this.provinceInfrastructureDashboard = null;
      this.provinceDigitalDashboard = buildProvinceDigitalDashboard(summary, this.data);
      this.digitalMode = 'overview';
      const card = this.root.querySelector('#province-platform-card');
      card.classList.remove('is-open');
      card.setAttribute('aria-hidden', 'true');
      this.refreshDigitalCockpit();
      if (hadOperationDashboard) {
        this.operationMode = 'overview';
        this.refreshOperationCockpit();
      }
      if (hadInfrastructureDashboard) this.restoreNationalInfrastructureCockpit();
      return;
    }
    const hadOperationDashboard = Boolean(this.provinceDashboard);
    const hadInfrastructureDashboard = Boolean(this.provinceInfrastructureDashboard);
    this.provinceDashboard = null;
    this.provinceInfrastructureDashboard = null;
    this.restoreNationalDigitalCockpit();
    if (hadOperationDashboard) {
      this.operationMode = 'overview';
      this.refreshOperationCockpit();
    }
    if (hadInfrastructureDashboard) this.restoreNationalInfrastructureCockpit();
    const card = this.root.querySelector('#province-platform-card');
    card.classList.add('is-open');
    card.setAttribute('aria-hidden', 'false');
    this.root.querySelector('#province-platform-name').textContent = `${summary.province}省级物流运行平台`;
    this.root.querySelector('#province-platform-metrics').innerHTML = `
      <span><small>地市协同</small><b>${summary.cityCount}</b><i>个</i></span>
      <span><small>国家枢纽</small><b>${summary.nationalHubs}</b><i>个</i></span>
      <span><small>冷链基地</small><b>${summary.coldChainBases}</b><i>个</i></span>
      <span><small>规模园区</small><b>${summary.logisticsParks}</b><i>个</i></span>`;
    this.root.querySelector('#province-city-strip').innerHTML = summary.cities.slice(0, 8)
      .map((city) => `<i>${escapeHtml(city)}</i>`).join('') + (summary.cities.length > 8 ? `<i>+${summary.cities.length - 8}</i>` : '');
  }

  restoreNationalInfrastructureCockpit() {
    this.infrastructureMode = 'overview';
    this.infrastructureRankTab = 'hubs';
    this.refreshInfrastructureCockpit();
    // Provincial filter ids must not leak into the national infrastructure layer.
    this.applyLayerFilterPreset('infrastructure', INFRA_MODE_FILTERS.overview);
  }

  /**
   * 首页和三层分解是基础/运营/数字三张网的叠合与分解视图，
   * 因此进入这两个视图时必须把三层各自的要素过滤器复位到全量，
   * 否则单层页上收窄过的过滤器会让叠合视图缺网。
   */
  resetStackedViewFilters() {
    this.provinceDigitalDashboard = null;
    this.applyLayerFilterPreset('infrastructure', INFRA_MODE_FILTERS.overview);
    this.applyLayerFilterPreset('operation', layerCatalog.operation.map((item) => item.id));
    this.applyLayerFilterPreset('digital', DIGITAL_MODE_FILTERS.overview);
  }

  restoreNationalDigitalCockpit() {
    if (!this.provinceDigitalDashboard) return;
    this.provinceDigitalDashboard = null;
    this.digitalMode = 'overview';
    this.refreshDigitalCockpit();
    // 省级要素 id 不能残留到全国数字网图层上。
    this.applyLayerFilterPreset('digital', DIGITAL_MODE_FILTERS.overview);
  }

  resetNationalNetworkCockpits(layer = null) {
    this.provinceSummary = null;
    this.provinceDashboard = null;
    this.provinceInfrastructureDashboard = null;
    this.operationMode = 'overview';
    this.infrastructureMode = 'overview';
    this.infrastructureRankTab = 'hubs';
    this.digitalMode = 'overview';
    this.refreshOperationCockpit();
    this.restoreNationalInfrastructureCockpit();
    this.restoreNationalDigitalCockpit();
    if (layer === 'operation') this.setOperationMode('overview', { syncRuntime: false });
    if (layer === 'infrastructure') this.setInfrastructureMode('overview', { syncRuntime: false });
    if (layer === 'digital') this.setDigitalMode('overview', { syncRuntime: false });
  }

  closeProvincePlatform() {
    const hadProvinceDashboard = Boolean(this.provinceDashboard);
    const hadInfrastructureDashboard = Boolean(this.provinceInfrastructureDashboard);
    this.provinceSummary = null;
    this.provinceDashboard = null;
    this.provinceInfrastructureDashboard = null;
    this.restoreNationalDigitalCockpit();
    const card = this.root.querySelector('#province-platform-card');
    card.classList.remove('is-open');
    card.setAttribute('aria-hidden', 'true');
    this.root.querySelector('#map-stage').classList.remove('province-view');
    if (hadProvinceDashboard || this.operationMode !== 'overview') {
      this.operationMode = 'overview';
      this.refreshOperationCockpit();
    }
    // Always restore national infrastructure filters after leaving a province,
    // even if the user switched away from the infra cockpit earlier.
    if (hadInfrastructureDashboard || this.runtime) {
      this.restoreNationalInfrastructureCockpit();
    }
  }

  showStory(story) {
    const hud = this.root.querySelector('#story-hud');
    hud.classList.add('is-open');
    hud.classList.remove('is-complete', 'is-paused');
    hud.setAttribute('aria-hidden', 'false');
    this.root.querySelector('#map-stage').classList.add('story-active');
    this.root.querySelector('#caption-index').textContent = story.ui?.captionIndex ?? 'BUSINESS STORY / LIVE';
    this.root.querySelector('#scene-title').textContent = story.ui?.captionTitle ?? story.title;
    this.root.querySelector('#scene-subtitle').textContent = story.ui?.captionSubtitle ?? `${story.shipment.origin} → ${story.shipment.destination}`;
    const shipmentLabels = story.ui?.shipmentLabels ?? {};
    this.root.querySelector('#story-shipment').innerHTML = `
      <span><small>${escapeHtml(shipmentLabels.cargo ?? '运输需求')}</small><b>${escapeHtml(story.shipment.cargo)} ${Number(story.shipment.quantity).toLocaleString('zh-CN')} ${escapeHtml(story.shipment.unit)}</b></span>
      <i>→</i><span><small>${escapeHtml(shipmentLabels.route ?? '起讫区域')}</small><b>${escapeHtml(story.flow?.originProvince ?? story.shipment.origin)} → ${escapeHtml(story.flow?.destinationProvince ?? story.shipment.destination)}</b></span>
      <span><small>${escapeHtml(shipmentLabels.requirement ?? '发运要求')}</small><b>${escapeHtml(story.shipment.serviceLevel)}</b></span>`;
    const chapters = story.chapters ?? story.stages.map((stage, index) => ({ id: stage.id, index: String(index + 1).padStart(2, '0'), title: stage.title, stageIds: [stage.id] }));
    this.root.querySelector('#story-stage-track').innerHTML = chapters.map((chapter) => `
      <i data-story-chapter="${escapeHtml(chapter.id)}" title="${escapeHtml(chapter.title)}"><b>${escapeHtml(chapter.index)}</b></i>`).join('');
    this.setStoryCameraFollow(false);
    this.setStoryPlayback('playing');
  }

  updateStoryStage(stage, index, story) {
    const chapters = story.chapters ?? story.stages.map((item, itemIndex) => ({ id: item.id, index: String(itemIndex + 1).padStart(2, '0'), title: item.title, stageIds: [item.id] }));
    const chapterIndex = Math.max(0, chapters.findIndex((chapter) => chapter.stageIds.includes(stage.id)));
    const chapter = chapters[chapterIndex];
    this.root.querySelector('#story-index').textContent = `${chapter.index} / ${String(chapters.length).padStart(2, '0')} · ${chapter.title}`;
    this.root.querySelector('#caption-index').textContent = `${story.ui?.captionIndex ?? 'BUSINESS STORY'} · ${chapter.index}/${String(chapters.length).padStart(2, '0')}`;
    this.root.querySelector('#scene-title').textContent = story.ui?.captionTitle ?? story.title;
    this.root.querySelector('#scene-subtitle').textContent = `${chapter.title} · ${stage.title}`;
    this.root.querySelector('#story-title').textContent = stage.title;
    this.root.querySelector('#story-subtitle').textContent = stage.subtitle;
    this.root.querySelectorAll('[data-story-chapter]').forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === chapterIndex);
      item.classList.toggle('is-done', itemIndex < chapterIndex);
    });
    const currentLayer = ['platform_space', 'transport_demand', 'capacity_response', 'route_solve', 'consensus', 'digital_penetration', 'regional_collaboration'].includes(stage.id) ? 'digital'
      : ['drill_operation', 'operation_dispatch'].includes(stage.id) ? 'operation'
        : ['drill_infrastructure', 'local_assembly', 'origin_execute', 'transit_exception', 'coastal_execute', 'destination_execute', 'sea_departure'].includes(stage.id) ? 'infrastructure' : null;
    const visibleLayers = stage.id === 'platform_space' || ['digital_penetration', 'regional_collaboration'].includes(stage.id)
      ? new Set(['digital', 'operation', 'infrastructure'])
      : stage.id === 'drill_operation' ? new Set(['digital', 'operation'])
        : stage.id === 'drill_infrastructure' ? new Set(['operation', 'infrastructure'])
          : currentLayer ? new Set([currentLayer]) : new Set();
    this.root.querySelectorAll('.stack-layer-label').forEach((label) => {
      label.classList.toggle('is-story-current', Boolean(currentLayer && label.classList.contains(currentLayer)));
      label.classList.toggle('is-story-hidden', Boolean(currentLayer && !visibleLayers.has([...label.classList].find((name) => ['digital', 'operation', 'infrastructure'].includes(name)))));
    });
    this.root.querySelector('#story-actors').innerHTML = (stage.actors ?? []).map((actor, actorIndex) => `
      ${actorIndex ? '<i aria-hidden="true">→</i>' : ''}<span>${escapeHtml(actor)}</span>`).join('');
    const routeDirection = `${story.flow?.originProvince ?? story.shipment.origin} → ${story.flow?.destinationProvince ?? story.shipment.destination}`;
    const routeSummary = [routeDirection, story.shipment.finalDestination].filter(Boolean).join(' → ');
    const formatCost = (value) => Number(value) === 0 ? '持平' : `${Number(value) < 0 ? '↓' : '↑'}${Math.abs(Number(value))}%`;
    const metrics = {
      overview: [['运输货物', `${story.shipment.cargo} ${story.shipment.quantity} ${story.shipment.unit}`], ['运输方向', routeSummary], ['履约要求', story.shipment.sailing ?? story.shipment.serviceLevel]],
      platform_space: [['协同中枢', '物流可信数据空间'], ['始发协同', story.flow?.originProvince ?? story.shipment.origin], ['到达协同', story.flow?.destinationProvince ?? story.shipment.destination]],
      transport_demand: [['运输需求', `${story.shipment.cargo} ${story.shipment.quantity} ${story.shipment.unit}`], ['运输组织', story.shipment.packaging ?? story.ui?.selectedMode ?? '待组织'], ['时效要求', story.shipment.serviceLevel]],
      capacity_response: [['资源反馈', `${story.capacityResponses.length} / ${story.capacityResponses.length} 方`], ['运力与节点', '已反馈'], ['协同中枢', '物流可信数据空间']],
      route_solve: story.candidates.map((item) => [`${item.id} 方案`, `${item.transitTime ? `${item.transitTime} · ` : ''}匹配 ${item.score}% · 成本 ${formatCost(item.costChange)}`]),
      consensus: [['组织主体', '贸易商'], ['确认状态', `${story.confirmations.length} 方锁定`], ['数字合约', '待生效']],
      drill_operation: [['数字任务', '已生效'], ['作业计划', '已生成'], ['下发状态', '进行中']],
      operation_dispatch: [['作业计划', '多方已接收'], ['运输组织', story.ui?.transportOrganization ?? '多式联运'], ['任务编号', story.shipment.id]],
      drill_infrastructure: [['资源锁定', `${story.execution.nodes.length} 个节点`], ['作业对象', '场站 / 线路 / 作业资源'], ['确认状态', '已完成']],
      origin_execute: [['当前方式', story.execution.modes?.slice(0, 2).join(' → ') ?? '干线运输'], ['当前线路', routeDirection], ['货物状态', '运输中']],
      transit_exception: [['异常类型', story.exception?.title ?? '运输异常'], ['时间影响', story.exception?.expectedDelay ?? '待评估'], ['协同处置', story.exception?.action ?? '处置中']],
      coastal_execute: story.ui?.executionMetrics?.coastal_execute ?? [['当前方式', '沿海航运'], ['运输状态', '海上在途'], ['目的节点', story.shipment.destination]],
      destination_execute: [['当前方式', story.execution.modes?.at(-1) ?? '到达配送'], ['目的节点', story.shipment.destination], ['货物状态', '已到达']],
      feedback: [['业务结果', story.result?.productionImpact ?? '履约完成'], ['运输用时', story.result?.actualDuration ?? '—'], ['事件归集', `${Number(story.result?.eventCount ?? 0)} 条`]],
    }[stage.id] ?? [];
    const configuredMetrics = story.ui?.stageMetrics?.[stage.id];
    const executionMetrics = story.ui?.executionMetrics?.[stage.id];
    const resolvedMetrics = configuredMetrics ?? executionMetrics ?? metrics;
    this.root.querySelector('#story-metrics').innerHTML = resolvedMetrics.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join('');
  }

  updateStoryProgress(overallProgress, stageProgress, stage) {
    this.root.querySelector('#story-progress-bar').style.width = `${Math.min(100, overallProgress * 100).toFixed(2)}%`;
    const elapsed = Math.round(overallProgress * (this.runtime?.story?.story?.duration ?? 62));
    const duration = this.runtime?.story?.story?.duration ?? 62;
    const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    this.root.querySelector('#story-time').textContent = `${formatTime(elapsed)} / ${formatTime(duration)}`;
    const story = this.runtime?.story?.story;
    const elapsedSeconds = overallProgress * (story?.duration ?? 72);
    const chapter = story?.chapters?.find((item) => item.stageIds.includes(stage.id));
    const chapterStages = chapter?.stageIds.map((id) => story.stages.find((item) => item.id === id)).filter(Boolean) ?? [stage];
    const chapterStart = chapterStages[0]?.start ?? stage.start;
    const chapterEnd = chapterStages.at(-1)?.end ?? stage.end;
    const chapterProgress = Math.min(1, Math.max(0, (elapsedSeconds - chapterStart) / Math.max(0.001, chapterEnd - chapterStart)));
    this.root.querySelector('#story-hud').style.setProperty('--stage-progress', chapterProgress.toFixed(3));
    if (stage.id === 'route_solve' && stageProgress > 0.58) {
      const selected = story?.candidates?.find((candidate) => candidate.selected) ?? story?.candidates?.[0];
      const cost = Number(selected?.costChange ?? 0);
      const selectionMetrics = story.ui?.routeSelectionMetrics ?? [
        ['时效评估', selected?.transitTime ?? '时效最优'],
        ['综合成本', `${cost < 0 ? '↓' : cost > 0 ? '↑' : ''}${Math.abs(cost)}%`],
        ['资源匹配', `${selected?.score ?? 0}%`],
      ];
      this.root.querySelector('#story-title').textContent = story.ui?.routeSelectionTitle ?? `${selected?.id ?? 'A'} 方案优选 · ${story.ui?.selectedMode ?? '多式联运'}`;
      this.root.querySelector('#story-subtitle').textContent = story.ui?.routeSelectionSubtitle ?? `系统确认${selected?.name ?? '运输方案'}`;
      this.root.querySelector('#story-metrics').innerHTML = selectionMetrics.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join('');
    }
    if (stage.id === 'consensus' && stageProgress > 0.70) {
      this.root.querySelector('#story-title').textContent = 'DIGITAL CONTRACT · 数字合约生效';
      this.root.querySelector('#story-subtitle').textContent = story.ui?.consensusSubtitle ?? '贸易商完成全流程组织，运输任务正式生效';
      this.root.querySelector('#story-metrics').innerHTML = '<span><small>贸易商组单</small><b>✓</b></span><span><small>承运锁定</small><b>全部完成</b></span><span><small>合约状态</small><b>已生效</b></span>';
    }
    if (stage.id === 'transit_exception' && stageProgress > 0.58) {
      this.root.querySelector('#story-title').textContent = story.ui?.exceptionResolvedTitle ?? '跨区域异常处置完成';
      this.root.querySelector('#story-subtitle').textContent = story.exception?.action ?? '';
      this.root.querySelector('#story-metrics').innerHTML = `<span><small>影响车辆</small><b>${Number(story.exception?.affectedQuantity ?? 0)} 辆</b></span><span><small>处置结果</small><b>${escapeHtml(story.exception?.resolvedDelay ?? '—')}</b></span><span><small>装船保障</small><b>${escapeHtml(story.exception?.outcome ?? '—')}</b></span>`;
    }
  }

  setStoryPlayback(state) {
    const paused = state === 'paused';
    const launch = this.root.querySelector(`[data-story-id="${this.runtime?.story?.story?.id}"]`) ?? this.root.querySelector('#story-toggle');
    this.root.querySelectorAll('[data-story-id]').forEach((button) => button.classList.toggle('is-active', button === launch));
    const control = this.root.querySelector('#story-control');
    const hud = this.root.querySelector('#story-hud');
    hud.classList.toggle('is-paused', paused);
    const follow = this.runtime?.story?.cameraFollow !== false;
    this.root.querySelector('#story-state').textContent = paused ? 'PAUSED' : follow ? 'FOLLOW' : 'FREE VIEW';
    launch.querySelector('i').innerHTML = iconSvg(paused ? 'play' : 'pause');
    launch.querySelector('b').textContent = paused ? '继续播放' : '流程进行中';
    control.textContent = paused ? '▶ 继续' : 'Ⅱ 暂停';
  }

  setStoryCameraFollow(enabled) {
    const button = this.root.querySelector('#story-follow');
    const hud = this.root.querySelector('#story-hud');
    if (!button || !hud) return;
    button.textContent = enabled ? '◎ 跟随动画' : '⌖ 自由视角';
    button.title = enabled ? '当前跟随业务镜头，拖拽或滚轮可改为自由视角' : '当前自由观察，点击回到跟随动画';
    button.classList.toggle('is-active', enabled);
    hud.classList.toggle('is-free-view', !enabled);
    if (!hud.classList.contains('is-complete') && !hud.classList.contains('is-paused')) {
      this.root.querySelector('#story-state').textContent = enabled ? 'FOLLOW' : 'FREE VIEW';
    }
  }

  completeStory(story) {
    const hud = this.root.querySelector('#story-hud');
    hud.classList.add('is-complete');
    hud.classList.remove('is-paused');
    this.root.querySelector('#story-index').textContent = 'COMPLETE / CLOSED LOOP';
    this.root.querySelector('#caption-index').textContent = `${story.ui?.captionIndex ?? 'BUSINESS STORY'} · COMPLETE`;
    this.root.querySelector('#scene-title').textContent = story.result?.title ?? story.title;
    this.root.querySelector('#scene-subtitle').textContent = story.result?.subtitle ?? '运输任务已形成数据闭环';
    this.root.querySelector('#story-title').textContent = story.result?.title ?? `${story.shipment.destination}签收 · 本单履约完成`;
    this.root.querySelector('#story-subtitle').textContent = story.result?.subtitle ?? '物流可信数据空间完成运输与签收状态归集';
    this.root.querySelector('#story-actors').innerHTML = (story.flow?.actorChain ?? [story.shipment.origin, story.shipment.destination])
      .map((actor, index) => `${index ? '<i>→</i>' : ''}<span>${escapeHtml(actor)}</span>`).join('');
    const completionMetrics = story.ui?.completionMetrics ?? [['实际用时', story.result?.actualDuration ?? '—'], ['业务结果', story.result?.productionImpact ?? '—'], ['事件归集', `${Number(story.result?.eventCount ?? 0)} 条`]];
    this.root.querySelector('#story-metrics').innerHTML = completionMetrics.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join('');
    this.root.querySelector('#story-progress-bar').style.width = '100%';
    const completeTime = `${String(Math.floor(story.duration / 60)).padStart(2, '0')}:${String(story.duration % 60).padStart(2, '0')}`;
    this.root.querySelector('#story-time').textContent = `${completeTime} / ${completeTime}`;
    const launch = this.root.querySelector(`[data-story-id="${story.id}"]`) ?? this.root.querySelector('#story-toggle');
    launch.querySelector('i').innerHTML = iconSvg('replay');
    launch.querySelector('b').textContent = '重新播放';
    this.root.querySelector('#story-control').textContent = '↻ 重播';
    this.setStoryCameraFollow(false);
    this.root.querySelector('#story-state').textContent = 'CLOSED LOOP';
  }

  hideStory() {
    const hud = this.root.querySelector('#story-hud');
    hud.classList.remove('is-open', 'is-complete', 'is-paused');
    hud.setAttribute('aria-hidden', 'true');
    this.root.querySelector('#map-stage').classList.remove('story-active');
    this.root.querySelectorAll('.stack-layer-label').forEach((label) => {
      label.classList.remove('is-story-current', 'is-story-hidden');
      label.style.removeProperty('top');
    });
    this.root.querySelectorAll('[data-story-id]').forEach((launch) => {
      launch.classList.remove('is-active');
      launch.querySelector('i').innerHTML = iconSvg('play');
      launch.querySelector('b').textContent = launch.dataset.storyId === STORY_IDS.NORTH_GRAIN ? '北粮南运' : '汽车出海';
    });
    this.root.querySelector('#story-state').textContent = 'AUTO PLAY';
    this.setStoryCameraFollow(true);
    this.root.querySelector('#caption-index').textContent = '01 / NATIONAL PLATFORM VIEW';
    this.root.querySelector('#scene-title').textContent = '全国物流网络';
    this.root.querySelector('#scene-subtitle').textContent = '34 个省级区域 · 3 个物流网络图层 · LOD 0';
  }

  updateLayerLabelPositions(positions) {
    Object.entries(positions ?? {}).forEach(([layer, top]) => {
      const label = this.root.querySelector(`.stack-layer-label.${layer}`);
      const position = typeof top === 'number' ? { top } : top;
      if (!label || !Number.isFinite(position?.top)) return;
      label.style.top = `${position.top.toFixed(1)}px`;
      if (Number.isFinite(position.anchorX)) {
        const linkWidth = Math.max(24, position.anchorX - label.offsetLeft - label.offsetWidth);
        label.style.setProperty('--link-width', `${linkWidth.toFixed(1)}px`);
      }
    });
  }

  updateStoryLayerLabelPositions(positions) { this.updateLayerLabelPositions(positions); }

  renderSearch(value) {
    const panel = this.root.querySelector('#search-results');
    const term = value.trim();
    if (!term || !this.runtime || !this.data) {
      panel.classList.remove('is-open');
      panel.innerHTML = '';
      return;
    }
    const entities = this.runtime.registry.search(term).slice(0, 4);
    const routes = this.data.routes.filter((route) => `${route.id}${route.name}`.toLowerCase().includes(term.toLowerCase())).slice(0, 4);
    const tasks = this.data.tasks.filter((task) => `${task.id}${task.name}`.toLowerCase().includes(term.toLowerCase())).slice(0, 2);
    // 首页与三层分解不提供省级下钻，搜索结果里也不给省级入口。
    const provinceDrillAllowed = this.runtime.stateMachine?.state !== MAP_STATES.COMBINED
      && this.runtime.stateMachine?.state !== MAP_STATES.EXPLODED;
    const provinces = provinceDrillAllowed
      ? Object.keys(this.data.provinceBoundaries?.provinces ?? {})
        .filter((name) => name.toLowerCase().includes(term.toLowerCase()))
        .slice(0, 4)
      : [];
    const provinceLead = this.currentLayer
      ? `下钻查看${layerLabels[this.currentLayer][0]}省内运行`
      : '下钻查看省界、市界与三层网络';
    const facilities = (this.data.infrastructure?.facilities?.layers ?? [])
      .flatMap((layer) => layer.points.map((feature) => ({ ...feature, layerLabel: layer.label })))
      .filter((feature) => `${feature.name}${feature.province}${feature.city}${feature.category}`.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 5);
    const html = [
      ...provinces.map((province) => `<button data-province-name="${escapeHtml(province)}" role="option"><i class="result-icon province">▱</i><span><b>${escapeHtml(province)}省级物流平台</b><small>${escapeHtml(provinceLead)}</small></span><em>省级</em></button>`),
      ...entities.map((entity) => `<button data-entity-id="${entity.id}" role="option"><i class="result-icon">●</i><span><b>${escapeHtml(entity.name)}</b><small>${escapeHtml(entity.type)} · ${escapeHtml(entity.province)}</small></span><em>实体</em></button>`),
      ...facilities.map((feature) => `<button data-infrastructure-feature-id="${escapeHtml(feature.id)}" role="option"><i class="result-icon facility">●</i><span><b>${escapeHtml(feature.name)}</b><small>${escapeHtml(feature.province)} · ${escapeHtml(feature.category)}</small></span><em>${escapeHtml(feature.layerLabel)}</em></button>`),
      ...routes.map((route) => `<button data-route-id="${route.id}" role="option"><i class="result-icon route">⌁</i><span><b>${escapeHtml(route.id)} · ${escapeHtml(route.name)}</b><small>国家战略骨架</small></span><em>${routeTypeLabels[route.type]}</em></button>`),
      ...tasks.map((task) => `<button data-task-id="${task.id}" role="option"><i class="result-icon task">↝</i><span><b>${escapeHtml(task.name)}</b><small>${escapeHtml(task.status)} · ${task.progress}%</small></span><em>任务</em></button>`),
    ].join('');
    panel.innerHTML = html || '<div class="empty-search">未找到匹配对象</div>';
    panel.classList.add('is-open');
  }

  closeSearch() {
    this.root.querySelector('#search-results').classList.remove('is-open');
  }

  showTooltip(x, y, title, subtitle) {
    const tooltip = this.root.querySelector('#map-tooltip');
    tooltip.querySelector('b').textContent = title;
    tooltip.querySelector('span').textContent = subtitle;
    tooltip.style.left = `${Math.min(x + 16, window.innerWidth - 250)}px`;
    tooltip.style.top = `${Math.min(y + 16, window.innerHeight - 96)}px`;
    tooltip.classList.add('is-visible');
  }

  hideTooltip() { this.root.querySelector('#map-tooltip').classList.remove('is-visible'); }

  /**
   * 首页开场演出期间收起中国地图专属附件（南海附图、指北针、图例）。
   */
  setHomeIntroActive(active) {
    const playing = Boolean(active);
    this.root.querySelector('.app-shell')?.classList.toggle('intro-playing', playing);
    this.root.querySelector('#map-stage')?.classList.toggle('intro-playing', playing);
  }

  hideLoading() { this.root.querySelector('#map-loading').classList.add('is-hidden'); }
  showError(message) {
    const loading = this.root.querySelector('#map-loading');
    loading.classList.add('is-error');
    loading.querySelector('strong').textContent = '地图运行时加载失败';
    loading.querySelector('small').textContent = message;
  }

  updateLod(level, region) {
    this.root.querySelector('#lod-status').textContent = `LOD ${level}`;
    if (region) this.root.querySelector('#spatial-context').textContent = `全国 > ${region}`;
  }

  setSpatialContext(region) {
    this.spatialContext = region;
    this.root.querySelector('#spatial-context').textContent = region ? `全国 > ${region}` : '全国视角';
    if (!region && !this.runtime?.story?.active && !this.runtime?.story?.completed) {
      this.root.querySelector('#caption-index').textContent = '01 / NATIONAL PLATFORM VIEW';
      this.root.querySelector('#scene-title').textContent = '全国物流网络';
      this.root.querySelector('#scene-subtitle').textContent = '34 个省级区域';
    }
  }

  startClock() {
    const update = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('zh-CN', { hour12: false });
      this.root.querySelector('#data-time').textContent = currentTime;
      const operationTime = this.root.querySelector('#operation-update-time');
      if (operationTime) operationTime.textContent = currentTime;
      const drawerTime = this.root.querySelector('#operation-drawer-time');
      if (drawerTime) drawerTime.textContent = currentTime;
      this.root.querySelectorAll('.network-update-time').forEach((node) => {
        node.textContent = currentTime;
      });
    };
    update();
    this.clockTimer = window.setInterval(update, 1000);
  }

  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await this.root.querySelector('.app-shell').requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* browser policy may block fullscreen */ }
  }
}
