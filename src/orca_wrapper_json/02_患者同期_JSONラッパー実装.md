# 02 患者同期 JSONラッパー実装

## 対象API
- `/orca/patients/id-list`
- `/orca/patients/batch`
- `/orca/patients/name-search`
- `/orca/insurance/combinations`
- `/orca/patients/former-names`

## 参照経路（Resource / Service / Transport / Stub）
- `/orca/patients/id-list`
  - Resource: `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaPatientBatchResource.java`
  - Service: `OrcaWrapperService#getPatientIdList`
  - Transport: `OrcaEndpoint.PATIENT_ID_LIST` (`/api01rv2/patientlst1v2`)
  - Stub: `server-modernized/src/main/resources/orca/stub/08_patientlst1v2_response.sample.xml`
- `/orca/patients/batch`
  - Resource: `OrcaPatientBatchResource.java`
  - Service: `OrcaWrapperService#getPatientBatch`
  - Transport: `OrcaEndpoint.PATIENT_BATCH` (`/api01rv2/patientlst2v2`)
  - Stub: `server-modernized/src/main/resources/orca/stub/09_patientlst2v2_response.sample.xml`
- `/orca/patients/name-search`
  - Resource: `OrcaPatientBatchResource.java`
  - Service: `OrcaWrapperService#searchPatients`
  - Transport: `OrcaEndpoint.PATIENT_NAME_SEARCH` (`/api01rv2/patientlst3v2`)
  - Stub: `server-modernized/src/main/resources/orca/stub/10_patientlst3v2_response.sample.xml`
- `/orca/insurance/combinations`
  - Resource: `OrcaPatientBatchResource.java`
  - Service: `OrcaWrapperService#getInsuranceCombinations`
  - Transport: `OrcaEndpoint.INSURANCE_COMBINATION` (`/api01rv2/patientlst6v2`)
  - Stub: `server-modernized/src/main/resources/orca/stub/35_patientlst6v2_response.sample.xml`
- `/orca/patients/former-names`
  - Resource: `OrcaPatientBatchResource.java`
  - Service: `OrcaWrapperService#getFormerNames`
  - Transport: `OrcaEndpoint.FORMER_NAME_HISTORY` (`/api01rv2/patientlst8v2`)
  - Stub: `server-modernized/src/main/resources/orca/stub/51_patientlst8v2_response.sample.xml`

## stub切替の明示方法
- `OrcaWrapperService` は stub 利用時に `blockerTag=TrialLocalOnly` を付与。
- `OrcaApiResponse.dataSource` が `stub|real` を返す（wrapper JSON の共通メタ）。
- 監査ログ詳細（`AbstractOrcaWrapperResource`）に `orcaMode=stub|real` を記録。

