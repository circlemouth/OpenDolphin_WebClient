package open.dolphin.touch.module;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Duration;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import open.dolphin.common.cache.CacheUtil;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.BundleMed;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.NLaboModule;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.SchemaModel;
import open.dolphin.infomodel.StampModel;
import open.dolphin.touch.converter.IOSHelper;
import open.dolphin.touch.module.TouchModuleDtos.Diagnosis;
import open.dolphin.touch.module.TouchModuleDtos.LaboGraph;
import open.dolphin.touch.module.TouchModuleDtos.LaboGraphResult;
import open.dolphin.touch.module.TouchModuleDtos.LaboItem;
import open.dolphin.touch.module.TouchModuleDtos.LaboModule;
import open.dolphin.touch.module.TouchModuleDtos.Module;
import open.dolphin.touch.module.TouchModuleDtos.ModuleItem;
import open.dolphin.touch.module.TouchModuleDtos.Page;
import open.dolphin.touch.module.TouchModuleDtos.RpModule;
import open.dolphin.touch.module.TouchModuleDtos.Schema;
import open.dolphin.touch.session.IPhoneServiceBean;

/**
 * Business logic and caching layer for Touch module endpoints.
 */
@ApplicationScoped
public class TouchModuleService {

    private static final Duration CACHE_TTL = Duration.ofSeconds(10);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd")
            .withZone(ZoneId.systemDefault());

    private static final String ENTITY_MED_ORDER = "medOrder";
    private static final String ENTITY_BASE_CHARGE_ORDER = "baseChargeOrder";
    private static final String ENTITY_INSTRACTION_CHARGE_ORDER = "instractionChargeOrder";
    private static final String ENTITY_INJECTION_ORDER = "injectionOrder";
    private static final String ENTITY_TREATMENT_ORDER = "treatmentOrder";
    private static final String ENTITY_SURGERY_ORDER = "surgeryOrder";
    private static final String ENTITY_BACTERIA_ORDER = "bacteriaOrder";
    private static final String ENTITY_PHYSIOLOGY_ORDER = "physiologyOrder";
    private static final String ENTITY_TEST_ORDER = "testOrder";
    private static final String ENTITY_RADIOLOGY_ORDER = "radiologyOrder";
    private static final String ENTITY_OTHER_ORDER = "otherOrder";
    private static final String ENTITY_GENERAL_ORDER = "generalOrder";

    @Inject
    private IPhoneServiceBean iPhoneServiceBean;

    private final ConcurrentHashMap<String, CacheUtil.CacheEntry<Page<Module>>> moduleCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CacheUtil.CacheEntry<Page<RpModule>>> rpCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CacheUtil.CacheEntry<Page<Diagnosis>>> diagnosisCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CacheUtil.CacheEntry<Page<LaboModule>>> laboCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CacheUtil.CacheEntry<LaboGraph>> laboGraphCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CacheUtil.CacheEntry<Page<Schema>>> schemaCache = new ConcurrentHashMap<>();

    public Page<Module> getModules(long patientPk, String entity, int firstResult, int maxResult) {
        String key = cacheKey("modules", patientPk, entity, firstResult, maxResult);
        return CacheUtil.getOrCompute(moduleCache, key, CACHE_TTL,
                () -> buildModulePage(patientPk, entity, firstResult, maxResult));
    }

    public Page<RpModule> getRpModules(long patientPk, int firstResult, int maxResult) {
        String key = cacheKey("rp", patientPk, firstResult, maxResult);
        return CacheUtil.getOrCompute(rpCache, key, CACHE_TTL,
                () -> buildRpPage(patientPk, firstResult, maxResult));
    }

    public Page<Diagnosis> getDiagnoses(long patientPk, int firstResult, int maxResult) {
        String key = cacheKey("diagnosis", patientPk, firstResult, maxResult);
        return CacheUtil.getOrCompute(diagnosisCache, key, CACHE_TTL,
                () -> buildDiagnosisPage(patientPk, firstResult, maxResult));
    }

    public Page<LaboModule> getLaboModules(String facilityId, String patientId, int firstResult, int maxResult) {
        String key = cacheKey("laboModules", facilityId, patientId, firstResult, maxResult);
        return CacheUtil.getOrCompute(laboCache, key, CACHE_TTL,
                () -> buildLaboModulePage(facilityId, patientId, firstResult, maxResult));
    }

    public LaboGraph getLaboGraph(String facilityId, String patientId, int firstResult, int maxResult, String itemCode) {
        String key = cacheKey("laboGraph", facilityId, patientId, firstResult, maxResult, itemCode);
        return CacheUtil.getOrCompute(laboGraphCache, key, CACHE_TTL,
                () -> buildLaboGraph(facilityId, patientId, firstResult, maxResult, itemCode));
    }

    public Page<Schema> getSchemas(long patientPk, int firstResult, int maxResult) {
        String key = cacheKey("schema", patientPk, firstResult, maxResult);
        return CacheUtil.getOrCompute(schemaCache, key, CACHE_TTL,
                () -> buildSchemaPage(patientPk, firstResult, maxResult));
    }

    private Page<Module> buildModulePage(long patientPk, String entity, int firstResult, int maxResult) {
        Long total = iPhoneServiceBean.getModuleCount(patientPk, entity);
        List<ModuleModel> models = iPhoneServiceBean.getModules(patientPk, entity, firstResult, maxResult);
        List<Module> modules = new ArrayList<>();
        if (models != null) {
            for (ModuleModel moduleModel : models) {
                Module dto = toModule(moduleModel);
                if (dto != null) {
                    modules.add(dto);
                }
            }
        }
        return new Page<>(total, firstResult, maxResult, Collections.unmodifiableList(modules));
    }

    private Page<RpModule> buildRpPage(long patientPk, int firstResult, int maxResult) {
        Long total = iPhoneServiceBean.getModuleCount(patientPk, ENTITY_MED_ORDER);
        List<ModuleModel> models = iPhoneServiceBean.getModules(patientPk, ENTITY_MED_ORDER, firstResult, maxResult);
        List<RpModule> bundles = new ArrayList<>();
        if (models != null) {
            for (ModuleModel moduleModel : models) {
                RpModule dto = toRpModule(moduleModel);
                if (dto != null) {
                    bundles.add(dto);
                }
            }
        }
        return new Page<>(total, firstResult, maxResult, Collections.unmodifiableList(bundles));
    }

    private Page<Diagnosis> buildDiagnosisPage(long patientPk, int firstResult, int maxResult) {
        Long total = iPhoneServiceBean.getDiagnosisCount(patientPk);
        List<RegisteredDiagnosisModel> models = iPhoneServiceBean.getDiagnosis(patientPk, firstResult, maxResult);
        List<Diagnosis> diagnoses = new ArrayList<>();
        if (models != null) {
            for (RegisteredDiagnosisModel model : models) {
                diagnoses.add(new Diagnosis(
                        sanitize(model.getAliasOrName()),
                        sanitize(model.getCategoryDesc()),
                        sanitize(model.getOutcomeDesc()),
                        sanitize(model.getStartDate()),
                        sanitize(model.getEndDate())
                ));
            }
        }
        return new Page<>(total, firstResult, maxResult, Collections.unmodifiableList(diagnoses));
    }

    private Page<LaboModule> buildLaboModulePage(String facilityId, String patientId, int firstResult, int maxResult) {
        Long total = iPhoneServiceBean.getLabTestCount(facilityId, patientId);
        List<NLaboModule> modules = iPhoneServiceBean.getLaboTest(facilityId, patientId, firstResult, maxResult);
        List<LaboModule> dtoList = new ArrayList<>();
        if (modules != null) {
            for (NLaboModule module : modules) {
                List<LaboItem> items = new ArrayList<>();
                Collection<NLaboItem> rawItems = module.getItems();
                if (rawItems != null) {
                    for (NLaboItem item : rawItems) {
                        items.add(new LaboItem(
                                sanitize(item.getGroupCode()),
                                sanitize(item.getGroupName()),
                                sanitize(item.getParentCode()),
                                sanitize(item.getItemCode()),
                                sanitize(item.getMedisCode()),
                                sanitize(item.getItemName()),
                                sanitize(item.getNormalValue()),
                                sanitize(item.getUnit()),
                                sanitize(item.getValue()),
                                sanitize(item.getAbnormalFlg()),
                                sanitize(item.getComment1()),
                                sanitize(item.getComment2())
                        ));
                    }
                }
                dtoList.add(new LaboModule(
                        sanitize(module.getLaboCenterCode()),
                        sanitize(module.getSampleDate()),
                        sanitize(module.getPatientId()),
                        Collections.unmodifiableList(items)
                ));
            }
        }
        return new Page<>(total, firstResult, maxResult, Collections.unmodifiableList(dtoList));
    }

    private LaboGraph buildLaboGraph(String facilityId, String patientId, int firstResult, int maxResult, String itemCode) {
        List<NLaboItem> items = iPhoneServiceBean.getLaboTestItem(facilityId, patientId, firstResult, maxResult, itemCode);
        if (items == null || items.isEmpty()) {
            return new LaboGraph(null, null, null, null, List.of());
        }
        NLaboItem latest = items.get(0);
        List<LaboGraphResult> results = new ArrayList<>(items.size());
        for (NLaboItem item : items) {
            results.add(new LaboGraphResult(
                    sanitize(item.getSampleDate()),
                    sanitize(item.getValue()),
                    sanitize(item.getComment1()),
                    sanitize(item.getComment2())
            ));
        }
        return new LaboGraph(
                sanitize(latest.getItemCode()),
                sanitize(latest.getItemName()),
                sanitize(latest.getNormalValue()),
                sanitize(latest.getUnit()),
                Collections.unmodifiableList(results)
        );
    }

    private Page<Schema> buildSchemaPage(long patientPk, int firstResult, int maxResult) {
        List<SchemaModel> models = iPhoneServiceBean.getSchema(patientPk, firstResult, maxResult);
        Long total = models != null ? Long.valueOf(models.size()) : 0L;
        List<Schema> schemas = new ArrayList<>();
        if (models != null) {
            for (SchemaModel schemaModel : models) {
                schemas.add(new Schema(
                        schemaModel.getExtRefModel() != null ? sanitize(schemaModel.getExtRefModel().getBucket()) : null,
                        schemaModel.getExtRefModel() != null ? sanitize(schemaModel.getExtRefModel().getSop()) : null,
                        encodeBase64(schemaModel.getJpegByte())
                ));
            }
        }
        return new Page<>(total, firstResult, maxResult, Collections.unmodifiableList(schemas));
    }

    private Module toModule(ModuleModel moduleModel) {
        BundleDolphin bundle = toBundle(moduleModel);
        if (bundle == null) {
            return null;
        }
        if (bundle.getOrderName() == null && moduleModel.getModuleInfoBean() != null) {
            bundle.setOrderName(moduleModel.getModuleInfoBean().getEntity());
        }
        String entity = sanitize(bundle.getOrderName());
        if (entity == null && moduleModel.getModuleInfoBean() != null) {
            entity = sanitize(moduleModel.getModuleInfoBean().getEntity());
        }
        boolean medOrder = ENTITY_MED_ORDER.equals(entity);
        String entityName = entityToName(entity);
        ClaimItem[] claimItems = bundle.getClaimItem();
        List<ModuleItem> dtoItems = new ArrayList<>();
        if (claimItems != null) {
            String numDays = medOrder ? sanitize(bundle.getBundleNumber()) : null;
            String admin = medOrder ? sanitize(bundle.getAdmin()) : null;
            for (ClaimItem item : claimItems) {
                dtoItems.add(new ModuleItem(
                        sanitize(item.getName()),
                        sanitize(item.getNumber()),
                        sanitize(item.getUnit()),
                        medOrder ? numDays : null,
                        medOrder ? admin : null
                ));
            }
        }
        String startDate = formatDate(moduleModel.getStarted());
        return new Module(entity, entityName, startDate, Collections.unmodifiableList(dtoItems));
    }

    private RpModule toRpModule(ModuleModel moduleModel) {
        BundleDolphin bundle = toBundle(moduleModel);
        if (!(bundle instanceof BundleMed)) {
            return null;
        }
        if (bundle.getOrderName() == null && moduleModel.getModuleInfoBean() != null) {
            bundle.setOrderName(moduleModel.getModuleInfoBean().getEntity());
        }
        ClaimItem[] claimItems = bundle.getClaimItem();
        List<ModuleItem> dtoItems = new ArrayList<>();
        if (claimItems != null) {
            String numDays = sanitize(bundle.getBundleNumber());
            String admin = sanitize(bundle.getAdmin());
            for (ClaimItem item : claimItems) {
                dtoItems.add(new ModuleItem(
                        sanitize(item.getName()),
                        sanitize(item.getNumber()),
                        sanitize(item.getUnit()),
                        numDays,
                        admin
                ));
            }
        }
        return new RpModule(formatDate(moduleModel.getStarted()), Collections.unmodifiableList(dtoItems));
    }

    private BundleDolphin toBundle(ModuleModel moduleModel) {
        if (moduleModel == null) {
            return null;
        }
        IInfoModel model = moduleModel.getModel();
        if (model == null) {
            Object decoded = IOSHelper.xmlDecode(moduleModel.getBeanBytes());
            if (decoded instanceof IInfoModel infoModel) {
                model = infoModel;
                moduleModel.setModel(infoModel);
            } else {
                return null;
            }
        }
        if (model instanceof BundleDolphin bundle) {
            return bundle;
        }
        if (model instanceof StampModel stamp) {
            return extractBundleFromStamp(stamp);
        }
        return null;
    }

    private BundleDolphin extractBundleFromStamp(StampModel stamp) {
        if (stamp == null) {
            return null;
        }
        byte[] bytes = stamp.getStampBytes();
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        Object decoded = IOSHelper.xmlDecode(bytes);
        if (decoded instanceof BundleDolphin bundle) {
            return bundle;
        }
        if (decoded instanceof BundleMed med) {
            return med;
        }
        if (decoded instanceof StampModel nested) {
            return extractBundleFromStamp(nested);
        }
        return null;
    }

    private String entityToName(String entity) {
        if (entity == null) {
            return null;
        }
        return switch (entity) {
            case ENTITY_MED_ORDER -> "RP";
            case ENTITY_BASE_CHARGE_ORDER -> "診断料";
            case ENTITY_INSTRACTION_CHARGE_ORDER -> "指導・在宅";
            case ENTITY_INJECTION_ORDER -> "注 射";
            case ENTITY_TREATMENT_ORDER -> "処 置";
            case ENTITY_SURGERY_ORDER -> "手 術";
            case ENTITY_BACTERIA_ORDER -> "細菌検査";
            case ENTITY_PHYSIOLOGY_ORDER -> "生体検査";
            case ENTITY_TEST_ORDER -> "検体検査";
            case ENTITY_RADIOLOGY_ORDER -> "放射線";
            case ENTITY_OTHER_ORDER -> "その他";
            case ENTITY_GENERAL_ORDER -> "汎 用";
            default -> entity;
        };
    }

    private String formatDate(Date date) {
        return date != null ? DATE_FORMAT.format(date.toInstant()) : null;
    }

    private String encodeBase64(byte[] data) {
        if (data == null || data.length == 0) {
            return null;
        }
        return Base64.getEncoder().encodeToString(data);
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String cacheKey(String method, Object... args) {
        return method + ":" + Arrays.deepHashCode(args);
    }
}
