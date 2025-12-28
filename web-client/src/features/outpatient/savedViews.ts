export type PaymentMode = 'all' | 'insurance' | 'self';

export type OutpatientSavedView = {
  id: string;
  label: string;
  updatedAt: string;
  filters: {
    keyword?: string;
    department?: string;
    physician?: string;
    paymentMode?: PaymentMode;
    sort?: string;
    date?: string;
  };
};

const STORAGE_KEY = 'opendolphin:web-client:outpatient-saved-views:v1';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeViews = (value: unknown): OutpatientSavedView[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const item = raw as Partial<OutpatientSavedView>;
      if (typeof item.label !== 'string' || item.label.trim().length === 0) return null;
      const id = typeof item.id === 'string' ? item.id : generateId();
      const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString();
      const filters = typeof item.filters === 'object' && item.filters ? item.filters : {};
      return {
        id,
        label: item.label.trim(),
        updatedAt,
        filters: {
          keyword: typeof filters.keyword === 'string' ? filters.keyword : undefined,
          department: typeof filters.department === 'string' ? filters.department : undefined,
          physician: typeof filters.physician === 'string' ? filters.physician : undefined,
          paymentMode: (filters.paymentMode as PaymentMode | undefined) ?? undefined,
          sort: typeof filters.sort === 'string' ? filters.sort : undefined,
          date: typeof filters.date === 'string' ? filters.date : undefined,
        },
      } as OutpatientSavedView;
    })
    .filter((item): item is OutpatientSavedView => Boolean(item));
};

export const loadOutpatientSavedViews = (): OutpatientSavedView[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return normalizeViews(parsed).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
};

const persistViews = (views: OutpatientSavedView[]) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch {
    // ignore
  }
};

export const upsertOutpatientSavedView = (input: Omit<OutpatientSavedView, 'id' | 'updatedAt'> & { id?: string }) => {
  const views = loadOutpatientSavedViews();
  const now = new Date().toISOString();
  const label = input.label.trim();
  if (!label) return views;
  const existingIndex = views.findIndex((view) => view.id === input.id || view.label === label);
  const next: OutpatientSavedView = {
    id: input.id ?? (existingIndex >= 0 ? views[existingIndex].id : generateId()),
    label,
    updatedAt: now,
    filters: {
      keyword: input.filters.keyword,
      department: input.filters.department,
      physician: input.filters.physician,
      paymentMode: input.filters.paymentMode,
      sort: input.filters.sort,
      date: input.filters.date,
    },
  };
  if (existingIndex >= 0) {
    const updated = [...views];
    updated[existingIndex] = next;
    persistViews(updated);
    return updated;
  }
  const updated = [next, ...views];
  persistViews(updated);
  return updated;
};

export const removeOutpatientSavedView = (id: string) => {
  const views = loadOutpatientSavedViews();
  const updated = views.filter((view) => view.id !== id);
  persistViews(updated);
  return updated;
};

export const resolvePaymentMode = (insurance?: string): PaymentMode | undefined => {
  if (!insurance) return undefined;
  const normalized = insurance.toLowerCase();
  if (normalized.includes('自費') || normalized.includes('self')) return 'self';
  return 'insurance';
};
