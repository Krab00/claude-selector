const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPixels(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const center = Math.floor(size / 2);
  const radius = Math.floor(size * 0.35);
  const lw = Math.max(1, Math.floor(size / 16));
  const crossSize = Math.floor(size * 0.25);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const onCircle = Math.abs(dist - radius) < lw;
      const onH = Math.abs(dy) < lw && Math.abs(dx) < crossSize && dist > radius * 0.3;
      const onV = Math.abs(dx) < lw && Math.abs(dy) < crossSize && dist > radius * 0.3;
      const onDot = dist < lw * 1.5;
      const i = (y * size + x) * 4;
      if (onCircle || onH || onV || onDot) {
        pixels[i] = 74; pixels[i+1] = 144; pixels[i+2] = 217; pixels[i+3] = 255;
      }
    }
  }
  return pixels;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const row = 1 + w * 4;
  const raw = Buffer.alloc(h * row);
  for (let y = 0; y < h; y++) {
    raw[y * row] = 0;
    rgba.copy(raw, y * row + 1, y * w * 4, (y+1) * w * 4);
  }
  return Buffer.concat([sig, makeChunk('IHDR', ihdr), makeChunk('IDAT', zlib.deflateSync(raw)), makeChunk('IEND', Buffer.alloc(0))]);
}

for (const size of [16, 48, 128]) {
  const png = encodePNG(size, size, createPixels(size));
  const fp = path.join(__dirname, `icon${size}.png`);
  fs.writeFileSync(fp, png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
}
