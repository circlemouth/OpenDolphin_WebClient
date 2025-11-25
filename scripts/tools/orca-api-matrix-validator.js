#!/usr/bin/env node
/**
 * ORCA API マトリクスの Markdown 表と CSV の整合性を検証する簡易 Lint。
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../');
const DOC_PATH = path.join(
  REPO_ROOT,
  'docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md'
);
const CSV_PATH = path.join(
  REPO_ROOT,
  'docs/server-modernization/phase2/operations/assets/orca-api-matrix.csv'
);
const EXPECTED_COUNT = 53;
const VALID_PRIORITIES = new Set(['P0', 'P1', 'P2']);

function main() {
  try {
    const markdown = fs.readFileSync(DOC_PATH, 'utf8');
    const csv = fs.readFileSync(CSV_PATH, 'utf8');

    const mdSection = extractSection(markdown);
    const mdEntries = parseMarkdownEntries(mdSection);
    const csvEntries = parseCsvEntries(csv);

    const errors = [];

    validateCount('Markdown', mdEntries, errors);
    validateCount('CSV', csvEntries, errors);
    validatePriorities('Markdown', mdEntries, errors);
    validatePriorities('CSV', csvEntries, errors);

    const mdMap = mapByNo(mdEntries, 'Markdown', errors);
    const csvMap = mapByNo(csvEntries, 'CSV', errors);

    const allNos = new Set([...mdMap.keys(), ...csvMap.keys()]);
    for (const no of [...allNos].sort((a, b) => a - b)) {
      const md = mdMap.get(no);
      const csv = csvMap.get(no);

      if (!md) {
        errors.push(`API No ${no}: Markdown の表に項目が存在しません`);
        continue;
      }
      if (!csv) {
        errors.push(`API No ${no}: CSV に項目が存在しません`);
        continue;
      }

      if (md.url !== csv.url) {
        errors.push(
          `API No ${no}: URL 不一致 (Markdown: ${md.url}, CSV: ${csv.url})`
        );
      }
      if (md.priority !== csv.priority) {
        errors.push(
          `API No ${no}: 優先度不一致 (Markdown: ${md.priority}, CSV: ${csv.priority})`
        );
      }
    }

    if (errors.length > 0) {
      console.error('ORCA API マトリクス検証 NG');
      errors.forEach((msg) => console.error(` - ${msg}`));
      process.exit(1);
    }

    const noteWarnings = collectNoteWarnings(mdEntries);
    if (noteWarnings.length > 0) {
      console.warn('ORCA API マトリクス警告: 備考タグを検出');
      noteWarnings.forEach((warn) =>
        console.warn(
          ` - API No ${warn.no}: ${warn.tag} (see ${warn.reference})`
        )
      );
    }

    console.log(
      `ORCA API マトリクス検証 OK: ${mdEntries.length} 件の No/URL/優先度が一致`
    );
  } catch (error) {
    console.error(`検証処理でエラーが発生しました: ${error.message}`);
    process.exit(1);
  }
}

function collectNoteWarnings(entries) {
  const reference = 'ORCA_CONNECTIVITY_VALIDATION.md §5';
  return entries.flatMap(({ no, note }) => {
    const tags = extractNoteTags(note);
    return tags.map((tag) => ({ no, tag, reference }));
  });
}

function extractNoteTags(note = '') {
  const tags = [];
  const pattern = /※([^※\n]+)/g;
  let match;
  while ((match = pattern.exec(note)) !== null) {
    const raw = match[1].trim();
    if (!raw) {
      continue;
    }
    const boundaryIndex = raw.search(/[（(。]/);
    const tag = (boundaryIndex >= 0 ? raw.slice(0, boundaryIndex) : raw)
      .trim()
      .replace(/\s+/g, ' ');
    if (tag.length > 0) {
      tags.push(tag);
    }
  }
  return tags;
}

function extractSection(markdown) {
  const match = markdown.match(
    /##\s*5\.\s*ORCA API 検証マトリクス([\s\S]*?)(?:\n##\s*\d+\.|\n##\s*[A-Za-z]|$)/
  );
  if (!match) {
    throw new Error('セクション「## 5. ORCA API 検証マトリクス」が見つかりません');
  }
  return match[1];
}

function parseMarkdownEntries(section) {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length < 5) {
        throw new Error(`Markdown 表の形式が不正です: ${line}`);
      }
      const [noStr, urlCol, , priority, note] = cells;
      const no = Number(noStr);
      if (!Number.isInteger(no)) {
        throw new Error(`項番を数値として解釈できません: "${noStr}"`);
      }
      return { no, url: extractUrl(urlCol), priority, note: note || '' };
    });
}

function extractUrl(value) {
  const codeMatch = value.match(/`([^`]+)`/);
  if (codeMatch) {
    return codeMatch[1];
  }
  return value.replace(/\s+/g, ' ').trim();
}

function parseCsvEntries(csv) {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('CSV が空です');
  }
  lines.shift(); // header
  return lines.map((line) => {
    const cells = splitCsvLine(line);
    if (cells.length < 5) {
      throw new Error(`CSV の形式が不正です: ${line}`);
    }
    const no = Number(cells[0]);
    if (!Number.isInteger(no)) {
      throw new Error(`CSV の No を数値として解釈できません: "${cells[0]}"`);
    }
    return { no, url: cells[1], priority: cells[4] };
  });
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((value) => value.trim());
}

function validateCount(label, entries, errors) {
  if (entries.length !== EXPECTED_COUNT) {
    errors.push(
      `${label}: 件数が ${entries.length} 件です (期待: ${EXPECTED_COUNT} 件)`
    );
  }
}

function validatePriorities(label, entries, errors) {
  entries.forEach(({ no, priority }) => {
    if (!VALID_PRIORITIES.has(priority)) {
      errors.push(`${label}: API No ${no} の優先度 "${priority}" が不正です`);
    }
  });
}

function mapByNo(entries, label, errors) {
  const map = new Map();
  entries.forEach((entry) => {
    if (map.has(entry.no)) {
      errors.push(`${label}: API No ${entry.no} が重複しています`);
      return;
    }
    map.set(entry.no, entry);
  });
  return map;
}

main();
