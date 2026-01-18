# server-modernized 運用メモ（Subjectives 既定値）

## 既定動作
- subjectives（`/orca/chart/subjectives`）は **デフォルトで REAL**。プロファイルが dev / prod いずれでも、環境変数やシステムプロパティを設定しない状態で stub 応答にはならない。

## stub へ切り替える方法（上から優先）
1. `ORCA_POST_SUBJECTIVES_MODE=stub`（または `-Dorca.post.subjectives.mode=stub`）
2. `ORCA_POST_SUBJECTIVES_USE_STUB=true`（または `-Dorca.post.subjectives.useStub=true`）
3. 全体設定 `ORCA_POST_MODE=stub`（subjectives 個別設定が無い場合のみ有効）

## REAL を明示したい場合
- `ORCA_POST_SUBJECTIVES_MODE=real` または `-Dorca.post.subjectives.mode=real` を指定する。

## 開発/検証で stub を使う例
```bash
# stub 応答に切替えて動作確認したいとき
ORCA_POST_SUBJECTIVES_MODE=stub
# または
ORCA_POST_SUBJECTIVES_USE_STUB=true
```
