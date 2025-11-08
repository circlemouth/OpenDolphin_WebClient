package open.dolphin.msg;

import java.beans.XMLDecoder;
import java.io.BufferedInputStream;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.util.List;
import java.util.logging.Logger;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.ModuleModel;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.Velocity;

/**
 *
 * @author kazushi
 */
public class MMLSender {
    
    private static final String OBJECT_NAME = "mmlHelper";
    private static final String TEMPLATE_NAME = "mml2.3Helper.vm";
    private static final String TEMPLATE_ENC = "SHIFT_JIS";
    private static final Logger LOGGER = Logger.getLogger("open.dolphin");
    
    private final boolean debugEnabled;
    
    public MMLSender() {
        this.debugEnabled = LOGGER.isLoggable(java.util.logging.Level.FINE);
    }
    
    public String send(DocumentModel dm) throws Exception {
        
        if (debugEnabled && dm != null) {
            if (dm.getKarteBean() != null && dm.getKarteBean().getPatientModel() != null) {
                log("patientId = " + dm.getKarteBean().getPatientModel().getPatientId());
                log("patientName = " + dm.getKarteBean().getPatientModel().getFullName());
            }
            if (dm.getUserModel() != null) {
                log("userId = " + dm.getUserModel().getUserId());
                log("userName = " + dm.getUserModel().getCommonName());
            }
        }

        // decode
        List<ModuleModel> modules = dm.getModules();
        for (ModuleModel mm : modules) {
            mm.setModel((IInfoModel)this.xmlDecode(mm.getBeanBytes()));
        }

        MMLHelper helper = new MMLHelper();
        helper.setDocument(dm);
        helper.buildText();

        VelocityContext context = VelocityHelper.getContext();
        context.put(OBJECT_NAME, helper);
        StringWriter sw = new StringWriter();
        BufferedWriter bw = new BufferedWriter(sw);
        Velocity.mergeTemplate(TEMPLATE_NAME, TEMPLATE_ENC, context, bw);
        bw.flush();
        bw.close();
        String mml = sw.toString();
        if (debugEnabled) {
            log(mml);
        }
        return mml;
    }

    private void log(String msg) {
        LOGGER.info(msg);
    }
    
    private void warning(String msg) {
        LOGGER.warning(msg);
    }
    
    private Object xmlDecode(byte[] bytes)  {

        XMLDecoder d = new XMLDecoder(
                new BufferedInputStream(
                new ByteArrayInputStream(bytes)));

        return d.readObject();
    }
}
