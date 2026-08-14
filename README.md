# 国家物流网“一图三网”系统

基于 Three.js 的国家物流网空间交互系统，以同一全国空间承载基础设施网、物流运营网与数字物流网。

## 已实现

- 中国省级 3D 几何底图支持点击下钻，34 个省级区域均可进入省级物流平台视图
- 省内呈现省边界与市级边界（直辖市/港澳按区级、台湾按县市级），保持基础设施网、物流运营网、数字物流网三层结构
- 省级物流平台作为三层统一中枢，呈现地市协同与省域枢纽、冷链基地、规模园区指标
- 三网合一、三层分解、基础/运营/数字单层分析状态
- 六轴、七廊、八通道本地化线路数据及分类开关
- 重点枢纽、港口、货物流粒子、数字连接与异常呼吸效果
- 统一实体详情与三层垂直穿透
- 运输任务搜索与任务事件链追踪
- “一单贯穿三网”自动业务流程：可信协同、运营组织、设施执行与数据回流，支持暂停、重播和用户操作中断
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

`local` 模式使用本地业务数据。`api` 模式优先访问实时接口，接口超时或失败时切换至本地业务数据，底图与其他图层保持可用。

### 已保留的真实接口

| 接口 | 用途 |
| --- | --- |
| `GET /api/map/entities?bbox=&types=&lod=` | 视窗实体与 LOD 数据 |
| `GET /api/map/transport/{layer}?bbox=&lod=` | 道路、铁路等交通线网扩展入口 |
| `GET /api/map/corridors` | 六轴七廊八通道 |
| `GET /api/entities/{id}/penetration` | 统一实体三层穿透 |
| `GET /api/tasks/{id}/trace` | 运输任务全链路 |
| `GET /api/stories/{id}/timeline` | 三网业务流程时间轴、运单、主体、方案与回流事件 |
| `GET /api/digital/relations?bbox=&type=` | 数字连接与授权关系扩展入口 |
| `WS /ws/map/runtime` | 车辆、船舶、任务与事件增量 |

接口实体建议保持 `id`、`name`、`type`、`longitude`、`latitude`、`coordinate_system`、`source_type`、`source_ref`、`verified_status`、`effective_from/effective_to` 和 `attributes` 字段。

业务流程接口返回统一时间轴结构；接口不可用时切换至本地业务数据，不影响其他实时图层：

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
├─ data/          # API、数据管理、实体注册、LOD、业务数据
├─ theme/         # 统一主题入口
└─ ui/            # 界面壳与抽屉
```

## 数据说明

`public/data/china-provinces.svg` 和 `backbone-routes.json` 从用户提供的透明底版 HTML 中机械提取，随后由 Three.js 转换为几何与线网进行实时渲染；页面没有嵌入原 HTML、iframe 或地图截图。`scripts/extract-reference.mjs` 保留了可复现的提取流程。

省内市界由 DataV.GeoAtlas 的地市/区级边界与 g0v/twgeojson 的台湾县市边界合并、简化生成，源文件保存在 `data/`，执行 `node scripts/prepare-province-boundaries.mjs` 可重新生成 `public/data/province-boundaries.json`。

当前线路和业务对象的数据来源、版本及有效期记录在资源清单中。公开发布前需完成来源核验、版本确认和地图审图。
