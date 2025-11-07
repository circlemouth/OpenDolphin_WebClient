package open.dolphin.adm10.converter;

import open.dolphin.infomodel.DocumentModel;

/**
 * モバイルカルテ向けドキュメントラッパー（旧 MKDocument）。
 * iOS 端末から送られてくる JSON を {@link IDocument} にデシリアライズし、
 * 業務モデル {@link DocumentModel} へ変換するためのヘルパー。
 */
public class IMKDocument implements java.io.Serializable {

    private String key;
    private IDocument document;

    public IMKDocument() {
        document = new IDocument();
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

    public IDocument getDocument() {
        return document;
    }

    public void setDocument(IDocument document) {
        this.document = document;
    }
}

