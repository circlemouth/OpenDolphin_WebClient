# Trial Non-Provided APIs (RUN_ID=20251115TrialConnectivityCodexZ1)

## HTTP 405 / Allow=GET のみ
| API | 事象 | HTTP/Evidence | trialsite 根拠 |
| --- | --- | --- | --- |
| `/orca11/acceptmodv2?class=01` | `curl -vv --data-binary @acceptmod_trial.xml` が `405 Method Not Allowed` を返却。書込み API 未解放。 | `crud/acceptmodv2/headers_2025-11-15T13-49-41Z.txt` （Allow=OPTIONS, GET） | trialsite.md「お使いいただけない機能」§1: システム管理マスタ登録は使用できず、管理操作は制限されるため Blocker 扱い。 |
| `/orca14/appointmodv2?class=01` | `curl -vv --data-binary @appointmod_trial.xml` が `405 Method Not Allowed`。予約登録 API も POST 拒否。 | `crud/appointmodv2/headers_2025-11-15T13-49-41Z.txt` （Allow=OPTIONS, GET） | trialsite.md「一部の管理業務を除き自由にお使いいただけます」注記に該当。 |

## 機能提供外（trialsite #limit）
| API | 理由 | trialsite 引用 |
| --- | --- | --- |
| `/orca51/report_print*` (`report_print.md`) | 「帳票印刷関連についてはプリンタ出力できません」（trialsite#limit §4）。 | `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等` |
| `/api01rv2/systemkanri*` (`systemkanri.md`) | 「システム管理マスタ登録は使用できません」（trialsite#limit §1）。 | 同上 |
| `/api01rv2/userkanri*` (`userkanri.md`) | 同じく管理業務カテゴリとして trialsite が禁止。 | 同上 |

## データギャップ
| API | 事象 | 追加調査 |
| --- | --- | --- |
| `/api01rv2/acceptlstv2`, `/api01rv2/appointlstv2`, `/api/api21/medicalmodv2` | HTTP 200 だが `Api_Result=12/13/14` で「ドクターが存在しません」。Doctor seed (`Physician_Code=0001`) が API から参照できず、UI でのマスター確認が必要。 | GUI 端末確保後に 01 医事業務→職員コードを参照し、`trialsite` 記載（医師 0001 doctor1）との整合をとる。 |
