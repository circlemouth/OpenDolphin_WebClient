# ルーティング設定と API 仕様調査（RUN_ID=20251210T145333Z）
- 期間: 2025-12-13 09:00 - 2025-12-14 09:00 JST（本稿は 2025-12-10 の事前調査）
- YAML ID: `src/orca_prod_bridge/implementation/ルーティング設定とAPI仕様調査.md`
- 証跡: `docs/server-modernization/phase2/operations/logs/20251210T145333Z-routing-and-api-spec.md`

## 目的
server-modernized のルーティング/コントローラ定義と ORCA API 仕様を突き合わせ、`/api01rv2/acceptlstv2` 404 の根因とベースパス食い違い、プロキシ経路の差分、API スキーマ変更履歴を整理する。

## 参照チェーン / 対応ルール
- `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md`
- ORCA 接続ポリシー: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`
- API 仕様: `docs/server-modernization/phase2/operations/assets/orca-api-matrix.csv`, `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`

## 調査結果サマリ
1. **公開パスの前提**  
   - コンテキストルート `/openDolphin`（`server-modernized/src/main/webapp/WEB-INF/jboss-web.xml`）、REST マッピング `/resources/*`（`web.xml`）。つまり実際の基底 URL は `http://<host>:8080/openDolphin/resources`.
   - `resteasy.resources` で登録されている ORCA 系リソースは `/orca/...` ラッパー（予約・受付・病名など）と外来スタブ `/api01rv2/claim/outpatient/mock`、`/orca21/medicalmodv2/outpatient` のみ。`/api01rv2/acceptlstv2` / `/api01rv2/appointlstv2` / `/api21/...` を直接受けるリソースは未登録。
2. **404 の直接要因**  
   - ソース内に `/api01rv2/acceptlstv2` を処理するクラス/メソッドが存在しない（`OrcaEndpoint` 列挙にも未収載）。`web.xml` にもリソース登録がないため、WAR 側でルーティングできず 404 となる。プロキシ設定やヘッダ不足ではない。
3. **ベースパス食い違い**  
   - ORCA API 仕様は `/api01rv2/...` / `/api21/...` を前提だが、モダナイズ版の外来スタブは `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient`（`api21` ではなく `orca21`）で公開。ラッパー系は `/orca/<feature>` へ JSON で公開しているため、ORCA 生 API パスへの直接 POST は 404/405 になる。
   - `scripts/orca_prod_bridge.sh` デフォルト値 `/api/api01rv2/acceptlstv2` はモダナイズ環境に適用すると二重 `api` で必ず 404。ローカル検証で流用する場合は `--api-path /api01rv2/...` に上書き必須。
4. **プロキシ経路の差分**  
   - `web-client/vite.config.ts`: `/api` を除去してバックエンドへ送り、`/api01rv2`/`/orca21`/`/orca12` は書き換えなしで `VITE_DEV_PROXY_TARGET`（デフォルト `http://localhost:8080/openDolphin/resources`）へ転送。  
   - `docker-compose.modernized.dev.yml`: 公開ポート `9080→8080`。ヘルスチェックは `/openDolphin/resources/dolphin`。ベースパスの齟齬はなし。
5. **API スキーマ変更履歴（直近）**  
   - 2025-12-08 `9fd77452` / `818d0247` で外来スタブ (`/api01rv2/claim/outpatient/mock`, `/orca21/medicalmodv2/outpatient`) と監査・テストが追加。`acceptlstv2` 系はこれらのコミットにも含まれておらず、未実装状態が継続。

## 影響と提案
- `/api01rv2/acceptlstv2` をモダナイズ側で受ける必要があるなら、**pass-through リソースの追加**（web.xml 登録＋監査ロギング）または **クライアントを `/orca/...` ラッパーに寄せる**どちらかを決める必要がある。
- ORCA 本番ブリッジ手順に本 RUN_ID を追記し、12/13-12/14 窓での再試行時はベースパス二重付与を避ける（`--api-path /api01rv2/...` に変更）。
- `ORCA_API_STATUS.md` に「acceptlstv2=未実装（モダナイズ）」を明記し、接続可否の混同を防ぐ。
