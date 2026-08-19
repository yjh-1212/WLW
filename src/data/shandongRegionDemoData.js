/**
 * 山东区域物流平台 30 秒场景演示数据
 *
 * 与北粮南运、汽车出海完全隔离，使用独立数据结构驱动 ShandongRegionDemoController。
 * 5–11S 只讲产业聚集；11–19S 才展开物流通道。两阶段不互相叠线。
 */

export const REGION_DEMO_THEME = {
  page: '#050C18',
  land: '#071427',
  landOutline: '#405875',
  shandong: '#0E718D',
  shandongHi: '#1495AB',
  shandongOutline: '#4DDBE8',
  cityBorder: '#3B98AA',
  ocean: '#16243A',
  cityLabel: '#B9D5DD',
  outerLabel: '#8395AA',
  hubFill: '#E9FBFF',
  hubRing: '#4CE5F2',
  coreHub: '#FFE18A',
  logisticsHub: '#DDFBFF',
  port: '#26E8CE',
};

export const INDUSTRY_COLORS = {
  chem: '#FFB65C',
  equip: '#54AFFF',
  energy: '#A77BFF',
  ocean: '#25E2CB',
  agri: '#71D477',
};

/** 对齐数字网「协同关系」四色线：共享实线、调用实线、协同虚线、大通道虚线 */
export const CORRIDOR_COLORS = {
  land: '#5fcfff',
  landCore: '#d4f4ff',
  landGlow: '#5fcfff',
  port: '#6df0a8',
  portCore: '#d4ffe8',
  portGlow: '#6df0a8',
  sea: '#ba8cff',
  cre: '#ffb45c',
  creCore: '#ffe4c4',
  creGlow: '#ffb45c',
};

export const CORRIDOR_LINE_STYLE = {
  land: { width: 2.8, opacity: 0.92, dashed: true, dashSize: 0.42, gapSize: 0.22, packetCount: 3, packetSize: 0.05, speed: 0.034 },
  port: { width: 3.1, opacity: 0.94, dashed: true, dashSize: 0.36, gapSize: 0.20, packetCount: 3, packetSize: 0.052, speed: 0.038 },
  sea: { width: 2.8, opacity: 0.92, dashed: true, dashSize: 0.52, gapSize: 0.46, packetCount: 3, packetSize: 0.05, speed: 0.036 },
  cre: { width: 3.4, opacity: 0.96, dashed: true, dashSize: 1.15, gapSize: 0.42, packetCount: 4, packetSize: 0.058, speed: 0.028 },
};

// ─── 城市节点 ──────────────────────────────────────────
export const shandongCities = [
  { id: 'jinan', name: '济南', lng: 117.00, lat: 36.67, role: 'core' },
  { id: 'qingdao', name: '青岛', lng: 120.38, lat: 36.07, role: 'port' },
  { id: 'yantai', name: '烟台', lng: 121.45, lat: 37.46, role: 'port' },
  { id: 'weifang', name: '潍坊', lng: 119.16, lat: 36.71, role: 'logistics' },
  { id: 'zibo', name: '淄博', lng: 118.05, lat: 36.81, role: 'node' },
  { id: 'linyi', name: '临沂', lng: 118.36, lat: 35.10, role: 'core' },
  { id: 'jining', name: '济宁', lng: 116.59, lat: 35.41, role: 'node' },
  { id: 'rizhao', name: '日照', lng: 119.53, lat: 35.42, role: 'port' },
  { id: 'dongying', name: '东营', lng: 118.67, lat: 37.43, role: 'node' },
  { id: 'weihai', name: '威海', lng: 122.12, lat: 37.51, role: 'node' },
  { id: 'dezhou', name: '德州', lng: 116.36, lat: 37.45, role: 'node' },
  { id: 'taian', name: '泰安', lng: 117.03, lat: 36.00, role: 'node' },
  { id: 'liaocheng', name: '聊城', lng: 115.89, lat: 36.46, role: 'node' },
  { id: 'heze', name: '菏泽', lng: 115.48, lat: 35.23, role: 'node' },
  { id: 'zaozhuang', name: '枣庄', lng: 117.32, lat: 34.81, role: 'node' },
  { id: 'binzhou', name: '滨州', lng: 118.03, lat: 37.38, role: 'node' },
];

/** 国家物流枢纽所在城市（8 座，对应设施库 unique city，非演示点位） */
export const logisticsHubs = [
  { id: 'jinan', name: '济南', kind: 'core', appear: 9.0 },
  { id: 'qingdao', name: '青岛港', kind: 'port', appear: 9.15, pulse: 15.0 },
  { id: 'yantai', name: '烟台港', kind: 'port', appear: 9.3, pulse: 16.15 },
  { id: 'weifang', name: '潍坊', kind: 'logistics', appear: 9.45 },
  { id: 'rizhao', name: '日照港', kind: 'port', appear: 9.6, pulse: 15.55 },
  { id: 'linyi', name: '临沂', kind: 'core', appear: 9.75 },
  { id: 'jining', name: '济宁', kind: 'port', appear: 9.9 },
  { id: 'zibo', name: '淄博', kind: 'logistics', appear: 10.05 },
];

// ─── 重点产业（5–11 S）：高端化工、高端装备、新能源锂电、现代海洋、现代农业 ───
export const shandongIndustries = [
  {
    id: 'chem',
    name: '高端化工',
    color: INDUSTRY_COLORS.chem,
    start: 5.0,
    cities: ['dongying', 'zibo', 'weifang', 'binzhou', 'heze'],
    labelCoord: [118.32, 37.18],
  },
  {
    id: 'equip',
    name: '高端装备',
    color: INDUSTRY_COLORS.equip,
    start: 5.45,
    cities: ['jinan', 'qingdao', 'weifang', 'linyi', 'zibo', 'rizhao'],
    labelCoord: [118.88, 35.78],
  },
  {
    id: 'energy',
    name: '新能源锂电',
    color: INDUSTRY_COLORS.energy,
    start: 5.9,
    cities: ['zaozhuang', 'jining', 'binzhou', 'dongying', 'qingdao', 'jinan'],
    labelCoord: [117.05, 36.22],
  },
  {
    id: 'ocean',
    name: '海洋产业',
    color: INDUSTRY_COLORS.ocean,
    start: 6.35,
    cities: ['qingdao', 'yantai', 'weihai', 'rizhao'],
    labelCoord: [121.88, 36.52],
  },
  {
    id: 'agri',
    name: '现代农业',
    color: INDUSTRY_COLORS.agri,
    start: 6.8,
    cities: ['weifang', 'yantai', 'linyi', 'heze', 'qingdao', 'jinan'],
    labelCoord: [116.42, 34.78],
  },
];

// 7–9S：园区 / 产地短弧，周边城市 → 区域核心
export const industryClusters = [
  { industry: 'chem', from: 'dongying', to: 'zibo' },
  { industry: 'chem', from: 'weifang', to: 'zibo' },
  { industry: 'chem', from: 'binzhou', to: 'zibo' },
  { industry: 'chem', from: 'heze', to: 'zibo' },
  { industry: 'equip', from: 'zibo', to: 'jinan' },
  { industry: 'equip', from: 'jinan', to: 'weifang' },
  { industry: 'equip', from: 'linyi', to: 'weifang' },
  { industry: 'equip', from: 'rizhao', to: 'qingdao' },
  { industry: 'energy', from: 'zaozhuang', to: 'jining' },
  { industry: 'energy', from: 'binzhou', to: 'dongying' },
  { industry: 'energy', from: 'jining', to: 'jinan' },
  { industry: 'energy', from: 'dongying', to: 'qingdao' },
  { industry: 'ocean', from: 'weihai', to: 'yantai' },
  { industry: 'ocean', from: 'yantai', to: 'qingdao' },
  { industry: 'ocean', from: 'rizhao', to: 'qingdao' },
  { industry: 'agri', from: 'heze', to: 'linyi' },
  { industry: 'agri', from: 'yantai', to: 'weifang' },
  { industry: 'agri', from: 'weifang', to: 'qingdao' },
];

// 9–11S：化工出海、装备集港、锂电整车、农产品加工向枢纽汇聚
export const hubFlows = [
  { from: 'zibo', to: 'qingdao', industry: 'chem' },
  { from: 'dongying', to: 'qingdao', industry: 'chem' },
  { from: 'weifang', to: 'rizhao', industry: 'chem' },
  { from: 'weifang', to: 'qingdao', industry: 'equip' },
  { from: 'jinan', to: 'qingdao', industry: 'equip' },
  { from: 'jining', to: 'qingdao', industry: 'energy' },
  { from: 'binzhou', to: 'yantai', industry: 'energy' },
  { from: 'linyi', to: 'qingdao', industry: 'agri' },
  { from: 'heze', to: 'jinan', industry: 'agri' },
];

// ─── 重点物流通道（11–19S 分时点亮，4 色）──────────────
export const shandongCorridors = [
  {
    id: 'north',
    name: '北向京津冀',
    mapLabel: '北向京津冀',
    family: 'land',
    color: CORRIDOR_COLORS.land,
    core: CORRIDOR_COLORS.landCore,
    glow: CORRIDOR_COLORS.landGlow,
    onset: 11.0,
    path: [[117.00, 36.67], [116.36, 37.45], [116.48, 38.22]],
    labelCoord: [116.08, 37.78],
    externalLabel: '京津冀',
    externalCoord: [116.42, 38.48],
  },
  {
    id: 'south',
    name: '南向长三角',
    mapLabel: '南向长三角',
    family: 'land',
    color: CORRIDOR_COLORS.land,
    core: CORRIDOR_COLORS.landCore,
    glow: CORRIDOR_COLORS.landGlow,
    onset: 11.7,
    path: [[118.36, 35.10], [117.55, 34.52], [117.18, 34.12]],
    labelCoord: [117.42, 34.52],
    externalLabel: '长三角',
    externalCoord: [117.12, 33.92],
  },
  {
    id: 'west',
    name: '西向中原',
    mapLabel: '西向中原',
    family: 'land',
    color: CORRIDOR_COLORS.land,
    core: CORRIDOR_COLORS.landCore,
    glow: CORRIDOR_COLORS.landGlow,
    onset: 13.0,
    path: [[116.59, 35.41], [115.48, 35.23], [114.72, 34.88]],
    labelCoord: [115.22, 34.92],
    externalLabel: '中原',
    externalCoord: [114.62, 34.70],
  },
  {
    id: 'jiaodong',
    name: '胶东出海',
    mapLabel: '胶东出海',
    family: 'port',
    color: CORRIDOR_COLORS.port,
    core: CORRIDOR_COLORS.portCore,
    glow: CORRIDOR_COLORS.portGlow,
    onset: 13.5,
    path: [[118.67, 37.43], [118.05, 36.81], [119.16, 36.71], [120.38, 36.07]],
    labelCoord: [119.22, 36.48],
  },
  {
    id: 'southwest',
    name: '鲁西南出海',
    mapLabel: '鲁西南出海',
    family: 'port',
    color: CORRIDOR_COLORS.port,
    core: CORRIDOR_COLORS.portCore,
    glow: CORRIDOR_COLORS.portGlow,
    onset: 14.05,
    path: [[116.59, 35.41], [118.36, 35.10], [119.53, 35.42]],
    labelCoord: [117.72, 34.92],
  },
  {
    id: 'crexpress',
    name: '中欧班列',
    mapLabel: '中欧班列',
    family: 'cre',
    color: CORRIDOR_COLORS.cre,
    core: CORRIDOR_COLORS.creCore,
    glow: CORRIDOR_COLORS.creGlow,
    onset: 17.0,
    path: [[117.00, 36.67], [115.90, 36.10], [115.20, 35.55], [114.68, 35.18]],
    originLabel: '济南国际陆港',
    originCoord: [116.62, 36.92],
    externalLabel: '中亚 · 欧洲',
    externalCoord: [114.58, 35.02],
  },
];

// 15–17S：港口脉冲后，海运弧线从山东向外长出
export const shandongSeaRoutes = [
  {
    id: 'qd_kr', from: 'qingdao', label: '日韩', color: CORRIDOR_COLORS.sea,
    target: [123.18, 36.38], onset: 15.25,
  },
  {
    id: 'rz_sea', from: 'rizhao', label: '东南亚', color: CORRIDOR_COLORS.sea,
    target: [121.18, 34.42], onset: 15.85,
  },
  {
    id: 'yt_eu', from: 'yantai', label: '欧洲', color: CORRIDOR_COLORS.sea,
    target: [123.38, 37.72], onset: 16.45,
  },
];

export const seaLaneLabel = {
  text: '国际海运',
  coord: [122.55, 35.55],
  onset: 16.6,
};

// 外省省会（不含济南，山东市内标签已覆盖）
export const otherProvinceCapitals = [
  { province: '北京', name: '北京', lng: 116.41, lat: 39.90 },
  { province: '天津', name: '天津', lng: 117.20, lat: 39.08 },
  { province: '河北', name: '石家庄', lng: 114.51, lat: 38.04 },
  { province: '山西', name: '太原', lng: 112.55, lat: 37.86 },
  { province: '内蒙古', name: '呼和浩特', lng: 111.75, lat: 40.84 },
  { province: '辽宁', name: '沈阳', lng: 123.43, lat: 41.80 },
  { province: '吉林', name: '长春', lng: 125.32, lat: 43.89 },
  { province: '黑龙江', name: '哈尔滨', lng: 126.63, lat: 45.75 },
  { province: '上海', name: '上海', lng: 121.47, lat: 31.23 },
  { province: '江苏', name: '南京', lng: 118.80, lat: 32.06 },
  { province: '浙江', name: '杭州', lng: 120.15, lat: 30.27 },
  { province: '安徽', name: '合肥', lng: 117.28, lat: 31.86 },
  { province: '福建', name: '福州', lng: 119.30, lat: 26.08 },
  { province: '江西', name: '南昌', lng: 115.86, lat: 28.68 },
  { province: '河南', name: '郑州', lng: 113.63, lat: 34.75 },
  { province: '湖北', name: '武汉', lng: 114.30, lat: 30.59 },
  { province: '湖南', name: '长沙', lng: 112.98, lat: 28.19 },
  { province: '广东', name: '广州', lng: 113.26, lat: 23.13 },
  { province: '广西', name: '南宁', lng: 108.32, lat: 22.82 },
  { province: '海南', name: '海口', lng: 110.35, lat: 20.02 },
  { province: '重庆', name: '重庆', lng: 106.55, lat: 29.56 },
  { province: '四川', name: '成都', lng: 104.07, lat: 30.67 },
  { province: '贵州', name: '贵阳', lng: 106.71, lat: 26.60 },
  { province: '云南', name: '昆明', lng: 102.71, lat: 25.04 },
  { province: '西藏', name: '拉萨', lng: 91.13, lat: 29.66 },
  { province: '陕西', name: '西安', lng: 108.95, lat: 34.27 },
  { province: '甘肃', name: '兰州', lng: 103.83, lat: 36.06 },
  { province: '青海', name: '西宁', lng: 101.78, lat: 36.62 },
  { province: '宁夏', name: '银川', lng: 106.27, lat: 38.47 },
  { province: '新疆', name: '乌鲁木齐', lng: 87.62, lat: 43.83 },
];

export const layerDescriptions = [
  { layer: 'infrastructure', title: '基础设施物流网', subtitle: '港口、铁路、高速、物流枢纽', tagline: '有什么资源', color: '#4ecdc4' },
  { layer: 'operation', title: '物流运营网', subtitle: '货流、班列、船期、车辆、运输任务', tagline: '物流怎么跑', color: '#c084fc' },
  { layer: 'digital', title: '数字物流网', subtitle: '产业、订单、运力、港口、铁路等数据连接', tagline: '数据怎么协同', color: '#60a5fa' },
];

export const SHANDONG_REAL_STATS = {
  cityCount: 16,
  nationalHubCities: 8,
  manufacturingClusters: 6,
};

export const shandongKpiMetrics = [
  ['城市节点', `${SHANDONG_REAL_STATS.cityCount}个`],
  ['国家物流枢纽', `${SHANDONG_REAL_STATS.nationalHubCities}个`],
  ['国家先进制造业集群', `${SHANDONG_REAL_STATS.manufacturingClusters}个`],
];

export const summaryMetrics = [
  { label: '城市节点', value: `${SHANDONG_REAL_STATS.cityCount}个` },
  { label: '国家物流枢纽', value: `${SHANDONG_REAL_STATS.nationalHubCities}个` },
  { label: '国家先进制造业集群', value: `${SHANDONG_REAL_STATS.manufacturingClusters}个` },
];

export const summarySlogan = [
  '山东省区域物流平台',
  '一张图汇聚全省物流资源，一张网连接国内国际物流通道',
];

export const shandongStages = [
  { id: 'sd_focus', start: 0, end: 5, title: '山东省域', subtitle: '全省物流资源与周边通道格局' },
  { id: 'sd_industry', start: 5, end: 11, title: '产业集群', subtitle: '高端化工、高端装备、新能源汽车及锂电、现代海洋、现代农业与食品向济南、临沂、青岛、日照聚集' },
  { id: 'sd_corridors', start: 11, end: 19, title: '物流通道', subtitle: '北接京津冀，南联长三角，西通中原，东出青岛、日照、烟台港' },
  { id: 'sd_network', start: 19, end: 25, title: '通道成网', subtitle: '国内陆路、港口集疏运与国际通道联为一体' },
  { id: 'sd_overview', start: 25, end: 30, title: '全省格局', subtitle: '一张图汇聚全省物流资源，一张网连接国内国际通道' },
];

export const shandongChapters = [
  { id: 'ch_focus', index: '01', title: '省域', stageIds: ['sd_focus'] },
  { id: 'ch_industry', index: '02', title: '产业', stageIds: ['sd_industry'] },
  { id: 'ch_corridors', index: '03', title: '通道', stageIds: ['sd_corridors'] },
  { id: 'ch_network', index: '04', title: '成网', stageIds: ['sd_network'] },
  { id: 'ch_overview', index: '05', title: '总览', stageIds: ['sd_overview'] },
];

export const shandongRegionDemo = {
  id: 'SHANDONG_REGION_DEMO',
  title: '山东区域物流平台',
  duration: 30,
  province: '山东',
  cities: shandongCities,
  industries: shandongIndustries,
  industryClusters,
  hubFlows,
  hubs: logisticsHubs,
  corridors: shandongCorridors,
  seaRoutes: shandongSeaRoutes,
  seaLaneLabel,
  otherProvinceCapitals,
  layerDescriptions,
  summaryMetrics,
  summarySlogan,
  stages: shandongStages,
  chapters: shandongChapters,
};
