# 旧サーバー REST API 一覧

以下の表は既存サーバー (`server/`) が公開する REST エンドポイントをリソース別に整理したものです。各行は HTTP メソッド・URL パス・Java 実装メソッドを示します。

エンドポイントの網羅的なマニフェストは `docs/server-modernization/server-api-inventory.yaml` に OpenAPI 形式で整理しています。テスト用のエンドポイント羅列は従来どおり `server-modernized/tools/api-smoke-test/api_inventory.yaml` に残してあります。

## AdmissionResource

- ベースパス: `/20/adm`
- 実装ファイル: `open/dolphin/adm20/rest/AdmissionResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| DELETE | `/20/adm/carePlan` | `deleteCarePlan` |
| POST | `/20/adm/carePlan` | `postCarePlan` |
| PUT | `/20/adm/carePlan` | `putCarePlan` |
| GET | `/20/adm/carePlan/{param}` | `getCarePlans` |
| GET | `/20/adm/docid/{param}` | `getDocIdList` |
| GET | `/20/adm/document/{param}` | `getDocument` |
| DELETE | `/20/adm/factor2/auth/{param}` | `resetFactor2Auth` |
| PUT | `/20/adm/factor2/code` | `getFactor2Code` |
| PUT | `/20/adm/factor2/device` | `putFactor2Device` |
| GET | `/20/adm/lastDateCount/{param}` | `getLastDateCount` |
| DELETE | `/20/adm/nurseProgressCourse` | `deleteNurseProgressCourse` |
| POST | `/20/adm/nurseProgressCourse` | `postNurseProgressCourse` |
| PUT | `/20/adm/nurseProgressCourse` | `updateNurseProgressCourse` |
| GET | `/20/adm/nurseProgressCourse/{param}` | `getNurseProgressCourse` |
| DELETE | `/20/adm/ondoban` | `deleteOndoban` |
| POST | `/20/adm/ondoban` | `postOndoban` |
| PUT | `/20/adm/ondoban` | `updateOndoban` |
| GET | `/20/adm/ondoban/{param}` | `getOndoban` |
| POST | `/20/adm/sendPackage` | `postSendPackage` |
| PUT | `/20/adm/sms/message` | `sendSMSMessage` |
| PUT | `/20/adm/user/factor2/backup` | `getUserWithF2Backup` |
| PUT | `/20/adm/user/factor2/device` | `getUserWithNewFactor2Device` |

## AppoResource

- ベースパス: `/appo`
- 実装ファイル: `open/dolphin/rest/AppoResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| PUT | `/appo` | `putXml` |

## ChartEventResource

- ベースパス: `/chartEvent`
- 実装ファイル: `open/dolphin/rest/ChartEventResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/chartEvent/dispatch` | `deliverChartEvent` |
| PUT | `/chartEvent/event` | `putChartEvent` |
| GET | `/chartEvent/subscribe` | `subscribe` |

## DemoResource

- ベースパス: `/demo`
- 実装ファイル: `open/dolphin/touch/DemoResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/demo/document/progressCourse/{param}` | `getProgressCource` |
| GET | `/demo/item/laboItem/{param}` | `getLaboGraph` |
| GET | `/demo/module/diagnosis/{param}` | `getDiagnosis` |
| GET | `/demo/module/laboTest/{param}` | `getLaboTest` |
| GET | `/demo/module/rp/{param}` | `getRp` |
| GET | `/demo/module/schema/{param}` | `getSchema` |
| GET | `/demo/module/{param}` | `getModule` |
| GET | `/demo/patient/firstVisitors/{param}` | `getFirstVisitors` |
| GET | `/demo/patient/visit/{param}` | `getPatientVisit` |
| GET | `/demo/patient/visitLast/{param}` | `getPatientVisitLast` |
| GET | `/demo/patient/visitRange/{param}` | `getPatientVisitRange` |
| GET | `/demo/patient/{pk}` | `getPatientById` |
| GET | `/demo/patientPackage/{pk}` | `getPatientPackage` |
| GET | `/demo/patients/name/{param}` | `getPatientsByName` |
| GET | `/demo/user/{param}` | `getUser` |

## DemoResourceASP

- ベースパス: `/demo`
- 実装ファイル: `open/dolphin/touch/DemoResourceASP.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/demo/document/progressCourse/{param}` | `getProgressCource` |
| GET | `/demo/item/laboItem/{param}` | `getLaboGraph` |
| GET | `/demo/module/diagnosis/{param}` | `getDiagnosis` |
| GET | `/demo/module/laboTest/{param}` | `getLaboTest` |
| GET | `/demo/module/rp/{param}` | `getRp` |
| GET | `/demo/module/schema/{param}` | `getSchema` |
| GET | `/demo/module/{param}` | `getModule` |
| GET | `/demo/patient/firstVisitors/{param}` | `getFirstVisitors` |
| GET | `/demo/patient/visit/{param}` | `getPatientVisit` |
| GET | `/demo/patient/visitLast/{param}` | `getPatientVisitLast` |
| GET | `/demo/patient/visitRange/{param}` | `getPatientVisitRange` |
| GET | `/demo/patient/{pk}` | `getPatientById` |
| GET | `/demo/patientPackage/{pk}` | `getPatientPackage` |
| GET | `/demo/patients/name/{param}` | `getPatientsByName` |
| GET | `/demo/user/{param}` | `getUser` |

## DolphinResource

- ベースパス: `/touch`
- 実装ファイル: `open/dolphin/touch/DolphinResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/touch/document/progressCourse/{param}` | `getProgressCource` |
| POST | `/touch/idocument` | `postDocument` |
| POST | `/touch/idocument2` | `postDocument2` |
| GET | `/touch/item/laboItem/{param}` | `getLaboGraph` |
| GET | `/touch/module/diagnosis/{param}` | `getDiagnosis` |
| GET | `/touch/module/laboTest/{param}` | `getLaboTest` |
| GET | `/touch/module/rp/{param}` | `getRp` |
| GET | `/touch/module/schema/{param}` | `getSchema` |
| GET | `/touch/module/{param}` | `getModule` |
| GET | `/touch/patient/firstVisitors/{param}` | `getFirstVisitors` |
| GET | `/touch/patient/visit/{param}` | `getPatientVisit` |
| GET | `/touch/patient/visitLast/{param}` | `getPatientVisitLast` |
| GET | `/touch/patient/visitRange/{param}` | `getPatientVisitRange` |
| GET | `/touch/patient/{pk}` | `getPatientById` |
| GET | `/touch/patientPackage/{pk}` | `getPatientPackage` |
| GET | `/touch/patients/name/{param}` | `getPatientsByName` |
| GET | `/touch/stamp/{param}` | `getStamp` |
| GET | `/touch/stampTree/{param}` | `getStampTree` |
| GET | `/touch/user/{param}` | `getUser` |

## DolphinResourceASP

- ベースパス: `/touch`
- 実装ファイル: `open/dolphin/touch/DolphinResourceASP.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/touch/document/progressCourse/{param}` | `getProgressCource` |
| POST | `/touch/idocument` | `postDocument` |
| POST | `/touch/idocument2` | `postDocument2` |
| GET | `/touch/item/laboItem/{param}` | `getLaboGraph` |
| GET | `/touch/module/diagnosis/{param}` | `getDiagnosis` |
| GET | `/touch/module/laboTest/{param}` | `getLaboTest` |
| GET | `/touch/module/rp/{param}` | `getRp` |
| GET | `/touch/module/schema/{param}` | `getSchema` |
| GET | `/touch/module/{param}` | `getModule` |
| GET | `/touch/patient/firstVisitors/{param}` | `getFirstVisitors` |
| GET | `/touch/patient/visit/{param}` | `getPatientVisit` |
| GET | `/touch/patient/visitLast/{param}` | `getPatientVisitLast` |
| GET | `/touch/patient/visitRange/{param}` | `getPatientVisitRange` |
| GET | `/touch/patient/{pk}` | `getPatientById` |
| GET | `/touch/patientPackage/{pk}` | `getPatientPackage` |
| GET | `/touch/patients/name/{param}` | `getPatientsByName` |
| GET | `/touch/stamp/{param}` | `getStamp` |
| GET | `/touch/stampTree/{param}` | `getStampTree` |
| GET | `/touch/user/{param}` | `getUser` |

## EHTResource

- ベースパス: `/20/adm/eht`
- 実装ファイル: `open/dolphin/adm20/rest/EHTResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| DELETE | `/10/eht/allergy` | `deleteAllergies` |
| POST | `/10/eht/allergy` | `postAllergies` |
| PUT | `/10/eht/allergy` | `putAllergies` |
| GET | `/10/eht/allergy/{param}` | `getAllergies` |
| GET | `/10/eht/attachment/{param}` | `getAttachment` |
| GET | `/10/eht/claim/conn` | `getClaimConn` |
| DELETE | `/10/eht/diagnosis` | `deleteDicease` |
| POST | `/10/eht/diagnosis` | `postDicease` |
| PUT | `/10/eht/diagnosis` | `putDicease` |
| GET | `/10/eht/diagnosis/{param}` | `getDiagnosis` |
| GET | `/10/eht/docinfo/{param}` | `getFastDocInfoList` |
| DELETE | `/10/eht/document` | `deleteDocument` |
| GET | `/10/eht/document/{param}` | `getDocument` |
| GET | `/10/eht/document2/{param}` | `getDocument2` |
| GET | `/10/eht/freedocument/{param}` | `getPatientFreeDocument` |
| PUT | `/10/eht/interaction` | `checkInteraction` |
| GET | `/10/eht/item/laboItem/{param}` | `getLaboGraph` |
| GET | `/10/eht/karteNumber/{param}` | `getEHTKarte` |
| GET | `/10/eht/lastDateCount/{param}` | `getLastDateCount` |
| DELETE | `/10/eht/memo` | `deletePatientMemo` |
| POST | `/10/eht/memo` | `postPatientMemo` |
| PUT | `/10/eht/memo` | `putPatientMemo` |
| GET | `/10/eht/memo/{param}` | `getPatientMemo` |
| GET | `/10/eht/module/laboTest/{param}` | `getLaboTest` |
| GET | `/10/eht/module/last/{param}` | `getLastModule` |
| GET | `/10/eht/module/{param}` | `getModule` |
| GET | `/10/eht/order/{param}` | `collectModules` |
| GET | `/10/eht/patient/documents/status` | `getPatientsByTmpKarte` |
| GET | `/10/eht/patient/firstVisitors/{param}` | `getFirstVisitors` |
| GET | `/10/eht/patient/pvt/{param}` | `getPatientsByPvt` |
| POST | `/10/eht/physical` | `postPhysical` |
| DELETE | `/10/eht/physical/id/{param}` | `removePhysical` |
| GET | `/10/eht/physical/karteid/{param}` | `getKartePhysical` |
| GET | `/10/eht/pvtList` | `getPvtList` |
| PUT | `/10/eht/sendClaim` | `sendPackage` |
| PUT | `/10/eht/sendClaim2` | `sendPackage2` |
| GET | `/10/eht/serverinfo` | `getServerInfo` |
| GET | `/10/eht/stamp/{param}` | `getStamp` |
| GET | `/10/eht/stampTree/{param}` | `getStampTree` |
| POST | `/10/eht/vital` | `postVital` |
| DELETE | `/10/eht/vital/id/{param}` | `removeVital` |
| GET | `/10/eht/vital/pat/{param}` | `getPatVital` |
| DELETE | `/20/adm/eht/allergy` | `deleteAllergies` |
| POST | `/20/adm/eht/allergy` | `postAllergies` |
| PUT | `/20/adm/eht/allergy` | `putAllergies` |
| GET | `/20/adm/eht/allergy/{param}` | `getAllergies` |
| GET | `/20/adm/eht/claim/conn` | `getClaimConn` |
| DELETE | `/20/adm/eht/diagnosis` | `deleteDicease` |
| POST | `/20/adm/eht/diagnosis` | `postDicease` |
| PUT | `/20/adm/eht/diagnosis` | `putDicease` |
| GET | `/20/adm/eht/diagnosis/{param}` | `getDiagnosis` |
| DELETE | `/20/adm/eht/document` | `deleteDocument` |
| GET | `/20/adm/eht/document/{param}` | `getDocument` |
| PUT | `/20/adm/eht/interaction` | `checkInteraction` |
| GET | `/20/adm/eht/item/laboItem/{param}` | `getLaboGraph` |
| GET | `/20/adm/eht/karteNumber/{param}` | `getEHTKarte` |
| DELETE | `/20/adm/eht/memo` | `deletePatientMemo` |
| POST | `/20/adm/eht/memo` | `postPatientMemo` |
| PUT | `/20/adm/eht/memo` | `putPatientMemo` |
| GET | `/20/adm/eht/memo/{param}` | `getPatientMemo` |
| GET | `/20/adm/eht/module/laboTest/{param}` | `getLaboTest` |
| GET | `/20/adm/eht/order/{param}` | `collectModules` |
| GET | `/20/adm/eht/patient/firstVisitors/{param}` | `getFirstVisitors` |
| GET | `/20/adm/eht/progresscourse/{param}` | `getProgresscourse` |
| GET | `/20/adm/eht/pvtList` | `getPvtList` |
| GET | `/20/adm/eht/serverinfo` | `getServerInfo` |
| GET | `/20/adm/eht/stamp/{param}` | `getStamp` |
| GET | `/20/adm/eht/stampTree/{param}` | `getStampTree` |

## JsonTouchResource

- ベースパス: `/10/adm/jtouch`
- 実装ファイル: `open/dolphin/adm10/rest/JsonTouchResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| PUT | `/10/adm/jtouch/interaction` | `checkInteraction` |
| GET | `/10/adm/jtouch/order/{param}` | `collectModules` |
| GET | `/10/adm/jtouch/patients/name/{param}` | `getPatientsByNameOrId` |
| POST | `/10/adm/jtouch/sendPackage` | `postSendPackage` |
| GET | `/10/adm/jtouch/stamp/{param}` | `getStamp` |
| GET | `/10/adm/jtouch/stampTree/{param}` | `getStampTree` |
| GET | `/10/adm/jtouch/user/{uid}` | `getUserById` |
| GET | `/10/adm/jtouch/visitpackage/{param}` | `getVisitPackage` |
| GET | `/20/adm/jtouch/patients/name/{param}` | `getPatientsByNameOrId` |
| POST | `/20/adm/jtouch/sendPackage` | `postSendPackage` |
| POST | `/20/adm/jtouch/sendPackage2` | `postSendPackage2` |
| GET | `/20/adm/jtouch/user/{uid}` | `getUserById` |
| GET | `/20/adm/jtouch/visitpackage/{param}` | `getVisitPackage` |
| POST | `/jtouch/document` | `postDocument` |
| POST | `/jtouch/document2` | `postDocument2` |
| POST | `/jtouch/mkdocument` | `postMkDocument` |
| POST | `/jtouch/mkdocument2` | `postMkDocument2` |
| GET | `/jtouch/patient/{pid}` | `getPatientById` |
| GET | `/jtouch/patients/count` | `getPatientCount` |
| GET | `/jtouch/patients/dump/kana/{param}` | `getPatientsWithKana` |
| GET | `/jtouch/patients/name/{param}` | `getPatientsByNameOrId` |
| POST | `/jtouch/sendPackage` | `postSendPackage` |
| POST | `/jtouch/sendPackage2` | `postSendPackage2` |
| GET | `/jtouch/user/{uid}` | `getUserById` |
| GET | `/jtouch/visitpackage/{param}` | `getVisitPackage` |

## KarteResource

- ベースパス: `/karte`
- 実装ファイル: `open/dolphin/rest/KarteResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/karte/appo/{param}` | `getAppoinmentList` |
| GET | `/karte/attachment/{param}` | `getAttachment` |
| PUT | `/karte/claim` | `sendDocument` |
| POST | `/karte/diagnosis` | `postDiagnosis` |
| PUT | `/karte/diagnosis` | `putDiagnosis` |
| POST | `/karte/diagnosis/claim` | `postPutSendDiagnosis` |
| DELETE | `/karte/diagnosis/{param}` | `deleteDiagnosis` |
| GET | `/karte/diagnosis/{param}` | `getDiagnosis` |
| GET | `/karte/docinfo/all/{param}` | `getAllDocument` |
| GET | `/karte/docinfo/{param}` | `getDocumentList` |
| POST | `/karte/document` | `postDocument` |
| POST | `/karte/document/pvt/{params}` | `postDocument` |
| DELETE | `/karte/document/{id}` | `deleteDocument` |
| PUT | `/karte/document/{id}` | `putTitle` |
| GET | `/karte/documents/{param}` | `getDocuments` |
| PUT | `/karte/freedocument` | `putPatientFreeDocument` |
| GET | `/karte/freedocument/{param}` | `getFreeDocument` |
| GET | `/karte/iamges/{param}` | `getImages` |
| GET | `/karte/image/{id}` | `getImage` |
| PUT | `/karte/memo` | `putPatientMemo` |
| GET | `/karte/moduleSearch/{param}` | `getModulesEntitySearch` |
| GET | `/karte/modules/{param}` | `getModules` |
| POST | `/karte/observations` | `postObservations` |
| PUT | `/karte/observations` | `putObservations` |
| DELETE | `/karte/observations/{param}` | `deleteObservations` |
| GET | `/karte/observations/{param}` | `getObservations` |
| GET | `/karte/pid/{param}` | `getKarteByPid` |
| GET | `/karte/{param}` | `getKarte` |

## LetterResource

- ベースパス: `/odletter`
- 実装ファイル: `open/dolphin/rest/LetterResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| PUT | `/odletter/letter` | `putLetter` |
| DELETE | `/odletter/letter/{param}` | `delete` |
| GET | `/odletter/letter/{param}` | `getLetter` |
| GET | `/odletter/list/{param}` | `getLetterList` |

## MmlResource

- ベースパス: `/mml`
- 実装ファイル: `open/dolphin/rest/MmlResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/mml/disease/json/{param}` | `dumpDiseaseAsJSON` |
| GET | `/mml/disease/list/{param}` | `getDiseaseList` |
| GET | `/mml/document/{param}` | `dumpFacilityDocumentsAsMML` |
| GET | `/mml/karte/json/{param}` | `dumpKarteAsJSON` |
| GET | `/mml/karte/list/{param}` | `getKarteList` |
| GET | `/mml/labtest/json/{param}` | `dumpLabtestAsJSON` |
| GET | `/mml/labtest/list/{param}` | `getLabtestList` |
| GET | `/mml/letter/json/{param}` | `dumpLetterAsJSON` |
| GET | `/mml/letter/list/{param}` | `getLetterList` |
| GET | `/mml/memo/json/{param}` | `dumpMemoAsJSON` |
| GET | `/mml/memo/list/{param}` | `getMemoList` |
| GET | `/mml/observation/json/{param}` | `dumpObservationAsJSON` |
| GET | `/mml/observation/list/{param}` | `getObservationList` |
| GET | `/mml/patient/json/{param}` | `dumpPatientAsJSON` |
| GET | `/mml/patient/list/{param}` | `getPatientList` |
| GET | `/mml/patient/{param}` | `dumpFacilityPatientsDiagnosisAsMML` |

## NLabResource

- ベースパス: `/lab`
- 実装ファイル: `open/dolphin/rest/NLabResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/lab/item/{param}` | `getLaboTestItem` |
| POST | `/lab/module` | `postNLaboTest` |
| GET | `/lab/module/count/{param}` | `getLaboTestCount` |
| DELETE | `/lab/module/{param}` | `unsubscribeTrees` |
| GET | `/lab/module/{param}` | `getLaboTest` |
| GET | `/lab/patient/{param}` | `getConstrainedPatients` |

## OrcaResource

- ベースパス: `/orca`
- 実装ファイル: `open/orca/rest/OrcaResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/orca/deptinfo` | `getDeptInfo` |
| GET | `/orca/disease/active/{param}` | `getActiveOrcaDisease` |
| GET | `/orca/disease/import/{param}` | `getOrcaDisease` |
| GET | `/orca/disease/name/{param}/` | `getDiseaseByName` |
| GET | `/orca/facilitycode` | `getFacilityCodeBy1001` |
| GET | `/orca/general/{param}` | `getGeneralName` |
| GET | `/orca/inputset` | `getOrcaInputSet` |
| PUT | `/orca/interaction` | `checkInteraction` |
| GET | `/orca/stamp/{param}` | `getStamp` |
| GET | `/orca/tensu/code/{param}/` | `getTensuMasterByCode` |
| GET | `/orca/tensu/name/{param}/` | `getTensuMasterByName` |
| GET | `/orca/tensu/shinku/{param}/` | `getTensutensuByShinku` |
| GET | `/orca/tensu/ten/{param}/` | `getTensuMasterByTen` |

## PHRResource

- ベースパス: `/20/adm/phr`
- 実装ファイル: `open/dolphin/adm20/rest/PHRResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/20/adm/phr/abnormal/{param}` | `getAbnormalValue` |
| PUT | `/20/adm/phr/accessKey` | `putPHRKey` |
| GET | `/20/adm/phr/accessKey/{param}` | `getPHRKeyByAccessKey` |
| GET | `/20/adm/phr/allergy/{param}` | `getAllergy` |
| GET | `/20/adm/phr/disease/{param}` | `getDisease` |
| POST | `/20/adm/phr/identityToken` | `getIdentityToken` |
| GET | `/20/adm/phr/image/{param}` | `getImage` |
| GET | `/20/adm/phr/labtest/{param}` | `getLastLabTest` |
| GET | `/20/adm/phr/medication/{param}` | `getLastMedication` |
| GET | `/20/adm/phr/patient/{param}` | `getPHRKeyByPatientId` |
| GET | `/20/adm/phr/{param}` | `getPHRData` |

## PVTResource

- ベースパス: `/pvt`
- 実装ファイル: `open/dolphin/rest/PVTResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| POST | `/pvt` | `postPvt` |
| PUT | `/pvt/memo/{param}` | `putMemo` |
| GET | `/pvt/{param}` | `getPvt` |
| PUT | `/pvt/{param}` | `putPvtState` |
| DELETE | `/pvt/{pvtPK}` | `deletePvt` |

## PVTResource2

- ベースパス: `/pvt2`
- 実装ファイル: `open/dolphin/rest/PVTResource2.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| POST | `/pvt2` | `postPvt` |
| GET | `/pvt2/pvtList` | `getPvtList` |
| DELETE | `/pvt2/{pvtPK}` | `deletePvt` |

## PatientResource

- ベースパス: `/patient`
- 実装ファイル: `open/dolphin/rest/PatientResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| POST | `/patient` | `postPatient` |
| PUT | `/patient` | `putPatient` |
| GET | `/patient/all` | `getAllPatient` |
| GET | `/patient/count/{param}` | `getPatientCount` |
| GET | `/patient/custom/{param}` | `getDocumentsByCustom` |
| GET | `/patient/digit/{param}` | `getPatientsByDigit` |
| GET | `/patient/documents/status` | `getDocumentsByStatus` |
| GET | `/patient/id/{param}` | `getPatientById` |
| GET | `/patient/kana/{param}` | `getPatientsByKana` |
| GET | `/patient/name/{param}` | `getPatientsByName` |
| GET | `/patient/pvt/{param}` | `getPatientsByPvt` |

## ScheduleResource

- ベースパス: `/schedule`
- 実装ファイル: `open/dolphin/rest/ScheduleResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| POST | `/schedule/document` | `postScheduleAndSendClaim` |
| DELETE | `/schedule/pvt/{param}` | `deletePvt` |
| GET | `/schedule/pvt/{param}` | `getPvt` |

## ServerInfoResource

- ベースパス: `/serverinfo`
- 実装ファイル: `open/dolphin/rest/ServerInfoResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/serverinfo/claim/conn` | `getClaimConn` |
| GET | `/serverinfo/cloud/zero` | `getServerInfo` |
| GET | `/serverinfo/jamri` | `getJamri` |

## StampResource

- ベースパス: `/stamp`
- 実装ファイル: `open/dolphin/rest/StampResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| PUT | `/stamp/id` | `putStamp` |
| DELETE | `/stamp/id/{param}` | `deleteStamp` |
| GET | `/stamp/id/{param}` | `getStamp` |
| PUT | `/stamp/list` | `putStamps` |
| DELETE | `/stamp/list/{param}` | `deleteStamps` |
| GET | `/stamp/list/{param}` | `getStamps` |
| PUT | `/stamp/published/cancel` | `cancelPublishedTree` |
| GET | `/stamp/published/tree` | `getPublishedTrees` |
| PUT | `/stamp/published/tree` | `putPublishedTree` |
| PUT | `/stamp/subscribed/tree` | `subscribeTrees` |
| DELETE | `/stamp/subscribed/tree/{idPks}` | `unsubscribeTrees` |
| PUT | `/stamp/tree` | `putTree` |
| PUT | `/stamp/tree/forcesync` | `forceSyncTree` |
| PUT | `/stamp/tree/sync` | `syncTree` |
| GET | `/stamp/tree/{userPK}` | `getStampTree` |

## SystemResource

- ベースパス: `/dolphin`
- 実装ファイル: `open/dolphin/rest/SystemResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/dolphin` | `hellowDolphin` |
| POST | `/dolphin` | `addFacilityAdmin` |
| GET | `/dolphin/activity/{param}` | `getActivities` |
| GET | `/dolphin/cloudzero/sendmail` | `sendCloudZeroMail` |
| POST | `/dolphin/license` | `checkLicense` |

## UserResource

- ベースパス: `/user`
- 実装ファイル: `open/dolphin/rest/UserResource.java`

| HTTP | パス | Java メソッド |
| --- | --- | --- |
| GET | `/user` | `getAllUser` |
| POST | `/user` | `postUser` |
| PUT | `/user` | `putUser` |
| PUT | `/user/facility` | `putFacility` |
| GET | `/user/name/{userId}` | `getUserName` |
| DELETE | `/user/{userId}` | `deleteUser` |
| GET | `/user/{userId}` | `getUser` |

