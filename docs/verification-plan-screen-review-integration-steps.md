# 画面レビュー本文案の差し込み手順（verification-plan.md 用）

対象:
- `docs/verification-plan.md`
- `docs/web-client/architecture/web-client-screen-review-snippet-20260202.md`

## 手順
1. `docs/verification-plan.md` の「4. 画面一覧と確認観点」直下の [PLACEHOLDER] 注記を、本文案の「画面一覧・確認観点（概要）」の導入文に置換する。
2. 4.1 画面一覧の直後に小見出しを追加し、本文案の「表のサンプル行」を差し込む。
   - 推奨見出し: `#### 4.1.1 サンプル行（差し込み例）`
3. 本文案の「差し込み位置案」は、本文ではなく注記扱いにし、4章冒頭の注記（PLACEHOLDER置換後の末尾）に 1 行で追記する。
   - 例: `注: 本節は WEB_CLIENT_IMPLEMENTATION_PLAN.md の 1章直後または2章冒頭の差し込みテンプレとしても利用する。`
4. 本文案の「要確認事項（短く）」は `docs/verification-plan.md` の **10. 要確認事項** に統合する。
   - 10章に既存の箇条書きがあるため、重複を避けつつ追記または置換のどちらかを選ぶ。
   - 4章内に残す場合は「抜粋」表記を明記し、10章を正本とする。

## 見出し整合案
- `web-client-screen-review-snippet-20260202.md` の見出しは **そのまま転記せず**、`verification-plan.md` の 4章配下の見出しに合わせて再配置する。
- 推奨配置:
  - 概要導入文 → `4. 画面一覧と確認観点` の導入文
  - サンプル行 → `4.1 画面一覧` の直後に `4.1.1` として追加
  - 要確認事項 → `10. 要確認事項` へ統合

