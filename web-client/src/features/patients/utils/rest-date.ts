const pad = (value: number): string => value.toString().padStart(2, '0');

export const formatRestDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const defaultKarteFromDate = (): string => formatRestDate(new Date(2000, 0, 1, 0, 0, 0));
