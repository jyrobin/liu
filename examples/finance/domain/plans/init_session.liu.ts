import { financeEnsureSessionEnv } from '@tools';

const s = financeEnsureSessionEnv();

export default { ok: true, session: s };

