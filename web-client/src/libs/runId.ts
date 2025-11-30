const padNumber = (value: number, length = 2) => value.toString().padStart(length, '0');

const envRunIdKeys = [
  'VITE_RUN_ID',
  'VITE_ORCA_MASTER_BRIDGE_RUN_ID',
  'VITE_ORCA_MASTER_RUN_ID',
];

export const getCurrentRunId = () => {
  for (const key of envRunIdKeys) {
    const value = import.meta.env[key as keyof ImportMetaEnv];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return 'local-dev';
};

const parseRunId = (runId: string): Date | null => {
  const match = runId.match(/^(\d{8})T(\d{6})Z$/);
  if (!match) {
    return null;
  }
  const [_, datePart, timePart] = match;
  const year = Number(datePart.slice(0, 4));
  const month = Number(datePart.slice(4, 6)) - 1;
  const day = Number(datePart.slice(6, 8));
  const hours = Number(timePart.slice(0, 2));
  const minutes = Number(timePart.slice(2, 4));
  const seconds = Number(timePart.slice(4, 6));
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
};

const formatRunId = (date: Date) =>
  `${date.getUTCFullYear()}${padNumber(date.getUTCMonth() + 1)}${padNumber(date.getUTCDate())}T${padNumber(
    date.getUTCHours(),
  )}${padNumber(date.getUTCMinutes())}${padNumber(date.getUTCSeconds())}Z`;

export const buildRunIdHistory = (currentRunId: string | null | undefined, steps = 3, intervalMinutes = 10) => {
  if (!currentRunId) {
    return [];
  }
  const origin = parseRunId(currentRunId);
  if (!origin) {
    return [];
  }
  const history: string[] = [];
  for (let index = 0; index < steps; index += 1) {
    const offsetDate = new Date(origin.getTime() - index * intervalMinutes * 60 * 1000);
    history.push(formatRunId(offsetDate));
  }
  return history;
};
