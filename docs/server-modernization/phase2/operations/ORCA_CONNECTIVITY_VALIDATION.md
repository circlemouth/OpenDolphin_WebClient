> 【2025-11-21 更新】以降の ORCA 接続は、接続先・認証情報を機微扱いとし `docs/web-client/operations/mac-dev-login.local.md` を参照する。WebORCA トライアル (`https://weborca-trial.orca.med.or.jp`) は利用しない。仮想データに対する CRUD を含め全 API 操作を許可する。過去のトライアル URL 記載箇所は本運用に読み替えること。
# ORCA 謗･邯・Single Playbook・・ebORCA Trial・・
- 2025-11-21 エラー採取 RUN（RUN_ID=`20251121T153300Z`, 親=`20251120T193040Z`）で下記を確認: 成功=HTTP200/`Api_Result=00`（`POST /api01rv2/system01dailyv2?class=00`）、誤パスワード=HTTP401 JSON、未登録患者=HTTP404 JSON（`GET /api01rv2/patientgetv2?id=999999`）、`/actuator/health`=HTTP404。Authorization はすべて `<MASKED>`。証跡: `artifacts/error-audit/20251121T153300Z/README.md`、ログ: `docs/server-modernization/phase2/operations/logs/20251120T193040Z-error-audit.md#5-子-run-20251121t153300z-実測ログ親20251120t193040z`。
- 2025-11-21 業務系エラー採取 RUN（RUN_ID=`20251121ErrorMatrixZ1`, 親=`20251120T193040Z`）で下記を確認: `system01dailyv2` Request_Number=99 → HTTP200/`Api_Result=91`、`acceptlstv2` Acceptance_Date=2000-01-01 & Physician_Code=99999 → HTTP200/`Api_Result=13`、`/api/api21/medicalmodv2` Patient_ID=999999 → HTTP200/`Api_Result=10`。Authorization は `<MASKED>` 済み。証跡: `artifacts/error-audit/20251121ErrorMatrixZ1/README.md`、ログ: `docs/server-modernization/phase2/operations/logs/20251120T193040Z-error-audit.md#6-子-run-20251121errormatrixz1-実測ログ親20251120t193040z`。
- 菴懈・譌･: 2025-11-19・・ebORCA 繝医Λ繧､繧｢繝ｫ繧ｵ繝ｼ繝舌・驕狗畑縺ｸ蛻・ｊ譖ｿ縺茨ｼ・- 蟇ｾ雎｡: `https://weborca-trial.orca.med.or.jp/` 縺ｧ謠蝉ｾ帙＆繧後ｋ WebORCA 繝医Λ繧､繧｢繝ｫ繧ｵ繝ｼ繝舌・縺ｨ縲～docker-compose.modernized.dev.yml`・医∪縺溘・ `scripts/start_legacy_modernized.sh`・峨〒襍ｷ蜍輔☆繧九Δ繝繝翫う繧ｺ迚・OpenDolphin 繧ｵ繝ｼ繝舌・縲・- 逶ｮ逧・ 蜈ｬ髢九ヨ繝ｩ繧､繧｢繝ｫ迺ｰ蠅・〒縺ｮ逍朱壹・API 蜻ｼ縺ｳ蜃ｺ縺励・CRUD 險ｼ霍｡蜿門ｾ励ｒ蜊倅ｸ Runbook 縺ｫ髮・ｴ・＠縲ヽUN_ID 逋ｺ陦鯉ｼ上Ο繧ｰ菫晏ｭ假ｼ城ｱ谺｡譽壼査縺励・繧・ｊ譁ｹ繧剃ｸ譛ｬ蛹悶☆繧九・- 蜿ら・: [ORCA API 蜈ｬ蠑丈ｻ墓ｧ肋(https://www.orca.med.or.jp/receipt/tec/api/overview.html) / [繧ｪ繝輔Λ繧､繝ｳ繧ｳ繝斐・](assets/orca-api-spec/README.md) / [謚陦捺ュ蝣ｱ繝上ヶ・亥ｸｳ逾ｨ繝ｻCLAIM繝ｻMONTSUQI 遲会ｼ云(assets/orca-tec-index/README.md)

> **Single Playbook 繝ｫ繝ｼ繝ｫ**: ORCA 謗･邯壹↓髢｢縺吶ｋ謇矩・・譛ｬ繝峨く繝･繝｡繝ｳ繝医↓荳譛ｬ蛹悶☆繧九ゆｻ悶ラ繧ｭ繝･繝｡繝ｳ繝茨ｼ・ORCA_API_STATUS.md`, `MODERNIZED_API_DOCUMENTATION_GUIDE.md` 縺ｪ縺ｩ・峨・譛ｬ Playbook 縺ｸ縺ｮ繝ｪ繝ｳ繧ｯ縺ｨ蟾ｮ蛻・し繝槭Μ縺ｮ縺ｿ繧呈軸霈峨☆繧九・>
> **2025-11-19 譖ｴ譁ｰ**: 譛ｬ逡ｪ雉・ｼ諠・ｱ縺翫ｈ縺ｳ `ORCAcertification/` 繝・ぅ繝ｬ繧ｯ繝医Μ縺ｯ繧｢繝ｼ繧ｫ繧､繝匁桶縺・→縺励仝ebORCA 繝医Λ繧､繧｢繝ｫ繧ｵ繝ｼ繝舌・縺ｮ縺ｿ繧呈磁邯壼・縺ｨ縺吶ｋ縲・asic 隱崎ｨｼ縺ｯ蜈ｬ髢九い繧ｫ繧ｦ繝ｳ繝・`trial/weborcatrial` 繧貞茜逕ｨ縺励～curl --cert-type P12` 繧・PKCS#12 險ｼ譏取嶌縺ｯ菴ｿ逕ｨ縺励↑縺・・>
> **謌先棡迚ｩ**
> 1. `docs/server-modernization/phase2/operations/logs/<YYYYMMDD>-orca-connectivity.md` 縺ｫ RUN_ID・乗園隕具ｼ拾vidence 繝代せ繧定ｿｽ險倥・> 2. `artifacts/orca-connectivity/<RUN_ID>/` 縺ｫ繝医Λ繧､繧｢繝ｫ繧ｵ繝ｼ繝舌・縺ｸ縺ｮ `curl` 繝ｪ繧ｯ繧ｨ繧ｹ繝医・繝ｬ繧ｹ繝昴Φ繧ｹ・医・繝・ム繝ｼ/譛ｬ譁・ｼ峨→ `ServerInfoResource` 邨先棡縲．NS/TLS 繝ｭ繧ｰ縲～tmp/orca-weekly-summary.*` 螳溯｡後Ο繧ｰ繧剃ｿ晏ｭ倥・> 3. `docs/web-client/planning/phase2/DOC_STATUS.md` 縺ｮ ORCA 騾｣謳ｺ谺・→騾ｱ谺｡譽壼査縺玲ｬ・ｒ Active 縺ｫ譖ｴ譁ｰ縺励∝ｾ檎ｶ壽球蠖薙∈蠢・ｦ√↑險ｼ霍｡繝代せ繧貞・譛峨・
## 0. Single Playbook 驕狗畑繝ｫ繝ｼ繝ｫ

- 譛ｬ遽繧貞渕轤ｹ縺ｫ RUN_ID 逋ｺ陦後√Ο繧ｰ菫晏ｭ倥・ｱ谺｡譽壼査縺暦ｼ・tmp/orca-weekly-summary.*`・峨・雋ｼ繧贋ｻ倥￠菴咲ｽｮ繧貞ｮ夂ｾｩ縺吶ｋ縲ＡORCA_API_STATUS.md`/`MODERNIZED_API_DOCUMENTATION_GUIDE.md` 縺ｯ譛ｬ遽縺ｮ蜿ら・縺縺代ｒ險倩ｼ峨＠縲∵焔鬆・ｒ隍・｣ｽ縺励↑縺・・- Trial 繧ｵ繝ｼ繝舌・縺ｮ謗･邯壽ュ蝣ｱ繝ｻCRUD 蜿ｯ蜷ｦ繝ｻ蛻ｩ逕ｨ荳榊庄讖溯・縺ｯ `assets/orca-trialsite/raw/trialsite.md#snapshot-summary-2025-11-19` 繧剃ｸ谺｡諠・ｱ縺ｨ縺励∵悽遽縺ｨ ﾂｧ1 縺ｮ險倩ｿｰ縺御ｹ夜屬縺励◆蝣ｴ蜷医・ Snapshot 繧呈峩譁ｰ縺励※縺九ｉ譛ｬ Playbook 繧剃ｿｮ豁｣縺吶ｋ縲・
### 0.1 RUN_ID 逋ｺ陦後ユ繝ｳ繝励Ξ

1. RUN_ID 縺ｯ `YYYYMMDD` + 逶ｮ逧・ｪ・+ `Z#` 縺ｧ蜻ｽ蜷阪☆繧九ゆｾ・ `RUN_ID=20251120TrialCrudPrepZ1`・・rial CRUD 莠句燕繝√ぉ繝・け 1 莉ｶ逶ｮ・峨・2. 莠育ｴ・ｪ・ `TrialCrud`, `TrialAppoint`, `TrialAccept`, `TrialMedical`, `TrialHttpLog`, `TrialWeekly` 縺ｪ縺ｩ繧ｿ繧ｹ繧ｯ遞ｮ蛻･縺悟愛蛻･縺ｧ縺阪ｋ隱槭ｒ菴ｿ逕ｨ縺吶ｋ縲・3. 逋ｺ陦梧焔鬆・
   ```bash
   export RUN_ID=20251120TrialCrudPrepZ1
   export EVIDENCE_ROOT="artifacts/orca-connectivity/${RUN_ID}"
   mkdir -p "${EVIDENCE_ROOT}/"{dns,tls,trial,trace,data-check}
   rsync -a artifacts/orca-connectivity/TEMPLATE/ "${EVIDENCE_ROOT}/"
   ```
4. `artifacts/orca-connectivity/TEMPLATE/00_README.md` 縺ｮ蜻ｽ蜷阪Ν繝ｼ繝ｫ繧ょ盾辣ｧ縺励～node scripts/tools/orca-artifacts-namer.js artifacts/orca-connectivity` 縺ｧ驕募渚縺後↑縺・％縺ｨ繧堤｢ｺ隱阪☆繧九・
### 0.2 繝ｭ繧ｰ菫晏ｭ倥→繝ｪ繝ｳ繧ｯ邨ｱ荳

1. 螳滓命譌･縺斐→縺ｮ繧ｵ繝槭Μ縺ｯ `docs/server-modernization/phase2/operations/logs/<YYYYMMDD>-orca-connectivity.md` 縺ｫ險倩ｼ峨＠縲∝推 RUN_ID 繧定｡ｨ蠖｢蠑上〒謨ｴ逅・☆繧具ｼ井ｾ・ `logs/2025-11-15-orca-connectivity.md`・峨・2. 螳滓ｸｬ繝ｭ繧ｰ縺ｮ菫晏ｭ伜・縺ｯ蠢・★ `artifacts/orca-connectivity/<RUN_ID>/` 驟堺ｸ九→縺励～dns/`, `tls/`, `trial/<api>/`, `trace/`, `data-check/`, `screenshots/` 繧・RUN_ID 蜊倅ｽ阪〒謠・∴繧九・3. 蟾ｮ蛻・し繝槭Μ繧剃ｻ悶ラ繧ｭ繝･繝｡繝ｳ繝医∈險倩ｼ峨☆繧句ｴ蜷医・縲形ORCA_CONNECTIVITY_VALIDATION.md` ﾂｧ0 繧貞盾辣ｧ縲阪→譏手ｨ倥＠縲∵焔鬆・悽譁・ｒ隍・｣ｽ縺励↑縺・ら音縺ｫ `ORCA_API_STATUS.md` 縺ｯ譛譁ｰ繧ｹ繝・・繧ｿ繧ｹ陦ｨ縺ｮ縺ｿ繧呈ｮ九＠縲∝ｮ滓命謇矩・・譛ｬ Playbook 縺ｸ隱伜ｰ弱☆繧九・4. `artifacts/orca-connectivity/<RUN_ID>/README.md` 繧・Evidence 逶ｮ谺｡縺ｨ縺励※譖ｴ譁ｰ縺励．NS/TLS 繝ｭ繧ｰ繧・CRUD 螳滓命邨先棡繧貞・謖吶☆繧九・
### 0.3 `tmp/orca-weekly-summary.*` 縺ｮ雋ｼ繧贋ｻ倥￠菴咲ｽｮ

1. `npm run orca-weekly` 螳溯｡悟ｾ後～tmp/orca-weekly-summary.json` 縺ｨ `tmp/orca-weekly-summary.md` 縺檎函謌舌＆繧後ｋ縲・2. Markdown 迚医ｒ莉･荳・3 縺区園縺ｸ雋ｼ繧贋ｻ倥￠縺ｦ蜷梧悄縺吶ｋ縲・   - `docs/web-client/planning/phase2/DOC_STATUS.md` 縺ｮ縲後Δ繝繝翫う繧ｺ/螟夜Κ騾｣謳ｺ・・RCA・峨埼ｱ谺｡繝・・繝悶Ν・亥ｙ閠・ｬ・↓ RUN_ID繝ｻEvidence 繝代せ・峨・   - `docs/web-client/README.md` ORCA 繧ｻ繧ｯ繧ｷ繝ｧ繝ｳ縺ｮ縲檎峩霑鷹ｱ谺｡縲崎｡後・   - `docs/server-modernization/phase2/PHASE2_PROGRESS.md` ORCA 陦後・騾ｱ谺｡谺・・3. JSON 迚医→ CLI 讓呎ｺ門・蜉帙・ `artifacts/orca-connectivity/validation/<RUN_ID>/weekly_summary.log` 縺ｸ雋ｼ繧贋ｻ倥￠縲～RUN_ID`・拜YYYYMMDDTrialWeeklyZ#` 繧貞粋繧上○縺ｦ險倬鹸縺吶ｋ縲・
### 0.4 curl 繧ｵ繝ｳ繝励Ν・・asic 隱崎ｨｼ・・
`MODERNIZED_API_DOCUMENTATION_GUIDE.md` ﾂｧ3.2 縺九ｉ蠑慕畑縺吶ｋ cURL 髮帛ｽ｢繧呈悽遽縺ｧ荳蜈・ｮ｡逅・☆繧九・asic 隱崎ｨｼ・酋TF-8/Shift_JIS 繝倥ャ繝繝ｼ・拾vidence 菫晏ｭ倥Ν繝ｼ繝ｫ繧剃ｻ･荳九↓遉ｺ縺吶・
```bash
export ORCA_TRIAL_USER=trial
export ORCA_TRIAL_PASS=weborcatrial
export RUN_ID=20251120TrialCrudPrepZ1
EVIDENCE_ROOT="artifacts/orca-connectivity/${RUN_ID}"
mkdir -p "${EVIDENCE_ROOT}/trial/system01dailyv2" \
         "${EVIDENCE_ROOT}/trace" \
         "${EVIDENCE_ROOT}/data-check"
curl --silent --show-error \
     -u "${ORCA_TRIAL_USER}:${ORCA_TRIAL_PASS}" \
     -H 'Content-Type: application/json; charset=Shift_JIS' \
     -X POST --data-binary \
       '@docs/server-modernization/phase2/operations/assets/orca-api-requests/01_system01dailyv2_request.json' \
     'https://weborca-trial.orca.med.or.jp/api/api01rv2/system01dailyv2?class=00' \
     -D "${EVIDENCE_ROOT}/trial/system01dailyv2/response.headers" \
     -o "${EVIDENCE_ROOT}/trial/system01dailyv2/response.json" \
     --trace-ascii "${EVIDENCE_ROOT}/trace/system01dailyv2.trace"
```

- 蜿ら・ API・・acceptlstv2`, `appointlstv2`, etc.・峨ｂ蜷後§ RUN_ID/繝・ぅ繝ｬ繧ｯ繝医Μ讒区・縺ｧ菫晏ｭ倥☆繧九・- CRUD 謫堺ｽ懊ｒ莨ｴ縺・ｴ蜷医・ `data-check/<api>.md` 縺ｫ before/after 縺ｨ謌ｻ縺玲焔鬆・ｒ蠢・★險倬鹸縺吶ｋ縲・- 霑ｽ蜉縺ｮ `curl` 繝・Φ繝励Ξ縺悟ｿ・ｦ√↓縺ｪ縺｣縺溷ｴ蜷医・b譛ｬ遽繧呈峩譁ｰ縺励∽ｻ悶ヵ繧｡繧､繝ｫ縺ｯ譛ｬ遽縺ｸ縺ｮ繝ｪ繝ｳ繧ｯ縺縺代ｒ谿九☆縲・
## 1. 繧ｹ繧ｳ繝ｼ繝励→蜑肴署譚｡莉ｶ

| 項目 | 内容 |
| --- | --- |
| WebORCA 接続先 | `http://100.102.17.40:8000` (Mac Dev ORCA)。本番相当の検証環境として使用。 |
| 認証情報 | ユーザー `ormaster` / パスワード `change_me` (詳細は `mac-dev-login.local.md`)。 |
| CRUD 方針 | 仮想データに対する全 CRUD 操作を許可。`receipt_route.ini` で POST が許可されていることが前提 (現状 405 のため要設定変更)。 |
| 利用不可機能 | 特になし (構成による)。 |
| モダナイズ版サーバー | `opendolphin-server-modernized-dev` (WildFly 27)。`ops/shared/docker/custom.properties` および `ops/modernized-server/docker/custom.properties` に `claim.host=100.102.17.40` / `claim.send.port=8000` / `claim.conn=server` / `claim.send.encoding=MS932` / `claim.scheme=http` を設定してから再ビルドする。 |
| ネットワーク | 作業端末から `100.102.17.40:8000` への HTTP 通信が許可されていること。 |
| DNS | IP 指定のため名前解決は不要。 |
| データ | 開発用データ。CRUD 操作はログに残すが、トライアルのような週次リセットはないため、テスト後のデータクリーンアップを推奨。 |

> Snapshot Summary 縺ｨ縺ｮ蜷梧悄: `assets/orca-trialsite/raw/trialsite.md#snapshot-summary-2025-11-19` 繧呈峩譁ｰ縺励◆繧牙ｿ・★譛ｬ陦ｨ繧よ峩譁ｰ縺励・・↓譛ｬ陦ｨ縺ｸ霑ｽ險倥＠縺溘＞莠矩・′蜃ｺ縺溷ｴ蜷医・ Snapshot 繧貞・縺ｫ譖ｴ譁ｰ縺励※縺九ｉ譛ｬ Playbook 縺ｸ蜿肴丐縺吶ｋ縲・
## 2. 螳滓命繝輔Ο繝ｼ讎りｦ・
1. **繝医Λ繧､繧｢繝ｫ諠・ｱ縺ｮ遒ｺ隱・*: `assets/orca-trialsite/README.md` 繧貞盾辣ｧ縺励∝茜逕ｨ蛻ｶ髯舌・蛻晄悄繝・・繧ｿ繝ｻ繝ｭ繧ｰ繧､繝ｳ諠・ｱ繧呈滑謠｡縺吶ｋ縲・2. **繝｢繝繝翫う繧ｺ迚医し繝ｼ繝舌・險ｭ螳・*: `claim.*` 邉ｻ繝励Ο繝代ユ繧｣繧偵ヨ繝ｩ繧､繧｢繝ｫ迺ｰ蠅・髄縺代↓譖ｴ譁ｰ縺励～ServerInfoResource` 縺ｧ `claim.conn=server` 繧貞叙蠕励〒縺阪ｋ繧医≧縺ｫ縺吶ｋ縲・3. **謗･邯夂｢ｺ隱・*: `curl -u trial:weborcatrial` 縺ｧ `/api/api01rv2/system01dailyv2` 縺ｪ縺ｩ read-only API 繧貞ｮ溯｡後＠縲？TTP 200 / `Api_Result=00` 繧定ｨｼ霍｡蛹悶・4. **API 讀懆ｨｼ**: P0・・atient, accept, appoint・峨°繧蛾・↓ `node scripts/tools/orca-curl-snippets.js` 縺ｮ蜃ｺ蜉帙ｒ菴ｿ縺｣縺ｦ螳溯｡後＠縲～artifacts/orca-connectivity/<UTC>/P0_*` 縺ｸ菫晏ｭ倥ょｿ・ｦ√↓蠢懊§縺ｦ P1 莉･髯阪ｂ霑ｽ蜉縲・5. **邨先棡謨ｴ逅・*: `PHASE2_PROGRESS.md` 縺ｮ ORCA 谺・→ `docs/web-client/planning/phase2/DOC_STATUS.md` 繧呈峩譁ｰ縺励∝､ｱ謨玲凾縺ｯ `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 縺ｮ繧ｨ繧ｹ繧ｫ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ謇矩・↓蠕薙≧縲・
## 3. 貅門ｙ繝√ぉ繝・け繝ｪ繧ｹ繝・
### 3.1 繝医Λ繧､繧｢繝ｫ繧ｵ繝ｼ繝舌・雉・ｼ諠・ｱ

| 項目 | 値 | 参照先 |
| --- | --- | --- |
| ベース URL | `http://100.102.17.40:8000` | `mac-dev-login.local.md` |
| UI ログイン | ユーザー `ormaster` / パスワード `change_me` | 同上 |
| API 認証 | HTTP Basic `ormaster:change_me` | `curl -u ormaster:change_me ...` で利用 |
| 初期データ | 開発環境依存 | - |
| 利用不可機能 | 特になし | - |

> 繝医Λ繧､繧｢繝ｫ迺ｰ蠅・・騾ｱ谺｡縺ｧ繝ｪ繧ｻ繝・ヨ縺輔ｌ繧九◆繧√∵､懆ｨｼ逶ｮ逧・〒縺ｮ謔｣閠・匳骭ｲ繝ｻ莠育ｴ・ｽ懈・繝ｻ險ｺ逋ょ炎髯､縺ｪ縺ｩ縺ｮ CRUD 謫堺ｽ懊′險ｱ蜿ｯ縺輔ｌ繧九ゆｽ懈･ｭ蠕後・ `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` 縺ｫ螳滓命蜀・ｮｹ繧定ｨ倬鹸縺励∝・迴ｾ縺ｫ蠢・ｦ√↑蜈･蜉帛､繧呈ｮ九☆縺薙→縲・
### 3.2 繝｢繝繝翫う繧ｺ迚医し繝ｼ繝舌・險ｭ螳・
- `ops/shared/docker/custom.properties` / `ops/modernized-server/docker/custom.properties` / `ops/shared/docker/custom-secret.properties` の各 `claim.*` を以下へ書き換える。差分は Evidence に保存し、`ServerInfoResource` の結果と一列に掲載する。
  - `claim.conn=server`
  - `claim.host=100.102.17.40`
  - `claim.send.port=8000`
  - `claim.scheme=http` (または `claim.useSsl=false`)
  - `claim.send.encoding=MS932`
- `docker compose`・医∪縺溘・ `scripts/start_legacy_modernized.sh`・峨〒繝｢繝繝翫う繧ｺ蛛ｴ繧貞・襍ｷ蜍輔＠縲～/serverinfo/claim/conn` 縺・`server` 縺ｸ謌ｻ繧九％縺ｨ繧堤｢ｺ隱阪・egacy 繧ｵ繝ｼ繝舌・縺ｯ蠢・ｦ√↓蠢懊§縺ｦ read-only 縺ｧ荳ｦ陦瑚ｵｷ蜍輔☆繧九・
### 3.3 繝阪ャ繝医Ρ繝ｼ繧ｯ縺ｨ繧ｯ繝ｩ繧､繧｢繝ｳ繝育ｫｯ譛ｫ

| 繝・・繝ｫ | 逶ｮ逧・| 繧ｳ繝槭Φ繝我ｾ・|
| --- | --- | --- |
| `node scripts/tools/orca-curl-snippets.js` | API 縺斐→縺ｮ curl 繧ｳ繝槭Φ繝臥函謌・| `ORCA_BASE_URL=https://weborca-trial.orca.med.or.jp node scripts/tools/orca-curl-snippets.js --scenario p0` |
| `ops/tools/send_parallel_request.sh` | Modernized 繧ｵ繝ｼ繝舌・邨檎罰縺ｮ API 蜻ｼ縺ｳ蜃ｺ縺励ｒ蜀咲樟 | `ORCA_TRIAL_USER=trial ORCA_TRIAL_PASS=weborcatrial PARITY_OUTPUT_DIR=artifacts/orca-connectivity/<UTC>/parallel ./ops/tools/send_parallel_request.sh --profile modernized-orca` |
| `curl`・・asic 隱崎ｨｼ・・| 逶ｴ謗･ API 螳溯｡後・繝倥ャ繝繝ｼ謗｡蜿・| `curl -u "trial:weborcatrial" -H 'Content-Type: application/json; charset=Shift_JIS' ...` |

繝・Φ繝励Ξ Evidence 縺ｯ `artifacts/orca-connectivity/TEMPLATE/` 繧・`cp -R` 縺励※縺九ｉ螳滓命縺励～README.md` 縺ｫ螳溯｡梧擅莉ｶ繧定ｿｽ險倥☆繧九・
`docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/` 縺ｫ縺ｯ No.19-38・亥・髯｢繝ｻ菫晞匱繝ｻ莨夊ｨ茨ｼ峨・ UTF-8 繝・Φ繝励Ξ繧帝・鄂ｮ縺励◆縲ＡRUN_ID={{YYYYMMDD}}TorcaTrialZ1` 縺ｮ繧医≧縺ｫ謗｡逡ｪ縺励◆縺・∴縺ｧ縲∽ｾ九∴縺ｰ蜈･髯｢謔｣閠・ｸ隕ｧ・・21・峨・莉･荳九・繧医≧縺ｫ蜿朱寔縺吶ｋ縲・
```bash
API_ID=21_tmedicalgetv2
mkdir -p "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}"
curl -u "${ORCA_TRIAL_USER}:${ORCA_TRIAL_PASS}" \
     -H 'Content-Type: application/xml; charset=UTF-8' \
     -H 'Accept: application/xml' \
     --data-binary @docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/${API_ID}_request.xml \
     'https://weborca-trial.orca.med.or.jp/api/api01rv2/tmedicalgetv2' \
     -D "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}/response.headers" \
     -o "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}/response.xml" \
     --trace-ascii "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}/trace.log"
```

譁ｰ隕上ョ繝ｼ繧ｿ繧堤匳骭ｲ縺吶ｋ蝣ｴ蜷医・縲∝酔繝・ぅ繝ｬ繧ｯ繝医Μ縺ｫ `insert.log`・亥ｮ溯｡後さ繝槭Φ繝会ｼ酋I 謫堺ｽ懊Γ繝｢・峨ｄ `before_after.sql` 繧剃ｿ晏ｭ倥＠縲∝炎髯､譎ゅ・蟇ｾ雎｡謔｣閠・分蜿ｷ繝ｻ莠育ｴ・分蜿ｷ繝ｻ險ｺ逋・ID 繧呈・險倥☆繧九るｱ谺｡繝ｪ繧ｻ繝・ヨ縺ｧ繝・・繧ｿ縺ｯ蛻晄悄蛹悶＆繧後ｋ縺後∽ｽ懈･ｭ蜀・ｮｹ縺ｯ蠢・★繝ｭ繧ｰ縺ｸ險倬鹸縺吶ｋ縲・
### 3.2 繝｢繝繝翫う繧ｺ迚医し繝ｼ繝舌・險ｭ螳・
- `ops/shared/docker/custom.properties` / `ops/modernized-server/docker/custom.properties` / `ops/shared/docker/custom-secret.properties` 縺ｫ螳夂ｾｩ縺吶ｋ `claim.*` 縺ｯ縺吶∋縺ｦ WebORCA 繝医Λ繧､繧｢繝ｫ蜷代￠縺ｮ荳玖ｨ伜､縺ｫ邨ｱ荳縺吶ｋ縲ょｷｮ蛻・・ Evidence 縺ｫ菫晏ｭ倥＠縲～ServerInfoResource` 縺ｮ JSON 縺ｨ荳ｦ縺ｹ縺ｦ謠仙・縺吶ｋ縲・  - `claim.conn=server`
  - `claim.host=weborca-trial.orca.med.or.jp`
  - `claim.send.port=443`
  - `claim.scheme=https`・・claim.useSsl=true` 縺ｧ繧ょ庄・・  - `claim.send.encoding=MS932`
- `docker compose`・医∪縺溘・ `scripts/start_legacy_modernized.sh`・峨〒繝｢繝繝翫う繧ｺ蛛ｴ繧貞・襍ｷ蜍輔＠縲～/serverinfo/claim/conn` 縺・`server` 繧定ｿ斐☆縺薙→繧堤｢ｺ隱阪☆繧九・egacy 繧ｵ繝ｼ繝舌・縺ｯ read-only 蜿ら・縺ｮ縺ｿ縺ｧ荳ｦ陦瑚ｵｷ蜍輔＠縺ｦ繧ゅｈ縺・・
### 3.3 繝阪ャ繝医Ρ繝ｼ繧ｯ縺ｨ繧ｯ繝ｩ繧､繧｢繝ｳ繝育ｫｯ譛ｫ

- `dig weborca-trial.orca.med.or.jp` / `nslookup weborca-trial.orca.med.or.jp` / `openssl s_client -connect weborca-trial.orca.med.or.jp:443 -servername weborca-trial.orca.med.or.jp` 繧貞ｮ溯｡後＠縲√い繧ｦ繝医ヰ繧ｦ繝ｳ繝・HTTPS 縺ｨ SNI 縺悟撫鬘後↑縺・％縺ｨ繧堤｢ｺ隱阪☆繧九りｨｼ霍｡縺ｯ `artifacts/orca-connectivity/<RUN_ID>/dns/` `.../tls/` 縺ｸ菫晏ｭ倥☆繧九・- 繝励Ο繧ｭ繧ｷ雜翫＠縺ｮ蝣ｴ蜷医・ `HTTPS_PROXY`・汁NO_PROXY` 繧堤腸蠅・､画焚縺ｧ螳夂ｾｩ縺励～curl --verbose -u trial:weborcatrial --head https://weborca-trial.orca.med.or.jp/` 縺ｧ Basic 隱崎ｨｼ縺碁城℃縺ｧ縺阪ｋ縺狗｢ｺ隱阪☆繧九・- 菴懈･ｭ遶ｯ譛ｫ縺ｮ `~/.curlrc` 縺ｫ `insecure` 繧・`proxy` 縺梧ｮ九▲縺ｦ縺・↑縺・°繝√ぉ繝・け縺励∝ｿ・ｦ√↑繧我ｸ譎ら噪縺ｪ `CURL_HOME` 繧堤畑諢上＠縺ｦ螳溯｡後☆繧九・
### 3.4 CLI 繝・・繝ｫ縺ｨ繝・Φ繝励Ξ

| 繝・・繝ｫ | 逶ｮ逧・| 繧ｳ繝槭Φ繝我ｾ・|
| --- | --- | --- |
| `node scripts/tools/orca-curl-snippets.js` | API 縺斐→縺ｮ curl 繧ｳ繝槭Φ繝臥函謌・| `ORCA_BASE_URL=https://weborca-trial.orca.med.or.jp ORCA_BASIC_USER=trial ORCA_BASIC_PASS=weborcatrial node scripts/tools/orca-curl-snippets.js --scenario p0` |
| `ops/tools/send_parallel_request.sh` | Modernized 繧ｵ繝ｼ繝舌・邨檎罰縺ｮ API 蜻ｼ縺ｳ蜃ｺ縺励ｒ蜀咲樟 | `ORCA_TRIAL_USER=trial ORCA_TRIAL_PASS=weborcatrial PARITY_OUTPUT_DIR=artifacts/orca-connectivity/<RUN_ID>/parallel ./ops/tools/send_parallel_request.sh --profile modernized-orca` |
| `curl`・・asic 隱崎ｨｼ・・| 逶ｴ謗･ API 螳溯｡後・繝倥ャ繝繝ｼ謗｡蜿・| `curl -u "trial:weborcatrial" -H 'Content-Type: application/json; charset=Shift_JIS' ...` |

繝・Φ繝励Ξ Evidence 縺ｯ `artifacts/orca-connectivity/TEMPLATE/` 繧・`cp -R` 縺励※縺九ｉ螳滓命縺励～README.md` 縺ｫ螳溯｡梧擅莉ｶ・亥茜逕ｨ API繝ｻ繝ｭ繧ｰ蜃ｺ蜉帛・繝ｻCRUD 螳滓命譛臥┌・峨ｒ霑ｽ險倥☆繧九・
`docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/` 驟堺ｸ九・繝ｪ繧ｯ繧ｨ繧ｹ繝磯屁蠖｢縺ｯ縲悟盾閠・い繝ｼ繧ｫ繧､繝悶阪→縺励※菫晏ｭ倥＠縺ｦ縺・ｋ縲ょｿ・ｦ√↓蠢懊§縺ｦ `ORCA_TRIAL_USER`・汁ORCA_TRIAL_PASS` 繧貞茜逕ｨ縺励◆ Basic 隱崎ｨｼ縺ｧ蜀榊茜逕ｨ縺ｧ縺阪ｋ縺後∵兜蜈･繝・・繧ｿ繧貞､画峩縺励◆蝣ｴ蜷医・縲後ヨ繝ｩ繧､繧｢繝ｫ迺ｰ蠅・〒螳滓命縲阪恵efore/after 繝ｭ繧ｰ菫晏ｭ俶ｸ医∩縲阪→譏手ｨ倥＠縺・`data-check/*.md` 繧呈ｮ九☆縲・
### 3.5 逶｣譟ｻ繝ｻ讓ｩ髯舌メ繧ｧ繝・け

- PKCS#12 縺ｨ Basic 諠・ｱ縺ｯ菴懈･ｭ閠・Ο繝ｼ繧ｫ繝ｫ縺ｮ縺ｿ縺ｧ菫晄戟縺励√Μ繝昴ず繝医Μ繧・Ο繧ｰ縺ｸ雋ｼ繧贋ｻ倥￠遖∵ｭ｢縲・- `history` 縺ｫ `trial:weborcatrial` 縺ｪ縺ｩ雉・ｼ諠・ｱ縺梧ｮ九▲縺溷ｴ蜷医・ `history -d <line>` 縺ｧ蜑企勁縺励∝ｿ・ｦ√↑繧・`unset ORCA_TRIAL_PASS` 繧貞ｮ溯｡後・- `artifacts/` 縺ｸ菫晏ｭ倥☆繧矩圀縺ｯ繧ｭ繝ｼ繝ｻ繝代せ繝輔Ξ繝ｼ繧ｺ繧偵・繧ｹ繧ｯ縺励∝ｿ・ｦ√↓蠢懊§縺ｦ `<SECRET>` 繝励Ξ繝ｼ繧ｹ繝帙Ν繝繧定ｨ倩ｼ峨・- 蜈･髯｢ API 縺ｮ繝ｪ繧ｯ繧ｨ繧ｹ繝・繝ｬ繧ｹ繝昴Φ繧ｹ縺ｯ `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` 縺ｸ髮・ｴ・＠縲∵ぅ閠・ID繝ｻ菫晞匱閠・分蜿ｷ縺ｪ縺ｩ PHI 縺ｯ `mask.txt` 縺ｫ鄂ｮ謠帙Ν繝ｼ繝ｫ繧呈ｷｻ縺医※縺九ｉ蜈ｱ譛峨☆繧具ｼ・git add` 遖∵ｭ｢縺ｧ artifacts 縺ｮ縺ｾ縺ｾ菫晏ｭ假ｼ峨・
> **驕狗畑繝｡繝｢・・025-11-15 譖ｴ譁ｰ・・*  
> 謗･邯壼・縺ｯ蟶ｸ縺ｫ WebORCA 繝医Λ繧､繧｢繝ｫ繧ｵ繝ｼ繝舌・縺ｨ縺励，RUD 繧貞ｮ滓命縺吶ｋ蝣ｴ蜷医〒繧ゅ後ヨ繝ｩ繧､繧｢繝ｫ迺ｰ蠅・〒縺ゅｋ縲阪梧桃菴懷・螳ｹ繧偵Ο繧ｰ蛹匁ｸ医∩縲阪〒縺ゅｋ縺薙→繧・Runbook ﾂｧ4.3 縺ｨ `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` 縺ｫ蠢・★險倩ｼ峨☆繧九ゅΟ繝ｼ繧ｫ繝ｫ WebORCA 繧ｳ繝ｳ繝・リ繧・い繝ｼ繧ｫ繧､繝匁ｸ医∩ seed 縺ｮ蜀肴ｧ狗ｯ峨・遖∵ｭ｢縲・
### 3.6 Push・丞ｸｳ逾ｨ・乗ぅ閠・Γ繝｢縺ｮ霑ｽ蜉貅門ｙ・亥盾辣ｧ蟆ら畑・・
| 蟇ｾ雎｡ API | 霑ｽ蜉縺ｧ蠢・ｦ√↑繧ゅ・ | 陬懆ｶｳ |
| --- | --- | --- |
| `/api01rv2/pusheventgetv2` / `/orca42/receiptprintv3` | push-exchanger・亥ｸｳ逾ｨ騾夂衍蜿嶺ｿ｡・峨～/blobapi` 蜿ら・讓ｩ髯舌∵里蟄倥・ `print002` 騾夂衍險倬鹸 | `manifest.json` No.41/42縲る夂衍縺悟ｭ伜惠縺励↑縺・ｴ蜷医・ seed 繧定ｿｽ蜉縺帙★縲＾ps 縺ｸ驕狗畑隱ｿ謨ｴ繧剃ｾ晞ｼ縺吶ｋ縲ら・莨壹〒縺阪◆繧､繝吶Φ繝医・縺ｿ `artifacts/orca-connectivity/<RUN_ID>/push/` 縺ｸ菫晏ｭ倥・|
| `/orca51/masterlastupdatev3` / `/api01rv2/insuranceinf1v2` | `system01dailyv2` 險ｼ霍｡繝・Φ繝励Ξ縺ｨ蜷御ｸ縲よ里蟄倥く繝｣繝・す繝･縺ｧ蜊∝・縺九ｒ遒ｺ隱・| TTL 貂ｬ螳壹・縺溘ａ `system01dailyv2` 竊・`masterlastupdatev3` 竊・`insuranceinf1v2` 縺ｮ鬆・分縺ｧ 1 蝗槭★縺､螳溯｡後☆繧九よｬ關ｽ繝槭せ繧ｿ縺ｯ seed 縺ｧ縺ｯ縺ｪ縺・Ops 騾｣謳ｺ縺ｧ蠕ｩ譌ｧ蜿ｯ蜷ｦ繧貞愛譁ｭ縲・|
| `/api01rv2/patientlst7v2` / `/orca06/patientmemomodv2` | ORCA UI 縺ｧ譌｢縺ｫ逋ｻ骭ｲ縺輔ｌ縺ｦ縺・ｋ謔｣閠・Γ繝｢縲～Memo_Mode` / `Memo_Class` 縺ｮ蛻ｶ邏・紛逅・| `patientmemomodv2` 縺ｯ POST 遖∵ｭ｢・・05・峨・縺溘ａ蜿門ｾ励・縺ｿ蜈郁｡後ゅΓ繝｢縺悟ｭ伜惠縺励↑縺上※繧・seed 縺ｧ陬懷ｮ後○縺壹～notes/orca-api-field-validation.md` ﾂｧ3.3 縺ｨ繝ｭ繧ｰ縺ｸ谺關ｽ諠・ｱ繧定ｨ倬鹸縺吶ｋ縲・|
| `/orca31/hspmmv2` / `/orca31/hsacctmodv2` | 譌｢蟄倥・蜈･髯｢莨夊ｨ医ョ繝ｼ繧ｿ縺ｨ `Perform_Month` 縺ｮ蜿ら・邨先棡 | `logs/2025-11-13-orca-connectivity.md` 縺ｮ `uncertain-api/` 縺ｫ 405 險ｼ霍｡縺ｮ縺ｿ蟄伜惠縲ょ・髯｢繝・・繧ｿ縺悟ｭ伜惠縺励↑縺・ｴ蜷医・ `seed SQL` 縺ｫ鬆ｼ繧峨★縲後ョ繝ｼ繧ｿ谺關ｽ縲阪→縺励※蝣ｱ蜻翫＠縲＾ps 縺ｫ蠕ｩ譌ｧ蜿ｯ蜷ｦ繧堤｢ｺ隱阪☆繧九・|

> 縺薙ｌ繧峨・ API 縺ｯ `orca-api-matrix` No.39-53 縺ｫ蜷ｫ縺ｾ繧後※縺・ｋ縲３UN_ID 繧呈治逡ｪ縺励◆繧・`notes/orca-api-field-validation.md` ﾂｧ3 縺ｨ `ORCA_API_STATUS.md` ﾂｧ2.4 縺ｫ蜿肴丐縺吶ｋ縺薙→・・eed 蜿ら・縺ｯ螻･豁ｴ縺ｨ縺励※縺ｮ縺ｿ謇ｱ縺・ｼ峨・
No.19-38 縺ｧ菴懈・縺励◆ XML 繝・Φ繝励Ξ縺ｮ險ｼ霍｡縺ｯ `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` 莉･荳九↓縺ｾ縺ｨ繧√￣ush/蟶ｳ逾ｨ/謔｣閠・Γ繝｢邉ｻ縺ｯ `push/` 繧・`memo/` 繧ｵ繝悶ョ繧｣繝ｬ繧ｯ繝医Μ縺ｨ蜷後§邊貞ｺｦ縺ｧ菫晄戟縺吶ｋ縲Ａnotes/orca-api-field-validation.md` ﾂｧ3 縺ｮ seed 陦後・縲碁℃蜴ｻ縺ｫ諠ｳ螳壹＠縺溘ョ繝ｼ繧ｿ譚｡莉ｶ縲阪・險倬鹸縺ｨ縺励※谿九＠縲∝ｮ滄°逕ｨ縺ｧ縺ｯ谺關ｽ迥ｶ豕√→險ｼ霍｡繝代せ縺ｮ縺ｿ繧定ｿｽ險倥☆繧九・
## 4. 讀懆ｨｼ繝輔ぉ繝ｼ繧ｺ

### 4.1 TLS/BASIC 繝上Φ繝峨す繧ｧ繧､繧ｯ

1. `RUN_ID={{YYYYMMDD}}TorcaTrialCrudZ#` 繧呈治逡ｪ縺励～artifacts/orca-connectivity/${RUN_ID}/{dns,tls,trial,trace,data-check}` 繧剃ｽ懈・縺吶ｋ縲・2. `dig weborca-trial.orca.med.or.jp`・・acOS/Linux・峨∪縺溘・ `Resolve-DnsName weborca-trial.orca.med.or.jp`・・indows・峨〒 A 繝ｬ繧ｳ繝ｼ繝峨ｒ蜿門ｾ励＠縲∝・蜉帙ｒ `dns/resolve.log` 縺ｫ菫晏ｭ倥☆繧九ゆｽｵ縺帙※ `openssl s_client -connect weborca-trial.orca.med.or.jp:443 -servername weborca-trial.orca.med.or.jp` 繧貞ｮ溯｡後＠縲ゝLS 莠､貂臥ｵ先棡繧・`tls/openssl_s_client.log` 縺ｸ險倬鹸縺吶ｋ縲・3. Basic 隱崎ｨｼ縺ｧ `system01dailyv2` 繧・1 蝗槫ｮ溯｡後＠縲？TTP/TLS 縺ｮ謌仙粥繧堤｢ｺ隱阪☆繧具ｼ・curl` 髮帛ｽ｢縺ｯ ﾂｧ0.4 繧貞盾辣ｧ・峨・4. `Api_Result=00` 繧堤｢ｺ隱阪＠縲～docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` 縺ｸ `RUN_ID`・秋TTP・汁Api_Result`・剰ｨｼ霍｡繝代せ繧定ｿｽ險倥☆繧九・
### 4.2 ServerInfoResource 縺ｫ繧医ｋ `claim.conn` 遒ｺ隱・
- `curl http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn -u <admin>` 繧貞ｮ溯｡後＠縲√Ξ繧ｹ繝昴Φ繧ｹ繧・`artifacts/<RUN_ID>/serverinfo/claim_conn.json` 縺ｸ菫晏ｭ倥☆繧九・- `claim.conn=server` 莉･螟悶′霑斐▲縺溷ｴ蜷医・ `ops/shared/docker/custom.properties` 縺ｪ縺ｩ縺ｮ `claim.*` 繧剃ｿｮ豁｣縺励∝・蜿門ｾ励＠縺溷ｷｮ蛻・ｒ Evidence 縺ｫ谿九☆縲・
### 4.3 P0 + CRUD API 繧ｻ繝・ヨ

> RUN_ID=`20251116T173000Z`: Trial 繧ｵ繝ｼ繝舌・縺ｧ POST/PHR API 縺檎ｦ∵ｭ｢縺輔ｌ縺ｦ縺・ｋ髢薙・ Spec-based 螳溯｣・→縺励※謇ｱ縺・∵怙邨よｮｵ髫弱〒 ORMaster・乗悽逡ｪ繧ｵ繝ｼ繝舌・謗･邯壹↓蛻・ｊ譖ｿ縺医※騾壻ｿ｡讀懆ｨｼ繧定｡後≧縲よ､懆ｨｼ螳御ｺ・ｾ後↓ DOC_STATUS・蹴unbook・就PI_STATUS 繧貞酔譌･譖ｴ譁ｰ縺吶ｋ縲・
- 蜿ら・邉ｻ・・ystem/accept/patient/appointment・峨→ CRUD 邉ｻ・井ｺ育ｴ・匳骭ｲ繝ｻ蜿嶺ｻ倡匳骭ｲ繝ｻ險ｺ逋よ・邏ｰ謫堺ｽ懶ｼ峨ｒ蜈ｨ縺ｦ WebORCA 繝医Λ繧､繧｢繝ｫ繧ｵ繝ｼ繝舌・縺ｧ螳溯｡後☆繧九Ａassets/orca-trialsite/raw/trialsite.md` 繧貞盾辣ｧ縺励∝茜逕ｨ荳榊庄讖溯・繧剃ｺ句燕遒ｺ隱阪☆繧九・- CRUD 謫堺ｽ懊・縲後ヨ繝ｩ繧､繧｢繝ｫ迺ｰ蠅・剞螳壹〒譁ｰ隕冗匳骭ｲ・乗峩譁ｰ・丞炎髯､ OK縲阪ょｮ滓命縺励◆蜀・ｮｹ縺ｯ `artifacts/orca-connectivity/<RUN_ID>/data-check/<api>.md` 縺ｨ `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` 縺ｮ Checklist 縺ｸ險倬鹸縺励∝ｯｾ雎｡ ID繝ｻ謫堺ｽ懷・螳ｹ繝ｻ謌ｻ縺玲婿繧呈・遉ｺ縺吶ｋ縲・- `ORCAcertification/` 驟堺ｸ九・ PKCS#12 繧・撼蜈ｬ髢玖ｳ・ｼ諠・ｱ縺ｯ繧｢繝ｼ繧ｫ繧､繝匁桶縺・よ磁邯壹・ `trial/weborcatrial` 縺ｮ Basic 隱崎ｨｼ縺ｮ縺ｿ繧貞茜逕ｨ縺吶ｋ縲・- Trial HTTP 隕∽ｻｶ: `curl -vv -u trial:weborcatrial -H 'Accept: application/xml' -H 'Content-Type: application/xml' --data-binary @payloads/<api>_trial.xml https://weborca-trial.orca.med.or.jp/<path>` 繧貞・騾壹ヵ繧ｩ繝ｼ繝槭ャ繝医→縺励～payloads/*.xml` 縺ｯ firecrawl 蜿門ｾ玲ｸ医∩莉墓ｧ假ｼ・lug=`appointlst`,`appointmod`,`acceptancelst`,`acceptmod`,`medicalmod` 遲会ｼ峨→謨ｴ蜷医＆縺帙◆ XML 繧帝∽ｿ｡縺吶ｋ縲りｨｼ霍｡縺ｫ縺ｯ繝ｪ繧ｯ繧ｨ繧ｹ繝・XML 縺ｨ繝ｬ繧ｹ繝昴Φ繧ｹ XML 繧・`crud/<api>/` 縺ｫ菫晏ｭ倥☆繧九・- `trialsite.md`縲後♀菴ｿ縺・＞縺溘□縺代↑縺・ｩ溯・荳隕ｧ縲阪↓險倩ｼ峨・ API・井ｾ・ `/20/adm/phr/*`・峨ｄ POST 譛ｪ隗｣謾ｾ繧ｨ繝ｳ繝峨・繧､繝ｳ繝茨ｼ・/orca14/appointmodv2` 遲会ｼ峨・ Blocker=`TrialLocalOnly` 縺ｨ縺励※ Runbook / Checklist / 繝ｭ繧ｰ縺ｸ蠑慕畑莉倥″縺ｧ險倩ｼ峨＠縲√Ο繝ｼ繧ｫ繝ｫ ORCA・・RMaster 隱崎ｨｼ・峨↓蛻・ｊ譖ｿ縺医ｋ蜀埼幕譚｡莉ｶ・・octor seed 蠕ｩ譌ｧ・輝OST 隗｣謾ｾ・峨ｒ遉ｺ縺吶・- Blocker 繧剃ｻ倅ｸ弱＠縺・API 縺ｫ縺､縺・※縺ｯ RUN_ID=`20251116T173000Z` 縺ｮ `docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` 縺ｫ蠕薙＞縲’inal validation 繧・Production/ORMaster 謗･邯夲ｼ・curl -vv -u ormaster:ormaster --data-binary @payloads/<api>_prod.xml https://ormaster.orca.med.or.jp/<path>`・峨〒螳滓命縺吶ｋ縲・NS/TLS・・nslookup`, `openssl s_client`・芽ｨｼ霍｡縺ｨ Basic 隱崎ｨｼ繝ｭ繧ｰ繧偵そ繝・ヨ縺ｧ蜿門ｾ励＠縲～operations/logs/<RUN_ID>-prod-validation.md` 縺ｫ繝ｪ繝ｳ繧ｯ縺吶ｋ縺ｾ縺ｧ Blocker 繧堤ｶｭ謖√☆繧九・- Doctor seed / 繝・・繧ｿ繧ｮ繝｣繝・・: Trial 縺ｧ HTTP200 縺九▽ `Api_Result=12/13/14` 縺瑚ｿ斐ｋ蝣ｴ蜷医・ `data-check/` 縺ｨ `crud/<api>/` 縺ｫ繝ｬ繧ｹ繝昴Φ繧ｹ XML 繧剃ｿ晏ｭ倥＠縲～assets/orca-trialsite/raw/trialsite.md#sample` 縺ｫ險倩ｼ峨・ seed・域ぅ閠・5 譯・`00001`, 蛹ｻ蟶ｫ `0001` 縺ｪ縺ｩ・峨→縺ｮ蟾ｮ逡ｰ繧・`blocked/README.md` 縺ｮ縲後ョ繝ｼ繧ｿ繧ｮ繝｣繝・・縲肴ｬ・∈霆｢險倥・UI 遶ｯ譛ｫ縺後↑縺・ｴ蜷医・ CLI 螳滓ｸｬ譌･譎ゅ・蜀埼幕譚｡莉ｶ繧・`data-check/README.md` 縺ｫ蠢・★險倬鹸縺吶ｋ縲・- 繧ｫ繝舌Ξ繝・ず譖ｴ譁ｰ: CRUD 螳滓ｸｬ蠕後↓ `coverage/coverage_matrix.md` 繧貞・逕滓・縺励’irecrawl 莉墓ｧ倥せ繝ｩ繝・げ繧偵卦rial 謠蝉ｾ・螳滓ｸｬ/譛ｪ螳滓ｸｬ)縲阪卦rial 髱樊署萓・trialsite#limit 縺ｾ縺溘・ HTTP404/405)縲阪∈蛻・｡槭☆繧九ょ酔縺倬寔險育ｵ先棡繧・`docs/server-modernization/phase2/operations/logs/<date>-orca-trial-crud.md` 縺ｨ `DOC_STATUS` 蛯呵・ｬ・↓雋ｼ繧贋ｻ倥￠縲～blocked/README.md` 縺ｨ險ｼ霍｡繝代せ繧貞酔譛溘＆縺帙ｋ縲・- ORMaster 蜑肴署 API・・/api/api21/medicalmodv2`, `/orca11/acceptmodv2` 縺ｪ縺ｩ・峨・繝医Λ繧､繧｢繝ｫ繧ｵ繝ｼ繝舌・縺ｧ `Api_Result=10/13/14` 縺ｨ縺ｪ繧九◆繧√～curl -vv -u ormaster:ormaster ... --data-binary @payloads/<api>_trial.xml http://localhost:8000/...` 縺ｧ繝ｭ繝ｼ繧ｫ繝ｫ ORCA 螳滓ｸｬ繧定｡後＞縲√ヨ繝ｩ繧､繧｢繝ｫ邨先棡縺ｯ Blocker 縺ｨ縺励※谿九☆縲・- 2025-11-15 螳滓ｸｬ・・UN_ID=`20251115T134513Z`・・ Codex CLI 縺九ｉ DNS/TLS・・nslookup_2025-11-15T22:50:38+09:00.txt`, `openssl_s_client_2025-11-15T22:50:42+09:00.txt`・峨→ `/api01rv2/acceptlstv2`・・TTP200/`Api_Result=13`・峨～/api01rv2/appointlstv2`・・TTP200/`Api_Result=12`・峨～/api/api21/medicalmodv2`・・TTP200/`Api_Result=10`・峨ｒ蜿門ｾ励・vidence 縺ｯ `artifacts/orca-connectivity/20251115T134513Z/{dns,tls,crud,coverage,blocked}` 縺翫ｈ縺ｳ `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` 縺ｫ險倬鹸縺励‥octor/patient seed 谺關ｽ繧・Blocker=`TrialSeedMissing` 縺ｨ縺励※邂｡逅・ｸｭ縲・- 2025-11-15 螳滓ｸｬ・・UN_ID=`20251115TrialConnectivityCodexZ1`・・ 蜷・CLI 迺ｰ蠅・〒 `nslookup_2025-11-15T13-48-30Z.txt` / `openssl_s_client_2025-11-15T13-48-52Z.txt` 繧貞叙蠕励＠縲～/api01rv2/acceptlstv2`・・TTP200/`Api_Result=13`・峨～/api01rv2/appointlstv2`・・TTP200/`Api_Result=12`・峨～/api/api21/medicalmodv2`・・TTP200/`Api_Result=14`・峨ｒ XML 騾∽ｿ｡縲Ａ/orca11/acceptmodv2` 縺ｨ `/orca14/appointmodv2` 縺ｯ `HTTP/1.1 405 Method Not Allowed` 縺縺｣縺溘◆繧・Blocker=`TrialLocalOnly` 縺ｨ縺励※ `blocked/README.md` 縺ｨ `coverage/coverage_matrix.md` 縺ｸ逋ｻ骭ｲ縲・vidence: `artifacts/orca-connectivity/20251115TrialConnectivityCodexZ1/{dns,tls,data-check,crud,coverage,blocked}`縲√Ο繧ｰ: `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`縲・- 2025-11-16 螳滓ｸｬ・・UN_ID=`20251116T164300Z`・・ `nslookup_2025-11-16T02-04-36Z.txt`・・NAME=`weborca-trial1.japaneast.cloudapp.azure.com`・・ `openssl_s_client_2025-11-16T02-04-43Z.txt`・・*.orca.med.or.jp`, TLSv1.2, Cipher=ECDHE-RSA-AES256-GCM-SHA384・峨ｒ蜿門ｾ励＠縲～curl -vv -u trial:weborcatrial --data-binary @payloads/{acceptlst,appointlst,medicalmod,acceptmod,appointmod}_trial.xml` 繧貞・螳溯｡後Ａ/api01rv2/acceptlstv2`=`HTTP200/Api_Result=13`, `/api01rv2/appointlstv2`=`HTTP200/Api_Result=12`, `/api/api21/medicalmodv2`=`HTTP200/Api_Result=10`縲∵嶌霎ｼ縺ｿ邉ｻ・・/orca11/acceptmodv2`, `/orca14/appointmodv2`・峨・蠑輔″邯壹″ `HTTP/1.1 405 Method Not Allowed (Allow=OPTIONS,GET)`縲Ａcoverage/coverage_matrix.md` 縺ｯ RUN_ID 莉倥″縺ｫ繧ｳ繝斐・縺励ゝrial 遖∵ｭ｢ API・・eport_print/systemkanri/userkanri/acceptmod/appointmod・峨ｒ縲御ｻ墓ｧ伜ｮ溯｣・ｸ茨ｼ週rial荳榊庄縲阪Λ繝吶Ν縺ｸ螟画峩縲Ａblocked/README.md` 繧・RUN_ID 迚医↓譖ｴ譁ｰ縺励．octor/Patient seed 荳崎ｶｳ繧偵ョ繝ｼ繧ｿ繧ｮ繝｣繝・・縺ｨ縺励※谿九＠縺溘・vidence: `artifacts/orca-connectivity/20251116T164300Z/{dns,tls,crud,coverage,blocked}`縲・- 2025-11-16 繧ｫ繝舌Ξ繝・ず謨ｴ逅・ｼ・UN_ID=`20251116T170500Z`・・ Matrix No.2/4・・appointmodv2`,`acceptmodv2`・峨↓縺､縺・※ Trial POST 縺檎ｶ咏ｶ壹＠縺ｦ `HTTP/1.1 405 Method Not Allowed` 縺ｧ諡貞凄縺輔ｌ繧九％縺ｨ繧堤｢ｺ隱阪・RUD 螳滓ｸｬ繧偵せ繧ｭ繝・・縺励～artifacts/orca-connectivity/20251116T170500Z/coverage/coverage_matrix.md` 縺ｫ `[Spec-based]` 繝ｩ繝吶Ν繧剃ｻ倅ｸ弱∵ｹ諡縺ｨ Blocker 繧・`artifacts/orca-connectivity/20251116T170500Z/blocked/README.md#http-405邂｡逅・･ｭ蜍咏ｳｻ-post-蟆・事`・・rialsite ﾂｧ1・峨∈髮・ｴ・＠縺溘ゅΟ繧ｰ: `docs/server-modernization/phase2/operations/logs/20251116T170500Z-coverage.md`縲・
| # | 繧ｨ繝ｳ繝峨・繧､繝ｳ繝・| 遞ｮ蛻･ | 謌仙粥譚｡莉ｶ | 險ｼ霍｡/繝ｭ繧ｰ | CRUD 險倬鹸繝昴う繝ｳ繝・|
| --- | --- | --- | --- | --- | --- |
| 1 | `POST /api01rv2/patientgetv2` | 蜿ら・ | HTTP 200 / `Api_Result=00` 縺ｧ謔｣閠・`00001` 縺ｮ蝓ｺ譛ｬ諠・ｱ繧貞叙蠕・| `trial/patientgetv2.{headers,json}`, `trace/patientgetv2.trace` | `data-check/patientgetv2.md` 縺ｫ辣ｧ莨壽擅莉ｶ縺ｨ蜿門ｾ嶺ｻｶ謨ｰ繧定ｨ倩ｼ・|
| 2 | `POST /api01rv2/appointlstv2` | 蜿ら・ | HTTP 200 縺ｧ `Appointment_Information` 縺瑚ｿ斐ｋ・・0251115 RUN 縺ｯ doctor seed 谺關ｽ縺ｧ `Api_Result=12`縲・UI 縺九ｉ蛹ｻ蟶ｫ `0001` 繧貞・逋ｻ骭ｲ蠕後↓蜀肴ｸｬ螳夲ｼ・| `trial/appointlstv2.{headers,json}`縲～screenshots/appointlstv2.png` | `data-check/appointlstv2.md` 縺ｫ UI 縺ｨ縺ｮ遯∝粋邨先棡縺ｨ荳崎ｶｳ seed 繧定ｨ倬鹸 |
| 3 | `POST /api01rv2/acceptlstv2` | 蜿ら・ | HTTP 200 / `Api_Result=00`・・0251115 RUN 縺ｯ doctor seed 谺關ｽ縺ｧ `Api_Result=13`縲ょ女莉・seed 蠕ｩ譌ｧ蠕後↓ `21`竊蛋00` 繧堤｢ｺ隱搾ｼ・| `trial/acceptlstv2.{headers,json}` | `data-check/acceptlstv2.md` 縺ｫ蠖捺律蜿嶺ｻ倅ｻｶ謨ｰ縺ｨ Blocker 謇隕九ｒ險倬鹸 |
| 4 | `POST /orca14/appointmodv2` | 譁ｰ隕上・譖ｴ譁ｰ繝ｻ蜑企勁 | (Trial) HTTP 405 `Allow: OPTIONS, GET`縲・locker=`TrialLocalOnly`縲ゅΟ繝ｼ繧ｫ繝ｫ ORCA 縺ｧ縺ｯ HTTP 200 / `Api_Result=00` 縺ｨ縺ｪ繧贋ｺ育ｴ・′ `appointlstv2` 縺ｧ遒ｺ隱阪〒縺阪ｋ | Trial: `crud/appointmodv2/http405/{request,response}.http`縲・ocal: `curl -vv -u ormaster:ormaster ... --data-binary @payloads/appointmod_trial.xml http://localhost:8000/orca14/appointmodv2?class=01` 縺ｨ `trace/appointmodv2.trace` | `data-check/appointmodv2.md` 縺ｫ莠育ｴ・分蜿ｷ繝ｻ螟画峩蜀・ｮｹ繝ｻ謦､蝗樊桃菴懊ｒ險倩ｼ峨＠縲。locker 縺ｨ蜀埼幕譚｡莉ｶ・医Ο繝ｼ繧ｫ繝ｫ ORCA 襍ｷ蜍戊ｨｱ蜿ｯ・掬octor seed 蠕ｩ譌ｧ・峨ｒ霑ｽ險・|
| 5 | `POST /api/api21/medicalmodv2` | 險ｺ逋よ・邏ｰ CRUD | Trial: HTTP 200 縺ｧ繧・`Api_Result=10/14`・・0251115 RUN 縺ｯ謔｣閠・`00000001` 荳榊惠縺ｧ `Api_Result=10`・峨・ocal: HTTP 200 / `Api_Result=00` 縺ｧ `Medical_Information` 縺悟叙蠕励〒縺阪ｋ | `crud/medicalmodv2/{request,response}.xml`・・payloads/medical_update_trial.xml`・峨→ `trace/medicalmodv2.trace` | `data-check/medicalmodv2.md` 縺ｫ謔｣閠・分蜿ｷ繝ｻ險ｺ逋・ID繝ｻ謫堺ｽ懃岼逧・５rial 縺ｧ縺ｯ Blocker=`TrialSeedMissing`・・octor/patient seed 蠕ｩ譌ｧ蠕後↓蜀肴ｸｬ螳夲ｼ峨ｒ險倩ｼ・|
| 6 | `POST /orca11/acceptmodv2` | 蜿嶺ｻ・CRUD | Trial: HTTP 200 / `Api_Result=10/13`縲・ocal: HTTP 200 / `Api_Result=00` & `Delete_Flg=1` 繧堤｢ｺ隱・| `crud/acceptmodv2/{request,response}.xml`・・payloads/acceptmod_trial.xml`・峨～trace/acceptmodv2.trace` | `data-check/acceptmodv2.md` 縺ｫ蜿嶺ｻ倡分蜿ｷ繝ｻ謫堺ｽ懃ｨｮ蛻･繝ｻ謌ｻ縺苓ｦ∝凄縲５rial 蛛ｴ縺ｯ Blocker=`TrialLocalOnly` 縺ｫ蛻・｡・|

- 譖ｸ縺崎ｾｼ縺ｿ蜑榊ｾ後〒 `acceptlstv2` 繧・`appointlstv2` 繧貞叙蠕励＠縲～data-check` 縺ｫ before/after 繧剃ｿ晏ｭ倥☆繧九ゅΟ繧ｰ繝・ぅ繝ｬ繧ｯ繝医Μ縺ｯ `artifacts/orca-connectivity/<RUN_ID>/trial/<api>/` 縺ｸ邨ｱ荳縺励～trace/` 縺ｨ `screenshots/` 繧ょ酔縺・RUN_ID 縺ｧ謠・∴繧九・
### 4.4 PHR 繧ｷ繝ｼ繧ｱ繝ｳ繧ｹ險ｼ霍｡繝・Φ繝励Ξ

> RUN_ID=`20251116T173000Z`: Trial 繧ｵ繝ｼ繝舌・縺ｧ POST/PHR API 縺檎ｦ∵ｭ｢縺輔ｌ縺ｦ縺・ｋ髢薙・ Spec-based 螳溯｣・→縺励※謇ｱ縺・∵怙邨よｮｵ髫弱〒 ORMaster・乗悽逡ｪ繧ｵ繝ｼ繝舌・謗･邯壹↓蛻・ｊ譖ｿ縺医※騾壻ｿ｡讀懆ｨｼ繧定｡後≧縲よ､懆ｨｼ螳御ｺ・ｾ後↓ DOC_STATUS・蹴unbook・就PI_STATUS 繧貞酔譌･譖ｴ譁ｰ縺吶ｋ縲・
- RUN_ID=`YYYYMMDDTorcaPHRSeqZ#` 繧呈鴛縺・・縺励～artifacts/orca-connectivity/TEMPLATE/phr-seq` 繧偵さ繝斐・縺励※菴ｿ逕ｨ縺吶ｋ縲・- `audit/logs/phr_audit_extract.sql` 縺ｧ `event_id LIKE 'PHR_%'` 繧呈歓蜃ｺ縺励～logs/phr_audit_${RUN_ID}.sql` 縺ｨ縺励※菫晏ｭ倥☆繧九よｬ關ｽ繧､繝吶Φ繝医・ `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md#pending-risks` 縺ｸ霆｢險倥☆繧九・- HTTP 險ｼ霍｡縺ｯ `trial/phr/<api>.{headers,json}`縲ゞI 險ｼ霍｡縺ｯ `screenshots/phr-XX.png` 縺ｫ縺ｾ縺ｨ繧√～ServerInfoResource` 縺ｮ JSON 繧剃ｸｦ險倥☆繧九・- Modernized 髢狗匱迺ｰ蠅・〒縺ｮ Secrets/Context 繝√ぉ繝・け縺ｯ RUN_ID=`20251121TrialPHRSeqZ1-CTX` 繧貞盾辣ｧ縲Ａ1.3.6.1.4.1.9414.72.103:admin` 繝ｦ繝ｼ繧ｶ繝ｼ繧・BASIC 隱崎ｨｼ縺ｧ逋ｻ骭ｲ縺励～serverinfo/claim_conn.json`・・ody=`server`・・SHA256縲√♀繧医・ `wildfly/phr_20251121TrialPHRSeqZ1-CTX.log` 縺ｫ蜃ｺ蜉帙＆繧後◆ `PHR_*_TEXT` 逶｣譟ｻ繧定ｨｼ霍｡蛹悶＠縺溘ＡPHRResource` 縺ｮ SignedUrl 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ縺ｯ `PHRKey`/`PHRAsyncJob` 縺・PersistenceUnit 譛ｪ逋ｻ骭ｲ縺ｮ縺溘ａ `UnknownEntityException` 縺ｧ蛛懈ｭ｢縺吶ｋ縺薙→縺悟愛譏弱＠縺ｦ縺翫ｊ縲～docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md#4-task-e-secretscontext-蜀肴､懆ｨｼ-run_id20251121trialphrseqz1-ctx` 縺ｫ Blocker 繧定ｨ倬鹸縺励◆縲・- 2025-11-16 繧ｫ繝舌Ξ繝・ず謨ｴ逅・ｼ・UN_ID=`20251116T170500Z`・・ Matrix No.11/32/42・・system01lstv2`,`manageusersv2`,`receiptprintv3`・峨・ Trial UI 縺ｧ邂｡逅・Γ繝九Η繝ｼ・丞ｸｳ逾ｨ蜃ｺ蜉帙′蟆・事縺輔ｌ縺ｦ縺・ｋ縺溘ａ CRUD 螳滓ｸｬ荳榊庄縲ょ推 API 繧・`[Spec-based]` 縺ｨ縺励※ `artifacts/orca-connectivity/20251116T170500Z/coverage/coverage_matrix.md`・汁blocked/README.md#{system01lstv2,manageusersv2,receiptprintv3}` 縺ｫ逋ｻ骭ｲ縺励∵ｹ諡繧・`docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#縺贋ｽｿ縺・＞縺溘□縺代↑縺・ｩ溯・遲荏 ﾂｧ1/ﾂｧ4 縺ｸ繝ｪ繝ｳ繧ｯ縲ゅΟ繝ｼ繧ｫ繝ｫ ORMaster・育ｮ｡逅・API 隗｣謾ｾ + push-exchanger・峨ｒ蜀榊叙蠕励☆繧九∪縺ｧ譛ｬ繧ｹ繝・・繧ｿ繧ｹ繧堤ｶｭ謖√☆繧九・- PHR Trial 螳滓ｸｬ縺ｧ縺ｯ `curl -vv -u trial:weborcatrial .../20/adm/phr/*` 縺・404/405 縺ｨ縺ｪ繧九◆繧√ヽUN_ID=`20251116T173000Z` 縺ｧ final validation 繧・ORMaster・乗悽逡ｪ繧ｵ繝ｼ繝舌・縺ｸ蛻・ｊ譖ｿ縺医ｋ險育判繧・`docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` 縺ｫ險倩ｼ峨☆繧九Ａcurl -vv -u ormaster:ormaster --data-binary @payloads/phr_phase_<x>_prod.xml https://ormaster.orca.med.or.jp/20/adm/phr/<phase>` 縺ｨ DNS/TLS 險ｼ霍｡縲～operations/logs/<RUN_ID>-prod-validation.md` 縺ｸ縺ｮ繝ｭ繧ｰ繝ｪ繝ｳ繧ｯ繧貞叙蠕励＠縺滓凾轤ｹ縺ｧ Blocker 繧定ｧ｣髯､縺励￣HR checklist・蹴unbook・就PI_STATUS 繧貞酔譌･莉倥〒譖ｴ譁ｰ縺吶ｋ縲・
### 4.5 HTTP 401/403/404/405 繝医Μ繧｢繝ｼ繧ｸ

- Basic 隱崎ｨｼ縺ｧ縺ｮ蜀咲樟繝ｭ繧ｰ・・curl -v -u trial:weborcatrial ...`・峨～openssl s_client`縲～dns/` 險ｼ霍｡縲～ServerInfoResource` 繧呈怙菴朱剞縺ｮ繧ｻ繝・ヨ縺ｨ縺吶ｋ縲・- 405 繧・404 繧貞叙蠕励＠縺溷ｴ蜷医・ `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` 縺ｮ繝輔か繝ｼ繝槭ャ繝医〒 `httpdump/{api}/request.http` `response.http` 繧剃ｿ晏ｭ倥＠縲～logs/<date>-orca-connectivity.md` 縺ｸ `縲占ｪｿ譟ｻ縲疏 繝悶Ο繝・け繧定ｿｽ險倥☆繧九・- 繧ｨ繝ｩ繝ｼ縺檎ｶ咏ｶ壹☆繧句ｴ蜷医・ `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 縺ｮ WebORCA 遽・・asic 隱崎ｨｼ迚茨ｼ峨↓蠕薙＞縲ヾlack 竊・PagerDuty 竊・Backend Lead 縺ｮ鬆・〒繧ｨ繧ｹ繧ｫ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ縺吶ｋ縲・
### 4.6 蝣ｱ蜻翫→繧ｨ繧ｹ繧ｫ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ

1. `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` 縺ｮ RUN_ID 陦ｨ繧呈峩譁ｰ縺励，RUD 螳滓命蜀・ｮｹ縺ｨ險ｼ霍｡繝代せ繧定ｨ倩ｼ峨☆繧九・2. `artifacts/orca-connectivity/<RUN_ID>/README.md` 縺ｫ TLS/DNS 險ｼ霍｡縲∝ｮ溯｡・API縲，RUD 縺ｮ before/after縲√Ο繧ｰ菫晏ｭ伜・繧貞・謖吶☆繧九・3. `docs/web-client/planning/phase2/DOC_STATUS.md` 縺ｮ ORCA 謗･邯壽ｬ・ｒ繧ｿ繧ｹ繧ｯ諡・ｽ薙∈繝ｪ繝ｬ繝ｼ縺励∝ｿ・ｦ√↑繧・`docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md` 縺ｸ陬懆ｶｳ繝｡繝｢繧定ｿｽ蜉縺吶ｋ縲・4. Blocker 逋ｺ逕滓凾縺ｯ Slack `#server-modernized-alerts` 竊・PagerDuty 竊・Backend Lead 縺ｮ鬆・〒蝣ｱ蜻翫＠縲～logs/<date>-orca-connectivity.md` 縺ｫ縺ｯ `縲宣｣邨｡縲疏 繝悶Ο繝・け縺ｧ邨檎ｷｯ繧呈ｮ九☆縲・
## 5. API 讀懆ｨｼ繝槭ヨ繝ｪ繧ｯ繧ｹ
- `docs/server-modernization/phase2/operations/assets/orca-api-matrix.with-spec.csv` 繧呈怙譁ｰ蛹悶＠縲～Priority=P0/P1/P2` 縺斐→縺ｮ螳滓命迥ｶ豕√ｒ `checkedAt` 蛻励〒邂｡逅・☆繧九・- 蛯呵・ｬ・↓莉倅ｸ弱☆繧九ち繧ｰ萓具ｼ・窶ｻ迺ｰ蠅・ｨｭ螳夊ｦ∫｢ｺ隱港, `窶ｻUTF-8蠢・・ 縺ｪ縺ｩ・峨・ `notes/orca-api-field-validation.md` 縺ｮ謖・､ｺ縺ｫ蠕薙≧縲Ａnpm run lint:orca-matrix` 縺ｧ隴ｦ蜻翫′蜃ｺ縺溷ｴ蜷医・菫ｮ豁｣螳御ｺ・∪縺ｧ RUN_ID 繧・`NG` 縺ｫ縺励※縺翫￥縲・- API 縺斐→縺ｮ諡・ｽ薙Ο繝ｼ繝ｫ縺ｯ `operations/assets/orca-api-assignments.md` 繧貞盾辣ｧ縺励～PHASE2_PROGRESS.md` 縺ｨ遯√″蜷医ｏ縺帙ｋ縲・
### 5.1 Matrix No.39-53・医す繧ｹ繝・Β・城夂衍・冗音谿・API・・
| No | API | 繧ｹ繝・・繧ｿ繧ｹ | Evidence / 谺｡繧｢繧ｯ繧ｷ繝ｧ繝ｳ |
| --- | --- | --- | --- |
| 39 | `/orca31/hspmmv2` | `HTTP 405 (Allow GET)` | RUN_ID=`20251113T002806Z`・・artifacts/.../uncertain-api/39_hspmmv2_response.txt`・峨０RCA route 髢区叛縺悟ｿ・ｦ√Ａnotes/orca-api-field-validation.md` ﾂｧ3.1縲・|
| 40 | `/orca31/hsacctmodv2`・亥ｮ､譁吝ｷｮ鬘搾ｼ・| RUN 譛ｪ螳滓命・域里蟄伜・髯｢繝・・繧ｿ谺關ｽ・・| manifest slug=`hospsagaku`縲８ebORCA 譛ｬ逡ｪ縺ｫ螳､譁吝ｷｮ鬘阪ョ繝ｼ繧ｿ縺悟ｭ伜惠縺励↑縺・◆繧∽ｿ晉蕗縲ょｾｩ譌ｧ螳御ｺ・∪縺ｧ縺ｯ谺關ｽ繝ｭ繧ｰ縺ｮ縺ｿ譖ｴ譁ｰ縺励《eed 繧呈兜蜈･縺励↑縺・・|
| 41 | `/api01rv2/pusheventgetv2` | RUN 譛ｪ螳滓命・・ush-exchanger 蠢・茨ｼ・| `logs/2025-11-13...` 縺ｫ螻･豁ｴ縺ｪ縺励ＡORCA_API_STATUS.md` ﾂｧ2.4 / `notes` ﾂｧ3.2 蜿ら・縲Ｑrint002 騾夂衍縺梧里蟄倡腸蠅・〒遒ｺ隱阪〒縺阪◆譎らせ縺ｧ讀懆ｨｼ縺吶ｋ・・eed 霑ｽ蜉縺ｯ遖∵ｭ｢・峨・|
| 42 | `/orca42/receiptprintv3` | RUN 譛ｪ螳滓命・・USH/Blob 驕狗畑譛ｪ謨ｴ蛯呻ｼ・| `push/print002` 繧貞女縺大叙繧矩°逕ｨ繧・ﾂｧ3.6 縺ｸ霑ｽ蜉縲ょｸｳ逾ｨ繝・Φ繝励Ξ縺ｯ `assets/orca-api-requests/42_receipt_printv3_request.json` 繧貞盾辣ｧ縲・|
| 43 | `/orca51/masterlastupdatev3` | RUN 譛ｪ螳滓命・・ystem daily 縺ｮ莉伜ｸｯ繝√ぉ繝・け・・| `system01dailyv2` 蠕後↓ 1 蝗槭□縺大他縺ｳ縲～trial/masterlastupdatev3.*` 縺ｫ邨先棡繧剃ｿ晏ｭ倥☆繧九ＡORCA_API_STATUS.md` ﾂｧ2.4縲・|
| 44 | `/api01rv2/system01dailyv2` | `HTTP 200 / Api_Result=00`・・TF-8・・| RUN_ID=`20251113T002806Z`縲４hift_JIS 縺ｯ `Api_Result=91` 縺ｮ縺溘ａ繝・Φ繝励Ξ繧・UTF-8 縺ｫ邨ｱ荳縲・|
| 45 | `/api01rv2/patientlst7v2` | RUN 譛ｪ螳滓命・・emomodv2 萓晏ｭ假ｼ・| `patientmemomodv2` 405 縺ｮ縺溘ａ蜀・ｮｹ繧堤｢ｺ隱阪〒縺阪↑縺・Ａnotes/orca-api-field-validation.md` ﾂｧ3.3縲・|
| 46 | `/api21/medicalmodv23` | `HTTP 405 (Allow: GET)` | RUN_ID=`20251113T002806Z`縲Ｓoute 髢区叛萓晞ｼ荳ｭ縲ゅユ繝ｳ繝励Ξ縺ｯ XML `<medicalv2req3>`. |
| 47 | `/orca36/hsfindv3` | RUN 譛ｪ螳滓命・域里蟄伜・髯｢繝・・繧ｿ谺關ｽ・・| Admission_Date 譚｡莉ｶ繧呈ｺ縺溘☆謔｣閠・′螻・ｉ縺壽悴逹謇九ょ・髯｢繝・・繧ｿ縺梧純縺・ｬ｡隨ｬ縺ｫ蜀肴ｸｬ縺励√◎繧後∪縺ｧ縺ｯ谺關ｽ迥ｶ豕√ｒ繝ｭ繧ｰ縺ｸ霑ｽ險倥☆繧九・|
| 48 | `/api01rv2/contraindicationcheckv2` | RUN 譛ｪ螳滓命・郁脈蜑､螻･豁ｴ繝・・繧ｿ谺關ｽ・・| `Check_Term` / `Medication_Information[]` 縺ｮ XML 縺ｯ貅門ｙ貂医∩縲り脈蜑､螻･豁ｴ縺悟叙蠕励〒縺阪◆繧ｿ繧､繝溘Φ繧ｰ縺ｧ螳溯｡後＠縲《eed 霑ｽ蜉縺ｯ陦後ｏ縺ｪ縺・・|
| 49 | `/api01rv2/insuranceinf1v2` | RUN 譛ｪ螳滓命・亥・譛溘く繝｣繝・す繝･譛ｪ蜿門ｾ暦ｼ・| `Base_Date` 繧貞ｽ捺律縺ｧ 1 蝗槫叙蠕励＠縲～trial/insuranceinf1v2.*` 縺ｫ菫晏ｭ倥☆繧・TODO 繧・ﾂｧ4.4 縺ｫ霑ｽ蜉縲・|
| 50 | `/api01rv2/subjectiveslstv2` | RUN 譛ｪ螳滓命・育裸迥ｶ隧ｳ險・UI 譛ｪ螳夲ｼ・| Request_Number=01-03 縺ｮ莉墓ｧ俶紛逅・・螳御ｺ・ゅき繝ｫ繝・UI 螳溯｣・凾縺ｫ螳溯｡後・|
| 51 | `/api01rv2/patientlst8v2` | RUN 譛ｪ螳滓命・域立蟋薙ョ繝ｼ繧ｿ谺關ｽ・・| 譌ｧ蟋灘ｱ･豁ｴ繧呈戟縺､謔｣閠・′ WebORCA 譛ｬ逡ｪ縺ｫ蟄伜惠縺励↑縺・◆繧∽ｿ晉蕗縲ょｾｩ譌ｧ蠕後↓ `/api01rv2/patientlst8v2` 繧貞ｮ溯｡後＠縲√◎繧後∪縺ｧ縺ｯ谺關ｽ險倬鹸縺ｮ縺ｿ譖ｴ譁ｰ縺吶ｋ縲・|
| 52 | `/api01rv2/medicationgetv2` | RUN 譛ｪ螳滓命・・024-11 霑ｽ蜉 API・・| 險ｺ逋ゅさ繝ｼ繝画､懃ｴ｢縺ｮ蠢・・API縲ＡORCA_API_STATUS.md` ﾂｧ2.4 蜿ら・縲ＡORCA_CONNECTIVITY_VALIDATION.md` 縺ｫ謇矩・ｒ霑ｽ蜉貂医∩縲・|
| 53 | `/orca06/patientmemomodv2` | `HTTP 405 (Allow: GET)` | RUN_ID=`20251113T002806Z`縲Ｎemo CRUD 縺ｯ ORCA route 蠕ｩ譌ｧ蠕・■縲Ａnotes` ﾂｧ3.3縲・|

## 6. 繝ｭ繧ｰ縺翫ｈ縺ｳ Evidence 繝ｫ繝ｼ繝ｫ

1. **CLI 蜃ｺ蜉・*: `curl`, `openssl s_client`, `ServerInfoResource`, `node scripts/tools/orca-curl-snippets.js` 縺ｮ繝ｭ繧ｰ縺ｯ縺吶∋縺ｦ `artifacts/orca-connectivity/<UTC>/` 縺ｫ菫晏ｭ倥ゅヵ繧｡繧､繝ｫ蜷堺ｾ・ `01_tls_handshake.log`, `02_acceptlstv2_request.http`, `02_acceptlstv2_response.http`縲・2. **繝・Φ繝励Ξ Evidence**: `artifacts/orca-connectivity/TEMPLATE/` 繧偵さ繝斐・縺励◆逶ｴ蠕後↓ `README.md` 縺ｸ `RUN_ID`, `UTC`, 菴ｿ逕ｨ縺励◆ Basic 隱崎ｨｼ・・trial/weborcatrial`・峨→ CRUD 螳滓命譛臥┌繧定ｿｽ險倥☆繧九・3. **繝峨く繝･繝｡繝ｳ繝医Μ繝ｳ繧ｯ**: `docs/server-modernization/phase2/PHASE2_PROGRESS.md` 縺ｮ蠖捺律谺・→譛ｬ Runbook 縺ｮ隧ｲ蠖薙そ繧ｯ繧ｷ繝ｧ繝ｳ繧貞曙譁ｹ蜷代Μ繝ｳ繧ｯ縺ｫ縺吶ｋ縲・4. **騾夂衍**: 螟ｱ謨玲凾縺ｯ Slack `#server-modernized-alerts` 竊・PagerDuty 竊・Backend Lead 縺ｮ鬆・↓騾｣邨｡縲・5. **Archive**: 30 譌･莉･荳雁盾辣ｧ縺励↑縺・Ο繧ｰ縺ｯ `docs/archive/<YYYYQn>/orcaconnect/` 縺ｸ遘ｻ縺励∝・繝輔ぃ繧､繝ｫ縺ｫ縺ｯ繧ｹ繧ｿ繝悶→遘ｻ蜍募・繝ｪ繝ｳ繧ｯ繧呈ｮ九☆縲・6. **蜻ｽ蜷阪Ν繝ｼ繝ｫ**: Evidence 繝・ぅ繝ｬ繧ｯ繝医Μ縺ｯ UTC 繧ｿ繧､繝繧ｹ繧ｿ繝ｳ繝暦ｼ・YYYYMMDDThhmmssZ`・峨ｒ逕ｨ縺・ｋ縲ょ多蜷阪メ繧ｧ繝・け縺ｯ `node scripts/tools/orca-artifacts-namer.js` 縺ｧ陦後＞縲・ 莉･螟悶・邨ゆｺ・さ繝ｼ繝峨・蜀榊ｮ溯｡檎ｦ∵ｭ｢縲・7. **遘伜諺諠・ｱ縺ｮ繝槭せ繧ｭ繝ｳ繧ｰ**: `request.http` 縺ｫ雉・ｼ諠・ｱ繧貞性繧√↑縺・Ｄurl 繧ｳ繝槭Φ繝峨・ `--user <MASKED>` 蠖｢蠑上〒菫晉ｮ｡縺励∝ｮ溯｡梧凾縺ｮ縺ｿ `env` 縺九ｉ螻暮幕縺吶ｋ縲・
## 7. WebORCA 繝医Λ繧､繧｢繝ｫ驕狗畑繝｡繝｢

1. **蛻ｩ逕ｨ遽・峇**: `https://weborca-trial.orca.med.or.jp/` 縺ｮ縺ｿ繧呈磁邯壼・縺ｨ縺励，RUD 繧貞ｮ滓命縺励◆蝣ｴ蜷医・蠢・★ `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` 縺ｨ `artifacts/.../data-check/` 縺ｫ謫堺ｽ懷・螳ｹ繝ｻ蟇ｾ雎｡ ID繝ｻ謌ｻ縺玲怏辟｡繧定ｨ倬鹸縺吶ｋ縲・2. **雉・ｼ諠・ｱ縺ｮ謇ｱ縺・*: Basic 隱崎ｨｼ縺ｯ蜈ｬ髢九い繧ｫ繧ｦ繝ｳ繝・`trial/weborcatrial` 繧剃ｽｿ逕ｨ縺吶ｋ縲ょｱ･豁ｴ繧・Evidence 縺ｫ縺ｯ `<MASKED>` 陦ｨ險倥ｒ逕ｨ縺・～curl -u "trial:weborcatrial"` 縺ｮ縺ｾ縺ｾ菫晏ｭ倥＠縺ｪ縺・・3. **繝・Φ繝励Ξ譖ｴ譁ｰ**: `docs/web-client/planning/phase2/DOC_STATUS.md` 縺ｫ繝医Λ繧､繧｢繝ｫ譁ｹ驥昴∈蛻・ｊ譖ｿ縺医◆譌ｨ縺ｨ險ｼ霍｡繝代せ繧定ｨ倩ｼ峨＠縲～docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md` 縺ｮ RUN_ID 陦ｨ繧呈怙譁ｰ蛹悶☆繧九・4. **螳牙・繧ｬ繝ｼ繝・*: 繝ｭ繝ｼ繧ｫ繝ｫ WebORCA 繧ｳ繝ｳ繝・リ縺ｮ蜀肴ｧ狗ｯ峨ｄ `ORCAcertification/` 驟堺ｸ九・ PKCS#12 縺ｯ繧｢繝ｼ繧ｫ繧､繝匁桶縺・→縺吶ｋ縲ょｿ・ｦ√↑雉・侭縺ｯ `assets/orca-trialsite/raw/trialsite.md` 縺九ｉ霎ｿ繧翫∝茜逕ｨ荳榊庄讖溯・繧貞盾辣ｧ縺励※菴懈･ｭ遽・峇繧呈ｱｺ繧√ｋ縲・5. **蝣ｱ蜻・*: Blocker 繧・CRUD 螟ｱ謨玲凾縺ｯ Slack `#server-modernized-alerts` 竊・PagerDuty 竊・Backend Lead 縺ｮ鬆・〒蜈ｱ譛峨＠縲ヽunbook ﾂｧ4.6 縺ｮ豬√ｌ縺ｧ繝ｭ繧ｰ縺ｸ `縲宣｣邨｡縲疏 繝悶Ο繝・け繧定ｿｽ蜉縺吶ｋ縲・
---

- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` 繝輔ぉ繝ｼ繧ｺ 4・・RCA 繧ｻ繧ｯ繧ｷ繝ｧ繝ｳ・峨→ `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md#weborca-trial` 縺ｫ譛ｬ繧ｿ繧ｹ繧ｯ繝ｪ繧ｹ繝医・隕∫ｴ・ｒ蜿肴丐縺吶ｋ縺薙→縲・- 譌ｧ WebORCA 繧ｳ繝ｳ繝・リ謇矩・ｄ譛ｬ逡ｪ繝帙せ繝亥髄縺第焔鬆・・縺吶∋縺ｦ繧｢繝ｼ繧ｫ繧､繝匁ｸ医∩縲ょｿ・ｦ√↓蠢懊§縺ｦ `docs/archive/2025Q4/` 縺ｮ螻･豁ｴ縺ｮ縺ｿ蜿ら・縺吶ｋ縲・
