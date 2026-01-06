# 11 Web画面構成の棚卸し

- RUN_ID: `20260106T070732Z`
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
| ログイン | `/login` | 未ログインのみ表示。ログイン済みは LoginSwitchNotice を表示。 | 施設ID/ユーザーID/パスワードでログイン。切替要求時の入口。 |
| 施設固定ログイン | `/f/:facilityId/login` | 未ログインのみ表示。facilityId をロックしてログイン。 | 施設固定のディープリンク対応。 |
| 施設シェル（index） | `/f/:facilityId` | セッション必須 + facilityId 一致。 | `/f/:facilityId/reception` へリダイレクト。 |
| 受付 / トーン連携 | `/f/:facilityId/reception` | セッション必須 + facilityId 一致。 | Reception 画面本体。 |
| カルテ | `/f/:facilityId/charts` | セッション必須 + facilityId 一致。 | Charts 画面本体。 |
| カルテ印刷（外来） | `/f/:facilityId/charts/print/outpatient` | セッション必須 + facilityId 一致。 | 外来印刷プレビュー。 |
| カルテ印刷（文書） | `/f/:facilityId/charts/print/document` | セッション必須 + facilityId 一致。 | 文書印刷プレビュー。 |
| 患者管理 | `/f/:facilityId/patients` | セッション必須 + facilityId 一致。 | 患者一覧/編集。 |
| Administration 配信 | `/f/:facilityId/administration` | セッション必須 + facilityId 一致。 | 画面自体は表示可。UI 上は `system_admin/admin/system-admin` 以外は編集不可（URL 直アクセスの遮断は未実装）。 |
| Outpatient Mock | `/f/:facilityId/outpatient-mock` | セッション必須 + facilityId 一致。 | MSW シナリオ/故障注入の検証用モック画面。 |
| 施設不一致ガード表示 | `/f/:facilityId/*`（facilityId 不一致時） | セッションはあるが facilityId が一致しない場合に表示。 | 施設境界エラー表示（アクセス拒否）。 |

## 2. ルート挙動（/login, /f/:facilityId/login, /f/:facilityId(index), /f/:facilityId/*, *）

| URL | 未ログイン時 | ログイン済み時 | 実装の根拠 |
| --- | --- | --- | --- |
| `/login` | LoginScreen を表示。 | LoginSwitchNotice を表示（ログイン中の切替はログアウト要求）。 | FacilityGate + isLoginRoute 判定。 |
| `/f/:facilityId/login` | LoginScreen を表示（facilityId ロック）。 | LoginSwitchNotice を表示。 | FacilityGate + isLoginRoute 判定。 |
| `/f/:facilityId` | `/login` にリダイレクト。 | `/f/:facilityId/reception` にリダイレクト（facilityId 一致時）。 | FacilityShell の index route。 |
| `/f/:facilityId/*` | `/login` にリダイレクト。 | 該当ルートがあれば表示、なければ `/f/:facilityId/reception` へ遷移。facilityId 不一致時は拒否画面。 | FacilityShell の Routes + mismatch guard。 |
| `*` | `/login` にリダイレクト。 | LegacyRootRedirect により施設付き URL へ収束。 | AppRouter の wildcard route。 |

## 3. LegacyRootRedirect / FacilityGate の役割

- FacilityGate
  - 未ログイン時は `/login`（または `/f/:facilityId/login`）へ誘導。
  - ログイン済みで login ルートに来た場合は LoginSwitchNotice を表示（ログイン済みの login ルートをブロック）。
- LegacyRootRedirect
  - 旧ルート（`/reception` 等）や `*` へのアクセスを施設付き URL に正規化。
  - 未ログイン時は `/login` へリダイレクトするガードも内包。

## 4. 本番導線として不適切な画面（デバッグ/検証/モック）

- Outpatient Mock（除外確定）
  - MSW シナリオ選択/故障注入/テレメトリ検証が主目的で、本番導線に不要。
  - 画面自体はセッション必須だが、権限/環境スイッチによる本番非表示が未整備。
- Reception（除外しない）
  - 画面内に「トーン連携デモ」の文言があるが、AppRouter の主要ナビ（受付/Reception）として本線導線に組み込まれている。
  - デモ文言のみを根拠に除外しない方針に従い、本番導線に含める。

## 5. 補足（ガード方針・現行ルール）

- ルート全体のセッションガードは `FacilityGate` で実装（未ログインは `/login` へリダイレクト）。
- 施設境界は `FacilityShell` で一致判定し、不一致時は専用の拒否画面を表示。
- Administration の権限制御は UI 側での操作ブロックが中心で、URL 直アクセスの遮断は未実装。
- `docs/DEVELOPMENT_STATUS.md` の現行ルールに従い、Phase2 ドキュメントは Legacy 扱い（参照のみ）。
