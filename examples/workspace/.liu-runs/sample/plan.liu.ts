import { add, mul } from '@tools';
const s1 = add({ a: 2, b: 3 });
const s2 = mul({ a: s1.result, b: 10 });
export default { result: s2.result };
