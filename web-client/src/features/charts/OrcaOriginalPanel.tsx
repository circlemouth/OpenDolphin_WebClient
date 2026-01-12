import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { resolveAriaLive } from '../../libs/observability/observability';
import { buildDiseaseGetRequestXml, fetchOrcaDiseaseGetXml } from './orcaDiseaseGetApi';
import { buildMedicalGetRequestXml, fetchOrcaMedicalGetXml } from './orcaMedicalGetApi';
import { postOrcaDiseaseV3Xml } from './orcaDiseaseModApi';
import { postOrcaMedicalModXml } from './orcaMedicalModApi';
import { recordChartsAuditEvent } from './audit';

type OrcaOriginalPanelProps = {
  patientId?: string;
  visitDate?: string;
  runId?: string;
};

const buildDiseaseModTemplate = (patientId?: string, performDate?: string) => {
  return [
    '<data>',
    '  <diseasereq type="record">',
    `    <Patient_ID type="string">${patientId ?? ''}</Patient_ID>`,
    '    <Base_Month type="string"></Base_Month>',
    `    <Perform_Date type="string">${performDate ?? ''}</Perform_Date>`,
    '    <Perform_Time type="string"></Perform_Time>',
    '    <Diagnosis_Information type="record">',
    '      <Department_Code type="string">01</Department_Code>',
    '    </Diagnosis_Information>',
    '    <Disease_Information type="array">',
    '      <Disease_Information_child type="record">',
    '        <Disease_Code type="string">0000999</Disease_Code>',
    '        <Disease_Name type="string">テスト病名</Disease_Name>',
    `        <Disease_StartDate type="string">${performDate ?? ''}</Disease_StartDate>`,
    '        <Disease_EndDate type="string"></Disease_EndDate>',
    '      </Disease_Information_child>',
    '    </Disease_Information>',
    '  </diseasereq>',
    '</data>',
  ].join('\n');
};

const buildMedicalModTemplate = (patientId?: string, performDate?: string) => {
  return [
    '<data>',
    '  <medicalreq type="record">',
    `    <Patient_ID type="string">${patientId ?? ''}</Patient_ID>`,
    `    <Perform_Date type="string">${performDate ?? ''}</Perform_Date>`,
    '    <Diagnosis_Information type="record">',
    '      <Department_Code type="string">01</Department_Code>',
    '      <Physician_Code type="string">10001</Physician_Code>',
    '      <HealthInsurance_Information type="record">',
    '        <Insurance_Combination_Number type="string">0001</Insurance_Combination_Number>',
    '      </HealthInsurance_Information>',
    '      <Medical_Information type="array">',
    '        <Medical_Information_child type="record">',
    '          <Medical_Class type="string">120</Medical_Class>',
    '          <Medical_Class_Name type="string">再診</Medical_Class_Name>',
    '          <Medical_Class_Number type="string">1</Medical_Class_Number>',
    '          <Medication_info type="array">',
    '            <Medication_info_child type="record">',
    '              <Medication_Code type="string">112007410</Medication_Code>',
    '              <Medication_Number type="string">1</Medication_Number>',
    '            </Medication_info_child>',
    '          </Medication_info>',
    '        </Medical_Information_child>',
    '      </Medical_Information>',
    '    </Diagnosis_Information>',
    '  </medicalreq>',
    '</data>',
  ].join('\n');
};

export function OrcaOriginalPanel({ patientId, visitDate, runId }: OrcaOriginalPanelProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const baseMonth = useMemo(() => (visitDate ? visitDate.slice(0, 7) : today.slice(0, 7)), [today, visitDate]);
  const diseaseTemplate = useMemo(
    () => (patientId ? buildDiseaseGetRequestXml({ patientId, baseDate: baseMonth }) : ''),
    [baseMonth, patientId],
  );
  const medicalTemplate = useMemo(
    () =>
      patientId
        ? buildMedicalGetRequestXml({
            patientId,
            inOut: 'O',
            performDate: visitDate ?? today,
            forMonths: '12',
          })
        : '',
    [patientId, today, visitDate],
  );
  const diseaseModTemplate = useMemo(
    () => buildDiseaseModTemplate(patientId, visitDate ?? today),
    [patientId, today, visitDate],
  );
  const medicalModTemplate = useMemo(
    () => buildMedicalModTemplate(patientId, visitDate ?? today),
    [patientId, today, visitDate],
  );

  const [diseaseXml, setDiseaseXml] = useState<string>(diseaseTemplate);
  const [medicalXml, setMedicalXml] = useState<string>(medicalTemplate);
  const [diseaseModXml, setDiseaseModXml] = useState<string>(diseaseModTemplate);
  const [medicalModXml, setMedicalModXml] = useState<string>(medicalModTemplate);
  const [diseaseDirty, setDiseaseDirty] = useState(false);
  const [medicalDirty, setMedicalDirty] = useState(false);
  const [diseaseModDirty, setDiseaseModDirty] = useState(false);
  const [medicalModDirty, setMedicalModDirty] = useState(false);

  useEffect(() => {
    if (!diseaseDirty) setDiseaseXml(diseaseTemplate);
  }, [diseaseDirty, diseaseTemplate]);

  useEffect(() => {
    if (!medicalDirty) setMedicalXml(medicalTemplate);
  }, [medicalDirty, medicalTemplate]);

  useEffect(() => {
    if (!diseaseModDirty) setDiseaseModXml(diseaseModTemplate);
  }, [diseaseModDirty, diseaseModTemplate]);

  useEffect(() => {
    if (!medicalModDirty) setMedicalModXml(medicalModTemplate);
  }, [medicalModDirty, medicalModTemplate]);

  const diseaseMutation = useMutation({
    mutationFn: () => fetchOrcaDiseaseGetXml(diseaseXml),
    onSuccess: (result) => {
      logAuditEvent({
        runId: result.runId ?? runId,
        source: 'charts-orca-original',
        payload: {
          action: 'ORCA_DISEASE_GET_XML',
          outcome: result.ok ? 'success' : 'error',
          details: {
            patientId,
            endpoint: 'diseasegetv2',
            apiResult: result.apiResult,
            apiResultMessage: result.apiResultMessage,
            status: result.status,
          },
        },
      });
      logUiState({
        action: 'orca_original_fetch',
        screen: 'charts',
        runId: result.runId ?? runId,
        details: {
          endpoint: 'diseasegetv2',
          patientId,
          status: result.status,
          apiResult: result.apiResult,
          apiResultMessage: result.apiResultMessage,
        },
      });
    },
  });

  const medicalMutation = useMutation({
    mutationFn: () => fetchOrcaMedicalGetXml(medicalXml),
    onSuccess: (result) => {
      logAuditEvent({
        runId: result.runId ?? runId,
        source: 'charts-orca-original',
        payload: {
          action: 'ORCA_MEDICAL_GET_XML',
          outcome: result.ok ? 'success' : 'error',
          details: {
            patientId,
            endpoint: 'medicalgetv2',
            apiResult: result.apiResult,
            apiResultMessage: result.apiResultMessage,
            status: result.status,
          },
        },
      });
      logUiState({
        action: 'orca_original_fetch',
        screen: 'charts',
        runId: result.runId ?? runId,
        details: {
          endpoint: 'medicalgetv2',
          patientId,
          status: result.status,
          apiResult: result.apiResult,
          apiResultMessage: result.apiResultMessage,
        },
      });
    },
  });

  const diseaseModMutation = useMutation({
    mutationFn: () => postOrcaDiseaseV3Xml(diseaseModXml),
    onSuccess: (result) => {
      recordChartsAuditEvent({
        action: 'ORCA_DISEASE_DIRECT_SEND',
        outcome: result.ok ? 'success' : 'error',
        runId: result.runId ?? runId,
        patientId,
        details: {
          endpoint: 'diseasev3',
          apiResult: result.apiResult,
          apiResultMessage: result.apiResultMessage,
          httpStatus: result.status,
        },
      });
    },
  });

  const medicalModMutation = useMutation({
    mutationFn: () => postOrcaMedicalModXml(medicalModXml),
    onSuccess: (result) => {
      recordChartsAuditEvent({
        action: 'ORCA_MEDICAL_DIRECT_SEND',
        outcome: result.ok ? 'success' : 'error',
        runId: result.runId ?? runId,
        patientId,
        details: {
          endpoint: 'medicalmodv2',
          apiResult: result.apiResult,
          apiResultMessage: result.apiResultMessage,
          httpStatus: result.status,
        },
      });
    },
  });

  const infoLive = resolveAriaLive('info');

  return (
    <section className="charts-orca-original" aria-live={infoLive}>
      <header className="charts-orca-original__header">
        <div>
          <p className="charts-orca-original__kicker">ORCA 原本</p>
          <h3>ORCA 原本参照 / 直送</h3>
          <p className="charts-orca-original__sub">
            diseasegetv2 / medicalgetv2 を XML2 で取得し、必要に応じて diseasev3 / medicalmodv2 を直送します。
          </p>
        </div>
      </header>

      {!patientId ? (
        <p className="charts-orca-original__empty">患者を選択すると ORCA 原本 API を利用できます。</p>
      ) : (
        <>
          <div className="charts-orca-original__section">
            <div className="charts-orca-original__section-head">
              <div>
                <strong>diseasegetv2</strong>
                <span>病名原本</span>
              </div>
              <div className="charts-orca-original__section-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setDiseaseXml(diseaseTemplate);
                    setDiseaseDirty(false);
                  }}
                  disabled={diseaseMutation.isPending}
                >
                  テンプレ
                </button>
                <button type="button" onClick={() => diseaseMutation.mutate()} disabled={diseaseMutation.isPending}>
                  {diseaseMutation.isPending ? '取得中…' : '取得'}
                </button>
              </div>
            </div>
            <textarea
              className="charts-orca-original__textarea"
              value={diseaseXml}
              rows={10}
              onChange={(event) => {
                setDiseaseXml(event.target.value);
                setDiseaseDirty(true);
              }}
            />
            <div className="charts-orca-original__meta">
              <span>Api_Result: {diseaseMutation.data?.apiResult ?? '—'}</span>
              <span>Message: {diseaseMutation.data?.apiResultMessage ?? '—'}</span>
            </div>
            <pre className="charts-orca-original__response">{diseaseMutation.data?.rawXml ?? '—'}</pre>
          </div>

          <div className="charts-orca-original__section">
            <div className="charts-orca-original__section-head">
              <div>
                <strong>medicalgetv2</strong>
                <span>診療原本</span>
              </div>
              <div className="charts-orca-original__section-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setMedicalXml(medicalTemplate);
                    setMedicalDirty(false);
                  }}
                  disabled={medicalMutation.isPending}
                >
                  テンプレ
                </button>
                <button type="button" onClick={() => medicalMutation.mutate()} disabled={medicalMutation.isPending}>
                  {medicalMutation.isPending ? '取得中…' : '取得'}
                </button>
              </div>
            </div>
            <textarea
              className="charts-orca-original__textarea"
              value={medicalXml}
              rows={12}
              onChange={(event) => {
                setMedicalXml(event.target.value);
                setMedicalDirty(true);
              }}
            />
            <div className="charts-orca-original__meta">
              <span>Api_Result: {medicalMutation.data?.apiResult ?? '—'}</span>
              <span>Message: {medicalMutation.data?.apiResultMessage ?? '—'}</span>
            </div>
            <pre className="charts-orca-original__response">{medicalMutation.data?.rawXml ?? '—'}</pre>
          </div>

          <details className="charts-orca-original__section">
            <summary className="charts-orca-original__summary">ORCA 直送（XML2）</summary>
            <div className="charts-orca-original__direct">
              <div className="charts-orca-original__section-head">
                <div>
                  <strong>diseasev3</strong>
                  <span>病名直送</span>
                </div>
                <div className="charts-orca-original__section-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setDiseaseModXml(diseaseModTemplate);
                      setDiseaseModDirty(false);
                    }}
                    disabled={diseaseModMutation.isPending}
                  >
                    テンプレ
                  </button>
                  <button type="button" onClick={() => diseaseModMutation.mutate()} disabled={diseaseModMutation.isPending}>
                    {diseaseModMutation.isPending ? '送信中…' : '直送'}
                  </button>
                </div>
              </div>
              <textarea
                className="charts-orca-original__textarea"
                value={diseaseModXml}
                rows={10}
                onChange={(event) => {
                  setDiseaseModXml(event.target.value);
                  setDiseaseModDirty(true);
                }}
              />
              <div className="charts-orca-original__meta">
                <span>Api_Result: {diseaseModMutation.data?.apiResult ?? '—'}</span>
                <span>Message: {diseaseModMutation.data?.apiResultMessage ?? '—'}</span>
              </div>
              <pre className="charts-orca-original__response">{diseaseModMutation.data?.rawXml ?? '—'}</pre>
            </div>

            <div className="charts-orca-original__direct">
              <div className="charts-orca-original__section-head">
                <div>
                  <strong>medicalmodv2</strong>
                  <span>診療直送</span>
                </div>
                <div className="charts-orca-original__section-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setMedicalModXml(medicalModTemplate);
                      setMedicalModDirty(false);
                    }}
                    disabled={medicalModMutation.isPending}
                  >
                    テンプレ
                  </button>
                  <button type="button" onClick={() => medicalModMutation.mutate()} disabled={medicalModMutation.isPending}>
                    {medicalModMutation.isPending ? '送信中…' : '直送'}
                  </button>
                </div>
              </div>
              <textarea
                className="charts-orca-original__textarea"
                value={medicalModXml}
                rows={12}
                onChange={(event) => {
                  setMedicalModXml(event.target.value);
                  setMedicalModDirty(true);
                }}
              />
              <div className="charts-orca-original__meta">
                <span>Api_Result: {medicalModMutation.data?.apiResult ?? '—'}</span>
                <span>Message: {medicalModMutation.data?.apiResultMessage ?? '—'}</span>
              </div>
              <pre className="charts-orca-original__response">{medicalModMutation.data?.rawXml ?? '—'}</pre>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
