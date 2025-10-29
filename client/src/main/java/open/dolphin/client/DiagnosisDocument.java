package open.dolphin.client;

import java.awt.*;
import java.awt.datatransfer.StringSelection;
import java.awt.datatransfer.Transferable;
import java.awt.datatransfer.UnsupportedFlavorException;
import java.awt.event.*;
import java.beans.EventHandler;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;
import java.io.IOException;
import java.text.MessageFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.List;
import javax.swing.*;
import javax.swing.event.ListSelectionEvent;
import javax.swing.event.PopupMenuEvent;
import javax.swing.event.PopupMenuListener;
import javax.swing.table.JTableHeader;
import javax.swing.table.TableColumn;
import open.dolphin.delegater.DocumentDelegater;
import open.dolphin.delegater.OrcaDelegater;
import open.dolphin.delegater.OrcaDelegaterFactory;
import open.dolphin.delegater.StampDelegater;
import open.dolphin.helper.DBTask;
import open.dolphin.infomodel.*;
import open.dolphin.order.StampEditor;
import open.dolphin.project.Project;
import open.dolphin.stampbox.StampTreeNode;
import open.dolphin.table.ListTableModel;
import open.dolphin.table.StripeTableCellRenderer;
import open.dolphin.util.BeanUtils;
import open.dolphin.util.MMLDate;

/**
 * DiagnosisDocument
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
public final class DiagnosisDocument extends AbstractChartDocument implements PropertyChangeListener {

    // 傷病名テーブルのカラム番号定義
    private static final int DIAGNOSIS_COL  = 0;
    private static final int CATEGORY_COL   = 1;
    private static final int OUTCOME_COL    = 2;
    private static final int START_DATE_COL = 3;
    private static final int END_DATE_COL   = 4;

    // GUI コンポーネント定義
    private static final String ORCA_RECORD = "ORCA";
    private static final String DORCA_RECORD = "DORCA";
    private static final String DORCA_UPDATED = "DORCA_UPDATED";
    private final String[] columnToolTips;

    private static final Color ORCA_BACK = ClientContext.getColor("color.CALENDAR_BACK");
    
//s.oh^ 2013/05/10 傷病名対応
    // 傷病名手入力時につけるコード
    private static final String HAND_CODE = "0000999";
//s.oh$
    
    private JTable diagTable;                   // 病歴テーブル
    private ListTableModel<RegisteredDiagnosisModel> tableModel; // TableModel
    private JComboBox extractionCombo;          // 抽出期間コンボ
    
    private JTextField countField;              // 件数フィールド
    private AbstractAction addAction;           // 新規病名エディタ
    private AbstractAction deleteAction;        // 既存傷病名の削除
    private AbstractAction updateAction;        // 既存傷病名の転帰等の更新
    private AbstractAction orcaAction;          // ORCA action
    private AbstractAction activeAction;        // active病名のみ表示
    private AbstractAction copyAction;          // copy
    private AbstractAction copyAsTextAction;    // copyAsText
    private AbstractAction pasteAction;         // paste

    // 昇順降順フラグ
    private boolean ascend;

    // アクティブ病名のみ表示
    private boolean activeOnly;

    // 検索開始日
    private Date searchFrom;

    // 新規に追加された傷病名リスト
    List<RegisteredDiagnosisModel> addedDiagnosis;

    // 更新された傷病名リスト
    List<RegisteredDiagnosisModel> updatedDiagnosis;

    // このドキュメントがオープンされた時の Dolphinの傷病名件数
    private int diagnosisCount;
    
    private boolean DEBUG;
    
    // 制御 Flag
    private boolean orcaDiceaseHasImported;
    private boolean underPopup;
    
//s.oh^ 2014/04/08 傷病名対応
    private boolean saveOnly;
//s.oh$

    /**
     *  Creates new DiagnosisDocument
     */
    public DiagnosisDocument() {
        // Resource injection
        java.util.ResourceBundle bundle = ClientContext.getMyBundle(DiagnosisDocument.class);
        String title = bundle.getString("title.diagnosisDocument");
        setTitle(title);
        // カラムのToolTipText
        String toolTip0 = bundle.getString("column1ToolTips");
        String toolTip1 = bundle.getString("column2ToolTips");
        String toolTip2 = bundle.getString("column3ToolTips");
        String toolTip3 = bundle.getString("column4ToolTips");
        columnToolTips = new String[]{null,toolTip0,toolTip1,toolTip2,toolTip3};
    }

    /**
     * GUI コンポーネントを生成初期化する。
     */
    private void initialize() {

        // Project から昇順降順を設定する
        ascend = Project.getBoolean(Project.DIAGNOSIS_ASCENDING, false);

        // Projectからアクティブ病名のみを表示するかどうか設定する
        activeOnly = Project.getBoolean("diagnosis.activeOnly");

        // コマンドボタンパネルを生成する
        JPanel cmdPanel = createButtonPanel2();

        // Dolphin 傷病歴パネルを生成する
        JPanel dolphinPanel = createDignosisPanel();

        // 抽出期間パネルを生成する
        JPanel filterPanel = createFilterPanel();

        JPanel content = new JPanel(new BorderLayout(0, 7));
        content.add(cmdPanel, BorderLayout.NORTH);
        content.add(dolphinPanel, BorderLayout.CENTER);
        content.add(filterPanel, BorderLayout.SOUTH);

        // 全体をレイアウトする
        JPanel myPanel = getUI();
        myPanel.setLayout(new BorderLayout(0, 7));
        myPanel.add(content);
        myPanel.setBorder(BorderFactory.createEmptyBorder(12, 12, 11, 11));
    }

    /**
     * コマンドボタンパネルをする。
     */
    private JPanel createButtonPanel2() {
        
        //Deleted minagawa comments to make clear

        // 更新ボタン     
        final java.util.ResourceBundle bundle = ClientContext.getMyBundle(DiagnosisDocument.class);
        String actionText = bundle.getString("actionText.save");
        String toolTipText = bundle.getString("toolTipText.action.save");
        updateAction = new AbstractAction(actionText, ClientContext.getImageIconArias("icon_save_small")) {           
            @Override
            public void actionPerformed(ActionEvent ae) {
                save();
            }
        };
        updateAction.setEnabled(false);
        JButton updateButton = new JButton(updateAction);
        updateButton.setToolTipText(toolTipText);

        // 削除ボタン     
        actionText = bundle.getString("actionText.delete");
        toolTipText = bundle.getString("toolTipText.action.delete");
        deleteAction = new AbstractAction(actionText, ClientContext.getImageIconArias("icon_delete_small")) {           
            @Override
            public void actionPerformed(ActionEvent ae) {
                delete2();        
            }
        };
        deleteAction.setEnabled(false);
        JButton deleteButton = new JButton(deleteAction);
        deleteButton.setToolTipText(toolTipText);

        // 新規登録ボタン
        actionText = bundle.getString("actionText.add");
        toolTipText = bundle.getString("toolTipText.action.add");
        addAction = new AbstractAction(actionText, ClientContext.getImageIconArias("icon_add_small")) {              
            @Override
            public void actionPerformed(ActionEvent ae) {
                
            }
        };
        JButton addButton = new JButton(addAction);
        
        if (!getContext().isReadOnly()) {
            addButton.addMouseListener(new MouseAdapter() {

                @Override
                public void mousePressed(MouseEvent e) {
                    if (!e.isPopupTrigger()) {
                        // ASP StampBox が選択されていて傷病名Treeがない場合がある
                        if (getContext().getChartMediator().hasTree(IInfoModel.ENTITY_DIAGNOSIS)) {
                            JPopupMenu popup = new JPopupMenu();
                            getContext().getChartMediator().addDiseaseMenu(popup);
                            popup.show(e.getComponent(), e.getX(), e.getY());
                        } else {
                            Toolkit.getDefaultToolkit().beep();
                            String msg1 = bundle.getString("warning.stampbox.0");
                            String msg2 = bundle.getString("warning.stampBox.1");
                            Object obj = new String[]{msg1, msg2};
                            String title = bundle.getString("dialogTile.add");
                            Component comp = getUI();
                            JOptionPane.showMessageDialog(comp, obj, ClientContext.getFrameTitle(title), JOptionPane.INFORMATION_MESSAGE);
                        }
                    }
                }
            });
        }

        // Depends on readOnly prop
        addAction.setEnabled(!getContext().isReadOnly());
        addButton.setToolTipText(toolTipText);

        // ORCA View
        actionText = bundle.getString("actionText.orca");
        toolTipText = bundle.getString("toolTipText.action.Orca");
        orcaAction = new AbstractAction(actionText, ClientContext.getImageIconArias("icon_import_orca_diagnosis")) {           
            @Override
            public void actionPerformed(ActionEvent ae) {
                viewOrca();
            }
        };
        orcaAction.setEnabled(!getContext().isReadOnly());
        JButton orcaButton = new JButton(orcaAction);
        orcaButton.setToolTipText(toolTipText);

        // ボタンパネル
        JPanel p = new JPanel();
        p.setLayout(new BoxLayout(p, BoxLayout.X_AXIS));
        
        // 評価の場合でServer-ORCAのケース^ 
        if (Project.canAccessToOrca()) {
            p.add(Box.createHorizontalStrut(5));
            p.add(orcaButton);
        }
        // 評価の場合$
        p.add(Box.createHorizontalGlue());
        p.add(deleteButton);
        p.add(Box.createHorizontalStrut(5));
        p.add(addButton);
        p.add(Box.createHorizontalStrut(5));
        p.add(updateButton);
        return p;
    }

    /**
     * 既傷病歴テーブルを生成する。
     */
    private JPanel createDignosisPanel() {

        // Table 仕様
        String[] columnNames = ClientContext.getStringArray("diagnosis.columnNames");
        String[] methodNames = ClientContext.getStringArray("diagnosis.methodNames");
        Class[] columnClasses = new Class[]{String.class, String.class, String.class, String.class, String.class};
        int startNumRows = 0;

        // Diagnosis テーブルモデルを生成する
        tableModel = new ListTableModel<RegisteredDiagnosisModel>(columnNames, startNumRows, methodNames, columnClasses) {

            // Diagnosisは編集不可
            @Override
            public boolean isCellEditable(int row, int col) {

                // licenseCodeで制御
                if (isReadOnly()) {
                    return false;
                }

                // 病名レコードが存在しない場合は false
                RegisteredDiagnosisModel entry = getObject(row);
                if (entry == null) {
                    return false;
                }

                // ORCA に登録されている病名の場合
                if (isOrcaDisease(entry)) {
                    return false;
                }

                // それ以外はカラムに依存する
                boolean editable = true;
                editable = editable && (col == CATEGORY_COL || col == OUTCOME_COL || col == START_DATE_COL || col == END_DATE_COL);
                return editable;
            }

            // オブジェクトの値を設定する
            @Override
            public void setValueAt(Object value, int row, int col) {

                RegisteredDiagnosisModel entry = getObject(row);

                if (entry == null || value == null) {
                    return;
                }

                switch (col) {

                    case DIAGNOSIS_COL:
                        break;

                    case CATEGORY_COL:
                        // JComboBox から選択
                        String saveCategory = entry.getCategory();
                        DiagnosisCategoryModel dcm = (DiagnosisCategoryModel) value;
                        String test = dcm.getDiagnosisCategory();
                        test = test != null && (!test.equals("")) ? test : null;

                        if (saveCategory == null && test != null) {
                            entry.setCategory(dcm.getDiagnosisCategory());
                            entry.setCategoryDesc(dcm.getDiagnosisCategoryDesc());
                            entry.setCategoryCodeSys(dcm.getDiagnosisCategoryCodeSys());
                            fireTableRowsUpdated(row, row);
                            addUpdatedList(entry);
                        } else if (saveCategory != null && test == null) {
                            entry.setDiagnosisCategoryModel(null);
                            fireTableRowsUpdated(row, row);
                            addUpdatedList(entry);
                        } else if (saveCategory != null && test != null && (!saveCategory.equals(test))) {
                            entry.setCategory(dcm.getDiagnosisCategory());
                            entry.setCategoryDesc(dcm.getDiagnosisCategoryDesc());
                            entry.setCategoryCodeSys(dcm.getDiagnosisCategoryCodeSys());
                            fireTableRowsUpdated(row, row);
                            addUpdatedList(entry);
                        }
                        break;

                    case OUTCOME_COL:
                        // JComboBox から選択
                        String saveOutcome = entry.getOutcome();
                        DiagnosisOutcomeModel dom = (DiagnosisOutcomeModel) value;
                        test = dom.getOutcome();
                        test = (test != null && !test.equals("") && !test.startsWith("-")) ? test : null;

                        if (saveOutcome == null && test != null) {
                            entry.setOutcome(dom.getOutcome());
                            entry.setOutcomeDesc(dom.getOutcomeDesc());
                            entry.setOutcomeCodeSys(dom.getOutcomeCodeSys());
                            // 疾患終了日を入れる
                            if (Project.getBoolean("autoOutcomeInput", false)) {
                                String val = entry.getEndDate();
                                if (val == null || val.equals("")) {
                                    GregorianCalendar gc = new GregorianCalendar();
                                    int offset = Project.getInt(Project.OFFSET_OUTCOME_DATE, -7);
                                    gc.add(Calendar.DAY_OF_MONTH, offset);
                                    String today = MMLDate.getDate(gc);
                                    entry.setEndDate(today);
                                }
                            }
                            fireTableRowsUpdated(row, row);
                            addUpdatedList(entry);

                        } else if (saveOutcome != null && test == null) {
                            entry.setDiagnosisOutcomeModel(null);
                            fireTableRowsUpdated(row, row);
                            addUpdatedList(entry);

                        } else if (saveOutcome != null && test != null && (!saveOutcome.equals(test))) {
                            entry.setOutcome(dom.getOutcome());
                            entry.setOutcomeDesc(dom.getOutcomeDesc());
                            entry.setOutcomeCodeSys(dom.getOutcomeCodeSys());
                            // 疾患終了日を入れる
                            if (Project.getBoolean("autoOutcomeInput", false)) {
                                String val = entry.getEndDate();
                                if (val == null || val.equals("")) {
                                    GregorianCalendar gc = new GregorianCalendar();
                                    int offset = Project.getInt(Project.OFFSET_OUTCOME_DATE, -7);
                                    gc.add(Calendar.DAY_OF_MONTH, offset);
                                    String today = MMLDate.getDate(gc);
                                    entry.setEndDate(today);
                                }
                            }
                            fireTableRowsUpdated(row, row);
                            addUpdatedList(entry);
                        }
                        break;

                    case START_DATE_COL:
                        String strVal = (String) value;
                        if (!strVal.trim().equals("")) {
                            entry.setStartDate(strVal);
                            fireTableRowsUpdated(row, row);
                            addUpdatedList(entry);
                        }
                        break;

                    case END_DATE_COL:
                        strVal = ((String) value).trim();
                        System.err.println(strVal);
                        strVal = strVal.equals("") ? null : strVal;
                        entry.setEndDate(strVal);
                        fireTableRowsUpdated(row, row);
                        addUpdatedList(entry);
                        break;
                }
            }
        };

        // 傷病歴テーブルを生成する
        diagTable = new JTable(tableModel) {

            @Override
            protected JTableHeader createDefaultTableHeader() {
                return new JTableHeader(columnModel) {
                    @Override
                    public String getToolTipText(MouseEvent e) {
                        //String tip = null;
                        java.awt.Point p = e.getPoint();
                        int index = columnModel.getColumnIndexAtX(p.x);
                        int realIndex = columnModel.getColumn(index).getModelIndex();
                        return columnToolTips[realIndex];
                    }
                };
            }
        };

        // 奇数、偶数行の色分けをする
        DolphinOrcaRenderer rederer = new DolphinOrcaRenderer();
        rederer.setTable(diagTable);
        rederer.setDefaultRenderer();
        
        // 行高
        diagTable.setRowHeight(ClientContext.getMoreHigherRowHeight());

        // ??
        diagTable.setSurrendersFocusOnKeystroke(true);

        // 行選択が起った時のリスナを設定する
        diagTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        diagTable.setRowSelectionAllowed(true);
        ListSelectionModel m = diagTable.getSelectionModel();
        m.addListSelectionListener((ListSelectionEvent e) -> {
            if (!e.getValueIsAdjusting()) {
                controllActions();
            }
        });
        
        FocusListener fl = new FocusListener() {

            @Override
            public void focusGained(FocusEvent e) {
                // 編集が開始された
                disableActions();
            }

            @Override
            public void focusLost(FocusEvent e) {
                // 編集が終了もしくは esc 
                if (!underPopup) {
                    controllActions();
                }
            }
        };      

        // Category comboBox 入力を設定する
        String[] values = ClientContext.getStringArray("diagnosis.category");
        String[] descs = ClientContext.getStringArray("diagnosis.categoryDesc");
        String[] codeSys = ClientContext.getStringArray("diagnosis.categoryCodeSys");
        DiagnosisCategoryModel[] categoryList = new DiagnosisCategoryModel[values.length + 1];
        DiagnosisCategoryModel dcm = new DiagnosisCategoryModel();
        dcm.setDiagnosisCategory("");
        dcm.setDiagnosisCategoryDesc("");
        dcm.setDiagnosisCategoryCodeSys("");
        categoryList[0] = dcm;
        for (int i = 0; i < values.length; i++) {
            dcm = new DiagnosisCategoryModel();
            dcm.setDiagnosisCategory(values[i]);
            dcm.setDiagnosisCategoryDesc(descs[i]);
            dcm.setDiagnosisCategoryCodeSys(codeSys[i]);
            categoryList[i + 1] = dcm;
        }
        JComboBox categoryCombo = new JComboBox(categoryList);
        TableColumn column = diagTable.getColumnModel().getColumn(CATEGORY_COL);
        column.setCellEditor(new DefaultCellEditor(categoryCombo));
        categoryCombo.addFocusListener(fl);      

        // Outcome comboBox 入力を設定する
        String[] ovalues = ClientContext.getStringArray("diagnosis.outcome2");
        String[] odescs = ClientContext.getStringArray("diagnosis.outcomeDesc2");     
        String ocodeSys = ClientContext.getString("diagnosis.outcomeCodeSys");
        DiagnosisOutcomeModel[] outcomeList = new DiagnosisOutcomeModel[ovalues.length + 1];
        DiagnosisOutcomeModel dom = new DiagnosisOutcomeModel();
        dom.setOutcome("");
        dom.setOutcomeDesc("");
        dom.setOutcomeCodeSys("");
        outcomeList[0] = dom;
        
        for (int i = 0; i < ovalues.length; i++) {
            dom = new DiagnosisOutcomeModel();
            dom.setOutcome(ovalues[i]);
            dom.setOutcomeDesc(odescs[i]);
            dom.setOutcomeCodeSys(ocodeSys);
            outcomeList[i + 1] = dom;
        }
        JComboBox outcomeCombo = new JComboBox(outcomeList);
        column = diagTable.getColumnModel().getColumn(OUTCOME_COL);
        column.setCellEditor(new DefaultCellEditor(outcomeCombo));
        outcomeCombo.addFocusListener(fl);
        
        // Start Date && EndDate Col にポップアップカレンダーを設定する
        // IME を OFF にする
        String datePattern = ClientContext.getString("common.pattern.mmlDate");
        column = diagTable.getColumnModel().getColumn(START_DATE_COL);
        JTextField tf = new JTextField();
        tf.addFocusListener(AutoRomanListener.getInstance());
        tf.addFocusListener(fl);
        
        PopupListener pl1 = new PopupListener(tf, new int[]{-12, 0});       
        tf.setDocument(new RegexConstrainedDocument(datePattern));
        DefaultCellEditor de = new DefaultCellEditor(tf);
        column.setCellEditor(de);
        int clickCountToStart = Project.getInt("diagnosis.table.clickCountToStart", 1);
        de.setClickCountToStart(clickCountToStart);

        column = diagTable.getColumnModel().getColumn(END_DATE_COL);
        tf = new JTextField();
        tf.addFocusListener(AutoRomanListener.getInstance());
        tf.addFocusListener(fl);       
        tf.setDocument(new RegexConstrainedDocument(datePattern));
        
        PopupListener pl2 = new PopupListener(tf, new int[]{-2, 2});       
        de = new DefaultCellEditor(tf);
        column.setCellEditor(de);
        de.setClickCountToStart(clickCountToStart);

        //-----------------------------------------------
        // TransferHandler を設定する
        //-----------------------------------------------
        if (!getContext().isReadOnly()) {
            diagTable.setTransferHandler(new DiagnosisTransferHandler(this));
            diagTable.setDragEnabled(true);
        }

        //-----------------------------------------------
        // Copy,Paste,CopyAsText 機能を実装する
        // Copy,Paste: 日本語で表示するため proxy actionが必要
        //-----------------------------------------------
        java.util.ResourceBundle bundle = ClientContext.getMyBundle(DiagnosisDocument.class);
        String actionText = bundle.getString("actionText.copy");
        copyAction = new AbstractAction(actionText) {

            @Override
            public void actionPerformed(ActionEvent ae) {
                Action a = diagTable.getActionMap().get(TransferHandler.getCopyAction().getValue(Action.NAME));
                if (a != null) {
                    a.actionPerformed(new ActionEvent(diagTable,
                            ActionEvent.ACTION_PERFORMED,
                            null));
                }
            }
        };
        diagTable.getActionMap().put("Copy", copyAction);
        
        actionText = bundle.getString("actionText.paste");
        pasteAction = new AbstractAction(actionText) {

            @Override
            public void actionPerformed(ActionEvent ae) {
                Action a = diagTable.getActionMap().get(TransferHandler.getPasteAction().getValue(Action.NAME));
                if (a != null) {
                    a.actionPerformed(new ActionEvent(diagTable,
                            ActionEvent.ACTION_PERFORMED,
                            null));
                }
            }
        };
        diagTable.getActionMap().put("Paste", pasteAction);
        
        actionText = bundle.getString("actionText.copyAsText");
        copyAsTextAction = new AbstractAction(actionText) {

            @Override
            public void actionPerformed(ActionEvent ae) {
                copyAsText();
            }
        };

        //-------------------------------------------------
        // Copy menu を加える
        //-------------------------------------------------
        diagTable.addMouseListener(new MouseListener() {

            @Override
            public void mouseClicked(MouseEvent me) {
            }

            @Override
            public void mouseEntered(MouseEvent me) {
            }

            @Override
            public void mouseExited(MouseEvent me) {
            }

            @Override
            public void mousePressed(MouseEvent me) {
                mabeShowPopup(me);
            }

            @Override
            public void mouseReleased(MouseEvent me) {
                mabeShowPopup(me);
            }

            public void mabeShowPopup(MouseEvent e) {
                
                if (!e.isPopupTrigger()) {
                    return;
                }
                
                int row = diagTable.rowAtPoint(e.getPoint());
                RegisteredDiagnosisModel obj = tableModel.getObject(row);
                int selected = diagTable.getSelectedRow();

                JPopupMenu contextMenu = new JPopupMenu();               
                if (row < 0 || row != selected || obj == null) {
                    contextMenu.add(new JMenuItem(pasteAction));
                    pasteAction.setEnabled(canPaste());
                } else {

                    // ORCA 病名かどうか
                    boolean selectedIsOrca = true;
                    selectedIsOrca = selectedIsOrca && (obj.getStatus()!=null && obj.getStatus().equals(ORCA_RECORD));
//s.oh^ 2013/03/22 不要機能の削除(すぐに対応できないため)
                    //contextMenu.add(new JMenuItem(copyAction));
//s.oh$
                    contextMenu.add(new JMenuItem(pasteAction));
                    contextMenu.addSeparator();
                    contextMenu.add(new JMenuItem(copyAsTextAction));
                    contextMenu.addSeparator();
                    contextMenu.add(new JMenuItem(deleteAction));

                    pasteAction.setEnabled(canPaste());
                    deleteAction.setEnabled(!selectedIsOrca);
                }
                
//s.oh^ 2014/04/02 閲覧権限の制御
                if(isReadOnly()) {
                    deleteAction.setEnabled(false);
                }
//s.oh$
                
                contextMenu.show(e.getComponent(), e.getX(), e.getY());              
            }
        });

        // Layout
        JScrollPane scroller = new JScrollPane(diagTable,
                JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED,
                JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);

        JPanel p = new JPanel(new BorderLayout());
        p.add(scroller, BorderLayout.CENTER);
        return p;
    }

    /**
     * 抽出期間パネルを生成する。
     */
    private JPanel createFilterPanel() {

        JPanel p = new JPanel();
        p.setLayout(new BoxLayout(p, BoxLayout.X_AXIS));
        p.add(Box.createHorizontalStrut(7));

        // 抽出期間コンボボックス
        java.util.ResourceBundle bundle = ClientContext.getMyBundle(DiagnosisDocument.class);
        String labelTextExtraction = bundle.getString("labelText.extraction");
        p.add(new JLabel(labelTextExtraction));
        NameValuePair[] extractionObjects = ClientContext.getNameValuePair("diagnosis.combo.period");
        extractionCombo = new JComboBox(extractionObjects);
//s.oh^ 2014/08/13 コントロールサイズ調整
        String nimbus = "com.sun.java.swing.plaf.nimbus.NimbusLookAndFeel";
        String laf = UIManager.getLookAndFeel().getClass().getName();
        if(!laf.equals(nimbus)) {
            extractionCombo.setPreferredSize(new Dimension(80, 20));
        }
//s.oh$
        int currentDiagnosisPeriod = Project.getInt(Project.DIAGNOSIS_PERIOD, 0);
        int selectIndex = NameValuePair.getIndex(String.valueOf(currentDiagnosisPeriod), extractionObjects);
        extractionCombo.setSelectedIndex(selectIndex);
        extractionCombo.addItemListener((ItemListener) EventHandler.create(ItemListener.class, this, "extPeriodChanged", ""));

        JPanel comboPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 0));
        comboPanel.add(extractionCombo);

        // Active 病名のみ表示 ToDo
        String actionText = bundle.getString("actionText.activeDiceaseOnly");
        activeAction = new AbstractAction(actionText) {
            @Override
            public void actionPerformed(ActionEvent ae) {
                activeOnly = !activeOnly;
                getDiagnosisHistory();
            }
        };
        JCheckBox activeBox = new JCheckBox();
        activeBox.setSelected(activeOnly);
        activeBox.setAction(activeAction);
        comboPanel.add(activeBox);

        p.add(comboPanel);
        p.add(Box.createHorizontalGlue());

        // 件数フィールド
        countField = new JTextField(2);
        countField.setEditable(false);
        JPanel countPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 5, 0));
        String labelTextNumRecords = bundle.getString("labelText.numrecords");
        countPanel.add(new JLabel(labelTextNumRecords));
        countPanel.add(countField);

        p.add(countPanel);
        p.add(Box.createHorizontalStrut(7));
        p.setBorder(BorderFactory.createEmptyBorder(0, 0, 7, 0));

        return p;
    }

    /**
     * 抽出期間を変更した場合に再検索を行う。
     * ORCA 病名ボタンが disable であれば検索後に enable にする。
     * @param e
     */
    public void extPeriodChanged(ItemEvent e) {       
        if (e.getStateChange() == ItemEvent.SELECTED) {
            getDiagnosisHistory();
        }
    }

    public JTable getDiagnosisTable() {
        return diagTable;
    }

    @Override
    public void start() {
        // GUI 初期化
        initialize();
        super.enter(); 
        getDiagnosisHistory();
    }

    @Override
    public void stop() {
        if (tableModel != null) {
            tableModel.clear();
        }
    }

    @Override
    public void enter() {
        super.enter();
        // pPaneに汎用スタンプに病名がセットされていた場合を追加する
        // 病名<->KarteEditorの切替を想定しその都度 addDroppedDiagnosisを実行する
        addDroppedDiagnosis();
    }

    /**
     * 新規傷病名リストに追加する。
     * @param added 追加されたRegisteredDiagnosisModel
     */
    private void addAddedList(RegisteredDiagnosisModel added) {
        if (addedDiagnosis == null) {
            addedDiagnosis = new ArrayList<>(5);
        }
        addedDiagnosis.add(added);
        controllActions();        
    }

    private void addAllAddedList(List<RegisteredDiagnosisModel> list) {
        if (addedDiagnosis == null) {
            addedDiagnosis = new ArrayList<>(5);
        }
        addedDiagnosis.addAll(list);
        controllActions(); 
    }

    private boolean isOrcaDisease(RegisteredDiagnosisModel test) {
        return (test!=null && test.getStatus()!=null && test.getStatus().equals(ORCA_RECORD));
    }

    private boolean isDorcaDisease(RegisteredDiagnosisModel test) {
        return (test!=null && test.getStatus()!=null && test.getStatus().equals(DORCA_RECORD));
    }

    private boolean isDorcaUpdatedDisease(RegisteredDiagnosisModel test) {
        return (test!=null && test.getStatus()!=null && test.getStatus().equals(DORCA_UPDATED));
    }

    private boolean isPureDisease(RegisteredDiagnosisModel test) {
        return (test!=null && test.getStatus()!=null && test.getStatus().equals(IInfoModel.STATUS_FINAL));
    }

    /**
     * 更新リストに追加する。
     * @param updated 更新されたRegisteredDiagnosisModel
     */
    private void addUpdatedList(RegisteredDiagnosisModel updated) {

        // ディタッチオブジェクトの時
        if (updated.getId() != 0L) {
            // 更新リストに追加する
            if (updatedDiagnosis == null) {
                updatedDiagnosis = new ArrayList<>(5);
            }
            // 同じものが再度更新されているケースを除く
            if (!updatedDiagnosis.contains(updated)) {
                updatedDiagnosis.add(updated);
            }
            controllActions();          

        } // 新規に追加された病名（まだ保存されていない）のケース
          // addedDiagnosis に追加されているので updatedDiagnosisには入れない
        else if (isDorcaDisease(updated)) {
            // DORCA 病名の場合 -> DORCA_UPDATED -> CLAIM送信
            //System.err.println(updated.getDiagnosis());
            updated.setStatus(DORCA_UPDATED);
        }
    }

    /**
     * 追加及び更新リストをクリアする。
     */
    private void clearDiagnosisList() {

        if (addedDiagnosis != null && addedDiagnosis.size() > 0) {
            while (addedDiagnosis.size() > 0) {
                addedDiagnosis.remove(0);
            }
        }

        if (updatedDiagnosis != null && updatedDiagnosis.size() > 0) {
            while (updatedDiagnosis.size() > 0) {
                updatedDiagnosis.remove(0);
            }
        }
        controllActions();
    }
    
    private void controllActions() {
        controllUpdateAction();
        controllDeleteAction();
        controllOrcaAction();
        controllAddAction();
    }
    
    /**
     * 更新ボタンを制御する。
     */
    // 傷病名の削除(ORCA送信) 2013/06/24
    private void controllUpdateAction() {
        if (isReadOnly()) {
            updateAction.setEnabled(false);
            return;
        }
        boolean hasAdded = (addedDiagnosis != null && addedDiagnosis.size() > 0);
        boolean hasUpdated = (updatedDiagnosis != null && updatedDiagnosis.size() > 0);
        boolean newDirty = (hasAdded || hasUpdated);
        setDirty(newDirty);
        updateAction.setEnabled(isDirty());
    }
    
    // 削除ボタンをコントロールする
    private void controllDeleteAction() {
        
        // licenseCode 制御を追加
        if (isReadOnly()) {
            deleteAction.setEnabled(false);
            return;
        }

        // 選択された行のオブジェクトを得る
        int row = diagTable.getSelectedRow();
        RegisteredDiagnosisModel rd = tableModel.getObject(row);

        // ヌルの場合
        if (rd == null) {
            deleteAction.setEnabled(false);
            return;
        }

        // ORCA の場合
        if (isOrcaDisease(rd)) {
            deleteAction.setEnabled(false);
            return;
        }

        // Dolphin の場合
        deleteAction.setEnabled(true);
    }
    
    private void controllAddAction() {
        addAction.setEnabled(!isReadOnly());
    }
    
    private void controllOrcaAction() {
        if (isReadOnly() || orcaDiceaseHasImported) {
            orcaAction.setEnabled(false);
        } else {
            orcaAction.setEnabled(true);
        }
    }
    
    private void disableActions() {
        orcaAction.setEnabled(false);
        deleteAction.setEnabled(false);
        addAction.setEnabled(false);
        updateAction.setEnabled(false);
    }     

    /**
     * 傷病名件数を返す。
     * @return 傷病名件数
     */
    public int getDiagnosisCount() {
        return diagnosisCount;
    }

    /**
     * 傷病名件数を設定する。
     * @param cnt 傷病名件数
     */
    public void setDiagnosisCount(int cnt) {
        diagnosisCount = cnt;
        try {
            String val = String.valueOf(diagnosisCount);
            countField.setText(val);
        } catch (RuntimeException e) {
            countField.setText("");
        }
    }
    
    /**
     * 傷病名スタンプを取得する worker を起動する。
     * @param stampList
     * @param insertRow
     */
    public void importStampList(final List<ModuleInfoBean> stampList, final int insertRow) {

        final StampDelegater sdl = new StampDelegater();

        DBTask task = new DBTask<List<StampModel>, Void>(getContext()) {

            @Override
            protected List<StampModel> doInBackground() throws Exception {
                List<StampModel> result = sdl.getStamp(stampList);
                return result;
            }

            @Override
            protected void succeeded(List<StampModel> list) {
                trace("importStampList succeeded");
                if (list != null) {
                    for (int i = list.size() - 1; i > -1; i--) {
                        insertStamp((StampModel) list.get(i), insertRow);
                    }
                }
            }
        };

        task.execute();
    }

    /**
     * 傷病名スタンプをデータベースから取得しテーブルへ挿入する。
     * Worker Thread で実行される。
     * @param stampInfo
     */
    private void insertStamp(StampModel sm, int row) {

        if (sm != null) {
            RegisteredDiagnosisModel module = (RegisteredDiagnosisModel) BeanUtils.xmlDecode(sm.getStampBytes());
            
//s.oh^ 2014/04/08 傷病名対応
            boolean added = false;
            if(tableModel != null && tableModel.getRowCount() > 0) {
                for(int i = 0; i < tableModel.getRowCount(); i++) {
                    RegisteredDiagnosisModel model = tableModel.getObject(i);
                    if(module.getDiagnosis().equals(model.getDiagnosis())) {
                        SimpleDateFormat frmt = new SimpleDateFormat("yyyy-MM-dd");
                        String today = frmt.format(new Date());
                        String started = frmt.format(model.getStarted());
                        if(today.equals(started)) {
                            added = true;
                            break;
                        }
                    }
                }
            }
            if(added) {
                java.util.ResourceBundle bundle = ClientContext.getMyBundle(DiagnosisDocument.class);
                String title = bundle.getString("title.optionPane.addDiagnosis");
                String msgFmt = bundle.getString("messageFormat.dupuricateDiagnosis");
                MessageFormat msf = new MessageFormat(msgFmt);
                String msg = msf.format(new Object[]{module.getDiagnosis()});
                title = ClientContext.getFrameTitle(title);
                
                JOptionPane.showMessageDialog(getContext().getFrame(), msg, title, JOptionPane.INFORMATION_MESSAGE);
                return;
            }
//s.oh$

            // 今日の日付を疾患開始日として設定する
            GregorianCalendar gc = new GregorianCalendar();
            String today = MMLDate.getDate(gc);
            module.setStartDate(today);

            row = tableModel.getObjectCount() == 0 ? 0 : row;
            int cnt = tableModel.getObjectCount();
            if (row == 0 && cnt == 0) {
                tableModel.addObject(module);
            } else if (row < cnt) {
                tableModel.addObject(row, module);
            } else {
                tableModel.addObject(module);
            }
            
//s.oh^ 2014/03/13 傷病名削除診療科対応
            String deptCode = null;
            String deptName = null;
            if(getContext().getPatientVisit() != null && getContext().getPatientVisit().getDeptCode() != null && getContext().getPatientVisit().getDeptName() != null) {
                deptCode = getContext().getPatientVisit().getDeptCode();
                deptName = getContext().getPatientVisit().getDeptName();
            }else if(Project.getUserModel() != null && Project.getUserModel().getDepartmentModel() != null && Project.getUserModel().getDepartmentModel().getDepartment() != null && Project.getUserModel().getDepartmentModel().getDepartmentDesc() != null) {
                deptCode = Project.getUserModel().getDepartmentModel().getDepartment();
                deptName = Project.getUserModel().getDepartmentModel().getDepartmentDesc();
            }else{
            }
            module.setDepartment(deptCode);
            module.setDepartmentDesc(deptName);
//s.oh$

            // row を選択する
            diagTable.getSelectionModel().setSelectionInterval(row, row);

            addAddedList(module);
        }
    }

    /**
     * 傷病名エディタを開く。
     */
    public void openEditor2() {
        Window lock = SwingUtilities.getWindowAncestor(this.getUI());
        StampEditor editor = new StampEditor("diagnosis", this, lock);
    }

    /**
     * 傷病名エディタからデータを受け取りテーブルへ追加する。
     * @param e
     */
    @Override
    public void propertyChange(PropertyChangeEvent e) {

        ArrayList list = (ArrayList) e.getNewValue();
        if (list == null || list.isEmpty()) {
            return;
        }

        int len = list.size();
        // 今日の日付を疾患開始日として設定する
        GregorianCalendar gc = new GregorianCalendar();
        String today = MMLDate.getDate(gc);

        if (ascend) {
            // 昇順なのでテーブルの最後へ追加する
            for (int i = 0; i < len; i++) {
                RegisteredDiagnosisModel module = (RegisteredDiagnosisModel) list.get(i);
                module.setStartDate(today);
                tableModel.addObject(module);
                addAddedList(module);
            }

        } else {
            // 降順なのでテーブルの先頭へ追加する
            for (int i = len - 1; i > -1; i--) {
                RegisteredDiagnosisModel module = (RegisteredDiagnosisModel) list.get(i);
                module.setStartDate(today);
                tableModel.addObject(0, module);
                addAddedList(module);
            }
        }
    }
    
    private boolean isValidOutcome(RegisteredDiagnosisModel rd) {
        
        if (rd.getOutcome() == null) {
            return true;
        }
        
        String start = rd.getStartDate();
        String end = rd.getEndDate();
        
        java.util.ResourceBundle bundle = ClientContext.getMyBundle(DiagnosisDocument.class);
        
        if (start == null) {
            String warning = bundle.getString("warning.noStartDate");
            String title = bundle.getString("dialogText.checkDiagnosis");
            JOptionPane.showMessageDialog(
                    getContext().getFrame(),
                    warning,
                    ClientContext.getFrameTitle(title),
                    JOptionPane.WARNING_MESSAGE);
            return false;
        }
        if (end == null) {
            String warning = bundle.getString("warning.noEndDate");
            String title = bundle.getString("dialogText.checkDiagnosis");
            JOptionPane.showMessageDialog(
                    getContext().getFrame(),
                    warning,
                    ClientContext.getFrameTitle(title),
                    JOptionPane.WARNING_MESSAGE);
            return false;
        }
        
        Date startDate = null;
        Date endDate = null;
        boolean formatOk = true;
        
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            start = start.replaceAll("/", "-");
            end = end.replaceAll("/", "-");
            startDate = sdf.parse(start);
            endDate = sdf.parse(end);
        } catch (Exception e) {
            String warning = bundle.getString("message.inputDateFormat");
            String title = bundle.getString("dialogText.checkDiagnosis");
            JOptionPane.showMessageDialog(
                    getContext().getFrame(),
                    warning,
                    ClientContext.getFrameTitle(title),
                    JOptionPane.WARNING_MESSAGE);
            formatOk = false;
        }
        
        if (!formatOk) {
            return false;
        }
        
        if (endDate.before(startDate)) {
            String warning = bundle.getString("warning.endDateIsBeforeStart");
            String title = bundle.getString("dialogText.checkDiagnosis");
            JOptionPane.showMessageDialog(
                    getContext().getFrame(),
                    warning,
                    ClientContext.getFrameTitle(title),
                    JOptionPane.WARNING_MESSAGE);
            return false;
        }
        
        return true;
    }

    /**
     * 新規及び変更された傷病名を保存する。
     */
    @Override
    public void save() {

        // 空の場合
        if ((addedDiagnosis == null || addedDiagnosis.isEmpty()) &&
            (updatedDiagnosis == null || updatedDiagnosis.isEmpty())) {
//minagawa^ この処理が必要な場合はバグ
            if (boundSupport!=null) {
                setChartDocDidSave(true);
                return;
            }
//minagawa$
            return;
        }
        
        //final boolean sendDiagnosis = Project.getBoolean(Project.SEND_DIAGNOSIS) && ((ChartImpl) getContext()).getCLAIMListener() != null ? true : false;
        // 2012-07 Client送信|サーバー送信のケースがあるので変更
        // 評価でServer-ORCAのケースがある->Context側で考慮
        final boolean sendDiagnosis = getContext().isSendClaim();
        trace("sendDiagnosis = " + sendDiagnosis);

        // continue to save
        Date confirmed = new Date();
        trace("confirmed = " + confirmed);
        String confirmedStr = ModelUtils.getDateTimeAsString(confirmed);
        
        boolean go = true;
        
//s.oh^ 2014/03/13 傷病名削除診療科対応
        String deptCode = null;
        String deptName = null;
        if(getContext().getPatientVisit() != null && getContext().getPatientVisit().getDeptCode() != null && getContext().getPatientVisit().getDeptName() != null) {
            deptCode = getContext().getPatientVisit().getDeptCode();
            deptName = getContext().getPatientVisit().getDeptName();
        }else if(Project.getUserModel() != null && Project.getUserModel().getDepartmentModel() != null && Project.getUserModel().getDepartmentModel().getDepartment() != null && Project.getUserModel().getDepartmentModel().getDepartmentDesc() != null) {
            deptCode = Project.getUserModel().getDepartmentModel().getDepartment();
            deptName = Project.getUserModel().getDepartmentModel().getDepartmentDesc();
        }else{
        }
//s.oh$

        if (addedDiagnosis != null && addedDiagnosis.size() > 0) {

            for (RegisteredDiagnosisModel rd : addedDiagnosis) {
                
                trace("added rd = " + rd.getDiagnosis());
                trace("id = " + rd.getId());

                // 開始日、終了日はテーブルから取得している
                // TODO confirmed, recorded
                rd.setKarteBean(getContext().getKarte());       // Karte
                rd.setUserModel(Project.getUserModel());        // Creator
                rd.setConfirmed(confirmed);                     // 確定日
                rd.setRecorded(confirmed);                      // 記録日

//minagawa^ 2013/04/17 ORCAから取り込んだ病名を保存できない(副作用ありそう...)
//              // DORCA || DORCA_UPDATE 病名の status は変えない
//              if ((!isDorcaDisease(rd)) && (!isDorcaUpdatedDisease(rd))) {
//                  // Status Final を設定する
//                  rd.setStatus(IInfoModel.STATUS_FINAL);
//              }
//s.oh^ 2013/05/07 副作用があるため元に戻した。
                //rd.setStatus(IInfoModel.STATUS_FINAL);
                if ((!isDorcaDisease(rd)) && (!isDorcaUpdatedDisease(rd))) {
                    // Status Final を設定する
                    rd.setStatus(IInfoModel.STATUS_FINAL);
//s.oh^ 2013/05/10 傷病名対応
                }else{
                    rd.setStatus(IInfoModel.STATUS_FINAL);
//s.oh$
                }
//s.oh$
//minagawa$

                // 開始日=適合開始日 not-null
                if (rd.getStarted() == null) {
                    rd.setStarted(confirmed);
                }

                // TODO トラフィック
                rd.setPatientLiteModel(getContext().getPatient().patientAsLiteModel());
                rd.setUserLiteModel(Project.getUserModel().getLiteModel());
                
//s.oh^ 2014/03/13 傷病名削除診療科対応
//                if(rd.getDepartment() != null && rd.getDepartmentDesc() == null) {
//                    if(Project.getDeptInfo() == null || Project.getDeptInfo().size() <= 0) {
//                        JOptionPane.showMessageDialog(getContext().getFrame(), "ORCAから診療科の取得に失敗したため、診療科は保存されません。", "傷病名の保存", JOptionPane.INFORMATION_MESSAGE);
//                        Log.outputFuncLog(Log.LOG_LEVEL_0, Log.FUNCTIONLOG_KIND_WARNING, "ORCAから診療科の取得に失敗したため、診療科は保存されません。", "傷病名の保存");
//                    }else{
//                        for(int i = 0; i < Project.getDeptInfo().size(); i++) {
//                            String tmp = Project.getDeptInfo().get(i);
//                            if(tmp.equals(rd.getDepartment())) {
//                                rd.setDepartmentDesc(Project.getDeptInfo().get(i+1));
//                                break;
//                            }
//                        }
//                    }
//                }else if(rd.getDepartment() != null && rd.getDepartmentDesc() != null) {
//                    // 既に傷病名に登録されているため何もしない
//                }else{
//                    rd.setDepartment(deptCode);
//                    rd.setDepartmentDesc(deptName);
//                }
                rd.setDepartment(deptCode);
                rd.setDepartmentDesc(deptName);
//s.oh$
                // 転帰をチェックする
                if (!isValidOutcome(rd)) {
                    go = false;
                    break;
                }
            }
        }
        
        if (!go) {
            return;
        }

        if (updatedDiagnosis != null && updatedDiagnosis.size() > 0) {

            for (RegisteredDiagnosisModel rd : updatedDiagnosis) {
                
                trace("updated rd = " + rd.getDiagnosis());
                trace("id = " + rd.getId());

                // 現バージョンは上書きしている
                rd.setKarteBean(getContext().getKarte());           // Karte
                rd.setUserModel(Project.getUserModel());            // Creator
                rd.setConfirmed(confirmed);
                rd.setRecorded(confirmed);
                // updatedList へ入っているのは detuched object のみ
                rd.setStatus(IInfoModel.STATUS_FINAL);

                // TODO トラフィック
                rd.setPatientLiteModel(getContext().getPatient().patientAsLiteModel());
                rd.setUserLiteModel(Project.getUserModel().getLiteModel());
                
//s.oh^ 2014/03/13 傷病名削除診療科対応
//                if(rd.getDepartment() != null && rd.getDepartmentDesc() == null) {
//                    if(Project.getDeptInfo() == null || Project.getDeptInfo().size() <= 0) {
//                        JOptionPane.showMessageDialog(getContext().getFrame(), "ORCAから診療科の取得に失敗したため、診療科は保存されません。", "傷病名の保存", JOptionPane.INFORMATION_MESSAGE);
//                        Log.outputFuncLog(Log.LOG_LEVEL_0, Log.FUNCTIONLOG_KIND_WARNING, "ORCAから診療科の取得に失敗したため、診療科は保存されません。", "傷病名の保存");
//                    }else{
//                        for(int i = 0; i < Project.getDeptInfo().size(); i++) {
//                            String tmp = Project.getDeptInfo().get(i);
//                            if(tmp.equals(rd.getDepartment())) {
//                                rd.setDepartmentDesc(Project.getDeptInfo().get(i+1));
//                            }
//                        }
//                    }
//                }else if(rd.getDepartment() != null && rd.getDepartmentDesc() != null) {
//                    // 既に傷病名に登録されているため何もしない
//                }else{
//                    rd.setDepartment(deptCode);
//                    rd.setDepartmentDesc(deptName);
//                }
                rd.setDepartment(deptCode);
                rd.setDepartmentDesc(deptName);
//s.oh$ 
                // 転帰をチェックする
                if (!isValidOutcome(rd)) {
                    go = false;
                    break;
                }
            }
        }
        
        if (!go) {
            return;
        }

        DocumentDelegater ddl = new DocumentDelegater();
//s.oh^ 2014/04/08 傷病名対応
        //DiagnosisPutTask task = new DiagnosisPutTask(confirmedStr, getContext(), addedDiagnosis, updatedDiagnosis, sendDiagnosis, ddl);
        DiagnosisPutTask task = new DiagnosisPutTask(confirmedStr, getContext(), addedDiagnosis, updatedDiagnosis, (saveOnly) ? false : sendDiagnosis, ddl);
//s.oh$
        task.execute();
    }
    
    /**
     * PPane病名をインポートする。
     */
    public void addDroppedDiagnosis() {
        
        List<ModuleInfoBean> list = getContext().getDroppedDiagnosisList();
        if (list!=null && list.size()>0) {
            // clone
            List<ModuleInfoBean> list2;
            synchronized (list) {
                list2 = new ArrayList<>(list.size());
                while (list.size()>0) {
                    list2.add(list.remove(0));
                }
            }
            importStampList(list2, 0);
        // 傷病名の削除(GUI) 2013/06/24
        } else {
            // call されないので
            controllActions();
        }
    }

    /**
     * 指定期間以降の傷病名を検索してテーブルへ表示する。
     * バッググランドスレッドで実行される。
     */
    //public void getDiagnosisHistory(final Date past) {
    public void getDiagnosisHistory() {

        NameValuePair pair = (NameValuePair) extractionCombo.getSelectedItem();
        int past = Integer.parseInt(pair.getValue());
        if (past != 0) {
            GregorianCalendar today = new GregorianCalendar();
            today.add(GregorianCalendar.MONTH, past);
            today.clear(Calendar.HOUR_OF_DAY);
            today.clear(Calendar.MINUTE);
            today.clear(Calendar.SECOND);
            today.clear(Calendar.MILLISECOND);
            searchFrom = today.getTime();
        } else {
            searchFrom = new Date(0L);
        }
        
        // clear
        if (addedDiagnosis!=null && addedDiagnosis.size()>0) {
            addedDiagnosis.clear();
        }
        if (updatedDiagnosis!=null && updatedDiagnosis.size()>0) {
            updatedDiagnosis.clear();
        }
        orcaDiceaseHasImported=false;
        if (tableModel.getDataProvider()!=null) {
            tableModel.getDataProvider().clear();
        }
        disableActions();
        
        DBTask task = new DBTask<List<RegisteredDiagnosisModel>, Void>(getContext()) {

            @Override
            protected List<RegisteredDiagnosisModel> doInBackground() throws Exception {
                DocumentDelegater ddl = new DocumentDelegater();
                List<RegisteredDiagnosisModel> result = ddl.getDiagnosisList(getContext().getKarte().getId(), searchFrom, activeOnly);
                return result;
            }

            @Override
            protected void succeeded(List<RegisteredDiagnosisModel> list) {
                if (list != null) {
                    if (ascend) {
                        Collections.sort(list);
                    } else {
                        Collections.sort(list, Collections.reverseOrder());
                    }
                    tableModel.setDataProvider(list);
                    setDiagnosisCount(list.size());
                    for(RegisteredDiagnosisModel rdm : list) {
                    }
                } else {
                    tableModel.setDataProvider(new ArrayList<>(2));
                    
                }
                addDroppedDiagnosis();             
            }
        };

        task.execute();
    }

    /**
     * 選択されている行をコピーする。
     */
    public void copyAsText() {
        StringBuilder sb = new StringBuilder();
        int numRows = diagTable.getSelectedRowCount();
        int[] rowsSelected = diagTable.getSelectedRows();
        int numColumns =   diagTable.getColumnCount();

        for (int i = 0; i < numRows; i++) {
            if (tableModel.getObject(rowsSelected[i]) != null) {
                StringBuilder s = new StringBuilder();
                for (int col = 0; col < numColumns; col++) {
                    Object o = diagTable.getValueAt(rowsSelected[i], col);
                    if (o!=null) {
                        s.append(o.toString());
                    }
                    s.append(",");
                }
                if (s.length()>0) {
                    s.setLength(s.length()-1);
                }
                sb.append(s.toString()).append("\n");
            }
        }
        if (sb.length() > 0) {
            StringSelection stsel = new StringSelection(sb.toString());
            Toolkit.getDefaultToolkit().getSystemClipboard().setContents(stsel, stsel);
        }
    }
    
    private boolean canPaste() {
        
        // Clipboard内のTransferable
        Transferable tr = Toolkit.getDefaultToolkit().getSystemClipboard().getContents(null);
        if (tr==null) {
            return false;
        }
        
        // 病名ペースト
        if (tr.isDataFlavorSupported(InfoModelTransferable.infoModelFlavor)) {
            return true;
        }
        
        // StampTreeNodeペースト
        if (tr.isDataFlavorSupported(LocalStampTreeNodeTransferable.localStampTreeNodeFlavor)) {
            try {
                StampTreeNode node = (StampTreeNode)tr.getTransferData(LocalStampTreeNodeTransferable.localStampTreeNodeFlavor);
                boolean ok = node.isLeaf();
                ok = ok && (((ModuleInfoBean)node.getUserObject()).getEntity().equals(IInfoModel.ENTITY_DIAGNOSIS));
                return ok;
                
            } catch (UnsupportedFlavorException | IOException ex) {
                ex.printStackTrace(System.err);
            }
        }
        
        return false;
    }

//minagawa^ LSC 1.4 傷病名の削除(GUI) 2013/06/24
    public void delete2() {
        
        // 選択された行のオブジェクトを取得する
        final int row = diagTable.getSelectedRow();
        final RegisteredDiagnosisModel model = (RegisteredDiagnosisModel)tableModel.getObject(row);
        if (model==null) {
            return;
        }
        
//s.oh^ 2014/04/08 傷病名対応
//        String yes = "はい";
//        String no = "いいえ";
//        String title = "傷病名削除";
//        Object[] options = new Object[]{yes, no};
//        String msg = "この傷病名を削除しますか？　\n" + model.getDiagnosisName();
        java.util.ResourceBundle bundle = ClientContext.getMyBundle(DiagnosisDocument.class);
        String optionDelete = bundle.getString("optionText.delete");
        String optionCancel = GUIFactory.getCancelButtonText();
        Object[] options = new Object[]{optionDelete, optionCancel};
        
        String title = bundle.getString("title.optionPane.delete");
        title = ClientContext.getFrameTitle(title);
        
        String msgFormat = bundle.getString("messageFormat.deleteDiagnosis");
        MessageFormat msf = new MessageFormat(msgFormat);
        String msg = msf.format(new Object[]{model.getDiagnosisName()});
        
        int select = JOptionPane.showOptionDialog(
                getContext().getFrame(),
                msg,
                title,
                JOptionPane.YES_NO_CANCEL_OPTION,
                JOptionPane.QUESTION_MESSAGE,
                null,
                options,
                optionCancel);
        if(select != 0) {
            return;
        }
//s.oh$
        
//s.oh^ 2014/03/13 傷病名削除診療科対応
//        if(model.getDepartment() == null || model.getDepartmentDesc() == null) {
//            if(Project.getDeptInfo() != null && Project.getDeptInfo().size() > 0) {
//                Object[] deptNames = Project.getDeptInfo().toArray();
//                Object dept = JOptionPane.showInputDialog(getContext().getFrame(), "診療科を選択してください。", "傷病名の削除", JOptionPane.INFORMATION_MESSAGE, null, deptNames, deptNames[0]);
//                if(dept == null || dept.toString().length() <= 0) {
//                    //JOptionPane.showMessageDialog(getContext().getFrame(), "", "傷病名の削除", JOptionPane.INFORMATION_MESSAGE);
//                    Log.outputFuncLog(Log.LOG_LEVEL_0, Log.FUNCTIONLOG_KIND_INFORMATION, "診療科を選択してください", "傷病名の削除", "キャンセルを押されました");
//                    return;
//                }
//                Log.outputFuncLog(Log.LOG_LEVEL_0, Log.FUNCTIONLOG_KIND_INFORMATION, "診療科を選択してください", "傷病名の削除", dept.toString());
//                String[] deptInfo = dept.toString().split(":");
//                model.setDepartment(deptInfo[0]);
//                model.setDepartmentDesc(deptInfo[1]);
//            }else{
//                JOptionPane.showMessageDialog(getContext().getFrame(), "ORCAから診療科の取得に失敗したため、ログインユーザーの診療科で送信されます。", "傷病名の削除", JOptionPane.INFORMATION_MESSAGE);
//                Log.outputFuncLog(Log.LOG_LEVEL_0, Log.FUNCTIONLOG_KIND_WARNING, "ORCAから診療科の取得に失敗したため、ログインユーザーの診療科で送信されます。", "傷病名の削除");
//                model.setDepartment(Project.getUserModel().getDepartmentModel().getDepartment());
//                model.setDepartmentDesc(Project.getUserModel().getDepartmentModel().getDepartmentDesc());
//            }
//        }
//s.oh$
        // まだデータベースに登録されていないデータの場合
        if (model.getId()==0L) {
            int indexToremove = -1;
            for (int i = 0; i <addedDiagnosis.size(); i++) {
                RegisteredDiagnosisModel r = addedDiagnosis.get(i);
                if (r==model) {
                    indexToremove = i;
                    break;
                }
            }
            if (indexToremove>=0 && indexToremove<addedDiagnosis.size()) {
                addedDiagnosis.remove(indexToremove);
            }
            tableModel.deleteAt(row);
            controllActions();       
            return;
        }
        
        // ディタッチオブジェクトの場合はデータベースから削除する
        // && 転帰を delete にして ORCA へ 送信する
        Date confirmed = new Date();
        final String confirmedStr = ModelUtils.getDateTimeAsString(confirmed);
        model.setOutcome("delete");
        model.setOutcomeDesc("delete");
        model.setOutcomeCodeSys(ClientContext.getString("diagnosis.outcomeCodeSys"));
//s.oh^ 2014/01/28 傷病名削除不具合
        //model.setEndDate(confirmedStr);
//s.oh$
        model.setKarteBean(getContext().getKarte());       // Karte
        model.setUserModel(Project.getUserModel());        // Creator
        model.setConfirmed(confirmed);                     // 確定日
        model.setRecorded(confirmed);                      // 記録日
        final List<RegisteredDiagnosisModel> list = new ArrayList(1);
//s.oh^ 2014/01/28 傷病名削除不具合
        model.setPatientLiteModel(getContext().getPatient().patientAsLiteModel());
//s.oh$
        list.add(model);
        
        DBTask task = new DBTask<Void, Void>(getContext()) {

            @Override
            protected Void doInBackground() throws Exception {
                
                // 送信ラッパーを生成する
                DiagnosisSendWrapper wrapper = new DiagnosisSendWrapper();
                wrapper.setDeletedDiagnosis(list);
                
//s.oh^ 2014/03/13 傷病名削除診療科対応(送信しないように変更)
                //boolean sendDiagnosis = getContext().isSendClaim();
                boolean sendDiagnosis = false;
//s.oh$

                // 全てのモジュールで共通に使用するマスターのDocInfoを生成する
                // 病名は複数あるので個々にDocInfoが必要。これはJMS側で生成する。
                if (sendDiagnosis) {

                    // 送信フラグ & 確定日
                    wrapper.setSendClaim(true);
                    wrapper.setConfirmDate(confirmedStr);

                    // 生成目的
                    java.util.ResourceBundle mBundle = ClientContext.getBundle();
                    wrapper.setTitle(mBundle.getString("DEFAULT_DIAGNOSIS_TITLE"));
                    wrapper.setPurpose(IInfoModel.PURPOSE_RECORD);

                    //-------------------------------------------------------------------
                    // 2012-05 クレーム送信をJMS+MDB化: ChartImplの新規カルテモデルの生成と同じ
                    //-------------------------------------------------------------------              
                    // 診療科関連
                    wrapper.setDepartment(getContext().getPatientVisit().getDeptCode());
                    wrapper.setDepartmentDesc(getContext().getPatientVisit().getDeptName());

                    // 担当医関連
                    wrapper.setCreatorName(Project.getUserModel().getCommonName());        // 担当医名
                    if (Project.getUserModel().getOrcaId()!=null) {
                        wrapper.setCreatorId(Project.getUserModel().getOrcaId());          // 担当医コード: ORCA ID がある場合
                    } else if (getContext().getPatientVisit().getDoctorId()!=null) {
                        wrapper.setCreatorId(getContext().getPatientVisit().getDoctorId());// 担当医コード: 受付でIDがある場合
                    } else {
                        wrapper.setCreatorId(Project.getUserModel().getUserId());          // 担当医コード: ログインユーザーID
                    }
                    wrapper.setCreatorLicense(Project.getUserModel().getLicenseModel().getLicense());   // 医療資格

                    // 施設関連
                    wrapper.setFacilityName(Project.getUserModel().getFacilityModel().getFacilityName());
                    wrapper.setJamariCode(getContext().getPatientVisit().getJmariNumber());

                    // ログ情報のために追加
                    String pid = getContext().getPatientVisit().getPatientId();
                    wrapper.setPatientId(pid);
                    wrapper.setPatientName(getContext().getPatient().getFullName());
                    wrapper.setPatientGender(getContext().getPatient().getGender());
                }

                // 保存 & claimSender=server の場合はこれで送信される
                new DocumentDelegater().postPutSendDiagnosis(wrapper);

                // Clientで送信する場合を追加
                if (Project.claimSenderIsClient() && sendDiagnosis) {
                    IDiagnosisSender sender = new DiagnosisSender();
                    sender.setContext(getContext());
                    sender.prepare(list);
                    sender.send(list);
                }
            
                return null;
            }
            
            @Override
            protected void succeeded(Void result) {
                // 更新リストにある場合取り除く
                if (updatedDiagnosis != null) {
                    int indexToremove = -1;
                    for (int i = 0; i <updatedDiagnosis.size(); i++) {
                        RegisteredDiagnosisModel r = updatedDiagnosis.get(i);
                        if (r==model) {
                            indexToremove = i;
                            break;
                        }
                    }

                    if (indexToremove>=0 && indexToremove<updatedDiagnosis.size()) {
                        updatedDiagnosis.remove(indexToremove);
                    }
                }
                // tableから remove
                tableModel.deleteAt(row);
                
                // action 更新
                controllActions();
            }
        };
        
        task.execute();
    }

//    /**
//     * 選択された行のデータを削除する。
//     */
//    public void delete() {
//
//        // 選択された行のオブジェクトを取得する
//        final int row = diagTable.getSelectedRow();
//        final RegisteredDiagnosisModel model = (RegisteredDiagnosisModel)tableModel.getObject(row);
//        if (model==null) {
//            return;
//        }
//
//        // まだデータベースに登録されていないデータの場合
//        // テーブルから削除してリターンする
//        if (model.getId()==0L) {
//            //----------------------------------------------------
//            // ???? addedDiagnosis.remove(model)!=valid
//            //----------------------------------------------------
//            int indexToremove = -1;
//            for (int i = 0; i <addedDiagnosis.size(); i++) {
//                RegisteredDiagnosisModel r = addedDiagnosis.get(i);
//                if (r==model) {
//                    indexToremove = i;
//                    break;
//                }
//            }
//
//            trace("indexToremove=" + indexToremove);
//
//            if (indexToremove>=0 && indexToremove<addedDiagnosis.size()) {
//                addedDiagnosis.remove(indexToremove);
//            }
//            tableModel.deleteAt(row);
////minagawa^ LSC 1.4 bug fix            
//            //controlUpdateAction();
//            controllActions();
////minagawa$             
//            return;
//        }
//
//        // ディタッチオブジェクトの場合はデータベースから削除する
//        // 削除の場合はその場でデータベースの更新を行う 2006-03-25
//        final List<Long> list = new ArrayList(1);
//        list.add(new Long(model.getId()));
//
//        DBTask task = new DBTask<Void, Void>(getContext()) {
//
//            @Override
//            protected Void doInBackground() throws Exception {
//                DocumentDelegater ddl = new DocumentDelegater();
//                ddl.removeDiagnosis(list);
//                return null;
//            }
//
//            @Override
//            protected void succeeded(Void result) {
//                // 更新リストにある場合
//                // 更新リストから取り除く
//                if (updatedDiagnosis != null) {
//                    //----------------------------------------------------
//                    // ???? updatedDiagnosis.remove(model)!=valid
//                    //----------------------------------------------------
//                    int indexToremove = -1;
//                    for (int i = 0; i <updatedDiagnosis.size(); i++) {
//                        RegisteredDiagnosisModel r = updatedDiagnosis.get(i);
//                        if (r==model) {
//                            indexToremove = i;
//                            break;
//                        }
//                    }
//
//                    trace("indexToremove=" + indexToremove);
//
//                    if (indexToremove>=0 && indexToremove<updatedDiagnosis.size()) {
//                        updatedDiagnosis.remove(indexToremove);
//                    }
//                }
//                tableModel.deleteAt(row);
// //minagawa^ LSC 1.4 bug fix            
//            //controlUpdateAction();
//            controllActions();
////minagawa$ 
//            }
//        };
//
//        task.execute();
//    }

//    /**
//     * ORCAに登録されている病名を取り込む。（テーブルへ追加する）
//     * 検索後、ボタンを disabled にする。
//     */
//    public void viewOrca() {
//
//        // 患者IDを取得する
//        final String patientId = getContext().getPatient().getPatientId();
//
//        // 抽出期間から検索範囲の最初の日を取得する
//        NameValuePair pair = (NameValuePair) extractionCombo.getSelectedItem();
//        int past = Integer.parseInt(pair.getValue());
//
//        // 検索開始日
//        Date date = null;
//        if (past != 0) {
//            GregorianCalendar today = new GregorianCalendar();
//            today.add(GregorianCalendar.MONTH, past);
//            today.clear(Calendar.HOUR_OF_DAY);
//            today.clear(Calendar.MINUTE);
//            today.clear(Calendar.SECOND);
//            today.clear(Calendar.MILLISECOND);
//            date = today.getTime();
//        } else {
//            // 増田内科
//            date = new Date(0L);
//        }
//        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
//        final String from = sdf.format(date);
//
//        // 検索終了日=今日
//        final String to = sdf.format(new Date());
//        ClientContext.getBootLogger().debug("from = " + from);
//        ClientContext.getBootLogger().debug("to = " + to);
//
//        DBTask task = new DBTask<List<RegisteredDiagnosisModel>, Void>(getContext()) {
//
//            @Override
//            protected List<RegisteredDiagnosisModel> doInBackground() throws Exception {
//                SqlOrcaView dao = new SqlOrcaView();
//                List<RegisteredDiagnosisModel> result = dao.getOrcaDisease(patientId, from, to, ascend);
//                if (dao.isNoError()) {
//                    return result;
//                } else {
//                    throw new Exception(dao.getErrorMessage());
//                }
//            }
//
//            @Override
//            protected void succeeded(List<RegisteredDiagnosisModel> result) {
//
//                // 空ならリターーンするしかない
//                if (result==null || result.isEmpty()) {
//                    orcaAction.setEnabled(true);
//                    return;
//                }
//
//                // Dolphinに病名が登録されている場合は単純に参照として追加する
//                if (diagnosisCount!=0) {
//                    refferenceAddOrca(result);
//                    return;
//                }
//
//                //-------------------------------------------
//                // diagnosisCount==0 && !result.isEmpty()
//                // ORCAに登録してある病名を取り込むかどうかを選択させる
//                // 取り込む場合は status をクリアし + または DnD された
//                // 新規病名として扱う
//                // 取り込まない場合はそのままtableに追加する。
//                //-------------------------------------------
//                if (diagnosisCount==0) {
//                    String importYes = "取り込む";
//                    String importNo = "参照のみ";
//                    String title = "病名取り込み";
//                    Object[] cstOptions = new Object[]{importYes, importNo};
//
//                    String msg = "ORCAに登録してある病名を取り込みますか?";
//                    int select = JOptionPane.showOptionDialog(
//                            getContext().getFrame(),
//                            msg,
//                            ClientContext.getFrameTitle(title),
//                            JOptionPane.YES_NO_CANCEL_OPTION,
//                            JOptionPane.QUESTION_MESSAGE,
//                            ClientContext.getImageIcon("impt_32.gif"),
//                            cstOptions,
//                            importYes);
//
//                    if (select == 0) {
//                        // 取り込む -> DORCA 病名にする
//                        for (RegisteredDiagnosisModel rdm : result) {
//                            rdm.setStatus(DORCA_RECORD);
//                        }
//                        // 新規病名リストに追加する
//                        addAllAddedList(result);
//                        // disabledにする
//                        orcaAction.setEnabled(false);
//                        extractionCombo.setEnabled(false);
//                        //--------------------------------------------------------
//                        // もしtableに病名レコードがあれば（+ or DnD diagCount=0 で追加）
//                        // 全体をソートする
//                        //--------------------------------------------------------
//                        List<RegisteredDiagnosisModel> data = tableModel.getDataProvider();
//                        if (data!=null) {
//                            data.addAll(result);
//                            sortDiasease(data);
//                            tableModel.fireTableDataChanged();
//
//                        } else {
//                            sortDiasease(result);
//                            tableModel.setDataProvider(result);
//                        }
//
//                    } else {
//                        // 参照追加する
//                        refferenceAddOrca(result);
//                    }
//                }
//            }
//        };
//
//        task.execute();
//    }


    public void viewOrca() {

        // 患者IDを取得する
        final String patientId = getContext().getPatient().getPatientId();

        DBTask task = new DBTask<List<RegisteredDiagnosisModel>, Void>(getContext()) {

            @Override
            protected List<RegisteredDiagnosisModel> doInBackground() throws Exception {
                //SqlOrcaView dao = new SqlOrcaView();
                OrcaDelegater dao = OrcaDelegaterFactory.create();
                
                List<RegisteredDiagnosisModel> result = dao.getActiveOrcaDisease(patientId,ascend);
                return result;
            }

            @Override
            protected void succeeded(List<RegisteredDiagnosisModel> result) {

                // 空ならリターーンするしかない
                if (result==null || result.isEmpty()) {
                    orcaDiceaseHasImported = true;
                    controllActions();   
                    return;
                }

                // Dolphinに病名が登録されている場合は単純に参照として追加する
                if (diagnosisCount!=0) {
                    refferenceAddOrca(result);
                    return;
                }

                //-------------------------------------------
                // diagnosisCount==0 && !result.isEmpty()
                // ORCAに登録してある病名を取り込むかどうかを選択させる
                // 取り込む場合は status をクリアし + または DnD された
                // 新規病名として扱う
                // 取り込まない場合はそのままtableに追加する。
                //-------------------------------------------
                if (diagnosisCount==0) {
                    java.util.ResourceBundle bundle = ClientContext.getMyBundle(DiagnosisDocument.class);
                    String importYes = bundle.getString("optionText.import");
                    String importNo = bundle.getString("optionText.reference");
                    String title = bundle.getString("dialogText.importDiagnosis");
                    Object[] cstOptions = new Object[]{importYes, importNo};

                    String msg = bundle.getString("message.importOrcaDiagnosis");
                    int select = JOptionPane.showOptionDialog(
                            getContext().getFrame(),
                            msg,
                            ClientContext.getFrameTitle(title),
                            JOptionPane.YES_NO_CANCEL_OPTION,
                            JOptionPane.QUESTION_MESSAGE,
                            null,   
                            cstOptions,
                            importYes);

                    if (select == 0) {
                        // 取り込む -> DORCA 病名にする
                        for (RegisteredDiagnosisModel rdm : result) {
                            rdm.setStatus(DORCA_RECORD);
//s.oh^ 2014/03/13 傷病名削除診療科対応
//                            ArrayList<String> deptInfo = Project.getDeptInfo();
//                            if(deptInfo != null && deptInfo.size() > 0) {
//                                for(int i = 0; i < deptInfo.size(); i++) {
//                                    String[] dept = deptInfo.get(i).split(":");
//                                    if(dept.length == 2) {
//                                        if(rdm.getDepartment().equals(dept[0])) {
//                                            rdm.setDepartmentDesc(dept[1]);
//                                            break;
//                                        }
//                                    }
//                                }
//                            }
//                            Log.outputFuncLog(Log.LOG_LEVEL_3, Log.FUNCTIONLOG_KIND_INFORMATION, "ORCAから追加した傷病名の診療科情報：", rdm.getDepartment(), rdm.getDepartmentDesc());
//s.oh$
                        }
                        // 新規病名リストに追加する
                        addAllAddedList(result);                     
                        extractionCombo.setEnabled(false);
                        //--------------------------------------------------------
                        // もしtableに病名レコードがあれば（+ or DnD diagCount=0 で追加）
                        // 全体をソートする
                        //--------------------------------------------------------
                        List<RegisteredDiagnosisModel> data = tableModel.getDataProvider();
                        if (data!=null) {
                            data.addAll(result);
                            sortDiasease(data);
                            tableModel.fireTableDataChanged();

                        } else {
                            //sortDiasease(result);
                            tableModel.setDataProvider(result);
                        }
                        
//s.oh^ 2014/04/08 傷病名対応
                        //JOptionPane.showMessageDialog(getContext().getFrame(), "取り込みが完了しました、傷病名を保存してください。", "傷病名の取り込み", JOptionPane.INFORMATION_MESSAGE);
                        //Log.outputFuncLog(Log.LOG_LEVEL_0, Log.FUNCTIONLOG_KIND_INFORMATION, "傷病名の取り込み", "取り込みが完了しました、傷病名を保存してください。");
                        saveOnly = true;
                        save();
                        saveOnly = false;
                        msg = bundle.getString("message.savingDiagnsosis");
                        title = bundle.getString("dialogText.importDicease");
                        title = ClientContext.getFrameTitle(title);
                        JOptionPane.showMessageDialog(getContext().getFrame(), msg, title, JOptionPane.INFORMATION_MESSAGE);
//s.oh$

                    } else if (select == 1){
                        // 参照追加する
                        refferenceAddOrca(result);
                    } else {
                    }
                }
            }
        };

        task.execute();
    }

    // ORCA病名を傷病名テーブルに参照追加する
    private void refferenceAddOrca(List<RegisteredDiagnosisModel> result) {
        tableModel.addAll(result);
        orcaDiceaseHasImported=true;
        controllActions();       
    }

    private void sortDiasease(List<RegisteredDiagnosisModel> data) {
        if (ascend) {
            Collections.sort(data);
        } else {
            Collections.sort(data, Collections.reverseOrder());
        }
    }

    /**
     * 選択された診断を CLAIM 送信する
     * 元町皮ふ科
     */
    public void sendClaim() {
        
        // 選択された診断を CLAIM 送信する
        RegisteredDiagnosisModel rd;
        List diagList = new ArrayList();
        Date confirmed = new Date();
        int rows[] = diagTable.getSelectedRows();
        for (int row : rows) {
            rd = (RegisteredDiagnosisModel) tableModel.getObject(row);
            rd.setKarteBean(getContext().getKarte());           // Karte
            rd.setUserModel(Project.getUserModel());          // Creator
            rd.setConfirmed(confirmed);                     // 確定日
            rd.setRecorded(confirmed);                      // 記録日
            // 開始日=適合開始日 not-null
            if (rd.getStarted() == null) {
              rd.setStarted(confirmed);
            }
            rd.setPatientLiteModel(getContext().getPatient().patientAsLiteModel());
            rd.setUserLiteModel(Project.getUserModel().getLiteModel());

            // 転帰をチェックする
            if (!isValidOutcome(rd)) return;

            diagList.add(rd);
        }

        if (!diagList.isEmpty()) {
            IDiagnosisSender sender = new DiagnosisSender();
            sender.setContext(getContext());
            sender.prepare(diagList);
            sender.send(diagList);
        }
    }
    
    private void trace(String msg) {
        if (DEBUG) {
            System.err.println(msg);
        }
    }
    
    /**
     * PopupListener
     */
    class PopupListener extends MouseAdapter implements PropertyChangeListener {

        private JPopupMenu popup;
        private final JTextField tf;
        private final int[] range;

        public PopupListener(JTextField tf, int[] range) {
            this.tf = tf;
            this.range = range;
            tf.addMouseListener(PopupListener.this);
        }        

        @Override
        public void mousePressed(MouseEvent e) {
            maybeShowPopup(e);
        }

        @Override
        public void mouseReleased(MouseEvent e) {
            maybeShowPopup(e);
        }

        private void maybeShowPopup(MouseEvent e) {

            if (e.isPopupTrigger()) {
                popup = new JPopupMenu();
                popup.addPopupMenuListener(new PopupMenuListener() {
                    @Override
                    public void popupMenuWillBecomeVisible(PopupMenuEvent e) {
                        underPopup=true;
                    }
                    @Override
                    public void popupMenuWillBecomeInvisible(PopupMenuEvent e) {
                        underPopup=false;
                    }
                    @Override
                    public void popupMenuCanceled(PopupMenuEvent e) {
                        underPopup=false;
                    }
                });
                CalendarCardPanel cc = new CalendarCardPanel(ClientContext.getEventColorTable());
                cc.addPropertyChangeListener(CalendarCardPanel.PICKED_DATE, this);
                cc.setCalendarRange(range);           
                popup.insert(cc, 0);
                popup.show(e.getComponent(), e.getX(), e.getY());
            }
        }

        @Override
        public void propertyChange(PropertyChangeEvent e) {
            if (e.getPropertyName().equals(CalendarCardPanel.PICKED_DATE)) {
                SimpleDate sd = (SimpleDate) e.getNewValue();
                tf.setText(SimpleDate.simpleDateToMmldate(sd));
                popup.setVisible(false);
                popup = null;
            }
        }
    }

    /**
     * DiagnosisPutTask
     */
    class DiagnosisPutTask extends DBTask<List<Long>, Void> {
        
        // 確定日
        private final String confirmedStr;

        // 新規に追加された病名のリスト
        private final List<RegisteredDiagnosisModel> added;
        
        // 転帰等、更新された病名のリスト
        private final List<RegisteredDiagnosisModel> updated;
        
        // CLAIM送信を行う時 true
        private final boolean sendClaim;
        
        // Delegater 
        private final DocumentDelegater ddl;

        public DiagnosisPutTask(
                String confirmedStr,
                Chart chart,
                List<RegisteredDiagnosisModel> added,
                List<RegisteredDiagnosisModel> updated,
                boolean sendClaim,
                DocumentDelegater ddl) {

            super(chart);
            this.confirmedStr = confirmedStr;
            this.added = added;
            this.updated = updated;
            this.sendClaim = sendClaim;
            this.ddl = ddl;
        }

        @Override
        protected List<Long> doInBackground() throws Exception {
            
            boolean hasAdded = (addedDiagnosis!=null && addedDiagnosis.size()>0);
            boolean hasUpdated = (updatedDiagnosis!=null && updatedDiagnosis.size()>0);
            
            if ( (!hasAdded) && (!hasUpdated)) {
                String err = ClientContext.getMyBundle(DiagnosisDocument.class).getString("errMessage.noDiagnosis.toSend");
                throw new RuntimeException(err);
            }
            
            // 送信ラッパーを生成する
            DiagnosisSendWrapper wrapper = new DiagnosisSendWrapper();
            
            if (hasAdded) {
                wrapper.setAddedDiagnosis(addedDiagnosis);
            }
            
            if (hasUpdated) {
                wrapper.setUpdatedDiagnosis(updatedDiagnosis);
            }
            
            // 全てのモジュールで共通に使用するマスターのDocInfoを生成する
            // 病名は複数あるので個々にDocInfoが必要。これはJMS側で生成する。
            if (sendClaim) {
                
                // 送信フラグ & 確定日
                wrapper.setSendClaim(true);
                wrapper.setConfirmDate(confirmedStr);
                
                // 生成目的
                java.util.ResourceBundle mBundle = ClientContext.getBundle();
                wrapper.setTitle(mBundle.getString("DEFAULT_DIAGNOSIS_TITLE"));
                wrapper.setPurpose(IInfoModel.PURPOSE_RECORD);
                
                //-------------------------------------------------------------------
                // 2012-05 クレーム送信をJMS+MDB化: ChartImplの新規カルテモデルの生成と同じ
                //-------------------------------------------------------------------              
                // 診療科関連
                wrapper.setDepartment(getContext().getPatientVisit().getDeptCode());
                wrapper.setDepartmentDesc(getContext().getPatientVisit().getDeptName());
                
                // 担当医関連
                wrapper.setCreatorName(Project.getUserModel().getCommonName());        // 担当医名
                if (Project.getUserModel().getOrcaId()!=null) {
                    wrapper.setCreatorId(Project.getUserModel().getOrcaId());          // 担当医コード: ORCA ID がある場合
                } else if (getContext().getPatientVisit().getDoctorId()!=null) {
                    wrapper.setCreatorId(getContext().getPatientVisit().getDoctorId());// 担当医コード: 受付でIDがある場合
                } else {
                    wrapper.setCreatorId(Project.getUserModel().getUserId());          // 担当医コード: ログインユーザーID
                }
                wrapper.setCreatorLicense(Project.getUserModel().getLicenseModel().getLicense());   // 医療資格
                
                // 施設関連
                wrapper.setFacilityName(Project.getUserModel().getFacilityModel().getFacilityName());
                wrapper.setJamariCode(getContext().getPatientVisit().getJmariNumber());
                
                // ログ情報のために追加
                String pid = getContext().getPatientVisit().getPatientId();
                wrapper.setPatientId(pid);
                wrapper.setPatientName(getContext().getPatient().getFullName());
                wrapper.setPatientGender(getContext().getPatient().getGender());
            }
            
            // 保存 & claimSender=server の場合はこれで送信される
            List<Long> result = ddl.postPutSendDiagnosis(wrapper);
            
            // 2012-07 Clientで送信する場合を追加
            if (Project.claimSenderIsClient() && sendClaim) {
                sendDiagnosisClaim();
            }
            
            return result;
        }
        
        private void sendDiagnosisClaim() {
            // CLAIM 送信の sender を作成
            //ClaimSender sender = new ClaimSender(((ChartImpl) getContext()).getCLAIMListener());
            //sender.setPatientVisitModel(getContext().getPatientVisit());
            IDiagnosisSender sender = new DiagnosisSender();
            sender.setContext(getContext());

            // 元町皮ふ科
            // 追加病名を CLAIM 送信する
            // その際、DORCA病名を覗く（これはORCAにあってDolphinにインポートされ、転帰等の変更がないもの）
            if (sendClaim && addedDiagnosis != null && addedDiagnosis.size() > 0) {
                List<RegisteredDiagnosisModel> actualList = new ArrayList<>();
                for (RegisteredDiagnosisModel rdm : addedDiagnosis) {
                    if (isDorcaUpdatedDisease(rdm) || isPureDisease(rdm)) {
//s.oh^ 2013/05/10 傷病名対応
                        rdm.setDiagnosisCode(HAND_CODE); // ORCAから取り込んだ場合、コードに0000999を設定する
//s.oh$
                        actualList.add(rdm);
                    }
                }
                if (!actualList.isEmpty()) {
                    if (DEBUG) {
                        trace("-------- Send Diagnosis List ----------------");
                        for (RegisteredDiagnosisModel r : actualList) {
                            trace(r.getDiagnosis());
                        }
                    }
//s.oh^ 2014/11/11 傷病名送信順番の変更
                    Collections.sort(actualList, new DiagnosisSendComparator());
//s.oh$
                    sender.prepare(actualList);
                    sender.send(actualList);
                }
            }

            // 更新された病名を CLAIM 送信する
            // detuched object のみ
            if (sendClaim && updatedDiagnosis != null && updatedDiagnosis.size() > 0) {
                List<RegisteredDiagnosisModel> actualList = new ArrayList<>();
                if (DEBUG) {
                    trace("-------- Send Diagnosis List ----------------");
                    for (RegisteredDiagnosisModel r : updatedDiagnosis) {
                        trace(r.getDiagnosis());
                    }
                }
//s.oh^ 2013/05/10 傷病名対応
                for (RegisteredDiagnosisModel rdm : updatedDiagnosis) {
                    rdm.setDiagnosisCode(HAND_CODE); // ORCAから取り込んだ場合、コードに0000999を設定する
                    actualList.add(rdm);
                }
//s.oh$
//s.oh^ 2014/11/11 傷病名送信順番の変更
                //sender.prepare(updatedDiagnosis);
                //sender.send(updatedDiagnosis);
                Collections.sort(actualList, new DiagnosisSendComparator());
                sender.prepare(actualList);
                sender.send(actualList);
//s.oh$
            }
        }
               
//        protected List<Long> doInBackgroundOld() throws Exception {
//
//            // 更新病名を更新する
//            if (updated != null && updated.size() > 0) {
//                ddl.updateDiagnosis(updated);
//            }
//
//            List<Long> result = null;
//
//            // 新規病名を保存する
//            if (added != null && added.size() > 0) {
//                result = ddl.putDiagnosis(added);
//                for (int i = 0; i < added.size(); i++) {
//                    long pk = result.get(i).longValue();
//                    RegisteredDiagnosisModel rd = (RegisteredDiagnosisModel) added.get(i);
//                    rd.setId(pk);
//                }
//            }
//
//            // CLAIM 送信の sender を作成
//            //ClaimSender sender = new ClaimSender(((ChartImpl) getContext()).getCLAIMListener());
//            //sender.setPatientVisitModel(getContext().getPatientVisit());
//            IDiagnosisSender sender = new DiagnosisSender();
//            sender.setContext(getContext());
//
//            // 元町皮ふ科
//            // 追加病名を CLAIM 送信する
//            // その際、DORCA病名を覗く（これはORCAにあってDolphinにインポートされ、転帰等の変更がないもの）
//            if (sendClaim && addedDiagnosis != null && addedDiagnosis.size() > 0) {
//                List<RegisteredDiagnosisModel> actualList = new ArrayList<RegisteredDiagnosisModel>();
//                for (RegisteredDiagnosisModel rdm : addedDiagnosis) {
//                    if (isDorcaUpdatedDisease(rdm) || isPureDisease(rdm)) {
//                        actualList.add(rdm);
//                    }
//                }
//                if (!actualList.isEmpty()) {
//                    if (DEBUG) {
//                        trace("-------- Send Diagnosis List ----------------");
//                        for (RegisteredDiagnosisModel r : actualList) {
//                            trace(r.getDiagnosis());
//                        }
//                    }
//                    sender.prepare(actualList);
//                    sender.send(actualList);
//                }
//            }
//
//            // 更新された病名を CLAIM 送信する
//            // detuched object のみ
//            if (sendClaim && updatedDiagnosis != null && updatedDiagnosis.size() > 0) {
//                if (DEBUG) {
//                    trace("-------- Send Diagnosis List ----------------");
//                    for (RegisteredDiagnosisModel r : updatedDiagnosis) {
//                        trace(r.getDiagnosis());
//                    }
//                }
//                sender.prepare(updatedDiagnosis);
//                sender.send(updatedDiagnosis);
//            }
//
//            return result;
//        }

        @Override
        protected void succeeded(List<Long> list) {
            clearDiagnosisList();
//minagawa^ Chartの close box 押下で保存する場合、保存終了を通知しておしまい。                    
            if (boundSupport!=null) {
                setChartDocDidSave(true);
            }
//minagawa$                
            
//s.oh^ 2013/10/25 傷病名削除されない
            // 保存したらidを取得するように再読込
            getDiagnosisHistory();
//s.oh$
        }
    }

    /**
     * 傷病名用のTable Cell Renderer
     * 奇数・偶数　の色分け
     * ORCA病名の背景が green
     */
    class DolphinOrcaRenderer extends StripeTableCellRenderer {

        /** Creates new IconRenderer */
        public DolphinOrcaRenderer() {
            super();
        }

        @Override
        public Component getTableCellRendererComponent(JTable table,
                Object value,
                boolean isSelected,
                boolean isFocused,
                int row, int col) {
            
            super.getTableCellRendererComponent(table, value, isSelected, isFocused, row, col);

            RegisteredDiagnosisModel rd = (RegisteredDiagnosisModel) tableModel.getObject(row);

            if (isOrcaDisease(rd)) {
                setBackground(ORCA_BACK);
                if(isSelected) {
                    setBackground(table.getSelectionBackground());
                    setForeground(table.getSelectionForeground());
                }
            }

            if (value != null) {
                if (value instanceof String) {
                    this.setText((String) value);
                } else {
                    this.setText(value.toString());
                }
            } else {
                this.setText("");
            }

            return this;
        }
    }
    
//s.oh^ 2014/11/11 傷病名送信順番の変更
    class DiagnosisSendComparator implements Comparator {
        public DiagnosisSendComparator() {}

        @Override
        public int compare(Object o1, Object o2) {
            if(o1 == null && o2 == null) {
                return 0;
            }else if(o1 == null) {
                return 1;
            }else if(o2 == null) {
                return -1;
            }
            RegisteredDiagnosisModel val1 = (RegisteredDiagnosisModel)o1;
            RegisteredDiagnosisModel val2 = (RegisteredDiagnosisModel)o2;
            if(val1.getDiagnosisOutcomeModel() == null && val2.getDiagnosisOutcomeModel() == null) {
                return 0;
            }else if(val1.getDiagnosisOutcomeModel() == null) {
                return 1;
            }else if(val2.getDiagnosisOutcomeModel() == null) {
                return -1;
            }
            if(val1.getDiagnosisCategoryModel() == null && val2.getDiagnosisCategoryModel() == null) {
                return 0;
            }else if(val1.getDiagnosisCategoryModel() == null) {
                return 1;
            }else if(val2.getDiagnosisCategoryModel() == null) {
                return -1;
            }
            if(val1.getEnded() == null && val2.getEnded() == null) {
                return 0;
            }else if(val1.getEnded() == null) {
                return 1;
            }else if(val2.getEnded() == null) {
                return -1;
            }
            return 0;
        }
    }
//s.oh$
}
