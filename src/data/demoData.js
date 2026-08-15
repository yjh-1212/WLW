export const demoEntities = [
  {
    id: 'PORT_YINGKOU', name: '营口港', type: 'port', province: '辽宁', mapPoint: [1060.152, 462.295],
    longitude: 122.22, latitude: 40.65, coordinate_system: 'WGS84', source_type: 'local',
    source_ref: 'local://entity/PORT_YINGKOU', verified_status: 'local-record', effective_from: '2026-08-01',
    infrastructure: { level: '国家物流枢纽', lines: 6, capacity: '1.8 亿吨/年', status: '正常' },
    operation: { throughput: '38.6 万吨', tasks: 126, load: 78, status: '繁忙' },
    digital: { connectors: 18, resources: 42, apiHealth: 99.96, latestEvent: '到港确认' },
  },
  {
    id: 'HUB_ZHENGZHOU', name: '郑州国家物流枢纽', type: 'hub', province: '河南', mapPoint: [925.347, 616.152],
    longitude: 113.62, latitude: 34.75, coordinate_system: 'WGS84', source_type: 'local',
    source_ref: 'local://entity/HUB_ZHENGZHOU', verified_status: 'local-record', effective_from: '2026-08-01',
    infrastructure: { level: '陆港型枢纽', lines: 11, capacity: '540 万标箱/年', status: '正常' },
    operation: { throughput: '12.4 万吨', tasks: 208, load: 64, status: '顺畅' },
    digital: { connectors: 27, resources: 69, apiHealth: 99.91, latestEvent: '班列发运' },
  },
  {
    id: 'PORT_SHANGHAI', name: '上海港', type: 'port', province: '上海', mapPoint: [1084.549, 675.641],
    longitude: 121.47, latitude: 31.23, coordinate_system: 'WGS84', source_type: 'local',
    source_ref: 'local://entity/PORT_SHANGHAI', verified_status: 'local-record', effective_from: '2026-08-01',
    infrastructure: { level: '国际枢纽港', lines: 14, capacity: '5000 万标箱/年', status: '正常' },
    operation: { throughput: '51.8 万吨', tasks: 346, load: 82, status: '繁忙' },
    digital: { connectors: 41, resources: 128, apiHealth: 99.98, latestEvent: '装船完成' },
  },
  {
    id: 'HUB_CHENGDU', name: '成都国际铁路港', type: 'rail-hub', province: '四川', mapPoint: [746.253, 716.613],
    longitude: 104.06, latitude: 30.67, coordinate_system: 'WGS84', source_type: 'local',
    source_ref: 'local://entity/HUB_CHENGDU', verified_status: 'local-record', effective_from: '2026-08-01',
    infrastructure: { level: '国家物流枢纽', lines: 9, capacity: '260 万标箱/年', status: '正常' },
    operation: { throughput: '9.6 万吨', tasks: 187, load: 71, status: '顺畅' },
    digital: { connectors: 23, resources: 58, apiHealth: 99.88, latestEvent: '换装完成' },
  },
  {
    id: 'PORT_GUANGZHOU', name: '广州港南沙港区', type: 'port', province: '广东', mapPoint: [952.321, 894.132],
    longitude: 113.68, latitude: 22.60, coordinate_system: 'WGS84', source_type: 'local',
    source_ref: 'local://entity/PORT_GUANGZHOU', verified_status: 'local-record', effective_from: '2026-08-01',
    infrastructure: { level: '国际枢纽港', lines: 12, capacity: '2800 万标箱/年', status: '正常' },
    operation: { throughput: '44.2 万吨', tasks: 281, load: 74, status: '顺畅' },
    digital: { connectors: 36, resources: 96, apiHealth: 99.94, latestEvent: '预计到达更新' },
  },
  {
    id: 'HUB_WUHAN', name: '武汉阳逻港', type: 'port', province: '湖北', mapPoint: [952.502, 707.133],
    longitude: 114.57, latitude: 30.66, coordinate_system: 'WGS84', source_type: 'local',
    source_ref: 'local://entity/HUB_WUHAN', verified_status: 'local-record', effective_from: '2026-08-01',
    infrastructure: { level: '港口型枢纽', lines: 8, capacity: '500 万标箱/年', status: '正常' },
    operation: { throughput: '8.1 万吨', tasks: 94, load: 57, status: '顺畅' },
    digital: { connectors: 16, resources: 37, apiHealth: 99.86, latestEvent: '多式联运交接' },
  },
  {
    id: 'HUB_SONGYUAN', name: '松原粮食物流节点', type: 'grain-hub', province: '吉林', mapPoint: [1082.89, 353.167],
    longitude: 124.82, latitude: 45.14, coordinate_system: 'WGS84', source_type: 'local',
    source_ref: 'local://entity/HUB_SONGYUAN', verified_status: 'local-record', effective_from: '2026-08-01',
    infrastructure: { level: '粮食物流节点', lines: 5, capacity: '860 万吨/年', status: '正常' },
    operation: { throughput: '6.8 万吨', tasks: 73, load: 61, status: '顺畅' },
    digital: { connectors: 12, resources: 31, apiHealth: 99.92, latestEvent: '粮源集结完成' },
  },
];

const makeNetworkEntity = ({
  id, name, province, longitude, latitude, layer, role, lod = 1, type = 'network-node', status = '正常', operation = {}, digital = {},
}) => ({
  id,
  name,
  type,
  province,
  longitude,
  latitude,
  coordinate_system: 'WGS84',
  source_type: 'local',
  source_ref: `local://network/${id}`,
  verified_status: 'local-record',
  effective_from: '2026-08-01',
  layers: [layer],
  networkRole: role,
  lod,
  infrastructure: { level: '业务网络节点', lines: 0, capacity: '按需协同', status },
  operation: { throughput: '实时汇聚', tasks: 0, load: 62, activity: 72, status, ...operation },
  digital: {
    connectors: 8,
    entities: 86,
    systems: 24,
    resources: 126,
    serviceCalls: '1.8万',
    shares: '0.6万',
    apiHealth: 99.92,
    latestEvent: '物流信息更新',
    ...digital,
  },
});

export const operationNetworkNodes = [
  makeNetworkEntity({ id: 'OP_NATIONAL_COORD', name: '全国物流运行协调中心', province: '北京', longitude: 116.40, latitude: 39.90, layer: 'operation', role: 'coordinator', lod: 0, operation: { throughput: '124.5 万吨', tasks: 18763, load: 93, activity: 97 } }),
  makeNetworkEntity({ id: 'OP_NORTHEAST_CENTER', name: '东北区域运营中心', province: '辽宁', longitude: 123.43, latitude: 41.80, layer: 'operation', role: 'coordinator', lod: 0, operation: { throughput: '245.6 万吨', tasks: 3256, load: 83, activity: 92 } }),
  makeNetworkEntity({ id: 'OP_JILIN_GRAIN', name: '吉林粮源组织节点', province: '吉林', longitude: 124.82, latitude: 45.14, layer: 'operation', role: 'shipper', lod: 1, operation: { throughput: '32.8 万吨', tasks: 286, load: 76, activity: 88 } }),
  makeNetworkEntity({ id: 'OP_YINGKOU_PORT', name: '营口港集疏运中心', province: '辽宁', longitude: 122.22, latitude: 40.65, layer: 'operation', role: 'operator', lod: 1, operation: { throughput: '38.6 万吨', tasks: 568, load: 81, activity: 91 } }),
  makeNetworkEntity({ id: 'OP_BOHAI_SHIPPING', name: '渤海轮渡承运节点', province: '辽宁', longitude: 121.62, latitude: 38.92, layer: 'operation', role: 'carrier', lod: 2 }),
  makeNetworkEntity({ id: 'OP_TIANJIN_HUB', name: '京津冀多式联运中心', province: '天津', longitude: 117.20, latitude: 39.13, layer: 'operation', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'OP_ZHENGZHOU_CENTER', name: '中原区域运营中心', province: '河南', longitude: 113.62, latitude: 34.75, layer: 'operation', role: 'coordinator', lod: 0, operation: { throughput: '186.3 万吨', tasks: 2189, load: 84, activity: 94 } }),
  makeNetworkEntity({ id: 'OP_XIAN_RAIL', name: '西安铁路承运节点', province: '陕西', longitude: 108.94, latitude: 34.34, layer: 'operation', role: 'carrier', lod: 1 }),
  makeNetworkEntity({ id: 'OP_URUMQI_CENTER', name: '西北区域运营中心', province: '新疆', longitude: 87.62, latitude: 43.82, layer: 'operation', role: 'coordinator', lod: 0, operation: { throughput: '48.2 万吨', tasks: 568, load: 72, activity: 86 } }),
  makeNetworkEntity({ id: 'OP_CHENGDU_CENTER', name: '西南区域运营中心', province: '四川', longitude: 104.06, latitude: 30.67, layer: 'operation', role: 'coordinator', lod: 0, operation: { throughput: '54.3 万吨', tasks: 623, load: 76, activity: 89 } }),
  makeNetworkEntity({ id: 'OP_CHONGQING_AUTO', name: '重庆汽车产业货主节点', province: '重庆', longitude: 106.50, latitude: 29.63, layer: 'operation', role: 'shipper', lod: 1, operation: { throughput: '3,286 辆', tasks: 126, load: 78, activity: 93 } }),
  makeNetworkEntity({ id: 'OP_CHONGQING_BASE', name: '重庆整车集散基地', province: '重庆', longitude: 106.60, latitude: 29.68, layer: 'operation', role: 'operator', lod: 2, operation: { throughput: '160.7 万吨', tasks: 2012, load: 82, activity: 95 } }),
  makeNetworkEntity({ id: 'OP_WUHAN_CENTER', name: '长江中游运营中心', province: '湖北', longitude: 114.31, latitude: 30.59, layer: 'operation', role: 'coordinator', lod: 0, operation: { throughput: '168.4 万吨', tasks: 1854, load: 82, activity: 93 } }),
  makeNetworkEntity({ id: 'OP_QINGDAO_PORT', name: '青岛港运营节点', province: '山东', longitude: 120.38, latitude: 36.07, layer: 'operation', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'OP_SHANGHAI_PORT', name: '上海港运营节点', province: '上海', longitude: 121.47, latitude: 31.23, layer: 'operation', role: 'operator', lod: 0, operation: { throughput: '312.8 万吨', tasks: 4287, load: 91, activity: 98 } }),
  makeNetworkEntity({ id: 'OP_NINGBO_PORT', name: '宁波舟山港运营节点', province: '浙江', longitude: 121.87, latitude: 29.92, layer: 'operation', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'OP_XIAMEN_PORT', name: '厦门港运营节点', province: '福建', longitude: 118.08, latitude: 24.48, layer: 'operation', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'OP_GBA_CENTER', name: '粤港澳大湾区运营中心', province: '广东', longitude: 113.26, latitude: 23.13, layer: 'operation', role: 'coordinator', lod: 0, operation: { throughput: '198.4 万吨', tasks: 2451, load: 86, activity: 96 } }),
  makeNetworkEntity({ id: 'OP_FOSHAN_FACTORY', name: '佛山制造货主节点', province: '广东', longitude: 112.99, latitude: 23.07, layer: 'operation', role: 'shipper', lod: 2 }),
  makeNetworkEntity({ id: 'OP_ZHANJIANG_PORT', name: '湛江港集疏运节点', province: '广东', longitude: 110.41, latitude: 21.19, layer: 'operation', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'OP_NANNING_CENTER', name: '北部湾区域运营中心', province: '广西', longitude: 108.32, latitude: 22.82, layer: 'operation', role: 'coordinator', lod: 1 }),
  makeNetworkEntity({ id: 'OP_KUNMING_CENTER', name: '面向南亚运营中心', province: '云南', longitude: 102.71, latitude: 25.04, layer: 'operation', role: 'coordinator', lod: 0 }),
];

const OPERATION_RELATION_PROFILES = {
  OPR_01: { mode: 'coordination', volume: 32, activity: 62 }, OPR_02: { mode: 'coordination', volume: 44, activity: 71 },
  OPR_03: { mode: 'coordination', volume: 51, activity: 75 }, OPR_04: { mode: 'coordination', volume: 38, activity: 68 },
  OPR_05: { mode: 'coordination', volume: 55, activity: 77 }, OPR_06: { mode: 'coordination', volume: 28, activity: 58 },
  OPR_07: { mode: 'road', volume: 33, activity: 88, taskId: 'OP_TASK_GRAIN_SOUTH' },
  OPR_08: { mode: 'rail', volume: 46, activity: 94, taskId: 'OP_TASK_GRAIN_SOUTH' },
  OPR_09: { mode: 'water', volume: 58, activity: 91, taskId: 'OP_TASK_GRAIN_SOUTH', multimodal: true },
  OPR_10: { mode: 'water', volume: 72, activity: 96, taskId: 'OP_TASK_GRAIN_SOUTH' },
  OPR_11: { mode: 'water', volume: 86, activity: 98, taskId: 'OP_TASK_GRAIN_SOUTH' },
  OPR_12: { mode: 'rail', volume: 43, activity: 82 }, OPR_13: { mode: 'rail', volume: 39, activity: 79 },
  OPR_14: { mode: 'rail', volume: 48, activity: 87 }, OPR_15: { mode: 'road', volume: 24, activity: 90 },
  OPR_16: { mode: 'road', volume: 38, activity: 95, taskId: 'OP_TASK_AUTO_EXPORT' },
  OPR_17: { mode: 'rail', volume: 61, activity: 98, taskId: 'OP_TASK_AUTO_EXPORT' },
  OPR_18: { mode: 'rail', volume: 47, activity: 86, multimodal: true },
  OPR_19: { mode: 'water', volume: 74, activity: 97, taskId: 'OP_TASK_AUTO_EXPORT', multimodal: true },
  OPR_20: { mode: 'rail', volume: 67, activity: 94 }, OPR_21: { mode: 'road', volume: 31, activity: 84 },
  OPR_22: { mode: 'road', volume: 52, activity: 91 }, OPR_23: { mode: 'air', volume: 49, activity: 89 },
  OPR_24: { mode: 'road', volume: 34, activity: 77 }, OPR_25: { mode: 'road', volume: 26, activity: 68 },
  OPR_26: { mode: 'water', volume: 21, activity: 42, severity: 'warning' }, OPR_27: { mode: 'water', volume: 29, activity: 73 },
  OPR_28: { mode: 'rail', volume: 45, activity: 87 }, OPR_29: { mode: 'water', volume: 52, activity: 90 },
  OPR_30: { mode: 'rail', volume: 39, activity: 84 }, OPR_31: { mode: 'rail', volume: 57, activity: 92 },
  OPR_32: { mode: 'rail', volume: 68, activity: 95, multimodal: true }, OPR_33: { mode: 'water', volume: 63, activity: 93 },
  OPR_34: { mode: 'air', volume: 42, activity: 86 }, OPR_35: { mode: 'water', volume: 47, activity: 89 },
};

export const operationNetworkRelations = [
  { id: 'OPR_01', from: 'OP_NATIONAL_COORD', to: 'OP_NORTHEAST_CENTER', type: 'collaboration', lod: 0 },
  { id: 'OPR_02', from: 'OP_NATIONAL_COORD', to: 'OP_ZHENGZHOU_CENTER', type: 'collaboration', lod: 0 },
  { id: 'OPR_03', from: 'OP_NATIONAL_COORD', to: 'OP_WUHAN_CENTER', type: 'collaboration', lod: 0 },
  { id: 'OPR_04', from: 'OP_NATIONAL_COORD', to: 'OP_CHENGDU_CENTER', type: 'collaboration', lod: 0 },
  { id: 'OPR_05', from: 'OP_NATIONAL_COORD', to: 'OP_GBA_CENTER', type: 'collaboration', lod: 0 },
  { id: 'OPR_06', from: 'OP_NATIONAL_COORD', to: 'OP_URUMQI_CENTER', type: 'collaboration', lod: 0 },
  { id: 'OPR_07', from: 'OP_NORTHEAST_CENTER', to: 'OP_JILIN_GRAIN', type: 'order', lod: 1 },
  { id: 'OPR_08', from: 'OP_JILIN_GRAIN', to: 'OP_YINGKOU_PORT', type: 'capacity', lod: 1 },
  { id: 'OPR_09', from: 'OP_YINGKOU_PORT', to: 'OP_QINGDAO_PORT', type: 'handoff', lod: 1 },
  { id: 'OPR_10', from: 'OP_QINGDAO_PORT', to: 'OP_SHANGHAI_PORT', type: 'handoff', lod: 1 },
  { id: 'OPR_11', from: 'OP_SHANGHAI_PORT', to: 'OP_GBA_CENTER', type: 'handoff', lod: 0 },
  { id: 'OPR_12', from: 'OP_ZHENGZHOU_CENTER', to: 'OP_TIANJIN_HUB', type: 'capacity', lod: 1 },
  { id: 'OPR_13', from: 'OP_ZHENGZHOU_CENTER', to: 'OP_XIAN_RAIL', type: 'capacity', lod: 1 },
  { id: 'OPR_14', from: 'OP_XIAN_RAIL', to: 'OP_URUMQI_CENTER', type: 'handoff', lod: 1 },
  { id: 'OPR_15', from: 'OP_CHENGDU_CENTER', to: 'OP_CHONGQING_AUTO', type: 'order', lod: 1 },
  { id: 'OPR_16', from: 'OP_CHONGQING_AUTO', to: 'OP_CHONGQING_BASE', type: 'capacity', lod: 2 },
  { id: 'OPR_17', from: 'OP_CHONGQING_BASE', to: 'OP_WUHAN_CENTER', type: 'handoff', lod: 1 },
  { id: 'OPR_18', from: 'OP_CHONGQING_BASE', to: 'OP_GBA_CENTER', type: 'handoff', lod: 1 },
  { id: 'OPR_19', from: 'OP_WUHAN_CENTER', to: 'OP_SHANGHAI_PORT', type: 'handoff', lod: 0 },
  { id: 'OPR_20', from: 'OP_WUHAN_CENTER', to: 'OP_GBA_CENTER', type: 'capacity', lod: 0 },
  { id: 'OPR_21', from: 'OP_GBA_CENTER', to: 'OP_FOSHAN_FACTORY', type: 'order', lod: 2 },
  { id: 'OPR_22', from: 'OP_GBA_CENTER', to: 'OP_ZHANJIANG_PORT', type: 'handoff', lod: 1 },
  { id: 'OPR_23', from: 'OP_GBA_CENTER', to: 'OP_XIAMEN_PORT', type: 'capacity', lod: 1 },
  { id: 'OPR_24', from: 'OP_GBA_CENTER', to: 'OP_NANNING_CENTER', type: 'collaboration', lod: 1 },
  { id: 'OPR_25', from: 'OP_NANNING_CENTER', to: 'OP_KUNMING_CENTER', type: 'feedback', lod: 1 },
  { id: 'OPR_26', from: 'OP_NINGBO_PORT', to: 'OP_SHANGHAI_PORT', type: 'exception', lod: 1 },
  { id: 'OPR_27', from: 'OP_BOHAI_SHIPPING', to: 'OP_YINGKOU_PORT', type: 'capacity', lod: 2 },
  { id: 'OPR_28', from: 'OP_NORTHEAST_CENTER', to: 'OP_TIANJIN_HUB', type: 'handoff', lod: 0 },
  { id: 'OPR_29', from: 'OP_TIANJIN_HUB', to: 'OP_SHANGHAI_PORT', type: 'handoff', lod: 0 },
  { id: 'OPR_30', from: 'OP_URUMQI_CENTER', to: 'OP_ZHENGZHOU_CENTER', type: 'handoff', lod: 0 },
  { id: 'OPR_31', from: 'OP_CHENGDU_CENTER', to: 'OP_WUHAN_CENTER', type: 'handoff', lod: 0 },
  { id: 'OPR_32', from: 'OP_ZHENGZHOU_CENTER', to: 'OP_SHANGHAI_PORT', type: 'handoff', lod: 0 },
  { id: 'OPR_33', from: 'OP_QINGDAO_PORT', to: 'OP_GBA_CENTER', type: 'handoff', lod: 0 },
  { id: 'OPR_34', from: 'OP_KUNMING_CENTER', to: 'OP_GBA_CENTER', type: 'handoff', lod: 0 },
  { id: 'OPR_35', from: 'OP_XIAMEN_PORT', to: 'OP_SHANGHAI_PORT', type: 'handoff', lod: 1 },
].map((relation) => ({ ...relation, ...OPERATION_RELATION_PROFILES[relation.id] }));

export const operationDashboard = {
  index: { value: '96.7', grade: '优', delta: '+2.4', yoy: '+3.2%' },
  modes: [
    { id: 'overview', label: '综合态势' },
    { id: 'cargo', label: '货物流' },
    { id: 'tasks', label: '运输任务' },
    { id: 'multimodal', label: '多式联运' },
    { id: 'capacity', label: '运力' },
    { id: 'alerts', label: '异常' },
  ],
  modeBriefs: {
    overview: {
      kicker: 'NATIONAL OPERATION',
      title: '全国物流实时运行',
      description: '聚合货物流、运输任务、运力与异常，观察全国业务运行态势',
      stats: [['货物流向', '168 条'], ['在途任务', '18,763 单'], ['运行指数', '96.7']],
    },
    cargo: {
      kicker: 'CARGO FLOW',
      title: '货物流向与热度',
      description: '线路宽度表示货量，亮度表示活跃度，粒子速度表示当前运输速度',
      stats: [['今日货量', '1,245.3 万吨'], ['热门 OD', '东北 → 长三角'], ['同比', '+12.6%']],
    },
    tasks: {
      kicker: 'TRANSPORT TASK',
      title: '全国运输任务运行图',
      description: '聚焦待发、在途、换装与到达任务，可穿透查看完整运输组织链路',
      stats: [['待发', '1,286 单'], ['在途', '8,624 单'], ['待换装', '368 单']],
    },
    multimodal: {
      kicker: 'MULTIMODAL',
      title: '公铁水空联运衔接',
      description: '突出换装节点与分段线路，监测方式切换、衔接效率和等待时间',
      stats: [['联运任务', '6,842 单'], ['铁水联运', '2,816 单'], ['公铁联运', '2,134 单']],
    },
    capacity: {
      kicker: 'CAPACITY NETWORK',
      title: '全国运力协同',
      description: '联动车辆、班列、船舶与航空货班，识别待匹配需求和紧张区域',
      stats: [['匹配率', '92.6%'], ['在线车辆', '68,432 辆'], ['待匹配', '382 单']],
    },
    alerts: {
      kicker: 'OPERATION ALERT',
      title: '异常物流链影响分析',
      description: '正常线路已降噪，仅保留异常节点、受影响任务及推荐处置动作',
      stats: [['当前异常', '128 起'], ['运输延误', '48 起'], ['港口拥堵', '36 起']],
    },
  },
  metrics: [
    { id: 'cargo', icon: '↗', label: '货物流动', value: '1,245.3', unit: '万吨', note: '今日货运量', delta: '+12.6%', detail: '168 条活跃流向' },
    { id: 'tasks', icon: '▣', label: '运输任务', value: '18,763', unit: '单', note: '在途任务', delta: '+9.8%', detail: '待发 1,286 · 换装 368' },
    { id: 'multimodal', icon: '⌁', label: '多式联运', value: '6,842', unit: '单', note: '多式联运', delta: '+15.3%', detail: '铁水 2,816 · 公铁 2,134' },
    { id: 'capacity', icon: '◉', label: '运力协同', value: '92.6', unit: '%', note: '运力匹配率', delta: '+3.7%', detail: '待匹配需求 382 单' },
    { id: 'alerts', icon: '!', label: '运营异常', value: '128', unit: '起', note: '当前异常', delta: '-18.4%', detail: '延误 48 · 拥堵 36' },
  ],
  liveNetwork: { activeHubs: 568, relations: 12856, vehicles: 68432, onlineRate: '93.2%' },
  topHubs: [
    { name: '上海', volume: '312.8 万吨', score: 98 }, { name: '郑州', volume: '186.3 万吨', score: 96 },
    { name: '广州', volume: '198.4 万吨', score: 94 }, { name: '武汉', volume: '168.4 万吨', score: 93 },
    { name: '沈阳', volume: '245.6 万吨', score: 92 }, { name: '成都', volume: '160.7 万吨', score: 88 },
    { name: '天津', volume: '142.5 万吨', score: 84 }, { name: '重庆', volume: '138.2 万吨', score: 81 },
  ],
  hotFlows: [
    { from: '黑龙江', to: '广东', volume: '125.3 万吨', score: 100 }, { from: '辽宁', to: '广东', volume: '98.7 万吨', score: 79 },
    { from: '内蒙古', to: '浙江', volume: '86.4 万吨', score: 69 }, { from: '山东', to: '江苏', volume: '72.1 万吨', score: 58 },
    { from: '重庆', to: '上海', volume: '58.6 万吨', score: 47 }, { from: '河南', to: '广东', volume: '52.4 万吨', score: 42 },
    { from: '四川', to: '上海', volume: '46.8 万吨', score: 37 }, { from: '山西', to: '河北', volume: '41.2 万吨', score: 33 },
  ],
  activeHubs: [
    { name: '上海', grade: 'Ⅰ级', tasks: '1,245', load: '1.32' },
    { name: '郑州', grade: 'Ⅰ级', tasks: '986', load: '1.18' },
    { name: '武汉', grade: 'Ⅰ级', tasks: '854', load: '1.05' },
    { name: '广州', grade: 'Ⅰ级', tasks: '921', load: '1.20' },
    { name: '成都', grade: 'Ⅱ级', tasks: '623', load: '0.86' },
  ],
  activeAlert: {
    route: '宁波舟山港 → 上海港', type: '船期衔接异常', level: '橙色预警',
    detail: '预计延误 42 分钟 · 影响 18 项在途任务', action: '已启动备用泊位与到港顺序调整',
  },
  alertBreakdown: [
    { label: '延误', panelLabel: '运输延误', value: 48 },
    { label: '拥堵', panelLabel: '港口拥堵', value: 36 },
    { label: '运力不足', panelLabel: '运力不足', value: 28 },
    { label: '换装', panelLabel: '换装异常', value: 16 },
  ],
  mapOverlays: {
    hubs: [
      { id: 'OP_NORTHEAST_CENTER', name: '沈阳', anchor: 'right', volume: '245.6万吨', tasks: '3,256单' },
      { id: 'OP_ZHENGZHOU_CENTER', name: '郑州', anchor: 'left', volume: '186.3万吨', tasks: '2,189单' },
      { id: 'OP_CHONGQING_BASE', name: '重庆', anchor: 'left', volume: '160.7万吨', tasks: '2,012单' },
      { id: 'OP_WUHAN_CENTER', name: '武汉', anchor: 'right', volume: '168.4万吨', tasks: '1,854单' },
      { id: 'OP_SHANGHAI_PORT', name: '上海', anchor: 'right', volume: '312.8万吨', tasks: '4,287单' },
      { id: 'OP_GBA_CENTER', name: '广州', anchor: 'right', volume: '198.4万吨', tasks: '2,451单' },
    ],
  },
  tasks: [
    {
      id: 'OP_TASK_GRAIN_SOUTH', code: 'HLJ-20260813-038', name: '北粮南运',
      route: '哈尔滨 → 广州', status: '运输中', progress: 72, eta: '2025-05-18',
      cargo: '粮食', mode: '铁路 + 水运', relationIds: ['OPR_07', 'OPR_08', 'OPR_09', 'OPR_10', 'OPR_11'],
      nodes: ['东北区域运营中心', '吉林粮源组织节点', '营口港集疏运中心', '青岛港运营节点', '上海港运营节点', '粤港澳大湾区运营中心'],
      metrics: [{ label: '货物', value: '粮食' }, { label: '进度', value: '72%' }, { label: '预计到达', value: '2025-05-18' }, { label: '准点率', value: '97.2%' }],
    },
    {
      id: 'OP_TASK_AUTO_EXPORT', code: 'CQ-20260813-028', name: '重庆整车出口运输任务', route: '重庆 → 武汉 → 上海港', status: '执行中', progress: 68, eta: '08-14 14:35',
      cargo: '整车 382 辆', mode: '公铁水联运', relationIds: ['OPR_16', 'OPR_17', 'OPR_19'],
      nodes: ['重庆汽车产业货主节点', '重庆整车集散基地', '长江中游运营中心', '上海港运营节点'],
      metrics: [{ label: '任务', value: '126 单' }, { label: '在途', value: '89 单' }, { label: '待装船', value: '18 单' }, { label: '准点率', value: '96.8%' }],
    },
  ],
  ticker: [
    { id: 'index', label: '运行指数', value: '96.7 [优]' },
    { id: 'cargo', label: '今日货运量', value: '1,245.3万吨' },
    { id: 'tasks', label: '在途任务', value: '18,763单' },
    { id: 'multimodal', label: '多式联运', value: '6,842单' },
    { id: 'capacity', label: '运力匹配率', value: '92.6%' },
    { id: 'ontime', label: '准点率', value: '89.3%' },
    { id: 'alerts', label: '异常', value: '128起' },
  ],
};

const parseOperationVolume = (value) => {
  const text = String(value ?? '0');
  const amount = Number(text.replace(/[^\d.]/g, '')) || 0;
  return /辆/.test(text) ? amount * 0.0024 : amount;
};

const formatOperationInt = (value) => Math.round(Number(value) || 0).toLocaleString('zh-CN');

const formatOperationDecimal = (value, digits = 1) => (
  Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
);

const shortOperationHubName = (name) => String(name ?? '')
  .replace('粤港澳大湾区运营中心', '广州')
  .replace('长江中游运营中心', '武汉')
  .replace('中原区域运营中心', '郑州')
  .replace('东北区域运营中心', '沈阳')
  .replace('西南区域运营中心', '成都')
  .replace('西北区域运营中心', '乌鲁木齐')
  .replace('重庆整车集散基地', '重庆')
  .replace('上海港运营节点', '上海')
  .replace(/运营中心|运营节点|集疏运中心|集散基地|货主节点|承运节点/g, '');

const provinceMix = (province, min, max, salt = 0) => {
  const seed = [...String(province)].reduce((acc, ch) => (acc * 33 + ch.charCodeAt(0)) % 10007, 7);
  return min + (((seed * 17 + salt * 91) % 1000) / 1000) * (max - min);
};

const displayCityName = (name) => String(name ?? '').replace(/市$/u, '');

const shortAdminName = (name) => String(name ?? '')
  .replace(/土家族苗族自治县$/u, '')
  .replace(/苗族土家族自治县$/u, '')
  .replace(/土家族苗族自治州$/u, '州')
  .replace(/苗族土家族自治州$/u, '州')
  .replace(/朝鲜族自治州$/u, '州')
  .replace(/蒙古族藏族自治州$/u, '州')
  .replace(/藏族自治州$/u, '州')
  .replace(/回族自治州$/u, '州')
  .replace(/彝族自治州$/u, '州')
  .replace(/自治州$/u, '州')
  .replace(/地区$/u, '')
  .replace(/市$/u, '');

const isPrefectureUnit = (name) => /(?:市|州|盟|地区)$/u.test(String(name ?? ''));

const sampleSurroundingCities = (records, origin, limit = 8) => {
  const ranked = records
    .filter((city) => Array.isArray(city.center) && city.center.length >= 2)
    .map((city) => ({
      ...city,
      angle: Math.atan2(city.center[1] - origin[1], city.center[0] - origin[0]),
      dist: Math.hypot(city.center[0] - origin[0], city.center[1] - origin[1]),
    }))
    .sort((left, right) => left.angle - right.angle);
  if (ranked.length <= limit) return ranked;
  const step = ranked.length / limit;
  const picked = [];
  for (let index = 0; index < limit; index += 1) picked.push(ranked[Math.min(ranked.length - 1, Math.round(index * step))]);
  const farthest = [...ranked].sort((left, right) => right.dist - left.dist)[0];
  if (farthest && !picked.some((city) => city.name === farthest.name)) picked[picked.length - 1] = farthest;
  return picked;
};

const cityPairKey = (fromId, toId) => [fromId, toId].sort().join('→');

const cityDistance = (from, to) => {
  if (!Array.isArray(from.center) || from.center.length < 2 || !Array.isArray(to.center) || to.center.length < 2) {
    return 80;
  }
  return Math.hypot(from.center[0] - to.center[0], from.center[1] - to.center[1]);
};

const PORT_CITY_HINT = /港|青岛|大连|宁波|厦门|上海|天津|广州|深圳|烟台|日照|营口|福州|湛江|北海|连云港|舟山|秦皇岛|威海/;

const isPortCity = (city) => PORT_CITY_HINT.test(city?.name ?? '') || PORT_CITY_HINT.test(city?.fullName ?? '');

const pickSandboxMode = (from, to, grade, index) => {
  if (grade === 'trunk' && (isPortCity(from) || isPortCity(to))) return index % 2 ? 'water' : 'multimodal';
  if (grade === 'trunk') return index % 3 === 1 ? 'rail' : 'road';
  if (grade === 'regional' && (isPortCity(from) || isPortCity(to))) return 'water';
  if (grade === 'regional' && index % 4 === 2) return 'rail';
  if (grade === 'feeder' && index % 11 === 0 && cityDistance(from, to) > 3.2) return 'air';
  return 'road';
};

const buildMinimumSpanningLinks = (cities) => {
  if (cities.length < 2) return [];
  const remaining = new Set(cities.slice(1).map((city) => city.id));
  const inTree = [cities[0]];
  const links = [];
  while (remaining.size) {
    let best = null;
    inTree.forEach((from) => {
      cities.forEach((to) => {
        if (!remaining.has(to.id)) return;
        const distance = cityDistance(from, to);
        if (!best || distance < best.distance) best = { from, to, distance };
      });
    });
    if (!best) break;
    links.push(best);
    remaining.delete(best.to.id);
    inTree.push(best.to);
  }
  return links;
};

const buildProvincialCityNetwork = (province, summary, cargo) => {
  const records = (summary.cityRecords ?? []).filter((city) => Array.isArray(city.center) && city.center.length >= 2);
  const named = records.length
    ? records
    : (summary.cities ?? []).map((city) => ({ name: typeof city === 'string' ? city : city.name, center: null }));
  const municipal = named.filter((city) => /市$/u.test(city.name));
  const selected = municipal.length >= 2 ? municipal : named;
  const capitalName = {
    山东: '济南', 广东: '广州', 江苏: '南京', 浙江: '杭州', 河南: '郑州', 湖北: '武汉',
    湖南: '长沙', 四川: '成都', 陕西: '西安', 辽宁: '沈阳', 吉林: '长春', 黑龙江: '哈尔滨',
    河北: '石家庄', 山西: '太原', 安徽: '合肥', 福建: '福州', 江西: '南昌', 广西: '南宁',
    云南: '昆明', 贵州: '贵阳', 甘肃: '兰州', 青海: '西宁', 宁夏: '银川', 新疆: '乌鲁木齐',
    内蒙古: '呼和浩特', 西藏: '拉萨', 海南: '海口', 重庆: '重庆', 北京: '北京', 上海: '上海', 天津: '天津',
  }[province];
  const capitalRecord = selected.find((city) => displayCityName(city.name) === capitalName) ?? selected[0];
  const drafted = selected.map((city, index) => {
    const isCapital = city === capitalRecord;
    const port = PORT_CITY_HINT.test(displayCityName(city.name)) || PORT_CITY_HINT.test(city.name);
    const share = isCapital ? 0.24 : port ? 0.16 : Math.max(0.045, 0.14 - index * 0.01);
    return {
      id: `CITY_${province}_${city.name}`,
      name: displayCityName(city.name),
      fullName: city.name,
      center: city.center,
      volume: `${(cargo * share).toFixed(1)}万吨`,
      volumeValue: cargo * share,
      tasks: `${Math.round(cargo * share * 18).toLocaleString('zh-CN')}单`,
      taskValue: Math.round(cargo * share * 18),
      capital: isCapital,
      port,
      hubCount: 0,
    };
  });
  const ranked = [...drafted].sort((left, right) => (
    Number(right.capital) - Number(left.capital)
    || Number(right.port) - Number(left.port)
    || right.volumeValue - left.volumeValue
  ));
  const cities = drafted.map((city) => {
    const rank = ranked.findIndex((item) => item.id === city.id);
    const tier = city.capital || city.port || rank === 0 ? 1 : rank <= Math.max(2, Math.floor(drafted.length * 0.28)) ? 2 : 3;
    return { ...city, tier };
  });
  const capitalCity = cities.find((city) => city.capital) ?? cities[0];
  const flows = [];
  const used = new Set();
  const pushFlow = (from, to, { volume, mode, score, grade, active = false, focus = false, alert = false }) => {
    if (!from || !to || from.id === to.id) return null;
    const key = cityPairKey(from.id, to.id);
    if (used.has(key)) return null;
    used.add(key);
    const item = {
      id: `CITYFLOW_${province}_${flows.length}`,
      fromId: from.id,
      toId: to.id,
      from: from.name,
      to: to.name,
      mode,
      volume: `${volume.toFixed(1)}万吨`,
      volumeValue: volume,
      score,
      grade,
      trunk: grade === 'trunk',
      active,
      focus,
      alert,
      status: alert ? '延误' : focus ? '运输中' : active ? '运行中' : '平稳',
    };
    flows.push(item);
    return item;
  };

  const hubs = cities.filter((city) => city.tier === 1);
  hubs.forEach((hub, index) => {
    if (!capitalCity || hub.id === capitalCity.id) return;
    pushFlow(capitalCity, hub, {
      volume: cargo * Math.max(0.08, 0.18 - index * 0.02),
      mode: pickSandboxMode(capitalCity, hub, 'trunk', index),
      score: 100 - index * 3,
      grade: 'trunk',
      active: true,
      focus: index === 0,
    });
  });
  const secondary = cities.filter((city) => city.tier === 2).slice(0, 2);
  secondary.forEach((city, index) => {
    const from = hubs[index % Math.max(1, hubs.length)] ?? capitalCity;
    pushFlow(from, city, {
      volume: cargo * 0.07,
      mode: pickSandboxMode(from, city, 'trunk', index + 3),
      score: 84 - index * 4,
      grade: 'trunk',
      active: index === 0,
    });
  });

  const treeStart = capitalCity ?? cities[0];
  const treeCities = [treeStart, ...cities.filter((city) => city.id !== treeStart.id)];
  buildMinimumSpanningLinks(treeCities).forEach((link, index) => {
    pushFlow(link.from, link.to, {
      volume: cargo * 0.05,
      mode: pickSandboxMode(link.from, link.to, 'regional', index),
      score: 70 - index,
      grade: 'regional',
      active: index < 2,
    });
  });

  cities.forEach((city, index) => {
    const neighbors = cities
      .filter((other) => other.id !== city.id)
      .sort((left, right) => cityDistance(city, left) - cityDistance(city, right))
      .slice(0, city.tier === 3 ? 1 : 2);
    neighbors.forEach((neighbor, neighborIndex) => {
      pushFlow(city, neighbor, {
        volume: cargo * 0.028,
        mode: pickSandboxMode(city, neighbor, 'feeder', index + neighborIndex),
        score: 54 - index,
        grade: 'feeder',
      });
    });
  });

  const alertCity = [...cities].reverse().find((city) => city.tier === 3) ?? cities[cities.length - 1];
  const alertFlow = flows.find((flow) => flow.grade === 'feeder' && (flow.fromId === alertCity?.id || flow.toId === alertCity?.id));
  if (alertFlow) {
    alertFlow.alert = true;
    alertFlow.status = '延误';
    alertFlow.score = 40;
  }
  if (alertCity) alertCity.alert = true;
  cities.forEach((city) => {
    city.hubCount = flows.filter((flow) => flow.fromId === city.id || flow.toId === city.id).length;
  });
  const focusFlow = flows.find((flow) => flow.focus) ?? flows[0];
  return { cities, flows, capitalId: capitalCity?.id, focusFlowId: focusFlow?.id, alertCityId: alertCity?.id };
};

export const buildProvinceOperationDashboard = (summary = {}, data = {}) => {
  const province = summary.province ?? '本省';
  const nodes = (data.operationNodes ?? operationNetworkNodes).filter((node) => node.province === province);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const relations = (data.operationRelations ?? operationNetworkRelations)
    .filter((relation) => nodeIds.has(relation.from) || nodeIds.has(relation.to));
  const national = data.operationDashboard ?? operationDashboard;
  const cityCount = Math.max(1, Number(summary.cityCount) || 8);
  const intensity = cityCount * 0.9 + Number(summary.nationalHubs ?? 0) * 7 + Number(summary.logisticsParks ?? 0) * 0.35;
  const cargoFromNodes = nodes.reduce((sum, node) => sum + parseOperationVolume(node.operation?.throughput), 0);
  const tasksFromNodes = nodes.reduce((sum, node) => sum + Number(node.operation?.tasks ?? 0), 0);
  const cargo = cargoFromNodes > 0 ? cargoFromNodes : intensity * provinceMix(province, 1.05, 1.55, 3);
  const tasks = tasksFromNodes > 0 ? tasksFromNodes : Math.round(intensity * provinceMix(province, 14, 26, 5));
  const multimodal = Math.max(1, Math.round(tasks * provinceMix(province, 0.28, 0.42, 8)));
  const capacity = provinceMix(province, 88.4, 96.6, 11);
  const alerts = Math.max(2, Math.round(provinceMix(province, 4, 16, 13) + (relations.some((relation) => relation.type === 'exception') ? 8 : 0)));
  const activity = nodes.length
    ? nodes.reduce((sum, node) => sum + Number(node.operation?.activity ?? 80), 0) / nodes.length
    : provinceMix(province, 86, 96, 2);
  const indexValue = (88 + activity * 0.1).toFixed(1);
  const grade = Number(indexValue) >= 95 ? '优' : Number(indexValue) >= 90 ? '良' : '中';
  const delay = Math.round(alerts * 0.38);
  const congestion = Math.round(alerts * 0.28);
  const shortage = Math.round(alerts * 0.22);
  const transfer = Math.max(1, alerts - delay - congestion - shortage);
  const cityNetwork = buildProvincialCityNetwork(province, summary, cargo);
  const hotFlows = cityNetwork.flows.slice(0, 8).map((flow) => ({
    from: flow.from,
    to: flow.to,
    volume: `${flow.volumeValue.toFixed(1)} 万吨`,
    score: flow.score,
  }));
  const topHubs = cityNetwork.cities.slice(0, 8).map((city, _, list) => ({
    name: city.name,
    volume: `${city.volumeValue.toFixed(1)} 万吨`,
    score: Math.round(100 * (city.taskValue / Math.max(1, list[0]?.taskValue ?? 1))),
  }));
  const leadingFlow = hotFlows[0];
  return {
    scope: province,
    indexLabel: `${province}物流运行指数`,
    rankingTitle: `${province}物流运行 TOP`,
    index: {
      value: indexValue,
      grade,
      delta: `+${provinceMix(province, 0.8, 3.2, 19).toFixed(1)}`,
      yoy: `+${provinceMix(province, 1.6, 4.8, 21).toFixed(1)}%`,
    },
    modes: national.modes,
    modeBriefs: {
      overview: {
        kicker: 'PROVINCIAL OPERATION',
        title: `${province}物流实时运行`,
        description: `聚合${province}货物流、运输任务、运力与异常`,
        stats: [['货物流向', `${Math.max(relations.length, hotFlows.length)} 条`], ['在途任务', `${formatOperationInt(tasks)} 单`], ['运行指数', indexValue]],
      },
      cargo: {
        kicker: 'CARGO FLOW',
        title: `${province}货物流向与热度`,
        description: `观察进出${province}的主要货物流向、货量与活跃度`,
        stats: [['今日货量', `${formatOperationDecimal(cargo)} 万吨`], ['热门 OD', leadingFlow ? `${leadingFlow.from} → ${leadingFlow.to}` : `${province}骨干`], ['同比', `+${provinceMix(province, 6.2, 14.8, 23).toFixed(1)}%`]],
      },
      tasks: {
        kicker: 'TRANSPORT TASK',
        title: `${province}运输任务运行图`,
        description: `聚焦${province}待发、在途、换装与到达任务`,
        stats: [['待发', `${formatOperationInt(tasks * 0.08)} 单`], ['在途', `${formatOperationInt(tasks)} 单`], ['待换装', `${formatOperationInt(tasks * 0.03)} 单`]],
      },
      multimodal: {
        kicker: 'MULTIMODAL',
        title: `${province}公铁水空衔接`,
        description: `监测${province}换装节点与分段线路衔接效率`,
        stats: [['联运任务', `${formatOperationInt(multimodal)} 单`], ['铁水联运', `${formatOperationInt(multimodal * 0.41)} 单`], ['公铁联运', `${formatOperationInt(multimodal * 0.32)} 单`]],
      },
      capacity: {
        kicker: 'CAPACITY NETWORK',
        title: `${province}运力协同`,
        description: `联动${province}车辆、班列、船舶与航空货班`,
        stats: [['匹配率', `${capacity.toFixed(1)}%`], ['在线车辆', `${formatOperationInt(provinceMix(province, 1800, 9600, 27) * (cityCount / 12))} 辆`], ['待匹配', `${formatOperationInt(provinceMix(province, 18, 86, 31))} 单`]],
      },
      alerts: {
        kicker: 'OPERATION ALERT',
        title: `${province}异常物流链`,
        description: `仅保留${province}异常节点、受影响任务及处置动作`,
        stats: [['当前异常', `${alerts} 起`], ['运输延误', `${delay} 起`], ['港口拥堵', `${congestion} 起`]],
      },
    },
    metrics: [
      { id: 'cargo', icon: '↗', label: '货物流动', value: formatOperationDecimal(cargo), unit: '万吨', note: '今日货运量', delta: `+${provinceMix(province, 6.2, 14.8, 23).toFixed(1)}%`, detail: `${Math.max(relations.length, 8)} 条活跃流向` },
      { id: 'tasks', icon: '▣', label: '运输任务', value: formatOperationInt(tasks), unit: '单', note: '在途任务', delta: `+${provinceMix(province, 4.8, 12.6, 25).toFixed(1)}%`, detail: `待发 ${formatOperationInt(tasks * 0.08)} · 换装 ${formatOperationInt(tasks * 0.03)}` },
      { id: 'multimodal', icon: '⌁', label: '多式联运', value: formatOperationInt(multimodal), unit: '单', note: '多式联运', delta: `+${provinceMix(province, 8.1, 16.4, 26).toFixed(1)}%`, detail: `铁水 ${formatOperationInt(multimodal * 0.41)} · 公铁 ${formatOperationInt(multimodal * 0.32)}` },
      { id: 'capacity', icon: '◉', label: '运力协同', value: capacity.toFixed(1), unit: '%', note: '运力匹配率', delta: `+${provinceMix(province, 1.4, 4.2, 28).toFixed(1)}%`, detail: `待匹配 ${formatOperationInt(provinceMix(province, 18, 86, 31))} 单` },
      { id: 'alerts', icon: '!', label: '运营异常', value: String(alerts), unit: '起', note: '当前异常', delta: `-${provinceMix(province, 6.4, 18.8, 33).toFixed(1)}%`, detail: `延误 ${delay} · 拥堵 ${congestion}` },
    ],
    liveNetwork: {
      activeHubs: Math.max(cityNetwork.cities.length, Number(summary.nationalHubs) || Math.round(cityCount * 0.55)),
      relations: Math.max(cityNetwork.flows.length, Math.round(cityCount * 4)),
      vehicles: Math.round(provinceMix(province, 1800, 9600, 27) * (cityCount / 12)),
      onlineRate: `${provinceMix(province, 90.2, 96.8, 29).toFixed(1)}%`,
    },
    cityNetwork,
    topHubs,
    hotFlows,
    activeAlert: {
      route: leadingFlow ? `${leadingFlow.from} → ${leadingFlow.to}` : `${province}骨干通道`,
      type: alerts > 12 ? '运行拥堵' : '运行波动',
      level: alerts > 12 ? '橙色预警' : '蓝色提示',
      detail: `当前 ${alerts} 起异常正在处置 · 覆盖 ${cityCount} 个地市`,
      action: `已同步${province}省级调度与应急运力`,
    },
    alertBreakdown: [
      { label: '延误', panelLabel: '运输延误', value: delay },
      { label: '拥堵', panelLabel: '港口拥堵', value: congestion },
      { label: '运力不足', panelLabel: '运力不足', value: shortage },
      { label: '换装', panelLabel: '换装异常', value: transfer },
    ],
    mapOverlays: {
      hubs: cityNetwork.cities.filter((_, index, list) => (
        index === 0 || index === 1 || index === Math.min(list.length - 1, 4)
      )).slice(0, 3).map((city, index) => ({
        id: city.id,
        name: city.name,
        anchor: index % 2 ? 'left' : 'right',
        volume: city.volume,
        tasks: city.tasks,
      })),
    },
    tasks: [{
      id: `OP_TASK_PROVINCE_${province}`,
      code: `${province}-LIVE`,
      name: leadingFlow ? `${leadingFlow.from} → ${leadingFlow.to}` : `${province}重点运输任务`,
      route: leadingFlow ? `${leadingFlow.from} → ${leadingFlow.to}` : `${province}骨干通道`,
      status: '运输中',
      progress: Math.round(provinceMix(province, 58, 86, 37)),
      eta: '当日 18:30',
      cargo: '综合货运',
      mode: '公路 + 铁路',
      relationIds: cityNetwork.flows.slice(0, 3).map((flow) => flow.id),
      nodes: cityNetwork.cities.slice(0, 4).map((city) => city.fullName),
      metrics: [
        { label: '货物', value: leadingFlow?.volume ?? '综合货运' },
        { label: '进度', value: `${Math.round(provinceMix(province, 58, 86, 37))}%` },
        { label: '在途', value: `${formatOperationInt(tasks)} 单` },
        { label: '准点率', value: `${provinceMix(province, 88.6, 97.2, 41).toFixed(1)}%` },
      ],
    }],
    ticker: [
      { id: 'index', label: '运行指数', value: `${indexValue} [${grade}]` },
      { id: 'cargo', label: '今日货运量', value: `${formatOperationDecimal(cargo)}万吨` },
      { id: 'tasks', label: '在途任务', value: `${formatOperationInt(tasks)}单` },
      { id: 'multimodal', label: '多式联运', value: `${formatOperationInt(multimodal)}单` },
      { id: 'capacity', label: '运力匹配率', value: `${capacity.toFixed(1)}%` },
      { id: 'ontime', label: '准点率', value: `${provinceMix(province, 86.4, 94.8, 43).toFixed(1)}%` },
      { id: 'alerts', label: '异常', value: `${alerts}起` },
    ],
  };
};

export const digitalNetworkNodes = [
  makeNetworkEntity({ id: 'DIG_NATIONAL_PLATFORM', name: '国家物流大数据平台', province: '上海', longitude: 121.47, latitude: 31.23, layer: 'digital', role: 'platform', lod: 0, digital: { entities: 2856, systems: 568, resources: 12856, serviceCalls: '12.8万', shares: '18.6万' } }),
  makeNetworkEntity({ id: 'DIG_TRUSTED_SPACE', name: '物流数据共享中心', province: '上海', longitude: 121.55, latitude: 31.30, layer: 'digital', role: 'trusted-space', lod: 0, digital: { entities: 328, systems: 96, resources: 2368, serviceCalls: '8.6万', shares: '18.6万' } }),
  makeNetworkEntity({ id: 'DIG_NORTHEAST_PLATFORM', name: '东北物流平台', province: '辽宁', longitude: 123.43, latitude: 41.80, layer: 'digital', role: 'platform', lod: 0, digital: { entities: 286, systems: 86, resources: 1126, serviceCalls: '3.8万', shares: '1.6万' } }),
  makeNetworkEntity({ id: 'DIG_CENTRAL_PLATFORM', name: '中原物流平台', province: '河南', longitude: 113.62, latitude: 34.75, layer: 'digital', role: 'platform', lod: 0, digital: { entities: 428, systems: 108, resources: 1686, serviceCalls: '5.2万', shares: '2.8万' } }),
  makeNetworkEntity({ id: 'DIG_WEST_PLATFORM', name: '西南物流平台', province: '四川', longitude: 104.06, latitude: 30.67, layer: 'digital', role: 'platform', lod: 0 }),
  makeNetworkEntity({ id: 'DIG_YANGTZE_PLATFORM', name: '华东物流平台', province: '江苏', longitude: 118.78, latitude: 32.06, layer: 'digital', role: 'platform', lod: 0, digital: { entities: 586, systems: 126, resources: 2368, serviceCalls: '18.6万', shares: '3.2万' } }),
  makeNetworkEntity({ id: 'DIG_GBA_PLATFORM', name: '大湾区物流平台', province: '广东', longitude: 113.26, latitude: 23.13, layer: 'digital', role: 'platform', lod: 0 }),
  makeNetworkEntity({ id: 'DIG_NORTHWEST_PLATFORM', name: '西北物流平台', province: '陕西', longitude: 108.94, latitude: 34.34, layer: 'digital', role: 'platform', lod: 0 }),
  makeNetworkEntity({ id: 'DIG_JILIN_ERP', name: '东北物流企业接入群', province: '吉林', longitude: 124.82, latitude: 45.14, layer: 'digital', role: 'access', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_CHONGQING_MES', name: '西南货主企业接入群', province: '重庆', longitude: 105.95, latitude: 29.30, layer: 'digital', role: 'access', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_RAIL_DATA', name: '铁路运输动态数据', province: '河南', longitude: 112.30, latitude: 35.20, layer: 'digital', role: 'data', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_ROAD_DATA', name: '公路运输动态数据', province: '湖北', longitude: 115.20, latitude: 31.10, layer: 'digital', role: 'data', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_PORT_DATA', name: '港口作业动态数据', province: '上海', longitude: 120.80, latitude: 30.75, layer: 'digital', role: 'data', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_AIS_DATA', name: '水运物流动态数据', province: '浙江', longitude: 122.20, latitude: 29.55, layer: 'digital', role: 'data', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_WEATHER_DATA', name: '公共气象服务数据', province: '北京', longitude: 115.10, latitude: 40.45, layer: 'digital', role: 'data', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_WAYBILL_SERVICE', name: '物流状态查询服务', province: '河南', longitude: 114.45, latitude: 33.95, layer: 'digital', role: 'service', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_ETA_SERVICE', name: '路径与时效分析服务', province: '湖北', longitude: 113.50, latitude: 29.95, layer: 'digital', role: 'service', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_CONTRACT_SERVICE', name: '数据共享服务', province: '浙江', longitude: 120.15, latitude: 30.28, layer: 'digital', role: 'service', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_SETTLEMENT_SERVICE', name: '运费结算服务', province: '广东', longitude: 114.05, latitude: 22.55, layer: 'digital', role: 'service', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_CUSTOMS_SERVICE', name: '口岸通关服务', province: '上海', longitude: 122.05, latitude: 31.00, layer: 'digital', role: 'service', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_EVENT_BUS', name: '物流动态数据网络', province: '湖南', longitude: 112.94, latitude: 28.23, layer: 'digital', role: 'event', lod: 0 }),
  makeNetworkEntity({ id: 'DIG_DISPATCH_AGENT', name: '智能物流服务中心', province: '湖北', longitude: 114.45, latitude: 30.25, layer: 'digital', role: 'agent', lod: 0 }),
  makeNetworkEntity({ id: 'DIG_EXCEPTION_AGENT', name: '运输异常预警服务', province: '重庆', longitude: 107.10, latitude: 30.20, layer: 'digital', role: 'agent', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_NORTH_PLATFORM', name: '华北物流平台', province: '北京', longitude: 116.40, latitude: 39.90, layer: 'digital', role: 'platform', lod: 0, digital: { entities: 486, systems: 112, resources: 1968, serviceCalls: '9.6万', shares: '2.6万' } }),
  makeNetworkEntity({ id: 'DIG_SHANDONG_PLATFORM', name: '山东物流平台', province: '山东', longitude: 117.00, latitude: 36.65, layer: 'digital', role: 'platform', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_HUBEI_PLATFORM', name: '长江中游物流平台', province: '湖北', longitude: 114.05, latitude: 31.35, layer: 'digital', role: 'platform', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_FUJIAN_PLATFORM', name: '东南沿海物流平台', province: '福建', longitude: 119.30, latitude: 26.08, layer: 'digital', role: 'platform', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_YUNNAN_PLATFORM', name: '面向南亚物流平台', province: '云南', longitude: 102.71, latitude: 25.04, layer: 'digital', role: 'platform', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_XINJIANG_PLATFORM', name: '西部通道物流平台', province: '新疆', longitude: 87.62, latitude: 43.82, layer: 'digital', role: 'platform', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_HEBEI_ACCESS', name: '华北物流企业接入群', province: '河北', longitude: 114.50, latitude: 38.05, layer: 'digital', role: 'access', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_ZHEJIANG_ACCESS', name: '华东货主企业接入群', province: '浙江', longitude: 120.62, latitude: 29.98, layer: 'digital', role: 'access', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_GUANGXI_ACCESS', name: '西部陆海企业接入群', province: '广西', longitude: 108.32, latitude: 22.82, layer: 'digital', role: 'access', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_SHANDONG_ACCESS', name: '山东产业企业接入群', province: '山东', longitude: 118.35, latitude: 36.90, layer: 'digital', role: 'access', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_SHANXI_ACCESS', name: '能源物流企业接入群', province: '山西', longitude: 112.55, latitude: 37.87, layer: 'digital', role: 'access', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_JIANGXI_ACCESS', name: '中部物流企业接入群', province: '江西', longitude: 115.89, latitude: 28.68, layer: 'digital', role: 'access', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_AIR_DATA', name: '航空物流动态数据', province: '广东', longitude: 113.30, latitude: 23.39, layer: 'digital', role: 'data', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_WAREHOUSE_DATA', name: '仓储作业动态数据', province: '江苏', longitude: 119.30, latitude: 32.40, layer: 'digital', role: 'data', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_COLDCHAIN_DATA', name: '冷链温控动态数据', province: '山东', longitude: 119.10, latitude: 35.40, layer: 'digital', role: 'data', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_CAPACITY_SERVICE', name: '运力资源查询服务', province: '河北', longitude: 115.60, latitude: 39.10, layer: 'digital', role: 'service', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_TRACE_SERVICE', name: '物流溯源查询服务', province: '福建', longitude: 118.10, latitude: 25.60, layer: 'digital', role: 'service', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_CARBON_SERVICE', name: '碳排放测算服务', province: '湖南', longitude: 113.10, latitude: 27.20, layer: 'digital', role: 'service', lod: 2 }),
  makeNetworkEntity({ id: 'DIG_ROUTE_AGENT', name: '路径优化智能服务', province: '陕西', longitude: 109.50, latitude: 33.60, layer: 'digital', role: 'agent', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_ANHUI_PLATFORM', name: '安徽省物流平台', province: '安徽', longitude: 117.28, latitude: 31.86, layer: 'digital', role: 'platform', lod: 1, digital: { entities: 268, systems: 72, resources: 1086, serviceCalls: '4.6万', shares: '1.8万' } }),
  makeNetworkEntity({ id: 'DIG_GUIZHOU_PLATFORM', name: '贵州省物流平台', province: '贵州', longitude: 106.63, latitude: 26.65, layer: 'digital', role: 'platform', lod: 1, digital: { entities: 196, systems: 58, resources: 862, serviceCalls: '3.2万', shares: '1.2万' } }),
  makeNetworkEntity({ id: 'DIG_CHONGQING_GATEWAY', name: '重庆通道运营节点', province: '重庆', longitude: 106.55, latitude: 29.57, layer: 'digital', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_BEIBU_PORT', name: '北部湾港运营节点', province: '广西', longitude: 108.62, latitude: 21.95, layer: 'digital', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_HARBIN_GATEWAY', name: '哈尔滨通道运营节点', province: '黑龙江', longitude: 126.53, latitude: 45.80, layer: 'digital', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_CHANGCHUN_GATEWAY', name: '长春通道运营节点', province: '吉林', longitude: 125.32, latitude: 43.82, layer: 'digital', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_DALIAN_PORT', name: '大连港运营节点', province: '辽宁', longitude: 121.62, latitude: 38.92, layer: 'digital', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_LIANYUNGANG_PORT', name: '连云港运营节点', province: '江苏', longitude: 119.22, latitude: 34.60, layer: 'digital', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_LANZHOU_GATEWAY', name: '兰州通道运营节点', province: '甘肃', longitude: 103.83, latitude: 36.06, layer: 'digital', role: 'operator', lod: 1 }),
  makeNetworkEntity({ id: 'DIG_ALASHANKOU_GATEWAY', name: '阿拉山口口岸节点', province: '新疆', longitude: 82.57, latitude: 45.17, layer: 'digital', role: 'operator', lod: 1 }),
];

export const digitalNetworkRelations = [
  { id: 'DGR_01', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_TRUSTED_SPACE', type: 'authorization', lod: 0 },
  { id: 'DGR_02', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_NORTHEAST_PLATFORM', type: 'api', lod: 0 },
  { id: 'DGR_03', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_CENTRAL_PLATFORM', type: 'api', lod: 0 },
  { id: 'DGR_04', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_WEST_PLATFORM', type: 'api', lod: 0 },
  { id: 'DGR_05', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_YANGTZE_PLATFORM', type: 'api', lod: 0 },
  { id: 'DGR_06', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_GBA_PLATFORM', type: 'api', lod: 0 },
  { id: 'DGR_07', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_NORTHWEST_PLATFORM', type: 'api', lod: 0 },
  { id: 'DGR_08', from: 'DIG_NORTHEAST_PLATFORM', to: 'DIG_JILIN_ERP', type: 'access', lod: 2 },
  { id: 'DGR_09', from: 'DIG_CENTRAL_PLATFORM', to: 'DIG_RAIL_DATA', type: 'access', lod: 1 },
  { id: 'DGR_10', from: 'DIG_CENTRAL_PLATFORM', to: 'DIG_WAYBILL_SERVICE', type: 'api', lod: 1 },
  { id: 'DGR_11', from: 'DIG_WEST_PLATFORM', to: 'DIG_CHONGQING_MES', type: 'access', lod: 2 },
  { id: 'DGR_12', from: 'DIG_YANGTZE_PLATFORM', to: 'DIG_PORT_DATA', type: 'access', lod: 1 },
  { id: 'DGR_13', from: 'DIG_YANGTZE_PLATFORM', to: 'DIG_AIS_DATA', type: 'access', lod: 1 },
  { id: 'DGR_14', from: 'DIG_YANGTZE_PLATFORM', to: 'DIG_CONTRACT_SERVICE', type: 'api', lod: 1 },
  { id: 'DGR_15', from: 'DIG_YANGTZE_PLATFORM', to: 'DIG_CUSTOMS_SERVICE', type: 'api', lod: 2 },
  { id: 'DGR_16', from: 'DIG_GBA_PLATFORM', to: 'DIG_SETTLEMENT_SERVICE', type: 'api', lod: 1 },
  { id: 'DGR_17', from: 'DIG_TRUSTED_SPACE', to: 'DIG_WEATHER_DATA', type: 'authorization', lod: 1 },
  { id: 'DGR_18', from: 'DIG_TRUSTED_SPACE', to: 'DIG_ROAD_DATA', type: 'authorization', lod: 1 },
  { id: 'DGR_19', from: 'DIG_TRUSTED_SPACE', to: 'DIG_CONTRACT_SERVICE', type: 'authorization', lod: 1 },
  { id: 'DGR_20', from: 'DIG_RAIL_DATA', to: 'DIG_EVENT_BUS', type: 'event', lod: 1 },
  { id: 'DGR_21', from: 'DIG_ROAD_DATA', to: 'DIG_EVENT_BUS', type: 'event', lod: 1 },
  { id: 'DGR_22', from: 'DIG_PORT_DATA', to: 'DIG_EVENT_BUS', type: 'event', lod: 1 },
  { id: 'DGR_23', from: 'DIG_AIS_DATA', to: 'DIG_EVENT_BUS', type: 'event', lod: 1 },
  { id: 'DGR_24', from: 'DIG_EVENT_BUS', to: 'DIG_DISPATCH_AGENT', type: 'decision', lod: 0 },
  { id: 'DGR_25', from: 'DIG_WEATHER_DATA', to: 'DIG_DISPATCH_AGENT', type: 'decision', lod: 1 },
  { id: 'DGR_26', from: 'DIG_DISPATCH_AGENT', to: 'DIG_ETA_SERVICE', type: 'decision', lod: 1 },
  { id: 'DGR_27', from: 'DIG_DISPATCH_AGENT', to: 'DIG_WAYBILL_SERVICE', type: 'decision', lod: 1 },
  { id: 'DGR_28', from: 'DIG_DISPATCH_AGENT', to: 'DIG_EXCEPTION_AGENT', type: 'decision', lod: 2 },
  { id: 'DGR_29', from: 'DIG_ETA_SERVICE', to: 'DIG_NATIONAL_PLATFORM', type: 'feedback', lod: 1 },
  { id: 'DGR_30', from: 'DIG_SETTLEMENT_SERVICE', to: 'DIG_NATIONAL_PLATFORM', type: 'feedback', lod: 1 },
  { id: 'DGR_31', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_NORTH_PLATFORM', type: 'api', lod: 0 },
  { id: 'DGR_32', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_HUBEI_PLATFORM', type: 'api', lod: 1 },
  { id: 'DGR_33', from: 'DIG_NORTH_PLATFORM', to: 'DIG_SHANDONG_PLATFORM', type: 'api', lod: 1 },
  { id: 'DGR_34', from: 'DIG_YANGTZE_PLATFORM', to: 'DIG_FUJIAN_PLATFORM', type: 'api', lod: 1 },
  { id: 'DGR_35', from: 'DIG_WEST_PLATFORM', to: 'DIG_YUNNAN_PLATFORM', type: 'api', lod: 1 },
  { id: 'DGR_36', from: 'DIG_NORTHWEST_PLATFORM', to: 'DIG_XINJIANG_PLATFORM', type: 'api', lod: 1 },
  { id: 'DGR_37', from: 'DIG_NORTH_PLATFORM', to: 'DIG_HEBEI_ACCESS', type: 'access', lod: 1 },
  { id: 'DGR_38', from: 'DIG_YANGTZE_PLATFORM', to: 'DIG_ZHEJIANG_ACCESS', type: 'access', lod: 1 },
  { id: 'DGR_39', from: 'DIG_GBA_PLATFORM', to: 'DIG_GUANGXI_ACCESS', type: 'access', lod: 1 },
  { id: 'DGR_40', from: 'DIG_SHANDONG_PLATFORM', to: 'DIG_SHANDONG_ACCESS', type: 'access', lod: 2 },
  { id: 'DGR_41', from: 'DIG_NORTH_PLATFORM', to: 'DIG_SHANXI_ACCESS', type: 'access', lod: 2 },
  { id: 'DGR_42', from: 'DIG_HUBEI_PLATFORM', to: 'DIG_JIANGXI_ACCESS', type: 'access', lod: 2 },
  { id: 'DGR_43', from: 'DIG_GBA_PLATFORM', to: 'DIG_AIR_DATA', type: 'access', lod: 1 },
  { id: 'DGR_44', from: 'DIG_YANGTZE_PLATFORM', to: 'DIG_WAREHOUSE_DATA', type: 'access', lod: 1 },
  { id: 'DGR_45', from: 'DIG_SHANDONG_PLATFORM', to: 'DIG_COLDCHAIN_DATA', type: 'access', lod: 2 },
  { id: 'DGR_46', from: 'DIG_AIR_DATA', to: 'DIG_EVENT_BUS', type: 'event', lod: 1 },
  { id: 'DGR_47', from: 'DIG_WAREHOUSE_DATA', to: 'DIG_EVENT_BUS', type: 'event', lod: 1 },
  { id: 'DGR_48', from: 'DIG_COLDCHAIN_DATA', to: 'DIG_EVENT_BUS', type: 'event', lod: 2 },
  { id: 'DGR_49', from: 'DIG_TRUSTED_SPACE', to: 'DIG_WAREHOUSE_DATA', type: 'authorization', lod: 1 },
  { id: 'DGR_50', from: 'DIG_TRUSTED_SPACE', to: 'DIG_AIR_DATA', type: 'authorization', lod: 1 },
  { id: 'DGR_51', from: 'DIG_TRUSTED_SPACE', to: 'DIG_CAPACITY_SERVICE', type: 'authorization', lod: 1 },
  { id: 'DGR_52', from: 'DIG_NORTH_PLATFORM', to: 'DIG_CAPACITY_SERVICE', type: 'api', lod: 1 },
  { id: 'DGR_53', from: 'DIG_FUJIAN_PLATFORM', to: 'DIG_TRACE_SERVICE', type: 'api', lod: 2 },
  { id: 'DGR_54', from: 'DIG_HUBEI_PLATFORM', to: 'DIG_CARBON_SERVICE', type: 'api', lod: 2 },
  { id: 'DGR_55', from: 'DIG_EVENT_BUS', to: 'DIG_ROUTE_AGENT', type: 'decision', lod: 1 },
  { id: 'DGR_56', from: 'DIG_ROUTE_AGENT', to: 'DIG_CAPACITY_SERVICE', type: 'decision', lod: 1 },
  { id: 'DGR_57', from: 'DIG_ROUTE_AGENT', to: 'DIG_NATIONAL_PLATFORM', type: 'feedback', lod: 1 },
  { id: 'DGR_58', from: 'DIG_CAPACITY_SERVICE', to: 'DIG_NATIONAL_PLATFORM', type: 'feedback', lod: 1 },
  { id: 'DGR_59', from: 'DIG_NATIONAL_PLATFORM', to: 'DIG_ANHUI_PLATFORM', type: 'api', lod: 1 },
  { id: 'DGR_60', from: 'DIG_WEST_PLATFORM', to: 'DIG_GUIZHOU_PLATFORM', type: 'api', lod: 1 },
  { id: 'DGR_61', from: 'DIG_ANHUI_PLATFORM', to: 'DIG_WAREHOUSE_DATA', type: 'access', lod: 2 },
  { id: 'DGR_62', from: 'DIG_GUIZHOU_PLATFORM', to: 'DIG_EVENT_BUS', type: 'event', lod: 2 },
  { id: 'DGR_63', from: 'DIG_LIANYUNGANG_PORT', to: 'DIG_PORT_DATA', type: 'event', lod: 1 },
  { id: 'DGR_64', from: 'DIG_DALIAN_PORT', to: 'DIG_PORT_DATA', type: 'event', lod: 2 },
  { id: 'DGR_65', from: 'DIG_BEIBU_PORT', to: 'DIG_AIS_DATA', type: 'event', lod: 2 },
  // 三条国家级大通道：通道段单独成型，便于在地图上连成完整走向。
  { id: 'DGR_C01', from: 'DIG_CHONGQING_GATEWAY', to: 'DIG_GUIZHOU_PLATFORM', type: 'corridor', corridor: 'DIG_CORRIDOR_WEST_SEA', lod: 1 },
  { id: 'DGR_C02', from: 'DIG_GUIZHOU_PLATFORM', to: 'DIG_GUANGXI_ACCESS', type: 'corridor', corridor: 'DIG_CORRIDOR_WEST_SEA', lod: 1 },
  { id: 'DGR_C03', from: 'DIG_GUANGXI_ACCESS', to: 'DIG_BEIBU_PORT', type: 'corridor', corridor: 'DIG_CORRIDOR_WEST_SEA', lod: 1 },
  { id: 'DGR_C04', from: 'DIG_HARBIN_GATEWAY', to: 'DIG_CHANGCHUN_GATEWAY', type: 'corridor', corridor: 'DIG_CORRIDOR_NORTHEAST_SEA', lod: 1 },
  { id: 'DGR_C05', from: 'DIG_CHANGCHUN_GATEWAY', to: 'DIG_NORTHEAST_PLATFORM', type: 'corridor', corridor: 'DIG_CORRIDOR_NORTHEAST_SEA', lod: 1 },
  { id: 'DGR_C06', from: 'DIG_NORTHEAST_PLATFORM', to: 'DIG_DALIAN_PORT', type: 'corridor', corridor: 'DIG_CORRIDOR_NORTHEAST_SEA', lod: 1 },
  { id: 'DGR_C07', from: 'DIG_LIANYUNGANG_PORT', to: 'DIG_CENTRAL_PLATFORM', type: 'corridor', corridor: 'DIG_CORRIDOR_EURASIA', lod: 1 },
  { id: 'DGR_C08', from: 'DIG_CENTRAL_PLATFORM', to: 'DIG_NORTHWEST_PLATFORM', type: 'corridor', corridor: 'DIG_CORRIDOR_EURASIA', lod: 1 },
  { id: 'DGR_C09', from: 'DIG_NORTHWEST_PLATFORM', to: 'DIG_LANZHOU_GATEWAY', type: 'corridor', corridor: 'DIG_CORRIDOR_EURASIA', lod: 1 },
  { id: 'DGR_C10', from: 'DIG_LANZHOU_GATEWAY', to: 'DIG_XINJIANG_PLATFORM', type: 'corridor', corridor: 'DIG_CORRIDOR_EURASIA', lod: 1 },
  { id: 'DGR_C11', from: 'DIG_XINJIANG_PLATFORM', to: 'DIG_ALASHANKOU_GATEWAY', type: 'corridor', corridor: 'DIG_CORRIDOR_EURASIA', lod: 1 },
];

export const demoTasks = [
  {
    id: 'TASK_HA_GZ_0826',
    name: '东北粮食南运 · 0826',
    status: '在途',
    progress: 64,
    eta: '18 小时 26 分',
    nodes: ['松原粮食物流节点', '营口港', '上海港', '广州港南沙港区'],
    events: [
      { time: '08:12', type: 'EPCIS', title: '营口港完成装载' },
      { time: '10:36', type: '运行', title: '海铁联运班次发出' },
      { time: '13:18', type: 'AI', title: 'ETA 调整 +12 分钟' },
      { time: '15:42', type: '可信空间', title: '承运状态授权校验通过' },
    ],
  },
];

const MUNICIPALITY_NAMES = ['北京', '天津', '上海', '重庆'];
const FACILITY_CITY_ALIASES = {
  '北京（平谷）': '北京',
  '武汉—鄂州': '武汉',
  '宁波—舟山': '宁波舟山',
  '金华（义乌）': '金华',
  '钦州—北海—防城港': '北部湾',
};

export const normalizeProvinceName = (value = '') => {
  const name = String(value).trim();
  if (name === '新疆生产建设兵团') return '新疆';
  return name.replace(/(壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/, '');
};

export const normalizeFacilityCity = (point = {}) => {
  const province = String(point.province ?? '');
  const city = String(point.city ?? '');
  const municipality = MUNICIPALITY_NAMES.find((name) => province.startsWith(name) || city.startsWith(name));
  if (municipality) return municipality;
  if (FACILITY_CITY_ALIASES[city]) return FACILITY_CITY_ALIASES[city];
  let name = city
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/^(?:[\u4e00-\u9fff]+?(?:省|维吾尔自治区|壮族自治区|回族自治区|自治区|生产建设兵团))/, '')
    .trim();
  if (name === '宁波—舟山' || name === '宁波-舟山') return '宁波舟山';
  if (name.includes('—') || name.includes('-')) name = name.split(/[—-]/)[0];
  const prefecture = name.match(/^([\u4e00-\u9fff]{2,6}?)(?:朝鲜族自治州|土家族苗族自治州|蒙古自治州|哈萨克自治州|傣族景颇族自治州|自治州|地区|盟|市)/);
  if (prefecture?.[1]) return prefecture[1];
  name = name.replace(/(新区|区|县|旗)$/, '');
  if (name.length > 4) return name.slice(0, 2);
  return name || city || '未标注';
};

const tallyFacilityCities = (points) => {
  const map = new Map();
  (points ?? []).forEach((point) => {
    const name = normalizeFacilityCity(point);
    if (!name || name === '未标注') return;
    map.set(name, (map.get(name) ?? 0) + 1);
  });
  return map;
};

const rankingFromTally = (map, limit) => {
  const rows = [...map.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-CN'));
  const max = rows[0]?.[1] ?? 1;
  return rows.slice(0, limit).map(([name, count]) => ({
    name,
    count,
    score: Math.round((100 * count) / max),
  }));
};

export const buildFacilityDistributionRankings = (facilities, limit = 5) => {
  const layers = new Map((facilities?.layers ?? []).map((layer) => [layer.id, layer.points ?? []]));
  const hubs = layers.get('nationalHubs') ?? [];
  const cold = layers.get('coldChainBases') ?? [];
  const parks = layers.get('logisticsParks') ?? [];
  const counts = {
    hubs: tallyFacilityCities(hubs),
    cold: tallyFacilityCities(cold),
    parks: tallyFacilityCities(parks),
    total: tallyFacilityCities([...hubs, ...cold, ...parks]),
  };
  return {
    hubs: rankingFromTally(counts.hubs, limit),
    cold: rankingFromTally(counts.cold, limit),
    parks: rankingFromTally(counts.parks, limit),
    total: rankingFromTally(counts.total, limit),
    counts,
  };
};

export const PROVINCE_NEIGHBORS = {
  北京: ['天津', '河北'],
  天津: ['北京', '河北'],
  河北: ['北京', '天津', '山东', '河南', '山西', '内蒙古', '辽宁'],
  山西: ['河北', '河南', '陕西', '内蒙古'],
  内蒙古: ['黑龙江', '吉林', '辽宁', '河北', '山西', '陕西', '宁夏', '甘肃'],
  辽宁: ['吉林', '内蒙古', '河北'],
  吉林: ['黑龙江', '辽宁', '内蒙古'],
  黑龙江: ['吉林', '内蒙古'],
  上海: ['江苏', '浙江'],
  江苏: ['山东', '安徽', '浙江', '上海'],
  浙江: ['江苏', '安徽', '江西', '福建', '上海'],
  安徽: ['江苏', '浙江', '江西', '湖北', '河南', '山东'],
  福建: ['浙江', '江西', '广东'],
  江西: ['浙江', '安徽', '湖北', '湖南', '广东', '福建'],
  山东: ['河北', '河南', '安徽', '江苏'],
  河南: ['河北', '山西', '陕西', '湖北', '安徽', '山东'],
  湖北: ['河南', '安徽', '江西', '湖南', '重庆', '陕西'],
  湖南: ['湖北', '江西', '广东', '广西', '贵州', '重庆'],
  广东: ['福建', '江西', '湖南', '广西', '海南'],
  广西: ['广东', '湖南', '贵州', '云南'],
  海南: ['广东'],
  重庆: ['四川', '陕西', '湖北', '湖南', '贵州'],
  四川: ['重庆', '陕西', '甘肃', '青海', '西藏', '云南', '贵州'],
  贵州: ['四川', '重庆', '湖南', '广西', '云南'],
  云南: ['四川', '贵州', '广西', '西藏'],
  西藏: ['新疆', '青海', '四川', '云南'],
  陕西: ['山西', '河南', '湖北', '重庆', '四川', '甘肃', '宁夏', '内蒙古'],
  甘肃: ['内蒙古', '宁夏', '陕西', '四川', '青海', '新疆'],
  青海: ['新疆', '甘肃', '四川', '西藏'],
  宁夏: ['内蒙古', '陕西', '甘肃'],
  新疆: ['西藏', '青海', '甘肃'],
};

const PROVINCE_CAPITALS = {
  北京: [116.41, 39.90], 天津: [117.20, 39.08], 河北: [114.51, 38.04], 山西: [112.55, 37.86],
  内蒙古: [111.75, 40.84], 辽宁: [123.43, 41.80], 吉林: [125.32, 43.89], 黑龙江: [126.63, 45.75],
  上海: [121.47, 31.23], 江苏: [118.80, 32.06], 浙江: [120.15, 30.27], 安徽: [117.28, 31.86],
  福建: [119.30, 26.08], 江西: [115.86, 28.68], 山东: [117.00, 36.67], 河南: [113.63, 34.75],
  湖北: [114.30, 30.59], 湖南: [112.98, 28.19], 广东: [113.26, 23.13], 广西: [108.32, 22.82],
  海南: [110.35, 20.02], 重庆: [106.55, 29.56], 四川: [104.07, 30.67], 贵州: [106.71, 26.60],
  云南: [102.71, 25.04], 西藏: [91.13, 29.66], 陕西: [108.95, 34.27], 甘肃: [103.83, 36.06],
  青海: [101.78, 36.62], 宁夏: [106.27, 38.47], 新疆: [87.62, 43.83],
};

const PROVINCE_CAPITAL_NAME = {
  山东: '济南', 广东: '广州', 江苏: '南京', 浙江: '杭州', 河南: '郑州', 湖北: '武汉',
  湖南: '长沙', 四川: '成都', 陕西: '西安', 辽宁: '沈阳', 吉林: '长春', 黑龙江: '哈尔滨',
  河北: '石家庄', 山西: '太原', 安徽: '合肥', 福建: '福州', 江西: '南昌', 广西: '南宁',
  云南: '昆明', 贵州: '贵阳', 甘肃: '兰州', 青海: '西宁', 宁夏: '银川', 新疆: '乌鲁木齐',
  内蒙古: '呼和浩特', 西藏: '拉萨', 海南: '海口', 重庆: '重庆', 北京: '北京', 上海: '上海', 天津: '天津',
};

const cardinalFromOffset = (from, to) => {
  const dx = Number(to?.[0]) - Number(from?.[0]);
  const dy = Number(to?.[1]) - Number(from?.[1]);
  const deg = Math.atan2(dy, dx) * 180 / Math.PI;
  if (deg >= -45 && deg < 45) return '东向';
  if (deg >= 45 && deg < 135) return '北向';
  if (deg >= -135 && deg < -45) return '南向';
  return '西向';
};

const classifyFacilityKind = (point = {}) => {
  const text = `${point.category ?? ''} ${point.name ?? ''}`;
  if (/空港|机场|航空/.test(text)) return 'air';
  if (/港口|港区|水运|码头/.test(text)) return 'port';
  if (/陆港|铁路|货站|编组/.test(text)) return 'rail';
  return 'road';
};

const filterFacilityLayersByProvince = (facilities, province) => {
  const normalized = normalizeProvinceName(province);
  return {
    ...facilities,
    layers: (facilities?.layers ?? []).map((layer) => ({
      ...layer,
      points: (layer.points ?? []).filter((point) => normalizeProvinceName(point.province) === normalized),
    })),
  };
};

export const buildProvinceInfrastructureDashboard = (summary = {}, data = {}) => {
  const province = summary.province ?? '本省';
  const national = data.infrastructureDashboard ?? infrastructureDashboard;
  const provincialFacilities = filterFacilityLayersByProvince(data.infrastructure?.facilities, province);
  const stats = buildFacilityDistributionRankings(provincialFacilities, 8);
  const hubPoints = provincialFacilities.layers.find((layer) => layer.id === 'nationalHubs')?.points ?? [];
  const coldPoints = provincialFacilities.layers.find((layer) => layer.id === 'coldChainBases')?.points ?? [];
  const parkPoints = provincialFacilities.layers.find((layer) => layer.id === 'logisticsParks')?.points ?? [];
  const allPoints = [...hubPoints, ...coldPoints, ...parkPoints];
  const hubCount = hubPoints.length || Number(summary.nationalHubs) || 0;
  const coldCount = coldPoints.length || Number(summary.coldChainBases) || 0;
  const parkCount = parkPoints.length || Number(summary.logisticsParks) || 0;
  const cityRecords = (summary.cityRecords ?? []).filter((city) => Array.isArray(city.center) && city.center.length >= 2);
  const cityCount = Math.max(1, Number(summary.cityCount) || cityRecords.length || stats.total.length || 1);
  const capitalName = PROVINCE_CAPITAL_NAME[province];
  const capitalCenter = cityRecords.find((city) => displayCityName(city.name) === capitalName)?.center
    ?? PROVINCE_CAPITALS[province]
    ?? cityRecords[0]?.center
    ?? [104, 35];
  const countByCity = new Map();
  const kindsByCity = new Map();
  const facilityCityCenters = new Map();
  allPoints.forEach((point) => {
    const name = normalizeFacilityCity(point);
    if (!name || name === '未标注') return;
    countByCity.set(name, (countByCity.get(name) ?? 0) + 1);
    const kinds = kindsByCity.get(name) ?? new Set();
    kinds.add(classifyFacilityKind(point));
    if (point.category) kinds.add(point.category);
    kindsByCity.set(name, kinds);
    if (Array.isArray(point.coordinates) && point.coordinates.length >= 2 && !facilityCityCenters.has(name)) {
      facilityCityCenters.set(name, point.coordinates);
    }
  });
  const coveredCities = [...countByCity.keys()];
  const coveredCount = Math.max(coveredCities.length, hubCount ? 1 : 0);
  const counties = cityRecords.filter((city) => /[县旗]$/u.test(city.name));
  const countyCovered = counties.filter((city) => countByCity.has(displayCityName(city.name)) || countByCity.has(normalizeFacilityCity({ city: city.name, province }))).length;
  const countyRate = counties.length
    ? (100 * countyCovered / counties.length)
    : Math.min(96.4, 62 + (coveredCount / cityCount) * 28 + Math.min(6, hubCount));
  const neighbors = (PROVINCE_NEIGHBORS[province] ?? []).map((name) => {
    const center = PROVINCE_CAPITALS[name] ?? capitalCenter;
    return { name, center, direction: cardinalFromOffset(capitalCenter, center) };
  });
  const directionCounts = { 东向: 0, 南向: 0, 西向: 0, 北向: 0 };
  neighbors.forEach((item) => { directionCounts[item.direction] += 1; });
  const outboundCount = Math.max(neighbors.length, Object.values(directionCounts).filter(Boolean).length);
  const coreHubCities = [...new Set(hubPoints.map((point) => normalizeFacilityCity(point)).filter((name) => name && name !== '未标注'))];
  const coreHubCount = Math.max(coreHubCities.length, hubCount ? Math.min(2, hubCount) : 0);
  const parkBaseCount = parkCount + coldCount;
  const freightNodes = hubCount + parkCount + coldCount + cityCount;
  const formatCount = (value) => Number(value).toLocaleString('zh-CN');
  const formatRate = (value) => Number(value).toFixed(1);
  const isMunicipality = MUNICIPALITY_NAMES.includes(province);
  const sourceRecords = isMunicipality
    ? [{ name: province, center: capitalCenter }, ...sampleSurroundingCities(cityRecords, capitalCenter, 8)]
    : cityRecords.filter((city) => isPrefectureUnit(city.name) || countByCity.has(shortAdminName(city.name)) || countByCity.has(displayCityName(city.name)));
  const mergedRecords = [...sourceRecords];
  facilityCityCenters.forEach((center, name) => {
    if (mergedRecords.some((city) => shortAdminName(city.name) === name || displayCityName(city.name) === name)) return;
    mergedRecords.push({ name, center });
  });
  if (!mergedRecords.length) mergedRecords.push({ name: capitalName ?? province, center: capitalCenter });
  const roleForCity = (name, count, index) => {
    if (name === capitalName || name === province || index === 0) return '综合枢纽';
    if (hubPoints.some((point) => normalizeFacilityCity(point) === name)) return '通道型枢纽';
    if (count >= 3) return '区域节点';
    return '集散节点';
  };
  const cityRows = (stats.total.length ? stats.total : coveredCities.map((name) => ({ name, count: countByCity.get(name) ?? 0, score: 50 })))
    .map((item, index) => ({
      ...item,
      role: roleForCity(item.name, item.count, index),
      linkScore: Math.min(100, item.score + (item.name === capitalName ? 12 : neighbors.length * 2)),
      coverScore: Math.min(100, Math.round((item.count / Math.max(1, allPoints.length)) * 100) + (item.name === capitalName ? 18 : 0)),
    }));
  const rankBy = (key) => [...cityRows].sort((left, right) => (right[key] - left[key]) || left.name.localeCompare(right.name, 'zh-CN')).slice(0, 5);
  const railCount = hubPoints.filter((point) => classifyFacilityKind(point) === 'rail').length;
  const roadCount = hubPoints.filter((point) => classifyFacilityKind(point) === 'road').length + Math.max(0, cityCount - coreHubCount);
  const airPortCount = hubPoints.filter((point) => ['air', 'port'].includes(classifyFacilityKind(point))).length
    + allPoints.filter((point) => classifyFacilityKind(point) === 'air').length;
  const channelNodes = Math.max(0, coreHubCount > 1 ? coreHubCount - 1 : Math.min(2, coveredCount));
  const analysisCities = mergedRecords.map((city) => {
    const name = shortAdminName(city.name) || displayCityName(city.name);
    const count = countByCity.get(name) ?? countByCity.get(displayCityName(city.name)) ?? 0;
    const hasHub = hubPoints.some((point) => normalizeFacilityCity(point) === name);
    return {
      id: `CITY_${province}_${name}`,
      name,
      fullName: city.name,
      center: city.center ?? facilityCityCenters.get(name) ?? capitalCenter,
      count,
      hasHub,
    };
  });
  const capitalCity = analysisCities.find((city) => city.name === capitalName || city.name === province) ?? analysisCities[0];
  analysisCities.forEach((city) => {
    const dist = cityDistance(city, capitalCity);
    city.tier = city.name === capitalCity.name
      ? 1
      : city.hasHub || city.count >= 2 || dist > 4.8
        ? 2
        : 3;
    city.weak = Boolean(city.tier === 3 && city.count === 0);
    city.label = city.tier <= 2 || isPrefectureUnit(city.fullName) || city.hasHub;
    city.role = city.tier === 1 ? '综合物流核心' : city.hasHub ? '陆港 / 通道转运' : city.tier === 2 ? '区域集散' : '县域节点';
  });
  const regional = analysisCities.filter((city) => city.tier === 2);
  if (regional.length < 2) {
    [...analysisCities]
      .filter((city) => city.tier !== 1)
      .sort((left, right) => isMunicipality
        ? (right.count - left.count) || cityDistance(right, capitalCity) - cityDistance(left, capitalCity)
        : cityDistance(right, capitalCity) - cityDistance(left, capitalCity))
      .slice(0, 2)
      .forEach((city) => { city.tier = 2; city.label = true; city.role = city.hasHub ? '陆港 / 通道转运' : '区域集散'; });
  }
  const labeledCities = analysisCities.filter((city) => city.label);
  const cores = labeledCities.filter((city) => city.tier <= 2);
  const skeleton = [];
  const trunkTargets = [
    ...cores.filter((city) => city.tier === 2 && city.hasHub),
    ...cores.filter((city) => city.tier === 2 && !city.hasHub)
      .sort((left, right) => cityDistance(right, capitalCity) - cityDistance(left, capitalCity)),
  ].slice(0, 5);
  trunkTargets.forEach((city) => {
    skeleton.push({ from: capitalCity.center, to: city.center, grade: 'trunk' });
  });
  labeledCities.filter((city) => city.tier === 3).forEach((city) => {
    if (skeleton.length >= 8) return;
    const nearest = cores.reduce((best, item) => {
      const distance = cityDistance(city, item);
      return !best || distance < best.distance ? { item, distance } : best;
    }, null);
    if (nearest) skeleton.push({ from: nearest.item.center, to: city.center, grade: 'feeder' });
  });
  const weakCities = analysisCities.filter((city) => city.weak).slice(0, 6).map((city) => city.name);
  const coldGap = Math.max(0, Math.ceil((Math.max(labeledCities.length, 4) - coldCount) / 4) - (coldCount > 0 ? 1 : 0));
  const parkGap = Math.max(0, Math.ceil((Math.max(labeledCities.length, 4) - parkCount) / 5) - (parkCount > 0 ? 1 : 0));
  const connectGap = Math.max(0, outboundCount >= 4 ? 1 : Math.max(0, 3 - outboundCount));
  const coverageIndex = Math.min(96.8, 74 + coveredCount / cityCount * 16 + Math.min(6, hubCount) + Math.min(3, outboundCount * 0.6));
  const regionScore = (predicate, base) => {
    const matched = analysisCities.filter((city) => predicate(city.center ?? capitalCenter));
    if (!matched.length) return base;
    const facilities = matched.reduce((sum, city) => sum + city.count, 0);
    return Math.min(96.5, base + facilities * 1.8 - Math.max(0, matched.length - 2) * 1.1);
  };
  const typeLabelFor = (name) => [
    hubPoints.some((point) => normalizeFacilityCity(point) === name && classifyFacilityKind(point) === 'rail') ? '铁路' : null,
    hubPoints.some((point) => normalizeFacilityCity(point) === name && classifyFacilityKind(point) === 'road') ? '公路' : null,
    hubPoints.some((point) => normalizeFacilityCity(point) === name && classifyFacilityKind(point) === 'air') || /空港|机场/.test([...kindsByCity.get(name) ?? []].join()) ? '航空' : null,
    parkPoints.some((point) => normalizeFacilityCity(point) === name) ? '园区' : null,
    coldPoints.some((point) => normalizeFacilityCity(point) === name) ? '冷链' : null,
  ].filter(Boolean).join(' ｜ ') || '综合节点';
  const overlaySeed = isMunicipality
    ? [
        capitalCity,
        ...analysisCities
          .filter((city) => city.id !== capitalCity?.id)
          .sort((left, right) => (right.count - left.count) || cityDistance(right, capitalCity) - cityDistance(left, capitalCity)),
      ]
    : [
        capitalCity,
        ...analysisCities.filter((city) => city.hasHub && city.id !== capitalCity?.id),
        ...analysisCities
          .filter((city) => city.tier === 2 && !city.hasHub && city.id !== capitalCity?.id)
          .sort((left, right) => cityDistance(right, capitalCity) - cityDistance(left, capitalCity)),
      ];
  const overlaySeen = new Set();
  const overlayCities = overlaySeed
    .filter(Boolean)
    .filter((city) => {
      if (overlaySeen.has(city.id)) return false;
      overlaySeen.add(city.id);
      return true;
    })
    .slice(0, 3)
    .map((city, index) => {
      const isCapital = city.tier === 1;
      const cityDirections = neighbors
        .filter((neighbor) => isCapital || cardinalFromOffset(city.center, neighbor.center) === neighbor.direction)
        .map((neighbor) => neighbor.direction);
      const uniqueDirections = [...new Set(isCapital ? neighbors.map((item) => item.direction) : cityDirections)].slice(0, 3);
      const types = typeLabelFor(city.name);
      return {
        id: city.id,
        name: city.name,
        center: city.center,
        anchor: index % 2 ? 'left' : 'right',
        kind: isCapital ? 'capital' : 'city',
        level: isCapital ? '省级核心枢纽' : city.hasHub ? '通道型枢纽' : '区域物流节点',
        directions: uniqueDirections.join(' ｜ ') || (isCapital ? '省内集散' : '区域联动'),
        channels: isCapital ? outboundCount : Math.max(1, uniqueDirections.length),
        facilities: city.count,
        coverage: isCapital ? labeledCities.length : Math.max(1, Math.round(city.count / 2) || 1),
        coverageLabel: isCapital ? '辐射地市' : city.hasHub ? '主要方向' : '主要功能',
        coverageText: isCapital
          ? `${labeledCities.length}个`
          : city.hasHub
            ? (uniqueDirections.join(' ｜ ') || '西向 ｜ 南向')
            : [city.role, types !== '综合节点' ? types : null].filter(Boolean).join(' ｜ ') || '区域集散',
        types,
        role: isCapital ? '综合物流核心' : city.role,
      };
    });
  return {
    ...national,
    layout: 'provincial',
    scope: province,
    heading: [`${province}基础设施网络`, '省内骨架 · 节点分布 · 对外通达'],
    modes: [
      { id: 'overview', label: '综合总览' },
      { id: 'skeleton', label: '省内骨架' },
      { id: 'outbound', label: '对外通道' },
      { id: 'nodes', label: '节点分布' },
      { id: 'parks', label: '园区基地' },
    ],
    modeFilters: {
      overview: ['provincialBackbone', 'outboundChannels', 'cityNodes', 'logisticsParks', 'coldChainBases', 'railFreight', 'roadFreight', 'airPortFacilities'],
      skeleton: ['provincialBackbone', 'cityNodes'],
      outbound: ['outboundChannels', 'cityNodes', 'provincialBackbone'],
      nodes: ['cityNodes', 'logisticsParks', 'coldChainBases', 'railFreight', 'roadFreight', 'airPortFacilities'],
      parks: ['logisticsParks', 'coldChainBases', 'cityNodes'],
    },
    overviewCards: [
      { id: 'nationalHubs', label: '核心枢纽城市', value: formatCount(coreHubCount), unit: '个' },
      { id: 'highways', label: '地市覆盖数', value: formatCount(coveredCount || cityCount), unit: '个' },
      { id: 'channels', label: '出省通道数', value: formatCount(outboundCount), unit: '条' },
      { id: 'parks', label: '重点园区/基地', value: formatCount(parkBaseCount), unit: '个' },
      { id: 'stations', label: '重点货运节点', value: formatCount(freightNodes), unit: '个' },
      { id: 'auth', label: '县域覆盖率', value: formatRate(countyRate), unit: '%' },
    ],
    layerToggles: [
      { id: 'provincialBackbone', label: '省内骨干通道' },
      { id: 'outboundChannels', label: '出省通道' },
      { id: 'cityNodes', label: '城市节点' },
      { id: 'logisticsParks', label: '物流园区' },
      { id: 'coldChainBases', label: '冷链基地' },
      { id: 'railFreight', label: '铁路货运设施' },
      { id: 'roadFreight', label: '公路货运设施' },
      { id: 'airPortFacilities', label: '航空 / 港口设施' },
    ],
    lineGroupTitle: '省内分析图层',
    pointGroupTitle: '物流设施点',
    stats: [
      ['核心枢纽城市', `${formatCount(coreHubCount)}个`],
      ['重点园区基地', `${formatCount(parkBaseCount)}个`],
      ['重点货运节点', `${formatCount(freightNodes)}个`],
      ['出省通道', `${formatCount(outboundCount)}条`],
      ['覆盖地市', `${formatCount(coveredCount || cityCount)}个`],
      ['县域覆盖率', `${formatRate(countyRate)}%`],
      ['连通性指数', formatRate(coverageIndex)],
    ],
    rankingTitle: '设施分布 TOP 5',
    rankingLabel: '本省节点',
    rankingTabs: [
      { id: 'count', label: '设施数量' },
      { id: 'level', label: '节点等级' },
      { id: 'link', label: '通道衔接' },
      { id: 'cover', label: '覆盖范围' },
    ],
    rankings: {
      count: rankBy('count'),
      level: rankBy('score'),
      link: rankBy('linkScore'),
      cover: rankBy('coverScore'),
    },
    facilityStructure: [
      { id: 'hubs', label: '综合枢纽', value: Math.max(1, coreHubCount) },
      { id: 'channels', label: '通道型节点', value: channelNodes },
      { id: 'parks', label: '园区基地', value: parkCount },
      { id: 'cold', label: '冷链设施', value: coldCount },
      { id: 'rail', label: '铁路货运设施', value: Math.max(railCount, hubCount) },
      { id: 'road', label: '公路货运设施', value: Math.max(roadCount, cityCount) },
      { id: 'air', label: '航空/港口设施', value: airPortCount },
    ],
    outbound: {
      neighbors: neighbors.length,
      channels: outboundCount,
      directions: [
        ['东向连接', `${directionCounts['东向']}个方向`],
        ['南向连接', `${directionCounts['南向']}个方向`],
        ['西向连接', `${directionCounts['西向']}个方向`],
        ['北向连接', `${directionCounts['北向']}个方向`],
      ],
    },
    connectivity: {
      value: formatRate(coverageIndex),
      title: '设施连通性指数',
      label: '省内综合指数',
      regions: [
        ['省会都市圈', formatRate(Math.min(96.8, coverageIndex + 5.4))],
        ['东部片区', formatRate(regionScore((center) => center[0] >= capitalCenter[0], 82))],
        ['西部片区', formatRate(regionScore((center) => center[0] < capitalCenter[0], 76))],
        ['南部片区', formatRate(regionScore((center) => center[1] < capitalCenter[1], 72))],
      ],
    },
    weakness: {
      coverage: weakCities.length,
      connection: connectGap,
      cold: coldGap,
      parks: parkGap,
    },
    mapOverlays: {
      hubs: overlayCities,
    },
    analysis: {
      provinceCenter: capitalCity?.center ?? capitalCenter,
      cities: analysisCities,
      neighbors,
      weakCities,
      skeleton,
    },
  };
};

export const attachInfrastructureFacilityStats = (dashboard, facilities) => {
  const stats = buildFacilityDistributionRankings(facilities);
  return {
    ...dashboard,
    rankings: {
      hubs: stats.hubs,
      cold: stats.cold,
      parks: stats.parks,
      total: stats.total,
    },
    rankingLabel: '设施点数',
    mapOverlays: {
      ...dashboard.mapOverlays,
      hubs: (dashboard.mapOverlays?.hubs ?? []).map((hub) => {
        const count = stats.counts.hubs.get(hub.name);
        return count ? { ...hub, tasks: `${count} 个国家枢纽` } : hub;
      }),
    },
  };
};

/**
 * 省级数字物流网只用地市节点、协同关系和出省通道三种要素表达，
 * 角色与图例一一对应：平台与系统 / 物流企业 / 货主企业 / 园区与枢纽 / 政务及公共服务。
 */
const PROVINCE_DIGITAL_ROLES = ['logistics', 'shipper', 'park', 'public'];
const PROVINCE_DIGITAL_ROLE_SUFFIX = {
  platform: '数字物流平台',
  logistics: '物流企业节点',
  shipper: '货主企业节点',
  park: '园区与枢纽节点',
  public: '公共服务节点',
};

const buildProvinceDigitalNetwork = (province, cityRecords = []) => {
  const empty = { nodes: [], relations: [], corridors: [] };
  const records = cityRecords.filter((city) => Array.isArray(city.center) && city.center.length >= 2);
  if (!records.length) return empty;
  const prefectures = records.filter((city) => isPrefectureUnit(city.name));
  const pool = prefectures.length >= 4 ? prefectures : records;
  const capitalCenter = PROVINCE_CAPITALS[province] ?? pool[0].center;
  const distanceTo = (center) => Math.hypot(center[0] - capitalCenter[0], center[1] - capitalCenter[1]);
  const capital = [...pool].sort((left, right) => distanceTo(left.center) - distanceTo(right.center))[0];
  const surrounding = sampleSurroundingCities(
    pool.filter((city) => city.name !== capital.name),
    capital.center,
    Math.min(11, Math.max(0, pool.length - 1)),
  );
  const makeNode = (city, index) => {
    const role = index === 0 ? 'platform' : PROVINCE_DIGITAL_ROLES[(index - 1) % PROVINCE_DIGITAL_ROLES.length];
    const short = shortAdminName(city.name);
    return {
      id: `DIG_PCITY_${province}_${city.name}`,
      name: `${short}${PROVINCE_DIGITAL_ROLE_SUFFIX[role]}`,
      city: short,
      fullName: city.name,
      province,
      longitude: city.center[0],
      latitude: city.center[1],
      center: city.center,
      networkRole: role,
      tier: index === 0 ? 1 : index <= 4 ? 2 : 3,
      lod: index <= 7 ? 1 : 2,
      metrics: {
        entities: Math.round(provinceMix(`${province}${city.name}`, 46, 286, index + 1)),
        systems: Math.round(provinceMix(`${city.name}${province}`, 8, 68, index + 3)),
        resources: Math.round(provinceMix(`${province}#${city.name}`, 168, 1286, index + 5)),
        shares: provinceMix(city.name, 0.4, 3.8, index + 7).toFixed(1),
        calls: provinceMix(`${city.name}!${province}`, 0.6, 6.8, index + 9).toFixed(1),
      },
    };
  };
  const nodes = [capital, ...surrounding].map(makeNode);
  const hub = nodes[0];
  const relations = [];
  // 省级平台向各地市放射：数据共享与服务调用交替，读起来就是“平台在供数、地市在用数”。
  nodes.slice(1).forEach((node, index) => {
    relations.push({
      id: `DIG_PREL_${province}_HUB_${index}`,
      from: hub.id,
      to: node.id,
      type: index % 2 ? 'call' : 'share',
      lod: node.lod,
    });
  });
  // 相邻地市之间再织一圈业务协同，避免只有放射线显得单薄。
  const ring = nodes.slice(1);
  ring.forEach((node, index) => {
    const next = ring[(index + 1) % ring.length];
    if (!next || next.id === node.id) return;
    if (index % 2) return;
    relations.push({
      id: `DIG_PREL_${province}_RING_${index}`,
      from: node.id,
      to: next.id,
      type: 'collaboration',
      lod: 1,
    });
  });
  // 出省通道：从最靠近邻省方向的地市甩一条箭头出界，标注“至某省”。
  const corridors = (PROVINCE_NEIGHBORS[province] ?? []).map((neighbor, index) => {
    const target = PROVINCE_CAPITALS[neighbor];
    if (!target) return null;
    const gateway = [...nodes].sort((left, right) => (
      Math.hypot(left.center[0] - target[0], left.center[1] - target[1])
      - Math.hypot(right.center[0] - target[0], right.center[1] - target[1])
    ))[0];
    return {
      id: `DIG_PCOR_${province}_${neighbor}`,
      label: `至${shortAdminName(neighbor)}`,
      neighbor,
      from: gateway.id,
      target,
      direction: cardinalFromOffset(gateway.center, target),
      tasks: Math.round(provinceMix(`${province}${neighbor}`, 68, 486, index + 11)),
      lod: 1,
    };
  }).filter(Boolean);
  return { nodes, relations, corridors };
};

/** 省级地图只挂四张极简名牌：省级枢纽、城市群协同带、联运节点、出省通道带。 */
const buildProvinceDigitalCallouts = (province, network) => {
  const nodes = network.nodes ?? [];
  if (!nodes.length) return [];
  const shortProvince = shortAdminName(province);
  const pick = (index) => nodes[Math.min(index, nodes.length - 1)];
  const hub = pick(0);
  const cluster = pick(1);
  const junction = pick(Math.floor(nodes.length / 2));
  const gateway = pick(nodes.length - 1);
  const specs = [
    {
      node: hub,
      name: `${hub.city}物流枢纽`,
      description: `${shortProvince}数据汇聚与服务中心`,
      anchor: 'right',
      stack: 'up',
      metrics: [['接入企业', `${hub.metrics.entities}家`], ['服务调用', `${hub.metrics.calls}万次`]],
    },
    {
      node: cluster,
      name: `${shortProvince}城市群协同带`,
      description: '地市之间数据共享与业务协同',
      anchor: 'left',
      stack: 'up',
      metrics: [['共享关系', `${Math.round(cluster.metrics.entities * 1.24)}个`], ['服务调用', `${cluster.metrics.calls}万次`]],
    },
    {
      node: junction,
      name: `${junction.city}联运节点`,
      description: '多式联运与园区作业协同',
      anchor: 'left',
      stack: 'down',
      metrics: [['覆盖园区', `${Math.max(3, Math.round(junction.metrics.systems * 0.32))}个`], ['协同任务', `${Math.round(junction.metrics.entities * 1.08)}次`]],
    },
    {
      node: gateway,
      name: `${gateway.city}通道节点`,
      description: '出省通道与跨省数据对接',
      anchor: 'right',
      stack: 'down',
      metrics: [['联运协同', `${Math.max(4, network.corridors.length * 2)}次`], ['数据服务', `${gateway.metrics.resources.toLocaleString('zh-CN')}次`]],
    },
  ];
  const seen = new Set();
  return specs.filter((spec) => {
    if (seen.has(spec.node.id)) return false;
    seen.add(spec.node.id);
    return true;
  }).map((spec) => ({
    id: spec.node.id,
    name: spec.name,
    description: spec.description,
    anchor: spec.anchor,
    stack: spec.stack,
    metrics: spec.metrics,
  }));
};

const PROVINCE_DIGITAL_PRODUCTS = [
  '省内运力查询',
  '路径与时效分析',
  '园区作业监测',
  '运输异常预警',
  '跨省调运方案推荐',
];

export const buildProvinceDigitalDashboard = (summary = {}, data = {}) => {
  const province = summary.province ?? '本省';
  const cityCount = Math.max(1, Number(summary.cityCount) || 8);
  const network = buildProvinceDigitalNetwork(province, summary.cityRecords ?? []);
  const parkCount = Math.max(6, Number(summary.logisticsParks ?? 0) + Number(summary.coldChainBases ?? 0) + Number(summary.nationalHubs ?? 0));
  const entities = Math.round(cityCount * provinceMix(province, 46, 92, 3));
  const systems = Math.round(entities * provinceMix(province, 0.16, 0.26, 5));
  const resources = Math.round(entities * provinceMix(province, 3.6, 5.2, 7));
  const shares = Math.round(entities * provinceMix(province, 0.72, 1.08, 9));
  const activeCities = Math.max(4, Math.round(cityCount * provinceMix(province, 0.78, 0.98, 11)));
  const onlineSubjects = Math.round(entities * provinceMix(province, 0.18, 0.28, 13));
  const services = Math.max(18, Math.round(systems * provinceMix(province, 0.22, 0.34, 15)));
  const calls = provinceMix(province, 3.2, 9.8, 17);
  const updates = provinceMix(province, 68, 286, 19);
  const analysis = Math.round(entities * provinceMix(province, 0.86, 1.42, 21));
  const alerts = Math.max(8, Math.round(updates * 0.32));
  const successRate = provinceMix(province, 98.4, 99.8, 23);
  const timeliness = provinceMix(province, 98.2, 99.7, 25);
  const enterprises = Math.round(entities * provinceMix(province, 0.24, 0.38, 27));
  const cityNames = network.nodes.map((node) => node.city);
  const hubCity = cityNames[0] ?? province;
  const shortProvince = shortAdminName(province);
  const events = [
    ['物流信息更新', '运输任务已到达目的节点'],
    ['运力状态更新', '承运车辆已进入下一节点'],
    ['数据共享完成', '企业已获取运输状态数据'],
    ['异常提醒', '预计到达时间发生变化'],
    ['智能分析完成', '已生成省内调运方案建议'],
    ['新增企业接入', '物流企业完成网络接入'],
  ].map(([type, detail], index) => ({
    time: `16:${String(37 - index).padStart(2, '0')}:${String(58 - index * 7).padStart(2, '0')}`,
    type,
    detail: `${cityNames[index % Math.max(1, cityNames.length)] ?? province} · ${detail}`,
  }));
  return {
    layout: 'provincial',
    scope: province,
    heading: [`${province}数字物流网络运行态势`, `呈现${shortProvince}地市连接、数据共享、服务调用与跨省协同情况`],
    lead: '看省内地市连接、数据共享、服务调用与出省通道协同',
    modes: [
      { id: 'overview', label: '省内总览' },
      { id: 'cities', label: '地市协同' },
      { id: 'parks', label: '枢纽园区' },
      { id: 'industry', label: '产业链协同' },
      { id: 'crossProvince', label: '跨省通道' },
      { id: 'ai', label: '智能服务' },
    ],
    mapTitle: [`${shortProvince}省内数字物流协同网络`, '地市连接 · 数据共享 · 服务调用 · 通道联通'],
    overviewCards: [
      { id: 'entities', label: '接入企业与机构', value: entities.toLocaleString('zh-CN'), unit: '家' },
      { id: 'systems', label: '接入业务系统', value: systems.toLocaleString('zh-CN'), unit: '个' },
      { id: 'resources', label: '可用数据资源', value: resources.toLocaleString('zh-CN'), unit: '项' },
      { id: 'auth', label: '已开通共享关系', value: shares.toLocaleString('zh-CN'), unit: '个' },
      { id: 'cities', label: '活跃地市', value: String(activeCities), unit: '个' },
      { id: 'parks', label: '重点园区/枢纽', value: String(parkCount), unit: '个' },
    ],
    elements: [
      { id: 'cities', label: '地市节点', count: network.nodes.length, countLabel: String(cityCount) },
      { id: 'parks', label: '枢纽园区', count: network.nodes.filter((node) => node.networkRole === 'park').length, countLabel: String(parkCount) },
      { id: 'enterprises', label: '重点企业', count: network.nodes.filter((node) => node.networkRole === 'logistics' || node.networkRole === 'shipper').length, countLabel: enterprises.toLocaleString('zh-CN') },
      { id: 'links', label: '省内协同线路', count: network.relations.length, countLabel: String(Math.round(shares * 0.086) + network.relations.length) },
      { id: 'crossProvince', label: '跨省通道', count: network.corridors.length, countLabel: String(network.corridors.length) },
      { id: 'services', label: '智能服务', count: network.nodes.filter((node) => node.networkRole === 'public').length, countLabel: String(services) },
    ],
    liveNetwork: {
      subjects: onlineSubjects,
      services,
      calls: `${calls.toFixed(1)}万`,
      status: '正常',
      timeliness: `${timeliness.toFixed(1)}%`,
      response: `${provinceMix(province, 0.5, 1.1, 29).toFixed(1)}s`,
    },
    // TOP5 必须单调递减，衰减系数固定，只让基数随省份浮动。
    products: PROVINCE_DIGITAL_PRODUCTS.map((name, index) => ({
      name,
      callsWan: Number((calls * provinceMix(province, 2.2, 2.9, 31) * (0.82 ** index)).toFixed(1)),
    })),
    sharingStats: [
      { label: '已共享数据', value: Math.round(resources * 0.036).toLocaleString('zh-CN'), unit: '项' },
      { label: '待处理申请', value: Math.max(6, Math.round(shares * 0.028)).toLocaleString('zh-CN'), unit: '项' },
      { label: '今日数据调用', value: `${calls.toFixed(1)}万`, unit: '次' },
    ],
    sharingSummary: [
      { label: '本月新增共享', value: `${Math.max(12, Math.round(resources * 0.011))}项` },
      { label: '共享成功率', value: `${successRate.toFixed(1)}%` },
    ],
    serviceOutcomes: [
      { label: '支撑运输任务', value: `${Math.round(entities * provinceMix(province, 0.52, 0.86, 33)).toLocaleString('zh-CN')}单` },
      { label: '异常提前发现', value: `${alerts}次` },
      { label: '跨主体协同', value: `${analysis.toLocaleString('zh-CN')}次` },
    ],
    events,
    ticker: [
      { id: 'active', label: '今日活跃主体', value: `${onlineSubjects.toLocaleString('zh-CN')} 家` },
      { id: 'updates', label: '今日数据更新', value: `${Math.round(updates)} 万条` },
      { id: 'sharing', label: '今日数据共享', value: `${calls.toFixed(1)} 万次` },
      { id: 'calls', label: '今日服务调用', value: `${(calls * 0.94).toFixed(1)} 万次` },
      { id: 'analysis', label: '今日智能分析', value: `${analysis.toLocaleString('zh-CN')} 次` },
      { id: 'alerts', label: '异常预警', value: `${alerts} 次` },
      { id: 'success', label: '服务成功率', value: `${successRate.toFixed(1)}%` },
      { id: 'status', label: '省网运行状态', value: '正常' },
    ],
    mapOverlays: {
      hubs: buildProvinceDigitalCallouts(province, network),
      corridors: network.corridors.map((corridor) => ({
        id: corridor.id,
        label: corridor.label,
        anchorNode: corridor.from,
        target: corridor.target,
      })),
    },
    digitalNetwork: network,
    provinceMeta: { cityCount, activeCities, hubCity, parkCount },
  };
};


export const layerCatalog = {
  infrastructure: [
    { id: 'axes', label: '六条主轴', count: 6, enabled: true },
    { id: 'corridors', label: '七条走廊', count: 7, enabled: true },
    { id: 'channels', label: '八条通道', count: 8, enabled: true },
    { id: 'hubs', label: '重点业务节点', count: 7, enabled: true },
  ],
  operation: [
    { id: 'cargoFlow', label: '多式联运交接', count: 8, enabled: true },
    { id: 'capacity', label: '运力匹配关系', count: 7, enabled: true },
    { id: 'tasks', label: '订单与协同', count: 11, enabled: true },
    { id: 'alerts', label: '异常链路', count: 1, enabled: true },
  ],
  digital: [
    // count 为沙盘可见要素数，countLabel 为全网口径规模，两者不同源。
    { id: 'connectors', label: '企业与机构', count: 5, countLabel: '2,856', enabled: true },
    { id: 'apiRelations', label: '平台与系统', count: 16, countLabel: '568', enabled: true },
    { id: 'epcis', label: '数据资源', count: 4, countLabel: '12,856', enabled: true },
    { id: 'contracts', label: '数据共享关系', count: 4, countLabel: '3,286', enabled: true },
    { id: 'corridors', label: '通道协同', count: 3, countLabel: '3', enabled: true },
    { id: 'ai', label: '智能服务', count: 5, countLabel: '126', enabled: true },
  ],
};

/** 交通线网与港口泊位按截至 2025 年底官方口径。枢纽、冷链基地取自国家发展改革委公布布局。 */
export const infrastructureDashboard = {
  heading: ['基础设施网络分析', '通道枢纽园区、交通线网与设施连通性'],
  modes: [
    { id: 'overview', label: '综合总览' },
    { id: 'rail', label: '铁路网络' },
    { id: 'road', label: '公路网络' },
    { id: 'water', label: '水运网络' },
    { id: 'air', label: '航空网络' },
    { id: 'hubs', label: '物流枢纽' },
    { id: 'parks', label: '园区基地' },
  ],
  overviewCards: [
    { id: 'nationalHubs', label: '国家物流枢纽', value: '229', unit: '个' },
    { id: 'ports', label: '港口泊位', value: '22,346', unit: '个' },
    { id: 'airports', label: '运输机场', value: '263', unit: '个' },
    { id: 'highways', label: '高速公路', value: '19.07', unit: '万公里' },
    { id: 'deepBerths', label: '万吨级泊位', value: '2,971', unit: '个' },
    { id: 'parks', label: '骨干冷链基地', value: '105', unit: '个' },
  ],
  layerToggles: [
    { id: 'majorRailways', label: '铁路网络' },
    { id: 'majorRoads', label: '公路网络' },
    { id: 'axes', label: '六轴骨架' },
    { id: 'corridors', label: '七条走廊' },
    { id: 'channels', label: '八条通道' },
    { id: 'nationalHubs', label: '物流枢纽' },
    { id: 'coldChainBases', label: '冷链枢纽' },
    { id: 'logisticsParks', label: '园区基地' },
  ],
  stats: [
    ['铁路里程', '16.5万公里'],
    ['公路里程', '550万公里'],
    ['内河航道', '12.87万公里'],
    ['沿海泊位', '5,806个'],
    ['内河泊位', '16,540个'],
    ['运输机场', '263个'],
  ],
  rankingLabel: '设施点数',
  rankingTabs: [
    { id: 'hubs', label: '枢纽' },
    { id: 'cold', label: '冷链' },
    { id: 'parks', label: '园区' },
    { id: 'total', label: '合计' },
  ],
  rankings: {
    hubs: [],
    cold: [],
    parks: [],
    total: [],
  },
  projects: [
    { name: '平陆运河', progress: 78, status: '建设中' },
    { name: '潍宿高铁', progress: 62, status: '建设中' },
    { name: '西部陆海新通道', progress: 64, status: '建设中' },
    { name: '国家物流枢纽补强', progress: 81, status: '建设中' },
  ],
  connectivity: {
    value: '87.6',
    regions: [['东部', '92.4'], ['中部', '86.1'], ['西部', '78.5'], ['东北', '83.2']],
  },
  mapOverlays: {
    hubs: [
      { id: 'PORT_SHANGHAI', name: '上海', anchor: 'right', volume: '国际枢纽港', tasks: '国家物流枢纽' },
      { id: 'HUB_CHENGDU', name: '成都', anchor: 'left', volume: '铁路港', tasks: '国家物流枢纽' },
    ],
  },
};

export const digitalDashboard = {
  heading: ['数字物流网络运行态势', '展示全国物流主体连接、数据共享、服务调用与智能协同情况'],
  modes: [
    { id: 'overview', label: '网络总览' },
    { id: 'connectors', label: '接入主体' },
    { id: 'apiRelations', label: '数据资源' },
    { id: 'contracts', label: '共享协同' },
    { id: 'epcis', label: '物流动态' },
    { id: 'ai', label: '智能服务' },
  ],
  overviewCards: [
    { id: 'entities', label: '接入企业与机构', value: '2,856', unit: '家' },
    { id: 'systems', label: '接入业务系统', value: '568', unit: '个' },
    { id: 'resources', label: '可用数据资源', value: '12,856', unit: '项' },
    { id: 'auth', label: '已开通共享关系', value: '3,286', unit: '个' },
  ],
  coverage: [
    { label: '今日活跃主体', value: '428家' },
    { label: '覆盖省份', value: '31个' },
  ],
  liveNetwork: {
    subjects: 568,
    services: 126,
    calls: '12.8万',
    status: '正常',
    timeliness: '99.6%',
    response: '0.8s',
  },
  // callsWan：今日调用量，单位万次；score 仅用于排行条长度。
  products: [
    { name: '物流状态查询', callsWan: 28.6, score: 100 },
    { name: '路径与时效分析', callsWan: 22.4, score: 78 },
    { name: '运力资源查询', callsWan: 18.9, score: 66 },
    { name: '运输异常预警', callsWan: 15.2, score: 53 },
    { name: '多式联运方案推荐', callsWan: 12.1, score: 42 },
  ],
  sharingStats: [
    { label: '已共享数据', value: '328', unit: '项' },
    { label: '待处理申请', value: '56', unit: '项' },
    { label: '今日数据调用', value: '18.6万', unit: '次' },
  ],
  sharingSummary: [
    { label: '本月新增共享', value: '126项' },
    { label: '共享成功率', value: '99.6%' },
  ],
  serviceOutcomes: [
    { label: '支撑运输任务', value: '1,286单' },
    { label: '数据重复利用', value: '3.8万次' },
    { label: '跨主体协同', value: '2,168次' },
  ],
  events: [
    { time: '16:37:01', type: '物流信息更新', detail: '某运输任务已到达目的节点' },
    { time: '16:36:45', type: '运输状态更新', detail: '运输车辆已进入下一节点' },
    { time: '16:36:18', type: '数据共享完成', detail: '企业已获取运输状态数据' },
    { time: '16:35:52', type: '异常提醒', detail: '预计到达时间发生变化' },
    { time: '16:35:31', type: '智能分析完成', detail: '系统已生成运输方案建议' },
    { time: '16:34:26', type: '新增企业接入', detail: '某物流企业完成网络接入' },
  ],
  ticker: [
    { id: 'active', label: '今日活跃主体', value: '568 家', delta: '较昨日 ▲ 28' },
    { id: 'updates', label: '今日数据更新', value: '286 万条', delta: '实时汇聚' },
    { id: 'sharing', label: '今日数据共享', value: '18.6 万次', delta: '跨主体流通' },
    { id: 'calls', label: '今日服务调用', value: '12.8 万次', delta: '较昨日 ▲ 2.4万' },
    { id: 'analysis', label: '今日智能分析', value: '3,286 次', delta: '支撑任务 1,286单' },
    { id: 'alerts', label: '异常预警', value: '86 次', delta: '提前发现' },
    { id: 'success', label: '服务成功率', value: '99.6%', delta: '平均响应 0.8s' },
    { id: 'status', label: '网络运行状态', value: '正常', delta: '数据更新及时' },
  ],
  mapOverlays: {
    hubs: [
      {
        id: 'DIG_NATIONAL_PLATFORM',
        name: '国家物流大数据平台',
        description: '全国物流数据汇聚与服务中心',
        anchor: 'right',
        stack: 'up',
        metrics: [['数据资源', '12,856项'], ['接入主体', '2,856家']],
      },
      {
        id: 'DIG_YANGTZE_PLATFORM',
        name: '华东物流平台',
        description: '区域物流主体与服务协同',
        anchor: 'left',
        stack: 'up',
        metrics: [['接入企业', '586家'], ['服务调用', '18.6万次']],
      },
      {
        id: 'DIG_NORTH_PLATFORM',
        name: '华北物流平台',
        description: '京津冀物流主体数据协同',
        anchor: 'left',
        stack: 'up',
        metrics: [['接入企业', '486家'], ['服务调用', '9.6万次']],
      },
      {
        id: 'DIG_GBA_PLATFORM',
        name: '大湾区物流平台',
        description: '外贸与跨境物流数据协同',
        anchor: 'left',
        stack: 'down',
        metrics: [['接入企业', '412家'], ['服务调用', '11.2万次']],
      },
    ],
    // 通道只用极简名牌标注，避免与平台浮标争夺地图空间。
    corridors: [
      { id: 'DIG_CORRIDOR_WEST_SEA', label: '西部陆海新通道', center: [107.30, 24.60] },
      { id: 'DIG_CORRIDOR_NORTHEAST_SEA', label: '东北陆海大通道', center: [124.60, 42.90] },
      { id: 'DIG_CORRIDOR_EURASIA', label: '新亚欧陆海联运通道', center: [94.60, 40.80] },
    ],
  },
};

/** 三层分解页：全国物流网络三层协同关系驾驶舱 */
export const explodedDashboard = {
  title: '全国物流网络三层协同关系',
  subtitle: '设施支撑运营 · 运营沉淀数据 · 数字反哺优化',
  status: '网络运行状态 · 稳定',
  layers: [
    {
      id: 'digital',
      name: '数字物流网',
      lead: '汇聚物流数据，提供共享服务与智能分析',
      metrics: [
        { label: '接入主体', value: '128.6万' },
        { label: '数据共享', value: '56.3亿条' },
        { label: '智能服务', value: '1,256项' },
      ],
    },
    {
      id: 'operation',
      name: '物流运营网',
      lead: '组织货源、运力、线路及跨主体协同',
      metrics: [
        { label: '运输任务', value: '18.7万单' },
        { label: '协同线路', value: '3.42万条' },
        { label: '联运组织', value: '2,156组' },
      ],
    },
    {
      id: 'infrastructure',
      name: '基础设施网',
      lead: '承载通道、枢纽、场站等物理物流能力',
      metrics: [
        { label: '骨干通道', value: '2.8万公里' },
        { label: '核心枢纽', value: '386个' },
        { label: '设施覆盖', value: '98.6%' },
      ],
    },
  ],
  relations: [
    { id: 'support', title: '① 基础支撑运营', detail: '通道、枢纽和节点为运输组织提供能力基础' },
    { id: 'mapping', title: '② 运营沉淀数据', detail: '运输任务持续产生订单、轨迹、状态和事件' },
    { id: 'feedback', title: '③ 数字反哺优化', detail: '监测、预测与智能分析优化路线、资源与调度' },
  ],
  loop: [
    { id: 'facility', label: '设施承载' },
    { id: 'business', label: '业务运行' },
    { id: 'data', label: '数据汇聚' },
    { id: 'analysis', label: '智能分析' },
    { id: 'feedback', label: '优化反馈' },
  ],
  links: [
    { id: 'feedback', label: '数字反哺', side: 'left', from: 'digital', to: 'operation' },
    { id: 'mapping', label: '业务数据沉淀', side: 'left', from: 'operation', to: 'digital' },
    { id: 'support', label: '能力供给', side: 'right', from: 'infrastructure', to: 'operation' },
  ],
  kpis: [
    { id: 'nodes', label: '基础设施节点', value: '3,860', delta: '+6.2%', tone: 'infra' },
    { id: 'tasks', label: '运行运输任务', value: '18.7万', delta: '+12.4%', tone: 'operation' },
    { id: 'updates', label: '今日数据更新', value: '2.46亿', delta: '+9.8%', tone: 'digital' },
    { id: 'sharing', label: '数据共享调用', value: '128.4万', delta: '+15.8%', tone: 'digital' },
    { id: 'analysis', label: '智能分析', value: '1,256项', delta: '+8.7%', tone: 'digital' },
    { id: 'efficiency', label: '三层协同效率', value: '89.6%', delta: '+7.6%', tone: 'operation' },
  ],
  legend: [
    { id: 'facility', label: '设施通道', style: 'infra' },
    { id: 'collab', label: '业务协同', style: 'operation' },
    { id: 'share', label: '数据共享', style: 'digital' },
    { id: 'feedback', label: '智能反馈', style: 'feedback' },
  ],
};
