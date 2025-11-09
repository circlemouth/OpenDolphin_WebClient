package open.dolphin.storage.attachment;

/**
 * 添付ファイル保存モード。
 */
public enum AttachmentStorageMode {

    DATABASE,
    S3;

    public static AttachmentStorageMode from(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return DATABASE;
        }
        String normalized = rawValue.trim().toUpperCase();
        if ("S3".equals(normalized)) {
            return S3;
        }
        return DATABASE;
    }

    public boolean isS3() {
        return this == S3;
    }
}
