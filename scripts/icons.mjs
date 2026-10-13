import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel(x, y, size);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function insideRound(x, y, size, pad, radius) {
  const left = pad;
  const right = size - pad;
  const top = pad;
  const bottom = size - pad;
  if (x < left || x >= right || y < top || y >= bottom) return false;
  const cx = x < left + radius ? left + radius : x > right - radius ? right - radius : x;
  const cy = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function pixel(x, y, size) {
  const clay = [194, 78, 29, 255];
  const paper = [243, 239, 231, 255];
  const ink = [27, 23, 20, 255];
  if (!insideRound(x, y, size, size * 0.06, size * 0.18)) return [0, 0, 0, 0];
  const window = insideRound(x, y, size, size * 0.22, size * 0.08);
  if (!window) return clay;
  const mullion = Math.abs(x - size / 2) < size * 0.025 || Math.abs(y - size * 0.52) < size * 0.02;
  return mullion ? ink : paper;
}

const targets = [
  ['apps/admin/public/icon-192.png', 192],
  ['apps/admin/public/icon-512.png', 512],
  ['apps/storefront/public/icon-192.png', 192],
];

for (const [file, size] of targets) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png(size, pixel));
}
