export const formatRestTimestamp = (date: Date) => {
  const iso = date.toISOString();
  return iso.slice(0, 19);
};
