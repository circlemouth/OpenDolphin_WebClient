import { css } from '@emotion/react';

export const receptionStyles = css`
  .reception-page {
    min-height: 100vh;
    padding: 3rem clamp(1rem, 4vw, 2.75rem);
    background: linear-gradient(180deg, #eef2fb 0%, #f8fafc 60%);
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .reception-page__header {
    background: #ffffff;
    border-radius: 24px;
    padding: 1.5rem;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .reception-page__header h1 {
    margin: 0;
    font-size: 2rem;
    color: #0f172a;
  }

  .reception-page__header p {
    margin: 0.65rem 0 0;
    color: #475569;
    line-height: 1.6;
  }

  .reception-page__status {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .order-console {
    background: #ffffff;
    border-radius: 28px;
    padding: 1.5rem;
    border: 1px solid rgba(37, 99, 235, 0.15);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
  }

  .tone-banner {
    display: flex;
    gap: 0.95rem;
    align-items: center;
    padding: 1rem 1.25rem;
    border-radius: 18px;
    border: 1px solid transparent;
    font-size: 0.95rem;
  }

  .tone-banner__tag {
    font-weight: 700;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  .tone-banner__message {
    margin: 0;
    color: #0f172a;
  }

  .tone-banner--error {
    background: #fee2e2;
    border-color: #fecaca;
  }

  .tone-banner--warning {
    background: #fff7ed;
    border-color: #fed7aa;
  }

  .tone-banner--info {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .resolve-master {
    border-radius: 18px;
    padding: 0.85rem 1.15rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    align-items: center;
    gap: 0.6rem;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
  }

  .resolve-master__label {
    font-size: 0.85rem;
    color: #475569;
  }

  .resolve-master__value {
    font-weight: 700;
    color: #0f172a;
  }

  .resolve-master__marker {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #1d4ed8;
  }

  .resolve-master__transition {
    font-size: 0.75rem;
    color: #475569;
  }

  .order-console__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
    align-items: flex-start;
  }

  .order-console__status-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .order-console__control-panel {
    background: #eef2ff;
    border-radius: 18px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .order-console__label {
    font-weight: 600;
    color: #0f172a;
    font-size: 0.9rem;
  }

  .order-console__control select,
  .order-console__control textarea {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #cbd5f5;
    padding: 0.6rem 0.75rem;
    font-family: inherit;
    font-size: 0.95rem;
    background: #ffffff;
  }

  .order-console__control-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .order-console__action {
    flex: 1;
    border: none;
    border-radius: 999px;
    background: #2563eb;
    color: #ffffff;
    padding: 0.65rem 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .order-console__action:hover {
    background: #1d4ed8;
  }

  .order-console__note {
    font-size: 0.85rem;
    color: #0f172a;
    background: #ffffff;
    border-radius: 10px;
    padding: 0.65rem;
    border: 1px solid rgba(37, 99, 235, 0.5);
  }

  .status-badge {
    border-radius: 16px;
    padding: 0.65rem 0.85rem;
    border: 1px solid rgba(148, 163, 184, 0.4);
    background: #ffffff;
  }

  .status-badge__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .status-badge__label {
    font-size: 0.85rem;
    color: #475569;
  }

  .status-badge__value {
    font-weight: 700;
    color: #0f172a;
  }

  .status-badge__description {
    margin: 0.45rem 0 0;
    font-size: 0.8rem;
    color: #475569;
  }

  .status-badge__tone {
    font-weight: 600;
  }

  .status-badge--warning {
    border-color: #facc15;
    background: #fefce8;
  }

  .status-badge--error {
    border-color: #fecaca;
    background: #fef2f2;
  }

  .status-badge--info {
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  .status-badge--success {
    border-color: #34d399;
    background: #ecfdf5;
  }

  .reception-page__meta {
    background: #ffffff;
    padding: 1.5rem;
    border-radius: 22px;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .reception-page__meta h2 {
    margin-top: 0;
  }

  .reception-page__meta ol {
    padding-left: 1.25rem;
    margin: 0.5rem 0 0;
    color: #475569;
    line-height: 1.7;
  }

  @media (max-width: 768px) {
    .order-console__action {
      flex: 1 1 100%;
    }
  }
`;
