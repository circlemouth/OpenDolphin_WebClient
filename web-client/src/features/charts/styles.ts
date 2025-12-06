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

  .patients-tab__row {
    padding: 0.85rem 1rem;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
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

  @media (max-width: 920px) {
    .document-timeline__content,
    .orca-summary__details,
    .charts-page__grid {
      grid-template-columns: 1fr;
    }

    .patients-tab__header {
      flex-direction: column;
    }
  }
`;
