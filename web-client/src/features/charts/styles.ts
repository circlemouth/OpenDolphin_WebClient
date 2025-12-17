import { css } from '@emotion/react';

export const chartsStyles = css`
  .charts-page {
    min-height: 100vh;
    padding: 2.25rem clamp(1rem, 4vw, 2.75rem);
    background: linear-gradient(180deg, #f3f4ff 0%, #f8fafc 65%);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .charts-page__header {
    background: #ffffff;
    border-radius: 24px;
    padding: 1.25rem 1.5rem;
    border: 1px solid rgba(148, 163, 184, 0.35);
    box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
  }

  .charts-page__header h1 {
    margin: 0;
    font-size: 1.6rem;
    color: #0f172a;
  }

  .charts-page__header p {
    margin: 0.35rem 0 0;
    color: #475569;
    line-height: 1.6;
  }

  .charts-page__meta {
    margin-top: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .charts-page__pill {
    background: #eef2ff;
    border: 1px solid rgba(37, 99, 235, 0.25);
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    font-size: 0.9rem;
    color: #1d4ed8;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .charts-page__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1.2rem;
    align-items: start;
  }

  .charts-card {
    background: #ffffff;
    border-radius: 22px;
    padding: 1.25rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
  }

  .charts-card--actions {
    position: relative;
    overflow: hidden;
  }

  .charts-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .charts-actions--locked {
    border-left: 4px solid #1d4ed8;
  }

  .charts-actions__header h2 {
    margin: 0.1rem 0 0.2rem;
    font-size: 1.25rem;
  }

  .charts-actions__kicker {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.78rem;
    color: #64748b;
  }

  .charts-actions__status {
    margin: 0.15rem 0 0;
    color: #0f172a;
    font-weight: 600;
  }

  .charts-actions__meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .charts-actions__pill {
    background: #eef2ff;
    border: 1px solid rgba(37, 99, 235, 0.25);
    color: #1d4ed8;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.9rem;
  }

  .charts-actions__controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.6rem;
  }

  .charts-actions__button {
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.35);
    background: #eff6ff;
    padding: 0.7rem 0.8rem;
    font-weight: 700;
    cursor: pointer;
    color: #0f172a;
    transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  }

  .charts-actions__button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    background: #e2e8f0;
  }

  .charts-actions__button--primary {
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 10px 24px rgba(79, 70, 229, 0.25);
  }

  .charts-actions__button--ghost {
    background: #fff7ed;
    border-color: rgba(234, 88, 12, 0.35);
    color: #9a3412;
  }

  .charts-actions__button--unlock {
    background: #ecfdf5;
    border-color: rgba(16, 185, 129, 0.45);
    color: #065f46;
  }

  .charts-actions__skeleton {
    background: #f8fafc;
    border: 1px dashed rgba(148, 163, 184, 0.6);
    border-radius: 14px;
    padding: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    animation: chartsPulse 1.4s ease-in-out infinite;
  }

  .charts-actions__skeleton-bar {
    height: 12px;
    background: linear-gradient(90deg, #e2e8f0 0%, #cbd5f5 50%, #e2e8f0 100%);
    border-radius: 999px;
  }

  .charts-actions__skeleton-bar--short {
    width: 55%;
  }

  @keyframes chartsPulse {
    0% {
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.7;
    }
  }

  .charts-actions__toast {
    border-radius: 14px;
    padding: 0.75rem 0.85rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
  }

  .charts-actions__toast p {
    margin: 0.2rem 0 0;
  }

  .charts-actions__toast--success {
    background: #ecfdf3;
    border: 1px solid #22c55e;
    color: #065f46;
  }

  .charts-actions__toast--warning {
    background: #fffbeb;
    border: 1px solid #fbbf24;
    color: #92400e;
  }

  .charts-actions__toast--error {
    background: #fef2f2;
    border: 1px solid #ef4444;
    color: #991b1b;
  }

  .charts-actions__toast--info {
    background: #eff6ff;
    border: 1px solid #60a5fa;
    color: #1d4ed8;
  }

  .charts-actions__retry {
    border: none;
    background: #1d4ed8;
    color: #fff;
    border-radius: 10px;
    padding: 0.45rem 0.7rem;
    cursor: pointer;
  }

  .charts-actions__guard {
    margin: 0;
    color: #b45309;
    font-weight: 700;
  }

  .auth-service-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .auth-service-controls__description {
    margin: 0;
    color: #475569;
    line-height: 1.5;
  }

  .auth-service-controls__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.75rem;
  }

  .auth-service-controls__toggle {
    padding: 0.75rem;
    border-radius: 14px;
    border: 1px solid rgba(37, 99, 235, 0.35);
    background: #eff6ff;
    color: #0f172a;
    font-weight: 700;
    cursor: pointer;
  }

  .auth-service-controls__select {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
    color: #475569;
  }

  .auth-service-controls__select input,
  .auth-service-controls__select select {
    border-radius: 12px;
    border: 1px solid #cbd5f5;
    padding: 0.65rem 0.75rem;
    font-family: inherit;
  }

  .document-timeline {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .document-timeline__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  .document-timeline__control-group {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 12px;
    padding: 0.5rem 0.6rem;
  }

  .document-timeline__pager {
    border: 1px solid rgba(59, 130, 246, 0.35);
    background: #fff;
    color: #1d4ed8;
    border-radius: 10px;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
  }

  .document-timeline__pager:hover {
    background: #eff6ff;
  }

  .document-timeline__window-meta {
    color: #334155;
    font-size: 0.9rem;
    margin-left: 0.35rem;
  }

  .document-timeline__control-group input[type='number'] {
    width: 76px;
    border: 1px solid #cbd5f5;
    border-radius: 10px;
    padding: 0.25rem 0.35rem;
  }

  .document-timeline__section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .document-timeline__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .document-timeline__section-labels {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .document-timeline__section-badge {
    padding: 0.2rem 0.7rem;
    background: #e0e7ff;
    color: #1d4ed8;
    border-radius: 999px;
    font-weight: 700;
  }

  .document-timeline__section-count {
    color: #475569;
    font-size: 0.9rem;
  }

  .document-timeline__content {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(200px, 0.9fr);
    gap: 0.75rem;
  }

  .document-timeline__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .document-timeline__entry {
    background: #f8fafc;
    border-radius: 16px;
    padding: 0.85rem 1rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .document-timeline__entry--highlight {
    border-color: #f59e0b;
    box-shadow: 0 8px 18px rgba(245, 158, 11, 0.15);
  }

  .document-timeline__entry header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .document-timeline__entry-title {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .document-timeline__entry-meta {
    color: #475569;
    font-size: 0.9rem;
  }

  .document-timeline__badge-warning,
  .document-timeline__badge-error,
  .document-timeline__badge-info {
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .document-timeline__badge-warning {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #f59e0b;
  }

  .document-timeline__badge-error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #ef4444;
  }

  .document-timeline__badge-info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #60a5fa;
  }

  .document-timeline__steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(80px, 1fr));
    gap: 0.35rem;
    margin: 0.3rem 0;
  }

  .document-timeline__step {
    padding: 0.45rem 0.55rem;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #fff;
    text-align: center;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .document-timeline__step--done {
    background: #ecfdf3;
    border-color: #34d399;
    color: #065f46;
  }

  .document-timeline__step--active {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1d4ed8;
  }

  .document-timeline__step--blocked {
    background: #fef2f2;
    border-color: #ef4444;
    color: #b91c1c;
  }

  .document-timeline__step--pending {
    background: #f8fafc;
    border-color: rgba(148, 163, 184, 0.5);
    color: #475569;
  }

  .document-timeline__entry-note {
    margin: 0.25rem 0;
    color: #0f172a;
  }

  .document-timeline__actions {
    display: flex;
    gap: 0.4rem;
    align-items: baseline;
    color: #0f172a;
  }

  .document-timeline__entry-time {
    font-weight: 700;
    color: #1d4ed8;
  }

  .document-timeline__insights {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .document-timeline__transition {
    border-radius: 14px;
    padding: 0.65rem 0.75rem;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #fff7ed;
  }

  .document-timeline__transition--info {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .document-timeline__transition--success {
    background: #ecfdf5;
    border-color: #34d399;
  }

  .document-timeline__audit {
    border-radius: 12px;
    padding: 0.65rem 0.75rem;
    background: #fef9c3;
    border: 1px solid #f59e0b;
    color: #92400e;
  }

  .document-timeline__audit-text {
    margin: 0.25rem 0 0;
    line-height: 1.5;
  }

  .document-timeline__queue {
    border-radius: 14px;
    padding: 0.85rem 1rem;
    background: #f0f9ff;
    border: 1px solid rgba(59, 130, 246, 0.25);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .document-timeline__queue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #0f172a;
  }

  .document-timeline__queue-runid {
    color: #1d4ed8;
    font-size: 0.9rem;
  }

  .document-timeline__queue-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .document-timeline__queue-meta {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
  }

  .orca-summary {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .orca-summary__details {
    display: grid;
    grid-template-columns: minmax(220px, 0.9fr) minmax(220px, 1fr);
    gap: 0.75rem;
  }

  .orca-summary__meta {
    border-radius: 14px;
    padding: 0.85rem 1rem;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
  }

  .orca-summary__badges {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .patients-tab {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .patients-tab__controls {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .patients-tab__search {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
    color: #475569;
  }

  .patients-tab__search input {
    border-radius: 12px;
    border: 1px solid #cbd5f5;
    padding: 0.6rem 0.75rem;
    min-width: 240px;
  }

  .patients-tab__edit-guard {
    padding: 0.45rem 0.75rem;
    background: #f0f9ff;
    border: 1px solid rgba(59, 130, 246, 0.25);
    border-radius: 12px;
    color: #0f172a;
  }

  .patients-tab__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
  }

  .patients-tab__badges {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .patients-tab__table {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .patients-tab__body {
    display: grid;
    grid-template-columns: minmax(240px, 0.9fr) minmax(260px, 1fr);
    gap: 0.8rem;
  }

  .patients-tab__row {
    padding: 0.85rem 1rem;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
    text-align: left;
    width: 100%;
    cursor: pointer;
  }

  .patients-tab__row--selected {
    border-color: #1d4ed8;
    box-shadow: 0 8px 22px rgba(59, 130, 246, 0.15);
  }

  .patients-tab__row:focus-visible {
    outline: 2px solid #1d4ed8;
    outline-offset: 2px;
  }

  .patients-tab__row-meta {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
  }

  .patients-tab__row-id {
    font-weight: 700;
    color: #0f172a;
  }

  .patients-tab__row-detail {
    margin: 0.35rem 0 0.25rem;
    color: #475569;
  }

  .patients-tab__row-status {
    font-size: 0.9rem;
    color: #1d4ed8;
  }

  .patients-tab__detail {
    padding: 0.85rem 1rem;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .patients-tab__detail-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .patients-tab__detail-row input,
  .patients-tab__detail-row textarea {
    border-radius: 12px;
    border: 1px solid #cbd5f5;
    padding: 0.55rem 0.7rem;
    font-family: inherit;
    resize: vertical;
  }

  .patients-tab__detail-empty {
    margin: 0;
    color: #475569;
  }

  .patients-tab__detail-guard {
    color: #b45309;
  }

  .patients-tab__audit {
    margin-top: 0.25rem;
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    background: #fff7ed;
    border: 1px solid #f59e0b;
    color: #92400e;
  }

  .telemetry-panel {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .telemetry-panel__meta {
    margin: 0;
    color: #475569;
  }

  .telemetry-panel__list {
    margin: 0;
    padding-left: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: #0f172a;
  }

  @media (max-width: 920px) {
    .document-timeline__content,
    .orca-summary__details,
    .charts-page__grid {
      grid-template-columns: 1fr;
    }

    .patients-tab__header {
      flex-direction: column;
    }

    .patients-tab__body {
      grid-template-columns: 1fr;
    }
  }
`;
