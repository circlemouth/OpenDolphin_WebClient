#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const NAMING_REGEX = /^\d{8}T\d{6}Z$/;
const defaultTarget = path.resolve(__dirname, '..', '..', 'artifacts', 'orca-connectivity');
const userTarget = process.argv[2];
const targetDir = path.resolve(userTarget || defaultTarget);

function formatUtcStamp(date) {
  const main = date.toISOString().split('.')[0];
  return main.replace(/-/g, '').replace(/:/g, '') + 'Z';
}

function ensureExists(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`対象ディレクトリが見つかりません: ${dir}`);
    process.exit(1);
  }
}

function collectInvalidDirs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !NAMING_REGEX.test(entry.name))
    .map((entry) => {
      const stats = fs.statSync(path.join(dir, entry.name));
      return {
        name: entry.name,
        suggestion: formatUtcStamp(stats.mtime),
      };
    });
}

try {
  ensureExists(targetDir);
  const invalidDirs = collectInvalidDirs(targetDir);

  if (invalidDirs.length === 0) {
    console.log(`OK: ${targetDir} 配下の Evidence ディレクトリはすべて YYYYMMDDThhmmssZ 形式です。`);
    process.exit(0);
  }

  console.error('NG: 以下のディレクトリは命名規約に違反しています。');
  invalidDirs.forEach((item) => {
    console.error(`  - ${item.name} → 推奨名: ${item.suggestion}`);
  });
  console.error('\n命名ポリシー: UTC 時刻を 24 時間制で表現し、例 20251108T101534Z。');
  process.exit(1);
} catch (error) {
  console.error('処理中にエラーが発生しました。');
  console.error(error.message);
  process.exit(1);
}
