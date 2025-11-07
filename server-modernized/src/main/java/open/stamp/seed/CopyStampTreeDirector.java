
package open.stamp.seed;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import org.jdom.Document;
import org.jdom.Element;
import org.jdom.JDOMException;
import org.jdom.input.SAXBuilder;

/**
 * アカウント作成時にシード元のStampTreeをコピーする director
 *
 * based on StampTreeDirector.java
 * @author Kazushi Minagawa.
 */
public class CopyStampTreeDirector {

    private static final int TT_STAMP_INFO = 0;
    private static final int TT_NODE = 1;
    private static final int TT_ROOT = 2;
    private static final int TT_STAMP_TREE = 3;
    private static final int TT_STAMP_BOX = 4;

    public CopyStampTreeDirector() {
    }

    public void build(BufferedReader reader, CopyStampTreeBuilder builder) {

        SAXBuilder docBuilder = new SAXBuilder();

        try {
            Document doc = docBuilder.build(reader);
            Element root = doc.getRootElement();

            CopyStampTreeBuilder workBuilder = Objects.requireNonNull(builder, "builder must not be null");
            workBuilder.buildStart();
            parseChildren(root, workBuilder);
            workBuilder.buildEnd();
        }
        // indicates a well-formedness error
        catch (JDOMException e) {
            e.printStackTrace(System.err);
            System.out.println("Not well-formed.");
            System.out.println(e.getMessage());
        } catch (IOException e) {
            System.out.println(e);
        }
    }

    public void parseChildren(Element current, CopyStampTreeBuilder builder) throws IOException {
        
        int eType = startElement(current.getName(), current, builder);

        List children = current.getChildren();
        Iterator iterator = children.iterator();

        while (iterator.hasNext()) {
            Element child = (Element) iterator.next();
            parseChildren(child, builder);
        }
        endElement(eType, builder);
    }

    public int startElement(String eName, Element e, CopyStampTreeBuilder builder) throws IOException {

        if (eName.equals("stampInfo")) {
            builder.buildStampInfo(
                    e.getAttributeValue("name"),
                    e.getAttributeValue("role"),
                    e.getAttributeValue("entity"),
                    e.getAttributeValue("editable"),
                    e.getAttributeValue("memo"),
                    e.getAttributeValue("stampId")
                    );
            return TT_STAMP_INFO;
        } else if (eName.equals("node")) {
            builder.buildNode(e.getAttributeValue("name"));
            return TT_NODE;
        } else if (eName.equals("root")) {
            builder.buildRoot(e.getAttributeValue("name"), e.getAttributeValue("entity"));
            return TT_ROOT;
        } else if (eName.equals("stampTree")) {
            return TT_STAMP_TREE;
        } else if (eName.equals("stampBox")) {
            return TT_STAMP_BOX;
        }
        return -1;
    }

    public void endElement(int eType, CopyStampTreeBuilder builder) throws IOException {

        switch (eType) {
            case TT_NODE:
                builder.buildNodeEnd();
                break;
            case TT_ROOT:
                builder.buildRootEnd();
                break;
            case TT_STAMP_TREE:
                break;
            case TT_STAMP_BOX:
                break;
        }
    }
}
