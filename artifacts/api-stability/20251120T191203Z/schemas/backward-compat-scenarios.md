# Backward Compatibility Scenarios (RUN_ID=20251120T191203Z)

Web クライアントが依存する旧 API 契約を覆うための回帰シナリオ。`*.json` はモダナイズ版が満たすべき最小フィールド集合と値域の例で、MSW モックや send_parallel_request の比較期待値として利用できる。

| シナリオ | 対象エンドポイント | 目的 | 期待レスポンス |
| --- | --- | --- | --- |
| charts-docinfo | `GET /karte/docinfo/{karteId,from,includeModified}` | タイムライン表示が Legacy と同じメタ情報で成立することを確認。 | `charts-docinfo.json` |
| reception-pvtlist | `GET /pvt2/pvtList` | 長輪講ロングポーリングで受付ステータスが欠損なく届くことを確認。 | `reception-pvtlist.json` |
| admin-user-profile | `GET /user/{userId}` | AppShell 初期ロードのユーザー情報互換性を確認。 | `admin-user-profile.json` |
| orca-tensu-name | `GET /orca/tensu/name/{query}/` | ORCA マスター検索のレスポンス構造互換を確認。 | `orca-tensu-name.json` |

> 期待値はいずれも JSON で定義し、キー不在や型不一致を検知できるよう最小限の必須フィールドを列挙している。
