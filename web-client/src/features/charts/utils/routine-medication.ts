import type { RoutineMedicationEntry, RoutineMedicationModule } from '@/features/charts/api/masuda-api';

const toDateLabel = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const yyyy = `${date.getFullYear()}`.padStart(4, '0');
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const summarizeRoutineModule = (module: RoutineMedicationModule): string | null => {
  const info = module.moduleInfoBean;
  if (!info) {
    return null;
  }

  const name = info.stampName ?? info.stampId ?? '';
  const entity = info.entity ? `（${info.entity}）` : '';
  const label = `${name}${entity}`.trim();
  return label.length ? label : null;
};

export const routineMedicationLabel = (entry: RoutineMedicationEntry): string => {
  if (entry.name && entry.name.trim().length) {
    return entry.name.trim();
  }

  const modules = entry.moduleList ?? [];
  const stampName = modules
    .find((module) => module.moduleInfoBean?.stampName && module.moduleInfoBean.stampName.trim().length)
    ?.moduleInfoBean?.stampName;
  if (stampName) {
    return stampName.trim();
  }

  const id = entry.id != null ? `#${entry.id}` : '';
  return `定期処方${id}`.trim();
};

export const routineMedicationModules = (
  entry: RoutineMedicationEntry,
  limit = 5,
): string[] => {
  const modules = entry.moduleList ?? [];
  return modules
    .map(summarizeRoutineModule)
    .filter((module): module is string => Boolean(module && module.trim().length))
    .slice(0, limit);
};

export const routineMedicationUpdatedAt = (entry: RoutineMedicationEntry): string | null =>
  toDateLabel(entry.lastUpdated);

