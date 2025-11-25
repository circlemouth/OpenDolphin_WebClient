#!/usr/bin/env node
/**
 * verify-msw-fixtures.mjs
 * MSW フィクスチャに監査メタ必須キーが含まれるかを検証し、ソースファイルの SHA256 を出力する CLI。
 *
 * Usage:
 *   node scripts/verify-msw-fixtures.mjs \
 *     --fixtures web-client/src/mocks/fixtures/orcaMaster.ts \
 *     --require runId,snapshotVersion,dataSource,cacheHit,missingMaster,fallbackUsed \
 *     --hash-out artifacts/ci/msw-fixtures.sha256
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const log = (msg) => process.stdout.write(`${msg}\n`);
const error = (msg) => process.stderr.write(`${msg}\n`);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    fixtures: null,
    requiredKeys: [],
    hashOut: null,
    expectRunId: process.env.RUN_ID || null,
    expectSnapshotVersion: process.env.SNAPSHOT_VERSION || null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    if (arg === '--fixtures') {
      parsed.fixtures = next;
      i += 1;
    } else if (arg === '--require') {
      parsed.requiredKeys = next.split(',').map((k) => k.trim()).filter(Boolean);
      i += 1;
    } else if (arg === '--hash-out') {
      parsed.hashOut = next;
      i += 1;
    } else if (arg === '--expect-run-id') {
      parsed.expectRunId = next;
      i += 1;
    } else if (arg === '--expect-snapshot-version') {
      parsed.expectSnapshotVersion = next;
      i += 1;
    } else {
      error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  if (!parsed.fixtures) {
    error('Missing required option: --fixtures <path>');
    process.exit(1);
  }

  return parsed;
};

const loadTypescriptModule = (fixturePath) => {
  // TypeScript は web-client 配下にインストールされている前提。
  const requireFromWebClient = createRequire(resolve('web-client/package.json'));
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return requireFromWebClient('typescript');
  } catch (e) {
    error('TypeScript が見つかりません。`cd web-client && npm ci` を実行してください。');
    throw e;
  }
};

const transpileToEsm = (source, ts) => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.Preserve,
      isolatedModules: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    },
    reportDiagnostics: false,
  });
  return transpiled.outputText;
};

const importFromString = async (code) => {
  const base64 = Buffer.from(code, 'utf8').toString('base64');
  const url = `data:text/javascript;base64,${base64}`;
  return import(url);
};

const shouldValidateObject = (obj, requiredKeys) => {
  if (Array.isArray(obj)) return false;
  return requiredKeys.some((k) => Object.prototype.hasOwnProperty.call(obj, k)) ||
    Object.prototype.hasOwnProperty.call(obj, 'dataSource');
};

const traverseAndValidate = (value, requiredKeys, expectRunId, expectSnapshotVersion, path, issues, seen) => {
  if (value === null || typeof value === 'function') {
    return;
  }

  if (seen.has(value)) return;
  if (typeof value === 'object') {
    seen.add(value);
  }

  if (Array.isArray(value)) {
    value.forEach((v, idx) => traverseAndValidate(v, requiredKeys, expectRunId, expectSnapshotVersion, `${path}[${idx}]`, issues, seen));
    return;
  }

  if (typeof value === 'object') {
    if (shouldValidateObject(value, requiredKeys)) {
      requiredKeys.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          issues.push(`${path}: missing key "${key}"`);
        } else if (value[key] === undefined) {
          issues.push(`${path}: key "${key}" is undefined`);
        }
      });

      if (expectRunId && Object.prototype.hasOwnProperty.call(value, 'runId') && value.runId !== expectRunId) {
        issues.push(`${path}: runId expected "${expectRunId}" but found "${value.runId}"`);
      }
      if (
        expectSnapshotVersion &&
        expectSnapshotVersion !== 'auto' &&
        Object.prototype.hasOwnProperty.call(value, 'snapshotVersion') &&
        value.snapshotVersion !== expectSnapshotVersion
      ) {
        issues.push(`${path}: snapshotVersion expected "${expectSnapshotVersion}" but found "${value.snapshotVersion}"`);
      }
    }

    Object.entries(value).forEach(([k, v]) =>
      traverseAndValidate(v, requiredKeys, expectRunId, expectSnapshotVersion, `${path}.${k}`, issues, seen),
    );
  }
};

const writeHashFile = (hashOutPath, fixturePath, content) => {
  const hash = createHash('sha256').update(content, 'utf8').digest('hex');
  const outPath = resolve(hashOutPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${hash}  ${basename(fixturePath)}\n`, 'utf8');
  return hash;
};

const main = async () => {
  const { fixtures, requiredKeys, hashOut, expectRunId, expectSnapshotVersion } = parseArgs();
  const fixturePath = resolve(fixtures);

  if (!existsSync(fixturePath)) {
    error(`Fixtures file not found: ${fixturePath}`);
    process.exit(1);
  }

  const source = readFileSync(fixturePath, 'utf8');
  const ts = loadTypescriptModule(fixturePath);
  const esmCode = transpileToEsm(source, ts);
  const mod = await importFromString(esmCode);

  const issues = [];
  const seen = new WeakSet();
  Object.entries(mod).forEach(([exportName, value]) => {
    traverseAndValidate(value, requiredKeys, expectRunId, expectSnapshotVersion, exportName, issues, seen);
  });

  if (issues.length > 0) {
    issues.forEach((i) => error(i));
    error(`Validation failed: ${issues.length} issue(s) found.`);
    process.exit(1);
  }

  log(`Validation OK (${requiredKeys.join(', ') || 'no required keys'})`);

  if (hashOut) {
    const hash = writeHashFile(hashOut, fixturePath, source);
    log(`sha256 written to ${hashOut}: ${hash}`);
  }
};

main().catch((e) => {
  error(`Error: ${e.message}`);
  process.exit(1);
});
