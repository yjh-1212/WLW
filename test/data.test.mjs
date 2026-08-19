import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  demoEntities,
  operationNetworkNodes,
  operationNetworkRelations,
  operationDashboard,
  digitalNetworkNodes,
  digitalNetworkRelations,
  buildProvinceOperationDashboard,
  buildProvinceInfrastructureDashboard,
  buildProvinceDigitalDashboard,
  infrastructureDashboard,
  buildFacilityDistributionRankings,
  attachInfrastructureFacilityStats,
  digitalDashboard,
  layerCatalog,
  demoTasks,
} from '../src/data/demoData.js';
import { demoLogisticsStory } from '../src/data/storyDemoData.js';
import { northGrainStory } from '../src/data/northGrainStoryData.js';
import {
  YINGKOU_SEA_BERTH,
  YINGKOU_TO_ZHANJIANG_SEA,
  ZHANJIANG_SEA_BERTH,
  coastalSegment,
  isCoastalEntity,
} from '../src/data/chinaCoastalRoute.js';
import { GeoProjector } from '../src/map/GeoProjector.js';
import * as THREE from 'three';
import { PenetrationController } from '../src/interaction/PenetrationController.js';
import { LogisticsStoryController } from '../src/story/LogisticsStoryController.js';
import { setGroupOpacity } from '../src/layers/rendering.js';
import { normalizeProvinceName } from '../src/core/MapRuntime.js';
import { MAP_STATES, MapStateMachine, resolveDrillNetworkLayer, stateToLayer } from '../src/core/MapStateMachine.js';

const routesPayload = JSON.parse(fs.readFileSync(new URL('../public/data/backbone-routes.json', import.meta.url), 'utf8'));
const infrastructureTransport = JSON.parse(fs.readFileSync(new URL('../public/data/infrastructure/transport.json', import.meta.url), 'utf8'));
const infrastructureFacilities = JSON.parse(fs.readFileSync(new URL('../public/data/infrastructure/facilities.json', import.meta.url), 'utf8'));
const autoPartsRoute = JSON.parse(fs.readFileSync(new URL('../public/data/infrastructure/auto-parts-route.json', import.meta.url), 'utf8'));
const northGrainRoute = JSON.parse(fs.readFileSync(new URL('../public/data/infrastructure/north-grain-route.json', import.meta.url), 'utf8'));
const provinceSvg = fs.readFileSync(new URL('../public/data/china-provinces.svg', import.meta.url), 'utf8');
const provinceBoundaries = JSON.parse(fs.readFileSync(new URL('../public/data/province-boundaries.json', import.meta.url), 'utf8'));
const interactionSource = fs.readFileSync(new URL('../src/core/InteractionManager.js', import.meta.url), 'utf8');
const runtimeSource = fs.readFileSync(new URL('../src/core/MapRuntime.js', import.meta.url), 'utf8');
const baseMapSource = fs.readFileSync(new URL('../src/map/ChinaBaseMap.js', import.meta.url), 'utf8');
const provinceDrilldownSource = fs.readFileSync(new URL('../src/map/ProvinceDrilldownLayer.js', import.meta.url), 'utf8');
const appShellSource = fs.readFileSync(new URL('../src/ui/AppShell.js', import.meta.url), 'utf8');
const stylesSource = fs.readFileSync(new URL('../src/styles/main.css', import.meta.url), 'utf8');
const demoDataSource = fs.readFileSync(new URL('../src/data/demoData.js', import.meta.url), 'utf8');
const dataManagerSource = fs.readFileSync(new URL('../src/data/LayerDataManager.js', import.meta.url), 'utf8');
const infrastructureLayerSource = fs.readFileSync(new URL('../src/layers/infrastructure/InfrastructureLayer.js', import.meta.url), 'utf8');
const operationLayerSource = fs.readFileSync(new URL('../src/layers/operation/OperationLayer.js', import.meta.url), 'utf8');
const digitalLayerSource = fs.readFileSync(new URL('../src/layers/digital/DigitalLayer.js', import.meta.url), 'utf8');
const renderingSource = fs.readFileSync(new URL('../src/layers/rendering.js', import.meta.url), 'utf8');
const storyControllerSource = fs.readFileSync(new URL('../src/story/LogisticsStoryController.js', import.meta.url), 'utf8');
const northGrainStorySource = fs.readFileSync(new URL('../src/data/northGrainStoryData.js', import.meta.url), 'utf8');
const autoExportStorySource = fs.readFileSync(new URL('../src/data/storyDemoData.js', import.meta.url), 'utf8');
const cameraDirectorSource = fs.readFileSync(new URL('../src/core/CameraDirector.js', import.meta.url), 'utf8');
const globeIntroSource = fs.readFileSync(new URL('../src/intro/HomeGlobeIntro.js', import.meta.url), 'utf8');
const worldOutline = JSON.parse(fs.readFileSync(new URL('../public/data/world-outline.json', import.meta.url), 'utf8'));

test('省级下钻只跟随当前屏幕状态，不受历史网络记忆影响', () => {
  // National single-network page -> drill that same network.
  assert.equal(resolveDrillNetworkLayer({ state: MAP_STATES.FOCUS_INFRA }), 'infrastructure');
  assert.equal(resolveDrillNetworkLayer({ state: MAP_STATES.FOCUS_OPERATION }), 'operation');
  assert.equal(resolveDrillNetworkLayer({ state: MAP_STATES.FOCUS_DIGITAL }), 'digital');

  // Combined / exploded / penetration national view -> plain three-layer province.
  assert.equal(resolveDrillNetworkLayer({ state: MAP_STATES.COMBINED }), null);
  assert.equal(resolveDrillNetworkLayer({ state: MAP_STATES.EXPLODED }), null);

  // Already inside a province -> keep that province's own network.
  assert.equal(resolveDrillNetworkLayer({
    selectedProvince: '广东',
    provinceInfrastructureView: true,
    state: MAP_STATES.FOCUS_OPERATION,
  }), 'infrastructure');
  assert.equal(resolveDrillNetworkLayer({
    selectedProvince: '广东',
    provinceOperationView: true,
    state: MAP_STATES.FOCUS_INFRA,
  }), 'operation');
  assert.equal(resolveDrillNetworkLayer({
    selectedProvince: '河南',
    provinceDigitalView: true,
    state: MAP_STATES.FOCUS_OPERATION,
  }), 'digital');

  // A stale focus state must not leak once we are on a combined national view.
  assert.equal(resolveDrillNetworkLayer({ state: MAP_STATES.EXPLODED }), null);

  assert.match(runtimeSource, /resolveDrillNetworkLayer/);
});

test('顶部基础运营数字多次往返后仍进入对应全国网再下钻', () => {
  const machine = new MapStateMachine();
  const events = [];
  machine.addEventListener('change', (event) => events.push(event.detail.state));

  machine.setState(MAP_STATES.FOCUS_INFRA, { province: '广东' });
  machine.setState(MAP_STATES.FOCUS_OPERATION, { force: true });
  machine.setState(MAP_STATES.FOCUS_INFRA, { force: true });
  machine.setState(MAP_STATES.FOCUS_OPERATION, { force: true });
  machine.setState(MAP_STATES.FOCUS_INFRA, { force: true });
  assert.equal(machine.state, MAP_STATES.FOCUS_INFRA);
  assert.equal(stateToLayer[machine.state], 'infrastructure');
  assert.equal(machine.context.province, undefined);
  assert.ok(events.filter((state) => state === MAP_STATES.FOCUS_INFRA).length >= 3);
  assert.ok(events.filter((state) => state === MAP_STATES.FOCUS_OPERATION).length >= 2);

  // Same national state without force should not re-emit.
  const before = events.length;
  machine.setState(MAP_STATES.FOCUS_INFRA, {});
  assert.equal(events.length, before);

  assert.match(runtimeSource, /enterNationalNetwork\(/);
  assert.match(runtimeSource, /networkFocusLayer/);
  assert.match(runtimeSource, /resolveDrillNetworkLayer/);
  assert.match(appShellSource, /resetNationalNetworkCockpits/);
  assert.match(appShellSource, /modeButton && this\.runtime\) \{\s*this\.runtime\.setState\(modeButton\.dataset\.mapState\);\s*return;/);
});

test('每层图层抽屉支持一键关闭和重新开启全部元素', () => {
  assert.match(appShellSource, /data-layer-toggle-all/);
  assert.match(appShellSource, /toggleAllLayerElements/);
  assert.match(runtimeSource, /setLayerFilters\(layer, ids, enabled\)/);
});

test('单层聚焦时完整隐藏另外两层的线路与设施元素', () => {
  assert.match(runtimeSource, /if \(layer === activeLayer\) return \[layer, \{[^}]*weight: 1/);
  assert.match(runtimeSource, /return \[layer, \{[^}]*weight: 0/);
  assert.match(infrastructureLayerSource, /this\.add\(this\.transportRoot\)/);
  assert.match(infrastructureLayerSource, /this\.add\(this\.facilityRoot\)/);
});

test('三层炸开和穿透视图使用实体地图板材', () => {
  assert.match(runtimeSource, /solidSheets = Boolean\(this\.selectedProvince\) \|\| state === MAP_STATES\.EXPLODED \|\| state === MAP_STATES\.PENETRATION/);
  assert.match(runtimeSource, /const sheetOpacity = solidSheets \? 1 : sheet\.userData\.baseOpacity \* target\.weight/);
  assert.match(runtimeSource, /this\.baseMap\.setSheetOpacity\(sheet, sheetOpacity, \{ solid: solidSheets \}\)/);
});

test('炸开视图中的上层实体地图遮挡下层基础设施要素', () => {
  assert.match(runtimeSource, /setStackOcclusion\(solidSheets\)/);
  assert.match(infrastructureLayerSource, /setStackOcclusion\(enabled\)/);
  assert.match(infrastructureLayerSource, /\[this\.routeRoot, this\.transportRoot, this\.facilityRoot, this\.cityRoot, this\.skeletonRoot, this\.outboundRoot, this\.weakRoot\]/);
  assert.match(infrastructureLayerSource, /material\.depthTest = enabled/);
});

test('地图板保持浅厚度且轮廓不绘制垂直栅栏线', () => {
  assert.match(baseMapSource, /createTopSurfaceEdges/);
  assert.match(baseMapSource, /Math\.abs\(firstZ - topZ\)/);
  assert.match(infrastructureLayerSource, /this\.sheet\.scale\.z = 0\.44/);
  assert.match(runtimeSource, /this\.controls\.maxPolarAngle = THREE\.MathUtils\.degToRad\(68\)/);
  assert.match(runtimeSource, /this\.controls\.minDistance = 12/);
});

test('战略骨架包含六轴、七廊、八通道', () => {
  const counts = routesPayload.routes.reduce((result, route) => {
    result[route.type] = (result[route.type] ?? 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, { channel: 8, corridor: 7, axis: 6 });
  assert.equal(new Set(routesPayload.routes.map((route) => route.id)).size, 21);
});

test('本地地图资产包含全部省级对象', () => {
  assert.equal((provinceSvg.match(/data-name=/g) ?? []).length, 34);
  assert.match(provinceSvg, /data-name="辽宁"/);
  assert.match(provinceSvg, /data-name="广东"/);
});

test('基础设施本地数据包含主要公路、主要铁路和三类设施点', () => {
  assert.deepEqual(infrastructureTransport.layers.map((layer) => [layer.id, layer.featureCount]), [
    ['majorRoads', 1742],
    ['majorRailways', 504],
  ]);
  assert.ok(infrastructureTransport.layers.every((layer) => layer.segmentCount > layer.featureCount));
  infrastructureTransport.layers.forEach((layer) => {
    assert.equal(layer.segments.length, layer.segmentCount * 4);
    for (let index = 0; index < layer.segments.length; index += 2) {
      assert.ok(layer.segments[index] >= 73 && layer.segments[index] <= 135);
      assert.ok(layer.segments[index + 1] >= 18 && layer.segments[index + 1] <= 54);
    }
  });
  assert.deepEqual(infrastructureFacilities.layers.map((layer) => [layer.id, layer.count]), [
    ['nationalHubs', 229],
    ['coldChainBases', 105],
    ['logisticsParks', 182],
  ]);
  infrastructureFacilities.layers.flatMap((layer) => layer.points).forEach((feature) => {
    assert.ok(feature.id && feature.name && feature.province);
    assert.ok(feature.coordinates[0] >= 73 && feature.coordinates[0] <= 135);
    assert.ok(feature.coordinates[1] >= 18 && feature.coordinates[1] <= 54);
  });
  assert.match(runtimeSource, /infrastructureData:\s*this\.data\.infrastructure/);
  assert.match(interactionSource, /kind:\s*['"]facility['"]/);
  assert.match(appShellSource, /主要交通线网/);
  assert.match(appShellSource, /物流设施点/);
});

test('省级平台按基础设施网实际设施点统计三类数量', () => {
  assert.equal(normalizeProvinceName('广东省'), '广东');
  assert.equal(normalizeProvinceName('广西壮族自治区'), '广西');
  assert.equal(normalizeProvinceName('北京市'), '北京');
  assert.equal(normalizeProvinceName('新疆生产建设兵团'), '新疆');

  const provinceNames = new Set(Object.keys(provinceBoundaries.provinces));
  infrastructureFacilities.layers.forEach((layer) => {
    assert.ok(layer.points.every((point) => provinceNames.has(normalizeProvinceName(point.province))));
  });

  const countsFor = (province) => Object.fromEntries(infrastructureFacilities.layers.map((layer) => [
    layer.id,
    layer.points.filter((point) => normalizeProvinceName(point.province) === province).length,
  ]));
  assert.deepEqual(countsFor('广东'), { nationalHubs: 14, coldChainBases: 7, logisticsParks: 7 });
  assert.deepEqual(countsFor('湖北'), { nationalHubs: 9, coldChainBases: 4, logisticsParks: 4 });
  assert.match(runtimeSource, /normalizeProvinceName\(feature\.province\) === normalizedProvince/);
});

test('本地业务实体遵循统一实体字段约定', () => {
  assert.equal(new Set(demoEntities.map((entity) => entity.id)).size, demoEntities.length);
  demoEntities.forEach((entity) => {
    assert.ok(entity.id && entity.name && entity.type);
    assert.equal(entity.coordinate_system, 'WGS84');
    assert.equal(entity.mapPoint.length, 2);
    assert.ok(entity.infrastructure && entity.operation && entity.digital);
  });
});

test('运营网和数字网使用独立分级节点与语义关系', () => {
  assert.equal(operationNetworkNodes.length, 21);
  assert.equal(operationNetworkRelations.length, 28);
  assert.equal(digitalNetworkNodes.length, 52);
  assert.equal(digitalNetworkRelations.length, 76);

  const validateNetwork = (nodes, relations) => {
    const ids = new Set(nodes.map((node) => node.id));
    assert.equal(ids.size, nodes.length);
    assert.ok(nodes.every((node) => node.networkRole && [0, 1, 2].includes(node.lod)));
    relations.forEach((relation) => {
      assert.ok(ids.has(relation.from), `missing relation origin: ${relation.from}`);
      assert.ok(ids.has(relation.to), `missing relation destination: ${relation.to}`);
      assert.ok([0, 1, 2].includes(relation.lod));
    });
  };
  validateNetwork(operationNetworkNodes, operationNetworkRelations);
  validateNetwork(digitalNetworkNodes, digitalNetworkRelations);

  assert.deepEqual(new Set(operationNetworkRelations.map((relation) => relation.type)), new Set(['collaboration', 'order', 'capacity', 'handoff', 'feedback', 'exception']));
  assert.deepEqual(new Set(digitalNetworkRelations.map((relation) => relation.type)), new Set(['authorization', 'api', 'access', 'event', 'decision', 'feedback', 'corridor']));
  assert.ok(digitalNetworkNodes.some((node) => node.networkRole === 'trusted-space'));
});

test('物流运营网按货、单、运、联、态、异组织全国运行态势', () => {
  assert.deepEqual(operationDashboard.modes.map((mode) => mode.id), ['overview', 'cargo', 'tasks', 'multimodal', 'capacity', 'alerts']);
  assert.deepEqual(operationDashboard.metrics.map((metric) => metric.id), ['cargo', 'tasks', 'multimodal', 'capacity', 'alerts']);
  assert.ok(operationNetworkNodes.every((node) => Number.isFinite(node.operation.activity)));
  assert.ok(operationNetworkRelations.every((relation) => relation.mode && Number.isFinite(relation.volume) && Number.isFinite(relation.activity)));
  assert.match(appShellSource, /operation-subnav/);
  assert.match(appShellSource, /operation-insight-panel/);
  assert.match(appShellSource, /operation-ticker/);
  assert.match(appShellSource, /operation-hub-callout/);
  assert.doesNotMatch(appShellSource, /operation-corridor-label/);
  assert.match(appShellSource, /syncOperationOverlays/);
  assert.equal(operationDashboard.mapOverlays.hubs.length, 6);
  assert.equal((operationDashboard.mapOverlays.corridors ?? []).length, 0);
  assert.equal(operationDashboard.alertBreakdown.at(-1).label, '换装');
  assert.match(operationLayerSource, /VIEW_MATCHERS/);
  assert.match(operationLayerSource, /setViewMode\(mode = 'overview'\)/);
  assert.match(operationLayerSource, /getEntityWorldPosition\(entityId\)/);
  assert.match(operationLayerSource, /AdditiveBlending/);
  assert.match(operationLayerSource, /PointsMaterial/);
  assert.match(runtimeSource, /updateOperationOverlays\(\)/);
  assert.match(stylesSource, /Logistics operation cockpit/);
  assert.match(stylesSource, /operation-map-overlays/);
});

test('运营网省级下钻沿用全国左中右驾驶舱并展示本省数据', () => {
  const dashboard = buildProvinceOperationDashboard({
    province: '广东',
    cityCount: 21,
    cities: ['广州', '佛山', '深圳', '东莞', '湛江'],
    nationalHubs: 4,
    coldChainBases: 3,
    logisticsParks: 12,
  });
  assert.deepEqual(dashboard.modes.map((mode) => mode.id), operationDashboard.modes.map((mode) => mode.id));
  assert.equal(dashboard.scope, '广东');
  assert.match(dashboard.modeBriefs.overview.title, /广东/);
  assert.equal(dashboard.metrics.length, 5);
  assert.ok(dashboard.hotFlows.length >= 1);
  assert.ok(dashboard.topHubs.length >= 1);
  assert.ok(dashboard.ticker.length >= 6);
  assert.ok(dashboard.cityNetwork.cities.length >= 1);
  assert.ok(dashboard.cityNetwork.flows.length >= Math.max(1, dashboard.cityNetwork.cities.length - 1));
  const linkedGuangdong = new Set(dashboard.cityNetwork.flows.flatMap((flow) => [flow.from, flow.to]));
  dashboard.cityNetwork.cities.forEach((city) => assert.equal(linkedGuangdong.has(city.name), true));
  assert.doesNotMatch(dashboard.tasks.map((task) => task.name).join(' '), /北粮南运|汽车出海/);
  const shandong = buildProvinceOperationDashboard({
    province: '山东',
    cityCount: 16,
    cities: ['济南市', '青岛市', '烟台市', '潍坊市', '临沂市'],
    cityRecords: [
      { name: '济南市', center: [117.0, 36.65] },
      { name: '青岛市', center: [120.38, 36.07] },
      { name: '烟台市', center: [121.39, 37.54] },
      { name: '潍坊市', center: [119.16, 36.71] },
      { name: '临沂市', center: [118.36, 35.10] },
    ],
    nationalHubs: 2,
    logisticsParks: 8,
  });
  assert.match(shandong.tasks[0].name, /济南|青岛/);
  assert.match(shandong.tasks[0].route, /济南.+青岛|青岛.+济南/);
  assert.doesNotMatch(shandong.tasks[0].name, /北粮南运/);
  assert.equal(shandong.hotFlows[0].from, '济南');
  assert.equal(shandong.hotFlows[0].to, '青岛');
  assert.equal(shandong.cityNetwork.cities.length, 5);
  assert.ok(shandong.cityNetwork.flows.length >= 4);
  const linkedShandong = new Set(shandong.cityNetwork.flows.flatMap((flow) => [flow.fromId, flow.toId]));
  shandong.cityNetwork.cities.forEach((city) => assert.equal(linkedShandong.has(city.id), true));
  assert.match(runtimeSource, /provinceOperationView/);
  assert.match(runtimeSource, /operationCockpit: stayOnOperation/);
  assert.match(runtimeSource, /enterNationalNetwork\(/);
  assert.match(runtimeSource, /networkFocusLayer/);
  assert.match(runtimeSource, /force: true/);
  assert.match(runtimeSource, /Top-bar 基础 \/ 运营 \/ 数字 always open that network's national page/);
  assert.match(appShellSource, /resetNationalNetworkCockpits/);
  assert.match(appShellSource, /provinceCockpit/);
  assert.match(appShellSource, /hadInfrastructureDashboard/);
  assert.match(appShellSource, /hadOperationDashboard/);
  assert.match(runtimeSource, /\? MAP_STATES\.FOCUS_OPERATION/);
  assert.match(runtimeSource, /: MAP_STATES\.EXPLODED;/);
  assert.match(runtimeSource, /setProvincialCityNetwork/);
  assert.match(runtimeSource, /cityRecords:/);
  assert.match(runtimeSource, /this\.provinceDrilldown\.showProvince\(provinceName, center/);
  assert.doesNotMatch(runtimeSource, /stayOnOperation\) this\.provinceDrilldown\?\.clearProvince/);
  assert.match(operationLayerSource, /setProvincialCityNetwork\(network/);
  assert.match(operationLayerSource, /getCityWorldPosition\(cityId\)/);
  assert.match(appShellSource, /buildProvinceOperationDashboard/);
  assert.match(appShellSource, /refreshOperationCockpit/);
  assert.doesNotMatch(appShellSource, /operation-province-back/);
  assert.match(appShellSource, /operation-drawer-tail/);
  assert.match(stylesSource, /operation-drawer-tail/);
  assert.match(stylesSource, /focus-operation:not\(\.story-active\) \.operation-insight-panel/);
  assert.doesNotMatch(stylesSource, /:not\(\.province-view\) \.operation-insight-panel/);
  assert.match(cameraDirectorSource, /cockpit = false/);
  assert.match(cameraDirectorSource, /focusCockpitBounds/);
  assert.match(cameraDirectorSource, /distForHeight/);
  assert.match(cameraDirectorSource, /padTop = 118/);
  assert.match(runtimeSource, /viewWidth: viewport\?\.clientWidth/);
  assert.doesNotMatch(appShellSource, /场景模式/);
  assert.doesNotMatch(appShellSource, /operation-scene-selector/);
  assert.match(runtimeSource, /cameraUserOverride/);
  assert.match(runtimeSource, /beginUserCamera/);
  assert.match(runtimeSource, /if \(this\.cameraDirector\?\.programmatic\)/);
  assert.doesNotMatch(runtimeSource, /selectedProvince && !this\.cameraUserOverride && !this\.cameraDirector/);
  assert.match(baseMapSource, /child\.userData\?\.kind !== 'province'/);
  assert.match(runtimeSource, /networkFocusLayer/);
  assert.match(interactionSource, /beginUserCamera/);
  assert.match(interactionSource, /selectedProvince === hit\.provinceName/);
  assert.match(stylesSource, /operation-page \.province-view \.province-return-fab/);
  assert.doesNotMatch(stylesSource, /operation-page \.province-return-fab\{display:none!important\}/);
  assert.match(operationLayerSource, /SANDBOX_GRADE/);
  assert.match(operationLayerSource, /setSandboxHover/);
  assert.match(operationLayerSource, /makeSandboxCurve/);
  assert.match(runtimeSource, /sandbox: singleLayerProvince/);
  assert.match(runtimeSource, /sandbox: true/);
  assert.match(runtimeSource, /kind: 'hub'/);
  assert.match(baseMapSource, /this\.sandboxFocus/);
  const regional = shandong.cityNetwork.flows.some((flow) => {
    const from = shandong.cityNetwork.cities.find((city) => city.id === flow.fromId);
    const to = shandong.cityNetwork.cities.find((city) => city.id === flow.toId);
    return from && to && !from.capital && !to.capital;
  });
  assert.equal(regional, true);
  assert.ok(shandong.cityNetwork.cities.some((city) => city.tier === 1));
  assert.ok(shandong.cityNetwork.flows.some((flow) => flow.grade === 'trunk'));
  assert.ok(shandong.cityNetwork.flows.some((flow) => flow.grade === 'feeder' || flow.grade === 'regional'));
});

test('基础设施网省级下钻保持单层驾驶舱并展示本省设施数据', () => {
  const cityRecords = (provinceBoundaries.provinces['广东']?.cities ?? []).map((city) => ({
    name: city.name,
    center: city.center,
  }));
  const dashboard = buildProvinceInfrastructureDashboard({
    province: '广东',
    cityCount: cityRecords.length || 21,
    cityRecords,
    nationalHubs: 14,
    coldChainBases: 7,
    logisticsParks: 7,
  }, {
    infrastructure: { facilities: infrastructureFacilities },
    entities: demoEntities,
    infrastructureDashboard,
  });
  const qinghaiCities = (provinceBoundaries.provinces['青海']?.cities ?? []).map((city) => ({
    name: city.name,
    center: city.center,
  }));
  const qinghai = buildProvinceInfrastructureDashboard({
    province: '青海',
    cityCount: qinghaiCities.length || 8,
    cityRecords: qinghaiCities,
  }, {
    infrastructure: { facilities: infrastructureFacilities },
    entities: demoEntities,
    infrastructureDashboard,
  });
  assert.equal(dashboard.scope, '广东');
  assert.equal(dashboard.layout, 'provincial');
  assert.deepEqual(dashboard.modes.map((mode) => mode.id), ['overview', 'skeleton', 'outbound', 'nodes', 'parks']);
  assert.deepEqual(dashboard.modes.map((mode) => mode.label), ['综合总览', '省内骨架', '对外通道', '节点分布', '园区基地']);
  assert.doesNotMatch(dashboard.modes.map((mode) => mode.label).join(' '), /短板分析/);
  assert.equal(dashboard.overviewCards.find((card) => card.id === 'nationalHubs').label, '核心枢纽城市');
  assert.ok(Number(dashboard.overviewCards.find((card) => card.id === 'nationalHubs').value.replace(/,/g, '')) >= 1);
  assert.equal(dashboard.overviewCards.find((card) => card.id === 'highways').label, '地市覆盖数');
  assert.equal(dashboard.overviewCards.find((card) => card.id === 'channels').label, '出省通道数');
  assert.equal(dashboard.overviewCards.find((card) => card.id === 'parks').label, '重点园区/基地');
  assert.equal(dashboard.overviewCards.find((card) => card.id === 'parks').value, '14');
  assert.equal(dashboard.overviewCards.find((card) => card.id === 'stations').label, '重点货运节点');
  assert.equal(dashboard.overviewCards.find((card) => card.id === 'auth').label, '县域覆盖率');
  assert.doesNotMatch(dashboard.overviewCards.map((card) => card.label).join(' '), /国家物流枢纽|港口泊位|万吨级泊位|高速公路|骨干冷链基地|六轴|七廊/);
  assert.doesNotMatch(dashboard.modes.map((mode) => mode.label).join(' '), /铁路网络|公路网络|水运网络|航空网络|物流枢纽/);
  assert.equal(dashboard.layerToggles[0].label, '省内骨干通道');
  assert.deepEqual(dashboard.layerToggles.map((item) => item.id), [
    'provincialBackbone', 'outboundChannels', 'cityNodes', 'logisticsParks', 'coldChainBases',
    'railFreight', 'roadFreight', 'airPortFacilities',
  ]);
  assert.doesNotMatch(dashboard.layerToggles.map((item) => item.id).join(' '), /weakAreas/);
  assert.equal(dashboard.rankingTitle, '设施分布 TOP 5');
  assert.deepEqual(dashboard.rankingTabs.map((tab) => tab.id), ['count', 'level', 'link', 'cover']);
  assert.ok(dashboard.rankings.count.length >= 1);
  assert.ok(dashboard.rankings.count[0].role);
  assert.ok(dashboard.facilityStructure.some((item) => item.label === '综合枢纽'));
  assert.equal(dashboard.outbound.neighbors, 5);
  assert.equal(dashboard.outbound.channels, 5);
  assert.equal(dashboard.connectivity.title, '设施连通性指数');
  assert.equal(dashboard.connectivity.label, '省内综合指数');
  assert.ok(dashboard.connectivity.regions.some(([label]) => label === '省会都市圈'));
  assert.equal(typeof dashboard.weakness.coverage, 'number');
  assert.ok(dashboard.mapOverlays.hubs.length >= 1);
  assert.ok(dashboard.mapOverlays.hubs[0].level);
  assert.doesNotMatch(dashboard.mapOverlays.hubs.map((hub) => `${hub.level}${hub.tasks ?? ''}`).join(' '), /国家枢纽/);
  assert.equal(qinghai.outbound.neighbors, 4);
  assert.deepEqual(qinghai.analysis.neighbors.map((item) => item.name), ['新疆', '甘肃', '四川', '西藏']);
  assert.ok(qinghai.analysis.skeleton.length >= 1);
  assert.ok(qinghai.analysis.cities.some((city) => city.name === '西宁' && city.tier === 1));
  assert.ok(qinghai.analysis.cities.some((city) => city.name === '格尔木'));
  assert.ok(qinghai.analysis.cities.some((city) => city.name.includes('玉树')));
  assert.ok(qinghai.analysis.cities.some((city) => city.name.includes('海东')));
  assert.deepEqual(qinghai.mapOverlays.hubs.slice(0, 2).map((hub) => hub.name), ['西宁', '格尔木']);
  assert.match(runtimeSource, /provinceInfrastructureView/);
  assert.match(runtimeSource, /infrastructureCockpit: stayOnInfrastructure/);
  assert.match(runtimeSource, /stayOnInfrastructure[\s\S]*\? MAP_STATES\.FOCUS_INFRA/);
  assert.match(runtimeSource, /sandboxRole: stayOnInfrastructure \? 'infrastructure' : stayOnDigital \? 'digital' : 'operation'/);
  assert.match(runtimeSource, /enterNationalNetwork/);
  assert.match(runtimeSource, /networkFocusLayer/);
  assert.match(runtimeSource, /force: true/);
  assert.match(runtimeSource, /cockpit: \(state === MAP_STATES\.FOCUS_OPERATION && this\.provinceOperationView\)/);
  assert.match(runtimeSource, /keepInfrastructure: this\.provinceInfrastructureView/);
  assert.match(appShellSource, /restoreNationalInfrastructureCockpit/);
  assert.match(appShellSource, /resetNationalNetworkCockpits/);
  assert.match(stylesSource, /app-shell:not\(\.digital-page\) \.province-view\.focus-digital #digital-workspace/);
  assert.doesNotMatch(runtimeSource, /syncProvinceFocusMode/);
  assert.match(runtimeSource, /resolveDrillNetworkLayer/);
  assert.match(runtimeSource, /setProvinceAnalysis\(analysis\)/);
  assert.match(infrastructureLayerSource, /setFocusProvince\(provinceName/);
  assert.match(infrastructureLayerSource, /applyProvinceFocus\(\)/);
  assert.match(infrastructureLayerSource, /setProvinceAnalysis/);
  assert.match(infrastructureLayerSource, /provinceContains/);
  assert.match(infrastructureLayerSource, /sourcePositions/);
  assert.match(infrastructureLayerSource, /clipPolyline\(points\)/);
  assert.match(infrastructureLayerSource, /ProvincialSkeletonRoot/);
  assert.match(infrastructureLayerSource, /makeHexagonMesh/);
  assert.match(infrastructureLayerSource, /new THREE\.PlaneGeometry\(worldHeight/);
  assert.doesNotMatch(infrastructureLayerSource, /new THREE\.SpriteMaterial/);
  assert.match(demoDataSource, /土家族苗族自治州\$\/u, '州'/);
  assert.match(infrastructureLayerSource, /makeOutboundArrow/);
  assert.doesNotMatch(infrastructureLayerSource, /makeWarningMark/);
  assert.doesNotMatch(appShellSource, /短板分析/);
  assert.match(infrastructureLayerSource, /provincialBackbone' && !this\.provinceAnalysis/);
  assert.match(runtimeSource, /nudgeCameraZoom/);
  assert.match(runtimeSource, /resetProvinceFraming/);
  assert.match(runtimeSource, /layers\?\.infrastructure\?\.update\?/);
  assert.match(appShellSource, /infra-map-legend/);
  assert.match(appShellSource, /infra-map-controls/);
  assert.match(appShellSource, /renderInfraMapChrome\('national'\)/);
  assert.doesNotMatch(appShellSource, /infra-city-card/);
  assert.match(appShellSource, /layout === 'provincial' \? \[\]/);
  assert.match(appShellSource, /renderInfraMapChrome/);
  assert.match(stylesSource, /\.infra-map-legend/);
  assert.match(cameraDirectorSource, /margin = 1\.08/);
  assert.match(runtimeSource, /fill: state === MAP_STATES\.FOCUS_INFRA \? 1\.18 : 1\.08/);
  assert.match(runtimeSource, /captureLayerCamera/);
  assert.match(runtimeSource, /savedLayerCamera/);
  assert.match(runtimeSource, /beginFilterBatch/);
  assert.match(cameraDirectorSource, /settleControls/);
  assert.match(cameraDirectorSource, /surfaceZ/);
  assert.match(infrastructureLayerSource, /transportClipCache/);
  assert.match(infrastructureLayerSource, /beginFocusBatch/);
  assert.match(baseMapSource, /containsProvincePoint/);
  assert.match(runtimeSource, /provincePointTest\(\)/);
  assert.match(appShellSource, /modeFilters/);
  assert.match(appShellSource, /省级基础设施总览/);
  assert.match(appShellSource, /重点设施结构/);
  assert.match(appShellSource, /对外通达方向/);
  assert.doesNotMatch(appShellSource, /薄弱区域/);
  assert.doesNotMatch(appShellSource, /补强建议/);
  assert.doesNotMatch(appShellSource, /短板分析/);
  assert.match(appShellSource, /layout === 'provincial'/);
  assert.match(infrastructureLayerSource, /getFeatureWorldPosition\(featureId\)/);
  assert.match(infrastructureLayerSource, /getCityWorldPosition/);
  assert.match(appShellSource, /buildProvinceInfrastructureDashboard/);
  assert.match(appShellSource, /getInfrastructureDashboard\(\)/);
  assert.match(appShellSource, /provinceInfrastructureDashboard/);
  assert.match(appShellSource, /layout === 'provincial'/);
  assert.match(stylesSource, /province-view\.focus-infrastructure \.province-return-fab/);
  assert.match(provinceDrilldownSource, /sandboxRole = 'operation'/);
  assert.match(provinceDrilldownSource, /sandboxRole === 'infrastructure'/);
  assert.match(provinceDrilldownSource, /setWeakCities/);
  assert.match(provinceDrilldownSource, /setWeakHighlight/);
  assert.match(baseMapSource, /sandboxPalette\(role\)/);
  assert.match(interactionSource, /查看\$\{provinceName\}基础设施/);
  assert.match(cameraDirectorSource, /focusCockpitBounds/);
});

test('重庆整车运输任务可沿运营关系连续穿透至上海港', () => {
  const task = operationDashboard.tasks.find((item) => item.id === 'OP_TASK_AUTO_EXPORT');
  const relations = task.relationIds.map((id) => operationNetworkRelations.find((relation) => relation.id === id));
  assert.ok(relations.every(Boolean));
  assert.deepEqual(relations.map((relation) => [relation.from, relation.to]), [
    ['OP_CHONGQING_AUTO', 'OP_CHONGQING_BASE'],
    ['OP_CHONGQING_BASE', 'OP_WUHAN_CENTER'],
    ['OP_WUHAN_CENTER', 'OP_SHANGHAI_PORT'],
  ]);
  assert.match(runtimeSource, /focusOperationTask\(taskId/);
  assert.match(runtimeSource, /setLod\(2, null\)/);
  assert.match(operationLayerSource, /setTaskFocus\(relationIds = \[\]\)/);
  assert.match(appShellSource, /openOperationTask\(task\)/);
});

test('业务网络按全国骨干、单层完整和省级隔离三种视角显示', () => {
  assert.match(dataManagerSource, /infrastructureEntities/);
  assert.match(dataManagerSource, /operationNodes:\s*operationNetworkNodes/);
  assert.match(dataManagerSource, /digitalNodes:\s*digitalNetworkNodes/);
  assert.match(runtimeSource, /focusedLayer === 'operation' \? Math\.max\(1, this\.lod\.level\)/);
  assert.match(runtimeSource, /focusedLayer === 'digital' \? Math\.max\(1, this\.lod\.level\)/);
  assert.match(runtimeSource, /const objects = this\.getNationalContentObjects\(\)/);
  assert.match(operationLayerSource, /setLod\(level = 0, focusProvince = null\)/);
  assert.match(digitalLayerSource, /setLod\(level = 0, focusProvince = null\)/);
  assert.doesNotMatch(digitalLayerSource, /const CONNECTIONS/);
});

test('省级业务阶段的三层标签锚定当前省份图层', () => {
  assert.match(runtimeSource, /const focusedProvince = this\.selectedProvince \?\? this\.storyProvinceFocus/);
  assert.match(runtimeSource, /focusedProvince \? sheet\?\.userData\?\.provinces\?\.get\(focusedProvince\) : sheet/);
  assert.match(runtimeSource, /const anchorZ = focusedProvince \? box\.min\.z \+ 1\.3 : box\.max\.z \+ 0\.6/);
});

test('界面和业务流程不使用占位式表述或来源不明的主体名称', () => {
  const userFacingSources = [appShellSource, northGrainStorySource, autoExportStorySource].join('\n');
  const sanitized = userFacingSources.replace(/场景演示/g, '');
  assert.doesNotMatch(sanitized, /演示|示例|展示|DEMO|模拟|样例|占位|国贸粮油|重庆汽车出海/);
  assert.match(northGrainStorySource, /粮食贸易商/);
  assert.doesNotMatch(northGrainStorySource, /广东粮食采购方/);
  assert.match(autoExportStorySource, /汽车出口贸易商/);
  assert.match(autoExportStorySource, /title: '汽车出海 · 渝沪跨区域整车物流协同'/);
});

test('参考坐标统一映射到 Three.js 世界坐标', () => {
  const projector = new GeoProjector();
  const center = projector.fromMapPoint([720, 584]);
  assert.deepEqual(center.toArray(), [0, 0, 0]);
  assert.equal(projector.parseReferencePath('M760,615L860,515').length, 2);
  assert.equal(projector.routeSegments({ geometry: { type: 'LineString', coordinates: [[73, 18], [135, 54]] } }).length, 1);
  const controlPoints = [
    [[126.651705, 45.771252], [1109.0, 333.4]],
    [[87.562114, 43.839168], [478.0, 390.8]],
    [[108.948408, 34.279359], [837.8, 631.0]],
    [[114.31074, 30.583479], [946.5, 709.0]],
    [[102.713155, 25.052122], [718.4, 848.5]],
    [[108.293286, 22.809304], [836.3, 895.7]],
    [[91.110326, 29.665258], [489.0, 719.7]],
  ];
  controlPoints.forEach(([coordinate, expected]) => {
    const actual = projector.referencePointFromLngLat(coordinate);
    assert.ok(Math.hypot(actual[0] - expected[0], actual[1] - expected[1]) < 4);
  });
});

test('三类物流设施使用独立地图图标', () => {
  assert.match(infrastructureLayerSource, /createFacilityIconTexture/);
  assert.match(infrastructureLayerSource, /nationalHubs/);
  assert.match(infrastructureLayerSource, /coldChainBases/);
  assert.match(infrastructureLayerSource, /logisticsParks/);
  assert.match(infrastructureLayerSource, /CanvasTexture/);
});

test('公路与铁路使用交通地图常见的衬线和轨道线型', () => {
  assert.match(infrastructureLayerSource, /LineSegments2/);
  assert.match(infrastructureLayerSource, /\$\{layer\.id\}-casing/);
  assert.match(infrastructureLayerSource, /majorRailways/);
  assert.match(infrastructureLayerSource, /dashed:\s*isRailway/);
  assert.match(infrastructureLayerSource, /depthTest:\s*false/);
  assert.match(infrastructureLayerSource, /width:\s*isRailway \? 1\.9 : 2\.2/);
});

test('本地业务实体名称、经纬度与地图点位保持一致', () => {
  const projector = new GeoProjector();
  demoEntities.forEach((entity) => {
    const projected = projector.fromLngLat([entity.longitude, entity.latitude]);
    const legacyPoint = projector.fromMapPoint(entity.mapPoint);
    assert.ok(projected.distanceTo(legacyPoint) < 0.001, `${entity.name} 的 mapPoint 与经纬度不一致`);
    assert.deepEqual(projector.fromEntity(entity).toArray(), projected.toArray());
  });
  const platformIds = new Set(demoLogisticsStory.platforms.map((platform) => platform.id));
  demoLogisticsStory.subjects.forEach((subject) => {
    assert.ok(subject.name && subject.role && platformIds.has(subject.platformId));
    assert.ok(subject.coordinates[0] >= 73 && subject.coordinates[0] <= 135);
    assert.ok(subject.coordinates[1] >= 18 && subject.coordinates[1] <= 54);
  });
  demoLogisticsStory.execution.nodes.forEach((node) => assert.equal(projector.fromLngLat(node.coordinates).z, 0));
  assert.match(demoLogisticsStory.shipment.origin, /重庆/);
  assert.match(demoLogisticsStory.shipment.destination, /上海港/);
});

test('垂直穿透控制器允许在无选中对象时安全初始化', () => {
  const registry = { getReferences: () => ({}) };
  const selectionRoot = new THREE.Group();
  assert.doesNotThrow(() => new PenetrationController({ registry, selectionRoot }));
  assert.equal(selectionRoot.children.length, 1);
  assert.equal(selectionRoot.children[0].visible, false);
});

test('全国地图支持省级点击下钻，路线仍保持优先交互', () => {
  assert.match(interactionSource, /kind:\s*['"]province['"]/);
  assert.match(runtimeSource, /getInteractiveProvinceMeshes/);
  assert.match(runtimeSource, /getInteractiveProvinceMeshes\(activeSheet\)/);
  assert.match(baseMapSource, /getInteractiveProvinceMeshes\(activeSheet = null\)/);
  assert.ok(interactionSource.indexOf('getInteractiveRouteObjects') < interactionSource.indexOf('getInteractiveProvinceMeshes'));
  assert.match(interactionSource, /drillProvince\(hit\.provinceName\)/);
  assert.match(interactionSource, /kind:\s*['"]route['"]/);
  assert.match(interactionSource, /focusRoute\(hit\.routeId\)/);
});

test('34 个省级区域都包含下钻边界并保留三层结构', () => {
  const provinces = Object.entries(provinceBoundaries.provinces);
  assert.equal(provinces.length, 34);
  provinces.forEach(([name, province]) => {
    assert.ok(province.cities.length > 0, `${name} 缺少市级边界`);
    province.cities.forEach((city) => {
      assert.ok(city.name && city.paths.length > 0);
      assert.ok(city.paths.every((path) => path.length >= 4));
    });
  });
  assert.match(provinceDrilldownSource, /infrastructure/);
  assert.match(provinceDrilldownSource, /operation/);
  assert.match(provinceDrilldownSource, /digital/);
  assert.match(provinceDrilldownSource, /province-platform/);
  assert.match(appShellSource, /省级物流运行平台/);
});

test('省级下钻隔离全国要素并保持三层语义色', () => {
  assert.match(runtimeSource, /setProvinceIsolation\(true\)/);
  assert.match(runtimeSource, /setProvinceIsolation\(false\)/);
  ['routeRoot', 'transportRoot', 'facilityRoot', 'flowRoot', 'relationRoot', 'nodeRoot'].forEach((name) => {
    assert.match(runtimeSource, new RegExp(`\\.${name}`));
  });
  assert.match(runtimeSource, /if \(this\.selectedProvince\) return \[\]/);
  assert.match(baseMapSource, /role === 'base' \? MAP_THEME\.primary : this\.colorForRole\(role\)/);
  assert.match(baseMapSource, /role === 'base' \? MAP_THEME\.primary : this\.outlineForRole\(role\)/);
});

test('省级三层视图使用不透明实体板并正确遮挡', () => {
  assert.match(baseMapSource, /adjustedOpacity = solid \? 1/);
  assert.match(baseMapSource, /material\.transparent = !solid/);
  assert.match(baseMapSource, /material\.depthWrite = material\.isMeshStandardMaterial && \(solid/);
  assert.match(baseMapSource, /material\.side = solid \? THREE\.FrontSide/);
  assert.match(baseMapSource, /material\.blending = solid \? THREE\.NoBlending/);
  assert.match(baseMapSource, /material\.alphaTest = 0/);
  assert.match(baseMapSource, /material\.premultipliedAlpha = false/);
  assert.match(baseMapSource, /material\.emissiveIntensity = solid \? 0\.32/);
  assert.match(provinceDrilldownSource, /transparent: false/);
  assert.match(provinceDrilldownSource, /depthTest: true/);
  assert.match(runtimeSource, /setProvinceSheetSolidity\(true\)/);
  assert.match(runtimeSource, /setProvinceSheetSolidity\(false\)/);
  assert.match(runtimeSource, /material\.userData\.forceOpaque = Boolean\(enabled\)/);
  assert.match(renderingSource, /if \(material\.userData\.forceOpaque\)/);
});

test('each provincial network sheet renders municipal boundaries and city names', () => {
  assert.match(provinceDrilldownSource, /Object\.entries\(roleStyle\)\.forEach/);
  assert.match(provinceDrilldownSource, /city\.paths\.forEach/);
  assert.match(provinceDrilldownSource, /makeCityLabel\(city\.name/);
  assert.match(provinceDrilldownSource, /municipal-labels/);
  assert.match(provinceDrilldownSource, /kind: 'municipal-label'/);
  ['infrastructure', 'operation', 'digital'].forEach((role) => {
    assert.match(provinceDrilldownSource, new RegExp(`${role}: \\{ color: MAP_THEME\\.${role}Bright, labelColor:`));
  });
  assert.match(baseMapSource, /province\.position\.z = selected \? 1\.2/);
  assert.match(provinceDrilldownSource, /PROVINCE_LOCAL_SURFACE_Z = 1\.24/);
  assert.equal((provinceDrilldownSource.match(/surfaceZ: PROVINCE_LOCAL_SURFACE_Z/g) ?? []).length, 3);
  assert.equal((provinceDrilldownSource.match(/boundaryWidth: 1\.92/g) ?? []).length, 3);
  assert.match(provinceDrilldownSource, /const host = hostSheet \?\? this\.layers\[role\]\?\.sheet/);
  assert.match(provinceDrilldownSource, /provinceGroup = host\?\.userData\?\.provinces\?\.get\(provinceName\)/);
  assert.match(provinceDrilldownSource, /boundaryMaterial\.resolution\.copy\(this\.resolution\)/);
  assert.match(provinceDrilldownSource, /boundaries\.frustumCulled = false/);
  assert.match(provinceDrilldownSource, /new THREE\.PlaneGeometry\(labelWidth, labelHeight\)/);
  assert.match(provinceDrilldownSource, /map: texture/);
  assert.match(provinceDrilldownSource, /fog: false/);
  assert.match(provinceDrilldownSource, /material\.userData\.alwaysTransparent = true/);
  assert.match(renderingSource, /material\.userData\.alwaysTransparent/);
  assert.match(provinceDrilldownSource, /polygonOffset: true/);
  assert.match(provinceDrilldownSource, /labelHeight = 0\.68/);
  assert.match(provinceDrilldownSource, /strokeText\(text/);
  assert.match(provinceDrilldownSource, /updateCityLabels\(camera, width, height\)/);
  assert.doesNotMatch(provinceDrilldownSource, /makePlatformLabel/);
  assert.doesNotMatch(provinceDrilldownSource, /new THREE\.Sprite\(material\)/);
});

test('municipal name materials stay transparent after layer animation updates', () => {
  const material = new THREE.SpriteMaterial({ transparent: true });
  material.userData.alwaysTransparent = true;
  const group = new THREE.Group();
  group.add(new THREE.Sprite(material));
  setGroupOpacity(group, 1);
  assert.equal(material.transparent, true);
  material.dispose();
});

test('provincial exploded camera limits perspective distortion across three sheets', () => {
  assert.match(cameraDirectorSource, /span \* 5\.4, 92, 148/);
  assert.match(cameraDirectorSource, /\{ fov: 26 \}/);
  assert.match(cameraDirectorSource, /distance \* 0\.78/);
  assert.match(cameraDirectorSource, /distance \* 0\.82/);
});

test('业务流程按场景重置视场角并为信息面板保留安全构图', () => {
  assert.match(cameraDirectorSource, /moveTo\(position, target, duration = 0\.8, \{ fov \} = \{\}\)/);
  assert.match(cameraDirectorSource, /this\.animations\.to\(lens, \{ value: fov \}, duration\)/);
  assert.match(storyControllerSource, /moveCamera\(target, offset, duration, fov = 35\)/);
  assert.match(storyControllerSource, /moveStackOverview\(duration\)[\s\S]*-112, 88[\s\S]*37/);
  assert.match(storyControllerSource, /moveStoryLayerOverview\(layerName, duration\)[\s\S]*-38, 46[\s\S]*30/);
  assert.match(storyControllerSource, /moveStoryLayerDetail\(layerName, duration\)[\s\S]*-30, 38[\s\S]*30/);
  assert.match(storyControllerSource, /this\.story\.exception\?\.coordinates[\s\S]*-56, 58[\s\S]*34/);
});

test('业务相机支持跟随动画与自由视角切换', () => {
  assert.match(appShellSource, /#story-follow/);
  assert.match(appShellSource, /跟随动画/);
  assert.match(appShellSource, /自由视角/);
  assert.match(storyControllerSource, /this\.cameraFollow = true/);
  assert.match(storyControllerSource, /storyReturnSnapshot/);
  assert.match(storyControllerSource, /this\.cameraFollow = false/);
  assert.match(storyControllerSource, /toggleCameraFollow\(\)/);
  assert.match(storyControllerSource, /updateFollowCamera\(stageId\)/);
  assert.match(storyControllerSource, /findVisibleFollowMarker\(\)/);
  assert.match(storyControllerSource, /smoothFollow\(this\.followAnchor, offset, fov/);
  assert.match(storyControllerSource, /new Set\(\['origin_execute', 'coastal_execute', 'destination_execute', 'sea_departure'\]\)/);
  assert.match(storyControllerSource, /moveCorridorOverview\(duration\)/);
  assert.match(storyControllerSource, /if \(!this\.cameraFollow\) return/);
  assert.match(runtimeSource, /captureViewSnapshot/);
  assert.match(runtimeSource, /restoreViewSnapshot/);
  assert.match(runtimeSource, /focusStoryProvince\(provinceName\)[\s\S]*showProvince/);
  assert.doesNotMatch(runtimeSource, /focusStoryProvince\(provinceName\)[\s\S]*focusProvinceBounds/);
});

test('桌面缩放视口提前压缩业务入口避免与模式按钮重叠', () => {
  assert.match(stylesSource, /@media\(max-width:1800px\)\{\.story-launch\{min-width:108px/);
  assert.match(stylesSource, /@media\(max-width:1800px\)[\s\S]*\.search-box\{width:150px\}/);
});

test('provincial three-sheet spacing is compact and independent from national spacing', () => {
  assert.match(runtimeSource, /provinceExploded:[\s\S]*operation: \{[^}]*z: 8[\s\S]*digital: \{[^}]*z: 16/);
  assert.match(runtimeSource, /\(this\.selectedProvince \|\| this\.regionDemoProvince\) \? layerState\.provinceExploded : layerState\.exploded/);
  assert.match(provinceDrilldownSource, /style\.surfaceZ \+ 0\.025/);
  assert.match(provinceDrilldownSource, /style\.surfaceZ \+ 0\.045/);
});

test('数字物流网首页使用客户可理解的业务术语', () => {
  assert.match(demoDataSource, /接入企业与机构/);
  assert.match(demoDataSource, /数据共享关系/);
  assert.match(appShellSource, /全国数字物流协同网络/);
  assert.doesNotMatch(appShellSource, /EPCIS 事件订阅|AI 决策链路|授权与数字合约/);
  // 区域节点统一叫“物流平台”，不再出现“区域＋数字物流网络”这种与页面标题重名的说法。
  assert.ok(digitalNetworkNodes.every((node) => !node.name.includes('数字物流网络')));
  assert.ok(digitalNetworkNodes.some((node) => node.name === '安徽省物流平台'));
  assert.ok(digitalNetworkNodes.some((node) => node.name === '贵州省物流平台'));
});

test('数字物流网叠加三条国家级大通道并标注通道走向', () => {
  assert.deepEqual(digitalDashboard.mapOverlays.corridors.map((corridor) => corridor.label), ['西部陆海新通道', '东北陆海大通道', '新亚欧陆海联运通道']);
  const corridorIds = new Set(digitalDashboard.mapOverlays.corridors.map((corridor) => corridor.id));
  const segments = digitalNetworkRelations.filter((relation) => relation.type === 'corridor');
  assert.ok(segments.length >= 9);
  assert.ok(segments.every((segment) => corridorIds.has(segment.corridor)));
  // 每条通道都要连成多段完整走向，且端点节点在全国视角可见。
  const visibleIds = new Set(digitalNetworkNodes.filter((node) => node.lod <= 1).map((node) => node.id));
  corridorIds.forEach((id) => {
    const own = segments.filter((segment) => segment.corridor === id);
    assert.ok(own.length >= 3, `corridor ${id} needs continuous segments`);
    own.forEach((segment) => {
      assert.ok(visibleIds.has(segment.from) && visibleIds.has(segment.to), `corridor ${id} endpoint hidden nationally`);
    });
  });
  assert.ok(digitalNetworkNodes.some((node) => node.networkRole === 'operator'));
  assert.ok(layerCatalog.digital.some((item) => item.id === 'corridors' && item.label === '通道协同'));
  assert.match(appShellSource, /digital-corridor-chip/);
  assert.match(appShellSource, /国家大通道/);
});

test('数字物流网省级下钻沿用全国左中右驾驶舱并展示本省协同网络', () => {
  const henan = buildProvinceDigitalDashboard({
    province: '河南',
    cityCount: 18,
    cityRecords: [
      { name: '郑州市', center: [113.62, 34.75] },
      { name: '洛阳市', center: [112.45, 34.62] },
      { name: '开封市', center: [114.31, 34.80] },
      { name: '南阳市', center: [112.53, 32.99] },
      { name: '信阳市', center: [114.09, 32.15] },
      { name: '商丘市', center: [115.66, 34.41] },
      { name: '周口市', center: [114.70, 33.63] },
      { name: '新乡市', center: [113.93, 35.30] },
    ],
    nationalHubs: 9,
    coldChainBases: 4,
    logisticsParks: 4,
  });
  assert.equal(henan.layout, 'provincial');
  assert.equal(henan.scope, '河南');
  assert.match(henan.heading[0], /河南数字物流网络运行态势/);
  assert.deepEqual(henan.modes.map((mode) => mode.id), ['overview', 'cities', 'parks', 'industry', 'crossProvince', 'ai']);
  assert.equal(henan.overviewCards.length, 6);
  assert.equal(henan.elements.length, 6);
  assert.ok(henan.products.length === 5);
  assert.ok(henan.products[0].callsWan >= henan.products[1].callsWan);
  assert.ok(henan.digitalNetwork.nodes.length >= 4);
  assert.ok(henan.digitalNetwork.relations.length >= 3);
  assert.ok(henan.digitalNetwork.corridors.length >= 1);
  assert.ok(henan.mapOverlays.hubs.length >= 3);
  assert.ok(henan.mapOverlays.hubs.every((hub) => hub.metrics?.length >= 2));
  assert.ok(henan.digitalNetwork.nodes.every((node) => ['platform', 'logistics', 'shipper', 'park', 'public'].includes(node.networkRole)));
  assert.ok(henan.digitalNetwork.relations.every((relation) => ['share', 'call', 'collaboration'].includes(relation.type)));
  assert.match(runtimeSource, /provinceDigitalView/);
  assert.match(runtimeSource, /digitalCockpit: stayOnDigital/);
  assert.match(runtimeSource, /setProvinceNetwork/);
  assert.match(runtimeSource, /stayOnDigital[\s\S]*\? MAP_STATES\.FOCUS_DIGITAL/);
  assert.match(appShellSource, /buildProvinceDigitalDashboard/);
  assert.match(appShellSource, /refreshDigitalCockpit/);
  assert.match(appShellSource, /restoreNationalDigitalCockpit/);
  assert.match(appShellSource, /dashboard\.mapTitle/);
  assert.match(demoDataSource, /省内数字物流协同网络/);
  assert.match(digitalLayerSource, /setProvinceNetwork/);
  assert.match(digitalLayerSource, /PROVINCE_RELATION_STYLE/);
});

test('三层名称根据地图投影实时联动并使用事实型标题', () => {
  assert.match(runtimeSource, /updateScreenLayerLabels\(\)/);
  assert.match(runtimeSource, /new THREE\.Box3\(\)\.setFromObject\(target\)/);
  assert.match(runtimeSource, /anchorX:/);
  assert.match(stylesSource, /--link-width/);
  assert.match(appShellSource, /个地市级边界 · 3 个物流网络图层/);
  assert.doesNotMatch(appShellSource, /平台中枢纵向贯通三网/);
  assert.doesNotMatch(appShellSource, /三张地图保持地理同位/);
});

test('南海诸岛附图保留规范要求的关键岛礁与九段断续线', () => {
  const boundaryGroup = appShellSource.match(/<g class="boundary-dashes"[\s\S]*?<\/g>/)?.[0] ?? '';
  assert.equal((boundaryGroup.match(/<path\s/g) ?? []).length, 9);
  ['东沙群岛', '西沙群岛', '中沙群岛', '南沙群岛', '黄岩岛', '曾母暗沙'].forEach((name) => {
    assert.match(appShellSource, new RegExp(`aria-label="${name}"`));
  });
});

test('基础、运营、数字三个全国单层页同样显示南海诸岛附图', () => {
  ['focus-infrastructure', 'focus-operation', 'focus-digital'].forEach((focusClass) => {
    assert.doesNotMatch(stylesSource, new RegExp(`\\.${focusClass}\\s+\\.south-sea-inset`));
  });
  // 单层驾驶舱左右都有面板，附图要挪进地图可视区而不是被裁掉。
  assert.match(stylesSource, /\.view-focus:not\(\.province-view\):not\(\.story-active\)\s*\.south-sea-inset\{[^}]*right:\d+px/);
  // 省级下钻收起附图；业务流程改为右下角保留南海诸岛。
  assert.match(stylesSource, /\.province-view \.network-legend,\.province-view \.south-sea-inset\{opacity:0/);
  assert.match(stylesSource, /\.story-active \.network-legend\{opacity:0!important/);
  assert.match(stylesSource, /\.story-active \.south-sea-inset\{[^}]*opacity:1!important/);
  assert.match(stylesSource, /\.story-active \.story-hud\{left:auto;right:24px;top:16px;bottom:auto\}/);
  assert.match(stylesSource, /\.story-active \.south-sea-inset\{[^}]*right:22px/);
  assert.doesNotMatch(appShellSource, /demo-badge/);
});

test('首页是三网叠合视图，三层都可读且不提供省级下钻', () => {
  const homeButton = appShellSource.match(/data-map-state="COMBINED"[\s\S]*?<\/button>/)?.[0] ?? '';
  assert.match(homeButton, /首页/);
  assert.doesNotMatch(homeButton, /三网合一/);

  const combined = runtimeSource.match(/combined:\s*\{[\s\S]*?exploded:/)?.[0] ?? '';
  assert.ok(combined, '未找到首页叠合视图的图层权重配置');
  ['infrastructure', 'operation', 'digital'].forEach((layer) => {
    const weight = Number(combined.match(new RegExp(`${layer}:[^}]*weight:\\s*([\\d.]+)`))?.[1]);
    assert.ok(weight >= 0.8, `${layer} 在首页叠合视图的权重过低：${weight}`);
  });

  // 首页/三层分解不能停在只有少量骨干要素的 LOD 0，否则运营网和数字网看起来是空的。
  assert.match(runtimeSource, /const stackedLod = stackedView \? Math\.max\(1, this\.lod\.level\) : this\.lod\.level/);
  assert.match(runtimeSource, /operationLod =[^\n]*: stackedLod/);
  assert.match(runtimeSource, /digitalLod =[^\n]*: stackedLod/);
  assert.match(runtimeSource, /resetStackedViewFilters/);
  assert.match(appShellSource, /resetStackedViewFilters\(\)\s*\{[\s\S]*?applyLayerFilterPreset\('digital'/);

  // 首页与三层分解只做总览，省级下钻交给三个单层页。
  assert.match(runtimeSource, /if \(this\.stateMachine\.state === MAP_STATES\.COMBINED \|\| this\.stateMachine\.state === MAP_STATES\.EXPLODED\) return \[\];/);
  assert.match(appShellSource, /provinceDrillAllowed = this\.runtime\.stateMachine\?\.state !== MAP_STATES\.COMBINED[\s\S]*?!== MAP_STATES\.EXPLODED/);
});

test('首页开场按星空地球 → 镜头推进 → 中国地图定格三段演出', () => {
  // 世界轮廓数据只服务开场地球，必须是抽稀后的经纬度折线。
  assert.ok(worldOutline.rings.length > 40, `世界轮廓环数过少：${worldOutline.rings.length}`);
  assert.ok(worldOutline.pointCount < 6000, `世界轮廓点数过多，开场会变重：${worldOutline.pointCount}`);
  worldOutline.rings.slice(0, 5).forEach((ring) => {
    ring.forEach(([lng, lat]) => {
      assert.ok(lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90);
    });
  });

  // 中国国界单独成组：开场主角，且必须包含台湾与海南（Natural Earth 把台湾单列）。
  assert.ok(worldOutline.china.length >= 3, `中国轮廓环数过少：${worldOutline.china.length}`);
  const chinaBounds = worldOutline.china.flat().reduce((box, [lng, lat]) => ({
    minLng: Math.min(box.minLng, lng),
    maxLng: Math.max(box.maxLng, lng),
    minLat: Math.min(box.minLat, lat),
    maxLat: Math.max(box.maxLat, lat),
  }), { minLng: 180, maxLng: -180, minLat: 90, maxLat: -90 });
  assert.ok(chinaBounds.minLng < 75 && chinaBounds.maxLng > 134, '中国轮廓东西跨度不对');
  assert.ok(chinaBounds.minLat < 19 && chinaBounds.maxLat > 53, '中国轮廓南北跨度不对');
  assert.ok(worldOutline.china.some((ring) => ring.every(([lng, lat]) => (
    lng > 119 && lng < 123 && lat > 21 && lat < 26
  ))), '中国轮廓缺少台湾');

  // 三段节拍：地球停留、镜头推进、地图分层显影，最后收尾。
  const timeline = globeIntroSource.match(/const TIMELINE = \{[\s\S]*?\};/)?.[0] ?? '';
  ['push:', 'coreFade:', 'worldFade:', 'chinaFade:', 'reveal:', 'end:'].forEach((key) => {
    assert.match(timeline, new RegExp(key));
  });
  // 世界轮廓先弱化、中国后弱化，形成“世界让位给中国”的交接。
  const [worldFadeEnd] = timeline.match(/worldFade: \[[\d.]+, ([\d.]+)\]/)?.slice(1) ?? [];
  const [chinaFadeEnd] = timeline.match(/chinaFade: \[[\d.]+, ([\d.]+)\]/)?.slice(1) ?? [];
  assert.ok(Number(chinaFadeEnd) > Number(worldFadeEnd), '中国轮廓应比世界其余部分更晚淡出');

  // 地球第一帧就正对中国：自转基准与视线纬度都锚在中国中心。
  assert.match(globeIntroSource, /CHINA_CENTER = \{ lng: 10[0-9], lat: 3[0-9] \}/);
  assert.match(globeIntroSource, /this\.baseSpin = -\(90 \+ CHINA_CENTER\.lng[^)]*\) \* DEG/);
  assert.match(globeIntroSource, /degToRad\(3[0-9]\);\s*\n\s*this\.introPosition/);

  // 星空是独立的跟随相机点云，不复用地图场景里的环境星点，结束后随开场一起销毁。
  assert.match(globeIntroSource, /buildStars\(\)/);
  assert.match(globeIntroSource, /this\.starRoot\.position\.copy\(this\.camera\.position\)/);
  assert.match(globeIntroSource, /this\.starRoot\?\.parent\?\.remove\(this\.starRoot\)/);
  // 星空要留在相机远裁剪面（400）以内，否则整片星点被裁掉。
  const starRadius = Number(globeIntroSource.match(/STAR_RADIUS = (\d+)/)?.[1]);
  assert.ok(starRadius > 200 && starRadius < 380, `星空半径不合适：${starRadius}`);

  // 地球保持线框/粒子而不是贴图球体。
  assert.match(globeIntroSource, /THREE\.Points\(/);
  assert.doesNotMatch(globeIntroSource, /TextureLoader/);

  // 国际通道飞线由中国门户城市射向全球，组合成一张飞线网，并随中国轮廓一起淡出。
  const hubs = globeIntroSource.match(/const CORRIDOR_HUBS = \[[\s\S]*?\];/)?.[0] ?? '';
  const hubLegs = hubs.match(/\{ lng: (-?[\d.]+), lat: (-?[\d.]+), lines: (\d+) \}/g) ?? [];
  assert.ok(hubLegs.length >= 15, `开场飞线门户过少：${hubLegs.length}`);
  hubLegs.forEach((leg) => {
    const lng = Number(leg.match(/lng: (-?[\d.]+)/)[1]);
    const lat = Number(leg.match(/lat: (-?[\d.]+)/)[1]);
    assert.ok(lng > 73 && lng < 136 && lat > 17 && lat < 54, `飞线门户不在中国境内：${lng},${lat}`);
  });
  // 沿海口岸配额高于内陆门户，拉萨这类边境门户只留一条。
  const quotaOf = (lng) => Number(hubLegs.find((leg) => leg.includes(`lng: ${lng},`))?.match(/lines: (\d+)/)[1]);
  assert.ok(quotaOf('121.5') >= 5, '上海应承接最多飞线');
  assert.ok(quotaOf('113.3') >= 4, '广州应承接较多飞线');
  assert.equal(quotaOf('91.1'), 1, '拉萨只保留一条飞线');
  assert.ok(quotaOf('121.5') > quotaOf('104.1'), '沿海口岸飞线应多于内陆城市');
  const targets = globeIntroSource.match(/const CORRIDOR_TARGETS = \[[\s\S]*?\];/)?.[0] ?? '';
  const targetLegs = targets.match(/\{ lng: (-?[\d.]+), lat: (-?[\d.]+) \}/g) ?? [];
  assert.ok(targetLegs.length >= 15, `开场飞线终点城市过少：${targetLegs.length}`);
  // 用球面角距选门户，否则跨太平洋目的地会被算成西部门户更近。
  assert.match(globeIntroSource, /const angularDistance = \(a, b\) =>/);
  assert.match(globeIntroSource, /Math\.asin\(Math\.min\(1, Math\.sqrt\(half\)\)\)/);
  // 每个门户都要出现在飞线网里，保证列出的城市都能看到。
  assert.match(globeIntroSource, /CORRIDOR_HUBS\.filter\(\(hub\) => used\.get\(hub\) === 0\)/);
  assert.match(globeIntroSource, /this\.chinaFades\.push\(\{ object: flow/);
  assert.match(globeIntroSource, /this\.updateCorridors\(time\)/);

  // 每次点击“首页”都从开场地球重新开始，省级会话与业务流程不受影响。
  assert.match(runtimeSource, /replayHomeIntro\(\) \{\s*\n\s*this\.homeIntroPlayed = false;/);
  assert.match(
    runtimeSource,
    /if \(state === MAP_STATES\.COMBINED && !context\.story && !context\.province && !this\.selectedProvince\) \{\s*\n\s*this\.replayHomeIntro\(\);/,
  );
  // 轮廓数据只取一次，重播时不会先闪一帧中国地图。
  assert.match(runtimeSource, /this\.worldOutlinePromise \?\?= loadWorldOutline\(\);/);

  // 演出只在首屏首页播放一次，任何交互或页面切换都会立即结束它。
  assert.match(runtimeSource, /if \(this\.homeIntroPlayed\) return;\s*\n\s*this\.homeIntroPlayed = true;/);
  assert.match(runtimeSource, /if \(this\.stateMachine\.state !== MAP_STATES\.COMBINED \|\| this\.cameraUserOverride\) return;/);
  assert.match(runtimeSource, /if \(prefersReducedMotion\(\)\) return;/);
  assert.match(runtimeSource, /setState\(state, context = \{\}\) \{\s*\n[^\n]*\n\s*this\.abortHomeIntro\(\{ restoreScene: false \}\);/);
  assert.match(runtimeSource, /beginUserCamera\(\) \{\s*\n\s*this\.abortHomeIntro\(\);/);
  assert.match(interactionSource, /if \(this\.runtime\.homeIntro\?\.active\)/);

  // 定格后按“轮廓 → 主通道 → 核心节点”分层显影。
  const reveal = runtimeSource.match(/applyHomeIntroReveal\(progress\) \{[\s\S]*?\n  \}/)?.[0] ?? '';
  const stageStart = (role) => Number(reveal.match(new RegExp(`${role}: stage\\(([\\d.]+)`))?.[1]);
  assert.ok(stageStart('infrastructure') < stageStart('operation'));
  assert.ok(stageStart('operation') < stageStart('digital'));
  assert.match(reveal, /this\.setFloorHudAmount\(outline\)/);
});

test('首页是平台开场页：极简文案、轻量状态栏、主干骨架', () => {
  // 左侧只保留四行文案，不再堆叠说明与装饰框。
  const caption = appShellSource.match(/<div class="scene-caption">[\s\S]*?caption-networks[^<]*<\/p>\s*<\/div>/)?.[0] ?? '';
  assert.match(caption, /National Logistics Network/);
  assert.match(caption, /基础设施网 \/ 物流运营网 \/ 数字物流网融合/);
  assert.match(appShellSource, /\[MAP_STATES\.COMBINED\]: \['全国物流网络', '34 个省级区域'\]/);
  assert.match(stylesSource, /\.home-page \.caption-index\{display:none\}/);

  // 状态栏只留视角、数据更新时间与服务状态。
  assert.match(appShellSource, /数据更新时间/);
  assert.match(appShellSource, /服务状态正常/);
  assert.match(stylesSource, /\.home-page[^{]*\.status-objects,[\s\S]{0,120}?display:none\}/);
  assert.match(stylesSource, /\.home-page \.network-legend\{opacity:0/);

  // home-page 只标记全国首页，省级 / 单层 / 三层分解 / 业务流程都不带这个类。
  const homeFlag = appShellSource.match(/const homePage = state === MAP_STATES\.COMBINED[\s\S]*?story\?\.completed;/)?.[0] ?? '';
  assert.match(homeFlag, /!inProvince/);
  assert.match(homeFlag, /!context\.story/);

  // 首页只画主干骨架：三张网的地图板压淡，运营/数字要素比当前 LOD 再稀一档。
  assert.match(runtimeSource, /const homeSheetFactor = \{/);
  assert.match(runtimeSource, /const homeNational = state === MAP_STATES\.COMBINED && !this\.selectedProvince && !storyPresentation;/);
  ['infrastructure', 'operation', 'digital'].forEach((role) => {
    assert.match(runtimeSource, new RegExp(`this\\.layers\\?\\.${role}\\?\\.setHomeOverview\\?\\.\\(homeNational\\)`));
  });
  [operationLayerSource, digitalLayerSource].forEach((source) => {
    assert.match(source, /viewLodLevel\(\) \{[\s\S]*?homeOverview[\s\S]*?Math\.max\(0, this\.lodLevel - 1\)/);
    assert.match(source, /setHomeOverview\(enabled = false\)/);
  });
  // 基础设施网首页只留骨架通道与国家级枢纽，公路铁路网不铺满。
  assert.match(infrastructureLayerSource, /this\.transportRoot\.visible = !this\.homeOverview && !this\.explodedPresentation/);
  assert.match(infrastructureLayerSource, /applyHomeDensity\(weight = 1\)/);
  assert.match(infrastructureLayerSource, /Number\.isFinite\(weight\) \? Number\(weight\) : 1/);
});

test('三层措辞只出现在三层分解与省级三层视图，单层页彼此不跳转', () => {
  // 单层实体抽屉不再给三层穿透入口，线路抽屉也不再跳到三层分解。
  const entityDetail = appShellSource.match(/\$\{this\.currentLayer[\s\S]*?penetration-action[\s\S]*?<\/button>`\}/)?.[0] ?? '';
  assert.match(entityDetail, /实体摘要/);
  assert.match(entityDetail, /layerLabels\[this\.currentLayer\]/);
  assert.doesNotMatch(appShellSource, /在三层空间中查看/);
  assert.doesNotMatch(appShellSource, /data-layer-jump="digital"/);
  // 收起图层抽屉只是收面板，不再把用户甩回三层分解。
  assert.doesNotMatch(appShellSource, /#left-drawer-close'\)\) this\.runtime\?\.setState/);

  // 首页标题不再用三层口径，三层分解与穿透保留三层表述。
  const titles = appShellSource.match(/const titles = \{[\s\S]*?\};/)?.[0] ?? '';
  assert.doesNotMatch(titles.match(/\[MAP_STATES\.COMBINED\]:[^\n]*/)?.[0] ?? '', /三层/);
  assert.match(titles, /\[MAP_STATES\.EXPLODED\]:[^\n]*三层协同/);
  assert.match(appShellSource, /id="exploded-workspace"/);
  assert.match(appShellSource, /全国物流网络三层协同关系/);
  assert.match(appShellSource, /协同闭环/);
  assert.match(stylesSource, /#exploded-workspace/);
  assert.match(stylesSource, /\.exploded-page #exploded-workspace/);
});

test('场景演示下拉框保留北粮南运、汽车出海与山东区域入口', () => {
  const dropdown = appShellSource.match(/<div class="scene-demo-dropdown"[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
  assert.match(dropdown, /北粮南运/);
  assert.match(dropdown, /汽车出海/);
  assert.match(dropdown, /山东区域/);
  assert.match(dropdown, /data-story-id="\$\{STORY_IDS\.NORTH_GRAIN\}"/);
  assert.match(dropdown, /data-story-id="\$\{STORY_IDS\.AUTO_PARTS\}"/);
  assert.match(dropdown, /data-story-id="\$\{STORY_IDS\.SHANDONG_REGION\}"/);
});

test('山东区域演示从全国单层底图聚焦到邻省海域构图，不再三层炸开', async () => {
  const shandongDemoSource = fs.readFileSync(new URL('../src/story/ShandongRegionDemoController.js', import.meta.url), 'utf8');
  const shandongDataSource = fs.readFileSync(new URL('../src/data/shandongRegionDemoData.js', import.meta.url), 'utf8');
  const cameraSource = fs.readFileSync(new URL('../src/core/CameraDirector.js', import.meta.url), 'utf8');
  const chinaMapSource = fs.readFileSync(new URL('../src/map/ChinaBaseMap.js', import.meta.url), 'utf8');
  assert.match(runtimeSource, /enterRegionDemoView\(provinceName/);
  assert.match(runtimeSource, /keepContext: true/);
  assert.match(runtimeSource, /hostSheet: this\.baseSheet/);
  assert.match(runtimeSource, /getRegionContextBounds/);
  assert.match(runtimeSource, /fromNational/);
  assert.match(runtimeSource, /hideRegionDemoLayerSheets/);
  assert.match(cameraSource, /snapTo\(position, target, fov\)/);
  assert.match(cameraSource, /context = false/);
  assert.match(chinaMapSource, /keepContext = false/);
  assert.match(chinaMapSource, /#071427/);
  assert.match(chinaMapSource, /#0E718D/);
  assert.match(chinaMapSource, /#4DDBE8/);
  assert.match(stylesSource, /#050C18/);
  assert.match(stylesSource, /#16243A/);
  assert.match(cameraSource, /span \* 1\.88/);
  assert.match(runtimeSource, /size\.x \* 0\.16/);
  assert.match(runtimeSource, /focusRegionDemoCamera/);
  assert.match(runtimeSource, /regionDemo: true/);
  assert.match(shandongDemoSource, /enterRegionDemoView\?\.\(this\.demo\.province/);
  assert.match(shandongDemoSource, /fromNational: true/);
  assert.match(shandongDemoSource, /focusRegionDemoCamera/);
  assert.match(shandongDemoSource, /buildOutlineTrail/);
  assert.match(shandongDemoSource, /makeWideLine/);
  assert.match(shandongDemoSource, /makeDigitalRoute/);
  assert.match(shandongDemoSource, /driveDigitalRoute/);
  assert.match(shandongDemoSource, /syncLineResolution/);
  assert.match(shandongDemoSource, /LineDashedMaterial/);
  assert.match(runtimeSource, /this\.shandongDemo\?\.syncLineResolution/);
  assert.match(shandongDemoSource, /industrySpots/);
  assert.match(shandongDemoSource, /clusterArcs/);
  assert.match(shandongDemoSource, /hubFlowArcs/);
  assert.match(shandongDemoSource, /corridorPhase/);
  assert.match(shandongDemoSource, /t < 11 \? 0/);
  assert.match(shandongDemoSource, /capitalLabels/);
  assert.doesNotMatch(shandongDemoSource, /SHANDONG REGION DEMO/);
  assert.doesNotMatch(shandongDemoSource, /captionIndex: '.*DEMO/);
  assert.match(runtimeSource, /const startId = storyId \|\| currentId/);
  assert.match(runtimeSource, /startId === STORY_IDS\.SHANDONG_REGION/);
  assert.match(shandongDataSource, /otherProvinceCapitals/);
  assert.match(shandongDataSource, /石家庄/);
  assert.match(shandongDataSource, /郑州/);
  assert.match(shandongDataSource, /industryClusters/);
  assert.match(shandongDataSource, /hubFlows/);
  assert.doesNotMatch(shandongDemoSource, /MAP_STATES\.EXPLODED/);
  assert.doesNotMatch(shandongDemoSource, /sd_three_layers/);
  assert.doesNotMatch(shandongDemoSource, /makeBannerSprite/);
  assert.doesNotMatch(shandongDemoSource, /metricSprites/);
  assert.match(shandongDataSource, /sd_network/);
  assert.doesNotMatch(shandongDataSource, /sd_three_layers/);
  assert.match(provinceDrilldownSource, /showLabels = false/);
  assert.match(provinceDrilldownSource, /spotlight = true/);
  assert.match(provinceDrilldownSource, /hostSheet = null/);
  assert.match(provinceDrilldownSource, /if \(spotlight\)/);
  assert.match(provinceDrilldownSource, /animateCityLabels/);
  assert.match(provinceDrilldownSource, /regionDemo = false/);
  assert.match(stylesSource, /region-demo-pure \.map-aura/);
  assert.match(stylesSource, /region-demo-pure \.south-sea-inset/);
  assert.match(stylesSource, /region-demo-pure \.scene-caption/);
  assert.match(appShellSource, /setRegionDemoPure/);
  const {
    shandongCorridors,
    shandongSeaRoutes,
    shandongIndustries,
    industryClusters,
    hubFlows,
    shandongCities,
    logisticsHubs,
    summaryMetrics,
    shandongKpiMetrics,
    SHANDONG_REAL_STATS,
    CORRIDOR_COLORS,
    CORRIDOR_LINE_STYLE,
  } = await import('../src/data/shandongRegionDemoData.js');
  assert.equal(SHANDONG_REAL_STATS.cityCount, 16);
  assert.equal(SHANDONG_REAL_STATS.nationalHubCities, 8);
  assert.equal(SHANDONG_REAL_STATS.manufacturingClusters, 6);
  assert.equal(shandongCities.length, 16);
  assert.ok(shandongCities.some((city) => city.id === 'taian'));
  assert.ok(shandongCities.some((city) => city.id === 'liaocheng'));
  assert.equal(logisticsHubs.length, 8);
  assert.deepEqual(logisticsHubs.map((hub) => hub.id).sort(), ['jinan', 'jining', 'linyi', 'qingdao', 'rizhao', 'weifang', 'yantai', 'zibo'].sort());
  assert.deepEqual(shandongKpiMetrics, [
    ['城市节点', '16个'],
    ['国家物流枢纽', '8个'],
    ['国家先进制造业集群', '6个'],
  ]);
  assert.deepEqual(summaryMetrics.map((item) => item.value), ['16个', '8个', '6个']);
  assert.match(shandongDemoSource, /shandongKpiMetrics/);
  assert.doesNotMatch(shandongDemoSource, /38个/);
  assert.doesNotMatch(shandongDemoSource, /286万吨/);
  assert.doesNotMatch(shandongDataSource, /38个/);
  assert.doesNotMatch(shandongDataSource, /286万吨/);
  assert.equal(shandongIndustries.length, 5);
  assert.deepEqual(shandongIndustries.map((item) => item.name), ['高端化工', '高端装备', '新能源锂电', '海洋产业', '现代农业']);
  assert.ok(shandongIndustries.find((item) => item.id === 'chem').cities.includes('heze'));
  assert.ok(shandongIndustries.find((item) => item.id === 'agri').cities.includes('yantai'));
  assert.match(shandongDataSource, /新能源汽车及锂电/);
  assert.doesNotMatch(shandongDataSource, /智能家电/);
  shandongIndustries.forEach((item, index) => {
    assert.ok(item.start >= 5 && item.start < 7);
    if (index > 0) assert.ok(item.start > shandongIndustries[index - 1].start);
  });
  assert.ok(industryClusters.length >= 10);
  assert.ok(hubFlows.length >= 5);
  assert.equal(shandongCorridors.length, 6);
  assert.deepEqual(shandongCorridors.map((item) => item.family), ['land', 'land', 'land', 'port', 'port', 'cre']);
  assert.equal(shandongCorridors[0].onset, 11);
  assert.equal(shandongCorridors.find((item) => item.id === 'west').onset, 13);
  assert.equal(shandongCorridors.find((item) => item.id === 'crexpress').onset, 17);
  assert.equal(shandongCorridors.filter((corridor) => corridor.mapLabel).length, 6);
  assert.equal(shandongSeaRoutes.length, 3);
  assert.ok(shandongSeaRoutes.every((route) => route.onset >= 15 && route.onset < 17));
  assert.equal(CORRIDOR_COLORS.land, '#5fcfff');
  assert.equal(CORRIDOR_COLORS.port, '#6df0a8');
  assert.equal(CORRIDOR_COLORS.sea, '#ba8cff');
  assert.equal(CORRIDOR_COLORS.cre, '#ffb45c');
  assert.equal(CORRIDOR_LINE_STYLE.land.dashed, true);
  assert.equal(CORRIDOR_LINE_STYLE.port.dashed, true);
  assert.equal(CORRIDOR_LINE_STYLE.sea.dashed, true);
  assert.equal(CORRIDOR_LINE_STYLE.cre.dashed, true);
  assert.match(shandongDemoSource, /CORRIDOR_LINE_STYLE/);
  assert.match(shandongDemoSource, /OctahedronGeometry/);
  assert.match(shandongDemoSource, /packetCount/);
  assert.match(shandongDemoSource, /mapLabel/);
  const inShandongVicinity = ([lng, lat]) => lng >= 114.5 && lng <= 124.0 && lat >= 33.8 && lat <= 38.8;
  shandongCorridors.forEach((corridor) => {
    corridor.path.forEach((point) => {
      assert.equal(inShandongVicinity(point), true, `${corridor.id} 越出山东视野 ${point}`);
    });
    ['externalCoord', 'labelCoord', 'originCoord'].forEach((key) => {
      if (corridor[key]) {
        assert.equal(inShandongVicinity(corridor[key]), true, `${corridor.id} ${key} 越出山东视野`);
      }
    });
  });
  shandongSeaRoutes.forEach((route) => {
    assert.equal(inShandongVicinity(route.target), true, `${route.id} 海向标签越出山东视野`);
  });
  assert.match(shandongDataSource, /duration: 30/);
});

test('汽车出海业务时间轴连续且形成闭环', () => {
  assert.equal(demoLogisticsStory.stages[0].start, 0);
  assert.equal(demoLogisticsStory.stages.at(-1).end, demoLogisticsStory.duration);
  demoLogisticsStory.stages.slice(1).forEach((stage, index) => {
    assert.equal(stage.start, demoLogisticsStory.stages[index].end);
  });
  assert.equal(demoLogisticsStory.candidates.filter((candidate) => candidate.selected).length, 1);
  assert.equal(demoLogisticsStory.capacityResponses.length, 5);
  assert.equal(demoLogisticsStory.confirmations.length, 5);
  assert.equal(demoLogisticsStory.chapters.length, 8);
  assert.deepEqual(demoLogisticsStory.chapters.flatMap((chapter) => chapter.stageIds), demoLogisticsStory.stages.map((stage) => stage.id));
  assert.deepEqual(demoLogisticsStory.candidates.filter((candidate) => !candidate.selected).map((candidate) => candidate.path.length), [8, 8]);
  assert.ok(demoLogisticsStory.feedback.length >= 5);
  const platforms = Object.fromEntries(demoLogisticsStory.platforms.map((platform) => [platform.id, platform]));
  assert.deepEqual(platforms.trustedSpace.coordinates, [114.31, 30.59]);
  assert.equal(platforms.trustedSpace.name, '物流可信数据空间');
  assert.ok(platforms.chongqingPlatform.coordinates[0] < 107);
  assert.ok(platforms.shanghaiPlatform.coordinates[0] > 121);
  assert.equal(demoLogisticsStory.duration, 105);
  assert.equal(demoLogisticsStory.shipment.cargo, '新能源汽车');
  assert.equal(demoLogisticsStory.shipment.quantity, 1000);
  assert.deepEqual(demoLogisticsStory.execution.batches, [300, 350, 350]);
  assert.equal(demoLogisticsStory.exception.stageId, 'transit_exception');
  assert.equal(demoLogisticsStory.exception.affectedQuantity, 350);
  assert.equal(demoLogisticsStory.exception.timeGap, '1小时30分钟');
  assert.equal(demoLogisticsStory.result.productionImpact, '1,000辆已出境');
  assert.deepEqual(autoPartsRoute.legs.map((leg) => leg.mode), ['vehicle', 'vehicle', 'rail', 'road', 'sea']);
  autoPartsRoute.legs.forEach((leg) => {
    assert.ok(leg.path.length >= 2);
    leg.path.forEach(([longitude, latitude]) => {
      assert.ok(longitude >= 73 && longitude <= 135);
      assert.ok(latitude >= 18 && latitude <= 54);
    });
    if (leg.mode !== 'sea') assert.match(leg.source, /主要(公路|铁路)\.geojson/);
  });
  assert.match(dataManagerSource, /auto-parts-route\.json/);
  assert.match(appShellSource, /物流可信数据空间/);
  assert.doesNotMatch(appShellSource, /stack-layer-label platform/);
  assert.match(runtimeSource, /updateScreenLayerLabels/);
  assert.match(storyControllerSource, /makePlatformTether/);
  assert.match(storyControllerSource, /declutterLabels/);
  assert.match(appShellSource, /id="story-toggle"/);
  assert.match(appShellSource, /id="story-follow"/);
  assert.match(dataManagerSource, /\/stories\/\$\{encodeURIComponent\(storyId\)\}\/timeline/);
});

test('北粮南运与汽车出海作为两个独立业务流程保留', () => {
  assert.notEqual(northGrainStory.id, demoLogisticsStory.id);
  assert.match(northGrainStory.title, /北粮南运/);
  assert.match(demoLogisticsStory.title, /^汽车出海/);
  assert.deepEqual(northGrainRoute.legs.map((leg) => leg.mode), ['road', 'rail', 'sea', 'road', 'rail', 'road']);
  assert.match(dataManagerSource, /storyRoutes/);
  assert.match(dataManagerSource, /north-grain-route\.json/);
  assert.match(dataManagerSource, /auto-parts-route\.json/);
  assert.match(appShellSource, /data-story-id/);
  assert.match(appShellSource, /北粮南运/);
  assert.match(appShellSource, />汽车出海</);
  assert.doesNotMatch(appShellSource, /重庆汽车出海/);
  assert.equal(northGrainStory.ui.focusProvince, undefined);
  assert.equal(demoLogisticsStory.ui.focusProvince, undefined);
  assert.equal(northGrainStory.duration, 84);
  assert.equal(northGrainStory.stages.at(-1).end, northGrainStory.duration);
  const northGrainDrill = northGrainStory.stages.find((stage) => stage.id === 'drill_operation');
  assert.ok(northGrainDrill.end - northGrainDrill.start >= 10);
  assert.deepEqual(northGrainStory.stages.map((stage) => stage.id), [
    'overview', 'platform_space', 'transport_demand', 'capacity_response', 'route_solve', 'consensus',
    'drill_operation', 'operation_dispatch', 'drill_infrastructure', 'origin_execute', 'coastal_execute',
    'destination_execute', 'feedback',
  ]);
  const northGrainPresentation = JSON.stringify(northGrainStory.ui);
  ['汽车已出境', '300 / 350 / 350 辆', '出口车辆'].forEach((text) => assert.doesNotMatch(northGrainPresentation, new RegExp(text)));
  assert.match(northGrainPresentation, /货物状态/);
  assert.match(northGrainPresentation, /到厂签收/);
  assert.match(storyControllerSource, /moveStoryLayerOverview/);
  assert.doesNotMatch(storyControllerSource, /moveProvinceLayerOverview/);
});

test('北粮南运广东铁路段沿河茂广茂通道且不绕行广西湖南', () => {
  const southRail = northGrainRoute.legs.find((leg) => leg.id === 'southRail');
  assert.ok(southRail);
  assert.match(southRail.source, /河茂—广茂通道校正/);
  assert.ok(southRail.path.length < 80);
  assert.ok(southRail.path.every(([longitude, latitude]) => longitude >= 110.2 && latitude <= 23.3));
  assert.ok(southRail.path.some(([longitude, latitude]) => longitude > 110.75 && longitude < 111 && latitude < 21.8));
  assert.ok(southRail.path.some(([longitude, latitude]) => longitude > 112.4 && latitude > 23));
});

test('北粮南运海运航段沿近海外海且不横切山东半岛与粤西陆地', () => {
  const sea = northGrainRoute.legs.find((leg) => leg.id === 'coastalShipping');
  assert.ok(sea);
  assert.equal(sea.mode, 'sea');
  assert.deepEqual(sea.path, YINGKOU_TO_ZHANJIANG_SEA);
  assert.deepEqual(sea.path[0], YINGKOU_SEA_BERTH);
  assert.deepEqual(sea.path.at(-1), ZHANJIANG_SEA_BERTH);
  assert.ok(sea.path.length >= 80);
  assert.ok(sea.path.some(([longitude, latitude]) => longitude >= 123.3 && latitude > 37 && latitude < 38));
  const sample = (a, b, n = 24) => Array.from({ length: n + 1 }, (_, index) => {
    const t = index / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  });
  for (let index = 0; index < sea.path.length - 1; index += 1) {
    for (const [longitude, latitude] of sample(sea.path[index], sea.path[index + 1])) {
      assert.ok(!(longitude < 122.8 && longitude > 119.8 && latitude < 37.8 && latitude > 36.4), `海运切山东陆地: ${longitude},${latitude}`);
      assert.ok(!(longitude < 121.0 && longitude > 119.0 && latitude < 34.4 && latitude > 31.6), `海运切苏北陆地: ${longitude},${latitude}`);
      assert.ok(!(longitude < 121.3 && longitude > 119.6 && latitude < 30.0 && latitude > 27.6), `海运切浙东陆地: ${longitude},${latitude}`);
      // 福建岸线最东约 120.7°（宁德外海岛礁）；北段须离开近岸外海进入海峡中部
      if (latitude > 25.2 && latitude < 27.0) {
        assert.ok(longitude >= 121.0, `海运未离开福建近岸外海: ${longitude},${latitude}`);
      }
      assert.ok(!(longitude < 119.0 && longitude > 117.6 && latitude < 26.8 && latitude > 24.0), `海运切福建陆地: ${longitude},${latitude}`);
      assert.ok(!(longitude < 113.5 && longitude > 110.9 && latitude < 22.4 && latitude > 21.35), `海运切粤西陆地: ${longitude},${latitude}`);
      // 南下航段不借道琼州海峡；雷州半岛及东海岛由下方实际边界校验覆盖。
      const qiongzhouStrait = longitude > 109.75 && longitude < 110.35 && latitude < 20.45 && latitude > 19.98;
      assert.ok(!qiongzhouStrait, `海运穿琼州海峡: ${longitude},${latitude}`);
    }
  }

  // 使用页面实际渲染的省市边界逐点复核，包括营口与湛江港口端点。
  // 海运全段不再允许任何“靠泊例外”，每一个采样点都必须位于水面。
  const coastalProvinceNames = ['辽宁', '河北', '天津', '山东', '江苏', '上海', '浙江', '福建', '广东', '广西', '海南', '台湾', '香港', '澳门'];
  const landPolygons = coastalProvinceNames.flatMap((provinceName) => (
    provinceBoundaries.provinces[provinceName]?.cities?.flatMap((city) => city.paths) ?? []
  ));
  const pointInPolygon = ([longitude, latitude], polygon) => {
    let inside = false;
    for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
      const [currentLongitude, currentLatitude] = polygon[current];
      const [previousLongitude, previousLatitude] = polygon[previous];
      const crossesLatitude = (currentLatitude > latitude) !== (previousLatitude > latitude);
      const boundaryLongitude = ((previousLongitude - currentLongitude) * (latitude - currentLatitude))
        / (previousLatitude - currentLatitude) + currentLongitude;
      if (crossesLatitude && longitude < boundaryLongitude) inside = !inside;
    }
    return inside;
  };
  const distanceTo = (left, right) => Math.hypot(left[0] - right[0], left[1] - right[1]);
  for (let index = 0; index < sea.path.length - 1; index += 1) {
    const from = sea.path[index];
    const to = sea.path[index + 1];
    const steps = Math.max(1, Math.ceil(distanceTo(from, to) / 0.01));
    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      const coordinate = [
        from[0] + (to[0] - from[0]) * progress,
        from[1] + (to[1] - from[1]) * progress,
      ];
      assert.ok(
        !landPolygons.some((polygon) => pointInPolygon(coordinate, polygon)),
        `海运进入地图陆地区域: ${coordinate.join(',')}`,
      );
    }
  }
});

test('北粮南运数字网方案 C 海段沿近海走廊，不横切陆地', () => {
  const candidateC = northGrainStory.candidates.find((item) => item.id === 'C');
  assert.ok(candidateC);
  const sample = (a, b, n = 24) => Array.from({ length: n + 1 }, (_, index) => {
    const t = index / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  });
  for (let index = 0; index < candidateC.path.length - 1; index += 1) {
    for (const [longitude, latitude] of sample(candidateC.path[index], candidateC.path[index + 1])) {
      assert.ok(!(longitude < 122.8 && longitude > 119.8 && latitude < 37.8 && latitude > 36.4), `方案C切山东陆地: ${longitude},${latitude}`);
      assert.ok(!(longitude < 121.0 && longitude > 119.0 && latitude < 34.4 && latitude > 31.6), `方案C切苏北陆地: ${longitude},${latitude}`);
      assert.ok(!(longitude < 121.3 && longitude > 119.6 && latitude < 30.0 && latitude > 27.6), `方案C切浙东陆地: ${longitude},${latitude}`);
      assert.ok(!(longitude < 119.15 && longitude > 117.6 && latitude < 26.8 && latitude > 24.0), `方案C切福建陆地: ${longitude},${latitude}`);
      assert.ok(!(longitude < 113.5 && longitude > 110.9 && latitude < 22.4 && latitude > 21.35), `方案C切粤西陆地: ${longitude},${latitude}`);
    }
  }
  assert.match(northGrainStorySource, /coastalSegment/);
  // 数字网在途任务节点与公铁海联运口径一致：营口港下海、湛江港上岸
  const grainTask = demoTasks.find((item) => item.id === 'TASK_HA_GZ_0826');
  assert.ok(grainTask.nodes.includes('湛江港'));
  assert.ok(!grainTask.nodes.includes('上海港'));
});

test('运营网不再绘制北粮南运专线，业务流程与基础设施航线仍独立保留', () => {
  assert.equal(operationDashboard.tasks.some((item) => item.id === 'OP_TASK_GRAIN_SOUTH'), false);
  assert.equal(operationNetworkRelations.some((item) => item.id === 'OPR_40'), false);
  assert.equal(operationNetworkRelations.some((item) => item.taskId === 'OP_TASK_GRAIN_SOUTH'), false);
  // 任何两端都在沿海走廊上的水运关系都会被渲染成同一条“沿海南运”线，
  // 首尾相接后在全国视图里看着就是一条贯通南北的海岸线，所以只允许保留短途摆渡段。
  const nodeById = new Map(operationNetworkNodes.map((node) => [node.id, node]));
  operationNetworkRelations.forEach((relation) => {
    const from = nodeById.get(relation.from);
    const to = nodeById.get(relation.to);
    assert.ok(from && to, `关系 ${relation.id} 指向了不存在的节点`);
    if (relation.mode !== 'water' && relation.mode !== 'sea') return;
    if (!isCoastalEntity(from) || !isCoastalEntity(to)) return;
    const latitudes = coastalSegment(
      [Number(from.longitude), Number(from.latitude)],
      [Number(to.longitude), Number(to.latitude)],
    ).map((point) => point[1]);
    const span = Math.max(...latitudes) - Math.min(...latitudes);
    assert.ok(span < 3, `${relation.id}（${from.name}→${to.name}）跨 ${span.toFixed(2)} 个纬度，会画成沿海长线`);
  });
  // 节点也不能因为删线变成没有连线的孤点。
  const linked = new Set(operationNetworkRelations.flatMap((relation) => [relation.from, relation.to]));
  operationNetworkNodes.forEach((node) => {
    assert.ok(linked.has(node.id), `节点 ${node.name} 没有任何关系连线`);
  });
  // 业务流程与基础设施仍使用独立的公铁海路线数据，不依赖运营网关系。
  assert.equal(northGrainStory.id, 'GRAIN_NORTH_TO_SOUTH');
  assert.ok(northGrainRoute.legs.some((leg) => leg.id === 'coastalShipping' && leg.mode === 'sea'));
});

test('省级基础设施面板排名块不被压塌，卡片之间不重叠', () => {
  // 省级面板比全国多一块「对外通达方向」，排名块若继续参与 flex 收缩会被压成一条缝。
  const rankBlockRule = stylesSource.match(/\.province-view\.focus-infrastructure:not\(\.story-active\) \.infra-rank-block\{[^}]*\}/)?.[0] ?? '';
  assert.match(rankBlockRule, /min-height:\d{3}px/);
  assert.match(stylesSource, /\.province-view\.focus-infrastructure:not\(\.story-active\) \.operation-insight-panel\{[^}]*overflow-y:auto/);
  // 面板整体可滚动，排名条目不再被拉伸填充剩余高度。
  const rankItemRule = stylesSource.match(/\.province-view\.focus-infrastructure:not\(\.story-active\) \.infra-insight-panel \.infra-rank-list li\{[^}]*\}/)?.[0] ?? '';
  assert.match(rankItemRule, /flex:0 0 auto/);
});

test('省级地图屏幕标签按所在图层矩阵定位，不与线路脱层', () => {
  // 出省通道箭头挂在 provinceRoot 上，聚焦态整层带 Z 位移与缩放。
  const corridorGetter = digitalLayerSource.match(/getProvinceCorridorWorldPosition\(id\)\s*\{[\s\S]*?\n  \}/)?.[0] ?? '';
  assert.match(corridorGetter, /getWorldPosition/);
  assert.match(corridorGetter, /localToWorld/);
  assert.doesNotMatch(corridorGetter, /return item\?\.tip \? item\.tip\.clone\(\) : null/);
  // 兜底经纬度同样要过图层矩阵，否则枢纽与通道标签都会整体偏移。
  assert.match(runtimeSource, /layer\.updateWorldMatrix\(true, false\)/);
  assert.match(runtimeSource, /const onLayer = \(coordinate, z\) => \(Array\.isArray\(coordinate\)\s*\n\s*\? layer\.localToWorld\(this\.projector\.fromLngLat\(coordinate, z\)\)/);
  assert.match(runtimeSource, /\?\? onLayer\(hub\.center, 2\.55\)/);
  assert.match(runtimeSource, /\?\? onLayer\(corridor\.center, 2\.62\)/);
  assert.doesNotMatch(runtimeSource, /corridor\.center \? this\.projector\.fromLngLat/);
});

test('汽车出海业务覆盖重庆组织、船期异常、渝沪协同与滚装离港', () => {
  const stageIds = demoLogisticsStory.stages.map((stage) => stage.id);
  ['local_assembly', 'transit_exception', 'digital_penetration', 'regional_collaboration', 'destination_execute', 'sea_departure'].forEach((id) => assert.ok(stageIds.includes(id)));
  assert.match(storyControllerSource, /stageId === 'digital_penetration'/);
  assert.match(storyControllerSource, /stageId === 'regional_collaboration'/);
  assert.match(storyControllerSource, /mode === 'vehicle'/);
  assert.match(runtimeSource, /focusStoryProvince/);
  assert.match(runtimeSource, /setStoryContentIsolation/);
  assert.match(demoLogisticsStory.result.subtitle, /贸易商组织完成车辆集结、铁路发运、上海集港与滚装装载/);
  assert.match(demoLogisticsStory.result.subtitle, /1,000辆新能源汽车按调整后的作业窗口离港/);
  const drillOperation = demoLogisticsStory.stages.find((stage) => stage.id === 'drill_operation');
  const operationDispatch = demoLogisticsStory.stages.find((stage) => stage.id === 'operation_dispatch');
  assert.ok(drillOperation.end - drillOperation.start >= 10);
  assert.ok(operationDispatch.end - operationDispatch.start >= 8);
  assert.equal(demoLogisticsStory.subjects.filter((subject) => subject.layers.includes('operation') && subject.task).length, demoLogisticsStory.subjects.filter((subject) => subject.layers.includes('operation')).length);
  assert.match(storyControllerSource, /subject\.task \? `\$\{subject\.name\}\\n\$\{subject\.task\}`/);
  assert.match(storyControllerSource, /STORY_LABEL_VISUAL_SCALE = 1\.52/);
});

test('业务流程切层时地图板与业务元素使用独立权重', () => {
  assert.match(renderingSource, /object\.userData\?\.kind === 'province'/);
  assert.match(runtimeSource, /setStoryLayerWeights/);
  assert.match(runtimeSource, /setStorySheetWeights/);
  assert.match(runtimeSource, /storySheetWeights/);
  assert.match(runtimeSource, /preserveSheet: true/);
  assert.match(runtimeSource, /enforceStorySheetSolidity/);
  assert.match(runtimeSource, /setSheetOpacity\(layer\.sheet, amount, \{ solid: amount > 0\.995 \}\)/);
  assert.doesNotMatch(runtimeSource, /layer\.visible = amount > 0\.005/);
});

test('向下传导完成后上层地图板淡化并退出', () => {
  assert.match(storyControllerSource, /const sheetUpperFade = 1 - smoothStep\(progress, 0\.56, 0\.94\)/);
  assert.match(storyControllerSource, /drill_operation[\s\S]*digital: sheetUpperFade/);
  assert.match(storyControllerSource, /drill_infrastructure[\s\S]*operation: sheetUpperFade, digital: 0/);
  assert.match(storyControllerSource, /operation_dispatch[\s\S]*infrastructure: 1, operation: 1, digital: 0/);
});

test('数字物流阶段保留可信空间节点并压缩平台垂直距离', () => {
  assert.match(storyControllerSource, /const trustedSpaceStage/);
  assert.match(storyControllerSource, /new Set\(\['trustedSpace'\]\)/);
  assert.match(storyControllerSource, /platform: 28\.6/);
  assert.ok(northGrainStory.platforms.find((platform) => platform.id === 'trustedSpace').heightOffset <= 1);
  assert.ok(demoLogisticsStory.platforms.find((platform) => platform.id === 'trustedSpace').heightOffset <= 1);
});

test('业务流程隐藏普通三层分解视图的全局连接线', () => {
  assert.match(runtimeSource, /const storyPresentation = Boolean\(context\.story \|\| this\.story\?\.active \|\| this\.story\?\.completed \|\| this\.shandongDemo\?\.active \|\| this\.shandongDemo\?\.completed\)/);
  assert.match(runtimeSource, /stackConnectorRoot\.visible = state === MAP_STATES\.EXPLODED[\s\S]*!storyPresentation/);
  assert.match(runtimeSource, /setStoryNationalSuppressed/);
  assert.match(operationLayerSource, /storyNationalSuppressed/);
  assert.match(digitalLayerSource, /setStoryNationalSuppressed/);
  assert.match(storyControllerSource, /stageId === 'drill_operation' \? 0 : operationOpacity/);
});

test('业务流程使用真实时间并保留完成画面', () => {
  assert.match(storyControllerSource, /const delta = Math\.max\(0,/);
  assert.doesNotMatch(storyControllerSource, /Math\.min\(0\.1, \(timestamp - this\.lastTimestamp\)/);
  assert.match(storyControllerSource, /complete\(\)[\s\S]*this\.root\.visible = true/);
  assert.doesNotMatch(storyControllerSource, /complete\(\)[\s\S]*this\.root\.visible = false/);
  assert.match(appShellSource, /stageMetrics/);
  assert.doesNotMatch(appShellSource, /\['业务结果', '汽车已出境'\]/);
});

test('业务流程控制器支持播放、跨幕、暂停与安全退出', () => {
  const calls = [];
  const visualWeightCalls = [];
  const runtime = {
    scene: new THREE.Scene(),
    data: { infrastructure: { storyRoute: autoPartsRoute } },
    registry: { get: (id) => demoEntities.find((entity) => entity.id === id) },
    projector: new GeoProjector(),
    controls: { enabled: true, target: new THREE.Vector3() },
    camera: { position: new THREE.Vector3(), fov: 35 },
    cameraDirector: { setExploded: () => {}, moveTo: () => {} },
    animations: { to: (target, values) => Object.assign(target, values) },
    layers: Object.fromEntries(['infrastructure', 'operation', 'digital'].map((layer) => [layer, { setVisualWeight: (weight, options) => { visualWeightCalls.push({ layer, weight, options }); } }])),
    ui: {
      showStory: () => calls.push('show'), setStoryPlayback: () => {}, hideStory: () => calls.push('hide'),
      completeStory: () => {}, updateStoryStage: (stage) => calls.push(stage.id), updateStoryProgress: () => {},
    },
    stateMachine: { state: 'COMBINED', context: {} },
    storyReturnSnapshot: null,
    captureViewSnapshot: () => ({
      state: 'COMBINED',
      context: {},
      cameraUserOverride: false,
      explodedFocusLayer: null,
      camera: { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 35 },
    }),
    restoreViewSnapshot: () => calls.push('restore'),
    setState: () => {},
    applyState: () => {},
  };
  const controller = new LogisticsStoryController(runtime);
  runtime.story = controller;
  controller.start(structuredClone(demoLogisticsStory));
  assert.equal(controller.playing, true);
  assert.equal(runtime.controls.enabled, true);
  controller.elapsed = 12;
  controller.update(performance.now() + 16);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'transport_demand');
  assert.equal(controller.weights.infrastructure, 0);
  assert.equal(controller.weights.operation, 0);
  assert.equal(controller.weights.digital, 1);
  controller.elapsed = 18;
  controller.update(performance.now() + 24);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'capacity_response');
  assert.equal(controller.capacityStreams.length, 5);
  controller.elapsed = 25;
  controller.update(performance.now() + 28);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'route_solve');
  assert.equal(controller.candidateCorridors.length, 2);
  controller.elapsed = 31;
  controller.update(performance.now() + 30);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'consensus');
  assert.equal(controller.consensusNodes.length, 5);
  controller.elapsed = 37;
  controller.update(performance.now() + 32);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'drill_operation');
  assert.ok(controller.weights.digital > 0 && controller.weights.digital < 1);
  assert.equal(controller.weights.operation, 1);
  assert.equal(controller.weights.infrastructure, 0);
  controller.elapsed = 48;
  controller.update(performance.now() + 48);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'operation_dispatch');
  assert.equal(controller.weights.infrastructure, 0);
  assert.equal(controller.weights.digital, 0);
  assert.equal(controller.weights.operation, 1);
  controller.elapsed = 54;
  controller.update(performance.now() + 64);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'drill_infrastructure');
  assert.ok(controller.weights.operation > 0 && controller.weights.operation < 1);
  controller.pause();
  assert.equal(controller.playing, false);
  controller.resume();
  controller.stop();
  assert.equal(controller.active, false);
  assert.equal(runtime.controls.enabled, true);
  assert.deepEqual(calls.slice(0, 2), ['show', 'transport_demand']);
  controller.dispose();
});

test('基础设施网与数字物流网使用全国驾驶舱，数字平台锚定上海', () => {
  const platform = digitalNetworkNodes.find((node) => node.id === 'DIG_NATIONAL_PLATFORM');
  const space = digitalNetworkNodes.find((node) => node.id === 'DIG_TRUSTED_SPACE');
  assert.equal(platform.province, '上海');
  assert.equal(space.province, '上海');
  assert.ok(Math.abs(platform.longitude - 121.47) < 0.2);
  assert.ok(Math.abs(platform.latitude - 31.23) < 0.2);
  assert.ok(Math.abs(space.longitude - 121.5) < 0.3);
  assert.ok(Math.abs(space.latitude - 31.3) < 0.3);
  assert.equal(platform.name, '国家物流大数据平台');
  assert.equal(space.name, '物流数据共享中心');
  assert.equal(digitalDashboard.mapOverlays.hubs[0].id, 'DIG_NATIONAL_PLATFORM');
  // 共享中心与动态数据网络退出地图浮标，只在节点详情里展开，保持地图标签精简。
  assert.ok(digitalDashboard.mapOverlays.hubs.every((hub) => hub.id !== 'DIG_TRUSTED_SPACE' && hub.id !== 'DIG_EVENT_BUS'));
  assert.deepEqual(digitalDashboard.mapOverlays.hubs.map((hub) => hub.name), ['国家物流大数据平台', '华东物流平台', '华北物流平台', '大湾区物流平台']);
  assert.match(appShellSource, /infrastructure-workspace/);
  assert.match(appShellSource, /digital-workspace/);
  assert.match(demoDataSource, /国家物流大数据平台/);
  assert.match(demoDataSource, /物流数据共享中心/);
  assert.match(appShellSource, /基础设施总览/);
  assert.match(appShellSource, /网络覆盖情况/);
  assert.match(appShellSource, /data-infra-mode/);
  assert.match(appShellSource, /data-digital-mode/);
  assert.doesNotMatch(appShellSource, /场景模式/);
  assert.match(runtimeSource, /FOCUS_INFRA \|\| state === MAP_STATES.FOCUS_DIGITAL/);
  assert.match(runtimeSource, /setOperationOverview\(\)/);
  assert.match(stylesSource, /#infrastructure-workspace/);
  assert.match(stylesSource, /#digital-workspace/);
  assert.equal(infrastructureDashboard.modes[0].id, 'overview');
  assert.deepEqual(infrastructureDashboard.mapOverlays.hubs.map((hub) => hub.name), ['上海', '成都']);
  assert.match(appShellSource, /applySingleLayerFilter/);
  assert.match(appShellSource, /renderLayerRow/);
  assert.match(infrastructureLayerSource, /id === 'hubs' \|\| id === 'nationalHubs'/);
  assert.doesNotMatch(appShellSource, /八纵八横/);
  assert.doesNotMatch(stylesSource, /infra-corridor-inset/);
  assert.match(appShellSource, /infra-rank-block/);
  assert.match(appShellSource, /infra-stat-strip/);
  assert.doesNotMatch(appShellSource, /infra-ticker/);
  assert.match(appShellSource, /renderLayerMasterControl/);
  assert.match(appShellSource, /layer-master-switch/);
  assert.match(appShellSource, /全部关闭/);
  assert.match(stylesSource, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.equal(infrastructureDashboard.stats[0][1], '16.5万公里');
  assert.equal(infrastructureDashboard.stats[1][1], '550万公里');
  assert.equal(infrastructureDashboard.stats[2][1], '12.87万公里');
  assert.equal(infrastructureDashboard.stats[3][1], '5,806个');
  assert.equal(infrastructureDashboard.stats[4][1], '16,540个');
  assert.equal(infrastructureDashboard.stats[5][1], '263个');
  assert.equal(infrastructureDashboard.overviewCards[1].value, '22,346');
  assert.equal(infrastructureDashboard.overviewCards[2].value, '263');
  assert.doesNotMatch(appShellSource, /枢纽指数/);
  const facilityRankings = buildFacilityDistributionRankings(infrastructureFacilities);
  assert.equal(facilityRankings.hubs[0].name, '重庆');
  assert.equal(facilityRankings.hubs[0].count, 5);
  assert.equal(facilityRankings.parks[0].name, '长沙');
  assert.equal(facilityRankings.parks[0].count, 10);
  assert.ok(facilityRankings.total[0].count >= facilityRankings.hubs[0].count);
  const attached = attachInfrastructureFacilityStats(infrastructureDashboard, infrastructureFacilities);
  assert.equal(attached.rankingLabel, '设施点数');
  assert.equal(attached.rankings.hubs[0].name, '重庆');
  assert.match(attached.mapOverlays.hubs[0].tasks, /个国家枢纽/);
});
