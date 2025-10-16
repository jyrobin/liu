// Simple file cache helpers (JSON-based)
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('finance', 'cache');

export function ensureDirSync(dir) {
  if (!fssync.existsSync(dir)) fssync.mkdirSync(dir, { recursive: true });
}

export function hashId(parts) {
  const h = crypto.createHash('sha1');
  h.update(JSON.stringify(parts));
  return h.digest('hex').slice(0, 16);
}

export function cachePath(kind, id) {
  const dir = path.join(ROOT, kind);
  ensureDirSync(dir);
  return path.join(dir, `${id}.json`);
}

export async function writeJSON(kind, id, obj) {
  const p = cachePath(kind, id);
  await fs.writeFile(p, JSON.stringify(obj, null, 2), 'utf8');
  return p;
}

export async function readJSON(kind, id) {
  const p = cachePath(kind, id);
  const t = await fs.readFile(p, 'utf8');
  return JSON.parse(t);
}

