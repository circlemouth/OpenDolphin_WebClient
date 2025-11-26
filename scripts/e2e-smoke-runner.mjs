import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
let runIdFromArg;
const passthroughArgs = [];

for (const arg of args) {
  if (arg.startsWith('--runId=')) {
    runIdFromArg = arg.split('=')[1];
    continue;
  }
  passthroughArgs.push(arg);
}

const runId = runIdFromArg ?? process.env.RUN_ID ?? '20251124T073245Z';

const cliPath = new URL('../node_modules/@playwright/test/cli.js', import.meta.url).pathname;

const result = spawnSync(process.execPath, [cliPath, 'test', 'tests/e2e/orca-master-bridge.smoke.spec.ts', ...passthroughArgs], {
  stdio: 'inherit',
  env: { ...process.env, RUN_ID: runId },
});

if (result.error) {
  console.error('[e2e:smoke] spawn error', result.error);
}

process.exit(result.status ?? 1);
