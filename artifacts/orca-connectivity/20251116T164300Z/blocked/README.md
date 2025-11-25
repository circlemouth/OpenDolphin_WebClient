# Trial Non-Provided APIs (RUN_ID=20251116T164300Z)

## HTTP 405 / Allow=GET のみ
| API | 事象 | HTTP/Evidence | trialsite 根拠 |
| --- | --- | --- | --- |
| `/orca11/acceptmodv2?class=01` | `curl -vv --data-binary @acceptmod_trial.xml` が `405 Method Not Allowed`。POST が無効化され CRUD を実施できない。 | `crud/acceptmodv2/headers_2025-11-16T02-05-26Z.txt` （Allow=OPTIONS, GET） | `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等`「システム管理マスタ登録は使用できません」→管理操作は Blocker 扱い。 |
| `/orca14/appointmodv2?class=01` | `curl -vv --data-binary @appointmod_trial.xml` が `405 Method Not Allowed`。予約書込み API も POST 拒否。 | `crud/appointmodv2/headers_2025-11-16T02-05-26Z.txt` （Allow=OPTIONS, GET） | 同上。「一部の管理業務を除き自由にお使いいただけます」注記に該当。 |

## 機能提供外（trialsite #limit）
| API | 理由 | trialsite 引用 |
| --- | --- | --- |
| `/orca51/report_print*` (`report_print.md`) | 帳票印刷機能は Trial で提供されず、プリンタ出力不可。 | `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等` §4。 |
| `/api01rv2/systemkanri*` (`systemkanri.md`) | システム管理マスタ登録は禁止。 | 同上 §1。 |
| `/api01rv2/userkanri*` (`userkanri.md`) | 管理系ユーザー操作は Trial で無効。 | 同上 §1。 |

## データギャップ（seed 未整備）
| API | 事象 | 追加調査 |
| --- | --- | --- |
| `/api01rv2/acceptlstv2`, `/api01rv2/appointlstv2`, `/api/api21/medicalmodv2` | HTTP 200 だが `Api_Result=13/12/10` でドクター／患者 seed 不足。`Physician_Code=0001` と `Patient_ID=00000001` が Trial API から参照できない。 | GUI 端末で 01 医事業務→職員コード/患者登録を再投入。`trialsite` に記載された seed（doctor1/patient 00000001）との整合確認が必要。 Evidence: `crud/{acceptlstv2,appointlstv2,medicalmodv2}/response_2025-11-16T02-05-26Z.xml`。 |
