package open.dolphin.letter;

import java.text.MessageFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.swing.JLabel;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import open.dolphin.infomodel.ModelUtils;

/**
 *
 * @author Kazushi, Minagawa. Digital Globe, Inc.
 */
public class LetterHelper {

    protected static final String SIMPLE_DATE_FORMAT = "yyyy-MM-dd";

    protected static void setModelValue(JTextField tf, String value) {
        if (value != null) {
            tf.setText(value);
        }
//s.oh^ 2013/10/07 紹介状不具合
        else{
            tf.setText("");
        }
//s.oh$
    }

    protected static void setModelValue(JTextArea ta, String value) {
        if (value != null) {
            ta.setText(value);
        }
//s.oh^ 2013/10/07 紹介状不具合
        else{
            ta.setText("");
        }
//s.oh$
    }

    protected static void setModelValue(JLabel lbl, String value) {
        if (value != null) {
            lbl.setText(value);
        }
    }

    protected static String getFieldValue(JTextField tf) {
        String ret = tf.getText().trim();
        if (!ret.equals("")) {
            return ret;
        }
        return null;
    }

    protected static String getAreaValue(JTextArea ta) {
        String ret = ta.getText().trim();
        if (!ret.equals("")) {
            return ret;
        }
        return null;
    }

    protected static String getLabelValue(JLabel lbl) {
        String ret = lbl.getText().trim();
        if (!ret.equals("")) {
            return ret;
        }
        return null;
    }

    protected static String getDateAsString(Date date, String patterm) {
        SimpleDateFormat sdf = new SimpleDateFormat(patterm);
        return sdf.format(date);
    }

    protected static String getDateAsString(Date date) {
        return getDateAsString(date, java.util.ResourceBundle.getBundle("open/dolphin/letter/resources/LetterHelper").getString("dateFormat.simple"));
    }

    protected static Date getSimpleDateFromString(String dateStr) {
        try {
            SimpleDateFormat SDF = new SimpleDateFormat(SIMPLE_DATE_FORMAT);
            Date ret = SDF.parse(dateStr);
            return ret;
        } catch (ParseException ex) {
            Logger.getLogger(LetterHelper.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    protected static String getDateString(String mmlDate) {
        Date d = ModelUtils.getDateAsObject(mmlDate);
        return getDateAsString(d);
    }

    protected static String getBirdayWithAge(String birthday, String age) {
        String fmt = java.util.ResourceBundle.getBundle("open/dolphin/letter/resources/LetterHelper").getString("messageFormat.birthdayWithAge");
        return new MessageFormat(fmt).format(new Object[]{birthday});
    }

    protected static String getAddressWithZipCode(String address, String zip) {
        String fmt = java.util.ResourceBundle.getBundle("open/dolphin/letter/resources/LetterHelper").getString("messageFormat.zipCodeAddress");
        return new MessageFormat(fmt).format(new Object[]{zip,address});
    }
}
