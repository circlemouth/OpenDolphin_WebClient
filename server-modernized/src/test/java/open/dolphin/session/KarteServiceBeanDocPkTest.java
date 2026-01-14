package open.dolphin.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.lang.reflect.Field;
import java.util.Collections;
import java.util.List;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.storage.attachment.AttachmentStorageManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * addDocument/updateDocument の PK 正数化と docPk 同期を検証する簡易テスト。
 */
class KarteServiceBeanDocPkTest {

    private KarteServiceBean service;
    private EntityManager em;
    private AttachmentStorageManager attachmentStorageManager;
    private Query seqQuery;

    @BeforeEach
    void setUp() throws Exception {
        service = new KarteServiceBean();
        em = mock(EntityManager.class);
        attachmentStorageManager = mock(AttachmentStorageManager.class);
        seqQuery = mock(Query.class);

        setField(service, "em", em);
        setField(service, "attachmentStorageManager", attachmentStorageManager);
    }

    @Test
    void addDocument_assignsPositivePk_andSyncsDocInfo() {
        when(em.createNativeQuery("SELECT nextval('opendolphin.hibernate_sequence')")).thenReturn(seqQuery);
        when(seqQuery.getSingleResult()).thenReturn(100L);
        when(em.merge(any(DocumentModel.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentModel document = buildDocumentWithModule();
        document.setId(-5L);

        long result = service.addDocument(document);

        assertThat(result).isEqualTo(100L);
        assertThat(document.getDocInfoModel().getDocPk()).isEqualTo(100L);
        verify(em).createNativeQuery("SELECT nextval('opendolphin.hibernate_sequence')");
    }

    @Test
    void addThenUpdate_roundTripsWithPositivePk() {
        when(em.createNativeQuery("SELECT nextval('opendolphin.hibernate_sequence')")).thenReturn(seqQuery);
        when(seqQuery.getSingleResult()).thenReturn(200L);
        when(em.merge(any(DocumentModel.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentModel current = buildDocumentWithModule();
        current.setId(200L);
        when(em.find(DocumentModel.class, 200L)).thenReturn(current);

        DocumentModel incoming = buildDocumentWithModule();
        incoming.setId(-1L); // will be overwritten by addDocument

        long added = service.addDocument(incoming);
        assertThat(added).isEqualTo(200L);

        // simulate client re-using returned PK
        incoming.setId(added);
        long updated = service.updateDocument(incoming);

        assertThat(updated).isEqualTo(200L);

        ArgumentCaptor<DocumentModel> mergeCaptor = ArgumentCaptor.forClass(DocumentModel.class);
        verify(em, times(2)).merge(mergeCaptor.capture());
        List<DocumentModel> merged = mergeCaptor.getAllValues();
        assertThat(merged).hasSize(2);
        assertThat(merged.get(merged.size() - 1).getId()).isEqualTo(200L);
    }

    private static DocumentModel buildDocumentWithModule() {
        DocumentModel document = new DocumentModel();
        DocInfoModel info = new DocInfoModel();
        info.setDocId("TESTDOC");
        document.setDocInfoModel(info);

        ModuleModel module = new ModuleModel();
        module.setModel(new DummyModel()); // jsonEncode target

        document.setModules(List.of(module));
        return document;
    }

    private static class DummyModel implements IInfoModel {
        private static final long serialVersionUID = 1L;
    }

    private static void setField(Object target, String name, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(name);
        f.setAccessible(true);
        f.set(target, value);
    }
}
