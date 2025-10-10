import { add } from '@tools';
import { wait_event } from '@liu';

const a = add({ a: 1, b: 2 }); // 3
const w = wait_event({ eventType: 'sum_ready' });
const b = add({ a: a.result, b: w.value });

export default { sum: b.result };

