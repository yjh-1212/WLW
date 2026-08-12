# 国家物流网“一图三网”展示系统

基于 Three.js 的国家物流网空间交互原型。实现遵循《国家物流网“一图三网”Three.js 交互地图开发设计说明书 V1.0》，以同一全国空间承载基础设施网、物流运营网与数字物流网。

## 已实现

- 中国省级 3D 几何底图作为非交互空间底板，全国视角复位
- 三网合一、三层分解、基础/运营/数字单层分析状态
- 六轴、七廊、八通道本地化线路数据及分类开关
- 演示枢纽、港口、货物流粒子、数字连接与异常呼吸效果
- 统一实体详情与三层垂直穿透
- 运输任务搜索与任务事件链展示
- “一单贯穿三网”38 秒自动演示：可信协同、运营组织、设施执行与数据回流，支持暂停、重播和用户操作中断
- 左侧图层抽屉、右侧对象抽屉、统一搜索、南海诸岛紧凑附图、LOD/服务状态栏
- 可取消、可超时、失败隔离的真实 API 加载层，以及 WebSocket 增量接口入口
- 响应式布局与 `prefers-reduced-motion` 支持

## 启动

```bash
npm install
npm run dev
```

生产构建与测试：

```bash
npm test
npm run build
```

## 数据模式

复制 `.env.example` 为 `.env.local` 后可切换数据模式：

```dotenv
VITE_DATA_MODE=api
VITE_API_BASE_URL=/api
VITE_WS_URL=/ws/map/runtime
VITE_REQUEST_TIMEOUT=8000
```

`demo` 模式完全使用本地演示数据。`api` 模式优先访问真实接口，接口超时或失败时只回退相应的演示能力，底图与其他图层保持可用。

### 已保留的真实接口

| 接口 | 用途 |
| --- | --- |
| `GET /api/map/entities?bbox=&types=&lod=` | 视窗实体与 LOD 数据 |
| `GET /api/map/transport/{layer}?bbox=&lod=` | 道路、铁路等交通线网扩展入口 |
| `GET /api/map/corridors` | 六轴七廊八通道 |
| `GET /api/entities/{id}/penetration` | 统一实体三层穿透 |
| `GET /api/tasks/{id}/trace` | 运输任务全链路 |
| `GET /api/stories/{id}/timeline` | 三网业务演示时间轴、运单、主体、方案与回流事件 |
| `GET /api/digital/relations?bbox=&type=` | 数字连接与授权关系扩展入口 |
| `WS /ws/map/runtime` | 车辆、船舶、任务与事件增量 |

接口实体建议保持 `id`、`name`、`type`、`longitude`、`latitude`、`coordinate_system`、`source_type`、`source_ref`、`verified_status`、`effective_from/effective_to` 和 `attributes` 字段。

业务演示接口返回统一时间轴结构；接口不可用时，仅演示数据回退，不影响其他实时图层：

```json
{
  "id": "GRAIN_NORTH_TO_SOUTH",
  "duration": 38,
  "shipment": { "id": "...", "cargo": "...", "quantity": 2000, "unit": "吨" },
  "subjects": [{ "id": "railway", "entityId": "PORT_YINGKOU", "response": "班列与车皮" }],
  "candidates": [{ "id": "A", "score": 96, "selected": true }],
  "execution": { "entityIds": ["PORT_YINGKOU", "HUB_WUHAN", "PORT_GUANGZHOU"], "modes": ["铁路干线", "沿海航运"] },
  "feedback": ["已装车", "到港 ETA 更新", "已签收"],
  "stages": [{ "id": "digital_collect", "start": 3, "end": 8, "title": "...", "subtitle": "..." }]
}
```

其中 `entityId` 必须复用地图统一实体 ID，`stages` 必须首尾连续且最后一幕 `end` 等于 `duration`。真实接口可以替换运单、主体、方案、执行节点和事件内容，前端镜头与动画编排无需改动。

## 目录结构

```text
src/
├─ core/          # 运行时、状态机、相机、动画、交互
├─ map/           # 中国地图与统一坐标投影
├─ layers/        # 基础设施、运营、数字三层渲染
├─ interaction/   # 垂直穿透
├─ data/          # API、数据管理、实体注册、LOD、演示数据
├─ theme/         # 统一主题入口
└─ ui/            # 界面壳与抽屉
```

## 数据说明

`public/data/china-provinces.svg` 和 `backbone-routes.json` 从用户提供的透明底版 HTML 中机械提取，随后由 Three.js 转换为几何与线网进行实时渲染；页面没有嵌入原 HTML、iframe 或地图截图。`scripts/extract-reference.mjs` 保留了可复现的提取流程。

当前线路和业务对象均标记为演示/参考数据，不作为测绘或正式业务依据。公开发布前请替换为已核验的合规地图数据，并补充来源、版本、有效期和审图信息。
