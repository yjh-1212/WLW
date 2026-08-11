export const demoEntities = [
  {
    id: 'PORT_YINGKOU', name: '营口港', type: 'port', province: '辽宁', mapPoint: [1014.726, 475.5],
    longitude: 122.22, latitude: 40.65, coordinate_system: 'WGS84', source_type: 'demo',
    source_ref: 'demo://entity/PORT_YINGKOU', verified_status: 'demo', effective_from: '2026-08-01',
    infrastructure: { level: '国家物流枢纽', lines: 6, capacity: '1.8 亿吨/年', status: '正常' },
    operation: { throughput: '38.6 万吨', tasks: 126, load: 78, status: '繁忙' },
    digital: { connectors: 18, resources: 42, apiHealth: 99.96, latestEvent: '到港确认' },
  },
  {
    id: 'HUB_ZHENGZHOU', name: '郑州国家物流枢纽', type: 'hub', province: '河南', mapPoint: [875.612, 613.167],
    longitude: 113.62, latitude: 34.75, coordinate_system: 'WGS84', source_type: 'demo',
    source_ref: 'demo://entity/HUB_ZHENGZHOU', verified_status: 'demo', effective_from: '2026-08-01',
    infrastructure: { level: '陆港型枢纽', lines: 11, capacity: '540 万标箱/年', status: '正常' },
    operation: { throughput: '12.4 万吨', tasks: 208, load: 64, status: '顺畅' },
    digital: { connectors: 27, resources: 69, apiHealth: 99.91, latestEvent: '班列发运' },
  },
  {
    id: 'PORT_SHANGHAI', name: '上海港', type: 'port', province: '上海', mapPoint: [1002.594, 695.3],
    longitude: 121.47, latitude: 31.23, coordinate_system: 'WGS84', source_type: 'demo',
    source_ref: 'demo://entity/PORT_SHANGHAI', verified_status: 'demo', effective_from: '2026-08-01',
    infrastructure: { level: '国际枢纽港', lines: 14, capacity: '5000 万标箱/年', status: '正常' },
    operation: { throughput: '51.8 万吨', tasks: 346, load: 82, status: '繁忙' },
    digital: { connectors: 41, resources: 128, apiHealth: 99.98, latestEvent: '装船完成' },
  },
  {
    id: 'HUB_CHENGDU', name: '成都国际铁路港', type: 'rail-hub', province: '四川', mapPoint: [720.971, 708.367],
    longitude: 104.06, latitude: 30.67, coordinate_system: 'WGS84', source_type: 'demo',
    source_ref: 'demo://entity/HUB_CHENGDU', verified_status: 'demo', effective_from: '2026-08-01',
    infrastructure: { level: '国家物流枢纽', lines: 9, capacity: '260 万标箱/年', status: '正常' },
    operation: { throughput: '9.6 万吨', tasks: 187, load: 71, status: '顺畅' },
    digital: { connectors: 23, resources: 58, apiHealth: 99.88, latestEvent: '换装完成' },
  },
  {
    id: 'PORT_GUANGZHOU', name: '广州港南沙港区', type: 'port', province: '广东', mapPoint: [876.583, 896.667],
    longitude: 113.68, latitude: 22.60, coordinate_system: 'WGS84', source_type: 'demo',
    source_ref: 'demo://entity/PORT_GUANGZHOU', verified_status: 'demo', effective_from: '2026-08-01',
    infrastructure: { level: '国际枢纽港', lines: 12, capacity: '2800 万标箱/年', status: '正常' },
    operation: { throughput: '44.2 万吨', tasks: 281, load: 74, status: '顺畅' },
    digital: { connectors: 36, resources: 96, apiHealth: 99.94, latestEvent: '预计到达更新' },
  },
  {
    id: 'HUB_WUHAN', name: '武汉阳逻港', type: 'port', province: '湖北', mapPoint: [890.98, 708.6],
    longitude: 114.57, latitude: 30.66, coordinate_system: 'WGS84', source_type: 'demo',
    source_ref: 'demo://entity/HUB_WUHAN', verified_status: 'demo', effective_from: '2026-08-01',
    infrastructure: { level: '港口型枢纽', lines: 8, capacity: '500 万标箱/年', status: '正常' },
    operation: { throughput: '8.1 万吨', tasks: 94, load: 57, status: '顺畅' },
    digital: { connectors: 16, resources: 37, apiHealth: 99.86, latestEvent: '多式联运交接' },
  },
  {
    id: 'HUB_SONGYUAN', name: '松原粮食物流节点', type: 'grain-hub', province: '吉林', mapPoint: [1056.783, 370.733],
    longitude: 124.82, latitude: 45.14, coordinate_system: 'WGS84', source_type: 'demo',
    source_ref: 'demo://entity/HUB_SONGYUAN', verified_status: 'demo', effective_from: '2026-08-01',
    infrastructure: { level: '粮食物流节点', lines: 5, capacity: '860 万吨/年', status: '正常' },
    operation: { throughput: '6.8 万吨', tasks: 73, load: 61, status: '顺畅' },
    digital: { connectors: 12, resources: 31, apiHealth: 99.92, latestEvent: '粮源集结完成' },
  },
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

export const layerCatalog = {
  infrastructure: [
    { id: 'axes', label: '六条主轴', count: 6, enabled: true },
    { id: 'corridors', label: '七条走廊', count: 7, enabled: true },
    { id: 'channels', label: '八条通道', count: 8, enabled: true },
    { id: 'hubs', label: '国家物流枢纽', count: 132, enabled: true },
    { id: 'railway', label: '铁路骨架', count: 18, enabled: true },
  ],
  operation: [
    { id: 'cargoFlow', label: '全国货物流向', count: 24, enabled: true },
    { id: 'capacity', label: '实时运力', count: 386, enabled: true },
    { id: 'tasks', label: '运输任务', count: 1264, enabled: true },
    { id: 'alerts', label: '风险异常', count: 7, enabled: true },
  ],
  digital: [
    { id: 'connectors', label: '企业连接器', count: 896, enabled: true },
    { id: 'apiRelations', label: 'API 调用关系', count: 2148, enabled: true },
    { id: 'epcis', label: 'EPCIS 事件', count: 9361, enabled: true },
    { id: 'ai', label: 'AI 调度能力', count: 28, enabled: true },
  ],
};
