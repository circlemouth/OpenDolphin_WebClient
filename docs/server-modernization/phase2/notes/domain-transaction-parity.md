# ドメイン JPQL トランザクション網羅表（2026-06-16）

## 1. 対象ケース
- **Case ID**: `user_profile`（Checklist #48 相当）
- **API**: `GET /user/doctor1`
- **ヘッダープロファイル**: `tmp/trace/user_profile.headers`（`X-Trace-Id: trace-user-profile-manual` を付与）
- **証跡**:
  - HTTP レスポンス: `artifacts/parity-manual/user_profile_trace/{legacy,modern}/response.json`
  - SQL ログ: `artifacts/parity-manual/JPQL/legacy.log`, `artifacts/parity-manual/JPQL/modernized.log`
  - 差分: `artifacts/parity-manual/JPQL/jpql.diff`

| レイヤー | Legacy JPQL/SQL | Modernized JPQL/SQL | 備考 |
| --- | --- | --- | --- |
| UserServiceBean#getUser | `select ... from d_users usermodel0_ where usermodel0_.userId=?` | `select ... from d_users um1_0 where um1_0.userId=?` | 両サーバーとも同一の WHERE 句。モダナイズ側は短い別名 (`um1_0`) を使用。 |
| FacilityModel リレーション | `select ... from d_facility ... where id=?` | 同左 | 施設情報の遅延ロードが両環境とも eager のため追加クエリが発生。 |
| RoleModel リレーション | `select ... from d_roles ... where c_user=?` | 同左 | 監査用途のロール参照。モダナイズ側は `roles` → `r1_0` へ alias が変わるのみ。 |

### 観測結果
- JPQL → SQL 変換結果は alias 文字列以外に差異なし。`hibernate.show_sql` を双方で有効化したことで `scripts/jpql_trace_compare.sh` による差分確認が可能になった。
- Legacy 側の `LogFilter` には traceId の埋め込みが無く、HTTP ログと SQL ログの突合には `X-Trace-Id` ヘッダーを別途控えておく必要がある。モダナイズ側は `traceId=<value>` が自動ログ出力される。

### 残課題 / 次アクション
1. Checklist #49〜#50, #73〜#74 に対応する `KarteServiceBean`, `PatientServiceBean`, `PVTServiceBean` 等の JPQL を同手順で採取する。少なくとも `/chart/WEB1001/summary`, `/chart-events`, `/pvt/*` 系を追加で叩くため、サンプルデータ投入が必要。
2. `scripts/jpql_trace_compare.sh` の結果を CI からも実行できるよう、対象ケース一覧（JSON or CSV）を整備する。
3. 現状のログは ANSI エスケープ文字を含むため、将来的には `docker logs` から取得する際に `ansi2txt` 等で除去するラッパーを追加する。

## 2. Trace Harness（Checklist #49/#73/#74）

| Checklist | API | Session Bean | Trace Case | 状態 | 備考 |
| --- | --- | --- | --- | --- | --- |
| #49 | `GET /dolphin/activity/{year,month,count}` | `SystemServiceBean` (`@SessionOperation`) | `trace_http_400` | ⏳ `d_users` 未作成のため `LogFilter` が 401 で終了。`rest_error_scenarios.manual.csv` に BadRequest 再現手順を定義済み。 |
| #73 | `GET /touch/user/{userId,facilityId,password}` | `TouchUserServiceBean` (`IPhoneServiceBean` 経由) | `trace_http_401` | ⏳ 認証ヘッダー欠落で 401 を返すテスト。`PARITY_HEADER_FILE` から `password` 行を削除して送信する手順を README に追記。 |
| #74 | `GET /karte/pid/{patientPk,date}` | `KarteServiceBean` | `trace_http_500` | ⏳ `NumberFormatException` で 500 を返し、`SessionOperationInterceptor` → `SessionTraceManager` までのログを取得予定。 |
| Baseline | `GET /serverinfo/jamri` | なし（REST フィルタのみ） | `trace_http_200` | ✅ `artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/trace_serverinfo_jamri/` に HTTP/ヘッダー証跡を保存。 |

- 400/401/500 ケースは `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` に期待ステータスと操作ノートを追加し、CLI で再現できるようにした。  
- Trace ID は `test_config.manual.csv` の `trace-id` 列に記載しており、`trace-session.headers` を複製して `X-Trace-Id` を上書きする運用とした。  
- Legacy サーバーは `ops/legacy-server/docker/configure-wildfly.cli` が `org.wildfly.extension.micrometer` を要求するためビルド不可。`artifacts/parity-manual/TRACEID_JMS/20251108T0526Z/legacy_build.log` に詳細を残した上で、Modernized 側のみ CLI 検証を進める。
