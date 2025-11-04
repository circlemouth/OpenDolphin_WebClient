package open.dolphin.system.license;

import java.io.IOException;
import java.util.Properties;

/**
 * ライセンス情報を読み書きするリポジトリ。
 */
public interface LicenseRepository {

    /**
     * ライセンス設定を読み込む。
     *
     * @return 取得したプロパティ
     * @throws IOException 読み込みに失敗した場合
     */
    Properties load() throws IOException;

    /**
     * ライセンス設定を保存する。
     *
     * @param properties 保存対象
     * @throws IOException 保存に失敗した場合
     */
    void store(Properties properties) throws IOException;
}
