# Web クライアント / モダナイズ版サーバー リリースノート草案（更新日: 2025-11-03）

## 文書・スタンプ機能の差分（Worker F 報告）
- **スタンプ API パリティ**: `StampResource` の 15 エンドポイント（ツリー CRUD / 公開・購読管理 / 個別・一括 CRUD）がモダナイズ版に移植済みであることを再確認。`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` を更新済み。
- **スタンプ監査強化方針**: スタンプ削除 API で `AuditTrailService` に `STAMP_DELETE_SINGLE`/`STAMP_DELETE_BULK` を記録する設計を確定。実装チケットは 2025-11-04 登録予定。
- **レター API パリティ**: `GET/DELETE /odletter/letter/{id}` が Jakarta 版でも提供されることを明記し、文書一覧・詳細の互換性テストを 2025-11-05 着手とする。
- **MML/ORCA 未移植**: `GET /mml/letter/*`, `GET /mml/labtest/*`, `PUT /orca/interaction` は未実装。短期的には旧サーバーへのフォールバックを採用し、移植スプリント候補に登録。

## データ移行 / 監査計画要約
- **スタンプ階層データ移行**: 旧環境から `/stamp/tree` `/stamp/list` 等でバックアップし、モダナイズ版へ PUT。Worker B のデモスタンプ JSON もこの手順で取り込み、Worker C がキャッシュ整合を確認する。詳細は `STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` 参照。
- **監査ログ検証**: スタンプ／レター削除後に `d_audit_event` の `action` と `status` を確認する SQL を手順化（`api-smoke-test.md` に追記予定）。
- **MML/ORCA フォールバックガイド**: 未移植 API を利用する場合は `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に沿って旧サーバーへリバースプロキシ迂回し、差分を記録。

## QA・整合テスト計画
- `tests/stamp-parity.postman_collection.json`（作成予定）で旧/新サーバーに同一リクエストを投げ、レスポンスと監査ログを突き合わせる。
- ORCA 服薬相互作用は `GET /mml/interaction` を暫定 API とし、旧 `PUT /orca/interaction` のレスポンスと比較。相違があれば契約改定の有無を ORCA 担当へエスカレーション。
- MML レター・ラボの JSON 比較結果は `artifacts/mml-diff/<date>` に保存し、移植判断材料として共有する。

## リリース判定時の確認項目（抜粋）
1. スタンプ CRUD / ツリー同期 / 公開購読の全 API が成功し、差分なし。  
2. スタンプ・レター削除後に `d_audit_event` へ成功/失敗両ケースのログが残る。  
3. ORCA 相互作用・MML レター/ラボのフォールバック有無と検証結果を `PHASE2_PROGRESS.md` に記録。  
4. Web クライアント UI 側でスタンプキャッシュ（Worker C 実装）とデモデータ（Worker B 提供）が反映されている。  
5. 追加移植が未完了の場合、迂回手順と今後の計画を本草案に追記してからリリース判断を行う。

## 未解決課題 / フォローアップ
- [ ] スタンプ削除監査の実装＆単体テスト補完。
- [ ] `GET /mml/letter/*` / `GET /mml/labtest/*` の移植可否判断（2025-11-05 アーキレビュー）。
- [ ] `PUT /orca/interaction` 復旧または `GET /mml/interaction` 仕様更新の決定（2025-11-06 ORCA チーム）。
- [ ] スタンプ API パリティ確認を Postman から CI に組み込む自動化タスクの発行。

---
更新履歴: 2025-11-03 初版（Worker F）。
