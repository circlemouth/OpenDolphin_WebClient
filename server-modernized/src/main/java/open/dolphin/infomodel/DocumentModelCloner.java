package open.dolphin.infomodel;

/**
 * Deep clone helper for infomodel entities.
 *
 * DocumentModel / ModuleModel / SchemaModel implement Cloneable but expose clone() as protected.
 * This helper lives in the same package to provide a safe public entry point.
 */
public final class DocumentModelCloner {

    private DocumentModelCloner() {}

    public static DocumentModel deepClone(DocumentModel source) {
        if (source == null) {
            return null;
        }
        try {
            return (DocumentModel) source.clone();
        } catch (CloneNotSupportedException ex) {
            throw new IllegalStateException("Failed to clone DocumentModel id=" + source.getId(), ex);
        }
    }
}

