import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Paths;
import open.dolphin.infomodel.AttachmentModel;
import open.dolphin.infomodel.DocumentModel;

public class DocumentMappingDebug {
    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            throw new IllegalArgumentException("path required");
        }
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        String json = Files.readString(Paths.get(args[0]));
        DocumentModel doc = mapper.readValue(json, DocumentModel.class);
        System.out.println("document confirmed=" + doc.getConfirmed());
        System.out.println("user id=" + (doc.getUserModel() == null ? null : doc.getUserModel().getId()));
        System.out.println("karte id=" + (doc.getKarteBean() == null ? null : doc.getKarteBean().getId()));
        int attachmentCount = doc.getAttachment() == null ? 0 : doc.getAttachment().size();
        System.out.println("attachments=" + attachmentCount);
        if (attachmentCount > 0) {
            AttachmentModel att = doc.getAttachment().get(0);
            System.out.println("att confirmed=" + att.getConfirmed());
            System.out.println("att creator=" + (att.getUserModel() == null ? null : att.getUserModel().getId()));
            System.out.println("att karte=" + (att.getKarteBean() == null ? null : att.getKarteBean().getId()));
            System.out.println("att file=" + att.getFileName());
            System.out.println("att bytes len=" + (att.getBytes() == null ? -1 : att.getBytes().length));
        }
    }
}
