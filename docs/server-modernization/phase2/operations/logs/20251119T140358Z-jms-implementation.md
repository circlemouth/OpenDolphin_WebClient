# JMS/MDB 実装復旧ログ（RUN_ID=20251119T140358Z）

## 1. 概要
MSG-01 タスクとして、JMS (Java Message Service) および MDB (Message Driven Bean) による CLAIM/PVT 連携機能を Jakarta Messaging 3.0 準拠へ復旧した。既存のコードベースを精査し、「スタブ」ではなく実装が存在することを確認した上で、設定の一元化とコードの整理を実施した。

## 2. 対象ファイルと実施内容

### 2.1 MessagingConfig.java
**ファイルパス**: `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingConfig.java`

**変更内容**:
- `diagnosis.claim.send` プロパティのサポートを追加
- `ClaimSettings` レコードに `diagnosisClaimSend` フィールドを追加
- Legacy DiagnosisSender の動作と互換性を保ちつつ、設定を一元管理

**実装詳細**:
```java
private static final String DIAGNOSIS_CLAIM_SEND = "diagnosis.claim.send";

// ClaimSettings record
public record ClaimSettings(
    boolean serverSideSend, 
    String host, 
    int port, 
    String encoding, 
    String facilityId, 
    boolean diagnosisClaimSend  // ← 新規追加
) {
    public boolean isReady() {
        return serverSideSend && host != null && !host.isBlank() && port > 0;
    }
}
```

**設計判断**:
- デフォルト値は `true`（プロパティが未設定または `"false"` 以外の場合）
- Legacy コードの `if(claimSend != null && claimSend.equals("false"))` ロジックと互換

---

### 2.2 DiagnosisSender.java
**ファイルパス**: `server-modernized/src/main/java/open/dolphin/msg/DiagnosisSender.java`

**変更内容**:
- `custom.properties` を直接読み込むロジックを削除（15行削除）
- `diagnosis.claim.send` の判定を呼び出し側（`MessageSender`、`MessagingGateway`）へ委譲

**削除したコード**:
```java
// 削除前（Lines 71-85）
Properties config = new Properties();
StringBuilder sbPath = new StringBuilder();
sbPath.append(System.getProperty("jboss.home.dir"));
sbPath.append(File.separator);
sbPath.append("custom.properties");
File f = new File(sbPath.toString());
FileInputStream fin = new FileInputStream(f);
InputStreamReader isr = new InputStreamReader(fin, "JISAutoDetect");
config.load(isr);
isr.close();
String claimSend = config.getProperty("diagnosis.claim.send");
if(claimSend != null && claimSend.equals("false")) {
    return;
}
```

**理由**:
- 設定読み込みロジックが `MessagingConfig` と重複
- 単一責任の原則（SRP）に反する
- `MessagingConfig` を使用することで、設定のリロード機構を統一

---

### 2.3 MessageSender.java (MDB)
**ファイルパス**: `server-modernized/src/main/java/open/dolphin/session/MessageSender.java`

**変更内容**:
- `handleDiagnosis` メソッドに `diagnosisClaimSend` フラグチェックを追加
- 設定が `false` の場合、早期リターンしてログを出力

**実装コード**:
```java
private void handleDiagnosis(DiagnosisSendWrapper wrapper, String traceId) throws Exception {
    MessagingConfig.ClaimSettings settings = messagingConfig.claimSettings();
    if (!settings.isReady()) {
        LOGGER.warn("Diagnosis send skipped because claim settings are incomplete [traceId={}]", traceId);
        return;
    }
    if (!settings.diagnosisClaimSend()) {  // ← 新規追加
        LOGGER.info("Diagnosis send skipped because diagnosis.claim.send is false [traceId={}]", traceId);
        return;
    }
    LOGGER.info("Processing Diagnosis JMS message [traceId={}]", traceId);
    ExternalServiceAuditLogger.logDiagnosisRequest(traceId, wrapper, settings);
    try {
        DiagnosisSender sender = new DiagnosisSender(settings.host(), settings.port(), settings.encodingOrDefault());
        sender.send(wrapper);
        ExternalServiceAuditLogger.logDiagnosisSuccess(traceId, wrapper, settings);
    } catch (Exception ex) {
        ExternalServiceAuditLogger.logDiagnosisFailure(traceId, wrapper, settings, ex);
        throw ex;
    }
}
```

**Jakarta Messaging 3.0 準拠**:
- `@MessageDriven` アノテーションで `destinationLookup = "java:/queue/dolphin"` を明示
- `destinationType = "jakarta.jms.Queue"` を指定
- `onMessage(Message message)` で JMS メッセージを受信し、ペイロードの型に応じて適切なハンドラーへ分岐

---

### 2.4 MessagingGateway.java
**ファイルパス**: `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java`

**変更内容**:
- `dispatchDiagnosis` メソッドに `diagnosisClaimSend` フラグチェックを追加
- 設定が `false` の場合、JMS エンキューをスキップ

**実装コード**:
```java
public void dispatchDiagnosis(DiagnosisSendWrapper wrapper) {
    MessagingConfig.ClaimSettings settings = messagingConfig.claimSettings();
    if (!settings.isReady()) {
        LOGGER.fine("Diagnosis dispatch skipped because server-side messaging is disabled or incomplete.");
        return;
    }
    if (!settings.diagnosisClaimSend()) {  // ← 新規追加
        LOGGER.fine("Diagnosis dispatch skipped because diagnosis.claim.send is false.");
        return;
    }
    String traceId = currentTraceId();
    ExternalServiceAuditLogger.logDiagnosisRequest(traceId, wrapper, settings);
    if (enqueue(wrapper, traceId, PAYLOAD_TYPE_DIAGNOSIS)) {
        LOGGER.info(() -> String.format("Diagnosis message enqueued to JMS queue java:/queue/dolphin [traceId=%s]", traceId));
        return;
    }
    LOGGER.warning(() -> String.format("Diagnosis JMS enqueue failed. Falling back to synchronous send [traceId=%s]", traceId));
    sendDiagnosisDirect(wrapper, settings, traceId);
}
```

**JNDI 参照の明示**:
```java
@Resource(lookup = "java:/JmsXA")
private ConnectionFactory connectionFactory;

@Resource(lookup = "java:/queue/dolphin")
private Queue dolphinQueue;
```

---

## 3. 実装確認

### 3.1 既存実装の確認結果
以下のファイルを精査し、「スタブ化されている」という記述が不正確であることを確認した:

1. **MessageSender.java (197行)**:
   - `handleDocument`: CLAIM 送信を `ClaimSender` で実行
   - `handleDiagnosis`: 診断名送信を `DiagnosisSender` で実行
   - `handlePvt`: PVT XML をパースして `PVTServiceBean.addPvt` を呼び出し
   - `handleAccountSummary`: `OidSender` で送信
   - `handleActivityReport`: `OidSender` で Activity レポート送信
   - `handleAuditEvent`: 監査イベントをログ出力

2. **ClaimSender.java (248行)**:
   - Velocity テンプレート (`claimHelper.vm`) を使用して CLAIM 電文を生成
   - Socket 通信で ORCA へ送信し、ACK/NAK を受信
   - `ZenkakuUtils.utf8Replace` で全角文字を処理

3. **DiagnosisSender.java (348行)**:
   - Velocity テンプレート (`diseaseHelper.vm`) を使用して診断名電文を生成
   - Socket 通信で ORCA へ送信し、ACK/NAK を受信
   - 傷病名の送信順序を制御する `DiagnosisSendComparator` を実装

4. **MessagingGateway.java (137行 → 141行に拡張)**:
   - JMS エンキューに失敗した場合、同期的に `ClaimSender` / `DiagnosisSender` を呼び出すフォールバックロジックを実装
   - Trace ID を MDC または `SessionTraceManager` から取得

### 3.2 Velocity テンプレートの確認
以下のテンプレートが存在することを確認:
- `server-modernized/src/main/resources/claimHelper.vm`
- `server-modernized/src/main/resources/diseaseHelper.vm`

### 3.3 VelocityHelper の初期化確認
`server-modernized/src/main/java/open/dolphin/msg/VelocityHelper.java` を確認し、以下の設定を確認:
- クラスパスリソースローダーを使用
- ファイルシステム上のテンプレートディレクトリも検索（`jboss.home.dir/templates` など）
- UTF-8 入力/出力エンコーディング

---

## 4. 設計方針

### 4.1 設定の一元化
- **Before**: `DiagnosisSender` が独自に `custom.properties` を読み込み
- **After**: `MessagingConfig` が全ての設定を一元管理し、`ClaimSettings` レコードで公開
- **メリット**:
  - 設定の重複読み込みを排除
  - テスト時のモック化が容易
  - 設定リロードロジックを1箇所に集約

### 4.2 責任の分離
- **MessagingConfig**: 設定の読み込みと管理
- **MessagingGateway**: JMS エンキューとフォールバック制御
- **MessageSender (MDB)**: JMS メッセージの受信と処理
- **ClaimSender / DiagnosisSender**: ORCA への Socket 送信

### 4.3 Jakarta Messaging 3.0 準拠
- `@MessageDriven` で JNDI 名を明示
- `jakarta.jms.*` パッケージを使用
- WildFly 33 の `messaging-activemq` サブシステムと連携

---

## 5. JNDI リソース要件

### 5.1 必要な JNDI リソース
以下のリソースが WildFly 33 で設定されている必要がある:

1. **JMS Queue**: `java:/queue/dolphin`
2. **JMS ConnectionFactory**: `java:/JmsXA` (XA トランザクション対応)

### 5.2 WildFly CLI 設定例
```bash
# JMS Queue の作成
/subsystem=messaging-activemq/server=default/jms-queue=dolphin:add(entries=["java:/queue/dolphin"])

# ConnectionFactory は通常デフォルトで存在
# 確認: /subsystem=messaging-activemq/server=default/pooled-connection-factory=activemq-ra:read-resource
```

---

## 6. 次ステップ（実測検証）

### 6.1 検証項目
1. **WildFly 33 起動確認**:
   - `configure-wildfly.cli` が正しく実行されること
   - `java:/queue/dolphin` が作成されること
   - `java:/JmsXA` が利用可能であること

2. **JMS エンキュー確認**:
   - REST API 経由でカルテ保存を実行
   - `MessagingGateway.dispatchClaim` がキューへメッセージを送信
   - `ops/tools/jms-probe.sh` でメッセージ数を確認

3. **MDB 処理確認**:
   - `MessageSender.onMessage` がメッセージを受信
   - `handleDocument` / `handleDiagnosis` が呼び出される
   - ログに `[traceId=...]` が記録される

4. **ORCA 送信確認**:
   - `ClaimSender` / `DiagnosisSender` が Socket で ORCA へ接続
   - ACK (`0x06`) または NAK (`0x15`) を受信
   - `dolphin.claim` ロガーに CLAIM 電文と ACK 結果が記録される

5. **診断名送信制御確認**:
   - `custom.properties` で `diagnosis.claim.send=false` を設定
   - 診断名メッセージがスキップされること
   - ログに `"Diagnosis send skipped because diagnosis.claim.send is false"` が記録されること

### 6.2 証跡取得方法
```bash
# JMS キューの状態確認
./ops/tools/jms-probe.sh

# WildFly ログの確認
docker logs opendolphin-wildfly 2>&1 | grep -E "(JMS|CLAIM|Diagnosis|traceId)"

# ORCA への接続確認（dolphin.claim ロガー）
docker logs opendolphin-wildfly 2>&1 | grep "dolphin.claim"
```

### 6.3 期限
- 実測検証の完了期限: **2025-11-25**
- 証跡保存先: `docs/server-modernization/phase2/operations/logs/<RUN_ID>-jms-orca-ack.md`

---

## 7. ドキュメント更新

### 7.1 JAKARTA_EE10_GAP_LIST.md
Lines 21-24 を以下のように更新:
- ✅ MSG-01: MDB 実装復旧完了
- ✅ MSG-01: `MessagingGateway` JMS エンキュー実装完了
- ✅ MSG-01: `DiagnosisSender` 設定一元化完了
- ⚠️ 実測検証待ち（2025-11-25 まで）

### 7.2 MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md
Line 30 を更新:
- **実装完了（2025-11-19）**: MSG-01
- 次ステップ: WildFly 33 上での実測検証

---

## 8. 完了基準

以下の条件を満たした時点で MSG-01 を完全クローズとする:

- [x] `MessageSender.java` の MDB 実装が Jakarta Messaging 3.0 準拠であること
- [x] `MessagingGateway.java` の JMS エンキュー実装が完了していること
- [x] `MessagingConfig.java` による設定一元化が完了していること
- [x] `DiagnosisSender.java` から Legacy 設定読み込みが除去されていること
- [x] `diagnosis.claim.send` フラグによる送信制御が実装されていること
- [ ] WildFly 33 環境で JMS キューへのエンキューが確認できること
- [ ] MDB がメッセージを受信・処理できること
- [ ] ORCA への Socket 送信が成功し、ACK を受信できること
- [ ] `ops/tools/jms-probe.sh` による証跡が取得できること

---

## 9. 変更サマリー

| ファイル | 変更行数 | 変更内容 |
|---------|----------|----------|
| `MessagingConfig.java` | +10 | `diagnosisClaimSend` フィールド追加、プロパティ読み込みロジック追加 |
| `DiagnosisSender.java` | -15 | Legacy `custom.properties` 読み込みロジック削除 |
| `MessageSender.java` | +4 | `handleDiagnosis` に `diagnosisClaimSend` チェック追加 |
| `MessagingGateway.java` | +4 | `dispatchDiagnosis` に `diagnosisClaimSend` チェック追加 |

**合計**: 削除 15 行、追加 18 行

---

## 10. 参照

- ワーカー指示: MSG-01 (RUN_ID=20251119T140358Z)
- 関連ドキュメント:
  - `docs/server-modernization/phase2/foundation/JAKARTA_EE10_GAP_LIST.md`
  - `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md`
  - `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`
- 関連ソースコード:
  - `server-modernized/src/main/java/open/dolphin/session/MessageSender.java`
  - `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java`
  - `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingConfig.java`
  - `server-modernized/src/main/java/open/dolphin/msg/ClaimSender.java`
  - `server-modernized/src/main/java/open/dolphin/msg/DiagnosisSender.java`

---

**作成日時**: 2025-11-19T14:03:58+09:00  
**RUN_ID**: 20251119T140358Z  
**担当**: MSG-01 ワーカー
