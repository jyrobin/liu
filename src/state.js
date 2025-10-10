// Simple state store interface + memory and file implementations
import fs from 'node:fs/promises';
import path from 'node:path';

export class StateStore {
  async save(planId, state) { throw new Error('save not implemented'); }
  async load(planId) { throw new Error('load not implemented'); }
  async remove(planId) { throw new Error('remove not implemented'); }
}

export class InMemoryStateStore extends StateStore {
  constructor() { super(); this.map = new Map(); }
  async save(planId, state) { this.map.set(planId, JSON.parse(JSON.stringify(state))); }
  async load(planId) { const v = this.map.get(planId); return v ? JSON.parse(JSON.stringify(v)) : null; }
  async remove(planId) { this.map.delete(planId); }
  list() { return Array.from(this.map.keys()); }
}

export class FileStateStore extends StateStore {
  constructor(dir) { super(); this.dir = dir || '.liu-state'; }
  async ensureDir() { await fs.mkdir(this.dir, { recursive: true }); }
  fileFor(planId) { return path.join(this.dir, `${sanitize(planId)}.json`); }
  async save(planId, state) { await this.ensureDir(); await fs.writeFile(this.fileFor(planId), JSON.stringify(state, null, 2)); }
  async load(planId) {
    try { const s = await fs.readFile(this.fileFor(planId), 'utf8'); return JSON.parse(s); }
    catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  }
  async remove(planId) { try { await fs.unlink(this.fileFor(planId)); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
}

function sanitize(s) { return String(s).replace(/[^A-Za-z0-9._-]/g, '_'); }

