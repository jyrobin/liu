import assert from 'node:assert/strict';
import { runLiuPlanPersisted, InMemoryStateStore } from '../src/index.js';

const plan = `
import { add, mul } from '@tools';
const s1 = add({ a: 2, b: 3 });
const s2 = mul({ a: s1.result, b: 10 });
export default { result: s2.result };
`;

const tools = {
  add: ({ a, b }) => ({ result: Number(a) + Number(b) }),
  mul: ({ a, b }) => ({ result: Number(a) * Number(b) })
};

async function main() {
  const store = new InMemoryStateStore();
  const planId = 'test_run_1';
  const res1 = await runLiuPlanPersisted(plan, { tools, store, planId });
  assert.equal(res1.success, true);
  assert.equal(JSON.stringify(res1.result), JSON.stringify({ result: 50 }));
  assert.ok(Array.isArray(res1.state.steps));
  assert.equal(res1.state.steps.length, 2);
  assert.equal(res1.state.steps[0].status, 'completed');

  // Re-run to test resume (should skip steps and still succeed)
  const res2 = await runLiuPlanPersisted(plan, { tools, store, planId });
  assert.equal(res2.success, true);
  assert.equal(JSON.stringify(res2.result), JSON.stringify({ result: 50 }));
  assert.equal(res2.state.steps[0].status, 'completed');

  console.log('OK');
}

main().catch(err => { console.error(err); process.exit(1); });
