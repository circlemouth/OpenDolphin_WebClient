type XmlMetaOptions = {
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  omitApiResult?: boolean;
  omitApiResultMessage?: boolean;
  warningMessages?: string[];
};

type ReportMetaOptions = {
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  dataId?: string;
  label?: string;
  omitApiResult?: boolean;
  omitApiResultMessage?: boolean;
  omitDataId?: boolean;
};

type PatientGetJsonOptions = {
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  omitApiResult?: boolean;
  omitApiResultMessage?: boolean;
};

const ISO_DATE = '20260113';
const ISO_TIME = '220000';

const resolveMeta = (options?: XmlMetaOptions) => ({
  apiResult: options?.apiResult ?? '00',
  apiResultMessage: options?.apiResultMessage ?? 'OK',
  informationDate: options?.informationDate ?? ISO_DATE,
  informationTime: options?.informationTime ?? ISO_TIME,
  omitApiResult: options?.omitApiResult ?? false,
  omitApiResultMessage: options?.omitApiResultMessage ?? false,
});

const buildApiResultXml = (options?: XmlMetaOptions) => {
  const meta = resolveMeta(options);
  const apiResultTag = meta.omitApiResult ? '' : `<Api_Result type="string">${meta.apiResult}</Api_Result>`;
  const apiResultMessageTag = meta.omitApiResultMessage
    ? ''
    : `<Api_Result_Message type="string">${meta.apiResultMessage}</Api_Result_Message>`;
  return { apiResultTag, apiResultMessageTag, meta };
};

const buildWarningMessagesXml = (messages?: string[]) =>
  messages && messages.length > 0 ? messages.map((message) => `<Api_Warning_Message>${message}</Api_Warning_Message>`).join('') : '';

export const ORCA_ADDITIONAL_INVALID_XML = '<?xml version="1.0" encoding="UTF-8"?><data><broken';

export const ORCA_ADDITIONAL_PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);

export const buildIncomeInfoXml = (options?: XmlMetaOptions) => {
  const { apiResultTag, apiResultMessageTag, meta } = buildApiResultXml(options);
  return `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <incomeinfores type="record">
    ${apiResultTag}
    ${apiResultMessageTag}
    <Information_Date type="string">${meta.informationDate}</Information_Date>
    <Information_Time type="string">${meta.informationTime}</Information_Time>
    <Income_Information type="array">
      <Income_Information_child type="record">
        <Perform_Date type="string">2026-01-10</Perform_Date>
        <Perform_End_Date type="string">2026-01-10</Perform_End_Date>
        <InOut type="string">O</InOut>
        <Invoice_Number type="string">INV-001</Invoice_Number>
        <Department_Name type="string">Internal</Department_Name>
        <Insurance_Combination_Number type="string">0001</Insurance_Combination_Number>
        <Cd_Information type="record">
          <Ac_Money type="string">100</Ac_Money>
          <Ic_Money type="string">50</Ic_Money>
          <Ai_Money type="string">25</Ai_Money>
          <Oe_Money type="string">0</Oe_Money>
          <Ml_Smoney type="string">0</Ml_Smoney>
        </Cd_Information>
      </Income_Information_child>
    </Income_Information>
  </incomeinfores>
</data>
`;
};

export const buildSubjectivesListXml = (options?: XmlMetaOptions) => {
  const { apiResultTag, apiResultMessageTag, meta } = buildApiResultXml(options);
  return `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <subjectiveslstres type="record">
    ${apiResultTag}
    ${apiResultMessageTag}
    <Information_Date type="string">${meta.informationDate}</Information_Date>
    <Information_Time type="string">${meta.informationTime}</Information_Time>
    <Subjectives_Information type="array">
      <Subjectives_Information_child type="record">
        <InOut type="string">O</InOut>
        <Department_Code type="string">01</Department_Code>
        <Department_Name type="string">Internal</Department_Name>
        <Insurance_Combination_Number type="string">0001</Insurance_Combination_Number>
        <Subjectives_Detail_Record type="string">07</Subjectives_Detail_Record>
        <Subjectives_Detail_Record_WholeName type="string">Sample Detail</Subjectives_Detail_Record_WholeName>
        <Subjectives_Number type="string">1</Subjectives_Number>
      </Subjectives_Information_child>
    </Subjectives_Information>
  </subjectiveslstres>
</data>
`;
};

export const buildSubjectivesModXml = (options?: XmlMetaOptions) => {
  const { apiResultTag, apiResultMessageTag, meta } = buildApiResultXml(options);
  const warningMessages = buildWarningMessagesXml(options?.warningMessages);
  return `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <subjectivesmodres type="record">
    ${apiResultTag}
    ${apiResultMessageTag}
    <Information_Date type="string">${meta.informationDate}</Information_Date>
    <Information_Time type="string">${meta.informationTime}</Information_Time>
    ${warningMessages}
    <Subjectives_Number type="string">1</Subjectives_Number>
    <Subjectives_Detail_Record type="string">07</Subjectives_Detail_Record>
    <Subjectives_Detail_Record_WholeName type="string">Sample Detail</Subjectives_Detail_Record_WholeName>
    <Subjectives_Code type="string">TEST</Subjectives_Code>
  </subjectivesmodres>
</data>
`;
};

export const buildContraindicationXml = (options?: XmlMetaOptions) => {
  const { apiResultTag, apiResultMessageTag, meta } = buildApiResultXml(options);
  return `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <contraindication_checkres type="record">
    ${apiResultTag}
    ${apiResultMessageTag}
    <Information_Date type="string">${meta.informationDate}</Information_Date>
    <Information_Time type="string">${meta.informationTime}</Information_Time>
    <Medical_Information type="array">
      <Medical_Information_child type="record">
        <Medication_Code type="string">A100</Medication_Code>
        <Medication_Name type="string">Amlodipine</Medication_Name>
        <Medical_Result type="string">0</Medical_Result>
        <Medical_Result_Message type="string">OK</Medical_Result_Message>
        <Medical_Info type="array">
          <Medical_Info_child type="record">
            <Contra_Code type="string">C001</Contra_Code>
            <Contra_Name type="string">ContraSample</Contra_Name>
            <Context_Class type="string">1</Context_Class>
          </Medical_Info_child>
        </Medical_Info>
      </Medical_Information_child>
    </Medical_Information>
    <Symptom_Information type="array">
      <Symptom_Information_child type="record">
        <Symptom_Code type="string">S001</Symptom_Code>
        <Symptom_Content type="string">Headache</Symptom_Content>
      </Symptom_Information_child>
    </Symptom_Information>
  </contraindication_checkres>
</data>
`;
};

export const buildPatientGetXml = (options?: XmlMetaOptions) => {
  const { apiResultTag, apiResultMessageTag, meta } = buildApiResultXml(options);
  return `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <patientgetv2res type="record">
    ${apiResultTag}
    ${apiResultMessageTag}
    <Information_Date type="string">${meta.informationDate}</Information_Date>
    <Information_Time type="string">${meta.informationTime}</Information_Time>
    <Patient_Information type="record">
      <Patient_ID type="string">000001</Patient_ID>
      <Patient_Name type="string">Sample</Patient_Name>
    </Patient_Information>
  </patientgetv2res>
</data>
`;
};

export const buildPatientGetJson = (options?: PatientGetJsonOptions) => {
  const apiResult = options?.apiResult ?? '0000';
  const apiResultMessage = options?.apiResultMessage ?? 'OK';
  const informationDate = options?.informationDate ?? ISO_DATE;
  const informationTime = options?.informationTime ?? ISO_TIME;
  const base: Record<string, unknown> = {
    Information_Date: informationDate,
    Information_Time: informationTime,
    Patient_Information: {
      Patient_ID: '000001',
      Patient_Name: 'Sample',
    },
  };
  if (!options?.omitApiResult) {
    base.Api_Result = apiResult;
  }
  if (!options?.omitApiResultMessage) {
    base.Api_Result_Message = apiResultMessage;
  }
  return {
    patientgetv2res: base,
  };
};

export const buildReportBody = (options: ReportMetaOptions) => {
  const apiResult = options.apiResult ?? '0000';
  const apiResultMessage = options.apiResultMessage ?? 'OK';
  const informationDate = options.informationDate ?? ISO_DATE;
  const informationTime = options.informationTime ?? ISO_TIME;
  const dataId = options.dataId ?? 'DATA-DEFAULT';
  const label = options.label ?? 'Report';
  const report: Record<string, unknown> = {
    Information_Date: informationDate,
    Information_Time: informationTime,
    Form_ID: `FORM-${dataId}`,
    Form_Name: label,
  };
  if (!options.omitApiResult) {
    report.Api_Result = apiResult;
  }
  if (!options.omitApiResultMessage) {
    report.Api_Result_Message = apiResultMessage;
  }
  if (!options.omitDataId) {
    report.Data_Id = dataId;
  }
  return { report };
};
