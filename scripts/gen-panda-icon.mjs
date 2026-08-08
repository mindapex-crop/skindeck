import fs from 'node:fs';
import zlib from 'node:zlib';

function createPng(width, height, drawPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0;
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

// 画一个萌萌的熊猫脸
function drawPanda(x, y, w, h) {
  const cx = w / 2, cy = h / 2;
  const dx = x - cx, dy = y - cy;
  
  // 脸 - 白色圆形
  const faceR = w * 0.42;
  const faceDist = Math.sqrt(dx * dx + dy * dy);
  if (faceDist > faceR + 2) {
    // 耳朵区域检测 (左右上方两个黑圆)
    const earR = faceR * 0.45;
    const leftEarDist = Math.sqrt((x - cx + faceR * 0.55) ** 2 + (y - cy + faceR * 0.55) ** 2);
    const rightEarDist = Math.sqrt((x - cx - faceR * 0.55) ** 2 + (y - cy + faceR * 0.55) ** 2);
    
    if (leftEarDist < earR) {
      const alpha = Math.min(1, (earR - leftEarDist) * 3);
      return { r: 30, g: 30, b: 30, a: Math.round(alpha * 255) };
    }
    if (rightEarDist < earR) {
      const alpha = Math.min(1, (earR - rightEarDist) * 3);
      return { r: 30, g: 30, b: 30, a: Math.round(alpha * 255) };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  
  // 脸的边缘抗锯齿
  let faceAlpha = 1;
  if (faceDist > faceR - 1) {
    faceAlpha = Math.max(0, faceR - faceDist + 1);
  }
  
  // 黑眼圈 (椭圆形)
  const eyeRx = faceR * 0.22;
  const eyeRy = faceR * 0.28;
  const eyeOffsetX = faceR * 0.35;
  const eyeOffsetY = -faceR * 0.05;
  
  function eyeDist(ex, ey, cx2, cy2, rx, ry) {
    const nx = (ex - cx2) / rx;
    const ny = (ey - cy2) / ry;
    return Math.sqrt(nx * nx + ny * ny);
  }
  
  const leftEyeD = eyeDist(x, y, cx - eyeOffsetX, cy + eyeOffsetY, eyeRx, eyeRy);
  const rightEyeD = eyeDist(x, y, cx + eyeOffsetX, cy + eyeOffsetY, eyeRx, eyeRy);
  
  // 鼻子
  const noseW = faceR * 0.15;
  const noseH = faceR * 0.1;
  const noseD = Math.abs(x - cx) < noseW && Math.abs(y - cy - faceR * 0.15) < noseH ? 0 : 1;
  
  // 决定颜色
  let r = 255, g = 255, b = 255;
  
  if (leftEyeD < 1 || rightEyeD < 1) {
    r = 20; g = 20; b = 20;
    // 眼睛里的高光
    const shineDistL = Math.sqrt((x - (cx - eyeOffsetX + 3)) ** 2 + (y - (cy + eyeOffsetY - 4)) ** 2);
    const shineDistR = Math.sqrt((x - (cx + eyeOffsetX + 3)) ** 2 + (y - (cy + eyeOffsetY - 4)) ** 2);
    if ((leftEyeD < 1 && shineDistL < 4) || (rightEyeD < 1 && shineDistR < 4)) {
      r = 255; g = 255; b = 255;
    }
  } else if (noseD < 0.5) {
    r = 50; g = 50; b = 50;
  }
  
  // 淡淡的腮红
  const blushR = faceR * 0.15;
  const blushY = cy + faceR * 0.1;
  const leftBlushD = Math.sqrt((x - (cx - faceR * 0.45)) ** 2 + (y - blushY) ** 2);
  const rightBlushD = Math.sqrt((x - (cx + faceR * 0.45)) ** 2 + (y - blushY) ** 2);
  
  if (leftBlushD < blushR || rightBlushD < blushR) {
    const blushAlpha = Math.min(0.4, (blushR - Math.min(leftBlushD, rightBlushD)) / blushR * 0.4);
    r = Math.round(r * (1 - blushAlpha) + 255 * blushAlpha);
    g = Math.round(g * (1 - blushAlpha) + 180 * blushAlpha);
    b = Math.round(b * (1 - blushAlpha) + 190 * blushAlpha);
  }
  
  return { r, g, b, a: Math.round(faceAlpha * 255) };
}

const size = 64;
const pandaPng = createPng(size, size, drawPanda);

const outPath = '/Users/yason/local/skins/apps/unified/assets/tray-panda.png';
fs.writeFileSync(outPath, pandaPng);
console.log(`熊猫图标已生成: ${outPath} (${pandaPng.length} bytes)`);
