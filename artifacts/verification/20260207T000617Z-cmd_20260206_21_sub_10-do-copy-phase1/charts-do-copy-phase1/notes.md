RUN_ID=20260207T000617Z-cmd_20260206_21_sub_10-do-copy-phase1
baseURL=http://localhost:5195

手順:
1) SOAP Subjective に SRC を入力し保存（履歴作成）
2) Subjective を TARGET に変更（未保存）
3) Past Hub -> 記載 -> Subjective の Do転記 を押下
4) プレビューで適用 → Undo（1回）

期待:
- compact/非compactに関わらず Past Panel 操作で中央SOAPを壊さない
- Do転記プレビューが転記元/転記先を明示
- Undo が 1回できる
