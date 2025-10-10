export function add({ a, b }) { return { result: Number(a) + Number(b) }; }
export function mul({ a, b }) { return { result: Number(a) * Number(b) }; }
export function notify({ channel, message }) { console.log(`[${channel}] ${message}`); return { ok: true }; }

