import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import multer from 'multer';
import { env } from './env.js';
import { HttpError } from './errors.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 6 },
});

export function sniff(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'webp';
  }
  return null;
}

export async function saveImage(buf: Buffer): Promise<string> {
  const ext = sniff(buf);
  if (!ext) throw new HttpError(400, 'La imagen tiene que ser JPG, PNG o WebP');
  await mkdir(env.uploadDir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(join(env.uploadDir, filename), buf);
  return filename;
}

export async function removeImage(filename: string): Promise<void> {
  if (!/^[\w.-]+$/.test(filename)) return;
  await unlink(join(env.uploadDir, filename)).catch(() => undefined);
}
