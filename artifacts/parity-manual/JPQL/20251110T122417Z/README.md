# RUN_ID=20251110T122417Z JPQL & Transaction Capture

## 1. 実行概要
- 目的: Checklist #65 の「主要サービスのトランザクション境界と JPQL parity」を再取得し、`WEB1001` シード導入済みの DB で Legacy/WildFly10 と Modernized/WildFly33 の差異を再確認する。
- 実行ホスト: macOS (Docker Desktop 4.34). `./scripts/start_legacy_modernized.sh start --build` 済みで `legacy-vs-modern` プロジェクトを稼働。
- ヘッダー: `tmp/trace/jpql-<service>-20251110T122417Z.headers`（`userName:1.3.6.1.4.1.9414.72.103:doctor1`, `X-Trace-Id: jpql-<service>-20251110T122417Z` など）。Appo のみ `Content-Type: application/json` を付与。
- コマンド例:
  ```bash
  RUN_ID=20251110T122417Z
  PARITY_OUTPUT_DIR=artifacts/parity-manual/JPQL/$RUN_ID \
  PARITY_HEADER_FILE=tmp/trace/jpql-patient-$RUN_ID.headers \
    ./ops/tools/send_parallel_request.sh --profile compose GET /patient/id/0000001 PatientServiceBean
  ```
- AppoCase では送信前に下記 SQL を両 DB へ流し込み、`id=8001` の予約データを毎回復元した。
  ```sql
  -- /tmp/reseed_appo.sql より抜粋
  WITH creator_ref AS (...), karte_ref AS (...)
  INSERT INTO d_appo (...) VALUES (...) ON CONFLICT (id) DO UPDATE ...;
  ```
- `persistence.xml` は Jakarta 版 (`server-modernized/src/main/resources/META-INF/persistence.xml`) に `PatientVisitModel` / `AppointmentModel` を明記済み。`rg '<class>open.dolphin.infomodel.(PatientVisitModel|AppointmentModel)'` の結果を `artifacts/parity-manual/persistence-check/20251110T122417Z/persistence_class_check.txt` へ保存。
- Modernized 側には `public.d_patient_seq` を追加し、`setval(..., 1002)` で `WEB1001` 登録時のシーケンス欠落を解消。
- `WEB1001` テスト患者は Legacy/Modernized 両 DB の `d_patient` に存在することを `.../persistence-check/20251110T122417Z/*_web1001_check.log` で証跡化。

## 2. ケース別サマリ
| Service | Endpoint / TraceId | Legacy HTTP | Modern HTTP | JPQL / TX メモ | 監査 (`d_audit_event`) |
| --- | --- | --- | --- | --- | --- |
| PatientServiceBean | `GET /patient/id/0000001`<br>`X-Trace-Id: jpql-patient-20251110T122417Z` | 200（患者 DTO + 保険 1 件を返却） | 500 (`SessionServiceException` → `NoResultException`) | Legacy/Modern とも JPQL は完全一致（`%` LIKE, Modern は `ESCAPE ''` 付き）。Modern 側は `remoteUser=anonymous` のまま SessionOperation が `getPatientById` を `SessionServiceException` でラップ。 | Legacy: レコード無し。Modern: `d_audit_event` は SYSTEM 活動のみで今回の TraceId は記録されず（テーブル自体は稼働中）。
| KarteServiceBean | `GET /karte/pid/0000001,2024-01-01`<br>`jpql-karte-20251110T122417Z` | 200（空 JSON） | 400（`Not able to deserialize data provided`） | Legacy は `java.text.ParseException` を catch しつつ空レスポンス。Modern は `KarteBeanConverter` が `null` を扱えず 400。いずれも `d_patient` 単一 SELECT のみ。 | 同上。TraceId に紐付く監査ログは取得できず。 |
| ScheduleServiceBean | `GET /schedule/pvt/2025-11-09`<br>`jpql-schedule-20251110T122417Z` | 200 (`list` に 1 件) | 200 だが `{"list":null}` | Legacy: 5 クエリ（`patient_visit`→`patient`→`insurance`→`karte`→`document`）。Modern: `patient_visit` 1 クエリのみ。`remoteUser=anonymous` のため facility 解決が止まり DTO 生成前に `list:null`。 | 監査テーブルは空/未更新。Zowe-runbook に TODO 継続。 |
| AppoServiceBean | `PUT /appo` + `appo_cancel_sample.json`<br>`jpql-appo-20251110T122417Z` | 200 (`response.json=1`) | 200 (`response.json=1`) | JPQL/SQL は Legacy/Modern いずれも `SELECT d_appo` → `DELETE d_appo`。`remoteUser` は依然 anonymous だが削除は成功。 | Modern には SYSTEM_ACTIVITY のみ。Appo 操作に紐付く `request_id` は未保存。 legacy 側も空。 |

- HTTP/ヘッダー/レスポンスファイルは `.../<Service>/http/{legacy,modern}/` に配置。
- `legacy.raw.log` / `modern.raw.log` には `docker compose logs --since <local-time>` を `rg` で抽出した Hibernate SQL と WARN/ERROR を格納。

## 3. CLI & 再現ノート
1. **seed / sequence**
   ```bash
   # Modernized: ensure WEB1001 + sequences
   rg '<class>open\.dolphin\.infomodel\.(PatientVisitModel|AppointmentModel)' server-modernized/src/main/resources/META-INF/persistence.xml
   docker compose -p legacy-vs-modern -f docker-compose.yml -f docker-compose.modernized.dev.yml exec -T db-modernized \
     psql -U opendolphin -d opendolphin_modern -c "CREATE SEQUENCE IF NOT EXISTS public.d_patient_seq AS BIGINT START WITH 1002;"
   docker compose ... exec -T db-modernized psql ... -c "SELECT setval('public.d_patient_seq', (SELECT COALESCE(MAX(id),0)+1 FROM d_patient));"
   ```
2. **JPQL capture** (共通):
   ```bash
   PARITY_OUTPUT_DIR=artifacts/parity-manual/JPQL/20251110T122417Z \
   PARITY_HEADER_FILE=tmp/trace/jpql-schedule-20251110T122417Z.headers \
     ./ops/tools/send_parallel_request.sh --profile compose GET /schedule/pvt/2025-11-09 ScheduleServiceBean
   ```
3. **Appo 再現前のシード**: `/tmp/reseed_appo.sql` を Legacy/Modern 両 DB に `cat ... | docker compose exec -T db psql ...` で投入。
4. **監査ログ採取**:
   ```bash
   docker compose -p legacy-vs-modern exec -T db \
     psql -U opendolphin -d opendolphin -c "select id, action, request_id, event_time from d_audit_event order by event_time desc limit 50" \
       > artifacts/parity-manual/JPQL/20251110T122417Z/<Service>/d_audit_event_legacy.log
   docker compose -p legacy-vs-modern -f docker-compose.yml -f docker-compose.modernized.dev.yml exec -T db-modernized \
     psql -U opendolphin -d opendolphin_modern -c "select id, action, request_id, event_time from d_audit_event order by event_time desc limit 50" \
       > .../d_audit_event_modern.log
   ```
5. **ログ抽出**:
   ```bash
   docker compose -p legacy-vs-modern logs server --since 2025-11-10T21:45:43 | \
     rg -n -A40 -B2 "GET /patient/id/0000001" > .../PatientServiceBean/legacy.raw.log
   docker compose -p legacy-vs-modern -f docker-compose.yml -f docker-compose.modernized.dev.yml logs server-modernized-dev --since 2025-11-10T21:45:43 | \
     rg -n -A60 -B2 "traceId=jpql-patient-20251110T122417Z" > .../PatientServiceBean/modern.raw.log
   ```

## 4. 観測と残課題
1. **`remoteUser=anonymous`**: Modernized の Schedule/Appo いずれも request header で認証済みにも関わらず `LogFilter` で facility が判定できず、JPQL が `facilityId=?` のまま停止。`domain-transaction-parity.md` §3.2 に継続課題として追記。
2. **`KarteResource` の日付パース**: `2024-01-01` が `java.text.ParseException` になる Legacy バグは継続。Modern 側は null 変換失敗 → 400。`rest_error_scenarios.manual.csv` の `rest_error_chart_summary_seed_gap` TODO を `Observed 2025-11-10` へ更新。
3. **監査ログ空振り**: Legacy `d_audit_event` は依然空。Modern も SYSTEM 系のみで HTTP Trace の `request_id` が保存されていない。`PHASE2_PROGRESS.md` と `DOC_STATUS.md` に記載。
4. **Appo delete 依存**: Seed を事前投入しないと `IllegalArgumentException: delete event with null entity` で 500。`docs/server-modernization/phase2/notes/domain-transaction-parity.md` §3.2 に “予約削除テスト前に id=8001 を再投入” を明記。

## 5. 保存物一覧
```
artifacts/
└─ parity-manual/
   └─ JPQL/20251110T122417Z/
      ├─ PatientServiceBean/
      │   ├─ http/{legacy,modern}/(headers.txt|meta.json|response.json)
      │   ├─ legacy.raw.log / modern.raw.log
      │   ├─ d_audit_event_{legacy,modern}.log
      ├─ KarteServiceBean/ ...
      ├─ ScheduleServiceBean/ ...
      ├─ AppoServiceBean/ ...
      └─ README.md (本ファイル)
```
