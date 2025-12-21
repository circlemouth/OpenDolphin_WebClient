package open.dolphin.touch.transform;

/**
 * Exception used when Touch JSON conversion fails for a legacy payload.
 */
public class TouchJsonTransformationException extends RuntimeException {

    private final String targetType;

    public TouchJsonTransformationException(String message, String targetType, Throwable cause) {
        super(message, cause);
        this.targetType = targetType;
    }

    public TouchJsonTransformationException(String message, String targetType) {
        super(message);
        this.targetType = targetType;
    }

    public String getTargetType() {
        return targetType;
    }
}
