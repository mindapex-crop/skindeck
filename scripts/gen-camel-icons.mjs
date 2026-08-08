// gen-camel-icons.mjs - 把骆驼 SVG 栅格化为 44x44 托盘 PNG
import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '/Users/yason/.workbuddy/binaries/node/workspace/node_modules/@resvg/resvg-js/index.js';

const assetsDir = path.resolve('apps/unified/assets');

async function rasterize(svgRel, pngRel, size = 44) {
  const svg = await fs.readFile(path.join(assetsDir, svgRel), 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'transparent',
  });
  const png = resvg.render().asPng();
  await fs.writeFile(path.join(assetsDir, pngRel), png);
  console.log(`✓ ${pngRel} (${size}x${size})`);
}

await rasterize('tray-camel.svg', 'tray-camel.png');
await rasterize('tray-camel-Template.svg', 'tray-camel-Template.png');
console.log('done');
