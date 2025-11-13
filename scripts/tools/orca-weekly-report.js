#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../');
const PROGRESS_PATH = path.join(
  REPO_ROOT,
  'docs/server-modernization/phase2/PHASE2_PROGRESS.md'
);
const DOC_STATUS_PATH = path.join(
  REPO_ROOT,
  'docs/web-client/planning/phase2/DOC_STATUS.md'
);
const JSON_OUTPUT_PATH = path.join(REPO_ROOT, 'tmp/orca-weekly-summary.json');
const MARKDOWN_OUTPUT_PATH = path.join(REPO_ROOT, 'tmp/orca-weekly-summary.md');

function main() {
  try {
    const progressMarkdown = readFile(PROGRESS_PATH);
    const docStatusMarkdown = readFile(DOC_STATUS_PATH);

    const latestEvidence = extractLatestOrcaEvidence(progressMarkdown);
    const latestWeeklyRow = extractLatestDocStatusRow(docStatusMarkdown);

    const payload = {
      generatedAt: new Date().toISOString(),
      progress: {
        path: toRepoRelative(PROGRESS_PATH),
        latestOrcaEvidence: latestEvidence
      },
      docStatus: {
        path: toRepoRelative(DOC_STATUS_PATH),
        latestWeeklyRow
      }
    };

    persistOutputs(payload);
    printSummary(payload);
  } catch (error) {
    console.error(`[orca-weekly] エラー: ${error.message}`);
    process.exit(1);
  }
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイルが存在しません: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function extractLatestOrcaEvidence(markdown) {
  const normalized = normalizeNewlines(markdown);
  const sectionMatch = normalized.match(
    /###\s*週次エビデンスリンク[^\n]*\n([\s\S]*?)(?=\n### |\n## |$)/
  );
  if (!sectionMatch) {
    throw new Error('PHASE2_PROGRESS.md 内の「週次エビデンスリンク」セクションが見つかりません');
  }
  const section = sectionMatch[1];
  const pattern = /- \*\*(.+?)\*\*:([\s\S]*?)(?=\n- \*\*|\n### |\n## |$)/g;
  const entries = [];
  let match;
  while ((match = pattern.exec(section)) !== null) {
    const heading = match[1].trim();
    const body = flattenWhitespace(match[2]);
    const meta = heading.match(
      /^(?<label>[^\uFF08(]+?)\s*[\uFF08(](?<date>\d{4}-\d{2}-\d{2})[^`]*?RUN_ID=`(?<runId>[^`]+)`/u
    );
    if (!meta) {
      continue;
    }
    entries.push({
      label: meta.groups.label.trim(),
      date: meta.groups.date,
      runId: meta.groups.runId,
      summary: body,
      headingRaw: heading,
      sortKey: buildDateSortKey(meta.groups.date, entries.length)
    });
  }
  if (entries.length === 0) {
    throw new Error('週次エビデンスリンク内に RUN_ID 情報が見つかりません');
  }
  const latest = [...entries].sort((a, b) => a.sortKey - b.sortKey).pop();
  const { sortKey, ...rest } = latest;
  return rest;
}

function extractLatestDocStatusRow(markdown) {
  const normalized = normalizeNewlines(markdown);
  const header = '| 週次日付 | 更新者 | 主な変更 | 次回アクション |';
  const index = normalized.indexOf(header);
  if (index === -1) {
    throw new Error('DOC_STATUS.md 内に週次テーブルが見つかりません');
  }
  const lines = normalized.slice(index).split('\n');
  const rows = [];
  for (let i = 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line || line.trim().length === 0) {
      break;
    }
    if (!line.trim().startsWith('|')) {
      break;
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 4) {
      continue;
    }
    const [weekRange, owner, summary, nextAction] = cells;
    const rangeInfo = parseWeekRange(weekRange);
    rows.push({
      weekRange,
      owner,
      summary,
      nextAction,
      ...rangeInfo,
      sortKey: buildDateSortKey(rangeInfo.endDate || rangeInfo.startDate, rows.length)
    });
  }
  if (rows.length === 0) {
    throw new Error('週次テーブルの行が見つかりませんでした');
  }
  const latest = [...rows].sort((a, b) => a.sortKey - b.sortKey).pop();
  const { sortKey, ...rest } = latest;
  return rest;
}

function parseWeekRange(value) {
  const match = value.match(
    /^([^\s(]+?)\s*[\uFF08(](\d{4}-\d{2}-\d{2})〜(\d{4}-\d{2}-\d{2})[\uFF09)]?/u
  );
  if (!match) {
    return {
      weekLabel: value.trim(),
      startDate: null,
      endDate: null
    };
  }
  const [, weekLabel, startDate, endDate] = match;
  return { weekLabel, startDate, endDate };
}

function buildDateSortKey(dateStr, fallbackIndex) {
  if (!dateStr) {
    return -Number.MAX_VALUE + fallbackIndex;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  if ([year, month, day].some((n) => Number.isNaN(n))) {
    return -Number.MAX_VALUE + fallbackIndex;
  }
  return Date.UTC(year, month - 1, day) + fallbackIndex / 1000;
}

function persistOutputs(payload) {
  ensureDir(path.dirname(JSON_OUTPUT_PATH));
  ensureDir(path.dirname(MARKDOWN_OUTPUT_PATH));
  fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(payload, null, 2));
  fs.writeFileSync(MARKDOWN_OUTPUT_PATH, buildMarkdownSnippet(payload));
}

function buildMarkdownSnippet(payload) {
  const { latestOrcaEvidence } = payload.progress;
  const { latestWeeklyRow } = payload.docStatus;
  const weekLabel = latestWeeklyRow.weekLabel || latestOrcaEvidence.label;
  const lines = [
    `直近週次: ${latestOrcaEvidence.date} (${weekLabel}) / RUN_ID=\`${latestOrcaEvidence.runId}\``,
    `- DOC_STATUS: ${latestWeeklyRow.weekRange} / ${latestWeeklyRow.owner}`
  ];
  if (latestWeeklyRow.summary) {
    lines.push(`- 主な変更: ${latestWeeklyRow.summary}`);
  }
  if (latestWeeklyRow.nextAction) {
    lines.push(`- 次回アクション: ${latestWeeklyRow.nextAction}`);
  }
  if (latestOrcaEvidence.summary) {
    lines.push(`- Evidence: ${latestOrcaEvidence.summary}`);
  }
  return `${lines.join('\n')}\n`;
}

function printSummary(payload) {
  const { latestOrcaEvidence } = payload.progress;
  const { latestWeeklyRow } = payload.docStatus;
  console.log(
    `[orca-weekly] ORCA RUN_ID=${latestOrcaEvidence.runId} (${latestOrcaEvidence.date}, ${latestOrcaEvidence.label})`
  );
  console.log(
    `[orca-weekly] DOC_STATUS 最新週次: ${latestWeeklyRow.weekRange} / ${latestWeeklyRow.owner}`
  );
  console.log(
    `[orca-weekly] JSON 出力: ${toRepoRelative(JSON_OUTPUT_PATH)}`
  );
  console.log(
    `[orca-weekly] Markdown 出力: ${toRepoRelative(MARKDOWN_OUTPUT_PATH)}`
  );
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n');
}

function flattenWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function toRepoRelative(absolutePath) {
  return path.relative(REPO_ROOT, absolutePath) || '.';
}

main();
