import {
  CORRIDOR_COLORS,
  REGION_DEMO_THEME,
} from './shandongRegionDemoData.js';

/**
 * 广东省区域物流平台 28 秒场景演示数据。
 *
 * 产业、货类、枢纽、通道、运输方式与物流能力需求均以用户上传的广东产业运输组合截图为主。
 */

export const GUANGDONG_REGION_THEME = REGION_DEMO_THEME;

export const GUANGDONG_INDUSTRY_COLORS = {
  electronics: '#5FCFFF',
  autoEquipment: '#A77BFF',
  petrochemical: '#FFB65C',
  biomedicine: '#F47FD1',
  agriFood: '#D7E86A',
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
  { id: 'guangzhou', name: '广州枢纽', kind: 'core', appear: 9.0, showLabel: false },
  { id: 'shenzhen', name: '深圳港', kind: 'port', appear: 9.15, pulse: 15.0 },
  { id: 'foshan', name: '佛山', kind: 'core', appear: 9.3, showLabel: false },
  { id: 'dongguan', name: '东莞', kind: 'logistics', appear: 9.45, showLabel: false },
  { id: 'zhuhai', name: '珠海港', kind: 'port', appear: 9.6, pulse: 15.55, showLabel: false },
  { id: 'huizhou', name: '惠州港', kind: 'port', coord: [114.70, 22.74], labelCoord: [115.02, 22.66], appear: 9.75, pulse: 16.0, showLabel: false },
  { id: 'shantou', name: '汕头港', kind: 'port', appear: 9.9, pulse: 16.35, showLabel: false },
  { id: 'zhanjiang', name: '湛江港', kind: 'port', coord: [110.40, 21.18], appear: 10.05, pulse: 16.65 },
  { id: 'maoming-port', name: '茂名港', kind: 'port', coord: [111.02, 21.45], labelCoord: [111.18, 21.30], appear: 10.1, pulse: 16.45, showLabel: false },
  { id: 'guangzhou-port', name: '广州港', kind: 'port', coord: [113.59, 22.77], labelCoord: [113.05, 22.52], appear: 10.15, pulse: 16.25 },
  { id: 'guangzhou-airport', name: '白云机场', fullName: '广州白云国际机场', kind: 'airport', coord: [113.30, 23.39], labelCoord: [112.88, 23.55], appear: 10.2, pulse: 14.0, showLabel: false },
  { id: 'shenzhen-airport', name: '宝安机场', fullName: '深圳宝安国际机场', kind: 'airport', coord: [113.81, 22.64], labelCoord: [114.55, 22.32], appear: 10.35, pulse: 14.35, showLabel: false },
];

export const guangdongIndustries = [
  {
    id: 'electronics', name: '电子信息与智能终端', color: GUANGDONG_INDUSTRY_COLORS.electronics, start: 5.0,
    cities: ['shenzhen', 'dongguan', 'huizhou', 'guangzhou', 'zhuhai'],
    labelCoord: [115.00, 23.90], labelLines: ['电子信息', '与智能终端'], labelWidth: 3.9, labelHeight: 1.38, labelFontSize: 30,
    cargoTypes: ['芯片', '元器件', '通信设备', '智能终端'],
    cluster: '珠江东岸电子信息集聚区',
    corridor: '广深航空港、海港作为门户，向北接京港澳与京深港，向东衔接沿海通道',
    transportModes: ['航空·主', '公路·集疏运', '铁路·补充', '海运·补充'],
    capabilities: ['保税与精密防护', '高时效、可视追踪'],
  },
  {
    id: 'autoEquipment', name: '汽车与高端装备', color: GUANGDONG_INDUSTRY_COLORS.autoEquipment, start: 5.42,
    cities: ['guangzhou', 'shenzhen', 'foshan', 'dongguan', 'zhuhai', 'zhaoqing', 'jiangmen', 'zhanjiang'],
    labelCoord: [112.55, 22.30], labelLines: ['汽车与', '高端装备'], labelWidth: 3.7, labelHeight: 1.38, labelFontSize: 31,
    cargoTypes: ['整车', '零部件', '工业装备'],
    cluster: '珠三角汽车与装备制造集聚区',
    corridor: '珠三角制造基地经公路集货，接铁路干线、西江水道及广州、深圳港出运',
    transportModes: ['公路·循环取货', '铁路·干线', '海运·集装箱'],
    capabilities: ['入厂物流与循环取货', '整车外运、零部件协同'],
  },
  {
    id: 'petrochemical', name: '绿色石化与新材料', color: GUANGDONG_INDUSTRY_COLORS.petrochemical, start: 5.84,
    cities: ['huizhou', 'zhanjiang', 'maoming', 'guangzhou', 'jieyang'],
    labelCoord: [111.40, 21.70], labelLines: ['绿色石化', '与新材料'], labelWidth: 3.8, labelHeight: 1.38, labelFontSize: 32,
    cargoTypes: ['原油', '化工原料', '成品油', '新材料'],
    cluster: '粤东粤西沿海产业带',
    corridor: '粤东西沿海基地依托湛江、茂名、惠州和广州港，形成水运、管道集疏网络',
    transportModes: ['水运·主', '管道·主', '铁路·补充'],
    capabilities: ['大宗集疏运、危化合规', '罐储衔接、安全监控'],
  },
  {
    id: 'biomedicine', name: '生物医药与健康产业', color: GUANGDONG_INDUSTRY_COLORS.biomedicine, start: 6.26,
    cities: ['guangzhou', 'shenzhen', 'zhuhai', 'foshan', 'dongguan'],
    labelCoord: [115.08, 22.55], labelLines: ['生物医药', '与健康产业'], labelWidth: 4.0, labelHeight: 1.38, labelFontSize: 29,
    cargoTypes: ['药品', '医疗器械', '原料与试剂'],
    cluster: '大湾区核心城市及特色产业园区',
    corridor: '湾区产业园接入广深航空门户与高速网络，兼顾国内配送和跨境供应链',
    transportModes: ['航空·冷链', '公路·冷藏', '铁路·冷链'],
    capabilities: ['温控验证、合规追溯', '小批量高频、应急配送'],
  },
  {
    id: 'agriFood', name: '现代农业与食品消费', color: GUANGDONG_INDUSTRY_COLORS.agriFood, start: 6.68,
    cities: ['zhanjiang', 'maoming', 'yangjiang', 'zhaoqing', 'qingyuan', 'shaoguan', 'meizhou'],
    labelCoord: [113.15, 24.25], labelLines: ['现代农业', '与食品消费'], labelWidth: 3.8, labelHeight: 1.38, labelFontSize: 30,
    cargoTypes: ['生鲜农产品', '粮油食品', '预制食品'],
    cluster: '粤东西北产区→珠三角消费市场',
    corridor: '粤东西北产地通过集配和冷链骨干进入珠三角，并衔接港口与西部陆海通道',
    transportModes: ['公路·冷链', '铁路·冷链', '航空·补充', '水运·补充'],
    capabilities: ['预冷分选、多温共配', '城乡冷链、城市末端履约'],
  },
];

export const guangdongIndustryClusters = [
  { industry: 'electronics', from: 'huizhou', to: 'shenzhen' },
  { industry: 'electronics', from: 'dongguan', to: 'shenzhen' },
  { industry: 'electronics', from: 'zhuhai', to: 'guangzhou' },
  { industry: 'autoEquipment', from: 'zhaoqing', to: 'foshan' },
  { industry: 'autoEquipment', from: 'foshan', to: 'guangzhou' },
  { industry: 'autoEquipment', from: 'jiangmen', to: 'zhuhai' },
  { industry: 'petrochemical', from: 'maoming', to: 'zhanjiang' },
  { industry: 'petrochemical', from: 'jieyang', to: 'huizhou' },
  { industry: 'petrochemical', from: 'huizhou', to: 'guangzhou' },
  { industry: 'biomedicine', from: 'zhuhai', to: 'guangzhou' },
  { industry: 'biomedicine', from: 'foshan', to: 'guangzhou' },
  { industry: 'biomedicine', from: 'dongguan', to: 'shenzhen' },
  { industry: 'agriFood', from: 'zhanjiang', to: 'guangzhou' },
  { industry: 'agriFood', from: 'qingyuan', to: 'guangzhou' },
  { industry: 'agriFood', from: 'meizhou', to: 'shenzhen' },
];

export const guangdongHubFlows = [
  { from: 'dongguan', to: 'shenzhen', industry: 'electronics' },
  { from: 'huizhou', to: 'shenzhen', industry: 'electronics' },
  { from: 'foshan', to: 'guangzhou', industry: 'autoEquipment' },
  { from: 'zhaoqing', to: 'guangzhou', industry: 'autoEquipment' },
  { from: 'maoming', to: 'zhanjiang', industry: 'petrochemical' },
  { from: 'jieyang', to: 'shantou', industry: 'petrochemical' },
  { from: 'zhuhai', to: 'guangzhou', industry: 'biomedicine' },
  { from: 'dongguan', to: 'shenzhen', industry: 'biomedicine' },
  { from: 'qingyuan', to: 'guangzhou', industry: 'agriFood' },
  { from: 'zhanjiang', to: 'shenzhen', industry: 'agriFood' },
];

export const guangdongCorridors = [
  {
    id: 'domestic-north', name: '北向长江中游与京津冀通道', mapLabel: '北向京津冀 · 长江中游', family: 'land',
    color: CORRIDOR_COLORS.land, core: CORRIDOR_COLORS.landCore, glow: CORRIDOR_COLORS.landGlow, onset: 11.0,
    path: [[114.06, 22.55], [113.26, 23.13], [113.06, 23.68], [113.60, 24.81], [113.48, 25.38]],
    labelCoord: [112.18, 24.72], labelWidth: 5.7, labelFontSize: 36,
  },
  {
    id: 'domestic-west', name: '西向西南与西部陆海通道', mapLabel: '西向成渝 · 西部陆海', family: 'land',
    color: CORRIDOR_COLORS.land, core: CORRIDOR_COLORS.landCore, glow: CORRIDOR_COLORS.landGlow, onset: 11.7,
    path: [[113.26, 23.13], [112.47, 23.05], [112.04, 22.93], [110.80, 23.12], [109.82, 23.28]],
    labelCoord: [110.55, 23.30], labelWidth: 5.4, labelFontSize: 36,
  },
  {
    id: 'domestic-east', name: '东向海峡西岸与长三角通道', mapLabel: '东向海峡西岸 · 长三角', family: 'land',
    color: CORRIDOR_COLORS.land, core: CORRIDOR_COLORS.landCore, glow: CORRIDOR_COLORS.landGlow, onset: 12.4,
    path: [[114.06, 22.55], [114.42, 23.11], [115.37, 22.79], [116.68, 23.35], [117.18, 24.08]],
    labelCoord: [114.88, 24.05], labelWidth: 5.7, labelFontSize: 36,
  },
  {
    id: 'pearl-west-port', name: '珠江西岸至广州港集疏通道', mapLabel: '珠江西岸 → 广州港', family: 'port',
    color: CORRIDOR_COLORS.port, core: CORRIDOR_COLORS.portCore, glow: CORRIDOR_COLORS.portGlow, onset: 13.1,
    path: [[112.47, 23.05], [113.12, 23.02], [113.59, 22.77]],
    labelCoord: [112.42, 22.60], labelWidth: 4.6, labelFontSize: 37,
  },
  {
    id: 'pearl-east-port', name: '珠江东岸至深圳港集疏通道', mapLabel: '珠江东岸\n→ 深圳港', family: 'port',
    color: CORRIDOR_COLORS.port, core: CORRIDOR_COLORS.portCore, glow: CORRIDOR_COLORS.portGlow, onset: 13.75,
    path: [[114.42, 23.11], [113.75, 23.02], [114.06, 22.55]],
    labelCoord: [114.48, 22.73], labelWidth: 3.2, labelHeight: 1.28, labelFontSize: 36,
  },
  {
    id: 'west-coast-spine', name: '粤西沿海省内骨干通道', mapLabel: '粤西沿海通道', family: 'land',
    color: CORRIDOR_COLORS.cre, core: CORRIDOR_COLORS.creCore, glow: CORRIDOR_COLORS.creGlow, onset: 14.4,
    path: [[110.36, 21.27], [110.93, 21.66], [111.98, 21.86], [113.08, 22.58], [113.26, 23.13]],
    labelCoord: [111.38, 21.72], labelWidth: 4.2, labelFontSize: 38, showDirectionArrow: false,
  },
];

export const guangdongSeaRoutes = [
  {
    id: 'sz_asean', from: 'shenzhen', label: '东盟', color: CORRIDOR_COLORS.sea,
    path: [[114.06, 22.55], [113.92, 21.70], [113.52, 20.88], [113.25, 20.18]],
    target: [113.25, 20.18], onset: 15.0,
  },
  {
    id: 'sz_europe_america', from: 'shenzhen', label: '欧美', color: CORRIDOR_COLORS.sea,
    path: [[114.06, 22.55], [114.55, 21.70], [114.90, 20.85]],
    target: [114.90, 20.85], onset: 15.55,
  },
  {
    id: 'sz_japan_korea', from: 'shenzhen', label: '日韩海运', labelWidth: 3.4, color: CORRIDOR_COLORS.sea,
    path: [[114.06, 22.55], [114.72, 21.68], [116.20, 21.90], [117.55, 23.55], [118.20, 25.40]],
    target: [118.20, 25.40], labelCoord: [114.72, 21.85], onset: 16.1,
  },
];

export const guangdongSeaLaneLabel = { text: '国际海运', coord: [113.18, 20.52], onset: 16.5 };

export const guangdongOtherProvinceCapitals = [
  { province: '湖南', name: '长沙', lng: 112.98, lat: 25.32 },
  { province: '江西', name: '南昌', lng: 115.86, lat: 25.18 },
  { province: '福建', name: '福州', lng: 117.10, lat: 24.72 },
  { province: '广西', name: '南宁', lng: 109.94, lat: 23.24 },
  { province: '海南', name: '海口', lng: 110.35, lat: 20.22 },
];

export const GUANGDONG_DEMO_STATS = {
  cityCount: 21,
  featuredHubCount: 12,
  industryCount: 5,
};

/** 用户提供的广东外贸与物流承载快照，仅在广东省区域演示右侧展示。 */
export const guangdongTradeSnapshot = {
  eyebrow: 'GUANGDONG DATA SNAPSHOT',
  title: '广东外贸与物流承载',
  availability: '真实数据',
  items: [
    {
      id: 'foreign-trade', module: '外贸运行', period: '2026年1—6月',
      snapshot: '进出口5.49万亿元、出口3.22万亿元、进口2.27万亿元、全国占比21.6%',
      source: '海关总署广东分署、海关总署',
      tone: 'trade', icon: '↗', hero: '5.49', unit: '万亿元', heroLabel: '进出口',
      stats: [['出口', '3.22万亿元'], ['进口', '2.27万亿元'], ['全国占比', '21.6%']],
    },
    {
      id: 'key-goods', module: '重点货品', period: '2026年1—6月',
      snapshot: '集成电路2667亿元、电脑及零部件2461.2亿元；电动汽车+35.3%、锂电池+42.7%、无人机+24.6%',
      source: '海关总署广东分署',
      tone: 'goods', icon: '◆', hero: '2667', unit: '亿元', heroLabel: '集成电路',
      stats: [['电脑及零部件', '2461.2亿元'], ['电动汽车', '+35.3%'], ['锂电池', '+42.7%'], ['无人机', '+24.6%']],
    },
    {
      id: 'trade-partners', module: '贸易伙伴TOP5', period: '2026年1—6月',
      snapshot: '东盟8574.2亿元、香港8299.3亿元、欧盟5799.3亿元、美国4874.8亿元、韩国3070.2亿元',
      source: '海关总署广东分署',
      tone: 'partners', icon: '◎', hero: '8574.2', unit: '亿元', heroLabel: '东盟',
      stats: [['香港', '8299.3亿'], ['欧盟', '5799.3亿'], ['美国', '4874.8亿'], ['韩国', '3070.2亿']],
    },
    {
      id: 'logistics-capacity', module: '物流承载', period: '2025年全年',
      snapshot: '货运38.55亿吨、港口23.25亿吨、集装箱8097万TEU、铁路10042万吨、机场货邮459万吨',
      source: '广东省统计部门、广东省政府工作报告',
      tone: 'capacity', icon: '▦', hero: '38.55', unit: '亿吨', heroLabel: '货运',
      stats: [['港口', '23.25亿吨'], ['集装箱', '8097万TEU'], ['铁路', '10042万吨'], ['机场货邮', '459万吨']],
    },
  ],
};

export const guangdongKpiMetrics = [
  ['城市节点', `${GUANGDONG_DEMO_STATS.cityCount}个`],
  ['重点枢纽 / 门户', `${GUANGDONG_DEMO_STATS.featuredHubCount}个`],
  ['重点产业', `${GUANGDONG_DEMO_STATS.industryCount}类`],
];

export const guangdongStages = [
  { id: 'gd_focus', start: 0, end: 3, title: '广东省域', subtitle: '珠三角核心枢纽、沿海港口群与全省城市节点' },
  { id: 'gd_industry', start: 3, end: 9, title: '产业运输画像', subtitle: '按货值、批量和温控安全要求匹配运输：电子信息重时效，汽车装备走公铁海，石化依托水运管道，医药与农食强化全程冷链' },
  { id: 'gd_corridors', start: 9, end: 17, title: '省内骨干成网', subtitle: '粤西沿海、珠江西岸和珠江东岸三条集疏路线串联产区、城市与广深门户' },
  { id: 'gd_network', start: 17, end: 23, title: '国内国际通道', subtitle: '北接长江中游与京津冀，西联成渝和西部陆海，东接海峡西岸与长三角，海运通达东盟、日韩和欧美' },
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
  showIndustrySpots: false,
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
      cargo: '重点枢纽 / 门户', quantity: GUANGDONG_DEMO_STATS.featuredHubCount, unit: '个',
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
      regionSidePanel: guangdongTradeSnapshot,
      stageMetrics: {
        gd_focus: guangdongKpiMetrics,
        gd_industry: [['重点产业', '5类'], ['汽车与装备', '公路 + 铁路 + 海运'], ['医药与生鲜', '航空 / 公路 / 铁路冷链']],
        gd_corridors: [['省内集疏骨干', '3条'], ['国内外向通道', '3条'], ['主要门户', '广州港 / 深圳港 / 湛江港']],
        gd_network: [['国内方向', '北 / 西 / 东'], ['国际海运', '东盟 / 日韩 / 欧美'], ['重点枢纽 / 门户', '12个']],
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
