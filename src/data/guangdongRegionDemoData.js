import {
  CORRIDOR_COLORS,
  REGION_DEMO_THEME,
} from './shandongRegionDemoData.js';

/**
 * 广东省区域物流平台 28 秒场景演示数据。
 *
 * 内容以“珠三角核心枢纽 + 沿海港口群 + 南北出省通道 + 东西向产业联动通道”为骨架，
 * 产业、枢纽与通道表述来自用户提供的广东物流通路总结。
 */

export const GUANGDONG_REGION_THEME = REGION_DEMO_THEME;

export const GUANGDONG_INDUSTRY_COLORS = {
  electronics: '#5FCFFF',
  auto: '#71D477',
  petrochemical: '#FFB65C',
  equipment: '#A77BFF',
  home: '#F47FD1',
  agriculture: '#D7E86A',
};

export const guangdongCities = [
  { id: 'guangzhou', name: '广州', lng: 113.26, lat: 23.13, role: 'core' },
  { id: 'shenzhen', name: '深圳', lng: 114.06, lat: 22.55, role: 'port' },
  { id: 'zhuhai', name: '珠海', lng: 113.58, lat: 22.27, role: 'port' },
  { id: 'shantou', name: '汕头', lng: 116.68, lat: 23.35, role: 'port' },
  { id: 'foshan', name: '佛山', lng: 113.12, lat: 23.02, role: 'core' },
  { id: 'shaoguan', name: '韶关', lng: 113.60, lat: 24.81, role: 'node' },
  { id: 'heyuan', name: '河源', lng: 114.70, lat: 23.74, role: 'node' },
  { id: 'meizhou', name: '梅州', lng: 116.12, lat: 24.29, role: 'node' },
  { id: 'huizhou', name: '惠州', lng: 114.42, lat: 23.11, role: 'logistics' },
  { id: 'shanwei', name: '汕尾', lng: 115.38, lat: 22.79, role: 'port' },
  { id: 'dongguan', name: '东莞', lng: 113.75, lat: 23.02, role: 'logistics' },
  { id: 'zhongshan', name: '中山', lng: 113.39, lat: 22.52, role: 'node' },
  { id: 'jiangmen', name: '江门', lng: 113.08, lat: 22.58, role: 'node' },
  { id: 'yangjiang', name: '阳江', lng: 111.98, lat: 21.86, role: 'port' },
  { id: 'zhanjiang', name: '湛江', lng: 110.36, lat: 21.27, role: 'port' },
  { id: 'maoming', name: '茂名', lng: 110.93, lat: 21.66, role: 'node' },
  { id: 'zhaoqing', name: '肇庆', lng: 112.47, lat: 23.05, role: 'logistics' },
  { id: 'qingyuan', name: '清远', lng: 113.06, lat: 23.68, role: 'node' },
  { id: 'chaozhou', name: '潮州', lng: 116.62, lat: 23.66, role: 'node' },
  { id: 'jieyang', name: '揭阳', lng: 116.37, lat: 23.55, role: 'node' },
  { id: 'yunfu', name: '云浮', lng: 112.04, lat: 22.93, role: 'node' },
];

export const guangdongLogisticsHubs = [
  { id: 'guangzhou', name: '广州枢纽', kind: 'core', appear: 9.0 },
  { id: 'shenzhen', name: '深圳港', kind: 'port', appear: 9.15, pulse: 15.0 },
  { id: 'foshan', name: '佛山', kind: 'core', appear: 9.3 },
  { id: 'dongguan', name: '东莞', kind: 'logistics', appear: 9.45 },
  { id: 'zhuhai', name: '珠海港', kind: 'port', appear: 9.6, pulse: 15.55 },
  { id: 'huizhou', name: '惠州港', kind: 'port', appear: 9.75, pulse: 16.0 },
  { id: 'shantou', name: '汕头港', kind: 'port', appear: 9.9, pulse: 16.35 },
  { id: 'zhanjiang', name: '湛江港', kind: 'port', appear: 10.05, pulse: 16.65 },
];

export const guangdongIndustries = [
  {
    id: 'electronics', name: '新一代电子信息', color: GUANGDONG_INDUSTRY_COLORS.electronics, start: 5.0,
    cities: ['shenzhen', 'dongguan', 'huizhou', 'guangzhou', 'zhuhai'],
    labelCoord: [115.00, 23.90], labelLines: ['新一代', '电子信息'], labelWidth: 3.6, labelHeight: 1.38, labelFontSize: 34,
  },
  {
    id: 'auto', name: '新能源汽车', color: GUANGDONG_INDUSTRY_COLORS.auto, start: 5.38,
    cities: ['guangzhou', 'shenzhen', 'foshan', 'zhaoqing', 'huizhou'],
    labelCoord: [112.45, 23.25], labelLines: ['新能源', '汽车'], labelWidth: 3.4, labelHeight: 1.38, labelFontSize: 34,
  },
  {
    id: 'petrochemical', name: '绿色石化与新材料', color: GUANGDONG_INDUSTRY_COLORS.petrochemical, start: 5.76,
    cities: ['huizhou', 'zhanjiang', 'maoming', 'guangzhou', 'jieyang'],
    labelCoord: [111.40, 21.70], labelLines: ['绿色石化', '与新材料'], labelWidth: 3.8, labelHeight: 1.38, labelFontSize: 32,
  },
  {
    id: 'equipment', name: '高端装备与智能制造', color: GUANGDONG_INDUSTRY_COLORS.equipment, start: 6.14,
    cities: ['guangzhou', 'shenzhen', 'foshan', 'dongguan', 'zhuhai', 'zhanjiang'],
    labelCoord: [112.70, 22.25], labelLines: ['高端装备', '与智能制造'], labelWidth: 4.0, labelHeight: 1.38, labelFontSize: 30,
  },
  {
    id: 'home', name: '智能家电与现代轻工', color: GUANGDONG_INDUSTRY_COLORS.home, start: 6.52,
    cities: ['foshan', 'zhuhai', 'zhongshan', 'shenzhen', 'huizhou', 'zhanjiang'],
    labelCoord: [114.75, 22.85], labelLines: ['智能家电', '与现代轻工'], labelWidth: 4.0, labelHeight: 1.38, labelFontSize: 30,
  },
  {
    id: 'agriculture', name: '现代农业与食品', color: GUANGDONG_INDUSTRY_COLORS.agriculture, start: 6.9,
    cities: ['zhanjiang', 'maoming', 'yangjiang', 'zhaoqing', 'qingyuan', 'shaoguan', 'meizhou'],
    labelCoord: [113.15, 24.25], labelLines: ['现代农业', '与食品'], labelWidth: 3.6, labelHeight: 1.38, labelFontSize: 32,
  },
];

export const guangdongIndustryClusters = [
  { industry: 'electronics', from: 'huizhou', to: 'shenzhen' },
  { industry: 'electronics', from: 'dongguan', to: 'shenzhen' },
  { industry: 'electronics', from: 'zhuhai', to: 'guangzhou' },
  { industry: 'auto', from: 'zhaoqing', to: 'foshan' },
  { industry: 'auto', from: 'foshan', to: 'guangzhou' },
  { industry: 'auto', from: 'huizhou', to: 'shenzhen' },
  { industry: 'petrochemical', from: 'maoming', to: 'zhanjiang' },
  { industry: 'petrochemical', from: 'jieyang', to: 'huizhou' },
  { industry: 'petrochemical', from: 'huizhou', to: 'guangzhou' },
  { industry: 'equipment', from: 'zhongshan', to: 'zhuhai' },
  { industry: 'equipment', from: 'jiangmen', to: 'foshan' },
  { industry: 'equipment', from: 'dongguan', to: 'shenzhen' },
  { industry: 'home', from: 'zhongshan', to: 'foshan' },
  { industry: 'home', from: 'huizhou', to: 'dongguan' },
  { industry: 'home', from: 'zhuhai', to: 'shenzhen' },
  { industry: 'agriculture', from: 'zhanjiang', to: 'guangzhou' },
  { industry: 'agriculture', from: 'qingyuan', to: 'guangzhou' },
  { industry: 'agriculture', from: 'meizhou', to: 'shenzhen' },
];

export const guangdongHubFlows = [
  { from: 'dongguan', to: 'shenzhen', industry: 'electronics' },
  { from: 'huizhou', to: 'shenzhen', industry: 'electronics' },
  { from: 'foshan', to: 'guangzhou', industry: 'auto' },
  { from: 'zhaoqing', to: 'guangzhou', industry: 'auto' },
  { from: 'maoming', to: 'zhanjiang', industry: 'petrochemical' },
  { from: 'jieyang', to: 'shantou', industry: 'petrochemical' },
  { from: 'zhongshan', to: 'zhuhai', industry: 'equipment' },
  { from: 'foshan', to: 'shenzhen', industry: 'home' },
  { from: 'qingyuan', to: 'guangzhou', industry: 'agriculture' },
  { from: 'zhanjiang', to: 'shenzhen', industry: 'agriculture' },
];

export const guangdongCorridors = [
  {
    id: 'north', name: '南北出省通道', mapLabel: '京广 / 京九通道', family: 'land',
    color: CORRIDOR_COLORS.land, core: CORRIDOR_COLORS.landCore, glow: CORRIDOR_COLORS.landGlow, onset: 11.0,
    path: [[113.26, 23.13], [113.06, 23.68], [113.60, 24.81], [113.42, 25.42]],
    labelCoord: [112.72, 24.72], externalLabel: '华中 · 京津冀', externalCoord: [114.48, 25.30],
  },
  {
    id: 'west', name: '西向产业联动', mapLabel: '珠江—西江通道', family: 'land',
    color: CORRIDOR_COLORS.land, core: CORRIDOR_COLORS.landCore, glow: CORRIDOR_COLORS.landGlow, onset: 11.7,
    path: [[113.26, 23.13], [112.47, 23.05], [112.04, 22.93], [110.28, 23.05]],
    labelCoord: [111.42, 22.72], externalLabel: '广西 · 西南', externalCoord: [110.10, 23.38],
  },
  {
    id: 'east', name: '东向沿海通道', mapLabel: '粤东沿海通道', family: 'land',
    color: CORRIDOR_COLORS.land, core: CORRIDOR_COLORS.landCore, glow: CORRIDOR_COLORS.landGlow, onset: 12.45,
    path: [[114.06, 22.55], [115.38, 22.79], [116.68, 23.35], [117.14, 24.10]],
    labelCoord: [116.05, 22.72], externalLabel: '海西 · 长三角', externalCoord: [116.92, 24.38],
  },
  {
    id: 'prd', name: '珠三角核心枢纽', mapLabel: '珠三角核心枢纽', family: 'port',
    color: CORRIDOR_COLORS.port, core: CORRIDOR_COLORS.portCore, glow: CORRIDOR_COLORS.portGlow, onset: 13.2,
    path: [[112.47, 23.05], [113.12, 23.02], [113.26, 23.13], [113.75, 23.02], [114.42, 23.11], [114.06, 22.55], [113.58, 22.27]],
    labelCoord: [113.42, 22.82],
  },
  {
    id: 'ports', name: '沿海港口群', mapLabel: '沿海港口群', family: 'port',
    color: CORRIDOR_COLORS.port, core: CORRIDOR_COLORS.portCore, glow: CORRIDOR_COLORS.portGlow, onset: 14.0,
    path: [[110.36, 21.27], [111.98, 21.86], [113.58, 22.27], [114.06, 22.55], [115.38, 22.79], [116.68, 23.35]],
    labelCoord: [112.15, 21.20],
  },
  {
    id: 'crexpress', name: '中欧班列', mapLabel: '中欧班列', family: 'cre',
    color: CORRIDOR_COLORS.cre, core: CORRIDOR_COLORS.creCore, glow: CORRIDOR_COLORS.creGlow, onset: 17.0,
    path: [[113.75, 23.02], [113.26, 23.13], [112.65, 23.55], [112.32, 24.20]],
    originLabel: '广州 · 深圳 · 东莞', originCoord: [113.86, 23.42],
    externalLabel: '中亚 · 欧洲', externalCoord: [111.92, 24.45], labelCoord: [112.34, 23.90],
  },
];

export const guangdongSeaRoutes = [
  { id: 'sz_asia', from: 'shenzhen', label: '东南亚', color: CORRIDOR_COLORS.sea, target: [115.76, 21.05], onset: 15.2 },
  { id: 'zh_jpkr', from: 'zhuhai', label: '日韩', color: CORRIDOR_COLORS.sea, target: [114.64, 20.52], onset: 15.8 },
  { id: 'zj_eu', from: 'zhanjiang', label: '中东 · 欧洲', color: CORRIDOR_COLORS.sea, target: [109.92, 20.18], onset: 16.4 },
  { id: 'sz_eu_us', from: 'shenzhen', label: '欧美', color: CORRIDOR_COLORS.sea, target: [117.10, 20.18], onset: 16.75 },
];

export const guangdongSeaLaneLabel = { text: '国际海运 / 航空货运', coord: [113.02, 20.50], onset: 16.6 };

export const guangdongOtherProvinceCapitals = [
  { province: '湖南', name: '长沙', lng: 112.98, lat: 25.32 },
  { province: '江西', name: '南昌', lng: 115.86, lat: 25.18 },
  { province: '福建', name: '福州', lng: 117.10, lat: 24.72 },
  { province: '广西', name: '南宁', lng: 109.94, lat: 23.24 },
  { province: '海南', name: '海口', lng: 110.35, lat: 20.22 },
  { province: '香港', name: '香港', lng: 114.17, lat: 22.32 },
  { province: '澳门', name: '澳门', lng: 113.54, lat: 22.20 },
];

export const GUANGDONG_DEMO_STATS = {
  cityCount: 21,
  featuredHubCount: 8,
  industryCount: 6,
};

export const guangdongKpiMetrics = [
  ['城市节点', `${GUANGDONG_DEMO_STATS.cityCount}个`],
  ['重点枢纽 / 港口', `${GUANGDONG_DEMO_STATS.featuredHubCount}个`],
  ['重点产业', `${GUANGDONG_DEMO_STATS.industryCount}类`],
];

export const guangdongStages = [
  { id: 'gd_focus', start: 0, end: 3, title: '广东省域', subtitle: '珠三角核心枢纽、沿海港口群与全省城市节点' },
  { id: 'gd_industry', start: 3, end: 9, title: '产业集群', subtitle: '电子信息、新能源汽车、绿色石化、高端装备、智能家电与现代农业向珠三角及沿海枢纽集聚' },
  { id: 'gd_corridors', start: 9, end: 17, title: '物流通道', subtitle: '南北联通京津冀与华中，东西串联粤东粤西及西南，沿海港口群面向国际市场' },
  { id: 'gd_network', start: 17, end: 23, title: '通道成网', subtitle: '公铁水空、粤港澳跨境物流与中欧班列联为一体' },
  { id: 'gd_overview', start: 23, end: 28, title: '全省格局', subtitle: '珠三角核心枢纽带动全省、衔接全国、联通全球' },
];

export const guangdongChapters = [
  { id: 'gd_ch_focus', index: '01', title: '省域', stageIds: ['gd_focus'] },
  { id: 'gd_ch_industry', index: '02', title: '产业', stageIds: ['gd_industry'] },
  { id: 'gd_ch_corridors', index: '03', title: '通道', stageIds: ['gd_corridors'] },
  { id: 'gd_ch_network', index: '04', title: '成网', stageIds: ['gd_network'] },
  { id: 'gd_ch_overview', index: '05', title: '总览', stageIds: ['gd_overview'] },
];

export const guangdongRegionDemo = {
  id: 'GUANGDONG_REGION_DEMO',
  title: '广东省区域物流平台',
  duration: 28,
  visualTimeOffset: 2,
  province: '广东',
  cities: guangdongCities,
  industries: guangdongIndustries,
  industryClusters: guangdongIndustryClusters,
  hubFlows: guangdongHubFlows,
  hubs: guangdongLogisticsHubs,
  corridors: guangdongCorridors,
  seaRoutes: guangdongSeaRoutes,
  seaLaneLabel: guangdongSeaLaneLabel,
  otherProvinceCapitals: guangdongOtherProvinceCapitals,
  summaryMetrics: guangdongKpiMetrics.map(([label, value]) => ({ label, value })),
  summarySlogan: ['广东省区域物流平台', '珠三角核心枢纽带动全省、衔接全国、联通全球'],
  stages: guangdongStages,
  chapters: guangdongChapters,
  storyPresentation: {
    shipment: {
      cargo: '重点枢纽 / 港口', quantity: GUANGDONG_DEMO_STATS.featuredHubCount, unit: '个',
      origin: '广东', destination: '全国及国际市场', serviceLevel: `${GUANGDONG_DEMO_STATS.cityCount}个地市`,
    },
    flow: { originProvince: '广东', destinationProvince: '全国及国际市场' },
    ui: {
      regionDemo: true,
      captionIndex: '广东省区域物流平台',
      captionTitle: '广东省区域物流平台',
      captionSubtitle: '珠三角核心枢纽带动全省、衔接全国、联通全球',
      liveCaption: 'stage',
      completeIndex: '全省格局',
      completeCaptionIndex: '广东省区域物流平台',
      shipmentLabels: { cargo: '重点枢纽', route: '覆盖范围', requirement: '城市节点' },
      completionMetrics: guangdongKpiMetrics,
      stageMetrics: {
        gd_focus: guangdongKpiMetrics,
        gd_industry: [['重点产业', '6类'], ['产业核心', '广深佛莞及沿海城市'], ['货流方向', '向珠三角与港口集聚']],
        gd_corridors: [['南北通道', '京广 / 京九'], ['东西联动', '粤东 / 粤西 / 西南'], ['国际通道', '港口群 + 班列 + 航空']],
        gd_network: guangdongKpiMetrics,
        gd_overview: guangdongKpiMetrics,
      },
    },
    result: {
      title: '广东省区域物流平台',
      subtitle: '珠三角核心枢纽带动全省、衔接全国、联通全球',
      productionImpact: '全省物流一张图', actualDuration: '28s', eventCount: 0,
    },
  },
};
