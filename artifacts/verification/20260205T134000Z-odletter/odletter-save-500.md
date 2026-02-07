# /odletter/letter 保存 500 (2026-02-05)

- facilityId: 1.3.6.1.4.1.9414.72.103
- userId: doctor1 (role=doctor)
- patientId: 00005
- karteId: 9079
- runId: 20260205T134000Z-odletter
- traceId: b35d3d14-7a39-4a7b-b44a-38d1ab730795
- baseUrl: http://127.0.0.1:5173 (Vite dev proxy -> http://127.0.0.1:9080/openDolphin/resources)

## Request

PUT /odletter/letter

```json
{"linkId":0,"confirmed":"2026-02-04T15:00:00.000Z","started":"2026-02-04T15:00:00.000Z","recorded":"2026-02-04T15:00:00.000Z","status":"F","title":"テスト病院","letterType":"client","handleClass":"open.dolphin.letter.LetterViewer","consultantHospital":"テスト病院","consultantDept":"内科","consultantDoctor":"山田太郎","patientId":"00005","userModel":{"id":5,"userId":"1.3.6.1.4.1.9414.72.103:doctor1"},"karteBean":{"id":9079},"letterItems":[{"name":"webTemplateId","value":"REF-ODT-STD"},{"name":"webTemplateLabel","value":"紹介状（標準）"},{"name":"purpose","value":"精査依頼"},{"name":"disease","value":"高血圧症"}],"letterTexts":[{"name":"clinicalCourse","textValue":"紹介内容テスト"}]}
```

## Response

HTTP 500

```json
{"error":"internal_server_error","code":"internal_server_error","message":"Session layer failure in open.dolphin.rest.LetterResource$Proxy$_$$_WeldSubclass#putLetter","status":500,"traceId":"b35d3d14-7a39-4a7b-b44a-38d1ab730795","path":"/openDolphin/resources/odletter/letter","retryable":true}
```

## Server log (抜粋)

- SessionOperationInterceptor: Session layer failure in LetterResource#putLetter
- REST exception mapped to HTTP 500

```text
... Session operation failed [traceId=b35d3d14-7a39-4a7b-b44a-38d1ab730795, operation=open.dolphin.rest.LetterResource$Proxy$_$$_WeldSubclass#putLetter]: open.dolphin.session.framework.SessionServiceException: Session layer failure in open.dolphin.rest.LetterResource$Proxy$_$$_WeldSubclass#putLetter
```
