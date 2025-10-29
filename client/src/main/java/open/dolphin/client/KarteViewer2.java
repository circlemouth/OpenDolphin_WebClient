package open.dolphin.client;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Rectangle;
import java.awt.event.MouseListener;
import java.text.MessageFormat;
import javax.swing.JTextPane;
import javax.swing.SwingConstants;
import javax.swing.text.BadLocationException;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.ModelUtils;
import open.dolphin.project.Project;

/**
 * 2号カルテクラス。
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
public class KarteViewer2 extends KarteViewer {
    
    /**
     * Creates new KarteViewer
     */
    public KarteViewer2() {
    }
    
    @Override
    public int getActualHeight() {
        try {
            JTextPane pane = soaPane.getTextPane();
            int pos = pane.getDocument().getLength();
            Rectangle r = pane.modelToView(pos);
            int hsoa = r.y;
            
            pane = pPane.getTextPane();
            pos = pane.getDocument().getLength();
            r = pane.modelToView(pos);
            int hp = r.y;
            
            return Math.max(hsoa, hp);
            
        } catch (BadLocationException ex) {
            ex.printStackTrace(System.err);
        }
        return 0;
    }
    
    @Override
    public void adjustSize() {
        int h = getActualHeight();
        int soaWidth = soaPane.getTextPane().getPreferredSize().width;
        int pWidth = pPane.getTextPane().getPreferredSize().width;
        soaPane.getTextPane().setPreferredSize(new Dimension(soaWidth, h));
        pPane.getTextPane().setPreferredSize(new Dimension(pWidth, h));
    }
    
    /**
     * P Pane を返す。
     * @return pPane
     */
    public KartePane getPPane() {
        return pPane;
    }
    
    /**
     * ２号カルテで初期化する。
     */
    private void initialize() {
        
        KartePanel2M kp2 = new KartePanel2M();
        panel2 = kp2;
        
        // TimeStampLabel を生成する
        timeStampLabel = kp2.getTimeStampLabel();
        timeStampLabel.setHorizontalAlignment(SwingConstants.CENTER);
        timeStampLabel.setForeground(GUIConst.KARTE_TIME_STAMP_FORE_COLOR);
        timeStampLabel.setFont(timeStampFont);
        
//s.oh^ 2013/01/29 過去カルテの修正操作(選択状態)
        //kp2.getTimeStampPanel().setBackground(KarteDocumentViewer.DEFAULT_BGCOLOR);
        //timeStampLabel.setBackground(KarteDocumentViewer.DEFAULT_BGCOLOR);
        //timeStampLabel.setForeground(KarteDocumentViewer.DEFAULT_FGCOLOR);
//s.oh$
        
        // SOA Pane を生成する
        soaPane = new KartePane();
        soaPane.setTextPane(kp2.getSoaTextPane());
        soaPane.setRole(IInfoModel.ROLE_SOA);
        if (model != null) {
            // Schema 画像にファイル名を付けるのために必要
            String docId = model.getDocInfoModel().getDocId();
            soaPane.setDocId(docId);
        }
        
        // P Pane を生成する
        pPane = new KartePane();
        pPane.setTextPane(kp2.getPTextPane());
        pPane.setRole(IInfoModel.ROLE_P);
    
//s.oh^ 2014/01/27 スタンプのテキストコピー機能拡張
        if(getContext() != null && getContext().getPatient() != null) {
            soaPane.setPatID(getContext().getPatient().getPatientId());
            pPane.setPatID(getContext().getPatient().getPatientId());
        }
//s.oh$
        
        setUI(kp2);
    }
    
    /**
     * プログラムを開始する。
     */
    @Override
    public void start() {
        
        // Creates GUI
        this.initialize();
        
        // Model を表示する
        if (this.getModel() != null) {
            
            String dateFmt = ClientContext.getBundle().getString("KARTE_DATE_FORMAT");
            String selfPrefix = ClientContext.getClaimBundle().getString("INSURANCE_SELF_PREFIX");
            
            // 確定日を分かりやすい表現に変える
            String timeStamp = ModelUtils.getDateAsFormatString(
                    model.getDocInfoModel().getFirstConfirmDate(),
                    dateFmt);
            
            if (model.getDocInfoModel().getStatus().equals(IInfoModel.STATUS_TMP)) {
                // (予定カルテ対応)
                Color bkColor = model.getDocInfoModel().isScheduled() ? GUIConst.SCHEDULE_KARTE_BK_COLOR : GUIConst.TEMP_SAVE_KARTE_BK_COLOR;
                Color foreColor = model.getDocInfoModel().isScheduled() ? GUIConst.SCHEDULE_KARTE_FORE_COLOR : GUIConst.TEMP_SAVE_KARTE_FORE_COLOR;
                String underTemp = ClientContext.getMyBundle(KarteViewer2.class).getString("messageFormat.temporarySave");
                MessageFormat msf = new MessageFormat(underTemp);
                timeStamp = msf.format(new Object[]{timeStamp});
                // 背景が DarkBlue、foreを白にする
                KartePanel2M kp2 = (KartePanel2M)panel2;
                kp2.getTimeStampPanel().setOpaque(true);
                kp2.getTimeStampPanel().setBackground(bkColor);
                timeStampLabel.setOpaque(true);
                timeStampLabel.setBackground(bkColor);
                timeStampLabel.setForeground(foreColor);
            }
//s.oh^ 2014/10/07 自費カルテタイトル帯色変更
            else if(model.getDocInfoModel().getHealthInsurance().startsWith(selfPrefix)) {
                KartePanel2M kp2 = (KartePanel2M)panel2;
                kp2.getTimeStampPanel().setOpaque(true);
                kp2.getTimeStampPanel().setBackground(Color.YELLOW);
                timeStampLabel.setOpaque(true);
                timeStampLabel.setBackground(Color.YELLOW);
            }
//s.oh$
//s.oh^ 2014/05/19 カルテタイトルのユーザ名非表示
            //if (model.getUserModel().getCommonName()!=null) {
            if (model.getUserModel().getCommonName()!=null && !Project.getBoolean("karte.title.username.hide")) {
//s.oh$
                StringBuilder sb = new StringBuilder();
                sb.append(timeStamp).append(" ").append(model.getUserModel().getCommonName());
                timeStamp = sb.toString();
            }
//s.oh^ 2014/08/26 修正時の保険表示
            String ins = model.getDocInfoModel().getHealthInsuranceDesc();
            if(ins != null) {
                StringBuilder sb = new StringBuilder();
                sb.append(timeStamp).append(" (").append(ins).append(")");
                timeStamp = sb.toString();
            }
//s.oh$
            timeStampLabel.setText(timeStamp);
            KarteRenderer_2 renderer = new KarteRenderer_2(soaPane, pPane);
            renderer.render(model);
        }
        
        // モデル表示後にリスナ等を設定する
        ChartMediator mediator = getContext().getChartMediator();
        soaPane.init(false, mediator);
        pPane.init(false, mediator);

        // 自分でエンターしている
        enter();
    }

    @Override
    public void enter() {
        super.enter();
        boolean sendOk = true;
        sendOk = sendOk && (getContext().isSendClaim());
        sendOk = sendOk && (model!=null);
        sendOk = sendOk && (model!=null && model.getDocInfoModel().getDocType().equals(IInfoModel.DOCTYPE_KARTE)); // karte のみ
        sendOk = sendOk && (model!=null && (!model.getDocInfoModel().getStatus().equals(IInfoModel.STATUS_TMP))); // 仮保存でないこと
        ChartMediator mediator = getContext().getChartMediator();
        mediator.getAction(GUIConst.ACTION_SEND_CLAIM).setEnabled(sendOk);
    }
    
    @Override
    public void stop() {
        soaPane.clear();
        pPane.clear();
    }
    
    @Override
    public void addMouseListener(MouseListener ml) {
        soaPane.getTextPane().addMouseListener(ml);
        pPane.getTextPane().addMouseListener(ml);
    }
}