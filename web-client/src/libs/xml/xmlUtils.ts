export type XmlParseResult = {
  doc: Document | null;
  error?: string;
};

export type OrcaXmlMeta = {
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
};

export function parseXmlDocument(xmlText: string): XmlParseResult {
  if (typeof DOMParser === 'undefined') {
    return { doc: null, error: 'DOMParser is not available in this environment.' };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    return { doc, error: errorNode.textContent ?? 'XML parse error.' };
  }
  return { doc };
}

export function readXmlText(root: ParentNode | null, selector: string): string | undefined {
  if (!root) return undefined;
  const node = root.querySelector(selector);
  const text = node?.textContent?.trim();
  return text ? text : undefined;
}

export function readXmlTexts(root: ParentNode | null, selector: string): string[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll(selector))
    .map((node) => node.textContent?.trim())
    .filter((value): value is string => Boolean(value));
}

export function extractOrcaXmlMeta(doc: Document | null): OrcaXmlMeta {
  if (!doc) return {};
  return {
    apiResult: readXmlText(doc, 'Api_Result'),
    apiResultMessage: readXmlText(doc, 'Api_Result_Message'),
    informationDate: readXmlText(doc, 'Information_Date'),
    informationTime: readXmlText(doc, 'Information_Time'),
  };
}
