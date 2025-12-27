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

  .charts-workbench {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .charts-workbench__sticky {
    position: sticky;
    top: 1rem;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .charts-patient-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .charts-patient-header__identity {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .charts-patient-header__label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .charts-patient-header__name {
    margin: 0;
    font-size: 1.6rem;
    color: #0f172a;
  }

  .charts-patient-header__kana {
    color: #475569;
    font-size: 0.95rem;
  }

  .charts-patient-header__meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.5rem;
  }

  .charts-patient-header__meta-label {
    display: block;
    font-size: 0.8rem;
    color: #64748b;
  }

  .charts-patient-header__memo {
    margin: 0;
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px dashed rgba(148, 163, 184, 0.4);
    color: #334155;
  }

  .charts-clinical-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.6rem;
  }

  .charts-clinical-bar__item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.55rem 0.65rem;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .charts-clinical-bar__label {
    font-size: 0.8rem;
    color: #64748b;
  }

  .charts-safety {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.9rem 1rem;
    border-radius: 16px;
    background: #fef9c3;
    border: 1px solid #f59e0b;
    color: #92400e;
  }

  .charts-safety__primary {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }

  .charts-safety__label {
    font-weight: 700;
    letter-spacing: 0.08em;
    font-size: 0.8rem;
    text-transform: uppercase;
  }

  .charts-safety__meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.35rem 0.6rem;
    font-size: 0.9rem;
  }

  .charts-workbench__body {
    display: grid;
    grid-template-columns: minmax(260px, 0.9fr) minmax(360px, 1.4fr) minmax(260px, 1fr) 240px;
    gap: 1rem;
    align-items: start;
  }

  .charts-workbench__column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .charts-workbench__side {
    position: sticky;
    top: 1.25rem;
    align-self: start;
    background: #ffffff;
    border-radius: 20px;
    padding: 1rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
  }

  .charts-side-menu {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .charts-side-menu__header {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    color: #0f172a;
  }

  .charts-side-menu__header span {
    font-size: 0.85rem;
    color: #64748b;
  }

  .charts-side-menu__button {
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.35);
    background: #eff6ff;
    padding: 0.65rem 0.75rem;
    font-weight: 700;
    cursor: pointer;
    color: #0f172a;
    transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  }

  .charts-side-menu__button:hover {
    background: #dbeafe;
  }

  .charts-side-menu__button--primary {
    background: #1d4ed8;
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 10px 24px rgba(29, 78, 216, 0.3);
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

  .charts-actions__conflict {
    background: #fffbeb;
    border: 1px solid rgba(245, 158, 11, 0.6);
    border-radius: 14px;
    padding: 0.85rem 0.9rem;
    color: #92400e;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .charts-actions__conflict-title {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.8rem;
  }

  .charts-actions__conflict-meta {
    font-size: 0.85rem;
    color: rgba(146, 64, 14, 0.85);
  }

  .charts-actions__conflict-message {
    margin: 0;
    line-height: 1.5;
    font-weight: 600;
  }

  .charts-actions__conflict-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: flex-end;
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

  .document-timeline__content {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.9fr);
    gap: 1rem;
    align-items: start;
  }

  .document-timeline__timeline {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .document-timeline__section-logs {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .document-timeline__section-logs-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: #0f172a;
  }

  .document-timeline__section-logs-header span {
    font-size: 0.85rem;
    color: #64748b;
  }

  .document-timeline__section-logs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.6rem;
  }

  .document-timeline__section-log {
    border-radius: 14px;
    padding: 0.65rem 0.75rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .document-timeline__section-log header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    color: #0f172a;
  }

  .document-timeline__section-log header span {
    font-size: 0.8rem;
    color: #64748b;
  }

  .document-timeline__section-log p {
    margin: 0;
    color: #334155;
    line-height: 1.5;
  }

  .document-timeline__section-log--warning {
    background: #fff7ed;
    border-color: #fdba74;
  }

  .document-timeline__section-log--error {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  .document-timeline__section-log--info {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .document-timeline__timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: #0f172a;
  }

  .document-timeline__timeline-header span {
    font-size: 0.85rem;
    color: #64748b;
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

  .document-timeline__control-group input[type="number"] {
    width: 76px;
    border: 1px solid #cbd5f5;
    border-radius: 10px;
    padding: 0.25rem 0.35rem;
  }

  .document-timeline__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #475569;
  }

  .document-timeline__list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .document-timeline__section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 0.75rem;
    background: #ffffff;
  }

  .document-timeline__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-weight: 700;
    color: #0f172a;
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

  .document-timeline__virtual {
    position: relative;
    overflow-y: auto;
    border-top: 1px dashed #e2e8f0;
    padding-top: 0.5rem;
  }

  .document-timeline__entry {
    background: #f8fafc;
    border-radius: 16px;
    padding: 0.85rem 1rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .document-timeline__entry--warning {
    border-color: #f59e0b;
    box-shadow: 0 8px 18px rgba(245, 158, 11, 0.15);
    background: #fffbeb;
  }

  .document-timeline__entry--selected {
    border-color: #2563eb;
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
  .document-timeline__badge-info,
  .document-timeline__badge-success {
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

  .document-timeline__badge-success {
    background: #ecfdf3;
    color: #065f46;
    border: 1px solid #34d399;
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

  .document-timeline__entry-status {
    color: #0f172a;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .document-timeline__entry-body {
    margin: 0 0 0.35rem;
    color: #334155;
    line-height: 1.5;
  }

  .document-timeline__next-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.2rem;
  }

  .document-timeline__cta {
    border: 1px solid #2563eb;
    background: #2563eb;
    color: #ffffff;
    border-radius: 10px;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .document-timeline__cta--warning {
    background: #f59e0b;
    border-color: #f59e0b;
    color: #1f2937;
  }

  .document-timeline__cta--error {
    background: #dc2626;
    border-color: #dc2626;
  }

  .document-timeline__cta--primary {
    background: #2563eb;
    border-color: #2563eb;
  }

  .document-timeline__cta:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .document-timeline__queue-row {
    border-radius: 14px;
    padding: 0.75rem 0.9rem;
    border: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .document-timeline__queue-row--info {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .document-timeline__queue-row--warning {
    background: #fff7ed;
    border-color: #fdba74;
  }

  .document-timeline__queue-row--success {
    background: #ecfdf5;
    border-color: #34d399;
  }

  .document-timeline__queue-row--error {
    background: #fef2f2;
    border-color: #fecdd3;
  }

  .document-timeline__queue-main {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .document-timeline__queue-phase {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  .document-timeline__queue-label {
    font-weight: 700;
    color: #0f172a;
  }

  .document-timeline__pill {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: #e2e8f0;
    color: #0f172a;
    font-size: 0.85rem;
  }

  .document-timeline__queue-detail {
    margin: 0;
    color: #9a3412;
    font-size: 0.95rem;
  }

  .document-timeline__queue-actions {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    align-items: flex-end;
    min-width: 160px;
  }

  .document-timeline__cta-link {
    color: #1d4ed8;
    font-weight: 700;
    text-decoration: none;
  }

  .document-timeline__skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .document-timeline__skeleton-row {
    height: 72px;
    border-radius: 14px;
    background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .document-timeline__fallback,
  .document-timeline__retry {
    border-radius: 12px;
    padding: 0.75rem 0.85rem;
    background: #fff7ed;
    border: 1px solid #fdba74;
    color: #7c2d12;
  }

  .document-timeline__retry-button {
    margin-top: 0.4rem;
    background: #2563eb;
    border: 1px solid #2563eb;
    color: #fff;
    padding: 0.4rem 0.85rem;
    border-radius: 10px;
    cursor: pointer;
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

  .medical-record {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .medical-record__header {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .medical-record__title {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .medical-record__meta {
    color: #475569;
    font-size: 0.9rem;
  }

  .medical-record__badges {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .medical-record__empty {
    margin: 0;
    padding: 0.85rem 1rem;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
    color: #475569;
  }

  .medical-record__sections {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .medical-record__section {
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #ffffff;
    overflow: hidden;
  }

  .medical-record__section-summary {
    padding: 0.7rem 0.9rem;
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: baseline;
    cursor: pointer;
    background: #f8fafc;
  }

  .medical-record__section-title {
    font-weight: 800;
    color: #0f172a;
  }

  .medical-record__section-meta {
    color: #475569;
    font-size: 0.9rem;
    text-align: right;
  }

  .medical-record__section-empty {
    margin: 0;
    padding: 0.8rem 0.95rem;
    color: #475569;
  }

  .medical-record__section-list {
    margin: 0;
    padding: 0.85rem 1.05rem;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .medical-record__item-headline {
    font-weight: 700;
    color: #0f172a;
  }

  .medical-record__item-sub {
    color: #475569;
    font-size: 0.9rem;
    line-height: 1.35;
  }

  .patients-tab {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .patients-tab__important {
    display: flex;
    gap: 0.75rem;
    align-items: stretch;
    justify-content: space-between;
    padding: 0.75rem 0.85rem;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: linear-gradient(135deg, #eef2ff, #ffffff);
  }

  .patients-tab__important-main {
    flex: 1;
    text-align: left;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .patients-tab__important-title {
    font-size: 1.05rem;
    color: #0f172a;
  }

  .patients-tab__important-sub {
    font-size: 0.9rem;
    color: #475569;
    line-height: 1.35;
  }

  .patients-tab__important-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .patients-tab__primary,
  .patients-tab__ghost {
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.35);
    background: #eff6ff;
    padding: 0.55rem 0.75rem;
    font-weight: 700;
    cursor: pointer;
    color: #0f172a;
  }

  .patients-tab__primary {
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    border-color: transparent;
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(79, 70, 229, 0.22);
  }

  .patients-tab__ghost {
    background: #f8fafc;
    border-color: rgba(148, 163, 184, 0.45);
    color: #0f172a;
  }

  .patients-tab__primary:disabled,
  .patients-tab__ghost:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
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
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .patients-tab__card {
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
    padding: 0.85rem 0.95rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .patients-tab__card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .patients-tab__card-header h3 {
    margin: 0;
    font-size: 1.05rem;
    color: #0f172a;
  }

  .patients-tab__card-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .patients-tab__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem 0.75rem;
  }

  .patients-tab__kv {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .patients-tab__kv span {
    font-size: 0.85rem;
    color: #64748b;
  }

  .patients-tab__kv strong {
    color: #0f172a;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .patients-tab__memo {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .patients-tab__memo-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .patients-tab__memo-header h4 {
    margin: 0;
    font-size: 0.95rem;
    color: #0f172a;
  }

  .patients-tab__memo-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .patients-tab__memo textarea {
    border-radius: 12px;
    border: 1px solid #cbd5f5;
    padding: 0.55rem 0.7rem;
    font-family: inherit;
    resize: vertical;
    background: #ffffff;
  }

  .patients-tab__detail-empty {
    margin: 0;
    color: #475569;
  }

  .patients-tab__detail-guard {
    color: #b45309;
  }

  .patients-tab__detail-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .patients-tab__tab {
    border-radius: 999px;
    border: 1px solid rgba(59, 130, 246, 0.25);
    background: #eff6ff;
    color: #1d4ed8;
    padding: 0.35rem 0.75rem;
    font-weight: 800;
    cursor: pointer;
  }

  .patients-tab__tab.is-active {
    background: #1d4ed8;
    color: #ffffff;
    border-color: transparent;
  }

  .patients-tab__history-filters {
    display: grid;
    grid-template-columns: 1.4fr 0.8fr 0.8fr;
    gap: 0.6rem;
    align-items: end;
  }

  .patients-tab__history-filters label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: #475569;
    font-size: 0.9rem;
  }

  .patients-tab__history-filters input {
    border-radius: 12px;
    border: 1px solid #cbd5f5;
    padding: 0.55rem 0.65rem;
    font-family: inherit;
  }

  .patients-tab__history {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .patients-tab__history-row {
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #ffffff;
    padding: 0.65rem 0.75rem;
    text-align: left;
    cursor: pointer;
  }

  .patients-tab__history-row.is-active {
    border-color: #1d4ed8;
    box-shadow: 0 8px 22px rgba(59, 130, 246, 0.12);
  }

  .patients-tab__history-main {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
  }

  .patients-tab__history-badge {
    background: #eef2ff;
    border: 1px solid rgba(37, 99, 235, 0.25);
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    font-size: 0.85rem;
    font-weight: 800;
    color: #1d4ed8;
    white-space: nowrap;
  }

  .patients-tab__history-sub {
    margin-top: 0.25rem;
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    color: #475569;
    font-size: 0.9rem;
  }

  .patients-tab__diff {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .patients-tab__diff-head {
    display: grid;
    grid-template-columns: 0.9fr 1fr 1.2fr;
    gap: 0.6rem;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 800;
    padding-bottom: 0.25rem;
    border-bottom: 1px dashed rgba(148, 163, 184, 0.6);
  }

  .patients-tab__diff-row {
    display: grid;
    grid-template-columns: 0.9fr 1fr 1.2fr;
    gap: 0.6rem;
    border-radius: 12px;
    padding: 0.45rem 0.55rem;
    background: #ffffff;
    border: 1px solid rgba(148, 163, 184, 0.25);
    align-items: start;
  }

  .patients-tab__diff-row.is-changed {
    border-color: rgba(245, 158, 11, 0.55);
    background: #fffbeb;
  }

  .patients-tab__diff-row.is-highlighted {
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.35);
  }

  .patients-tab__diff-label {
    font-weight: 800;
    color: #0f172a;
  }

  .patients-tab__diff-before,
  .patients-tab__diff-after {
    overflow-wrap: anywhere;
    color: #0f172a;
  }

  .patients-tab__audit {
    margin-top: 0.25rem;
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    background: #fff7ed;
    border: 1px solid #f59e0b;
    color: #92400e;
  }

  .patients-tab__modal {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 50;
  }

  .patients-tab__modal-card {
    width: min(860px, 100%);
    background: #ffffff;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    box-shadow: 0 18px 60px rgba(15, 23, 42, 0.25);
    padding: 1rem 1.05rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .patients-tab__modal-header {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: baseline;
  }

  .patients-tab__modal-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #0f172a;
  }

  .patients-tab__modal-sub {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
  }

  .patients-tab__modal-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .patients-tab__modal-row {
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
    padding: 0.75rem 0.85rem;
    text-align: left;
    cursor: pointer;
  }

  .patients-tab__modal-row-main {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
  }

  .patients-tab__modal-pill {
    border-radius: 999px;
    background: #eef2ff;
    border: 1px solid rgba(37, 99, 235, 0.25);
    color: #1d4ed8;
    padding: 0.2rem 0.6rem;
    font-weight: 800;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .patients-tab__modal-row-sub {
    margin-top: 0.25rem;
    color: #475569;
    font-size: 0.88rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .patients-tab__modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .patient-form__alert {
    border-radius: 14px;
    border: 1px solid rgba(239, 68, 68, 0.35);
    background: #fef2f2;
    padding: 0.75rem 0.85rem;
    color: #991b1b;
  }

  .patient-form__alert-title {
    margin: 0;
    font-weight: 900;
    color: #7f1d1d;
  }

  .patient-form__alert-list {
    margin: 0.45rem 0 0;
    padding-left: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .patient-form__alert-link {
    border: none;
    padding: 0;
    background: transparent;
    cursor: pointer;
    color: inherit;
    text-decoration: underline;
    font: inherit;
    text-align: left;
  }

  .patient-edit__notice {
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    background: #f8fafc;
    padding: 0.75rem 0.85rem;
    color: #0f172a;
  }

  .patient-edit__notice--success {
    border-color: rgba(34, 197, 94, 0.35);
    background: #f0fdf4;
  }

  .patient-edit__notice--error {
    border-color: rgba(239, 68, 68, 0.35);
    background: #fef2f2;
  }

  .patient-edit__notice--info {
    border-color: rgba(59, 130, 246, 0.25);
    background: #eff6ff;
  }

  .patient-edit__notice-title {
    margin: 0;
    font-weight: 900;
  }

  .patient-edit__notice-detail {
    margin: 0.35rem 0 0;
    color: #475569;
  }

  .patient-edit__meta {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    color: #64748b;
    font-size: 0.85rem;
  }

  .patient-edit__form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .patient-edit__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem 0.75rem;
  }

  .patient-edit__field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: #475569;
    font-size: 0.9rem;
  }

  .patient-edit__field--wide {
    grid-column: 1 / -1;
  }

  .patient-edit__field input,
  .patient-edit__field select {
    border-radius: 12px;
    border: 1px solid #cbd5f5;
    padding: 0.55rem 0.65rem;
    font-family: inherit;
    background: #ffffff;
  }

  .patient-edit__field input[aria-readonly='true'] {
    background: #f1f5f9;
    color: #475569;
  }

  .patient-edit__field-error {
    color: #b91c1c;
  }

  .patient-edit__actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .patient-edit__actions-spacer {
    flex: 1;
  }

  .patient-edit__review-title {
    margin: 0;
    font-weight: 900;
    color: #0f172a;
  }

  .patient-edit__diff {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .patient-edit__diff-header {
    display: grid;
    grid-template-columns: 0.8fr 1fr 1fr;
    gap: 0.6rem;
    color: #64748b;
    font-weight: 900;
    font-size: 0.85rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px dashed rgba(148, 163, 184, 0.6);
  }

  .patient-edit__diff-row {
    display: grid;
    grid-template-columns: 0.8fr 1fr 1fr;
    gap: 0.6rem;
    padding: 0.45rem 0.55rem;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: #ffffff;
    align-items: start;
  }

  .patient-edit__diff-row.is-changed {
    border-color: rgba(245, 158, 11, 0.55);
    background: #fffbeb;
  }

  .patient-edit__diff-label {
    font-weight: 900;
    color: #0f172a;
  }

  .patient-edit__diff-before,
  .patient-edit__diff-after {
    overflow-wrap: anywhere;
    color: #0f172a;
  }

  .patient-edit__confirm {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: #0f172a;
    font-weight: 800;
  }

  .patient-edit__blocked {
    padding: 0.85rem 0.95rem;
    border-radius: 16px;
    background: #fef2f2;
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #991b1b;
  }

  .patient-edit__blocked p {
    margin: 0.35rem 0;
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

  @media (max-width: 1280px) {
    .charts-workbench__body {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .charts-workbench__side {
      grid-column: 1 / -1;
      position: static;
    }
  }

  @media (max-width: 920px) {
    .charts-workbench__sticky,
    .charts-workbench__body,
    .document-timeline__content,
    .orca-summary__details,
    .charts-page__grid {
      grid-template-columns: 1fr;
    }

    .charts-workbench__side {
      position: static;
    }

    .patients-tab__header {
      flex-direction: column;
    }

    .patients-tab__body {
      grid-template-columns: 1fr;
    }

    .patients-tab__grid {
      grid-template-columns: 1fr;
    }

    .patients-tab__history-filters {
      grid-template-columns: 1fr;
    }
  }
`;
