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
    color: #334155;
  }

  .status-badge__value {
    font-weight: 700;
    color: #0f172a;
  }

  .status-badge__description {
    margin: 0.45rem 0 0;
    font-size: 0.8rem;
    color: #334155;
  }

  .status-badge__tone {
    font-weight: 600;
    color: #0f172a;
  }

  .status-badge--warning {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  .status-badge--error {
    border-color: #fca5a5;
    background: #fef2f2;
  }

  .status-badge--info {
    border-color: #93c5fd;
    background: #eff6ff;
  }

  .status-badge--success {
    border-color: #6ee7b7;
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
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.45);
  }

  .tone-banner__message {
    margin: 0;
    color: #0f172a;
  }

  .tone-banner--error {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  .tone-banner--error .tone-banner__tag {
    background: #fecaca;
    border-color: #fca5a5;
    color: #7f1d1d;
  }

  .tone-banner--warning {
    background: #fff7ed;
    border-color: #fdba74;
  }

  .tone-banner--warning .tone-banner__tag {
    background: #fed7aa;
    border-color: #fdba74;
    color: #7c2d12;
  }

  .tone-banner--info {
    background: #eff6ff;
    border-color: #93c5fd;
  }

  .tone-banner--info .tone-banner__tag {
    background: #bfdbfe;
    border-color: #93c5fd;
    color: #1e3a8a;
  }

  .tone-banner:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.45);
    outline-offset: 2px;
  }
`;

export const receptionStyles = css`
  ${statusBadgeStyles}

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

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

  .skip-link + .skip-link {
    top: 3.4rem;
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
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.45);
  }

  .tone-banner__message {
    margin: 0;
    color: #0f172a;
  }

  .tone-banner--error {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  .tone-banner--error .tone-banner__tag {
    background: #fecaca;
    border-color: #fca5a5;
    color: #7f1d1d;
  }

  .tone-banner--warning {
    background: #fff7ed;
    border-color: #fdba74;
  }

  .tone-banner--warning .tone-banner__tag {
    background: #fed7aa;
    border-color: #fdba74;
    color: #7c2d12;
  }

  .tone-banner--info {
    background: #eff6ff;
    border-color: #93c5fd;
  }

  .tone-banner--info .tone-banner__tag {
    background: #bfdbfe;
    border-color: #93c5fd;
    color: #1e3a8a;
  }

  .tone-banner:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.45);
    outline-offset: 2px;
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

  .reception-page__alerts {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .reception-pill {
    font-size: 0.85rem;
  }

  .reception-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 1.5rem;
    align-items: start;
  }

  .reception-layout__main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 0;
  }

  .reception-layout__side {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: sticky;
    top: 1.5rem;
    align-self: start;
  }

  .reception-sidepane {
    background: #ffffff;
    border-radius: 20px;
    padding: 1.1rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .reception-sidepane:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.45);
    outline-offset: 2px;
  }

  .reception-sidepane__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .reception-sidepane__header h2 {
    margin: 0;
    font-size: 1.05rem;
    color: #0f172a;
  }

  .reception-sidepane__actions {
    display: flex;
    gap: 0.5rem;
  }

  .reception-sidepane__actions button {
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #ffffff;
    color: #1d4ed8;
    font-weight: 700;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
  }

  .reception-sidepane__actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .reception-sidepane__meta {
    font-size: 0.85rem;
    color: #64748b;
  }

  .reception-sidepane__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.6rem;
  }

  .reception-sidepane__item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    background: #f8fafc;
    border-radius: 12px;
    padding: 0.6rem;
    border: 1px solid rgba(148, 163, 184, 0.25);
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-sidepane__item strong {
    color: #0f172a;
    font-size: 0.95rem;
  }

  .reception-sidepane__empty {
    margin: 0;
    color: #64748b;
  }

  .reception-accept {
    background: #ffffff;
    border-radius: 24px;
    padding: 1.1rem;
    border: 1px solid rgba(37, 99, 235, 0.15);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .reception-accept__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .reception-accept__lead {
    margin: 0.3rem 0 0;
    color: #475569;
  }

  .reception-accept__meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .reception-accept__form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .reception-accept__row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.75rem;
  }

  .reception-accept__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: 600;
    color: #0f172a;
  }

  .reception-accept__field input,
  .reception-accept__field select {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #cbd5f5;
    padding: 0.55rem 0.75rem;
    background: #ffffff;
    font-size: 0.95rem;
  }

  .reception-accept__field--inline {
    padding: 0.5rem;
    border: 1px dashed #cbd5f5;
    border-radius: 12px;
  }

  .reception-accept__radio {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-right: 1rem;
  }

  .reception-accept__required {
    margin-left: 0.35rem;
    color: #b91c1c;
    font-size: 0.8rem;
    font-weight: 700;
  }

  .reception-accept__error {
    color: #b91c1c;
    font-size: 0.82rem;
  }

  .reception-accept__actions {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .reception-accept__buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .reception-accept__hints {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.85rem;
    color: #475569;
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

  .reception-search__saved {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  .reception-search__saved-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    align-items: flex-end;
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

  .reception-exceptions {
    background: #ffffff;
    border-radius: 24px;
    padding: 1.25rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 8px 32px rgba(15, 23, 42, 0.06);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .reception-exceptions__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .reception-exceptions__header h2 {
    margin: 0;
    color: #0f172a;
  }

  .reception-exceptions__header p {
    margin: 0.35rem 0 0;
    color: #64748b;
    font-size: 0.9rem;
  }

  .reception-exceptions__counts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .reception-exceptions__empty {
    margin: 0;
    color: #64748b;
  }

  .reception-exceptions__list {
    display: grid;
    gap: 0.85rem;
  }

  .reception-exception {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: #f8fafc;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .reception-exception__head {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .reception-exception__badge {
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.85rem;
  }

  .reception-exception__badge--send_error {
    background: #fee2e2;
    color: #7f1d1d;
  }

  .reception-exception__badge--delayed {
    background: #fef3c7;
    color: #78350f;
  }

  .reception-exception__badge--unapproved {
    background: #e0e7ff;
    color: #3730a3;
  }

  .reception-exception__patient strong {
    display: block;
    color: #0f172a;
  }

  .reception-exception__patient small {
    color: #64748b;
  }

  .reception-exception__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1rem;
    font-size: 0.9rem;
    color: #0f172a;
  }

  .reception-exception__detail strong {
    display: block;
    margin-bottom: 0.35rem;
    color: #0f172a;
  }

  .reception-exception__detail p {
    margin: 0;
    color: #475569;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
  }

  .reception-exception__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
  }

  .reception-exception__actions button {
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #ffffff;
    color: #1d4ed8;
    font-weight: 700;
    padding: 0.4rem 0.9rem;
    cursor: pointer;
  }

  .reception-exception__actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .reception-exception__next {
    color: #0f172a;
    font-weight: 600;
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

  .reception-table__wrapper:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.45);
    outline-offset: 2px;
  }

  .reception-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1120px;
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

  .reception-table__row--selected {
    background: #eff6ff;
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
    display: inline-flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .reception-table__id .patient-meta-row__line {
    gap: 0.2rem 0.4rem;
  }

  .reception-table__id-item {
    align-items: baseline;
  }

  .reception-table__id-label {
    font-size: 0.7rem;
    color: #64748b;
  }

  .reception-table__id-value {
    font-weight: 700;
    color: #0f172a;
  }

  .reception-table__sub {
    color: #64748b;
    display: block;
    font-size: 0.78rem;
  }

  .reception-table__patient strong {
    display: block;
  }

  .reception-table__insurance {
    font-weight: 600;
    color: #0f172a;
  }

  .reception-table__claim {
    font-weight: 600;
    color: #0f172a;
  }

  .reception-table__last {
    font-weight: 600;
    color: #0f172a;
  }

  .reception-table__queue {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .reception-table__note {
    color: #1f2937;
  }

  .reception-table__source {
    color: #64748b;
    font-size: 0.8rem;
  }

  .reception-table__action {
    white-space: nowrap;
  }

  .reception-table__action-button {
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #ffffff;
    color: #1d4ed8;
    font-weight: 700;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
  }

  .reception-table__action-button:hover {
    background: #eef2ff;
  }

  .reception-table__action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #ffffff;
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
    background: #dbeafe;
    color: #1e3a8a;
  }

  .reception-badge--診療中 {
    background: #ffedd5;
    color: #7c2d12;
  }

  .reception-badge--会計待ち {
    background: #fef3c7;
    color: #78350f;
  }

  .reception-badge--会計済み {
    background: #d1fae5;
    color: #065f46;
  }

  .reception-badge--予約 {
    background: #bae6fd;
    color: #0c4a6e;
  }

  .reception-badge--muted {
    background: #f1f5f9;
    color: #475569;
  }

  .reception-queue {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.8rem;
  }

  .reception-queue--info {
    background: #dbeafe;
    color: #1e3a8a;
  }

  .reception-queue--warning {
    background: #fef3c7;
    color: #78350f;
  }

  .reception-queue--error {
    background: #fee2e2;
    color: #7f1d1d;
  }

  .reception-queue--success {
    background: #d1fae5;
    color: #065f46;
  }

  .reception-table tr:focus-visible {
    outline: 2px solid #1d4ed8;
    outline-offset: -2px;
  }

  .reception-audit {
    margin-top: 1.75rem;
    background: #ffffff;
    border-radius: 24px;
    padding: 1.5rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .reception-audit__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .reception-audit__header h2 {
    margin: 0;
    color: #0f172a;
  }

  .reception-audit__header p {
    margin: 0.35rem 0 0;
    color: #64748b;
    font-size: 0.9rem;
  }

  .reception-audit__header button {
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #ffffff;
    color: #1d4ed8;
    font-weight: 700;
    padding: 0.45rem 0.9rem;
    cursor: pointer;
  }

  .reception-audit__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
  }

  .reception-audit__field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-weight: 600;
    color: #0f172a;
    min-width: 260px;
  }

  .reception-audit__field input {
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    padding: 0.55rem 0.75rem;
    font-size: 0.95rem;
  }

  .reception-audit__toggle {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    font-weight: 600;
    color: #0f172a;
  }

  .reception-audit__controls button {
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #1d4ed8;
    color: #ffffff;
    font-weight: 700;
    padding: 0.45rem 0.9rem;
    cursor: pointer;
  }

  .reception-audit__summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-weight: 600;
    color: #0f172a;
  }

  .reception-audit__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .reception-audit__row {
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    padding: 0.85rem;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .reception-audit__row-main {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .reception-audit__row-sub {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    color: #475569;
    font-size: 0.85rem;
  }

  .reception-audit__row-queue {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: #0f172a;
    font-size: 0.85rem;
  }

  .reception-audit__row-queue code {
    background: #e2e8f0;
    padding: 0.2rem 0.4rem;
    border-radius: 6px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }

  .reception-audit__pill {
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: #e2e8f0;
    font-weight: 700;
    font-size: 0.8rem;
  }

  .reception-audit__pill--error {
    background: #fee2e2;
    color: #7f1d1d;
  }

  .reception-audit__pill--info {
    background: #e0e7ff;
    color: #3730a3;
  }

  .reception-audit__empty {
    margin: 0;
    color: #64748b;
  }

  @media (max-width: 768px) {
    .order-console__action {
      flex: 1 1 100%;
    }

    .reception-layout {
      grid-template-columns: 1fr;
    }

    .reception-layout__side {
      position: static;
    }

    .reception-table {
      min-width: 840px;
    }
  }
`;
