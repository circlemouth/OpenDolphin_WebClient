export type OrcaIdentifierInput = {
  invoiceNumber?: string | null;
  dataId?: string | null;
};

const buildIdentifier = (label: 'Invoice_Number' | 'Data_Id', value?: string | null) =>
  value ? `${label}: ${value}` : undefined;

export const formatOrcaIdentifier = (label: 'Invoice_Number' | 'Data_Id', value?: string | null) =>
  buildIdentifier(label, value);

export const formatOrcaIdentifierInline = (input: OrcaIdentifierInput, separator = ' / ') => {
  const parts = [
    buildIdentifier('Invoice_Number', input.invoiceNumber),
    buildIdentifier('Data_Id', input.dataId),
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(separator) : undefined;
};
