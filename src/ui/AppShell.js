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
              <i aria-hidden="true">▶</i><span><b>业务演示</b><small>一单贯穿三网</small></span>
            </button>
            <div class="search-box">
              <span aria-hidden="true">⌕</span>
              <input id="global-search" type="search" autocomplete="off" placeholder="搜索枢纽、港口、通道或任务" aria-label="统一搜索" />
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
              <div class="story-metrics" id="story-metrics"></div>
              <div class="story-stage-track" id="story-stage-track"></div>
              <div class="story-progress"><i id="story-progress-bar"></i></div>
              <footer>
                <span id="story-time">00:00 / 00:38</span>
                <div><button id="story-control" type="button">Ⅱ 暂停</button><button id="story-exit" type="button">退出演示</button></div>
              </footer>
            </section>
            <div class="demo-badge"><span></span>演示数据 DEMO</div>
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
    this.root.querySelector('#object-count').textContent = data.entities.length.toLocaleString('zh-CN');
    this.root.querySelector('#data-source').textContent = data.source === 'api' ? '实时接口' : data.source === 'demo-fallback' ? 'DEMO 回退' : 'DEMO';
  }

  bindStaticEvents() {
    this.root.addEventListener('click', (event) => {
      const modeButton = event.target.closest('[data-map-state]');
      if (modeButton && this.runtime) this.runtime.setState(modeButton.dataset.mapState);
      const legendButton = event.target.closest('[data-legend-filter]');
      if (legendButton && this.runtime) {
        legendButton.classList.toggle('is-on');
        this.runtime.setLayerFilter('infrastructure', legendButton.dataset.legendFilter, legendButton.classList.contains('is-on'));
      }
      const routeButton = event.target.closest('[data-route-id]');
      if (routeButton && this.runtime) this.runtime.focusRoute(routeButton.dataset.routeId);
      const entityButton = event.target.closest('[data-entity-id]');
      if (entityButton && this.runtime) this.runtime.selectEntity(entityButton.dataset.entityId);
      const taskButton = event.target.closest('[data-task-id]');
      if (taskButton && this.runtime) this.runtime.selectTask(taskButton.dataset.taskId);
      const layerJump = event.target.closest('[data-layer-jump]');
      if (layerJump && this.runtime) this.runtime.focusEntityLayer(layerJump.dataset.layerJump);
      if ((event.target.closest('#story-toggle') || event.target.closest('#story-control')) && this.runtime) this.runtime.toggleStory();
      if (event.target.closest('#story-exit') && this.runtime) this.runtime.stopStory();
      if (event.target.closest('#penetration-action') && this.runtime) this.runtime.activatePenetration();
      if (event.target.closest('#right-drawer-close')) this.closeRightDrawer();
      if (event.target.closest('#left-drawer-close')) this.runtime?.setState(MAP_STATES.EXPLODED);
      if (event.target.closest('#reset-view') || event.target.closest('#status-reset')) this.runtime?.resetView();
      if (event.target.closest('#fullscreen')) this.toggleFullscreen();
    });
    this.root.addEventListener('change', (event) => {
      const input = event.target.closest('[data-layer-filter]');
      if (input && this.runtime) this.runtime.setLayerFilter(input.dataset.layer, input.dataset.layerFilter, input.checked);
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
      infrastructure: '查看战略骨架、通道线网与国家物流枢纽',
      operation: '观察货物流向、运力状态、运输任务与风险异常',
      digital: '追踪连接器、数据调用、EPCIS 事件与 AI 协同',
    }[layer];
  }

  renderLayerDrawer(layer) {
    const [title, en] = layerLabels[layer];
    this.root.querySelector('#layer-drawer-title').textContent = title;
    this.root.querySelector('#layer-drawer-en').textContent = en;
    this.root.querySelector('#layer-drawer-lead').textContent = this.layerLead(layer);
    this.root.querySelector('#layer-controls').innerHTML = layerCatalog[layer].map((item) => `
      <label class="layer-row">
        <span><i class="layer-symbol ${layer}"></i><b>${escapeHtml(item.label)}</b><small>${item.count.toLocaleString('zh-CN')}</small></span>
        <input type="checkbox" data-layer="${layer}" data-layer-filter="${item.id}" ${item.enabled ? 'checked' : ''}/><i class="toggle"></i>
      </label>`).join('');
    const routeBrowser = this.root.querySelector('#route-browser');
    if (layer !== 'infrastructure') {
      routeBrowser.innerHTML = `<div class="drawer-callout"><span>LIVE SAMPLE</span><b>${layer === 'operation' ? '12 条货流正在动态演示' : '7 组可信调用关系已连接'}</b><p>当前为示例数据，接口模式下将按视窗、LOD 与权限动态加载。</p></div>`;
      return;
    }
    routeBrowser.innerHTML = ['axis', 'corridor', 'channel'].map((type) => {
      const items = this.data?.routes.filter((route) => route.type === type) ?? [];
      return `<section class="route-section"><header><b>${{ axis: '六轴', corridor: '七廊', channel: '八通道' }[type]}</b><small>${items.length.toString().padStart(2, '0')}</small></header><div>${items.map((route) => `<button data-route-id="${route.id}"><span>${route.id}</span>${escapeHtml(route.name)}</button>`).join('')}</div></section>`;
    }).join('');
  }

  openEntity(entity) {
    this.openRightDrawer(`
      <div class="detail-kicker">ENTITY / ${escapeHtml(entity.type).toUpperCase()}</div>
      <div class="detail-title-row"><div><h3>${escapeHtml(entity.name)}</h3><p>${escapeHtml(entity.province)} · ${escapeHtml(entity.id)}</p></div><span class="verified-chip">示例</span></div>
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
      <div class="route-code-hero"><span>${escapeHtml(route.id)}</span><div><small>线路类型</small><b>${type}</b></div><div><small>核验状态</small><b>示例概化</b></div></div>
      <section class="entity-overview"><h4>线路说明</h4><p>依据上传参考图中的主要节点概化绘制，用于验证战略骨架的分层、筛选与交互，不作为测绘或正式业务数据。</p></section>
      <button class="secondary-action" data-map-state="EXPLODED">在三层空间中查看</button>
      <div class="source-note"><span>REAL DATA ENDPOINT</span><p>GET /api/map/corridors · 支持版本与来源字段</p></div>`);
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
      <i>→</i><span><small>起讫区域</small><b>${escapeHtml(story.shipment.origin)} → ${escapeHtml(story.shipment.destination)}</b></span>`;
    this.root.querySelector('#story-stage-track').innerHTML = story.stages.map((stage, index) => `
      <i data-story-stage="${escapeHtml(stage.id)}" title="${escapeHtml(stage.title)}"><b>${String(index + 1).padStart(2, '0')}</b></i>`).join('');
    this.setStoryPlayback('playing');
  }

  updateStoryStage(stage, index, story) {
    this.root.querySelector('#story-index').textContent = `${stage.index} / ${String(story.stages.length - 1).padStart(2, '0')} · STORY`;
    this.root.querySelector('#story-title').textContent = stage.title;
    this.root.querySelector('#story-subtitle').textContent = stage.subtitle;
    this.root.querySelectorAll('[data-story-stage]').forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === index);
      item.classList.toggle('is-done', itemIndex < index);
    });
    const candidate = story.candidates.find((item) => item.selected);
    const metrics = {
      overview: [['业务主题', story.shipment.name], ['时限要求', story.shipment.serviceLevel], ['演示时长', `${story.duration} 秒`]],
      digital_collect: [['数据主体', `${story.subjects.length} 方`], ['可信模式', '可用不可见'], ['需求编号', story.shipment.id]],
      digital_optimize: [['候选方案', `${story.candidates.length} 条`], ['资源匹配', `${candidate.score}%`], ['综合成本', `${candidate.costChange}%`]],
      digital_contract: [['确认事项', `${story.agreements.length} 项`], ['可信审计', '全程存证'], ['合约状态', '待生效']],
      drill_operation: [['任务载体', '数字运单'], ['下发对象', '运营协同网'], ['状态', '正在下钻']],
      operation: [['协同主体', `${story.subjects.length} 方`], ['运输组织', candidate.name], ['货量', `${story.shipment.quantity} ${story.shipment.unit}`]],
      drill_infrastructure: [['作业指令', '港口装船'], ['映射对象', '营口港'], ['状态', '设施确认']],
      infrastructure: [['运输方式', story.execution.modes.join(' / ')], ['承运线路', '松原 → 营口 → 上海 → 南沙'], ['执行状态', '在途']],
      feedback: [['回流事件', `${story.feedback.length} 类`], ['数据去向', '物流数据总线'], ['闭环状态', '持续优化']],
    }[stage.id] ?? [];
    this.root.querySelector('#story-metrics').innerHTML = metrics.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join('');
  }

  updateStoryProgress(overallProgress, stageProgress, stage) {
    this.root.querySelector('#story-progress-bar').style.width = `${Math.min(100, overallProgress * 100).toFixed(2)}%`;
    const elapsed = Math.round(overallProgress * (this.runtime?.story?.story?.duration ?? 38));
    const duration = this.runtime?.story?.story?.duration ?? 38;
    this.root.querySelector('#story-time').textContent = `00:${String(elapsed).padStart(2, '0')} / 00:${String(duration).padStart(2, '0')}`;
    this.root.querySelector('#story-hud').style.setProperty('--stage-progress', stageProgress.toFixed(3));
    if (stage.id === 'digital_contract' && stageProgress > 0.72) this.root.querySelector('#story-metrics span:last-child b').textContent = '已生效';
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

  completeStory(story) {
    const hud = this.root.querySelector('#story-hud');
    hud.classList.add('is-complete');
    hud.classList.remove('is-paused');
    this.root.querySelector('#story-index').textContent = 'COMPLETE / CLOSED LOOP';
    this.root.querySelector('#story-title').textContent = '三网协同 · 一体化现代物流网';
    this.root.querySelector('#story-subtitle').textContent = '数据流、业务流、货物流贯通，形成持续优化的运行闭环';
    this.root.querySelector('#story-metrics').innerHTML = '<span><small>数字物流网</small><b>协同决策</b></span><span><small>物流运营网</small><b>组织资源</b></span><span><small>基础设施网</small><b>承载运输</b></span>';
    this.root.querySelector('#story-progress-bar').style.width = '100%';
    this.root.querySelector('#story-time').textContent = `00:${story.duration} / 00:${story.duration}`;
    const launch = this.root.querySelector('#story-toggle');
    launch.querySelector('i').textContent = '↻';
    launch.querySelector('b').textContent = '重新演示';
    this.root.querySelector('#story-control').textContent = '↻ 重播';
    this.root.querySelector('#story-state').textContent = 'CLOSED LOOP';
  }

  hideStory() {
    const hud = this.root.querySelector('#story-hud');
    hud.classList.remove('is-open', 'is-complete', 'is-paused');
    hud.setAttribute('aria-hidden', 'true');
    this.root.querySelector('#map-stage').classList.remove('story-active');
    const launch = this.root.querySelector('#story-toggle');
    launch.querySelector('i').textContent = '▶';
    launch.querySelector('b').textContent = '业务演示';
    this.root.querySelector('#story-state').textContent = 'AUTO PLAY';
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
    const html = [
      ...entities.map((entity) => `<button data-entity-id="${entity.id}" role="option"><i class="result-icon">●</i><span><b>${escapeHtml(entity.name)}</b><small>${escapeHtml(entity.type)} · ${escapeHtml(entity.province)}</small></span><em>实体</em></button>`),
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
