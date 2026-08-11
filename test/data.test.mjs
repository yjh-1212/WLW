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
const provinceSvg = fs.readFileSync(new URL('../public/data/china-provinces.svg', import.meta.url), 'utf8');
const interactionSource = fs.readFileSync(new URL('../src/core/InteractionManager.js', import.meta.url), 'utf8');
const runtimeSource = fs.readFileSync(new URL('../src/core/MapRuntime.js', import.meta.url), 'utf8');
const appShellSource = fs.readFileSync(new URL('../src/ui/AppShell.js', import.meta.url), 'utf8');
const dataManagerSource = fs.readFileSync(new URL('../src/data/LayerDataManager.js', import.meta.url), 'utf8');

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

test('示例实体遵循统一实体字段约定', () => {
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
});

test('演示实体名称、经纬度与地图点位保持一致', () => {
  const projector = new GeoProjector();
  demoEntities.forEach((entity) => {
    const projected = projector.fromLngLat([entity.longitude, entity.latitude]);
    const legacyPoint = projector.fromMapPoint(entity.mapPoint);
    assert.ok(projected.distanceTo(legacyPoint) < 0.001, `${entity.name} 的 mapPoint 与经纬度不一致`);
    assert.deepEqual(projector.fromEntity(entity).toArray(), projected.toArray());
  });
  const entityIds = new Set(demoEntities.map((entity) => entity.id));
  demoLogisticsStory.subjects.forEach((subject) => assert.ok(entityIds.has(subject.entityId)));
  demoLogisticsStory.execution.entityIds.forEach((entityId) => assert.ok(entityIds.has(entityId)));
  assert.match(demoLogisticsStory.shipment.origin, /松原/);
  assert.match(demoLogisticsStory.shipment.destination, /南沙港区/);
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
  assert.ok(demoLogisticsStory.feedback.length >= 5);
  assert.match(appShellSource, /id="story-toggle"/);
  assert.match(dataManagerSource, /\/stories\/\$\{encodeURIComponent\(storyId\)\}\/timeline/);
});

test('业务演示控制器支持播放、跨幕、暂停与安全退出', () => {
  const calls = [];
  const runtime = {
    scene: new THREE.Scene(),
    registry: { get: (id) => demoEntities.find((entity) => entity.id === id) },
    projector: new GeoProjector(),
    controls: { enabled: true, target: new THREE.Vector3() },
    camera: { position: new THREE.Vector3() },
    cameraDirector: { setExploded: () => {}, moveTo: () => {} },
    animations: { to: (target, values) => Object.assign(target, values) },
    layers: Object.fromEntries(['infrastructure', 'operation', 'digital'].map((layer) => [layer, { setVisualWeight: () => {} }])),
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
  assert.equal(runtime.controls.enabled, false);
  controller.elapsed = 9;
  controller.update(performance.now() + 16);
  assert.equal(controller.story.stages[controller.stageIndex].id, 'digital_optimize');
  controller.pause();
  assert.equal(controller.playing, false);
  controller.resume();
  controller.stop();
  assert.equal(controller.active, false);
  assert.equal(runtime.controls.enabled, true);
  assert.deepEqual(calls.slice(0, 2), ['show', 'digital_optimize']);
  controller.dispose();
});
