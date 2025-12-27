import { css } from '@emotion/react';

export const statusBadgeStyles = css`
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
`;

export const toneBannerStyles = css`
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
`;

export const receptionStyles = css`
  ${statusBadgeStyles}

  .skip-link {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 10000;
    padding: 0.6rem 0.8rem;
    border-radius: 12px;
    border: 2px solid #2563eb;
    background: #ffffff;
    color: #0f172a;
    text-decoration: none;
    transform: translateY(-200%);
    transition: transform 120ms ease;
  }

  .skip-link:focus {
    transform: translateY(0);
    outline: 3px solid rgba(37, 99, 235, 0.35);
    outline-offset: 2px;
  }

  .focus-trap-dialog__backdrop {
    position: fixed;
    inset: 0;
    z-index: 11000;
    background: rgba(15, 23, 42, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
  }

  .focus-trap-dialog__panel {
    width: min(720px, 100%);
    max-height: 92vh;
    overflow: auto;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    box-shadow: 0 20px 70px rgba(15, 23, 42, 0.25);
    padding: 1.25rem;
  }

  .focus-trap-dialog__title {
    margin: 0;
    font-size: 1.2rem;
    color: #0f172a;
  }

  .focus-trap-dialog__description {
    margin: 0.6rem 0 0;
    color: #475569;
    line-height: 1.6;
  }

  .focus-trap-dialog__content {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

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

  .order-console__status-steps {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .order-console__step {
    background: #f8fafc;
    border-radius: 20px;
    padding: 0.95rem 1.05rem;
    border: 1px solid rgba(148, 163, 184, 0.35);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .order-console__step-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #1d4ed8;
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

  .reception-page__meta-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .reception-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background: #eef2ff;
    color: #1f2937;
    border: 1px solid rgba(37, 99, 235, 0.2);
    font-size: 0.9rem;
  }

  .reception-search {
    background: #ffffff;
    border-radius: 24px;
    padding: 1.25rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 8px 32px rgba(15, 23, 42, 0.06);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .reception-search__form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .reception-search__row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .reception-search__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: 600;
    color: #0f172a;
    font-size: 0.92rem;
  }

  .reception-search__field input,
  .reception-search__field select {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    padding: 0.55rem 0.75rem;
    background: #ffffff;
    font-size: 0.95rem;
  }

  .reception-search__actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .reception-search__button {
    padding: 0.65rem 1rem;
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #ffffff;
    color: #1d4ed8;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.08s ease, background 0.2s ease, color 0.2s ease;
  }

  .reception-search__button.primary {
    background: #1d4ed8;
    color: #ffffff;
  }

  .reception-search__button.ghost:hover {
    background: #eef2ff;
  }

  .reception-search__button:active {
    transform: translateY(1px);
  }

  .reception-summary {
    margin: 0;
    font-weight: 600;
    color: #0f172a;
  }

  .reception-status {
    margin: 0;
    color: #475569;
  }

  .reception-status--error {
    color: #b91c1c;
    font-weight: 700;
  }

  .reception-section {
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    overflow: hidden;
  }

  .reception-section + .reception-section {
    margin-top: 1rem;
  }

  .reception-section__header {
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(90deg, #eef2ff 0%, #ffffff 60%);
  }

  .reception-section__header h2 {
    margin: 0;
    color: #0f172a;
  }

  .reception-section__count {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: 0.75rem;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
  }

  .reception-section__toggle {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 12px;
    padding: 0.45rem 0.85rem;
    cursor: pointer;
  }

  .reception-table__wrapper {
    overflow-x: auto;
  }

  .reception-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 720px;
  }

  .reception-table th,
  .reception-table td {
    padding: 0.75rem 0.9rem;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
    color: #0f172a;
  }

  .reception-table th {
    background: #f8fafc;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #475569;
  }

  .reception-table tr:hover {
    background: #f8fafc;
  }

  .reception-table__empty {
    text-align: center;
    color: #475569;
  }

  .reception-table__time {
    font-weight: 700;
  }

  .reception-table__id {
    color: #475569;
    display: block;
  }

  .reception-table__patient strong {
    display: block;
  }

  .reception-table__note {
    color: #1f2937;
  }

  .reception-table__source {
    color: #64748b;
    font-size: 0.8rem;
  }

  .reception-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.85rem;
  }

  .reception-badge--受付中 {
    background: #eef2ff;
    color: #1d4ed8;
  }

  .reception-badge--診療中 {
    background: #fff7ed;
    color: #c2410c;
  }

  .reception-badge--会計待ち {
    background: #fef9c3;
    color: #92400e;
  }

  .reception-badge--会計済み {
    background: #ecfdf5;
    color: #047857;
  }

  .reception-badge--予約 {
    background: #e0f2fe;
    color: #075985;
  }

  .reception-badge--muted {
    background: #f1f5f9;
    color: #475569;
  }

  .reception-table tr:focus-visible {
    outline: 2px solid #1d4ed8;
    outline-offset: -2px;
  }

  @media (max-width: 768px) {
    .order-console__action {
      flex: 1 1 100%;
    }

    .reception-table {
      min-width: 640px;
    }
  }
`;
