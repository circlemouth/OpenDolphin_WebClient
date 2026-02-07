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
    border-color: var(--ui-warning-border);
    background: var(--ui-warning-bg);
  }

  .status-badge--error {
    border-color: var(--ui-error-border);
    background: var(--ui-error-bg);
  }

  .status-badge--info {
    border-color: var(--ui-info-border);
    background: var(--ui-info-bg);
  }

  .status-badge--success {
    border-color: var(--ui-success-border);
    background: var(--ui-success-bg);
  }
`;

export const toneBannerStyles = css`
  .tone-banner {
    display: flex;
    gap: 0.8rem;
    align-items: center;
    padding: 0.9rem 1.1rem;
    border-radius: 16px;
    border: 1px solid var(--tone-banner-border, transparent);
    font-size: 0.95rem;
    background: var(--tone-banner-bg, #ffffff);
    color: var(--tone-banner-text, #0f172a);
  }

  .tone-banner__tag {
    font-weight: 700;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background: var(--tone-banner-tag-bg, rgba(255, 255, 255, 0.75));
    border: 1px solid var(--tone-banner-tag-border, rgba(255, 255, 255, 0.45));
    color: var(--tone-banner-tag-text, #0f172a);
  }

  .tone-banner__message {
    margin: 0;
    color: inherit;
    line-height: 1.6;
  }

  .tone-banner--error {
    --tone-banner-bg: var(--ui-error-bg);
    --tone-banner-border: var(--ui-error-border);
    --tone-banner-text: var(--ui-error-text);
    --tone-banner-tag-bg: #fee2e2;
    --tone-banner-tag-border: var(--ui-error-border);
    --tone-banner-tag-text: #7f1d1d;
  }

  .tone-banner--error .tone-banner__tag {
    color: var(--tone-banner-tag-text);
  }

  .tone-banner--warning {
    --tone-banner-bg: var(--ui-warning-bg);
    --tone-banner-border: var(--ui-warning-border);
    --tone-banner-text: var(--ui-warning-text);
    --tone-banner-tag-bg: #ffedd5;
    --tone-banner-tag-border: var(--ui-warning-border);
    --tone-banner-tag-text: var(--ui-warning-strong);
  }

  .tone-banner--warning .tone-banner__tag {
    color: var(--tone-banner-tag-text);
  }

  .tone-banner--info {
    --tone-banner-bg: var(--ui-info-bg);
    --tone-banner-border: var(--ui-info-border);
    --tone-banner-text: var(--ui-info-text);
    --tone-banner-tag-bg: #dbeafe;
    --tone-banner-tag-border: var(--ui-info-border);
    --tone-banner-tag-text: var(--ui-info-text);
  }

  .tone-banner--info .tone-banner__tag {
    color: var(--tone-banner-tag-text);
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

  .reception-modal__actions {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .reception-page {
    min-height: 100vh;
    padding: 3rem clamp(1rem, 4vw, 2.75rem);
    background: linear-gradient(180deg, #eef2fb 0%, #f8fafc 60%);
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .reception-table__status {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    align-items: flex-start;
  }

  .reception-status-mvp {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .reception-status-mvp__dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.9);
    box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.25);
  }

  .reception-status-mvp__dot[data-status='受付中'] {
    background: rgba(2, 132, 199, 0.9);
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.18);
  }

  .reception-status-mvp__dot[data-status='診療中'] {
    background: rgba(99, 102, 241, 0.9);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18);
  }

  .reception-status-mvp__dot[data-status='会計待ち'] {
    background: rgba(234, 88, 12, 0.9);
    box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.18);
  }

  .reception-status-mvp__dot[data-status='会計済み'] {
    background: rgba(22, 163, 74, 0.9);
    box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.18);
  }

  .reception-status-mvp__dot[data-status='予約'] {
    background: rgba(100, 116, 139, 0.9);
    box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.18);
  }

  .reception-status-mvp__next {
    display: flex;
    gap: 0.4rem;
    align-items: baseline;
    flex-wrap: wrap;
    font-size: 0.82rem;
    color: #475569;
    max-width: 12rem;
  }

  .reception-status-mvp__next[data-tone='error'] {
    color: var(--ui-error-text);
  }

  .reception-status-mvp__next[data-tone='warning'] {
    color: var(--ui-warning-strong);
  }

  .reception-status-mvp__next[data-tone='success'] {
    color: var(--ui-success-text);
  }

  .reception-status-mvp__next-label {
    color: rgba(100, 116, 139, 0.95);
  }

  .reception-status-mvp__next-detail {
    width: 100%;
    color: rgba(71, 85, 105, 0.95);
  }

  .reception-page__header {
    background: #ffffff;
    border-radius: 24px;
    padding: 1.5rem;
    box-shadow: var(--ui-shadow);
    border: 1px solid var(--ui-border);
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
    border: 1px solid var(--ui-border);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    box-shadow: var(--ui-shadow);
  }

  .order-console__status-steps {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .order-console__step {
    background: var(--ui-surface-muted);
    border-radius: 20px;
    padding: 0.95rem 1.05rem;
    border: 1px solid var(--ui-border);
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
    gap: 0.8rem;
    align-items: center;
    padding: 0.9rem 1.1rem;
    border-radius: 16px;
    border: 1px solid var(--tone-banner-border, transparent);
    font-size: 0.95rem;
    background: var(--tone-banner-bg, #ffffff);
    color: var(--tone-banner-text, #0f172a);
  }

  .tone-banner__tag {
    font-weight: 700;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background: var(--tone-banner-tag-bg, rgba(255, 255, 255, 0.75));
    border: 1px solid var(--tone-banner-tag-border, rgba(255, 255, 255, 0.45));
    color: var(--tone-banner-tag-text, #0f172a);
  }

  .tone-banner__message {
    margin: 0;
    color: inherit;
    line-height: 1.6;
  }

  .tone-banner--error {
    --tone-banner-bg: var(--ui-error-bg);
    --tone-banner-border: var(--ui-error-border);
    --tone-banner-text: var(--ui-error-text);
    --tone-banner-tag-bg: #fee2e2;
    --tone-banner-tag-border: var(--ui-error-border);
    --tone-banner-tag-text: #7f1d1d;
  }

  .tone-banner--error .tone-banner__tag {
    color: var(--tone-banner-tag-text);
  }

  .tone-banner--warning {
    --tone-banner-bg: var(--ui-warning-bg);
    --tone-banner-border: var(--ui-warning-border);
    --tone-banner-text: var(--ui-warning-text);
    --tone-banner-tag-bg: #ffedd5;
    --tone-banner-tag-border: var(--ui-warning-border);
    --tone-banner-tag-text: var(--ui-warning-strong);
  }

  .tone-banner--warning .tone-banner__tag {
    color: var(--tone-banner-tag-text);
  }

  .tone-banner--info {
    --tone-banner-bg: var(--ui-info-bg);
    --tone-banner-border: var(--ui-info-border);
    --tone-banner-text: var(--ui-info-text);
    --tone-banner-tag-bg: #dbeafe;
    --tone-banner-tag-border: var(--ui-info-border);
    --tone-banner-tag-text: var(--ui-info-text);
  }

  .tone-banner--info .tone-banner__tag {
    color: var(--tone-banner-tag-text);
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

  .reception-exception-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.45);
    background: #ffffff;
    color: #0f172a;
    font-weight: 800;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    transition: transform 0.08s ease, background 0.2s ease, border-color 0.2s ease;
  }

  .reception-exception-indicator:hover {
    background: #f8fafc;
  }

  .reception-exception-indicator:active {
    transform: translateY(1px);
  }

  .reception-exception-indicator__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.18);
    font-weight: 900;
  }

  .reception-exception-indicator__label {
    font-size: 0.85rem;
    font-weight: 800;
  }

  .reception-exception-indicator__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.65rem;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.08);
    font-size: 0.82rem;
    font-weight: 900;
  }

  .reception-exception-indicator.is-active[data-tone='error'] {
    border-color: var(--ui-error-border);
    background: var(--ui-error-bg);
    color: var(--ui-error-text);
  }

  .reception-exception-indicator.is-active[data-tone='warning'] {
    border-color: var(--ui-warning-border);
    background: var(--ui-warning-bg);
    color: var(--ui-warning-strong);
  }

  .reception-exception-indicator.is-active[data-tone='info'] {
    border-color: var(--ui-info-border);
    background: var(--ui-info-bg);
    color: var(--ui-info-text);
  }

  .reception-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 1.5rem;
    align-items: start;
    width: 100%;
  }

  .reception-layout__main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    min-width: 0;
  }

  /* Most frequent operation: status check. Put the board at the top visually. */
  .reception-layout__main > .reception-board {
    order: -20;
  }

  .reception-layout__main > .reception-selection {
    order: -19;
  }

  .reception-layout__main > .reception-search {
    order: -18;
  }

  .reception-layout__main > .reception-master {
    order: -17;
  }

  .reception-layout__main > .reception-section {
    order: -16;
  }

  .reception-layout__side {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: sticky;
    top: 1.5rem;
    align-self: start;
    max-height: calc(100vh - 3rem);
    overflow-y: auto;
    padding-right: 0.35rem;
  }

  .reception-layout__side::-webkit-scrollbar {
    width: 10px;
  }

  .reception-layout__side::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.5);
    border-radius: 999px;
    border: 3px solid transparent;
    background-clip: content-box;
  }

  .reception-layout__side::-webkit-scrollbar-track {
    background: transparent;
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

  .reception-sidepane__action {
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #ffffff;
    color: #1d4ed8;
    font-weight: 700;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
  }

  .reception-sidepane__action.primary {
    background: #1d4ed8;
    color: #ffffff;
    box-shadow: 0 8px 18px rgba(29, 78, 216, 0.2);
  }

  .reception-sidepane__action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .reception-sidepane__meta {
    font-size: 0.85rem;
    color: #64748b;
  }

  .reception-sidepane__lead {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-sidepane__lead-meta {
    color: #1f2937;
    font-weight: 600;
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

  .reception-sidepane__item small {
    font-size: 0.75rem;
    color: #64748b;
  }

  .reception-sidepane__item--wide {
    grid-column: 1 / -1;
  }

  .reception-sidepane__empty {
    margin: 0;
    color: #64748b;
  }

  .reception-master {
    background: #ffffff;
    border-radius: 24px;
    padding: 1.1rem;
    border: 1px solid rgba(37, 99, 235, 0.15);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .reception-master__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .reception-master__lead {
    margin: 0.3rem 0 0;
    color: #475569;
  }

  .reception-master__meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .reception-master__form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .reception-master__form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .reception-master__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: 600;
    color: #0f172a;
    font-size: 0.92rem;
  }

  .reception-master__required {
    margin-left: 0.35rem;
    color: #b91c1c;
    font-size: 0.8rem;
    font-weight: 700;
  }

  .reception-master__field input,
  .reception-master__field select {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    padding: 0.55rem 0.75rem;
    background: #ffffff;
    font-size: 0.95rem;
  }

  .reception-master__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .reception-master__hints {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-master__error {
    color: #b91c1c;
    font-weight: 700;
  }

  .reception-master__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .reception-master__results {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .reception-master__results-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-master__empty {
    margin: 0;
    color: #64748b;
  }

  .reception-master__list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .reception-master__row {
    border-radius: 14px;
    border: 1px solid var(--ui-border);
    background: var(--ui-surface);
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    text-align: left;
    cursor: pointer;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .reception-master__row:hover {
    border-color: rgba(37, 99, 235, 0.35);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  }

  .reception-master__row.is-selected {
    border-color: #2563eb;
    box-shadow: 0 12px 28px rgba(37, 99, 235, 0.25);
  }

  .reception-master__row:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .reception-master__row-main {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    align-items: baseline;
  }

  .reception-master__row-meta {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
    color: #475569;
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

  .reception-accept__requirements {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.75rem 0.9rem;
    border-radius: 14px;
    border: 1px dashed #cbd5f5;
    background: #f8fafc;
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-accept__requirements strong {
    color: #0f172a;
    font-size: 0.9rem;
  }

  .reception-accept__notice {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.75rem 0.9rem;
    border-radius: 14px;
    border: 1px solid #fdba74;
    background: #fff7ed;
    color: #7c2d12;
    font-size: 0.85rem;
  }

  .reception-accept__notice strong {
    font-weight: 700;
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

  .reception-accept__field--alert input {
    border-color: #f59e0b;
    background: #fff7ed;
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);
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

  .reception-accept__optional {
    margin-left: 0.35rem;
    color: #64748b;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .reception-accept__error {
    color: #b91c1c;
    font-size: 0.82rem;
  }

  .reception-accept__manual {
    margin-top: 0.4rem;
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .reception-accept__manual input {
    flex: 1 1 160px;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    padding: 0.45rem 0.65rem;
    font-size: 0.85rem;
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

  .reception-accept__result {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.95rem;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
  }

  .reception-accept__result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .reception-accept__result-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #0f172a;
  }

  .reception-accept__result-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-accept__result-detail {
    margin: 0;
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-accept__result-empty {
    margin: 0;
    font-size: 0.9rem;
    color: #64748b;
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

  .reception-search__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .reception-search__header-main {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  .reception-search__header-main h2 {
    margin: 0;
    font-size: 1.05rem;
    color: #0f172a;
  }

  .reception-search__header-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.75rem;
    font-size: 0.82rem;
    color: #475569;
    font-weight: 650;
  }

  .reception-search__header-summary {
    color: #0f172a;
    font-weight: 800;
    font-size: 0.92rem;
  }

  .reception-search.is-collapsed {
    padding-bottom: 0.9rem;
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

  .reception-search__saved-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-search__saved-share {
    font-weight: 700;
    color: #1d4ed8;
  }

  .reception-search__saved-updated {
    color: #475569;
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

  .reception-search__button[data-disabled='true'] {
    opacity: 0.6;
    cursor: not-allowed;
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

  .reception-exceptions__title {
    max-width: 520px;
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

  .reception-exceptions__note {
    margin: 0.35rem 0 0;
    color: #475569;
    font-size: 0.82rem;
  }

  .reception-exceptions__counts {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    min-width: min(420px, 100%);
  }

  .reception-exceptions__count {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    align-items: flex-start;
  }

  .reception-exceptions__count-note {
    font-size: 0.75rem;
    color: #64748b;
  }

  .reception-exceptions__count--total .reception-exceptions__count-note {
    color: #0f172a;
    font-weight: 600;
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
    border-left: 4px solid transparent;
  }

  .reception-exception--send_error {
    border-left-color: #ef4444;
  }

  .reception-exception--delayed {
    border-left-color: #f59e0b;
  }

  .reception-exception--unapproved {
    border-left-color: #6366f1;
  }

  .reception-exception__head {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .reception-exception__title {
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

  .reception-exception__priority {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    align-items: flex-end;
    font-size: 0.8rem;
    color: #475569;
  }

  .reception-exception__priority-value {
    color: #0f172a;
    font-weight: 700;
  }

  .reception-exception__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1rem;
    font-size: 0.9rem;
    color: #0f172a;
  }

  .reception-exception__signals {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .reception-exception__signal {
    padding: 0.5rem 0.65rem;
    border-radius: 12px;
    border: 1px dashed #cbd5f5;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    color: #475569;
    font-size: 0.8rem;
  }

  .reception-exception__signal.is-active {
    border-style: solid;
    border-color: rgba(59, 130, 246, 0.35);
    background: #eff6ff;
    color: #0f172a;
  }

  .reception-exception__signal-label {
    font-weight: 700;
    font-size: 0.75rem;
    color: #1e293b;
  }

  .reception-exception__signal-detail {
    color: #475569;
    word-break: break-word;
  }

  .reception-exception__queue {
    display: grid;
    gap: 0.4rem;
  }

  .reception-exception__queue-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #0f172a;
  }

  .reception-exception__queue-title {
    font-weight: 700;
    color: #1e293b;
  }

  .reception-exception__queue-status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    font-weight: 600;
  }

  .reception-exception__queue-status small {
    font-weight: 500;
    color: #475569;
  }

  .reception-exception__queue-status[data-tone='error'] {
    background: #fee2e2;
    color: #7f1d1d;
    border-color: rgba(248, 113, 113, 0.4);
  }

  .reception-exception__queue-status[data-tone='warning'] {
    background: #fef3c7;
    color: #78350f;
    border-color: rgba(251, 191, 36, 0.4);
  }

  .reception-exception__queue-status[data-tone='info'] {
    background: #dbeafe;
    color: #1e3a8a;
    border-color: rgba(147, 197, 253, 0.5);
  }

  .reception-exception__queue-status[data-tone='success'] {
    background: #dcfce7;
    color: #166534;
    border-color: rgba(74, 222, 128, 0.4);
  }

  .reception-exception__queue-source {
    font-size: 0.75rem;
    color: #64748b;
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
    gap: 0.8rem 1rem;
    justify-content: space-between;
  }

  .reception-exception__next {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    color: #0f172a;
    font-weight: 600;
  }

  .reception-exception__next-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
  }

  .reception-exception__action-buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .reception-exception__action-button {
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #ffffff;
    color: #1d4ed8;
    font-weight: 700;
    padding: 0.4rem 0.9rem;
    cursor: pointer;
    transition: transform 0.08s ease, background 0.2s ease, color 0.2s ease;
  }

  .reception-exception__action-button.primary {
    background: #1d4ed8;
    color: #ffffff;
  }

  .reception-exception__action-button.warning {
    border-color: #f59e0b;
    color: #b45309;
  }

  .reception-exception__action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .reception-summary {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: 600;
    color: #0f172a;
  }

  .reception-summary__main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
  }

  .reception-summary__state {
    color: #1d4ed8;
    font-weight: 700;
    font-size: 0.85rem;
  }

  .reception-summary__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-summary__empty {
    margin: 0;
    font-size: 0.9rem;
    color: #475569;
  }

  .reception-summary__empty-hint {
    display: block;
    margin-top: 0.3rem;
    font-size: 0.8rem;
    color: #64748b;
  }

  .reception-selection {
    background: #ffffff;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
  }

  .reception-selection__main {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: baseline;
    color: #0f172a;
  }

  .reception-selection__label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #2563eb;
    font-weight: 700;
  }

  .reception-selection__meta {
    color: #475569;
    font-size: 0.85rem;
  }

  .reception-selection__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
  }

  .reception-selection__button {
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #1d4ed8;
    color: #ffffff;
    font-weight: 700;
    padding: 0.35rem 0.9rem;
    cursor: pointer;
  }

  .reception-selection__button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .reception-selection__hint {
    font-size: 0.85rem;
    color: #475569;
  }

  .reception-selection__notice {
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    border: 1px solid transparent;
  }

  .reception-selection__notice--info {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }

  .reception-selection__notice--warning {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fdba74;
  }

  .reception-status {
    margin: 0;
    color: #475569;
  }

  .reception-status--error {
    color: #b91c1c;
    font-weight: 700;
  }

  .reception-board {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    overflow-x: auto;
    padding-bottom: 0.75rem;
    scroll-snap-type: x proximity;
  }

  .reception-board__column {
    flex: 0 0 360px;
    max-width: 420px;
    min-height: 240px;
    border-radius: 20px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    overflow: hidden;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    --reception-board-accent: rgba(148, 163, 184, 0.65);
  }

  .reception-board__column[data-status='受付中'] {
    --reception-board-accent: rgba(2, 132, 199, 0.85);
  }

  .reception-board__column[data-status='診療中'] {
    --reception-board-accent: rgba(99, 102, 241, 0.85);
  }

  .reception-board__column[data-status='会計待ち'] {
    --reception-board-accent: rgba(234, 88, 12, 0.85);
  }

  .reception-board__column[data-status='会計済み'] {
    --reception-board-accent: rgba(22, 163, 74, 0.85);
  }

  .reception-board__column[data-status='予約'] {
    --reception-board-accent: rgba(100, 116, 139, 0.85);
  }

  .reception-board__header {
    padding: 0.9rem 1.05rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    background: linear-gradient(90deg, rgba(238, 242, 255, 0.95) 0%, #ffffff 65%);
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
    border-top: 4px solid var(--reception-board-accent);
  }

  .reception-board__title {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: baseline;
    min-width: 0;
  }

  .reception-board__title h2 {
    margin: 0;
    font-size: 1rem;
    color: #0f172a;
    white-space: nowrap;
  }

  .reception-board__count {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.06);
    color: #0f172a;
    font-weight: 700;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .reception-board__toggle {
    border: 1px solid rgba(148, 163, 184, 0.55);
    background: #ffffff;
    color: #0f172a;
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    font-weight: 700;
  }

  .reception-board__body {
    padding: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .reception-board__empty {
    margin: 0;
    padding: 0.85rem 0.9rem;
    border-radius: 16px;
    border: 1px dashed rgba(148, 163, 184, 0.55);
    background: #f8fafc;
    color: #64748b;
    font-weight: 600;
    text-align: center;
  }

  .reception-card {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
    padding: 0.85rem 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    cursor: pointer;
    transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    outline: none;
  }

  .reception-card:hover {
    border-color: rgba(37, 99, 235, 0.35);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
    background: #ffffff;
  }

  .reception-card.is-selected {
    border-color: rgba(37, 99, 235, 0.75);
    box-shadow: 0 14px 30px rgba(37, 99, 235, 0.16);
    background: #ffffff;
  }

  .reception-card:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.45);
    outline-offset: 2px;
  }

  .reception-card__head {
    display: flex;
    justify-content: space-between;
    gap: 0.6rem;
    align-items: center;
  }

  .reception-card__time {
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.02em;
  }

  .reception-card__name {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: baseline;
    color: #0f172a;
  }

  .reception-card__name strong {
    font-size: 1.05rem;
  }

  .reception-card__name small {
    font-size: 0.85rem;
    color: #64748b;
  }

  .reception-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.75rem;
    color: #475569;
    font-size: 0.86rem;
    font-weight: 600;
  }

  .reception-card__meta code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.82rem;
    background: rgba(15, 23, 42, 0.06);
    padding: 0.1rem 0.35rem;
    border-radius: 8px;
  }

  .reception-card__signals {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    align-items: center;
  }

  .reception-card__signals small {
    color: #64748b;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .reception-card__actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    margin-top: 0.1rem;
  }

  .reception-card__action {
    border-radius: 999px;
    border: 1px solid #1d4ed8;
    background: #ffffff;
    color: #1d4ed8;
    font-weight: 800;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s ease;
  }

  .reception-card__action:hover {
    background: #eef2ff;
  }

  .reception-card__action.warning {
    border-color: #f59e0b;
    color: #b45309;
  }

  .reception-card__action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #ffffff;
  }

  .reception-patient-search {
    background: #ffffff;
    border-radius: 20px;
    padding: 1.1rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .reception-patient-search--embedded {
    background: #f8fafc;
    border-color: rgba(148, 163, 184, 0.22);
    box-shadow: none;
  }

  .reception-patient-search__collapsed-hint {
    margin: 0;
    color: #64748b;
    font-size: 0.85rem;
    line-height: 1.6;
  }

  .reception-patient-search__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .reception-patient-search__header h2,
  .reception-patient-search__header h3 {
    margin: 0;
    font-size: 1.05rem;
    color: #0f172a;
  }

  .reception-patient-search__header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .reception-patient-search__meta {
    font-size: 0.85rem;
    color: #64748b;
  }

  .reception-patient-search__form {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .reception-patient-search__row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .reception-patient-search__field {
    flex: 1 1 220px;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: 700;
    color: #0f172a;
    font-size: 0.92rem;
  }

  .reception-patient-search__field input {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    padding: 0.55rem 0.75rem;
    background: #ffffff;
    font-size: 0.95rem;
  }

  .reception-patient-search__buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .reception-patient-search__list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    max-height: 300px;
    overflow: auto;
    padding-right: 0.25rem;
  }

  .reception-patient-search__item {
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: #ffffff;
    padding: 0.75rem 0.85rem;
    text-align: left;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .reception-patient-search__item-select {
    border: 0;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }

  .reception-patient-search__item-select:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.45);
    outline-offset: 2px;
    border-radius: 12px;
  }

  .reception-patient-search__item-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .reception-patient-search__item-actions .reception-search__button {
    padding: 0.45rem 0.75rem;
    font-size: 0.85rem;
  }

  .reception-patient-search__item:hover {
    border-color: rgba(37, 99, 235, 0.35);
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.1);
    background: #ffffff;
  }

  .reception-patient-search__item.is-selected {
    border-color: rgba(37, 99, 235, 0.75);
    box-shadow: 0 12px 26px rgba(37, 99, 235, 0.16);
    background: #ffffff;
  }

  .reception-patient-search__item strong {
    display: block;
    color: #0f172a;
  }

  .reception-patient-search__item small {
    display: block;
    margin-top: 0.2rem;
    color: #64748b;
  }

  .reception-patient-search__item-meta {
    margin-top: 0.35rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.75rem;
    font-size: 0.85rem;
    color: #475569;
    font-weight: 600;
  }

  .reception-history {
    background: #ffffff;
    border-radius: 20px;
    padding: 1.1rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .reception-history__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .reception-history__header h2 {
    margin: 0;
    font-size: 1.05rem;
    color: #0f172a;
  }

  .reception-history__meta {
    font-size: 0.85rem;
    color: #64748b;
  }

  .reception-history__list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    max-height: 340px;
    overflow: auto;
    padding-right: 0.25rem;
  }

  .reception-history__item {
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: #f8fafc;
    padding: 0.7rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .reception-history__item strong {
    color: #0f172a;
    font-size: 0.95rem;
  }

  .reception-history__item small {
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 600;
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

  .reception-table__row {
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }

  .reception-table__row--selected {
    background: #eef2ff;
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.6), inset 4px 0 0 #2563eb;
  }

  .reception-table__row--selected:hover {
    background: #e0e7ff;
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
      max-height: none;
      overflow: visible;
      padding-right: 0;
    }

    .reception-table {
      min-width: 840px;
    }

    .reception-board__column {
      flex: 0 0 300px;
    }
  }
`;
