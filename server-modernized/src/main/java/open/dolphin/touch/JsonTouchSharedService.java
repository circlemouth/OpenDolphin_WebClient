package open.dolphin.touch;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.converter.UserModelConverter;
import open.dolphin.infomodel.ChartEventModel;
import open.dolphin.infomodel.DiagnosisSendWrapper;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.infomodel.PVTPublicInsuranceItemModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.infomodel.VisitPackage;
import open.dolphin.session.ChartEventServiceBean;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.touch.converter.ISendPackage;
import open.dolphin.touch.converter.ISendPackage2;
import open.dolphin.touch.converter.IVisitPackage;
import open.dolphin.touch.session.IPhoneServiceBean;
import open.dolphin.touch.KanjiHelper;
import open.orca.rest.ORCAConnection;
import org.apache.commons.lang3.SerializationUtils;

/**
 * Shared implementation for JsonTouch style endpoints.
 */
@ApplicationScoped
public class JsonTouchSharedService {

    public static final class PatientModelSnapshot {
        private final PatientModel patient;
        private final long kartePk;

        private PatientModelSnapshot(PatientModel patient, long kartePk) {
            this.patient = clonePatient(patient);
            this.kartePk = kartePk;
        }

        public PatientModel getPatient() {
            return clonePatient(patient);
        }

        public long getKartePk() {
            return kartePk;
        }
    }

    public static PatientModelSnapshot snapshot(PatientModel patient, long kartePk) {
        return new PatientModelSnapshot(patient, kartePk);
    }

    private static final Logger LOGGER = Logger.getLogger(JsonTouchSharedService.class.getName());
    private static final String QUERY_FACILITYID_BY_1001 = "select kanritbl from tbl_syskanri where kanricd='1001'";

    @Inject
    private IPhoneServiceBean iPhoneService;

    @Inject
    private KarteServiceBean karteService;

    @Inject
    private ChartEventServiceBean chartService;

    private volatile String cachedFacilityNumber;

    public UserModelConverter getUserById(String uid) {
        UserModel user = iPhoneService.getUserById(uid);
        UserModelConverter conv = new UserModelConverter();
        conv.setModel(user);
        return conv;
    }

    public PatientModelSnapshot getPatientSnapshot(String facilityId, String pid) {
        PatientModel patient = iPhoneService.getPatientById(facilityId, pid);
        long kartePk = iPhoneService.getKartePKByPatientPK(patient.getId());
        return snapshot(patient, kartePk);
    }

    public List<PatientModel> getPatientsByNameOrId(String facilityId, String name, int firstResult, int maxResult) {
        String normalized = normalizeKana(name);
        if (isKana(normalized)) {
            return iPhoneService.getPatientsByKana(facilityId, normalized, firstResult, maxResult);
        }
        return iPhoneService.getPatientsByName(facilityId, normalized, firstResult, maxResult);
    }

    public int countPatients(String facilityId) {
        return iPhoneService.countPatients(facilityId);
    }

    public List<String> getPatientsWithKana(String facilityId, int first, int max) {
        return iPhoneService.getAllPatientsWithKana(facilityId, first, max);
    }

    public VisitPackage getVisitPackage(long pvtPK, long patientPK, long docPK, int mode) {
        VisitPackage visit = iPhoneService.getVisitPackage(pvtPK, patientPK, docPK, mode);

        if (visit.getDocumenModel() != null) {
            visit.getDocumenModel().toDetuch();
        }

        visit.setNumber(resolveFacilityNumber());
        return visit;
    }

    public long saveDocument(DocumentModel model) {
        return karteService.addDocument(model);
    }

    public long processSendPackage(open.dolphin.touch.converter.ISendPackage pkg) {
        return processSendPackageElements(
                pkg != null ? pkg.documentModel() : null,
                pkg != null ? pkg.diagnosisSendWrapperModel() : null,
                pkg != null ? pkg.deletedDiagnsis() : null,
                pkg != null ? pkg.chartEventModel() : null
        );
    }

    public long processSendPackage2(ISendPackage2 pkg) {
        return processSendPackageElements(
                pkg != null ? pkg.documentModel() : null,
                pkg != null ? pkg.diagnosisSendWrapperModel() : null,
                pkg != null ? pkg.deletedDiagnsis() : null,
                pkg != null ? pkg.chartEventModel() : null
        );
    }

    public long processSendPackageElements(DocumentModel model,
                                            DiagnosisSendWrapper wrapper,
                                            List<String> deletedDiagnosis,
                                            ChartEventModel chartEvent) {
        return processSendPackageInternal(model, wrapper, deletedDiagnosis, chartEvent);
    }

    private long processSendPackageInternal(DocumentModel model,
                                            DiagnosisSendWrapper wrapper,
                                            List<String> deletedDiagnosis,
                                            ChartEventModel chartEvent) {
        long retPk = 0L;

        if (model != null) {
            adjustPublicInsuranceItems(model);
            retPk = karteService.addDocument(model);
        }

        if (wrapper != null) {
            karteService.postPutSendDiagnosis(wrapper);
        }

        if (deletedDiagnosis != null && !deletedDiagnosis.isEmpty()) {
            List<Long> list = new ArrayList<>(deletedDiagnosis.size());
            for (String str : deletedDiagnosis) {
                list.add(Long.parseLong(str));
            }
            karteService.removeDiagnosis(list);
        }

        if (chartEvent != null) {
            chartService.processChartEvent(chartEvent);
        }

        return retPk;
    }

    private void adjustPublicInsuranceItems(DocumentModel model) {
        DocInfoModel docInfo = model.getDocInfoModel();
        if (docInfo == null) {
            return;
        }
        PVTHealthInsuranceModel insurance = docInfo.getPVTHealthInsuranceModel();
        if (insurance == null) {
            return;
        }
        PVTPublicInsuranceItemModel[] arr = insurance.getPVTPublicInsuranceItem();
        if (arr != null && arr.length > 0) {
            List<PVTPublicInsuranceItemModel> list = new ArrayList<>(arr.length);
            list.addAll(Arrays.asList(arr));
            insurance.setPublicItems(list);
        }
    }

    private String normalizeKana(String name) {
        if (name == null || name.isEmpty()) {
            return name;
        }
        char first = name.charAt(0);
        if (KanjiHelper.isHiragana(first)) {
            return KanjiHelper.hiraganaToKatakana(name);
        }
        return name;
    }

    private boolean isKana(String name) {
        if (name == null || name.isEmpty()) {
            return false;
        }
        return KanjiHelper.isKatakana(name.charAt(0));
    }

    public String resolveFacilityNumber() {
        String cached = cachedFacilityNumber;
        if (cached != null) {
            return cached;
        }
        synchronized (this) {
            if (cachedFacilityNumber != null) {
                return cachedFacilityNumber;
            }
            String resolved = readFacilityNumberFromProperties();
            if (resolved == null || resolved.isEmpty()) {
                resolved = readFacilityNumberFromDatabase();
            }
            cachedFacilityNumber = resolved != null ? resolved : "";
            return cachedFacilityNumber;
        }
    }

    private String readFacilityNumberFromProperties() {
        try {
            Properties config = new Properties();
            String home = System.getProperty("jboss.home.dir");
            if (home == null) {
                return null;
            }
            File configFile = new File(home, "custom.properties");
            if (!configFile.exists()) {
                return null;
            }
            try (InputStreamReader reader = new InputStreamReader(new FileInputStream(configFile), "JISAutoDetect")) {
                config.load(reader);
            }
            String jmari = config.getProperty("jamri.code");
            String facility = config.getProperty("healthcarefacility.code");
            if (jmari != null && jmari.length() == 12 && facility != null && facility.length() == 10) {
                return facility + "JPN" + jmari;
            }
        } catch (UnsupportedEncodingException ex) {
            LOGGER.log(Level.SEVERE, "Unsupported encoding while reading facility code", ex);
        } catch (IOException ex) {
            LOGGER.log(Level.SEVERE, "Failed to read facility code from custom.properties", ex);
        }
        return null;
    }

    private String readFacilityNumberFromDatabase() {
        try (Connection con = ORCAConnection.getInstance().getConnection();
             PreparedStatement ps = con.prepareStatement(QUERY_FACILITYID_BY_1001);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                String line = rs.getString(1);
                if (line == null || line.length() < 10) {
                    return null;
                }
                StringBuilder ret = new StringBuilder();
                ret.append(line, 0, 10);
                int index = line.indexOf("JPN");
                if (index > 0 && line.length() >= index + 15) {
                    ret.append(line, index, index + 15);
                }
                return ret.toString();
            }
        } catch (SQLException ex) {
            LOGGER.log(Level.SEVERE, "Failed to query facility code from ORCA", ex);
        }
        return null;
    }

    private static PatientModel clonePatient(PatientModel patient) {
        return patient == null ? null : SerializationUtils.clone(patient);
    }
}
