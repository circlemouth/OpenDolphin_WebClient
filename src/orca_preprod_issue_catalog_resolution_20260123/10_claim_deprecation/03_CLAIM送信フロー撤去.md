# 03 CLAIM送信フロー撤去

## RUN_ID
- 20260126T124443Z

## 目的
- CLAIM 送信/JMS/Socket 送信フローを完全撤去し、API-only 方針へ統一する。

## 対応内容

### 1) CLAIM 送信フロー（MML/CLAIM XML 生成）を撤去
- MML/CLAIM 生成・送信に関わる実装を削除し、/mml 送信エンドポイントを廃止。
- MML テンプレート（CLAIM モジュール生成）を削除。

**削除ファイル**
- `server-modernized/src/main/java/open/dolphin/rest/MmlResource.java`
- `server-modernized/src/main/java/open/dolphin/session/MmlSenderBean.java`
- `server-modernized/src/main/java/open/dolphin/session/MmlServiceBean.java`
- `server-modernized/src/main/java/open/dolphin/msg/MMLSender.java`
- `server-modernized/src/main/java/open/dolphin/msg/MMLHelper.java`
- `server-modernized/src/main/java/open/dolphin/msg/DiagnosisModuleItem.java`
- `server-modernized/src/main/java/open/dolphin/msg/PatientHelper.java`
- `server-modernized/src/main/java/open/dolphin/msg/dto/MmlDispatchResult.java`
- `server-modernized/src/main/resources/mml2.3Helper.vm`
- `server-modernized/src/test/java/open/dolphin/session/MmlSenderBeanSmokeTest.java`

### 2) CLAIM 送信関連テストの整理
- MML/CLAIM 送信系テストを削除し、残存テストは送信フロー依存を除去。

**更新ファイル**
- `server-modernized/src/test/java/open/dolphin/msg/MessagingDefensiveCopyTest.java`

### 3) JMS/Socket 送信フローの残存確認
- `MessagingGateway` / `ClaimSender` / `DiagnosisSender` は server-modernized に残存していないことを確認。

## 代替 API への誘導メモ（API-only）
- 病名/処方/オーダ送信: `/orca/disease` / `/orca/order/bundles` / `/orca/medical-sets`
- 外来請求データ取得（互換用途）: `/orca/medicalmodv2/outpatient` + `/orca/appointments/list` + 受付系 API
- 受付/会計状態通知: PushAPI（受信実装が未整備のため、別タスクで整備）

## 影響
- /mml 送信エンドポイントと MML/CLAIM 生成は利用不可。
- MML/CLAIM 送信の代替は API-only で実施する。

## 次アクション
- CLAIM 送信フラグ/DBカラム（sendClaim/claimDate）撤去は `03_CLAIM設定と環境変数の整理.md` 以降で段階対応。
- PVT CLAIM 解析の撤去/PushAPI 受信の整備は別タスクで検討。

## 成果物
- CLAIM 送信フローの実装削除
- API-only 代替導線メモ
