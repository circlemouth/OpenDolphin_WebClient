# 20 ChartsPatientSummaryBar 設計

- RUN_ID: `20260111T001943Z`
- 期間: 2026-01-11 19:00 〜 2026-01-12 19:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/webclient_charts_compact_layout_plan_20260111/design/20_ChartsPatientSummaryBar設計.md`

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `src/webclient_charts_compact_layout_plan_20260111/discovery/10_現状UI棚卸し.md`
- `src/webclient_charts_compact_layout_plan_20260111/discovery/11_重複UIコンポーネント整理.md`
- `docs/web-client/ux/charts-compact-layout-proposal-20260110.md`

## 1. SummaryBar レイアウト仕様

### 1-1. 構成（3カラム + 行内折り返し）
```
[ChartsPatientSummaryBar]
┌─────────────────────────────────────────────────────────────┐
│ Left: 患者識別    │ Center: ID/診療日 │ Right: 安全/RunId    │
│ 患者名/カナ/性別年齢 │ 患者ID/受付/予約 │ SafetySummary + RunId │
│                   │ 診療日/時刻      │ (詳細は折りたたみ)   │
└─────────────────────────────────────────────────────────────┘
```

- **Left（患者識別ブロック）**
  - 1行目: `患者名`（メイン）
  - 2行目: `患者カナ`（サブ）
  - 3行目: `性別` + `年齢`（例: `男 / 42歳`）
- **Center（ID/診療日ブロック）**
  - 1行目: `PatientMetaRow`（患者ID / 受付ID / 予約ID）
  - 2行目: `診療日` + `診療時刻`（未取得なら `—`）
- **Right（安全/RunId ブロック）**
  - 1行目: `PatientSafetySummary`（安全表示アイコン + ラベル + トーン）
  - 1行目右寄せ: `RunIdBadge`
  - 2行目: `SafetyDetailAccordion`（折りたたみ、既定は閉）

### 1-2. 優先順位・省略ルール
- **患者名/ID/診療日**は常時表示。安全表示の詳細は折りたたみ。
- 画面幅が狭い場合は **Center → Right** の順で折り返し、Left は最優先で保持する。
- `患者カナ` は `患者名` の直下に置き、該当がない場合は行ごと省略。
- `診療時刻` は `visitDate` と同列にし、無い場合は `visitDate` のみ表示。
- `RunIdBadge` は常時表示、コピー操作は既存仕様に準拠。

### 1-3. レスポンシブ挙動（簡易）
- **≥1280px**: 3カラム横並び（Left/Center/Right）。
- **1024〜1279px**: 2段構成（Left + Center を1段、Right は次段に右寄せ）。
- **<1024px**: 1カラム縦積み。行内は `PatientMetaRow` と `診療日` を先に表示し、`SafetyDetailAccordion` は下段へ。

## 2. 安全表示（折りたたみ詳細）仕様

### 2-1. 表示状態
- **既定**: 折りたたみ（closed）。
- **患者切替時**: 状態はリセットして閉じる。
- **開閉操作**: `PatientSafetySummary` の右端にトグルボタン（▼/▶）を配置。

### 2-2. アクセシビリティ
- トグルは `button` とし、`aria-expanded` と `aria-controls` を必須。
- `aria-controls` は `charts-safety-detail` を指す。
- `RunIdBadge` はトグル対象外（クリックで折りたたまれない）。

### 2-3. 詳細メタの内容（折りたたみ内）
折りたたみ詳細では **安全識別メタのみ** を出し、SummaryBar 上段と重複しない。

| セクション | 内容 | 表示ルール |
| --- | --- | --- |
| 生年月日 | `birthDateEra` + `birthDateIso` | 片方のみの場合は存在する方のみ表示 |
| 安全フラグ | `missingMaster` / `fallbackUsed` / `cacheHit` | true/false を短いラベルで表示 |
| データ遷移 | `dataSourceTransition.from → to` + `reason` | 未提供なら非表示 |
| 取得メタ | `recordsReturned` / `fetchedAt` | 取得できる場合のみ表示 |
| 監査 | `runId`（参照用） | SummaryBar 右側で表示済みのため、詳細ではラベル付き小文字で表示 |

※ 患者ID/受付ID/予約ID は **通常表示に集約**するため、折りたたみ内では原則非表示。

### 2-4. トーン表現（安全サマリ）
- `missingMaster=true` の場合は **Warning トーン** を既定。
- `dataSourceTransition=server` へ移行した直後は **Info トーン**。
- `fallbackUsed=true` は **Warning**、`cacheHit=true` は **Info**。
- トーンは `PatientSafetySummary` の色とアイコンに反映し、`aria-live=polite` を既定（致命的な警告の場合のみ `assertive`）。

## 3. Props 一覧

### 3-1. ChartsPatientSummaryBar
```
interface ChartsPatientSummaryBarProps {
  patientDisplay: {
    name: string
    kana?: string
    sex?: string
    age?: string
    birthDateEra?: string
    birthDateIso?: string
  }
  patientId?: string
  receptionId?: string
  appointmentId?: string
  visitDate?: string
  appointmentTime?: string
  runId?: string
  missingMaster?: boolean
  fallbackUsed?: boolean
  cacheHit?: boolean
  dataSourceTransition?: {
    from?: string
    to?: string
    reason?: string
  }
  recordsReturned?: number
  fetchedAt?: string
  onToggleSafetyDetail?: (open: boolean) => void
}
```

### 3-2. PatientSafetySummary（内包コンポーネント）
```
interface PatientSafetySummaryProps {
  missingMaster?: boolean
  fallbackUsed?: boolean
  cacheHit?: boolean
  dataSourceTransition?: {
    from?: string
    to?: string
    reason?: string
  }
  tone?: 'info' | 'warning' | 'error'
  ariaLive?: 'polite' | 'assertive'
}
```

### 3-3. SafetyDetailAccordion（内包コンポーネント）
```
interface SafetyDetailAccordionProps {
  open: boolean
  birthDateEra?: string
  birthDateIso?: string
  runId?: string
  missingMaster?: boolean
  fallbackUsed?: boolean
  cacheHit?: boolean
  dataSourceTransition?: {
    from?: string
    to?: string
    reason?: string
  }
  recordsReturned?: number
  fetchedAt?: string
}
```

## 4. 未決事項
- `dataSourceTransition` と `missingMaster` のトーン優先順位の最終確定（Charts/Reception での既存トーンと整合）。
- `recordsReturned` / `fetchedAt` の取得元が無い場合の表示（空欄 or 省略）の既定値。
