package open.dolphin.touch.transform;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Defines how list fields should be normalized for Touch JSON responses.
 */
public enum TouchJsonListPolicy {
    EMPTY_IF_NULL,
    NULL_IF_EMPTY;

    public <T> List<T> normalize(List<T> source) {
        List<T> copy = immutableCopy(source);
        if (this == EMPTY_IF_NULL) {
            return copy != null ? copy : List.of();
        }
        if (copy == null || copy.isEmpty()) {
            return null;
        }
        return copy;
    }

    private static <T> List<T> immutableCopy(List<T> source) {
        if (source == null) {
            return null;
        }
        return Collections.unmodifiableList(new ArrayList<>(source));
    }
}
