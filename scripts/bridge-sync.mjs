#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const MSW_SCHEMA_ROOT = join(repoRoot, 'artifacts', 'api-stability', '20251123T130134Z', 'schemas');
const DEFAULT_SERVER_RAW_ROOT = join(
  repoRoot,
  'artifacts',
  'api-stability',
  '20251124T151500Z',
  'ab-compare',
  '20251124T153000Z',
  'raw',
  'B',
);
const DEFAULT_MASTER_SYNC_ROOT = join(repoRoot, 'artifacts', 'api-stability', '20251124T000000Z', 'master-sync');
const DEFAULT_SOURCE_ROOTS = {
  msw: MSW_SCHEMA_ROOT,
  server: DEFAULT_SERVER_RAW_ROOT,
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    runId: '20251124T073245Z',
    date: '20251124',
    source: 'msw',
    masterSyncRoot: DEFAULT_MASTER_SYNC_ROOT,
    sourceRoot: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    if (!next) continue;
    if (arg === '--runId' || arg === '--run-id') {
      parsed.runId = next;
      i += 1;
    } else if (arg === '--date') {
      parsed.date = next;
      i += 1;
    } else if (arg === '--source') {
      parsed.source = next.toLowerCase();
      i += 1;
    } else if (arg === '--source-root') {
      parsed.sourceRoot = next;
      i += 1;
    } else if (arg === '--master-sync-root') {
      parsed.masterSyncRoot = next;
      i += 1;
    }
  }

  if (!parsed.date && parsed.runId) {
    parsed.date = parsed.runId.slice(0, 8);
  }

  if (!parsed.sourceRoot) {
    parsed.sourceRoot = DEFAULT_SOURCE_ROOTS[parsed.source] ?? MSW_SCHEMA_ROOT;
  }
  return parsed;
};

const readSchemaList = (fileName, root) => {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) {
    console.warn(`schema missing: ${filePath}`);
    return [];
  }
  const raw = readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const body = parsed?.expectation?.body ?? parsed?.body ?? parsed;
  if (!body) return [];
  if (Array.isArray(body)) {
    return body;
  }
  if (Array.isArray(body.list)) {
    return body.list;
  }
  if (body.list && Array.isArray(body.list)) {
    return body.list;
  }
  return [body];
};

const compareByKeys = (fields) => (a, b) => {
  for (const key of fields) {
    const left = a[key] ?? '';
    const right = b[key] ?? '';
    const leftStr = left === null || left === undefined ? '' : String(left);
    const rightStr = right === null || right === undefined ? '' : String(right);
    if (leftStr < rightStr) return -1;
    if (leftStr > rightStr) return 1;
  }
  return 0;
};

const canonicalize = (entry, fields, meta) => {
  const row = {};
  fields.forEach((field) => {
    if (field === 'dataSource') {
      row[field] = meta.source;
    } else if (field === 'runId') {
      row[field] = meta.runId;
    } else if (field === 'cacheHit' || field === 'missingMaster' || field === 'fallbackUsed') {
      row[field] = false;
    } else {
      row[field] = entry[field] ?? null;
    }
  });
  return row;
};

const computeHash = (records) => createHash('sha256').update(JSON.stringify(records)).digest('hex');

const MASTER_CONFIG = [
  {
    id: 'orca05',
    label: 'ORCA-05',
    sortKeys: ['masterType', 'code'],
    fields: [
      'masterType',
      'code',
      'name',
      'category',
      'unit',
      'minPrice',
      'youhouCode',
      'materialCategory',
      'kensaSort',
      'validFrom',
      'validTo',
      'version',
      'dataSource',
      'cacheHit',
      'missingMaster',
      'fallbackUsed',
      'runId',
    ],
    inputs: [
      {
        file: 'orca-master-generic-class.json',
        mapper: (entry) => ({
          masterType: 'drugClassification',
          code: entry.classCode ?? entry.code,
          name: entry.className ?? entry.name,
          category: entry.categoryCode ?? entry.parentClassCode ?? null,
          unit: null,
          minPrice: null,
          youhouCode: null,
          materialCategory: null,
          kensaSort: null,
          validFrom: entry.validFrom ?? entry.startDate ?? null,
          validTo: entry.validTo ?? entry.endDate ?? null,
          version: entry.version ?? null,
        }),
      },
      {
        file: 'orca-master-generic-price.json',
        sourceFiles: {
          server: 'orca05-generic-price.json',
        },
        mapper: (entry) => ({
          masterType: 'minimumDrugPrice',
          code: entry.srycd ?? entry.code,
          name: entry.drugName ?? entry.name,
          category: entry.priceType ?? 'generic-price',
          unit: entry.unit ?? null,
          minPrice: entry.price ?? null,
          youhouCode: null,
          materialCategory: null,
          kensaSort: null,
          validFrom: entry.validFrom ?? entry.startDate ?? null,
          validTo: entry.validTo ?? entry.endDate ?? null,
          version: entry.version ?? null,
        }),
      },
      {
        file: 'orca-master-youhou.json',
        sourceFiles: {
          server: 'orca05-youhou.json',
        },
        mapper: (entry) => ({
          masterType: 'dosageInstruction',
          code: entry.youhouCode ?? entry.code,
          name: entry.youhouName ?? entry.name,
          category: 'dosage',
          unit: null,
          minPrice: null,
          youhouCode: entry.youhouCode ?? null,
          materialCategory: null,
          kensaSort: null,
          validFrom: entry.validFrom ?? null,
          validTo: entry.validTo ?? null,
          version: entry.version ?? null,
        }),
      },
      {
        file: 'orca-master-material.json',
        sourceFiles: {
          server: 'orca05-material.json',
        },
        mapper: (entry) => ({
          masterType: 'specialEquipment',
          code: entry.materialCode ?? entry.code,
          name: entry.materialName ?? entry.name,
          category: entry.category ?? 'material',
          unit: entry.unit ?? null,
          minPrice: entry.price ?? null,
          youhouCode: null,
          materialCategory: entry.category ?? null,
          kensaSort: null,
          validFrom: entry.validFrom ?? entry.startDate ?? null,
          validTo: entry.validTo ?? entry.endDate ?? null,
          version: entry.version ?? null,
        }),
      },
      {
        file: 'orca-master-kensa-sort.json',
        sourceFiles: {
          server: 'orca05-kensa-sort.json',
        },
        mapper: (entry) => ({
          masterType: 'labClassification',
          code: entry.kensaCode ?? entry.code,
          name: entry.kensaName ?? entry.name,
          category: entry.classification ?? entry.insuranceCategory ?? null,
          unit: null,
          minPrice: null,
          youhouCode: null,
          materialCategory: null,
          kensaSort: entry.kensaCode ?? null,
          validFrom: null,
          validTo: null,
          version: entry.version ?? null,
        }),
      },
    ],
  },
  {
    id: 'orca06',
    label: 'ORCA-06',
    sortKeys: ['payerCode', 'prefCode', 'cityCode'],
    fields: [
      'recordType',
      'payerCode',
      'payerName',
      'payerType',
      'payerRatio',
      'prefCode',
      'cityCode',
      'zip',
      'addressLine',
      'address',
      'version',
      'dataSource',
      'cacheHit',
      'missingMaster',
      'fallbackUsed',
      'runId',
    ],
    inputs: [
      {
        file: 'orca-master-hokenja.json',
        sourceFiles: {
          server: 'orca06-hokenja.json',
        },
        mapper: (entry) => ({
          recordType: 'insurer',
          payerCode: entry.insurerNumber ?? entry.payerCode ?? null,
          payerName: entry.insurerName ?? null,
          payerType: entry.insurerType ?? entry.payerType ?? null,
          payerRatio: entry.payerRatio ?? null,
          prefCode: entry.prefectureCode ?? entry.prefCode ?? null,
          cityCode: entry.cityCode ?? null,
          zip: entry.zip ?? entry.zipCode ?? null,
          addressLine: entry.address ?? entry.fullAddress ?? null,
          address: entry.address ?? entry.fullAddress ?? null,
          version: entry.version ?? null,
        }),
      },
      {
        file: 'orca-master-address.json',
        sourceFiles: {
          server: 'orca06-address.json',
        },
        mapper: (entry) => {
          const fallbackAddressLine = `${entry.city ?? ''}${entry.town ?? ''}`.trim();
          return {
            recordType: 'address',
            payerCode: null,
            payerName: null,
            payerType: null,
            payerRatio: null,
            prefCode: entry.prefectureCode ?? entry.prefCode ?? null,
            cityCode: entry.cityCode ?? null,
            zip: entry.zipCode ?? entry.zip ?? null,
            addressLine: entry.fullAddress ?? (fallbackAddressLine || null),
            address: entry.fullAddress ?? null,
            version: entry.version ?? null,
          };
        },
      },
    ],
  },
  {
    id: 'orca08',
    label: 'ORCA-08',
    sortKeys: ['tensuCode'],
    fields: [
      'tensuCode',
      'name',
      'kubun',
      'tanka',
      'unit',
      'category',
      'startDate',
      'endDate',
      'tensuVersion',
      'version',
      'dataSource',
      'cacheHit',
      'missingMaster',
      'fallbackUsed',
      'runId',
    ],
    inputs: [
      {
        file: 'orca-master-etensu.json',
        sourceFiles: {
          server: 'orca08-etensu.json',
        },
        mapper: (entry) => ({
          tensuCode: entry.tensuCode ?? entry.medicalFeeCode ?? null,
          name: entry.name ?? null,
          kubun: entry.kubun ?? entry.category ?? null,
          tanka: entry.tanka ?? entry.points ?? null,
          unit: entry.unit ?? null,
          category: entry.category ?? entry.etensuCategory ?? null,
          startDate: entry.startDate ?? null,
          endDate: entry.endDate ?? null,
          tensuVersion: entry.tensuVersion ?? null,
          version: entry.version ?? null,
        }),
      },
    ],
  },
];

const selectFileNameForSource = (input, source) =>
  input.sourceFiles?.[source] ?? input.file;

const run = () => {
  const args = parseArgs();
  const sourceRoot = args.sourceRoot ?? DEFAULT_SOURCE_ROOTS[args.source] ?? MSW_SCHEMA_ROOT;
  const targetDir = join(args.masterSyncRoot, args.date, 'hashes', args.source);
  mkdirSync(targetDir, { recursive: true });

  MASTER_CONFIG.forEach((config) => {
    const rows = [];
    config.inputs.forEach((input) => {
      const file = selectFileNameForSource(input, args.source);
      const list = readSchemaList(file, sourceRoot);
      list.forEach((entry) => {
        const normalized = input.mapper(entry);
        if (normalized) {
          rows.push(normalized);
        }
      });
    });

    const sorted = rows.sort(compareByKeys(config.sortKeys));
    const canonical = sorted.map((entry) => canonicalize(entry, config.fields, { runId: args.runId, source: args.source }));
    const hash = computeHash(canonical);
    const filePath = join(targetDir, `${config.id}.hash`);
    writeFileSync(filePath, `${hash}\n`, 'utf8');
    process.stdout.write(`Written ${filePath} (${config.label})\n`);
  });

  process.stdout.write(`Bridge sync complete (runId=${args.runId}, source=${args.source}, date=${args.date})\n`);
};

run();
