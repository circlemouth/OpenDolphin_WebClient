package open.dolphin.adm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.beans.XMLEncoder;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.Date;
import java.util.EnumMap;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.BiConsumer;
import java.util.function.Supplier;
import open.dolphin.infomodel.AllergyModel;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.infomodel.PVTPublicInsuranceItemModel;
import open.dolphin.infomodel.PatientMemoModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.SimpleAddressModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.infomodel.VisitPackage;
import open.dolphin.rest.jackson.LegacyObjectMapperProducer;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Snapshot test that compares ADM10/ADM20 converters against legacy JSON fixtures.
 */
class AdmConverterSnapshotTest {

    private static final String SNAPSHOT_BASE_PROPERTY = "adm.snapshot.fixtureDir";
    private static final Path SNAPSHOT_BASE = resolveSnapshotBase();
    private static final Path ARTIFACT_BASE = Paths.get("..", "artifacts", "parity-manual", "adm-snapshots");
    private static final boolean UPDATE_SNAPSHOTS = Boolean.getBoolean("adm.snapshot.update");
    private static final DateTimeFormatter TIMESTAMP_FORMAT = new DateTimeFormatterBuilder()
            .appendValue(ChronoField.YEAR, 4)
            .appendValue(ChronoField.MONTH_OF_YEAR, 2)
            .appendValue(ChronoField.DAY_OF_MONTH, 2)
            .appendLiteral('T')
            .appendValue(ChronoField.HOUR_OF_DAY, 2)
            .appendValue(ChronoField.MINUTE_OF_HOUR, 2)
            .appendValue(ChronoField.SECOND_OF_MINUTE, 2)
            .appendLiteral('Z')
            .toFormatter()
            .withZone(ZoneId.of("UTC"));

    private final ObjectMapper mapper = new LegacyObjectMapperProducer().provideLegacyAwareMapper();
    private final String timestamp = TIMESTAMP_FORMAT.format(Instant.now());

    @Test
    void patientModelSnapshot() throws Exception {
        runScenario(ConverterScenarioBuilders.patientModel());
    }

    @Test
    void visitPackageSnapshot() throws Exception {
        runScenario(ConverterScenarioBuilders.visitPackage());
    }

    @Test
    void laboItemSnapshot() throws Exception {
        runScenario(ConverterScenarioBuilders.laboGraphItem());
    }

    @Test
    void registeredDiagnosisSnapshot() throws Exception {
        runScenario(ConverterScenarioBuilders.registeredDiagnosisList());
    }

    private void runScenario(ConverterScenario scenario) throws Exception {
        for (SnapshotTarget target : SnapshotTarget.values()) {
            assertSnapshotMatches(scenario, target);
        }
    }

    private static Path resolveSnapshotBase() {
        String configured = System.getProperty(SNAPSHOT_BASE_PROPERTY);
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured);
        }
        return Paths.get("..", "ops", "tests", "fixtures", "adm");
    }

    private void assertSnapshotMatches(ConverterScenario scenario, SnapshotTarget target) throws Exception {
        String actualJson = toJson(scenario.actual(target));
        JsonNode actualNode = mapper.readTree(actualJson);

        Path snapshotPath = snapshotPath(target, scenario.name());
        String baselineJson = ensureSnapshotJson(scenario, target, snapshotPath);
        JsonNode baselineNode = mapper.readTree(baselineJson);

        if (!actualNode.equals(baselineNode)) {
            Path diffPath = writeArtifacts(scenario.name(), target, baselineJson, actualJson, baselineNode, actualNode);
            Assertions.fail(() -> String.format(
                    "ADM converter snapshot '%s' diverged for %s. Review %s",
                    scenario.name(), target, diffPath));
        }
    }

    private String ensureSnapshotJson(ConverterScenario scenario, SnapshotTarget target, Path snapshotPath) throws IOException {
        if (Files.exists(snapshotPath)) {
            return Files.readString(snapshotPath);
        }
        String baselineJson = toJson(scenario.baseline(target));
        if (UPDATE_SNAPSHOTS) {
            Files.createDirectories(snapshotPath.getParent());
            Files.writeString(snapshotPath, baselineJson);
            return baselineJson;
        }
        throw new IllegalStateException("Snapshot missing for " + scenario.name() + "/" + target
                + ". Run the test with -Dadm.snapshot.update=true to record fixtures.");
    }

    private String toJson(Object value) throws IOException {
        return mapper.writerWithDefaultPrettyPrinter().writeValueAsString(value);
    }

    private Path snapshotPath(SnapshotTarget target, String scenarioName) {
        return SNAPSHOT_BASE.resolve(target.directoryName()).resolve(scenarioName + ".json");
    }

    private Path writeArtifacts(String scenarioName, SnapshotTarget target, String baselineJson, String actualJson,
            JsonNode baselineNode, JsonNode actualNode)
            throws IOException {
        Path scenarioDir = ARTIFACT_BASE.resolve(timestamp).resolve(scenarioName).resolve(target.directoryName());
        Files.createDirectories(scenarioDir);
        Path baselinePath = scenarioDir.resolve("baseline.json");
        Path actualPath = scenarioDir.resolve("actual.json");
        Files.writeString(baselinePath, baselineJson);
        Files.writeString(actualPath, actualJson);
        Path diffPath = scenarioDir.resolve("diff.txt");
        Files.writeString(diffPath, describeDiff(baselineNode, actualNode));
        return diffPath;
    }

    private String describeDiff(JsonNode expected, JsonNode actual) {
        StringBuilder builder = new StringBuilder();
        compareNodes(builder, "", expected, actual);
        if (builder.length() == 0) {
            builder.append("No differences detected");
        }
        return builder.toString();
    }

    private void compareNodes(StringBuilder builder, String path, JsonNode expected, JsonNode actual) {
        if (expected == null && actual == null) {
            return;
        }
        if (expected == null) {
            builder.append(path).append(" -> added: ").append(actual).append(System.lineSeparator());
            return;
        }
        if (actual == null) {
            builder.append(path).append(" -> removed: ").append(expected).append(System.lineSeparator());
            return;
        }
        if (expected.isObject() && actual.isObject()) {
            Set<String> fieldNames = new TreeSet<>();
            Iterator<String> expectedFields = expected.fieldNames();
            Iterator<String> actualFields = actual.fieldNames();
            expectedFields.forEachRemaining(fieldNames::add);
            actualFields.forEachRemaining(fieldNames::add);
            for (String field : fieldNames) {
                String childPath = path.isEmpty() ? field : path + "." + field;
                compareNodes(builder, childPath, expected.get(field), actual.get(field));
            }
            return;
        }
        if (expected.isArray() && actual.isArray()) {
            if (expected.size() != actual.size()) {
                builder.append(path).append(" -> size expected=")
                        .append(expected.size())
                        .append(" actual=")
                        .append(actual.size())
                        .append(System.lineSeparator());
            }
            int max = Math.max(expected.size(), actual.size());
            for (int i = 0; i < max; i++) {
                String childPath = path + "[" + i + "]";
                JsonNode expectedNode = i < expected.size() ? expected.get(i) : null;
                JsonNode actualNode = i < actual.size() ? actual.get(i) : null;
                compareNodes(builder, childPath, expectedNode, actualNode);
            }
            return;
        }
        if (!expected.equals(actual)) {
            builder.append(path)
                    .append(" -> expected=")
                    .append(expected)
                    .append(" actual=")
                    .append(actual)
                    .append(System.lineSeparator());
        }
    }

    private enum SnapshotTarget {
        ADM10("adm10"),
        ADM20("adm20");

        private final String directoryName;

        SnapshotTarget(String directoryName) {
            this.directoryName = directoryName;
        }

        String directoryName() {
            return directoryName;
        }
    }

    @FunctionalInterface
    private interface ConverterFactory {
        Object create();
    }

    private static final class ConverterScenario {
        private final String name;
        private final ConverterFactory baselineFactory;
        private final EnumMap<SnapshotTarget, ConverterFactory> actualFactories;

        private ConverterScenario(String name, ConverterFactory baselineFactory,
                                  ConverterFactory adm10Factory, ConverterFactory adm20Factory) {
            this.name = name;
            this.baselineFactory = baselineFactory;
            this.actualFactories = new EnumMap<>(SnapshotTarget.class);
            this.actualFactories.put(SnapshotTarget.ADM10, adm10Factory);
            this.actualFactories.put(SnapshotTarget.ADM20, adm20Factory);
        }

        static ConverterScenario of(String name, ConverterFactory baselineFactory,
                                    ConverterFactory adm10Factory, ConverterFactory adm20Factory) {
            return new ConverterScenario(name, baselineFactory, adm10Factory, adm20Factory);
        }

        String name() {
            return name;
        }

        Object baseline(SnapshotTarget target) {
            return baselineFactory.create();
        }

        Object actual(SnapshotTarget target) {
            ConverterFactory factory = actualFactories.get(target);
            if (factory == null) {
                throw new IllegalArgumentException("Missing factory for " + target);
            }
            return factory.create();
        }
    }

    private static final class ConverterScenarioBuilders {

        private ConverterScenarioBuilders() {
        }

        static ConverterScenario patientModel() {
            Supplier<PatientModel> supplier = AdmFixtures::createPatientModel;
            long kartePk = 98765L;
            return ConverterScenario.of(
                    "patient_model",
                    () -> buildTouchPatientModel(supplier.get(), kartePk),
                    () -> buildAdm10PatientModel(supplier.get(), kartePk),
                    () -> buildAdm20PatientModel(supplier.get(), kartePk));
        }

        static ConverterScenario visitPackage() {
            Supplier<VisitPackage> supplier = AdmFixtures::createVisitPackage;
            return ConverterScenario.of(
                    "visit_package",
                    () -> buildTouchVisitPackage(supplier.get()),
                    () -> buildAdm10VisitPackage(supplier.get()),
                    () -> buildAdm20VisitPackage(supplier.get()));
        }

        static ConverterScenario laboGraphItem() {
            Supplier<List<NLaboItem>> supplier = AdmFixtures::createLaboItems;
            return ConverterScenario.of(
                    "labo_item",
                    () -> buildLaboGraphItem(
                            supplier.get(),
                            open.dolphin.touch.converter.ILaboGraphItem::new,
                            open.dolphin.touch.converter.ILaboValue::new,
                            open.dolphin.touch.converter.ILaboGraphItem::addValue),
                    () -> buildLaboGraphItem(
                            supplier.get(),
                            open.dolphin.adm10.converter.ILaboGraphItem::new,
                            open.dolphin.adm10.converter.ILaboValue::new,
                            open.dolphin.adm10.converter.ILaboGraphItem::addValue),
                    () -> buildLaboGraphItem(
                            supplier.get(),
                            open.dolphin.adm20.converter.ILaboGraphItem::new,
                            open.dolphin.adm20.converter.ILaboValue::new,
                            open.dolphin.adm20.converter.ILaboGraphItem::addValue));
        }

        static ConverterScenario registeredDiagnosisList() {
            Supplier<List<RegisteredDiagnosisModel>> supplier = AdmFixtures::createDiagnosisModels;
            return ConverterScenario.of(
                    "registered_diagnosis",
                    () -> buildDiagnosisList(
                            supplier.get(),
                            open.dolphin.touch.converter.IRegisteredDiagnosis::new),
                    () -> buildDiagnosisList(
                            supplier.get(),
                            open.dolphin.adm10.converter.IRegisteredDiagnosis::new),
                    () -> buildDiagnosisList(
                            supplier.get(),
                            open.dolphin.adm20.converter.IRegisteredDiagnosis::new));
        }

        private static open.dolphin.touch.converter.IPatientModel buildTouchPatientModel(PatientModel patient, long pk) {
            open.dolphin.touch.converter.IPatientModel converter = new open.dolphin.touch.converter.IPatientModel();
            converter.setModel(patient);
            converter.setKartePK(pk);
            return converter;
        }

        private static open.dolphin.adm10.converter.IPatientModel buildAdm10PatientModel(PatientModel patient, long pk) {
            open.dolphin.adm10.converter.IPatientModel converter = new open.dolphin.adm10.converter.IPatientModel();
            converter.setModel(patient);
            converter.setKartePK(pk);
            return converter;
        }

        private static open.dolphin.adm20.converter.IPatientModel buildAdm20PatientModel(PatientModel patient, long pk) {
            open.dolphin.adm20.converter.IPatientModel converter = new open.dolphin.adm20.converter.IPatientModel();
            converter.setModel(patient);
            converter.setKartePK(pk);
            return converter;
        }

        private static open.dolphin.touch.converter.IVisitPackage buildTouchVisitPackage(VisitPackage visitPackage) {
            open.dolphin.touch.converter.IVisitPackage converter = new open.dolphin.touch.converter.IVisitPackage();
            converter.setModel(visitPackage);
            return converter;
        }

        private static open.dolphin.adm10.converter.IVisitPackage buildAdm10VisitPackage(VisitPackage visitPackage) {
            open.dolphin.adm10.converter.IVisitPackage converter = new open.dolphin.adm10.converter.IVisitPackage();
            converter.setModel(visitPackage);
            return converter;
        }

        private static open.dolphin.adm20.converter.IVisitPackage buildAdm20VisitPackage(VisitPackage visitPackage) {
            open.dolphin.adm20.converter.IVisitPackage converter = new open.dolphin.adm20.converter.IVisitPackage();
            converter.setModel(visitPackage);
            return converter;
        }

        private static <GRAPH, VALUE> GRAPH buildLaboGraphItem(
                List<NLaboItem> items,
                Supplier<GRAPH> graphSupplier,
                Supplier<VALUE> valueSupplier,
                BiConsumer<GRAPH, VALUE> valueAdder) {
            GRAPH graph = graphSupplier.get();
            if (!items.isEmpty()) {
                NLaboItem reference = items.get(items.size() - 1);
                setLaboItemMetadata(graph, reference);
            }
            for (NLaboItem item : items) {
                VALUE value = valueSupplier.get();
                setLaboValue(value, item);
                valueAdder.accept(graph, value);
            }
            return graph;
        }

        private static void setLaboItemMetadata(Object graph, NLaboItem reference) {
            if (graph instanceof open.dolphin.touch.converter.ILaboGraphItem touch) {
                applyLaboMetadata(
                        touch::setItemCode,
                        touch::setItemName,
                        touch::setNormalValue,
                        touch::setUnit,
                        reference);
            } else if (graph instanceof open.dolphin.adm10.converter.ILaboGraphItem adm10) {
                applyLaboMetadata(
                        adm10::setItemCode,
                        adm10::setItemName,
                        adm10::setNormalValue,
                        adm10::setUnit,
                        reference);
            } else if (graph instanceof open.dolphin.adm20.converter.ILaboGraphItem adm20) {
                applyLaboMetadata(
                        adm20::setItemCode,
                        adm20::setItemName,
                        adm20::setNormalValue,
                        adm20::setUnit,
                        reference);
            }
        }

        private static void applyLaboMetadata(
                java.util.function.Consumer<String> codeSetter,
                java.util.function.Consumer<String> nameSetter,
                java.util.function.Consumer<String> normalSetter,
                java.util.function.Consumer<String> unitSetter,
                NLaboItem reference) {
            codeSetter.accept(reference.getItemCode());
            nameSetter.accept(reference.getItemName());
            normalSetter.accept(reference.getNormalValue());
            unitSetter.accept(reference.getUnit());
        }

        private static void setLaboValue(Object value, NLaboItem item) {
            if (value instanceof open.dolphin.touch.converter.ILaboValue touchValue) {
                applyLaboValue(
                        touchValue::setSampleDate,
                        touchValue::setValue,
                        touchValue::setComment1,
                        touchValue::setComment2,
                        item);
            } else if (value instanceof open.dolphin.adm10.converter.ILaboValue adm10Value) {
                applyLaboValue(
                        adm10Value::setSampleDate,
                        adm10Value::setValue,
                        adm10Value::setComment1,
                        adm10Value::setComment2,
                        item);
            } else if (value instanceof open.dolphin.adm20.converter.ILaboValue adm20Value) {
                applyLaboValue(
                        adm20Value::setSampleDate,
                        adm20Value::setValue,
                        adm20Value::setComment1,
                        adm20Value::setComment2,
                        item);
            }
        }

        private static void applyLaboValue(
                java.util.function.Consumer<String> dateSetter,
                java.util.function.Consumer<String> valueSetter,
                java.util.function.Consumer<String> comment1Setter,
                java.util.function.Consumer<String> comment2Setter,
                NLaboItem item) {
            dateSetter.accept(item.getSampleDate());
            valueSetter.accept(item.getValue());
            comment1Setter.accept(item.getComment1());
            comment2Setter.accept(item.getComment2());
        }

        private static <T> List<T> buildDiagnosisList(List<RegisteredDiagnosisModel> models, Supplier<T> supplier) {
            return models.stream().map(model -> {
                T instance = supplier.get();
                if (instance instanceof open.dolphin.touch.converter.IRegisteredDiagnosis touch) {
                    touch.fromModel(model);
                    return instance;
                } else if (instance instanceof open.dolphin.adm10.converter.IRegisteredDiagnosis adm10) {
                    adm10.fromModel(model);
                    return instance;
                } else if (instance instanceof open.dolphin.adm20.converter.IRegisteredDiagnosis adm20) {
                    adm20.fromModel(model);
                    return instance;
                }
                throw new IllegalArgumentException("Unsupported diagnosis converter " + instance.getClass());
            }).toList();
        }
    }

    private static final class AdmFixtures {

        private AdmFixtures() {
        }

        private static final ZoneId TOKYO = ZoneId.of("Asia/Tokyo");

        static PatientModel createPatientModel() {
            PatientModel patient = new PatientModel();
            patient.setId(1200L);
            patient.setFacilityId("F001");
            patient.setPatientId("000010");
            patient.setFamilyName("田中");
            patient.setGivenName("太郎");
            patient.setFullName("田中 太郎");
            patient.setKanaFamilyName("タナカ");
            patient.setKanaGivenName("タロウ");
            patient.setKanaName("タナカ タロウ");
            patient.setRomanFamilyName("Tanaka");
            patient.setRomanGivenName("Taro");
            patient.setRomanName("Taro Tanaka");
            patient.setGender("M");
            patient.setGenderDesc("男性");
            patient.setBirthday("1980-05-05");
            patient.setNationality("JP");
            patient.setNationalityDesc("日本");
            patient.setNationalityCodeSys("ISO3166-1");
            patient.setMaritalStatus("M");
            patient.setMaritalStatusDesc("既婚");
            patient.setJpegPhoto("photo-bytes".getBytes(StandardCharsets.UTF_8));
            patient.setMemo("要配慮: スギ花粉アレルギー");
            SimpleAddressModel address = new SimpleAddressModel();
            address.setZipCode("105-0011");
            address.setAddress("東京都港区芝公園1-1-1");
            patient.setSimpleAddressModel(address);
            patient.setTelephone("03-0000-1234");
            patient.setMobilePhone("080-0000-5678");
            patient.setEmail("taro.tanaka@example.com");
            patient.setFirstVisited(Date.from(LocalDate.of(2020, 4, 1).atStartOfDay(TOKYO).toInstant()));
            patient.setReserve1("ワクチン待機");
            patient.setReserve2("在宅酸素");
            patient.setReserve3("MRワクチン済");
            patient.setReserve4("要薬剤指導");
            patient.setReserve5("家族付き添い");
            patient.setReserve6("要通訳");
            patient.setRelations("妻: 田中花子");
            patient.setOwnerUUID("client-uuid-12345");
            patient.setPvtDate("2025-11-08T09:05:00");
            patient.setAppMemo("月次訪問リハビリ");

            HealthInsuranceModel insurance = new HealthInsuranceModel();
            insurance.setPatient(patient);
            insurance.setBeanBytes(xmlEncode(createPvtHealthInsurance()));
            patient.setHealthInsurances(List.of(insurance));
            return patient;
        }

        static VisitPackage createVisitPackage() {
            PatientModel patient = createPatientModel();
            VisitPackage visitPackage = new VisitPackage();
            visitPackage.setKartePk(223344L);
            visitPackage.setNumber("F001JPN000000000999");
            visitPackage.setMode(1);
            visitPackage.setPatientModel(patient);
            visitPackage.setPatientVisitModel(createPatientVisitModel(patient));
            visitPackage.setAllergies(createAllergies());
            visitPackage.setPatientMemoModel(createPatientMemo("在宅リハビリの持参書類を確認"));
            visitPackage.setDisease(createDiagnosisModels());
            return visitPackage;
        }

        static List<RegisteredDiagnosisModel> createDiagnosisModels() {
            RegisteredDiagnosisModel allergy = new RegisteredDiagnosisModel();
            allergy.setId(3100L);
            allergy.setDiagnosis("季節性アレルギー性鼻炎");
            allergy.setDiagnosisCode("J30.4");
            allergy.setDiagnosisCodeSystem("ICD10");
            allergy.setCategory("main");
            allergy.setCategoryDesc("主病名");
            allergy.setCategoryCodeSys("local");
            allergy.setOutcome("observing");
            allergy.setOutcomeDesc("経過観察");
            allergy.setOutcomeCodeSys("legacy");
            allergy.setFirstEncounterDate("2024-02-01");
            allergy.setRelatedHealthInsurance("uuid-001");
            allergy.setConfirmed(Date.from(LocalDate.of(2025, 2, 14).atStartOfDay(TOKYO).toInstant()));
            allergy.setStarted(Date.from(LocalDate.of(2025, 2, 10).atStartOfDay(TOKYO).toInstant()));
            allergy.setEnded(Date.from(LocalDate.of(2025, 3, 1).atStartOfDay(TOKYO).toInstant()));
            allergy.setRecorded(Date.from(LocalDate.of(2025, 2, 15).atTime(9, 30).atZone(TOKYO).toInstant()));
            allergy.setLinkId(9001L);
            allergy.setLinkRelation("parent");
            allergy.setStatus("Final");

            RegisteredDiagnosisModel anemia = new RegisteredDiagnosisModel();
            anemia.setId(3101L);
            anemia.setDiagnosis("鉄欠乏性貧血");
            anemia.setDiagnosisCode("D50.9");
            anemia.setDiagnosisCodeSystem("ICD10");
            anemia.setCategory("subs");
            anemia.setCategoryDesc("疑い");
            anemia.setCategoryCodeSys("local");
            anemia.setOutcome("in_treatment");
            anemia.setOutcomeDesc("治療中");
            anemia.setOutcomeCodeSys("legacy");
            anemia.setFirstEncounterDate("2025-05-01");
            anemia.setRelatedHealthInsurance("uuid-001");
            anemia.setConfirmed(Date.from(LocalDate.of(2025, 5, 2).atStartOfDay(TOKYO).toInstant()));
            anemia.setStarted(Date.from(LocalDate.of(2025, 5, 1).atStartOfDay(TOKYO).toInstant()));
            anemia.setEnded(Date.from(LocalDate.of(2025, 7, 15).atStartOfDay(TOKYO).toInstant()));
            anemia.setRecorded(Date.from(LocalDate.of(2025, 5, 2).atTime(10, 15).atZone(TOKYO).toInstant()));
            anemia.setLinkId(9002L);
            anemia.setLinkRelation("child");
            anemia.setStatus("Final");

            return List.of(allergy, anemia);
        }

        static List<NLaboItem> createLaboItems() {
            NLaboItem older = new NLaboItem();
            older.setId(9100L);
            older.setPatientId("F001:000010");
            older.setSampleDate("2025-06-15");
            older.setLaboCode("LB01");
            older.setGroupCode("CHEM");
            older.setGroupName("生化学");
            older.setParentCode("CHEM/TP");
            older.setItemCode("TP");
            older.setItemName("総蛋白");
            older.setMedisCode("3A015000000000199");
            older.setAbnormalFlg("L");
            older.setNormalValue("6.5-8.0");
            older.setValue("6.6");
            older.setUnit("g/dL");
            older.setSpecimenCode("BLOOD");
            older.setSpecimenName("血液");
            older.setComment1("軽度低下");
            older.setComment2("栄養指導中");
            older.setCommentCode1("C1");
            older.setCommentCode2("C2");
            older.setLipemia("0");
            older.setHemolysis("0");
            older.setDialysis("before");
            older.setReportStatus("completed");
            older.setSortKey("CHEM-TP-20250615");

            NLaboItem recent = new NLaboItem();
            recent.setId(9101L);
            recent.setPatientId("F001:000010");
            recent.setSampleDate("2025-08-02");
            recent.setLaboCode("LB01");
            recent.setGroupCode("CHEM");
            recent.setGroupName("生化学");
            recent.setParentCode("CHEM/TP");
            recent.setItemCode("TP");
            recent.setItemName("総蛋白");
            recent.setMedisCode("3A015000000000199");
            recent.setAbnormalFlg("N");
            recent.setNormalValue("6.5-8.0");
            recent.setValue("7.1");
            recent.setUnit("g/dL");
            recent.setSpecimenCode("BLOOD");
            recent.setSpecimenName("血液");
            recent.setComment1("基準範囲");
            recent.setComment2("経過良好");
            recent.setCommentCode1("C1");
            recent.setCommentCode2("C2");
            recent.setLipemia("0");
            recent.setHemolysis("0");
            recent.setDialysis("before");
            recent.setReportStatus("completed");
            recent.setSortKey("CHEM-TP-20250802");

            return List.of(older, recent);
        }

        private static PVTHealthInsuranceModel createPvtHealthInsurance() {
            PVTHealthInsuranceModel insurance = new PVTHealthInsuranceModel();
            insurance.setGUID("uuid-001");
            insurance.setInsuranceClass("社保本人");
            insurance.setInsuranceClassCode("0601");
            insurance.setInsuranceClassCodeSys("MML0015");
            insurance.setInsuranceNumber("1234567");
            insurance.setClientGroup("AB");
            insurance.setClientNumber("12345678");
            insurance.setFamilyClass("本人");
            insurance.setStartDate("2020-04-01");
            insurance.setExpiredDate("2030-03-31");
            insurance.setContinuedDisease(new String[]{"喘息", "花粉症"});
            insurance.setPayInRatio("0.3");
            insurance.setPayOutRatio("0.3");

            PVTPublicInsuranceItemModel publicItem = new PVTPublicInsuranceItemModel();
            publicItem.setPriority("1");
            publicItem.setProviderName("公費医療");
            publicItem.setProvider("12345");
            publicItem.setRecipient("98765");
            publicItem.setStartDate("2024-01-01");
            publicItem.setExpiredDate("2026-12-31");
            publicItem.setPaymentRatio("0.9");
            publicItem.setPaymentRatioType("ratio");
            insurance.setPVTPublicInsuranceItem(new PVTPublicInsuranceItemModel[]{publicItem});
            return insurance;
        }

        private static PatientVisitModel createPatientVisitModel(PatientModel patient) {
            PatientVisitModel visit = new PatientVisitModel();
            visit.setId(5500L);
            visit.setPatientModel(patient);
            visit.setFacilityId(patient.getFacilityId());
            visit.setNumber(7);
            visit.setPvtDate("2025-11-08T09:10:00");
            visit.setAppointment("09:15 定期");
            visit.setDepartment("内科");
            visit.setState(3);
            visit.setInsuranceUid("uuid-insurance-visit");
            visit.setDeptCode("01");
            visit.setDeptName("内科");
            visit.setDoctorId("DR1001");
            visit.setDoctorName("桜井 雄大");
            visit.setJmariNumber("JPN1234567890");
            visit.setFirstInsurance("社保本人");
            visit.setMemo("内視鏡事前問診済み");
            return visit;
        }

        private static List<AllergyModel> createAllergies() {
            AllergyModel cedar = new AllergyModel();
            cedar.setObservationId(8001L);
            cedar.setFactor("スギ花粉");
            cedar.setSeverity("high");
            cedar.setSeverityTableId("MML0005");
            cedar.setIdentifiedDate("2020-03-12");
            cedar.setMemo("花粉シーズンは事前投薬");

            AllergyModel penicillin = new AllergyModel();
            penicillin.setObservationId(8002L);
            penicillin.setFactor("ペニシリン");
            penicillin.setSeverity("caution");
            penicillin.setSeverityTableId("MML0005");
            penicillin.setIdentifiedDate("2018-07-02");
            penicillin.setMemo("皮疹あり");

            return List.of(cedar, penicillin);
        }

        private static PatientMemoModel createPatientMemo(String memo) {
            PatientMemoModel patientMemoModel = new PatientMemoModel();
            patientMemoModel.setId(7800L);
            patientMemoModel.setMemo(memo);
            patientMemoModel.setRecorded(Date.from(LocalDateTime.of(2025, 11, 7, 15, 45).atZone(TOKYO).toInstant()));
            KarteBean karte = new KarteBean();
            karte.setId(6600L);
            patientMemoModel.setKarteBean(karte);
            UserModel user = new UserModel();
            user.setId(101L);
            user.setUserId("doctor01");
            patientMemoModel.setUserModel(user);
            return patientMemoModel;
        }

        private static byte[] xmlEncode(Object bean) {
            try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                 XMLEncoder encoder = new XMLEncoder(baos)) {
                encoder.writeObject(bean);
                encoder.flush();
                return baos.toByteArray();
            } catch (IOException e) {
                throw new IllegalStateException("Failed to encode bean", e);
            }
        }
    }
}
