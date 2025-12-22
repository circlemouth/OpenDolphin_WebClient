package open.dolphin.adm20.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.adm20.converter.IOSHelper;
import open.dolphin.adm20.session.AMD20_PHRServiceBean;
import open.dolphin.infomodel.AllergyModel;
import open.dolphin.infomodel.ClaimBundle;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.ModuleInfoBean;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.NLaboModule;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.FacilityModel;
import open.dolphin.infomodel.PHRBundle;
import open.dolphin.infomodel.PHRCatch;
import open.dolphin.infomodel.PHRClaimItem;
import open.dolphin.infomodel.PHRContainer;
import open.dolphin.infomodel.PHRKey;
import open.dolphin.infomodel.PHRLabItem;
import open.dolphin.infomodel.PHRLabModule;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.SchemaModel;
import open.dolphin.adm20.dto.PhrMedicationResponse;
import open.orca.rest.ORCAConnection;

/**
 * PHR データの組み立てを担当するヘルパー。
 */
@ApplicationScoped
public class PhrDataAssembler {

    private static final Logger LOGGER = Logger.getLogger(PhrDataAssembler.class.getName());
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    private AMD20_PHRServiceBean phrServiceBean;

    public Optional<PHRKey> findKeyByAccessKey(String accessKey) {
        return Optional.ofNullable(phrServiceBean.getPHRKey(accessKey));
    }

    public Optional<PHRKey> findKeyByPatientId(String patientId) {
        return Optional.ofNullable(phrServiceBean.getPHRKeyByPatientId(patientId));
    }

    public PHRContainer buildContainer(String facilityId,
                                       String patientId,
                                       String documentSince,
                                       String labSince,
                                       int rpRequest,
                                       String replyTo) {
        List<PHRCatch> docList = getPHRDocList(facilityId, patientId, documentSince, 0, 3,
                new String[]{"medOrder", "injectionOrder"}, rpRequest, replyTo);
        if (docList == null) {
            docList = new ArrayList<>();
        }
        List<PHRLabModule> labModules = getPHRLabList(facilityId, patientId, labSince, 0, 3);

        PHRContainer container = new PHRContainer();
        container.setDocList(docList);
        container.setLabList(labModules);
        return container;
    }

    public List<AllergyModel> findAllergies(String facilityId, String patientId) {
        KarteBean karte = phrServiceBean.getKarte(facilityId, patientId);
        return phrServiceBean.getAllergies(karte.getId());
    }

    public List<RegisteredDiagnosisModel> findDiagnoses(String facilityId, String patientId) {
        KarteBean karte = phrServiceBean.getKarte(facilityId, patientId);
        return phrServiceBean.getDiagnosis(karte.getId());
    }

    public List<ModuleModel> findLastMedication(String facilityId, String patientId) {
        KarteBean karte = phrServiceBean.getKarte(facilityId, patientId);
        return phrServiceBean.getLastMedication(karte.getId());
    }

    public List<NLaboModule> findLabModules(String facilityId, String patientId) {
        return phrServiceBean.getLastLabTest(facilityId, patientId);
    }

    public List<PHRLabModule> findLabModules(String facilityId, String patientId, String since, int first, int max) {
        return getPHRLabList(facilityId, patientId, since, first, max);
    }

    public Optional<SchemaModel> findLatestImage(String facilityId, String patientId) {
        KarteBean karte = phrServiceBean.getKarte(facilityId, patientId);
        return Optional.ofNullable(phrServiceBean.getImages(karte.getId()));
    }

    public PhrMedicationResponse buildMedicationResponse(List<ModuleModel> modules, String facilityId) {
        if (modules == null || modules.isEmpty()) {
            return new PhrMedicationResponse("処方の登録はありません。", List.of());
        }
        String cachedFacilityNumber = extractJmariCode(getFacilityCodeBy1001());
        String facilityNumber = !isBlank(cachedFacilityNumber) ? cachedFacilityNumber : facilityId;

        List<PHRBundle> bundles = new ArrayList<>(modules.size());
        for (ModuleModel module : modules) {
            ClaimBundle bundle = (ClaimBundle) IOSHelper.xmlDecode(module.getBeanBytes());
            PHRBundle phrBundle = new PHRBundle();
            applyModuleMetadata(phrBundle, module);
            applyClaimBundle(phrBundle, bundle, facilityNumber);
            bundles.add(phrBundle);
        }
        return new PhrMedicationResponse(null, bundles);
    }

    public String toJson(Object value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to convert value to JSON", ex);
        }
    }

    private List<PHRCatch> getPHRDocList(String fid,
                                         String pid,
                                         String docSince,
                                         int first,
                                         int max,
                                         String[] entities,
                                         int rpRequest,
                                         String replyTo) {

        Date sinceDate = (docSince != null) ? startedFromString(docSince) : null;

        KarteBean karte = phrServiceBean.getKarte(fid, pid);

        List<DocumentModel> list = phrServiceBean.getDocuments(karte.getId(), sinceDate, first, max, entities);

        if (list == null || list.isEmpty()) {
            return List.of();
        }

        List<PHRCatch> result = new ArrayList<>(list.size());
        String cachedFacilityNumber = extractJmariCode(getFacilityCodeBy1001());

        list.forEach(doc -> {
            PHRCatch phrCatch = new PHRCatch();
            result.add(phrCatch);
            doc.toDetuch();
            phrCatch.setCatchId(doc.getDocInfoModel().getDocId());
            phrCatch.setStarted(stringFromStarted(doc.getStarted()));
            phrCatch.setConfirmed(stringFromStarted(doc.getConfirmed()));
            phrCatch.setStatus(doc.getStatus());
            phrCatch.setPatientId(karte.getPatientModel().getPatientId());
            phrCatch.setPatientName(karte.getPatientModel().getFullName());
            phrCatch.setPatientSex(karte.getPatientModel().getGender());
            phrCatch.setPatientBirthday(karte.getPatientModel().getBirthday());
            phrCatch.setPhysicianId(doc.getUserModel().getUserId());
            phrCatch.setPhysicianName(doc.getUserModel().getCommonName());
            phrCatch.setDepartment(doc.getUserModel().getDepartmentModel().getDepartment());
            phrCatch.setDepartmentDesc(doc.getUserModel().getDepartmentModel().getDepartmentDesc());
            phrCatch.setLicense(doc.getUserModel().getLicenseModel().getLicense());
            phrCatch.setFacilityId(doc.getUserModel().getFacilityModel().getFacilityId());
            phrCatch.setFacilityName(doc.getUserModel().getFacilityModel().getFacilityName());
            String resolvedFacilityNumber = resolveFacilityNumber(doc, cachedFacilityNumber, fid);
            phrCatch.setFacilityNumber(resolvedFacilityNumber);

            phrCatch.setRpRequest(rpRequest);
            phrCatch.setRpReply(0);
            if (replyTo != null) {
                phrCatch.setRpReplyTo(replyTo);
            }

            List<ModuleModel> modules = doc.getModules();
            if (modules == null || modules.isEmpty()) {
                return;
            }

            modules.forEach(mm -> {
                PHRBundle pcb = new PHRBundle();
                phrCatch.addBundle(pcb);

                applyModuleMetadata(pcb, mm);
                pcb.setCatchId(phrCatch.getCatchId());
                pcb.setBundleId(createModuleId(phrCatch.getStarted(), modules.size() - mm.getModuleInfoBean().getStampNumber()));

                ClaimBundle bundle = (ClaimBundle) IOSHelper.xmlDecode(mm.getBeanBytes());
                applyClaimBundle(pcb, bundle, resolvedFacilityNumber);
            });
        });

        return result;
    }

    private String resolveLabCodeForId(NLaboModule module) {
        if (module.getModuleKey() != null && !module.getModuleKey().isBlank()) {
            return module.getModuleKey();
        }
        if (module.getLaboCenterCode() != null && !module.getLaboCenterCode().isBlank()) {
            return module.getLaboCenterCode();
        }
        return module.getId() != null ? module.getId().toString() : "0";
    }

    private String defaultString(String value) {
        return value != null ? value : "";
    }

    private PHRLabItem toPhrLabItem(NLaboModule module, NLaboItem item, String sampleDate) {
        PHRLabItem phrItem = new PHRLabItem();
        phrItem.setPatientId(item.getPatientId());
        phrItem.setSampleDate(sampleDate);
        String labCode = !isBlank(module.getLaboCenterCode()) ? module.getLaboCenterCode() : item.getLaboCode();
        phrItem.setLabCode(labCode);
        phrItem.setLipemia(item.getLipemia());
        phrItem.setHemolysis(item.getHemolysis());
        phrItem.setDialysis(item.getDialysis());
        phrItem.setReportStatus(item.getReportStatus());
        phrItem.setGroupCode(item.getGroupCode());
        phrItem.setGroupName(item.getGroupName());
        phrItem.setParentCode(item.getParentCode());
        phrItem.setItemCode(item.getItemCode());
        phrItem.setMedisCode(item.getMedisCode());
        phrItem.setItemName(item.getItemName());
        phrItem.setAbnormalFlg(item.getAbnormalFlg());
        phrItem.setNormalValue(item.getNormalValue());
        phrItem.setValue(item.getValue());
        phrItem.setUnit(item.getUnit());
        phrItem.setSpecimenCode(item.getSpecimenCode());
        phrItem.setSpecimenName(item.getSpecimenName());
        phrItem.setCommentCode1(item.getCommentCode1());
        phrItem.setComment1(item.getComment1());
        phrItem.setCommentCode2(item.getCommentCode2());
        phrItem.setComment2(item.getComment2());
        phrItem.setSortKey(item.getSortKey());
        return phrItem;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String extractJmariCode(String facilityNumber) {
        if (isBlank(facilityNumber)) {
            return null;
        }
        int index = facilityNumber.indexOf("JPN");
        if (index >= 0 && facilityNumber.length() >= index + 15) {
            return facilityNumber.substring(index, index + 15);
        }
        return facilityNumber;
    }

    private String resolveFacilityNumber(DocumentModel doc, String cachedFacilityNumber, String facilityId) {
        String docFacilityNumber = null;
        if (doc != null && doc.getDocInfoModel() != null) {
            docFacilityNumber = doc.getDocInfoModel().getJMARICode();
        }
        String fromDoc = extractJmariCode(docFacilityNumber);
        if (!isBlank(fromDoc)) {
            return fromDoc;
        }
        if (!isBlank(cachedFacilityNumber)) {
            return cachedFacilityNumber;
        }
        return facilityId;
    }

    private List<PHRLabModule> getPHRLabList(String fid, String pid, String labSince, int first, int max) {
        List<NLaboModule> list = phrServiceBean.getLabTest(fid, pid, labSince, first, max);

        if (list == null || list.isEmpty()) {
            return List.of();
        }

        PatientModel patient = phrServiceBean.getPatient(fid, pid);
        FacilityModel facility = phrServiceBean.getFacility(fid);
        String cachedFacilityNumber = extractJmariCode(getFacilityCodeBy1001());
        String facilityNumberForLab = !isBlank(cachedFacilityNumber) ? cachedFacilityNumber : fid;

        List<PHRLabModule> result = new ArrayList<>(list.size());

        for (NLaboModule module : list) {
            String rawSampleDate = module.getSampleDate();
            String normalizedSampleDate = normalizeSampleDate2(rawSampleDate);
            String labCodeForId = resolveLabCodeForId(module);
            String moduleId = rawSampleDate != null
                    ? createLabModuleId(rawSampleDate, facilityNumberForLab, defaultString(pid), labCodeForId)
                    : null;

            PHRLabModule phrModule = new PHRLabModule();
            phrModule.setCatchId(moduleId);
            phrModule.setPatientName(patient != null ? patient.getFullName() : module.getPatientName());
            phrModule.setPatientSex(patient != null ? patient.getGender() : module.getPatientSex());
            phrModule.setPatientBirthday(patient != null ? patient.getBirthday() : null);
            phrModule.setFacilityId(facility != null ? facility.getFacilityId() : defaultString(module.getFacilityId()));
            phrModule.setFacilityName(facility != null ? facility.getFacilityName() : module.getFacilityName());
            phrModule.setFacilityNumber(facilityNumberForLab);
            phrModule.setLabCenterCode(module.getLaboCenterCode());
            String sampleDateForItems = normalizedSampleDate != null ? normalizedSampleDate : rawSampleDate;
            phrModule.setSampleDate(sampleDateForItems);
            phrModule.setReportFormat(module.getReportFormat());

            String numOfItems = module.getNumOfItems();
            if (isBlank(numOfItems) && module.getItems() != null) {
                numOfItems = Integer.toString(module.getItems().size());
            }
            phrModule.setNumOfItems(numOfItems);

            List<NLaboItem> items = module.getItems();
            if (items != null && !items.isEmpty()) {
                List<PHRLabItem> phrItems = new ArrayList<>(items.size());
                for (NLaboItem item : items) {
                    phrItems.add(toPhrLabItem(module, item, sampleDateForItems));
                }
                phrModule.setTestItems(phrItems);
            }

            result.add(phrModule);
        }

        return result;
    }

    private void applyModuleMetadata(PHRBundle bundle, ModuleModel module) {
        bundle.setStarted(stringFromStarted(module.getStarted()));
        bundle.setConfirmed(stringFromStarted(module.getConfirmed()));
        bundle.setStatus(module.getStatus());
        ModuleInfoBean info = module.getModuleInfoBean();
        if (info != null) {
            bundle.setEnt(info.getEntity());
            bundle.setRole(info.getStampRole());
            bundle.setNumber(info.getStampNumber());
            bundle.setOrderName(info.getEntity());
        }
    }

    private void applyClaimBundle(PHRBundle bundle, ClaimBundle source, String facilityNumber) {
        if (source == null) {
            return;
        }
        bundle.setAdmin(source.getAdmin());
        bundle.setAdminCode(source.getAdminCode());
        bundle.setAdminCodeSystem(source.getAdminCodeSystem());
        bundle.setAdminMemo(source.getAdminMemo());
        bundle.setBundleNumber(source.getBundleNumber());
        bundle.setClsCode(source.getClassCode());
        bundle.setClsCodeSystem(source.getClassCodeSystem());
        bundle.setClsName(source.getClassName());
        bundle.setInsurance(source.getInsurance());
        bundle.setMemo(source.getMemo());
        if (facilityNumber != null) {
            bundle.setFacilityNumber(facilityNumber);
        }

        ClaimItem[] items = source.getClaimItem();
        if (items != null && items.length > 0) {
            for (ClaimItem item : items) {
                bundle.addPHRClaimItem(toPhrClaimItem(item));
            }
        }
    }

    private PHRClaimItem toPhrClaimItem(ClaimItem item) {
        PHRClaimItem phrItem = new PHRClaimItem();
        phrItem.setClsCode(item.getClassCode());
        phrItem.setClsCodeSystem(item.getClassCodeSystem());
        phrItem.setCode(item.getCode());
        phrItem.setCodeSystem(item.getCodeSystem());
        phrItem.setMemo(item.getMemo());
        phrItem.setName(item.getName());
        phrItem.setQuantity(item.getNumber());
        phrItem.setUnit(item.getUnit());
        phrItem.setNumberCode(item.getNumberCode());
        phrItem.setNumberCodeSystem(item.getNumberCodeSystem());
        phrItem.setYkzKbn(item.getYkzKbn());
        phrItem.setFrequency(item.getNumberCode());
        phrItem.setFrequencyName(item.getNumberCodeName());
        phrItem.setStartDate(item.getStartDate());
        phrItem.setEndDate(item.getEndDate());
        phrItem.setAdministration(item.getSanteiCode());
        phrItem.setDose(item.getDose());
        phrItem.setDoseUnit(item.getDoseUnit());
        return phrItem;
    }

    private String createModuleId(String docId, long serialNumber) {
        StringBuilder sb = new StringBuilder();
        sb.append(docId).append(serialNumber);
        return sb.toString();
    }

    private String normalizeSampleDate2(String sampleDate) {
        if (sampleDate == null) {
            return null;
        }
        try {
            sampleDate = sampleDate.replaceAll(" ", "");
            sampleDate = sampleDate.replaceAll("T", "");
            sampleDate = sampleDate.replaceAll("/", "");
            sampleDate = sampleDate.replaceAll("-", "");
            sampleDate = sampleDate.replaceAll(":", "");

            if (sampleDate.length() == "yyyyMMdd".length()) {
                sampleDate += "000000";
            } else if (sampleDate.length() == "yyyyMMddHHmm".length()) {
                sampleDate += "00";
            }

            SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
            Date d = sdf.parse(sampleDate);

            sdf = new SimpleDateFormat("yyyy年M月d日");
            return sdf.format(d);

        } catch (ParseException ex) {
            LOGGER.log(Level.WARNING, "Failed to normalize sample date: {0}", sampleDate);
        }
        return null;
    }

    private String createLabModuleId(String sampleDate, String jmariCode, String patientId, String labCode) {
        try {
            sampleDate = sampleDate.replaceAll(" ", "");
            sampleDate = sampleDate.replaceAll("T", "");
            sampleDate = sampleDate.replaceAll("/", "");
            sampleDate = sampleDate.replaceAll("-", "");
            sampleDate = sampleDate.replaceAll(":", "");

            if (sampleDate.length() == "yyyyMMdd".length()) {
                sampleDate += "000000";
            } else if (sampleDate.length() == "yyyyMMddHHmm".length()) {
                sampleDate += "00";
            }

            StringBuilder sb = new StringBuilder();
            sb.append(jmariCode).append(patientId).append(labCode).append(sampleDate);
            String key = sb.toString().replaceAll("\\.", "");

            MessageDigest d = MessageDigest.getInstance("SHA-1");
            d.reset();
            d.update(key.getBytes(StandardCharsets.UTF_8));
            byte[] rowBytes = d.digest();

            return Base64.getEncoder().encodeToString(rowBytes);

        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, "Failed to create lab module id.", ex);
        }
        return null;
    }

    private String stringFromStarted(Date d) {
        if (d == null) {
            return null;
        }
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        return sdf.format(d);
    }

    private Date startedFromString(String str) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            return sdf.parse(str);
        } catch (ParseException ex) {
            LOGGER.log(Level.WARNING, "Failed to parse startedFrom string: {0}", str);
        }
        return null;
    }

    private String getFacilityCodeBy1001() {
        try (Connection con = ORCAConnection.getInstance().getConnection()) {
            if (con == null) {
                return null;
            }
            String sql = "select kanritbl from tbl_syskanri where kanricd='1001'";
            try (PreparedStatement ps = con.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String line = rs.getString(1);
                    StringBuilder sb = new StringBuilder();
                    sb.append(line, 0, 10);
                    int index = line.indexOf("JPN");
                    if (index > 0) {
                        sb.append(line, index, index + 15);
                    }
                    return sb.toString();
                }
            }
        } catch (SQLException ex) {
            LOGGER.log(Level.WARNING, "Failed to lookup facility code.", ex);
        }
        return null;
    }

}
