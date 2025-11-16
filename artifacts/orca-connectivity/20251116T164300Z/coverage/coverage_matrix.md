# ORCA API Coverage (RUN_ID=20251116T164300Z)

- firecrawl 仕様 (raw/*.md) を一覧化。
- trialsite Snapshot (2025-11-19) を参照し Blocker を特定。
- Evidence: artifacts/orca-connectivity/20251116T164300Z

| Spec | Trial Availability | Notes |
| --- | --- | --- |
| acceptancelst | Trial提供(再実測) | HTTP 200 / Api_Result=13 (ドクター不足)。証跡: artifacts/orca-connectivity/20251116T164300Z/crud/acceptlstv2/response_2025-11-16T02-05-26Z.xml |
| acceptmod | 仕様実装済／Trial不可(HTTP405) | Allow=OPTIONS,GET のみ。証跡: artifacts/orca-connectivity/20251116T164300Z/crud/acceptmodv2/headers_2025-11-16T02-05-26Z.txt / trialsite#limit 管理業務制限。 |
| acsimulate | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| appointlst | Trial提供(再実測) | HTTP 200 / Api_Result=12 (ドクター不足)。証跡: artifacts/orca-connectivity/20251116T164300Z/crud/appointlstv2/response_2025-11-16T02-05-26Z.xml |
| appointlst2 | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| appointmod | 仕様実装済／Trial不可(HTTP405) | Allow=OPTIONS,GET のみ。証跡: artifacts/orca-connectivity/20251116T164300Z/crud/appointmodv2/headers_2025-11-16T02-05-26Z.txt / trialsite#limit 管理業務制限。 |
| childbirth | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| contraindication_check | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| disease | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| diseasemod | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| diseasemod2 | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| first_calculation_date | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hosp_kaikeiinfo | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hosp_kaikeimod | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospadlentry | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospadlinfo | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospbase | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospcancel | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospentry | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospentry_correct | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospentryfix | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospfind | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospfood | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospgaihaku | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospido | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hosppatientinfo | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospsagaku | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hospshokuji | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| hsacsimulate | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| index | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| insurance_list | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| insurancecombi | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| insuranceinfo | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| kyuseirireki | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| master_last_update | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| medicalinfo | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| medicalmod | Trial提供(再実測) | HTTP 200 / Api_Result=10 (患者種別不足)。証跡: artifacts/orca-connectivity/20251116T164300Z/crud/medicalmodv2/response_2025-11-16T02-05-26Z.xml |
| medicaltemp | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| medicationgetv2 | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| medicatonmod | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| overview | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| patient_memo_list | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| patientget | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| patientidlist | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| patientlist | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| patientmemomodv2 | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| patientmod | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| patientshimei | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| pusheventget | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| report_print | 仕様実装済／Trial不可 | trialsite#limit §4「帳票印刷関連」不許可。 |
| setcode | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| shunou | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| subjectives | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| subjectiveslst | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| system_daily | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| systemkanri | 仕様実装済／Trial不可 | trialsite#limit §1「システム管理マスタ登録」不許可。 |
| systemstate | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| userkanri | 仕様実装済／Trial不可 | trialsite#limit §1「一部の管理業務を除き自由」より管理系 API を Blocker 扱い。 |
| visitpatient | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
| wardinfo | Trial提供(未実測) | trialsite#limit に記載された禁止事項に該当せず。今後 CRUD 実測予定。 |
