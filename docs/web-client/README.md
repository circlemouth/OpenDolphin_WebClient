# Web クライアント開発ドキュメントハブ

Web クライアントに関するドキュメントは以下のカテゴリに整理されています。まずは本ファイルを起点に参照し、必要に応じて各資料を更新してください。

## 1. アーキテクチャ / 要件
- [`architecture/REPOSITORY_OVERVIEW.md`](architecture/REPOSITORY_OVERVIEW.md): リポジトリ構成と各モジュールの役割。
- [`architecture/WEB_CLIENT_REQUIREMENTS.md`](architecture/WEB_CLIENT_REQUIREMENTS.md): 機能・非機能・セキュリティ要件。
- [`architecture/REST_API_INVENTORY.md`](architecture/REST_API_INVENTORY.md): Web クライアントが利用する REST API の一覧と注意点。
- [`architecture/SERVER_MODERNIZATION_PLAN.md`](architecture/SERVER_MODERNIZATION_PLAN.md): サーバー刷新/連携の将来計画。

## 2. プロセス / 計画
- [`process/ROADMAP.md`](process/ROADMAP.md): フェーズ 0〜2 の成果と次アクションを統合したロードマップ。
- [`process/SWING_PARITY_CHECKLIST.md`](process/SWING_PARITY_CHECKLIST.md): Web とオンプレ（Swing）機能差分の確認チェックリスト。
- [`process/API_UI_GAP_ANALYSIS.md`](process/API_UI_GAP_ANALYSIS.md): 未整備 API と UI の対応状況、実装優先度。
- [`process/SECURITY_AND_QUALITY_IMPROVEMENTS.md`](process/SECURITY_AND_QUALITY_IMPROVEMENTS.md): セキュリティ・品質改善のサマリと監査ポリシー。

## 3. 臨床・運用ガイド
- [`guides/CLINICAL_MODULES.md`](guides/CLINICAL_MODULES.md): 患者管理、受付・予約、カルテ補助、ORCA 連携、帳票/シェーマ機能の統合ガイド。
- `operations/` 配下: テスト環境構築、受付運用マニュアル、CareMap 添付移行などの手順書。
- `design-system/`・`ux/`: UI コンポーネントと UX ガイドライン。`ux/ONE_SCREEN_LAYOUT_GUIDE.md` はレイアウト検討の指針。

## 4. 更新ルール
- 新しい資料を追加した場合は必ずこの README にリンクと概要を追記すること。
- ドキュメントの改訂日と変更内容を各ファイルに記録し、チーム内共有を行う。
- セキュリティや監査に影響する変更は `process/SECURITY_AND_QUALITY_IMPROVEMENTS.md` も更新する。

## 直近更新履歴
- 2026-06-01: PHR 管理タブと患者データ出力ページの実装内容を整理。`process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-05-31: 管理画面未実装項目の調査結果を反映。`process/SWING_PARITY_CHECKLIST.md` を再構成。
- 2026-05-27: 受付詳細モーダルの旧 API 対応タブを実装し、`process/API_UI_GAP_ANALYSIS.md` と `process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-05-25: 施設予約一覧の改修内容を整理。`guides/CLINICAL_MODULES.md` へ統合。
- 2026-05-24: 未整備 API の UI 対応計画を更新。`process/API_UI_GAP_ANALYSIS.md` を参照。
