import { resolveRunId } from '../../libs/observability/observability';

export type PatientMetaRowVariant = 'compact' | 'detailed';
export type PatientMetaRowSeparator = 'pipe' | 'slash' | 'dot' | 'none';

export interface PatientMetaRowProps {
  patientId?: string;
  receptionId?: string;
  appointmentId?: string;
  birthDateIso?: string;
  birthDateEra?: string;
  sex?: string;
  age?: string;
  variant?: PatientMetaRowVariant;
  showLabels?: boolean;
  showEmpty?: boolean;
  separator?: PatientMetaRowSeparator;
  runId?: string;
  className?: string;
  ariaLabel?: string;
  as?: 'div' | 'span';
  itemClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  detailClassName?: string;
}

type MetaItem = {
  label: string;
  value: string;
};

const normalizeValue = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '—') return undefined;
  return trimmed;
};

const buildItem = (label: string, value?: string, showEmpty?: boolean): MetaItem | undefined => {
  const normalized = normalizeValue(value);
  if (!normalized && !showEmpty) return undefined;
  return { label, value: normalized ?? '—' };
};

const separatorLabel = (separator: PatientMetaRowSeparator): string => {
  switch (separator) {
    case 'slash':
      return '/';
    case 'dot':
      return '・';
    case 'pipe':
      return '｜';
    default:
      return '';
  }
};

const buildDetailLabel = (sex?: string, age?: string): string | undefined => {
  const safeSex = normalizeValue(sex);
  const safeAge = normalizeValue(age);
  if (safeSex && safeAge) return `${safeSex} / ${safeAge}`;
  return safeSex ?? safeAge;
};

const buildBirthLabel = (era?: string, iso?: string): string | undefined => {
  const safeEra = normalizeValue(era);
  const safeIso = normalizeValue(iso);
  if (safeEra && safeIso) return `${safeEra} / ${safeIso}`;
  return safeEra ?? safeIso;
};

export function PatientMetaRow({
  patientId,
  receptionId,
  appointmentId,
  birthDateIso,
  birthDateEra,
  sex,
  age,
  variant = 'compact',
  showLabels = true,
  showEmpty = false,
  separator = 'pipe',
  runId,
  className,
  ariaLabel,
  as = 'div',
  itemClassName,
  labelClassName,
  valueClassName,
  detailClassName,
}: PatientMetaRowProps) {
  const items = [
    buildItem('患者ID', patientId, showEmpty),
    buildItem('受付ID', receptionId, showEmpty),
    buildItem('予約ID', appointmentId, showEmpty),
  ].filter((item): item is MetaItem => Boolean(item));

  const detailItems = [] as MetaItem[];
  const sexAgeLabel = buildDetailLabel(sex, age);
  if (sexAgeLabel) detailItems.push({ label: '性別/年齢', value: sexAgeLabel });
  const birthLabel = buildBirthLabel(birthDateEra, birthDateIso);
  if (birthLabel) detailItems.push({ label: '生年月日', value: birthLabel });

  const resolvedRunId = resolveRunId(runId);
  const Container = as;
  const LineTag = as;
  const ItemTag = as;
  const separatorText = separator !== 'none' ? separatorLabel(separator) : '';
  const hasSeparators = separatorText !== '';

  const renderItem = (item: MetaItem, index: number, list: MetaItem[]) => {
    const itemLabel = showLabels ? `${item.label}` : undefined;
    return (
      <ItemTag
        key={`${item.label}-${index}`}
        className={`patient-meta-row__item${itemClassName ? ` ${itemClassName}` : ''}`}
      >
        {itemLabel ? (
          <span className={`patient-meta-row__label${labelClassName ? ` ${labelClassName}` : ''}`}>
            {itemLabel}
          </span>
        ) : null}
        <span className={`patient-meta-row__value${valueClassName ? ` ${valueClassName}` : ''}`}>
          {item.value}
        </span>
        {hasSeparators && index < list.length - 1 ? (
          <span className="patient-meta-row__separator" aria-hidden="true">
            {separatorText}
          </span>
        ) : null}
      </ItemTag>
    );
  };

  const ariaText =
    ariaLabel ??
    items
      .map((item) => (showLabels ? `${item.label}:${item.value}` : item.value))
      .join('、');

  return (
    <Container
      className={`patient-meta-row${className ? ` ${className}` : ''}`}
      data-variant={variant}
      data-run-id={resolvedRunId}
      aria-label={ariaText || undefined}
    >
      <LineTag className="patient-meta-row__line">{items.map(renderItem)}</LineTag>
      {variant === 'detailed' && detailItems.length > 0 ? (
        <LineTag className="patient-meta-row__details">
          {detailItems.map((item, index, list) => (
            <span
              key={`${item.label}-${index}`}
              className={`patient-meta-row__detail${detailClassName ? ` ${detailClassName}` : ''}`}
            >
              {showLabels ? `${item.label}: ` : ''}
              {item.value}
              {hasSeparators && index < list.length - 1 ? (
                <span className="patient-meta-row__separator" aria-hidden="true">
                  {separatorText}
                </span>
              ) : null}
            </span>
          ))}
        </LineTag>
      ) : null}
    </Container>
  );
}
