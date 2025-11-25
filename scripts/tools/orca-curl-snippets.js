#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const requestDir = path.join(
  repoRoot,
  'docs',
  'server-modernization',
  'phase2',
  'operations',
  'assets',
  'orca-api-requests',
);
const outputFile = path.join(repoRoot, 'tmp', 'orca-curl-snippets.txt');
const baseUrl = 'http://orca:8000';

function readJsonTemplate(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const sanitized = lines
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');
  try {
    return JSON.parse(sanitized);
  } catch (error) {
    throw new Error(`JSON の解析に失敗しました (${filePath}): ${error.message}`);
  }
}

function toPosixRelative(targetPath) {
  return path.relative(repoRoot, targetPath).split(path.sep).join('/');
}

function buildQueryString(query) {
  return Object.entries(query)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
          .join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join('&');
}

function ensureDirExists(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function extractMetaFromXml(raw, filePath) {
  const metaMatch = raw.match(/<!--\s*orca-meta:(.*?)-->/is);
  if (!metaMatch) {
    throw new Error(`orca-meta コメントが見つかりません (${filePath})`);
  }

  const block = metaMatch[1];
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const meta = {
    headers: {},
  };

  lines.forEach((line) => {
    const [rawKey, ...rest] = line.split('=');
    if (!rawKey || rest.length === 0) {
      return;
    }
    const value = rest.join('=').trim();
    if (!value) {
      return;
    }

    const key = rawKey.trim();
    const lowerKey = key.toLowerCase();

    if (lowerKey.startsWith('header:')) {
      const headerName = key.substring('header:'.length).trim();
      if (headerName) {
        meta.headers[headerName] = value;
      }
      return;
    }

    if (lowerKey === 'content-type') {
      meta.headers['Content-Type'] = value;
      return;
    }

    if (lowerKey === 'path') {
      meta.path = value;
      return;
    }

    if (lowerKey === 'method') {
      meta.method = value;
      return;
    }

    if (lowerKey === 'query') {
      meta.query = value.replace(/^[?]/, '');
      return;
    }
  });

  return meta;
}

function buildJsonDescriptor(fileName, fullPath) {
  const template = readJsonTemplate(fullPath);
  const endpoint = template.path;
  if (!endpoint) {
    throw new Error(`${fileName} に 'path' が定義されていません`);
  }

  const method = (template.method || 'POST').toUpperCase();
  const queryString = template.query ? buildQueryString(template.query) : '';
  const headers = Object.entries(template.headers || {});
  const hasContentType = headers.some(([key]) => key.toLowerCase() === 'content-type');
  if (!hasContentType) {
    headers.push(['Content-Type', 'application/json; charset=Shift_JIS']);
  }

  return {
    fileName,
    fullPath,
    method,
    endpoint,
    queryString,
    headers,
    dataMode: 'text',
  };
}

function buildXmlDescriptor(fileName, fullPath) {
  const raw = fs.readFileSync(fullPath, 'utf8');
  const meta = extractMetaFromXml(raw, fileName);
  const endpoint = meta.path;
  if (!endpoint) {
    throw new Error(`${fileName} に 'path' メタ情報がありません`);
  }

  const method = (meta.method || 'POST').toUpperCase();
  const queryString = meta.query || '';
  const headers = Object.entries(meta.headers || {});
  const hasContentType = headers.some(([key]) => key.toLowerCase() === 'content-type');
  if (!hasContentType) {
    headers.push(['Content-Type', 'application/xml; charset=UTF-8']);
  }

  return {
    fileName,
    fullPath,
    method,
    endpoint,
    queryString,
    headers,
    dataMode: 'binary',
  };
}

function createDescriptor(fileName) {
  const fullPath = path.join(requestDir, fileName);
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.xml') {
    return buildXmlDescriptor(fileName, fullPath);
  }

  if (ext === '.json') {
    return buildJsonDescriptor(fileName, fullPath);
  }

  throw new Error(`${fileName} は未対応のテンプレート拡張子です`);
}

function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  if (!fs.existsSync(requestDir)) {
    console.error(`テンプレートディレクトリが存在しません: ${requestDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(requestDir)
    .filter((name) => name.endsWith('_request.json') || name.endsWith('_request.xml'))
    .sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (Number.isNaN(numA) || Number.isNaN(numB)) {
        return a.localeCompare(b);
      }
      if (numA === numB) {
        return a.localeCompare(b);
      }
      return numA - numB;
    });

  if (files.length === 0) {
    console.error(`${requestDir} に *_request.(json|xml) が見つかりません`);
    process.exit(1);
  }

  const snippets = files.map((fileName) => {
    const descriptor = createDescriptor(fileName);
    const url = `${baseUrl}${descriptor.endpoint}${descriptor.queryString ? `?${descriptor.queryString}` : ''}`;
    const headers = descriptor.headers.map(([key, value]) => `-H '${key}: ${value}'`);

    const commandParts = [`curl -X ${descriptor.method}`, `'${url}'`, ...headers];

    const requiresBody = !['GET', 'HEAD'].includes(descriptor.method);
    if (requiresBody) {
      const dataFlag = descriptor.dataMode === 'binary' ? '--data-binary' : '--data';
      commandParts.push(`${dataFlag} @${toPosixRelative(descriptor.fullPath)}`);
    }

    const label = `# ${fileName}`;
    const command = commandParts.join(' ').trim();
    return `${label}\n${command}`;
  });

  if (isDryRun) {
    console.log(snippets.join('\n\n'));
    console.log('\n[dry-run] ファイルへは書き出していません。');
    return;
  }

  ensureDirExists(path.dirname(outputFile));
  fs.writeFileSync(outputFile, snippets.join('\n\n') + '\n');
  console.log(`コマンドスニペットを生成しました: ${outputFile}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
