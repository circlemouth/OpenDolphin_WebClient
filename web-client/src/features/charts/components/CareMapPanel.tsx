import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, SurfaceCard } from '@/components';
import { useAppointments } from '@/features/reception/hooks/useAppointments';
import { useLaboModules } from '@/features/charts/hooks/useLaboModules';
import type { DocInfoSummary } from '@/features/charts/types/doc';
import type { MediaItem } from '@/features/charts/types/media';
import {
  buildCareMapEvents,
  formatCareMapDateKey,
  groupCareMapEventsByDate,
  parseCareMapDate,
  type CareMapEvent,
  type CareMapEventType,
} from '@/features/charts/utils/care-map';
import { MasudaSupportPanel } from '@/features/charts/components/MasudaSupportPanel';
import { useAuth } from '@/libs/auth';

interface CareMapPanelProps {
  patientId: string | null;
  patientName?: string;
  karteId: number | null;
  documents: DocInfoSummary[];
  mediaItems: MediaItem[];
  mediaLoading?: boolean;
  mediaError?: unknown;
}

const PanelCard = styled(SurfaceCard)`
  display: grid;
  gap: 16px;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const MonthControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MonthLabel = styled.span`
  font-weight: 600;
  font-size: 1rem;
`;

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const FilterToggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  user-select: none;

  input {
    width: 16px;
    height: 16px;
  }
`;

const CalendarContainer = styled.div`
  display: grid;
  gap: 8px;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const WeekdayCell = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
  font-weight: 600;
`;

const DayButton = styled.button<{
  $isCurrentMonth: boolean;
  $isSelected: boolean;
  $isToday: boolean;
}>`
  border: 1px solid ${({ theme, $isSelected }) => ($isSelected ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $isSelected }) => ($isSelected ? theme.palette.surfaceStrong : theme.palette.surface)};
  color: ${({ theme, $isCurrentMonth }) => ($isCurrentMonth ? theme.palette.text : theme.palette.textMuted)};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 6px;
  min-height: 64px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primaryStrong};
    box-shadow: ${({ theme }) => theme.elevation.level1};
  }

  ${({ $isToday, theme }) =>
    $isToday
      ? `box-shadow: inset 0 0 0 1px ${theme.palette.primaryStrong};`
      : ''};
`;

const DayNumber = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
`;

const EventDots = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const EventDot = styled.span<{ $type: CareMapEventType }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  display: inline-block;
  background: ${({ theme, $type }) => {
    switch ($type) {
      case 'appointment':
        return theme.palette.success;
      case 'lab':
        return theme.palette.warning;
      case 'image':
        return theme.palette.accent;
      case 'attachment':
        return theme.palette.primaryStrong;
      default:
        return theme.palette.primary;
    }
  }};
`;

const EventOverflow = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const SelectedDateHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  span {
    color: ${({ theme }) => theme.palette.textMuted};
    font-size: 0.85rem;
  }
`;

const EventList = styled.div`
  display: grid;
  gap: 10px;
`;

const EventItem = styled.div<{ $type: CareMapEventType }>`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-left: 4px solid
    ${({ theme, $type }) => {
      switch ($type) {
        case 'appointment':
          return theme.palette.success;
        case 'lab':
          return theme.palette.warning;
        case 'image':
          return theme.palette.accent;
        case 'attachment':
          return theme.palette.primaryStrong;
        default:
          return theme.palette.primary;
      }
    }};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 10px 12px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  display: grid;
  gap: 6px;
`;

const EventTitle = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
`;

const EventDescription = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.text};
`;

const EventDetails = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const EventMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const InlineMessage = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const InlineError = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.danger};
`;

const EmptyState = styled.div`
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.85rem;
`;

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

const EVENT_LABEL: Record<CareMapEventType, string> = {
  document: 'カルテ',
  appointment: '予約',
  lab: '検査',
  image: '画像',
  attachment: '添付',
};

type FilterState = Record<CareMapEventType, boolean>;

interface CalendarDay {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CareMapEvent[];
}

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const startOfWeek = (date: Date) => {
  const result = startOfDay(date);
  const diff = result.getDay();
  result.setDate(result.getDate() - diff);
  return result;
};

const endOfWeek = (date: Date) => {
  const result = endOfDay(date);
  const diff = 6 - result.getDay();
  result.setDate(result.getDate() + diff);
  return result;
};

const formatLongDate = (value: Date) =>
  value.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

const formatTimeLabel = (value: Date) => {
  if (value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0) {
    return '--:--';
  }
  return value.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const CareMapPanel = ({ patientId, patientName, karteId, documents, mediaItems, mediaLoading = false, mediaError = null }: CareMapPanelProps) => {
  const { session } = useAuth();
  const userId = session?.credentials.userId ?? null;
  const [monthOffset, setMonthOffset] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    document: true,
    appointment: true,
    lab: true,
    image: true,
    attachment: true,
  });

  const baseDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const monthStart = useMemo(() => startOfMonth(baseDate), [baseDate]);
  const monthEnd = useMemo(() => endOfMonth(baseDate), [baseDate]);
  const calendarStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const calendarEnd = useMemo(() => endOfWeek(monthEnd), [monthEnd]);

  const appointmentsQuery = useAppointments(karteId, {
    from: monthStart,
    to: monthEnd,
    enabled: Boolean(patientId && karteId),
  });

  const laboModulesQuery = useLaboModules(patientId, 120);

  const allEvents = useMemo(() => {
    if (!patientId) {
      return [] as CareMapEvent[];
    }
    return buildCareMapEvents({
      documents,
      appointments: appointmentsQuery.data ?? [],
      laboModules: laboModulesQuery.data ?? [],
      mediaItems,
    });
  }, [patientId, documents, appointmentsQuery.data, laboModulesQuery.data, mediaItems]);

  const eventsInRange = useMemo(
    () =>
      allEvents.filter((event) => {
        const time = event.occurredAt.getTime();
        return time >= calendarStart.getTime() && time <= calendarEnd.getTime();
      }),
    [allEvents, calendarStart, calendarEnd],
  );

  const filteredEvents = useMemo(
    () => eventsInRange.filter((event) => filters[event.type]),
    [eventsInRange, filters],
  );

  const eventsByDate = useMemo(() => groupCareMapEventsByDate(filteredEvents), [filteredEvents]);

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    for (let current = new Date(calendarStart); current <= calendarEnd; current.setDate(current.getDate() + 1)) {
      const day = new Date(current);
      const key = formatCareMapDateKey(day);
      days.push({
        date: day,
        key,
        isCurrentMonth: day.getMonth() === monthStart.getMonth(),
        isToday: formatCareMapDateKey(new Date()) === key,
        events: eventsByDate[key] ?? [],
      });
    }
    return days;
  }, [calendarStart, calendarEnd, monthStart, eventsByDate]);

  const [selectedDate, setSelectedDate] = useState(() => formatCareMapDateKey(new Date()));

  useEffect(() => {
    const selected = parseCareMapDate(selectedDate);
    if (!selected) {
      setSelectedDate(formatCareMapDateKey(monthStart));
      return;
    }
    if (selected < calendarStart || selected > calendarEnd) {
      setSelectedDate(formatCareMapDateKey(monthStart));
    }
  }, [selectedDate, calendarStart, calendarEnd, monthStart]);

  useEffect(() => {
    setFilters({ document: true, appointment: true, lab: true, image: true, attachment: true });
  }, [patientId]);

  const selectedEvents = useMemo(
    () => filteredEvents.filter((event) => formatCareMapDateKey(event.occurredAt) === selectedDate),
    [filteredEvents, selectedDate],
  );

  const selectedDateLabel = useMemo(() => {
    const parsed = parseCareMapDate(selectedDate);
    return parsed ? formatLongDate(parsed) : '';
  }, [selectedDate]);

  const toggleFilter = (type: CareMapEventType) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSelectDay = (key: string) => {
    setSelectedDate(key);
  };

  const loading = appointmentsQuery.isLoading || laboModulesQuery.isLoading || mediaLoading;
  const error = appointmentsQuery.error || laboModulesQuery.error || mediaError;

  return (
    <PanelCard>
      <PanelHeader>
        <HeaderRow>
          <div>
            <h2>CareMap（治療履歴カレンダー）</h2>
            <p>
              {patientName ? `${patientName} さんの` : ''}
              予約・カルテ・検査・画像・添付履歴を月単位で確認できます。
            </p>
          </div>
          <MonthControls>
            <Button type="button" variant="ghost" onClick={() => setMonthOffset((prev) => prev - 1)}>
              前月
            </Button>
            <MonthLabel>
              {monthStart.getFullYear()}年 {monthStart.getMonth() + 1}月
            </MonthLabel>
            <Button type="button" variant="ghost" onClick={() => setMonthOffset((prev) => prev + 1)}>
              翌月
            </Button>
          </MonthControls>
        </HeaderRow>
        {patientId ? null : <InlineMessage>カルテ対象を選択すると治療履歴を表示します。</InlineMessage>}
        {loading ? <InlineMessage>履歴を読み込んでいます…</InlineMessage> : null}
        {error ? <InlineError>履歴の取得に失敗しました。再読み込みをお試しください。</InlineError> : null}
      </PanelHeader>
      {patientId ? (
        <>
          <FiltersRow>
            {(Object.keys(EVENT_LABEL) as CareMapEventType[]).map((type) => (
              <FilterToggle key={type}>
                <input
                  type="checkbox"
                  checked={filters[type]}
                  onChange={() => toggleFilter(type)}
                  aria-label={`${EVENT_LABEL[type]}の表示切り替え`}
                />
                <span>{EVENT_LABEL[type]}</span>
              </FilterToggle>
            ))}
          </FiltersRow>
          <CalendarContainer>
            <CalendarGrid>
              {DAYS_OF_WEEK.map((weekday) => (
                <WeekdayCell key={weekday}>{weekday}</WeekdayCell>
              ))}
            </CalendarGrid>
            <CalendarGrid>
              {calendarDays.map((day) => (
                <DayButton
                  key={day.key}
                  type="button"
                  onClick={() => handleSelectDay(day.key)}
                  $isCurrentMonth={day.isCurrentMonth}
                  $isSelected={selectedDate === day.key}
                  $isToday={day.isToday}
                  aria-pressed={selectedDate === day.key}
                >
                  <DayNumber>{day.date.getDate()}</DayNumber>
                  <EventDots>
                    {day.events.slice(0, 3).map((event) => (
                      <EventDot key={`${day.key}-${event.id}`} $type={event.type} />
                    ))}
                    {day.events.length > 3 ? <EventOverflow>+{day.events.length - 3}</EventOverflow> : null}
                  </EventDots>
                </DayButton>
              ))}
            </CalendarGrid>
          </CalendarContainer>
          <SelectedDateHeader>
            <h3>{selectedDateLabel}</h3>
            <span>{selectedEvents.length ? `${selectedEvents.length} 件のイベント` : '該当する履歴はありません'}</span>
          </SelectedDateHeader>
          {selectedEvents.length ? (
            <EventList>
              {selectedEvents.map((event) => (
                <EventItem key={event.id} $type={event.type}>
                  <EventMeta>
                    <span>{EVENT_LABEL[event.type]}</span>
                    <span>{formatTimeLabel(event.occurredAt)}</span>
                  </EventMeta>
                  <EventTitle>{event.title}</EventTitle>
                  {event.description ? <EventDescription>{event.description}</EventDescription> : null}
                  {event.details ? <EventDetails>{event.details}</EventDetails> : null}
                </EventItem>
              ))}
            </EventList>
          ) : (
            <EmptyState>この日に登録された予定・記録はありません。</EmptyState>
          )}
        </>
      ) : null}
      {karteId && userId ? <MasudaSupportPanel karteId={karteId} userId={userId} /> : null}
    </PanelCard>
  );
};
