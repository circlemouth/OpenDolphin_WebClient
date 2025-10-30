const cryptoRandomUuid = () => {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (char) => {
    const r = (Math.random() * 16) | 0;
    const v = char === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const generateDocumentId = () =>
  (globalThis.crypto?.randomUUID?.() ?? cryptoRandomUuid()).replace(/-/g, '').slice(0, 32);
