#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const specDir = path.join(repoRoot, 'docs/server-modernization/phase2/operations/assets/orca-api-spec');
const rawDir = path.join(specDir, 'raw');
const matrixPath = path.join(repoRoot, 'docs/server-modernization/phase2/operations/assets/orca-api-matrix.csv');
const manifestPath = path.join(specDir, 'manifest.json');
const matrixOutPath = path.join(specDir, 'orca-api-matrix.with-spec.csv');
const endpointRegex = /\/(?:api|orca)[0-9][0-9A-Za-z\/_-]*/g;
const manualSlugMap = new Map([
  ['/orca42/receiptprintv3', 'report_print']
]);

function buildManifest() {
  const entries = [];
  const files = fs.readdirSync(rawDir).filter((file) => file.endsWith('.md'));
  for (const file of files) {
    const slug = path.basename(file, '.md');
    const mdPath = path.join(rawDir, file);
    const text = fs.readFileSync(mdPath, 'utf-8');
    const lines = text.split(/\r?\n/);
    const titleLine = lines.find((line) => /^#{1,6}\s+/.test(line));
    const title = titleLine ? titleLine.replace(/^#{1,6}\s+/, '').trim() : '';
    const endpointMatch = text.match(endpointRegex);
    const endpoint = endpointMatch ? endpointMatch[0] : '';
    let apiName = '';
    for (const line of lines) {
      if (line.includes('日医標準レセプトソフト API') && !line.includes('](')) {
        apiName = line.replace(/.*日医標準レセプトソフト\s+API\s*/, '').trim();
        if (apiName) break;
      }
    }
    const sourcePath = mdPath + '.source';
    const remoteUrl = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf-8').trim() : '';
    const statusPath = mdPath + '.status';
    const statusCode = fs.existsSync(statusPath) ? fs.readFileSync(statusPath, 'utf-8').trim() : '';
    entries.push({
      slug,
      title,
      apiName,
      endpoint,
      remoteUrl,
      statusCode,
      localPath: path.join('raw', file).replace(/\\/g, '/')
    });
  }
  entries.sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2));
  return entries;
}

function enrichMatrix(manifest) {
  const manifestByEndpoint = new Map();
  const manifestBySlug = new Map();
  for (const entry of manifest) {
    if (entry.endpoint) {
      manifestByEndpoint.set(entry.endpoint.trim(), entry);
    }
    manifestBySlug.set(entry.slug, entry);
  }
  const lines = fs.readFileSync(matrixPath, 'utf-8').trim().split(/\r?\n/);
  const header = lines.shift();
  const output = [header + ',SpecSlug,LocalSpec,SpecRemote'];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(',');
    const url = (cols[1] || '').trim();
    let entry = manifestByEndpoint.get(url);
    if (!entry && manualSlugMap.has(url)) {
      entry = manifestBySlug.get(manualSlugMap.get(url));
    }
    if (entry) {
      cols.push(entry.slug, entry.localPath, entry.remoteUrl);
    } else {
      cols.push('', '', '');
    }
    output.push(cols.join(','));
  }
  fs.writeFileSync(matrixOutPath, output.join('\n'));
}

function main() {
  if (!fs.existsSync(rawDir)) {
    throw new Error(`raw spec directory not found: ${rawDir}`);
  }
  const manifest = buildManifest();
  enrichMatrix(manifest);
  console.log(`wrote ${manifest.length} entries to ${manifestPath}`);
  console.log(`updated crosswalk CSV at ${matrixOutPath}`);
}

if (require.main === module) {
  main();
}
