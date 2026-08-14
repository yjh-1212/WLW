import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2] ?? 'C:/Users/Lenovo/Desktop/html/六轴七廊八通道_透明底版.html';
const outputDir = path.resolve('public/data');
const html = fs.readFileSync(source, 'utf8');

const provinceGroup = html.match(/<g id="provinces">([\s\S]*?)<\/g>/)?.[1];
if (!provinceGroup) throw new Error('未找到 provinces 图层');

const provinces = [...provinceGroup.matchAll(/<path\s+[^>]*d="([^"]+)"[^>]*>[\s\S]*?<title>([^<]+)<\/title><\/path>/g)]
  .map((match, index) => ({ id: `province-${index + 1}`, name: match[2].trim(), d: match[1] }));

const routes = [...html.matchAll(/<path id="([ACT]\d)"[^>]*d="([^"]+)"[^>]*>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<\/path>/g)]
  .map((match) => ({
    id: match[1],
    type: match[1][0] === 'A' ? 'axis' : match[1][0] === 'C' ? 'corridor' : 'channel',
    name: match[3].replace(/^\w+\s*/, '').trim(),
    path: match[2],
  }));

if (provinces.length < 30 || routes.length !== 21) {
  throw new Error(`提取结果异常：省级对象 ${provinces.length}，线路 ${routes.length}`);
}

fs.mkdirSync(outputDir, { recursive: true });
const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">',
  ...provinces.map((item) => `<path id="${item.id}" data-name="${item.name}" d="${item.d}"><title>${item.name}</title></path>`),
  '</svg>',
].join('\n');

fs.writeFileSync(path.join(outputDir, 'china-provinces.svg'), svg, 'utf8');
fs.writeFileSync(path.join(outputDir, 'backbone-routes.json'), JSON.stringify({
  meta: {
    title: '六轴七廊八通道（概化线路）',
    source: '用户提供的《六轴七廊八通道_透明底版.html》',
    coordinateSystem: 'reference-svg',
    verifiedStatus: 'local-reference',
    generatedAt: new Date().toISOString(),
  },
  routes,
}, null, 2), 'utf8');

console.log(`已生成 ${provinces.length} 个省级对象、${routes.length} 条战略线路。`);
