const pad = (value: number) => value.toString().padStart(2, '0');

export const formatRestTimestamp = (date: Date) => {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = jst.getUTCFullYear();
  const month = pad(jst.getUTCMonth() + 1);
  const day = pad(jst.getUTCDate());
  const hours = pad(jst.getUTCHours());
  const minutes = pad(jst.getUTCMinutes());
  const seconds = pad(jst.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
