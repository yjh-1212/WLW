import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { demoEntities } from '../src/data/demoData.js';
import { demoLogisticsStory } from '../src/data/storyDemoData.js';
import { GeoProjector } from '../src/map/GeoProjector.js';
import * as THREE from 'three';
import { PenetrationController } from '../src/interaction/PenetrationController.js';
import { LogisticsStoryController } from '../src/story/LogisticsStoryController.js';

const routesPayload = JSON.parse(fs.readFileSync(new URL('../public/data/backbone-routes.json', import.meta.url), 'utf8'));
const infrastructureTransport = JSON.parse(fs.readFileSync(new URL('../public/data/infrastructure/transport.json', import.meta.url), 'utf8'));
const infrastructureFacilities = JSON.parse(fs.readFileSync(new URL('../public/data/infrastructure/facilities.json', import.meta.url), 'utf8'));
const northGrainRoute = JSON.parse(fs.readFileSync(new URL('../public/data/infrastructure/north-grain-route.json', import.meta.url), 'utf8'));
const provinceSvg = fs.readFileSync(new URL('../public/data/china-provinces.svg', import.meta.url), 'utf8');
const interactionSource = fs.readFileSync(new URL('../src/core/InteractionManager.js', import.meta.url), 'utf8');
const runtimeSource = fs.readFileSync(new URL('../src/core/MapRuntime.js', import.meta.url), 'utf8');
const appShellSource = fs.readFileSync(new URL('../src/ui/AppShell.js', import.meta.url), 'utf8');
const dataManagerSource = fs.readFileSync(new URL('../src/data/LayerDataManager.js', import.meta.url), 'utf8');
const infrastructureLayerSource = fs.readFileSync(new URL('../src/layers/infrastructure/InfrastructureLayer.js', import.meta.url), 'utf8');
const storyControllerSource = fs.readFileSync(new URL('../src/story/LogisticsStoryController.js', import.meta.url), 'utf8');

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
  assert.match(runtimeSource, /solidSheets = state === MAP_STATES\.EXPLODED \|\| state === MAP_STATES\.PENETRATION/);
  assert.match(runtimeSource, /const sheetOpacity = solidSheets \? 1 : sheet\.userData\.baseOpacity \* target\.weight/);
  assert.match(runtimeSource, /this\.baseMap\.setSheetOpacity\(sheet, sheetOpacity\)/);
});

test('炸开视图中的上层实体地图遮挡下层基础设施要素', () => {
  assert.match(runtimeSource, /setStackOcclusion\(solidSheets\)/);
  assert.match(infrastructureLayerSource, /setStackOcclusion\(enabled\)/);
  assert.match(infrastructureLayerSource, /\[this\.routeRoot, this\.transportRoot, this\.facilityRoot\]/);
  assert.match(infrastructureLayerSource, /material\.depthTest = enabled/);
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

test('演示实体遵循统一实体字段约定', () => {
  assert.equal(new Set(demoEntities.map((entity) => entity.id)).size, demoEntities.length);
  demoEntities.forEach((entity) => {
    assert.ok(entity.id && entity.name && entity.type);
    assert.equal(entity.coordinate_system, 'WGS84');
    assert.equal(entity.mapPoint.length, 2);
    assert.ok(entity.infrastructure && entity.operation && entity.digital);
  });
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

test('演示实体名称、经纬度与地图点位保持一致', () => {
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
  assert.match(demoLogisticsStory.shipment.origin, /吉林/);
  assert.match(demoLogisticsStory.shipment.destination, /佛山/);
});

test('垂直穿透控制器允许在无选中对象时安全初始化', () => {
  const registry = { getReferences: () => ({}) };
  const selectionRoot = new THREE.Group();
  assert.doesNotThrow(() => new PenetrationController({ registry, selectionRoot }));
  assert.equal(selectionRoot.children.length, 1);
  assert.equal(selectionRoot.children[0].visible, false);
});

test('地图底板不参与点击拾取，路线保持可交互', () => {
  assert.doesNotMatch(interactionSource, /kind:\s*['"]province['"]/);
  assert.doesNotMatch(runtimeSource, /getInteractiveProvinceMeshes/);
  assert.match(interactionSource, /kind:\s*['"]route['"]/);
  assert.match(interactionSource, /focusRoute\(hit\.routeId\)/);
});

test('南海诸岛附图保留规范要求的关键岛礁与九段断续线', () => {
  const boundaryGroup = appShellSource.match(/<g class="boundary-dashes"[\s\S]*?<\/g>/)?.[0] ?? '';
  assert.equal((boundaryGroup.match(/<path\s/g) ?? []).length, 9);
  ['东沙群岛', '西沙群岛', '中沙群岛', '南沙群岛', '黄岩岛', '曾母暗沙'].forEach((name) => {
    assert.match(appShellSource, new RegExp(`aria-label="${name}"`));
  });
});

test('一单贯穿三网演示时间轴连续且形成闭环', () => {
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
  assert.deepEqual(demoLogisticsStory.candidates.filter((candidate) => !candidate.selected).map((candidate) => candidate.path.length), [10, 11]);
  assert.ok(demoLogisticsStory.feedback.length >= 5);
  const platforms = Object.fromEntries(demoLogisticsStory.platforms.map((platform) => [platform.id, platform]));
  assert.deepEqual(platforms.trustedSpace.coordinates, [121.47, 31.23]);
  assert.equal(platforms.trustedSpace.name, '物流可信数据空间');
  assert.ok(platforms.jilinPlatform.coordinates[1] > 43);
  assert.ok(platforms.liaoningPlatform.coordinates[1] > 40);
  assert.ok(platforms.guangdongPlatform.coordinates[1] < 25);
  assert.deepEqual(northGrainRoute.legs.map((leg) => leg.mode), ['road', 'rail', 'sea', 'road', 'rail', 'road']);
  northGrainRoute.legs.forEach((leg) => {
    assert.ok(leg.path.length >= 2);
    leg.path.forEach(([longitude, latitude]) => {
      assert.ok(longitude >= 73 && longitude <= 135);
      assert.ok(latitude >= 18 && latitude <= 54);
    });
    if (leg.mode !== 'sea') assert.match(leg.source, /主要(公路|铁路)\.geojson/);
  });
  assert.match(dataManagerSource, /north-grain-route\.json/);
  assert.match(appShellSource, /物流可信数据空间/);
  assert.doesNotMatch(appShellSource, /stack-layer-label platform/);
  assert.match(runtimeSource, /updateScreenLayerLabels/);
  assert.match(storyControllerSource, /makePlatformTether/);
  assert.match(storyControllerSource, /declutterLabels/);
  assert.match(appShellSource, /id="story-toggle"/);
  assert.match(appShellSource, /id="story-follow"/);
  assert.match(dataManagerSource, /\/stories\/\$\{encodeURIComponent\(storyId\)\}\/timeline/);
});

test('业务演示控制器支持播放、跨幕、暂停与安全退出', () => {
  const calls = [];
  const visualWeightCalls = [];
  const runtime = {
    scene: new THREE.Scene(),
    data: { infrastructure: { storyRoute: northGrainRoute } },
    registry: { get: (id) => demoEntities.find((entity) => entity.id === id) },
    projector: new GeoProjector(),
    controls: { enabled: true, target: new THREE.Vector3() },
    camera: { position: new THREE.Vector3() },
    cameraDirector: { setExploded: () => {}, moveTo: () => {} },
    animations: { to: (target, values) => Object.assign(target, values) },
    layers: Object.fromEntries(['infrastructure', 'operation', 'digital'].map((layer) => [layer, { setVisualWeight: (weight, options) => { visualWeightCalls.push({ layer, weight, options }); } }])),
    ui: {
      showStory: () => calls.push('show'), setStoryPlayback: () => {}, hideStory: () => calls.push('hide'),
      completeStory: () => {}, updateStoryStage: (stage) => calls.push(stage.id), updateStoryProgress: () => {},
    },
    stateMachine: { state: 'COMBINED' },
    setState: () => {},
    applyState: () => {},
  };
  const controller = new LogisticsStoryController(runtime);
  runtime.story = controller;
  controller.start(structuredClone(demoLogisticsStory));
  assert.equal(controller.playing, true);
  assert.equal(runtime.controls.enabled, true);
  controller.elapsed = 9;
  controller.update(performance.now() + 16);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'transport_demand');
  assert.equal(controller.weights.infrastructure, 1);
  assert.equal(controller.weights.operation, 1);
  assert.equal(controller.weights.digital, 1);
  controller.elapsed = 15;
  controller.update(performance.now() + 24);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'capacity_response');
  assert.equal(controller.capacityStreams.length, 5);
  controller.elapsed = 23;
  controller.update(performance.now() + 28);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'route_solve');
  assert.equal(controller.candidateCorridors.length, 2);
  controller.elapsed = 30;
  controller.update(performance.now() + 30);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'consensus');
  assert.equal(controller.consensusNodes.length, 5);
  controller.elapsed = 41;
  controller.update(performance.now() + 32);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'drill_operation');
  assert.ok(controller.weights.digital > 0 && controller.weights.digital < 1);
  assert.equal(controller.weights.operation, 1);
  assert.ok(visualWeightCalls.every((call) => call.layer === 'digital'));
  controller.elapsed = 44;
  controller.update(performance.now() + 48);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'operation_dispatch');
  assert.equal(controller.weights.infrastructure, 1);
  assert.equal(controller.weights.digital, 0);
  assert.equal(controller.weights.operation, 1);
  controller.elapsed = 46;
  controller.update(performance.now() + 64);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'drill_infrastructure');
  assert.ok(controller.weights.operation > 0 && controller.weights.operation < 1);
  assert.ok(visualWeightCalls.some((call) => call.layer === 'operation'));
  assert.ok(visualWeightCalls.every((call) => call.layer !== 'infrastructure'));
  controller.pause();
  assert.equal(controller.playing, false);
  controller.resume();
  controller.stop();
  assert.equal(controller.active, false);
  assert.equal(runtime.controls.enabled, true);
  assert.deepEqual(calls.slice(0, 2), ['show', 'transport_demand']);
  controller.dispose();
});
