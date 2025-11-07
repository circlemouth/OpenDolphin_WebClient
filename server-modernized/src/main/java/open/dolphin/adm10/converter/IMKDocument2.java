package open.dolphin.adm10.converter;

import open.dolphin.infomodel.DocumentModel;

/**
 * フリーテキスト対応版 MKDocument ラッパー。
 * {@link IDocument2} を経由して JSON から {@link DocumentModel} へ変換する。
 */
public class IMKDocument2 implements java.io.Serializable {

    private String key;
    private IDocument2 document;

    public IMKDocument2() {
        document = new IDocument2();
    }

    public DocumentModel toModel() {
        return getDocument().toModel();
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public IDocument2 getDocument() {
        return document;
    }

    public void setDocument(IDocument2 document) {
        this.document = document;
    }
}

