# Phase2 マネージャー割当オーバービュー（2025-11-14）

本ドキュメントは Web クライアント／モダナイズ版サーバー開発に関わる資料を領域ごとにグルーピングし、担当マネージャーと一次参照先を即座に確認できるようにするための索引です。各領域のマネージャーは、該当チェックリストとここで列挙したドキュメントを常に同期させ、棚卸し台帳 `docs/web-client/planning/phase2/DOC_STATUS.md` に結果を反映してください。

## Phase2 ガバナンス必読チェーン

> **Phase2 ガバナンス必読チェーン / 接続・RUN 運用共通ルール**  
> 1. `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 各領域チェックリストの順で参照・更新し、同一 RUN_ID を連携する。  
> 2. WebORCA 接続先は `https://weborca-trial.orca.med.or.jp/`（BASIC 認証 `trial` / `weborcatrial`）のみとし、他環境や `curl --cert-type P12` を使った本番アクセスは禁止。  
> 3. RUN_ID は `YYYYMMDDThhmmssZ` 形式を採用し、指示・README・DOC_STATUS・ログ・証跡ディレクトリのすべてで同一値を共有する。観点ごとに派生 RUN_ID を使う場合は親 RUN_ID を明示し、ログ先頭と備考欄へ併記する。  
> 4. DOC_STATUS 更新は (a) 最終コミット確認 → (b) Active/Dormant/Archive 判定 → (c) 備考に RUN_ID / 証跡パスを追記 → (d) ハブドキュメントへ同日付反映、の順で行い、完了報告前にチェック。  
> 5. Legacy サーバー/クライアントは参照専用アーカイブであり、差分検証のためにのみ起動可（保守・稼働維持作業は禁止）。

## 1. 領域別マッピング

| 開発領域 | 主要ドキュメント / ログ | マネージャーチェックリスト | 主なアウトプット |
| --- | --- | --- | --- |
| ORCA 接続実測（RUN 管理） | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`<br/>`docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`<br/>`docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md` ほか | `docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md` | RUN_ID 発行・DNS/TLS 事前チェック・curl 証跡・ORCA 本番データ確認。2025-11-20: `RUN_ID=20251120TrialCrudPrepZ1` で Trial 方針を再定義し、2025-11-15: `RUN_ID=20251120TrialConnectivityWSLZ1 / ...TrialAppoint{Crud,Write}Z1 / ...TrialMedicalCrudZ1 / ...TrialAcceptCrudZ1` を WSL2 から実行。DNS/TLS と `acceptlstv2` は 200 応答 (`Api_Result=91`)、`/20/adm/phr/phaseA` は 404、`appointlstv2`／`acceptlstv2`／`medicalmodv2` は doctor seed 欠落で `Api_Result=12/13/14`、`/orca14/appointmodv2` は HTTP 405。証跡は `artifacts/orca-connectivity/20251120Trial*/`、ログは `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` に集約。2025-11-15: 参照開始順／報告テンプレ／Archive 判定／端末手順チェック欄を追加し、RUN 報告ルールを統一。2025-11-15 CLI 追録: `RUN_ID=20251115T134513Z` で DNS/TLS + `/api01rv2/{acceptlst,appointlst}v2` + `/api/api21/medicalmodv2` を XML 取得し、`artifacts/orca-connectivity/20251115T134513Z/{dns,tls,crud,coverage,blocked}` / `logs/2025-11-20-orca-trial-crud.md` へ反映。`coverage_matrix` で全 60 API を `Trial 提供=51 / 非提供=9` へ分類、Blocker=`TrialSeedMissing` を新設。2025-11-15 CLI 追加実測: `RUN_ID=20251115TrialConnectivityCodexZ1` で DNS/TLS (`nslookup_2025-11-15T13-48-30Z.txt`, `openssl_s_client_2025-11-15T13-48-52Z.txt`) と `/api01rv2/{acceptlst,appointlst}v2`・`/api/api21/medicalmodv2`（HTTP200／`Api_Result=13/12/14`）、`/orca11/acceptmodv2`・`/orca14/appointmodv2`（HTTP405）を取得。`coverage/coverage_matrix.md` へ 79 API を Trial 提供/非提供に分け、`blocked/README.md` へ HTTP405 + trialsite#limit ブロックと doctor seed データギャップを追加。DOC_STATUS 行 95-96 と Runbook §4.3 を同 RUN_ID で更新済み。 |
| ORCA Demo/Dolphin/PHR ギャップ解消 | `docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md`<br/>`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`<br/>`docs/server-modernization/phase2/operations/logs/2025-11-15-phr-seq-phaseAB.md` ほか | `docs/managerdocs/PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md` | PHR Phase-A/B/C/D/E RUN 証跡・ギャップ一覧・PKCS#12 再配布トラッキング。2025-11-15: チェックリスト冒頭に参照チェーン／報告テンプレ／Archive 判定／端末手順チェックを追加し、PHR タスク差配時の報告ルールを明文化。 |
| ORCA Sprint2（ラッパー API 設計/棚卸し） | `docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md` §6<br/>`docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md`<br/>`docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` | `docs/managerdocs/PHASE2_ORCA_SPRINT2_MANAGER_CHECKLIST.md` | Sprint2 アンカー整合・RUN_ID タグ設定・DOC_STATUS 行 25 更新。2025-11-15: 標準参照順／報告テンプレ／Archive 判定／端末手順チェック欄を追記し、ワーカー指示の必須入力を統一。 |
| Web クライアント UI / UX / Feature ハンドオフ | `docs/web-client/README.md`（カテゴリ別ハブ）<br/>`docs/web-client/architecture/PHASE2_SYSTEMS_ALIGNMENT.md`<br/>`docs/web-client/ux/CHART_UI_GUIDE_INDEX.md`<br/>`docs/web-client/features/*.md`<br/>`docs/web-client/operations/*.md` | `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` | カルテ UI 改修計画・UX ガイド同期・運用 Runbook 更新・DOC_STATUS Active 行整備。2025-11-15: 参照開始順／報告テンプレ／Archive 判定／mac-dev-login 現行判定チェック欄を追加し、UX/Ops ワーカー指示の共通テンプレを定義。 |
| サーバーモダナイズ基盤（Foundation / Legacy） | `docs/server-modernization/phase2/INDEX.md`<br/>`docs/server-modernization/legacy-server-modernization-checklist.md`（Archive: `docs/archive/2025Q4/server-modernization/legacy-server-modernization-checklist.md`）<br/>`docs/server-modernization/phase2/foundation/*.md`<br/>`ops/modernized-server/docker/configure-wildfly.cli` | `docs/managerdocs/PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md` | Jakarta EE ギャップ整理・依存アップデート計画・WildFly CLI 差分管理・ブロッカー報告。2025-11-15: 標準参照順／報告テンプレ／Archive 判定／mac-dev-login 現行チェック欄を追加し、Foundation/Legacy ドキュメント移行時の手順を明文化。 |

> **メモ**: 追加でマネージャーを任命する場合は、本表へ行を追加し、該当領域のチェックリストを `docs/managerdocs/` に作成してから `DOC_STATUS.md` へ Active 行を登録してください。

## 2. 棚卸し・報告ルール
- すべてのマネージャーは、該当領域の作業を開始/完了したら `docs/web-client/planning/phase2/DOC_STATUS.md` の行を更新し、`備考` 欄に最新の RUN_ID／ログパス／証跡ディレクトリを記す。
- 【ワーカー指示】発行時は、本表の「開発領域」「主要ドキュメント」を引用し、参照順序・保存先・報告テンプレを明記すること。
- 【ワーカー報告】を受けたら、担当マネージャーは自分のチェックリストに反映し、本表と DOCTYPE のリンク切れがないか確認する。

## 3. 運用手順
1. マネージャーは担当領域のチェックリストを最新化し、完了条件・証跡・依存関係を明示する。
2. 新規資料を作成した場合は、該当領域の行に当該資料を追記し、`docs/web-client/README.md` または `docs/server-modernization/phase2/INDEX.md` にもリンクを追加する。
3. 週次レビュー前に、本表と各チェックリストの「進捗確認ポイント」を対照し、漏れがあればチェックボックスやタスクを追加する。
4. 廃止予定資料は `DOC_STATUS.md` で Dormant/Archive 判定を行い、結果を本表へ反映する（Archive 移行時は備考にアーカイブ先を記載）。

## 4. 連絡テンプレ（マネージャー向け）
- 【ワーカー指示】の先頭で **担当領域名** と本表内の **主要ドキュメント** を列挙する。
- 指示内の「更新必須ドキュメント一覧」をチェックリストへコピーし、完了時に ✔ を付ける。
- 報告受領後 1 営業日以内に、自分のチェックリストと `PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` を更新して整合させる。

> 最終更新: 2025-11-15 / 担当: Codex（Phase2 ドキュメント統括）
