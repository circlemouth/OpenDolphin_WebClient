import fs from 'node:fs';
import path from 'node:path';

const distDir = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.resolve(process.cwd(), 'dist');
const outputFile = process.env.OUTPUT_FILE ? path.resolve(process.env.OUTPUT_FILE) : '';

const patterns = [
  { id: 'src-mocks', re: /src\/mocks|src\\\\mocks/g },
  { id: 'msw-browser', re: /msw\/browser|msw\\\\browser/g },
  { id: 'setupWorker', re: /setupWorker\s*\(/g },
  { id: 'mock-fixtures', re: /fixtures\/outpatient|mocks\/fixtures|mocks\/handlers/g },
];

const isTextLike = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return ['.js', '.mjs', '.cjs', '.css', '.html', '.map', '.json', '.txt'].includes(ext);
};

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    files.push(full);
  }
  return files;
};

const scanFile = (filePath) => {
  if (!isTextLike(filePath)) return [];
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  const findings = [];
  for (const p of patterns) {
    const matches = content.match(p.re);
    if (!matches?.length) continue;
    findings.push({ pattern: p.id, count: matches.length });
  }
  if (!findings.length) return [];
  return [{ file: path.relative(distDir, filePath), findings }];
};

if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) {
  console.error(`[verify-prod-dist-no-mocks] dist dir missing: ${distDir}`);
  process.exit(2);
}

const allFiles = walk(distDir);
const results = [];
for (const file of allFiles) {
  results.push(...scanFile(file));
}

const lines = [];
lines.push(`# verify-prod-dist-no-mocks`);
lines.push(`distDir: ${distDir}`);
lines.push(`scannedFiles: ${allFiles.length}`);
lines.push(`findingsFiles: ${results.length}`);
lines.push('');

if (results.length) {
  lines.push('Findings:');
  for (const entry of results) {
    const detail = entry.findings.map((f) => `${f.pattern}=${f.count}`).join(' ');
    lines.push(`- ${entry.file}: ${detail}`);
  }
  lines.push('');
  lines.push('FAIL: production bundle appears to include mock/MSW references.');
} else {
  lines.push('OK: No mock/MSW references detected in dist (heuristic scan).');
}

const report = lines.join('\n') + '\n';
if (outputFile) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, report, 'utf8');
}
process.stdout.write(report);

process.exit(results.length ? 1 : 0);
