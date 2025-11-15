# Phase2 Systems Alignment

- 作成日: 2025-11-15
- 担当: Web クライアント UX マネージャー
- RUN_ID: `20251115T143200Z`

本ドキュメントは Phase2 の Web クライアント・モダナイズ版サーバー・WebORCA トライアルサーバー間で共有すべき前提と配線を 1 か所に集約し、UX とサーバー運用双方の Runbook へ素早くフォローアップできるようにする。Legacy サーバー/クライアントは参照専用アーカイブであり、差分検証のためにのみ起動可（保守・稼働維持作業は禁止）。

## 1. 目的

1. Web クライアント側の UX シナリオとサーバー側の API/Runbook を同一 RUN_ID で結び、手戻りなく検証ログを残す。
2. WebORCA 接続は `https://weborca-trial.orca.med.or.jp/`（BASIC 認証 `trial` / `weborcatrial`）のみを利用し、他環境や `curl --cert-type P12` を含む本番経路は遮断する方針を文書化する。
3. DOC_STATUS と各チェックリストで共有される「Phase2 必読チェーン」を具体的な成果物（配線図・契約表・Runbook 紐付け）に落とし込む。

## 2. 三者接続図

```
┌─────────────────────────────┐
│ Web クライアント (Next.js / Vite)│
│ - 認証: OAuth2 (mod server)      │
│ - UI: ChartsPage / SSO Dashboard │
└──────────────┬────────────────┘
               │ REST/GraphQL over HTTPS (Modernized)
┌──────────────▼────────────────┐
│ モダナイズ版サーバー (WildFly33) │
│ - API Gateway / Domain Services │
│ - Audit / RUN_ID Propagation    │
└──────────────┬────────────────┘
               │ ORCA Adapter (Trial専用) / JMS fallback 禁止
┌──────────────▼────────────────┐
│ WebORCA Trial (`https://weborca-trial.orca.med.or.jp/`) │
│ - BASIC: trial/weborcatrial                             │
│ - CRUD: 新規/更新/削除 OK（Trial のみ）                  │
└──────────────────────────────────────────────┘
```

補足:
- すべての RUN_ID はモダナイズ版サーバーの `X-Run-Id` ヘッダーと Web クライアントの telemetry に伝播する。
- Trial サーバー以外の ORCA/PHR 実環境には接続しない。必要な証跡は Trial で取得し、アーカイブ参照のみ。

## 3. API 契約

| 経路 | 主なエンドポイント | 契約文書 | 備考 |
| --- | --- | --- | --- |
| Web クライアント → モダナイズ版サーバー | `/api/v2/charts/*`, `/api/v2/orca/*`, `/stamp/tree/{facility}/{scope}` | `docs/web-client/architecture/WEB_CLIENT_REQUIREMENTS.md` §5/§14, `docs/web-client/architecture/SERVER_MODERNIZATION_PLAN.md` | RUN_ID をリクエストヘッダーに必須化し、`20251115T143200Z` 以降は ChartsPage 改修タスクでも同一規約を適用。 |
| モダナイズ版サーバー → WebORCA Trial | `/api01rv2/patientlstv2`, `/api01rv2/medicalmodv2`, `/orca14/appointlstv2` など | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`, `docs/server-modernization/phase2/operations/assets/orca-api-spec/README.md` | トライアル環境 CRUD 前提。`curl --cert-type P12` を含む本番証明書経路は禁止し、BASIC 認証文字列を `.netrc-orca-trial` に限定。 |
| モダナイズ版サーバー → Legacy 資産 | `/server/LEGACY_REST_API_INVENTORY.md` 参照のみ | `docs/web-client/architecture/REPOSITORY_OVERVIEW.md`, `docs/server-modernization/phase2/domains/*` | Legacy サーバーは参照専用アーカイブ。稼働維持を目的とした起動は禁止し、差分比較時のみ再利用可能。 |

## 4. Runbook 連携

1. `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4-5 を「三者接続テスト」の唯一の Runbook とし、Web クライアント UX 改修時もここへ証跡リンクを戻す。
2. `docs/web-client/operations/LEGACY_INTEGRATION_CHECKS.md` に Phase2 Systems Alignment 参照節を追加予定（タスク ID: UX-SYNC-05）。
3. `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md` へ API 契約差分を同期し、RUN_ID で追跡。
4. マネージャー向けには `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` に「PHASE2_SYSTEMS_ALIGNMENT ドラフトの最新化」をチェック項目として追記する。

## 5. 証跡保存先

- ランディング: `docs/web-client/architecture/PHASE2_SYSTEMS_ALIGNMENT.md`（本書）
- ログ: `docs/server-modernization/phase2/operations/logs/2025-11-15-systems-alignment.md`（RUN_ID=`20251115T143200Z` の具体的な curls／UI キャプチャ貼付予定）
- 追加資料: `artifacts/systems-alignment/20251115T143200Z/`
- DOC_STATUS: `docs/web-client/planning/phase2/DOC_STATUS.md` Active 行（備考欄に RUN_ID と保存先を記載済み）

> 更新履歴は RUN_ID ごとにこの章末へ追記し、DOC_STATUS と同じ日付／担当を併記すること。
