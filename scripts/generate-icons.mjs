import fs from 'node:fs';
import zlib from 'node:zlib';

function createPng(width, height, drawPixel) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  
  // IDAT chunk (image data)
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const pixel = drawPixel(x, y, width, height);
      const offset = y * (width * 4 + 1) + 1 + x * 4;
      rawData[offset] = pixel.r;
      rawData[offset + 1] = pixel.g;
      rawData[offset + 2] = pixel.b;
      rawData[offset + 3] = pixel.a;
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// 生成皮肤图标 - 调色板/画笔形状 (圆形渐变)
function drawSkinIcon(x, y, w, h) {
  const cx = w / 2, cy = h / 2;
  const radius = Math.min(w, h) / 2 - 1;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > radius) return { r: 0, g: 0, b: 0, a: 0 };
  
  // 彩虹渐变
  const hue = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI) * 360;
  const { r, g, b } = hslToRgb(hue, 0.8, 0.55);
  
  // 边缘抗锯齿
  const alpha = Math.min(1, (radius - dist) * 2);
  
  return { r, g, b, a: Math.round(alpha * 255) };
}

// 生成桌宠图标 - 粉色小猫爪
function drawPetIcon(x, y, w, h) {
  const cx = w / 2, cy = h / 2;
  const radius = Math.min(w, h) / 2 - 1;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > radius) return { r: 0, g: 0, b: 0, a: 0 };
  
  // 粉色圆形
  const alpha = Math.min(1, (radius - dist) * 2);
  return { r: 255, g: 150, b: 180, a: Math.round(alpha * 255) };
}

function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

const size = 32;

const skinPng = createPng(size, size, drawSkinIcon);
const petPng = createPng(size, size, drawPetIcon);

fs.writeFileSync('/Users/yason/local/skins/apps/skin-menu-bar/assets/tray.png', skinPng);
fs.writeFileSync('/Users/yason/local/skins/apps/desktop-pet/assets/tray.png', petPng);

console.log('图标生成成功!');
console.log(`  皮肤图标: ${skinPng.length} bytes`);
console.log(`  桌宠图标: ${petPng.length} bytes`);
