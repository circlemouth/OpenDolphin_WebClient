package open.dolphin.msg.dto;

import java.io.Serializable;
import java.util.Date;

/**
 * メッセージング層で利用する施設アカウント概要の最小インタフェース。
 * セッション層の {@code AccountSummary} 実装に依存しないため、
 * モックや別実装を注入してもメール送信ロジックを再利用できる。
 */
public interface AccountSummaryMessage extends Serializable {

    String getUserId();

    String getUserEmail();

    String getUserName();

    String getFacilityAddress();

    String getFacilityId();

    String getFacilityName();

    String getFacilityTelephone();

    String getFacilityZipCode();

    String getMemberType();

    Date getRegisteredDate();

    String getRdDate();
}
