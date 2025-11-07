/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package open.dolphin.common;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 *
 * @author S.Oh@Life Sciences Computing Corporation.
 */
public class OrcaAnalyze {
    // 更新日: 2025-11-03, 担当: Codex

    private final XPath xPath;

    /**
     * コンストラクタ
     */
    public OrcaAnalyze() {
        this.xPath = XPathFactory.newInstance().newXPath();
    }
    
    public void analisisSampleXml(String statement) {
        try {
            OrcaPatientInfo patientInfo = parsePatientInformation(statement);
            if (patientInfo != null) {
                String pid = patientInfo.getPatientId();
                List<String> insuranceProviderClasses = patientInfo.getInsuranceProviderClasses();
                // サンプル実装のため変数は未使用。呼び出し元で適宜利用すること。
            }
        } catch (SAXException ex) {
            Logger.getLogger(OrcaAnalyze.class.getName()).log(Level.SEVERE, null, ex);
        } catch (IOException ex) {
            Logger.getLogger(OrcaAnalyze.class.getName()).log(Level.SEVERE, null, ex);
        } catch (ParserConfigurationException ex) {
            Logger.getLogger(OrcaAnalyze.class.getName()).log(Level.SEVERE, null, ex);
        } catch (XPathExpressionException ex) {
            Logger.getLogger(OrcaAnalyze.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public OrcaPatientInfo parsePatientInformation(String statement) throws ParserConfigurationException, IOException, SAXException, XPathExpressionException {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(statement.getBytes(StandardCharsets.UTF_8)));

        Node pNode = (Node) xPath.evaluate("/xmlio2/patientinfores/Patient_Information", doc, XPathConstants.NODE);
        if (pNode == null) {
            return OrcaPatientInfo.empty();
        }

        String pid = extractText((Node) xPath.evaluate("Patient_ID", pNode, XPathConstants.NODE));
        NodeList insuranceNodes = (NodeList) xPath.evaluate("HealthInsurance_Information/HealthInsurance_Information_child", pNode, XPathConstants.NODESET);

        List<String> insuranceProviderClasses = new ArrayList<>();
        if (insuranceNodes != null) {
            for (int i = 0; i < insuranceNodes.getLength(); i++) {
                Node hNode = insuranceNodes.item(i);
                Node node = (Node) xPath.evaluate("InsuranceProvider_Class", hNode, XPathConstants.NODE);
                insuranceProviderClasses.add(extractText(node));
            }
        }

        return new OrcaPatientInfo(pid, insuranceProviderClasses);
    }

    private String extractText(Node node) {
        if (node == null) {
            return null;
        }
        String text = node.getTextContent();
        return (text != null) ? text.trim() : null;
    }

    public static final class OrcaPatientInfo {
        private final String patientId;
        private final List<String> insuranceProviderClasses;

        private OrcaPatientInfo(String patientId, List<String> insuranceProviderClasses) {
            this.patientId = patientId;
            this.insuranceProviderClasses = Collections.unmodifiableList(new ArrayList<>(insuranceProviderClasses));
        }

        public static OrcaPatientInfo empty() {
            return new OrcaPatientInfo(null, Collections.emptyList());
        }

        public String getPatientId() {
            return patientId;
        }

        public List<String> getInsuranceProviderClasses() {
            return insuranceProviderClasses;
        }
    }
}
