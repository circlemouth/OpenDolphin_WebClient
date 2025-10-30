# 未整備 REST API 対応 UI 配置計画 (2026-05-24)

本資料では、`planning/WEB_VS_ONPRE_CHECKLIST.md` の REST API 比較表で未対応 (`×` または `△`) と判定されたエンドポイントに対し、Web クライアント上のどこに UI を配置し、どのフェーズで実装するかの方針を整理する。オンプレ（Swing）クライアントの画面構成との対応関係を明示し、実装時の責務分担と情報アーキテクチャを明確化することが目的である。

## 1. 認証・システム管理系 API

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/user` CRUD / `/user/facility` / `/user/name` | 左カラムナビゲーションに新設する「管理」セクション配下の `UserAdministrationPage`。`AppShell` の Primary ナビに続けて `Administration` グループを追加し、SurfaceCard ベースの一覧＋詳細ドロワを提供する。 | フェーズ5 並行運用準備 | 施設管理者のみがアクセスできるようロールガードを実装。ユーザー一括登録 CSV 取り込みは将来タスクとして別途検討。 |
| `/serverinfo/*` | 同 `UserAdministrationPage` 内の「システム状態」タブとして配置。ヘッダ右上の通知ボタンと連携し、最新情報を右サイドバーに表示する。 | フェーズ5 | API 応答をポーリングし監査ログへ記録。重大度に応じてバッジ色を切り替える。 |
| `/dolphin` 系設定・ライセンス | 管理セクション配下に `SystemPreferencesPage` を追加。`SurfaceCard` で「基本情報」「ライセンス」「Cloud Zero 連携」をタブ切り替え。 | フェーズ6 継続改善 | ライセンス更新はモーダルでトークン入力→`POST /dolphin/license`。アクティビティログはテーブル表示。 |

## 2. 受付・予約周辺 API

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/patient/pvt/*` / `/patient/documents/status` | 既存 `ReceptionPage` のカードアクションに「詳細」ドロワを追加し、来院履歴・カルテ連携を右サイドの詳細ペインで表示。`AppShell` の右カラム（Sidebar）を利用して受付詳細を表示する。 | フェーズ4 品質強化 | `/patient/documents/status` はカルテ状態バッジとして表示。 |
| `/pvt/*` / `DELETE /pvt2/{pvtPK}` | `ReceptionPage` の各受付カードに「受付取消」および状態直接編集用のモーダルを追加。旧 API は互換目的で「詳細操作」タブに限定。 | フェーズ4 | 既存の ChartEvent 連携と競合しないよう操作前にロック確認。 |
| `/schedule/document` / `DELETE /schedule/pvt` | `FacilitySchedulePage` の予約詳細ダイアログに「カルテ連動」セクションを追加して文書生成・解除を操作。 | フェーズ5 | 予約カードから直接カルテ作成できる導線を提供。 |

## 3. カルテ・文書関連 API

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/karte/docinfo/*` / `/karte/modules/*` / `/karte/images/*` | `ChartsPage` 左カラムのカルテタイムラインにフィルタパネルを追加し、詳細情報は中央カラムのタイムライン項目をクリックした際のスライドオーバーで表示。 | フェーズ5 | ドキュメント内のモジュール一覧はオンプレの DocInfoInspector 相当を再現。 |
| `/karte/diagnosis` 系 CRUD | `ChartsPage` 右ペインに「病名管理」カードを追加。検索・登録は既存スタンプセクションから遷移するモーダルで行う。 | フェーズ5 | 既存 ORCA マスター検索 UI と再利用。保存時に `/karte/diagnosis` を呼び出す。 |
| `/karte/observations` / `/karte/claim` / `/karte/moduleSearch` | `ChartsPage` の中央カラムにタブを追加し、「指示・観察」「請求調整」を切り替えられるようにする。`SurfaceCard` + `DataGrid` を使用。 | フェーズ6 | 請求調整は請求エラー解消を支援するため、警告バッジと監査ログ送出を実装。 |
| `PUT /karte/document` | 既存カルテタイムラインの各ノートカードに「編集」アクションを追加し、エディタをモーダルで再利用。保存時に `PUT` を呼び出しつつバージョン履歴を保持。 | フェーズ5 | 新旧 API の差分検証を `__tests__/progress-note-api.test.ts` に追加する。 |

## 4. テンプレート・スタンプ管理

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/stamp/tree` 更新系 / `/stamp/published/*` / `/stamp/subscribed/*` / `/stamp/list` | `ChartsPage` 補助パネルに「スタンプ管理センター」タブを追加し、左カラムでフォルダツリー、中央でスタンプ詳細、右カラムで共有設定を表示。 | フェーズ6 | ドラッグ＆ドロップとバージョン履歴を実装。公開/購読操作はアクセシビリティ対応のダイアログで提供。 |

## 5. ORCA・MML 連携

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/orca/facilitycode` / `/orca/deptinfo` / `/orca/inputset` | 管理セクションの `SystemPreferencesPage` に「ORCA 連携」タブを追加し、施設コードや診療科情報を設定。 | フェーズ5 | 既存 ORCA 設定ファイルと同期する移行スクリプトを同梱。 |
| `/orca/tensu/shinku` / `/orca/tensu/code` / `/orca/disease/import` / `/orca/disease/active` | `OrcaOrderPanel` に「詳細マスター」ドロップダウンを追加し、検索絞り込みから呼び出す。 | フェーズ4 | キャッシュ戦略（localStorage 禁止）を HTTP クライアントに設定。 |
| `/mml` 系 | `ChartsPage` のカルテタイムラインヘッダに「MML エクスポート」ボタンを追加し、エクスポート設定モーダルで選択項目とフォーマットを指定。 | フェーズ6 | Zip ダウンロード完了後に監査ログを送出。 |

## 6. 実装上の共通指針

1. **ナビゲーション構造**: 管理者向け機能は左カラムナビの新グループ「Administration」に集約し、一般ユーザーには表示しない。受付・カルテ関連は既存ページへカード／タブ追加で統合する。
2. **ロールベースアクセス制御**: `/user` や `/dolphin` などセンシティブな操作は `useAuth()` の権限スコープでガードし、Unauthorized 状態を UI で明示する。
3. **監査ログ・エラーハンドリング**: 新規 UI から呼び出す API すべてに `libs/audit` のフックを追加し、操作ログ・エラー通知を既存ポリシーに合わせる。
4. **並行運用**: Swing クライアントと同時利用する期間は、旧 API（`/pvt` など）を「詳細操作」タブに隔離し、誤操作防止の警告を表示する。
5. **ドキュメント連携**: 実装完了時には `planning/WEB_VS_ONPRE_CHECKLIST.md` の該当行を更新し、UI スクリーンショットを `docs/web-client/ux` 配下に保存する。

この計画はフェーズ5以降のスプリント計画に統合し、進捗に応じて四半期ごとに見直すこと。
