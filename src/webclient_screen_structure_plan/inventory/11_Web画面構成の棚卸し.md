# 11 Web画面構成の棚卸し

- RUN_ID: `20260106T065636Z`
- 期間: 2026-01-06 15:00 〜 2026-01-07 15:00 (JST) / 優先度: high / 緊急度: high / エージェント: gemini cli
- YAML ID: `src/webclient_screen_structure_plan/inventory/11_Web画面構成の棚卸し.md`

## 参照チェーン
1. `docs/DEVELOPMENT_STATUS.md`
2. `web-client/src/AppRouter.tsx`
3. `web-client/src/features/administration/AdministrationPage.tsx`
4. `web-client/src/features/outpatient/OutpatientMockPage.tsx`

## 1. 画面構成一覧（画面名 / URL / ガード / 用途）

| 画面名 | URL | ガード | 用途 / 補足 |
| --- | --- | --- | --- |
| ログイン | `/login` | 未ログインのみ表示。ログイン済みだと LoginSwitchNotice へ遷移。 | 施設ID/ユーザーID/パスワードでログイン。スイッチ要求時の入口。 |
| 施設固定ログイン | `/f/:facilityId/login` | 未ログインのみ表示。facilityId をロックしてログイン。 | 施設固定のディープリンク対応。 |
| 施設シェル（index） | `/f/:facilityId` | セッション必須。facilityId 不一致時は mismatch notice を表示。 | 受付へリダイレクトする入口。 |
| 受付 / トーン連携 | `/f/:facilityId/reception` | セッション必須 + facilityId 一致。 | Reception→Charts のトーン連携デモ画面。 |
| カルテ | `/f/:facilityId/charts` | セッション必須 + facilityId 一致。 | Charts 画面本体。 |
| カルテ印刷（外来） | `/f/:facilityId/charts/print/outpatient` | セッション必須 + facilityId 一致。 | 外来印刷プレビュー。 |
| カルテ印刷（文書） | `/f/:facilityId/charts/print/document` | セッション必須 + facilityId 一致。 | 文書印刷プレビュー。 |
| 患者管理 | `/f/:facilityId/patients` | セッション必須 + facilityId 一致。 | 患者一覧/編集。 |
| Administration 配信 | `/f/:facilityId/administration` | セッション必須 + facilityId 一致。UI 上は `system_admin/admin/system-admin` 以外は編集不可。 | 配信設定と ORCA キュー操作。URL 直アクセス自体の遮断は UI 側ガードのみ。 |
| Outpatient Mock | `/f/:facilityId/outpatient-mock` | セッション必須 + facilityId 一致。 | MSW シナリオ/故障注入の検証用モック画面。 |
| 施設不一致ガード表示 | `/f/:facilityId/*` （facilityId 不一致時） | セッションはあるが facilityId が一致しない場合に表示。 | 施設境界エラー表示（アクセス拒否）。 |

## 2. 互換ルート / リダイレクト

| 種別 | URL | ガード | 補足 |
| --- | --- | --- | --- |
| Legacy 互換 | `/reception` | セッション必須。未ログインなら `/login` へ遷移。 | `/f/:facilityId/reception` へリダイレクト。 |
| Legacy 互換 | `/charts` | 同上 | `/f/:facilityId/charts` へリダイレクト。 |
| Legacy 互換 | `/charts/print/outpatient` | 同上 | `/f/:facilityId/charts/print/outpatient` へリダイレクト。 |
| Legacy 互換 | `/charts/print/document` | 同上 | `/f/:facilityId/charts/print/document` へリダイレクト。 |
| Legacy 互換 | `/patients` | 同上 | `/f/:facilityId/patients` へリダイレクト。 |
| Legacy 互換 | `/administration` | 同上 | `/f/:facilityId/administration` へリダイレクト。 |
| Legacy 互換 | `/outpatient-mock` | 同上 | `/f/:facilityId/outpatient-mock` へリダイレクト。 |
| ワイルドカード | `/f/:facilityId/*` | セッション必須 + facilityId 一致。 | 該当ルート無しの場合は `/f/:facilityId/reception` へ遷移。 |
| ワイルドカード | `*` | 未ログインなら `/login`、ログイン済みなら legacy redirect。 | 旧ルートも含め施設付き URL へ収束。 |

## 3. 本番導線として不適切な画面（デバッグ/検証/モック）

- Outpatient Mock (`/f/:facilityId/outpatient-mock`, `/outpatient-mock`)
  - MSW シナリオ選択/故障注入/テレメトリ検証が主目的で、本番導線に不要。
  - 画面自体はセッション必須だが、権限/環境スイッチによる本番非表示が未整備。

## 4. 補足（ガード方針）

- ルート全体のセッションガードは `FacilityGate` で実装（未ログインは `/login` へリダイレクト）。
- 施設境界は `FacilityShell` 内で一致判定し、不一致時は専用の拒否画面を表示。
- Administration の権限制御は UI 側での操作ブロックが中心で、URL 直アクセスの遮断は未実装。
