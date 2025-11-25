# ADM Converter Snapshot Run (2025-11-12)

- RUN_ID: `20251116TadmSnapshotZ1`
- Commit: `39e72cf8bc225e1ccb4bf0183affa48a5a7308e0`
- Command: `mvn -f server-modernized/pom.xml test -Dtest=AdmConverterSnapshotTest -DskipITs=false`
- Fixture source: `ops/tests/fixtures/adm/adm{10,20}/*.json` (tracked, referenced via `adm.snapshot.fixtureDir`).
- Result: All four snapshot scenarios (patient_model / visit_package / labo_item / registered_diagnosis) succeeded with no diffs; no new `baseline/actual/diff` directories were emitted under `artifacts/parity-manual/adm-snapshots/`.
- Evidence: See `server-modernized/target/surefire-reports/open.dolphin.adm.AdmConverterSnapshotTest.{txt,xml}` for the Surefire output; timestamps match RUN_ID execution.
- Notes: The SAX warnings observed during `AdmConverterSnapshotTest` execution remain non-blocking and match prior runs; no fixture rewrites were performed (`adm.snapshot.update=false`).
