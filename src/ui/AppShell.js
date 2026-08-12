import { MAP_STATES } from '../core/MapStateMachine.js';
import { layerCatalog } from '../data/demoData.js';

const layerLabels = {
  infrastructure: ['基础设施网', 'INFRASTRUCTURE'],
  operation: ['物流运营网', 'OPERATION'],
  digital: ['数字物流网', 'DIGITAL'],
};

const routeTypeLabels = { axis: '主轴', corridor: '走廊', channel: '通道' };

const stateToVisualClass = (state) => state === MAP_STATES.COMBINED ? 'view-combined' : 'view-focus';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export class AppShell {
  constructor(root) {
    this.root = root;
    this.runtime = null;
    this.data = null;
    this.currentLayer = null;
    this.spatialContext = null;
    this.render();
    this.canvas = this.root.querySelector('#map-canvas');
    this.bindStaticEvents();
    this.startClock();
  }

  render() {
    this.root.innerHTML = `
      <main class="app-shell" aria-label="国家物流网一图三网展示系统">
        <header class="topbar">
          <div class="brand-block">
            <div class="brand-mark" aria-hidden="true"><span></span><i></i></div>
            <div>
              <div class="brand-en">NATIONAL LOGISTICS NETWORK</div>
              <h1>国家物流网 <em>一图三网</em></h1>
            </div>
          </div>
          <nav class="mode-nav" aria-label="地图模式">
            <div class="mode-cluster" aria-label="空间形态">
              <button class="mode-button is-active" data-map-state="COMBINED"><span class="mode-dot"></span>三网合一</button>
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
            <button class="story-launch" id="story-toggle" type="button" aria-label="播放一单贯穿三网演示">
              <i aria-hidden="true">▶</i><span><b>业务演示</b><small>北粮南运 · 公铁海</small></span>
            </button>
            <div class="search-box">
              <span aria-hidden="true">⌕</span>
              <input id="global-search" type="search" autocomplete="off" placeholder="搜索枢纽、园区、公路、铁路或通道" aria-label="统一搜索" />
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
              <div class="caption-index">01 / NATIONAL VIEW</div>
              <h2 id="scene-title">三网合一 · 全国综合态势</h2>
              <p id="scene-subtitle">物理骨架、物流运行与数字网络在同一空间中协同表达</p>
            </div>
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
                <div><button id="story-follow" type="button">◎ 跟随中</button><button id="story-control" type="button">Ⅱ 暂停</button><button id="story-exit" type="button">退出演示</button></div>
              </footer>
            </section>
            <div class="demo-badge"><span></span>演示业务 · 本地基础数据</div>
            <div class="north-indicator" aria-hidden="true"><i></i><b>N</b></div>

            <div class="stack-layer-labels" aria-label="三网快速切换">
              <button class="stack-layer-label digital" data-map-state="FOCUS_DIGITAL">
                <span class="stack-layer-icon">◇</span><span><b>数字物流网</b><small>DIGITAL NETWORK</small></span><i></i>
              </button>
              <button class="stack-layer-label operation" data-map-state="FOCUS_OPERATION">
                <span class="stack-layer-icon">↗</span><span><b>物流运营网</b><small>OPERATION NETWORK</small></span><i></i>
              </button>
              <button class="stack-layer-label infrastructure" data-map-state="FOCUS_INFRA">
                <span class="stack-layer-icon">⌁</span><span><b>基础设施网</b><small>INFRASTRUCTURE</small></span><i></i>
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
              <div class="inset-title"><span>南海诸岛</span><small>SOUTH CHINA SEA</small></div>
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
            <span><i>对象</i><b id="object-count">—</b></span>
            <span><i>数据时间</i><b id="data-time">--:--:--</b></span>
            <span><i>数据源</i><b id="data-source">DEMO</b></span>
            <span class="service-ok"><i class="status-pulse"></i>服务正常</span>
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
    this.root.querySelector('#data-source').textContent = data.source === 'api' ? '实时接口 + 本地基础层' : data.source === 'demo-fallback' ? 'DEMO 回退 + 本地基础层' : 'DEMO + 本地基础层';
  }

  bindStaticEvents() {
    this.root.addEventListener('click', (event) => {
      const modeButton = event.target.closest('[data-map-state]');
      if (modeButton && this.runtime) this.runtime.setState(modeButton.dataset.mapState);
      const layerMasterButton = event.target.closest('[data-layer-toggle-all]');
      if (layerMasterButton && this.runtime) this.toggleAllLayerElements(layerMasterButton.dataset.layerToggleAll);
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
      const taskButton = event.target.closest('[data-task-id]');
      if (taskButton && this.runtime) this.runtime.selectTask(taskButton.dataset.taskId);
      const facilityButton = event.target.closest('[data-infrastructure-feature-id]');
      if (facilityButton && this.runtime) {
        const feature = this.findInfrastructureFeature(facilityButton.dataset.infrastructureFeatureId);
        if (feature) this.runtime.selectInfrastructureFeature(feature);
      }
      const layerJump = event.target.closest('[data-layer-jump]');
      if (layerJump && this.runtime) this.runtime.focusEntityLayer(layerJump.dataset.layerJump);
      if ((event.target.closest('#story-toggle') || event.target.closest('#story-control')) && this.runtime) this.runtime.toggleStory();
      if (event.target.closest('#story-follow') && this.runtime) this.runtime.story?.toggleCameraFollow();
      if (event.target.closest('#story-exit') && this.runtime) this.runtime.stopStory();
      if (event.target.closest('#penetration-action') && this.runtime) this.runtime.activatePenetration();
      if (event.target.closest('#right-drawer-close')) this.closeRightDrawer();
      if (event.target.closest('#left-drawer-close')) this.runtime?.setState(MAP_STATES.EXPLODED);
      if (event.target.closest('#reset-view') || event.target.closest('#status-reset')) this.runtime?.resetView();
      if (event.target.closest('#fullscreen')) this.toggleFullscreen();
    });
    this.root.addEventListener('change', (event) => {
      const input = event.target.closest('[data-layer-filter]');
      if (input && this.runtime) {
        this.runtime.setLayerFilter(input.dataset.layer, input.dataset.layerFilter, input.checked);
        this.syncLegendFilter(input.dataset.layerFilter, input.checked);
        this.updateLayerMasterControl(input.dataset.layer);
      }
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
  }

  updateMode(state, layer) {
    this.root.querySelectorAll('[data-map-state]').forEach((button) => button.classList.toggle('is-active', button.dataset.mapState === state));
    const stage = this.root.querySelector('#map-stage');
    stage.classList.remove('view-combined', 'view-exploded', 'view-focus', 'focus-infrastructure', 'focus-operation', 'focus-digital');
    stage.classList.add(state === MAP_STATES.EXPLODED || state === MAP_STATES.PENETRATION ? 'view-exploded' : stateToVisualClass(state));
    if (layer) stage.classList.add('view-focus', `focus-${layer}`);
    const titles = {
      [MAP_STATES.COMBINED]: ['三网合一 · 全国综合态势', '物理骨架、物流运行与数字网络在同一空间中协同表达'],
      [MAP_STATES.EXPLODED]: ['三层分解 · 同轴垂直空间', '三张地图保持地理同位，沿高度轴构成立体网络栈'],
      [MAP_STATES.PENETRATION]: ['垂直穿透 · 统一实体视图', '同一实体跨越三层网络，保持唯一身份与空间位置'],
      [MAP_STATES.TASK_TRACE]: ['业务穿透 · 全链路追踪', '设施、运行状态与可信数字事件串成同一条任务链'],
    };
    const title = layer ? [`${layerLabels[layer][0]} · 单层分析`, this.layerLead(layer)] : titles[state] ?? titles[MAP_STATES.COMBINED];
    this.root.querySelector('#scene-title').textContent = title[0];
    this.root.querySelector('#scene-subtitle').textContent = title[1];
    this.currentLayer = layer;
    const drawer = this.root.querySelector('#left-drawer');
    drawer.classList.toggle('is-open', Boolean(layer));
    if (layer) this.renderLayerDrawer(layer);
  }

  layerLead(layer) {
    return {
      infrastructure: '查看战略骨架、主要交通线网、物流枢纽、冷链基地与规模园区',
      operation: '观察货物流向、运力状态、运输任务与风险异常',
      digital: '追踪连接器、数据调用、EPCIS 事件与 AI 协同',
    }[layer];
  }

  renderLayerDrawer(layer) {
    const [title, en] = layerLabels[layer];
    this.root.querySelector('#layer-drawer-title').textContent = title;
    this.root.querySelector('#layer-drawer-en').textContent = en;
    this.root.querySelector('#layer-drawer-lead').textContent = this.layerLead(layer);
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
      const facilityClass = ['nationalHubs', 'coldChainBases', 'logisticsParks'].includes(item.id) ? `facility ${item.id}` : '';
      return `<label class="layer-row">
        <span><i class="layer-symbol ${layer} ${transportClass} ${facilityClass}" ${item.color ? `style="--layer-color:${escapeHtml(item.color)}"` : ''}></i><b>${escapeHtml(item.label)}</b><small>${Number(item.count ?? 0).toLocaleString('zh-CN')}</small></span>
        <input type="checkbox" data-layer="${layer}" data-layer-filter="${escapeHtml(item.id)}" ${enabled ? 'checked' : ''}/><i class="toggle"></i>
      </label>`;
    };
    const allItems = groups.flatMap((group) => group.items);
    const anyEnabled = allItems.some((item) => this.runtime?.layers[layer]?.filters?.[item.id] ?? item.enabled ?? true);
    this.root.querySelector('#layer-controls').innerHTML = `
      <div class="layer-master-control ${anyEnabled ? '' : 'is-all-off'}">
        <span><b>图层元素</b><small>${anyEnabled ? '可单独控制，或一键全部关闭' : '当前层元素已全部关闭'}</small></span>
        <button type="button" data-layer-toggle-all="${layer}" aria-label="${anyEnabled ? '关闭' : '开启'}${escapeHtml(title)}全部图层元素">
          <i>${anyEnabled ? '⊘' : '◎'}</i><b>${anyEnabled ? '关闭全部' : '开启全部'}</b>
        </button>
      </div>
      ${groups.map((group) => `
      <section class="layer-control-group">
        ${group.title ? `<header><b>${escapeHtml(group.title)}</b><small>${escapeHtml(group.note)}</small></header>` : ''}
        ${group.items.map(renderItem).join('')}
      </section>`).join('')}`;
    const routeBrowser = this.root.querySelector('#route-browser');
    if (layer !== 'infrastructure') {
      routeBrowser.innerHTML = `<div class="drawer-callout"><span>LIVE DATA</span><b>${layer === 'operation' ? '12 条货流正在动态演示' : '7 组可信调用关系已连接'}</b><p>当前为演示数据，接口模式下将按视窗、LOD 与权限动态加载。</p></div>`;
      return;
    }
    routeBrowser.innerHTML = ['axis', 'corridor', 'channel'].map((type) => {
      const items = this.data?.routes.filter((route) => route.type === type) ?? [];
      return `<section class="route-section"><header><b>${{ axis: '六轴', corridor: '七廊', channel: '八通道' }[type]}</b><small>${items.length.toString().padStart(2, '0')}</small></header><div>${items.map((route) => `<button data-route-id="${route.id}"><span>${route.id}</span>${escapeHtml(route.name)}</button>`).join('')}</div></section>`;
    }).join('');
  }

  toggleAllLayerElements(layer) {
    const inputs = [...this.root.querySelectorAll(`#layer-controls input[data-layer="${layer}"][data-layer-filter]`)];
    if (!inputs.length) return;
    const enableAll = inputs.every((input) => !input.checked);
    const filterIds = inputs.map((input) => input.dataset.layerFilter);
    this.runtime?.setLayerFilters(layer, filterIds, enableAll);
    inputs.forEach((input) => {
      input.checked = enableAll;
      this.syncLegendFilter(input.dataset.layerFilter, enableAll);
    });
    this.updateLayerMasterControl(layer);
  }

  updateLayerMasterControl(layer) {
    const control = this.root.querySelector('.layer-master-control');
    const button = control?.querySelector('[data-layer-toggle-all]');
    if (!control || !button || button.dataset.layerToggleAll !== layer) return;
    const inputs = [...this.root.querySelectorAll(`#layer-controls input[data-layer="${layer}"][data-layer-filter]`)];
    const anyEnabled = inputs.some((input) => input.checked);
    control.classList.toggle('is-all-off', !anyEnabled);
    control.querySelector('small').textContent = anyEnabled ? '可单独控制，或一键全部关闭' : '当前层元素已全部关闭';
    button.querySelector('i').textContent = anyEnabled ? '⊘' : '◎';
    button.querySelector('b').textContent = anyEnabled ? '关闭全部' : '开启全部';
    button.setAttribute('aria-label', `${anyEnabled ? '关闭' : '开启'}当前层全部图层元素`);
  }

  syncLegendFilter(filterId, enabled) {
    const legend = this.root.querySelector(`[data-legend-filter="${filterId}"]`);
    legend?.classList.toggle('is-on', enabled);
  }

  openEntity(entity) {
    this.openRightDrawer(`
      <div class="detail-kicker">ENTITY / ${escapeHtml(entity.type).toUpperCase()}</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(entity.name)}</h3><p>${escapeHtml(entity.province)} · ${escapeHtml(entity.id)}</p></div><span class="verified-chip">演示</span></div>
      <div class="coordinate-line"><span>坐标</span><b>${Number(entity.longitude).toFixed(2)}°E · ${Number(entity.latitude).toFixed(2)}°N</b></div>
      <div class="detail-metrics">
        <div><span>当前负荷</span><b>${entity.operation.load}<i>%</i></b></div>
        <div><span>在途任务</span><b>${entity.operation.tasks}<i>单</i></b></div>
        <div><span>数据连接</span><b>${entity.digital.connectors}<i>个</i></b></div>
      </div>
      <section class="entity-overview"><h4>统一实体摘要</h4><p>该对象已在基础设施、物流运营和数字物流三层建立统一实体映射，可进入垂直穿透视图。</p></section>
      <button class="primary-action" id="penetration-action"><span>↕</span><b>查看三层穿透</b><i>ENTER</i></button>
      <div class="source-note"><span>DATA PROVENANCE</span><p>${escapeHtml(entity.source_ref)} · ${escapeHtml(entity.verified_status)}</p></div>`);
  }

  openPenetration(entity) {
    if (!entity) return;
    this.openRightDrawer(`
      <div class="detail-kicker accent">VERTICAL PENETRATION</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(entity.name)}</h3><p>统一实体 ID · ${escapeHtml(entity.id)}</p></div><span class="live-chip"><i></i>已贯通</span></div>
      <div class="penetration-stack">
        ${this.penetrationCard('digital', '数字物流网', `${entity.digital.connectors} 个连接器`, `API 健康度 ${entity.digital.apiHealth}%`, entity.digital.latestEvent)}
        <div class="stack-link"><i></i><span></span><i></i></div>
        ${this.penetrationCard('operation', '物流运营网', `${entity.operation.tasks} 项在途任务`, `负荷 ${entity.operation.load}%`, entity.operation.status)}
        <div class="stack-link"><i></i><span></span><i></i></div>
        ${this.penetrationCard('infrastructure', '基础设施网', entity.infrastructure.level, `${entity.infrastructure.lines} 条接入线路`, entity.infrastructure.status)}
      </div>
      <div class="source-note"><span>DATA PROVENANCE</span><p>演示聚合接口 /api/entities/${escapeHtml(entity.id)}/penetration</p></div>`);
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
      <button class="secondary-action" data-map-state="EXPLODED">在三层空间中查看</button>
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

  openRightDrawer(html) {
    this.root.querySelector('#detail-content').innerHTML = html;
    this.root.querySelector('#right-drawer').classList.add('is-open');
  }

  closeRightDrawer() { this.root.querySelector('#right-drawer').classList.remove('is-open'); }
  isRightDrawerOpen() { return this.root.querySelector('#right-drawer').classList.contains('is-open'); }

  showStory(story) {
    const hud = this.root.querySelector('#story-hud');
    hud.classList.add('is-open');
    hud.classList.remove('is-complete', 'is-paused');
    hud.setAttribute('aria-hidden', 'false');
    this.root.querySelector('#map-stage').classList.add('story-active');
    this.root.querySelector('#story-shipment').innerHTML = `
      <span><small>运输需求</small><b>${escapeHtml(story.shipment.cargo)} ${Number(story.shipment.quantity).toLocaleString('zh-CN')} ${escapeHtml(story.shipment.unit)}</b></span>
      <i>→</i><span><small>起讫区域</small><b>吉林 → 广东</b></span>
      <span><small>发运要求</small><b>${escapeHtml(story.shipment.serviceLevel)}</b></span>`;
    const chapters = story.chapters ?? story.stages.map((stage, index) => ({ id: stage.id, index: String(index + 1).padStart(2, '0'), title: stage.title, stageIds: [stage.id] }));
    this.root.querySelector('#story-stage-track').innerHTML = chapters.map((chapter) => `
      <i data-story-chapter="${escapeHtml(chapter.id)}" title="${escapeHtml(chapter.title)}"><b>${escapeHtml(chapter.index)}</b></i>`).join('');
    this.setStoryCameraFollow(true);
    this.setStoryPlayback('playing');
  }

  updateStoryStage(stage, index, story) {
    const chapters = story.chapters ?? story.stages.map((item, itemIndex) => ({ id: item.id, index: String(itemIndex + 1).padStart(2, '0'), title: item.title, stageIds: [item.id] }));
    const chapterIndex = Math.max(0, chapters.findIndex((chapter) => chapter.stageIds.includes(stage.id)));
    const chapter = chapters[chapterIndex];
    this.root.querySelector('#story-index').textContent = `${chapter.index} / ${String(chapters.length).padStart(2, '0')} · ${chapter.title}`;
    this.root.querySelector('#story-title').textContent = stage.title;
    this.root.querySelector('#story-subtitle').textContent = stage.subtitle;
    this.root.querySelectorAll('[data-story-chapter]').forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === chapterIndex);
      item.classList.toggle('is-done', itemIndex < chapterIndex);
    });
    const currentLayer = ['platform_space', 'transport_demand', 'capacity_response', 'route_solve', 'consensus'].includes(stage.id) ? 'digital'
      : ['drill_operation', 'operation_dispatch'].includes(stage.id) ? 'operation'
        : ['drill_infrastructure', 'origin_execute', 'coastal_execute', 'destination_execute'].includes(stage.id) ? 'infrastructure' : null;
    this.root.querySelectorAll('.stack-layer-label').forEach((label) => {
      label.classList.toggle('is-story-current', Boolean(currentLayer && label.classList.contains(currentLayer)));
    });
    this.root.querySelector('#story-actors').innerHTML = (stage.actors ?? []).map((actor, actorIndex) => `
      ${actorIndex ? '<i aria-hidden="true">→</i>' : ''}<span>${escapeHtml(actor)}</span>`).join('');
    const metrics = {
      overview: [['运输货物', `${story.shipment.cargo} ${story.shipment.quantity} ${story.shipment.unit}`], ['运输方向', '吉林 → 广东'], ['发运要求', story.shipment.serviceLevel]],
      platform_space: [['协同中枢', '物流可信数据空间'], ['始发协同', '吉林 / 辽宁'], ['收货协同', '广东']],
      transport_demand: [['运输需求', `${story.shipment.cargo} ${story.shipment.quantity} ${story.shipment.unit}`], ['起讫区域', '吉林 → 广东'], ['发运要求', story.shipment.serviceLevel]],
      capacity_response: [['资源反馈', `${story.capacityResponses.length} / ${story.capacityResponses.length} 方`], ['车皮泊位舱位', '已反馈'], ['协同中枢', '物流可信数据空间']],
      route_solve: story.candidates.map((item) => [`${item.id} 方案`, `匹配 ${item.score}% · 成本 ${item.costChange}%`]),
      consensus: [['确认主体', `${story.confirmations.length} 方`], ['确认状态', '依次达成'], ['数字合约', '待生效']],
      drill_operation: [['数字合约', '已生效'], ['生成计划', '运单 / 港口 / 订舱'], ['下发状态', '进行中']],
      operation_dispatch: [['作业计划', '多方已接收'], ['运输组织', '公铁海一单制'], ['任务编号', story.shipment.id]],
      drill_infrastructure: [['资源锁定', `${story.execution.nodes.length} 个节点`], ['作业对象', '场站 / 泊位 / 车辆'], ['确认状态', '已完成']],
      origin_execute: [['当前方式', '公路短驳 → 铁路'], ['实际线路', '吉林 → 营口港'], ['货物状态', '铁路集港']],
      coastal_execute: [['当前方式', '沿海航运'], ['实际航段', '营口港 → 湛江港'], ['货物状态', '海上在途']],
      destination_execute: [['当前方式', '铁路 → 公路短驳'], ['实际线路', '湛江 → 佛山工厂'], ['货物状态', '到厂签收']],
      feedback: [['业务结果', '到厂签收'], ['合同状态', '履约完成'], ['数据归集', '物流可信数据空间']],
    }[stage.id] ?? [];
    this.root.querySelector('#story-metrics').innerHTML = metrics.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join('');
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
      this.root.querySelector('#story-title').textContent = 'A 方案优选 · 公铁海联运';
      this.root.querySelector('#story-subtitle').textContent = '系统确认 A 方案：吉林铁路集港、营口装船、湛江卸船并转运佛山';
      this.root.querySelector('#story-metrics').innerHTML = '<span><small>时效评估</small><b>时效最优</b></span><span><small>综合成本</small><b>↓12%</b></span><span><small>资源匹配</small><b>96%</b></span>';
    }
    if (stage.id === 'consensus' && stageProgress > 0.70) {
      this.root.querySelector('#story-title').textContent = 'DIGITAL CONTRACT · 数字合约生效';
      this.root.querySelector('#story-subtitle').textContent = '贸易商、车队、铁路、港口和船公司完成确认，联运运单正式生效';
      this.root.querySelector('#story-metrics').innerHTML = '<span><small>数据授权</small><b>✓</b></span><span><small>五方确认</small><b>全部完成</b></span><span><small>合约状态</small><b>已生效</b></span>';
    }
  }

  setStoryPlayback(state) {
    const paused = state === 'paused';
    const launch = this.root.querySelector('#story-toggle');
    const control = this.root.querySelector('#story-control');
    const hud = this.root.querySelector('#story-hud');
    hud.classList.toggle('is-paused', paused);
    this.root.querySelector('#story-state').textContent = paused ? 'PAUSED' : 'AUTO PLAY';
    launch.querySelector('i').textContent = paused ? '▶' : 'Ⅱ';
    launch.querySelector('b').textContent = paused ? '继续演示' : '演示进行中';
    control.textContent = paused ? '▶ 继续' : 'Ⅱ 暂停';
  }

  setStoryCameraFollow(enabled) {
    const button = this.root.querySelector('#story-follow');
    const hud = this.root.querySelector('#story-hud');
    if (!button || !hud) return;
    button.textContent = enabled ? '◎ 跟随中' : '⌖ 自由观察';
    button.classList.toggle('is-active', enabled);
    hud.classList.toggle('is-free-view', !enabled);
  }

  completeStory(story) {
    const hud = this.root.querySelector('#story-hud');
    hud.classList.add('is-complete');
    hud.classList.remove('is-paused');
    this.root.querySelector('#story-index').textContent = 'COMPLETE / CLOSED LOOP';
    this.root.querySelector('#story-title').textContent = '佛山工厂签收 · 本单履约完成';
    this.root.querySelector('#story-subtitle').textContent = '物流可信数据空间完成运单、港口、船舶和签收状态归集';
    this.root.querySelector('#story-actors').innerHTML = '<span>吉林粮源企业</span><i>→</i><span>营口港</span><i>→</i><span>湛江港</span><i>→</i><span>佛山粮油工厂</span>';
    this.root.querySelector('#story-metrics').innerHTML = '<span><small>货物状态</small><b>到厂签收</b></span><span><small>联运方案</small><b>执行完成</b></span><span><small>合同状态</small><b>履约完成</b></span>';
    this.root.querySelector('#story-progress-bar').style.width = '100%';
    const completeTime = `${String(Math.floor(story.duration / 60)).padStart(2, '0')}:${String(story.duration % 60).padStart(2, '0')}`;
    this.root.querySelector('#story-time').textContent = `${completeTime} / ${completeTime}`;
    const launch = this.root.querySelector('#story-toggle');
    launch.querySelector('i').textContent = '↻';
    launch.querySelector('b').textContent = '重新演示';
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
      label.classList.remove('is-story-current');
      label.style.removeProperty('top');
    });
    const launch = this.root.querySelector('#story-toggle');
    launch.querySelector('i').textContent = '▶';
    launch.querySelector('b').textContent = '业务演示';
    this.root.querySelector('#story-state').textContent = 'AUTO PLAY';
    this.setStoryCameraFollow(true);
  }

  updateStoryLayerLabelPositions(positions) {
    Object.entries(positions ?? {}).forEach(([layer, top]) => {
      const label = this.root.querySelector(`.stack-layer-label.${layer}`);
      if (label && Number.isFinite(top)) label.style.top = `${top.toFixed(1)}px`;
    });
  }

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
    const facilities = (this.data.infrastructure?.facilities?.layers ?? [])
      .flatMap((layer) => layer.points.map((feature) => ({ ...feature, layerLabel: layer.label })))
      .filter((feature) => `${feature.name}${feature.province}${feature.city}${feature.category}`.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 5);
    const html = [
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
  }

  startClock() {
    const update = () => {
      const now = new Date();
      this.root.querySelector('#data-time').textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
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
