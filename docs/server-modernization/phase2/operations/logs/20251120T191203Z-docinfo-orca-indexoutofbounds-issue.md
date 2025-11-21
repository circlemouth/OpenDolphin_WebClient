# Issue: docinfo / ORCA wrapper IndexOutOfBounds 恒久対応（RUN_ID=20251120T191203Z）

- RUN_ID: `20251120T191203Z`
- 優先度: 安定化タスク
- 背景: modernized-dev で docinfo と ORCA wrapper (tensu) が空/不足データ時に `Index 1 out of bounds for length 1` を返し、HTTP 500 で落ちる。seed 不要の状態でも 200 を返せるようガードを入れる恒久対応が必要。

## 現象 / エラーログ
- `GET /karte/docinfo/1012?from=2024-01-01&includeModified=true` → 500 `"Index 1 out of bounds for length 1"` (`KarteResource#getDocumentList` で空モジュール配列を前提にアクセス)。
- `GET /orca/tensu/name/プロパネコール/?hospnum=1` → 500 `"Index 1 out of bounds for length 1"`（tensu スタブ空配列の参照で崩落）。
- 証跡: `artifacts/api-stability/20251120T191203Z/benchmarks/README.md`（Loop=3, profile=modernized-dev, seed ありでも再現）。`docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md` §3 も参照。

## 再現手順（modernized-dev）
1. 事前: `PARITY_OUTPUT_DIR=artifacts/api-stability/20251120T191203Z/benchmarks`、ヘッダー `tmp/parity-headers/api_stability_20251120T191203Z.headers`（Basic+MD5, `X-Trace-Id=api-stability-20251120T191203Z`）を用意。seed 有無にかかわらず事象発生。
2. コマンド例（単発でも 500 再現）:
   ```bash
   TRACE_RUN_ID=20251120T191203Z ops/tools/send_parallel_request.sh --profile modernized-dev --targets modern --loop 1 --run-id 20251120T191203Z \
     "GET /karte/docinfo/1012?from=2024-01-01&includeModified=true" \
     "GET /orca/tensu/name/プロパネコール/?hospnum=1"
   ```
3. 期待: 空データでも 200 を返し、docinfo は空 list/timestamp を返却、tensu は apiResult/warning 付きの空結果を返却する。

## 恒久対応要件
- 空/NULL の docinfo/tensu データに対して `IndexOutOfBounds` を起こさない null/empty ガードを実装し、安全な list 参照に置き換える。
- tensu 取得はスタブ/実データいずれでも防御的に扱い、空 list のときは `apiResult=00 or 79` + warning など HTTP 200 を返す。
- seed なし（modules/tensu が空）の環境でも 200 応答となる堅牢化を完了したうえで再計測する。

## 想定アウトプット
- サーバー修正（ガード追加・防御的アクセス）の PR と、再計測ログの更新。
- `docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md` への計測結果置き換えと SLA 判定更新。
