import { useCallback, useEffect, useMemo, useState } from 'react';

import { resolveAriaLive } from '../../../libs/observability/observability';

export function MobilePatientPicker({
  title = '患者選択',
  selectedPatientId,
  onSelect,
}: {
  title?: string;
  selectedPatientId?: string;
  onSelect: (patientId: string) => void;
}) {
  const infoLive = resolveAriaLive('info');
  const [value, setValue] = useState<string>(selectedPatientId ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(selectedPatientId ?? '');
    setError(null);
  }, [selectedPatientId]);

  const normalized = useMemo(() => value.trim(), [value]);
  const isValid = useMemo(() => /^\d{1,10}$/.test(normalized), [normalized]);

  const handleCommit = useCallback(() => {
    if (!normalized) {
      setError('患者IDを入力してください。');
      return;
    }
    if (!isValid) {
      setError('患者IDは数字のみ（最大10桁）で入力してください。');
      return;
    }
    setError(null);
    onSelect(normalized);
  }, [isValid, normalized, onSelect]);

  return (
    <section aria-label={title} data-test-id="mobile-patient-picker">
      <header style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h2>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', opacity: 0.85 }}>
          患者IDを入力して確定してください。
        </p>
      </header>

      <div style={{ display: 'grid', gap: '0.6rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>患者ID</span>
          <input
            data-test-id="mobile-patient-id-input"
            inputMode="numeric"
            pattern="\\d*"
            placeholder="例: 01415"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            style={{
              fontSize: '1.05rem',
              padding: '0.9rem 0.9rem',
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.18)',
            }}
            aria-invalid={Boolean(error)}
          />
        </label>

        {error ? (
          <div role="alert" aria-live="assertive" style={{ color: '#b42318', fontSize: '0.95rem' }}>
            {error}
          </div>
        ) : (
          <div role="status" aria-live={infoLive} style={{ fontSize: '0.9rem', opacity: 0.85 }}>
            {selectedPatientId ? `選択中: ${selectedPatientId}` : '未選択'}
          </div>
        )}

        <button
          type="button"
          data-test-id="mobile-patient-commit"
          onClick={handleCommit}
          style={{
            width: '100%',
            padding: '0.95rem 1rem',
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.1)',
            background: isValid ? '#0b69ff' : '#94a3b8',
            color: 'white',
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
          disabled={!normalized}
          aria-disabled={!normalized}
        >
          患者を確定
        </button>
      </div>
    </section>
  );
}

