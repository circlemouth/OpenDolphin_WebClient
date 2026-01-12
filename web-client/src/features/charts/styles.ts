import { css } from '@emotion/react';

export const chartsStyles = css`
  .charts-page {
    min-height: 100vh;
    padding: 2.25rem clamp(1rem, 4vw, 2.75rem);
    background: linear-gradient(180deg, #f3f4ff 0%, #f8fafc 65%);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xl);
    --charts-space-2xs: 4px;
    --charts-space-xs: 6px;
    --charts-space-sm: 10px;
    --charts-space-md: 14px;
    --charts-space-lg: 18px;
    --charts-space-xl: 24px;
    --charts-space-2xl: 32px;
    --charts-radius-sm: 10px;
    --charts-radius-md: 14px;
    --charts-radius-lg: 18px;
    --charts-shadow-none: none;
    --charts-shadow-1: 0 8px 18px rgba(15, 23, 42, 0.08);
    --charts-shadow-2: 0 12px 28px rgba(15, 23, 42, 0.12);
  }

  .charts-page__header {
    background: #ffffff;
    border-radius: var(--charts-radius-lg);
    padding: var(--charts-space-md) var(--charts-space-lg);
    border: 1px solid rgba(148, 163, 184, 0.35);
    box-shadow: var(--charts-shadow-1);
  }

  .charts-page__header h1 {
    margin: 0;
    font-size: 1.6rem;
    color: #0f172a;
  }

  .charts-page__header p {
    margin: var(--charts-space-xs) 0 0;
    color: #475569;
    line-height: 1.6;
  }

  .charts-page__meta {
    margin-top: var(--charts-space-sm);
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-sm);
  }

  .charts-page__pill {
    font-size: 0.85rem;
  }

  .charts-page__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: var(--charts-space-lg);
    align-items: start;
  }

  .charts-workbench {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-md);
    --charts-utility-compact-width: 64px;
    --charts-utility-expanded-width: 320px;
    --charts-utility-expanded-width-wide: 360px;
    --charts-utility-expanded-width-narrow: 280px;
    --charts-utility-width: var(--charts-utility-compact-width);
    --charts-utility-height: 0px;
    --charts-side-width: var(--charts-utility-expanded-width);
  }

  .charts-workbench[data-utility-state='expanded'] {
    --charts-utility-width: var(--charts-utility-expanded-width);
  }

  @media (min-width: 1440px) {
    .charts-workbench {
      --charts-side-width: var(--charts-utility-expanded-width-wide);
    }

    .charts-workbench[data-utility-state='expanded'] {
      --charts-utility-width: var(--charts-utility-expanded-width-wide);
    }
  }

  @media (max-width: 1279px) {
    .charts-workbench {
      --charts-utility-compact-width: 56px;
      --charts-side-width: var(--charts-utility-expanded-width-narrow);
    }

    .charts-workbench[data-utility-state='expanded'] {
      --charts-utility-width: var(--charts-utility-expanded-width-narrow);
    }
  }
  }

  .charts-workbench__sticky {
    position: sticky;
    top: 1rem;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-card--summary {
    padding: var(--charts-space-sm);
  }

  .charts-card--memo {
    padding: var(--charts-space-sm);
  }

  .charts-patient-summary {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--charts-space-md);
    align-items: start;
  }

  .charts-patient-summary__left {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
  }

  .charts-patient-summary__label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .charts-patient-summary__name {
    margin: 0;
    font-size: 1.5rem;
    color: #0f172a;
  }

  .charts-patient-summary__kana {
    color: #475569;
    font-size: 0.95rem;
  }

  .charts-patient-summary__sex-age {
    font-size: 0.95rem;
    font-weight: 600;
    color: #1f2937;
  }

  .charts-patient-summary__center {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-patient-summary__meta-row,
  .charts-patient-summary__clinical-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--charts-space-xs) var(--charts-space-sm);
  }

  .charts-patient-summary__clinical-row--compact {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .charts-patient-summary__meta-item {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
  }

  .charts-patient-summary__meta-item--stack {
    gap: var(--charts-space-2xs);
  }

  .charts-patient-summary__meta-label {
    font-size: 0.75rem;
    color: #64748b;
  }

  .charts-patient-summary__meta-value {
    font-size: 0.95rem;
    color: #0f172a;
  }

  .charts-patient-summary__meta-sub {
    font-size: 0.72rem;
    color: #475569;
  }

  .charts-patient-summary__right {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
  }

  .charts-orca-original {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-md);
  }

  .charts-orca-original__header h3 {
    margin: 0;
  }

  .charts-orca-original__kicker {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-size: 0.75rem;
  }

  .charts-orca-original__sub {
    margin: var(--charts-space-xs) 0 0;
    color: #475569;
    font-size: 0.85rem;
  }

  .charts-orca-original__empty {
    margin: 0;
    color: #64748b;
  }

  .charts-orca-original__section {
    border-radius: var(--charts-radius-md);
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: #f8fafc;
    padding: var(--charts-space-sm);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-orca-original__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
  }

  .charts-orca-original__section-head strong {
    display: block;
    font-size: 0.95rem;
    color: #0f172a;
  }

  .charts-orca-original__section-head span {
    font-size: 0.8rem;
    color: #64748b;
  }

  .charts-orca-original__section-actions {
    display: flex;
    gap: var(--charts-space-xs);
    flex-wrap: wrap;
  }

  .charts-orca-original__section-actions button {
    border: none;
    border-radius: 10px;
    padding: 0.45rem 0.8rem;
    font-weight: 700;
    cursor: pointer;
    background: #0f172a;
    color: #ffffff;
  }

  .charts-orca-original__section-actions button.ghost {
    background: #e2e8f0;
    color: #0f172a;
  }

  .charts-orca-original__textarea {
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.85rem;
    line-height: 1.4;
    resize: vertical;
  }

  .charts-orca-original__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-sm);
    font-size: 0.85rem;
    color: #475569;
  }

  .charts-orca-original__response {
    margin: 0;
    padding: var(--charts-space-sm);
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: #0f172a;
    color: #e2e8f0;
    font-size: 0.8rem;
    line-height: 1.5;
    max-height: 280px;
    overflow: auto;
  }

  .charts-orca-original__summary {
    cursor: pointer;
    font-weight: 700;
    list-style: none;
  }

  .charts-orca-original__summary::-webkit-details-marker {
    display: none;
  }

  .charts-orca-original__direct {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-patient-summary__safety-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--charts-space-sm);
  }

  .charts-patient-summary__safety-summary {
    display: inline-flex;
    align-items: center;
    gap: var(--charts-space-xs);
    font-size: 0.85rem;
    font-weight: 700;
    padding: var(--charts-space-2xs) var(--charts-space-sm);
    border-radius: 999px;
    border: 1px solid transparent;
  }

  .charts-patient-summary__safety-label {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .charts-patient-summary__safety-state {
    font-weight: 700;
  }

  .charts-patient-summary__safety-summary--neutral {
    color: #0f172a;
    background: #f1f5f9;
    border-color: rgba(148, 163, 184, 0.4);
  }

  .charts-patient-summary__safety-summary--info {
    color: #1d4ed8;
    background: #e0f2fe;
    border-color: rgba(59, 130, 246, 0.3);
  }

  .charts-patient-summary__safety-summary--warning {
    color: #b45309;
    background: #fef3c7;
    border-color: rgba(245, 158, 11, 0.4);
  }

  .charts-patient-summary__runid {
    font-size: 0.7rem;
  }

  .charts-patient-summary__runid .runid-badge__value {
    font-size: 0.75rem;
  }

  .charts-patient-summary__runid .runid-badge__copy {
    padding: var(--charts-space-2xs) var(--charts-space-xs);
    font-size: 0.65rem;
  }

  .charts-patient-summary__safety-toggle {
    align-self: flex-start;
    border: none;
    background: transparent;
    color: #1d4ed8;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: var(--charts-space-xs);
    cursor: pointer;
    padding: 0;
  }

  .charts-patient-summary__safety-toggle:hover,
  .charts-patient-summary__safety-toggle:focus-visible {
    text-decoration: underline;
  }

  .charts-patient-summary__safety-toggle-icon {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }

  .charts-patient-summary__safety-detail {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--charts-space-xs) var(--charts-space-sm);
    font-size: 0.85rem;
    padding: var(--charts-space-sm);
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: var(--charts-radius-sm);
    box-shadow: var(--charts-shadow-none);
  }

  .charts-patient-summary__safety-item {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
  }

  .charts-patient-summary__safety-item-label {
    font-size: 0.72rem;
    color: #64748b;
  }

  .charts-patient-summary__safety-item-value {
    color: #0f172a;
  }

  .charts-patient-summary__safety-empty {
    color: #94a3b8;
    font-size: 0.8rem;
  }

  .charts-patient-memo {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-patient-memo__label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .charts-patient-memo__text {
    margin: 0;
    padding: var(--charts-space-sm) var(--charts-space-md);
    border-radius: var(--charts-radius-sm);
    background: #f8fafc;
    border: 1px dashed rgba(148, 163, 184, 0.4);
    color: #334155;
  }

  @media (max-width: 1279px) {
    .charts-patient-summary {
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    }

    .charts-patient-summary__right {
      grid-column: 1 / -1;
      justify-self: end;
    }
  }

  @media (max-width: 1023px) {
    .charts-patient-summary {
      grid-template-columns: 1fr;
    }

    .charts-patient-summary__right {
      justify-self: stretch;
    }
  }

  .charts-workbench__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--charts-side-width);
    gap: var(--charts-space-md);
    align-items: start;
  }

  .charts-workbench__body {
    display: grid;
    grid-template-columns: minmax(280px, 0.95fr) minmax(420px, 1.6fr) minmax(300px, 1.05fr);
    gap: var(--charts-space-md);
    align-items: start;
    min-width: 0;
  }

  .charts-workbench__column {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-md);
  }

  .charts-workbench__side {
    position: sticky;
    top: 1.25rem;
    align-self: start;
    width: 100%;
    z-index: 3;
    background: #ffffff;
    border-radius: var(--charts-radius-lg);
    padding: var(--charts-space-md);
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: var(--charts-shadow-2);
  }

  .charts-docked-panel {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-docked-panel__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--charts-space-sm);
  }

  .charts-focus-anchor {
    height: 0;
    width: 100%;
    outline: none;
    pointer-events: none;
  }

  .charts-docked-panel__quick {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
  }

  .charts-docked-panel__eyebrow {
    margin: 0;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .charts-docked-panel__header h2 {
    margin: var(--charts-space-2xs) 0 0;
    font-size: 1.1rem;
    color: #0f172a;
  }

  .charts-docked-panel__desc {
    margin: var(--charts-space-2xs) 0 0;
    font-size: 0.82rem;
    color: #475569;
  }

  .charts-docked-panel__close {
    border: none;
    background: transparent;
    color: #1d4ed8;
    cursor: pointer;
    font-weight: 700;
    padding: var(--charts-space-2xs) var(--charts-space-xs);
  }

  .charts-docked-panel__tabs {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
  }

  .charts-docked-panel__tab {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(59, 130, 246, 0.2);
    background: #f8fafc;
    padding: var(--charts-space-sm);
    font-weight: 700;
    cursor: pointer;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: var(--charts-space-sm);
    text-align: left;
    transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease, border-color 120ms ease;
  }

  .charts-docked-panel__tab:hover {
    background: #eff6ff;
  }

  .charts-docked-panel__tab[data-active='true'] {
    background: #1d4ed8;
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 10px 22px rgba(29, 78, 216, 0.25);
  }

  .charts-docked-panel__tab:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  .charts-docked-panel__tab-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    padding: var(--charts-space-2xs) var(--charts-space-xs);
    border-radius: var(--charts-radius-sm);
    font-size: 0.7rem;
    font-weight: 800;
    background: rgba(148, 163, 184, 0.2);
    color: inherit;
  }

  .charts-docked-panel__tab-label {
    font-size: 0.9rem;
  }

  .charts-docked-panel__drawer {
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm);
    border: 1px dashed rgba(59, 130, 246, 0.35);
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
    max-height: calc(100vh - 12rem);
    overflow-y: auto;
    box-shadow: var(--charts-shadow-none);
  }

  .charts-docked-panel__drawer[data-open='false'] {
    opacity: 0.7;
  }

  .charts-docked-panel__empty {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
  }

  .charts-workbench[data-utility-state='compact'] .charts-docked-panel__header,
  .charts-workbench[data-utility-state='compact'] .charts-docked-panel__drawer {
    display: none;
  }

  .charts-workbench[data-utility-state='compact'] .charts-docked-panel {
    padding: var(--charts-space-sm) var(--charts-space-xs);
    align-items: center;
  }

  .charts-workbench[data-utility-state='compact'] .charts-docked-panel__tabs {
    gap: var(--charts-space-xs);
  }

  .charts-workbench[data-utility-state='compact'] .charts-docked-panel__tab {
    padding: var(--charts-space-xs);
    justify-content: center;
  }

  .charts-workbench[data-utility-state='compact'] .charts-docked-panel__tab-label {
    display: none;
  }

  .charts-workbench[data-utility-state='compact'] .charts-docked-panel__tab-icon {
    min-width: auto;
    font-size: 0.65rem;
    padding: var(--charts-space-2xs);
  }

  .charts-side-panel__message {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
  }

  .charts-side-panel__actions {
    display: grid;
    gap: var(--charts-space-xs);
  }

  .charts-side-panel__actions button {
    border-radius: 10px;
    border: 1px solid rgba(59, 130, 246, 0.4);
    background: #ffffff;
    padding: 0.45rem 0.6rem;
    cursor: pointer;
    font-weight: 600;
    color: #1d4ed8;
  }

  .charts-document-menu {
    display: grid;
    gap: var(--charts-space-sm);
  }

  .charts-document-menu__button {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #ffffff;
    padding: var(--charts-space-sm) var(--charts-space-md);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--charts-space-2xs);
    cursor: pointer;
    text-align: left;
  }

  .charts-document-menu__button span {
    font-weight: 700;
    color: #0f172a;
  }

  .charts-document-menu__button small {
    color: #64748b;
    font-size: 0.75rem;
  }

  .charts-document-menu__button--active {
    border-color: rgba(37, 99, 235, 0.4);
    background: #eff6ff;
  }

  .charts-side-panel__content {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-md);
  }

  .charts-side-panel__section {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-md);
  }

  .charts-side-panel__section-header {
    display: flex;
    justify-content: space-between;
    gap: var(--charts-space-sm);
    align-items: flex-start;
  }

  .charts-side-panel__section-header p {
    margin: var(--charts-space-2xs) 0 0;
    color: #64748b;
    font-size: 0.85rem;
  }

  .charts-side-panel__ghost {
    border: 1px solid rgba(59, 130, 246, 0.25);
    background: #ffffff;
    border-radius: 999px;
    padding: var(--charts-space-xs) var(--charts-space-sm);
    font-size: 0.8rem;
    cursor: pointer;
    color: #1d4ed8;
    font-weight: 600;
  }

  .charts-side-panel__notice {
    padding: var(--charts-space-xs) var(--charts-space-sm);
    border-radius: var(--charts-radius-sm);
    font-size: 0.85rem;
    border: 1px solid transparent;
  }

  .charts-side-panel__notice--success {
    background: #ecfdf5;
    border-color: #bbf7d0;
    color: #065f46;
  }

  .charts-side-panel__notice--error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }

  .charts-side-panel__notice--info {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1e3a8a;
  }

  .charts-side-panel__form {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
    background: #ffffff;
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm);
    border: 1px solid rgba(148, 163, 184, 0.25);
  }

  .charts-side-panel__form input,
  .charts-side-panel__form textarea,
  .charts-side-panel__form select {
    border-radius: var(--charts-radius-sm);
    border: 1px solid #cbd5f5;
    padding: var(--charts-space-xs) var(--charts-space-sm);
    font-size: 0.9rem;
  }

  .charts-side-panel__form input:disabled,
  .charts-side-panel__form textarea:disabled,
  .charts-side-panel__form select:disabled {
    background: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
  }

  .charts-side-panel__form textarea {
    resize: vertical;
    min-height: 64px;
  }

  .charts-side-panel__field {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
  }

  .charts-side-panel__field label {
    font-size: 0.78rem;
    color: #475569;
  }

  .charts-side-panel__help {
    margin: var(--charts-space-2xs) 0 0;
    font-size: 0.75rem;
    color: #64748b;
  }

  .charts-side-panel__template-actions {
    display: flex;
    gap: var(--charts-space-xs);
  }

  .charts-side-panel__template-actions button {
    border-radius: 999px;
    border: 1px solid rgba(59, 130, 246, 0.25);
    background: #eff6ff;
    color: #1d4ed8;
    cursor: pointer;
    padding: var(--charts-space-2xs) var(--charts-space-sm);
    font-size: 0.78rem;
    font-weight: 600;
  }

  .charts-side-panel__field-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--charts-space-sm);
  }

  .charts-side-panel__toggle {
    display: flex;
    align-items: center;
    gap: var(--charts-space-xs);
    font-size: 0.85rem;
    color: #334155;
  }

  .charts-side-panel__subsection {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
    border-top: 1px dashed rgba(148, 163, 184, 0.5);
    padding-top: var(--charts-space-sm);
  }

  .charts-side-panel__subsection--search {
    gap: var(--charts-space-sm);
  }

  .charts-side-panel__subheader {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .charts-side-panel__subheader-actions {
    display: flex;
    gap: var(--charts-space-xs);
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .charts-side-panel__status {
    font-size: 0.78rem;
    padding: var(--charts-space-2xs) var(--charts-space-sm);
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    color: #475569;
    background: #f1f5f9;
  }

  .charts-side-panel__status--ok {
    border-color: rgba(34, 197, 94, 0.4);
    color: #166534;
    background: #dcfce7;
  }

  .charts-side-panel__status--warn {
    border-color: rgba(234, 179, 8, 0.45);
    color: #92400e;
    background: #fef9c3;
  }

  .charts-side-panel__search-count {
    font-size: 0.78rem;
    color: #64748b;
  }

  .charts-side-panel__item-row {
    display: grid;
    grid-template-columns: auto 1.4fr 0.8fr 0.6fr auto;
    gap: var(--charts-space-xs);
    align-items: center;
    padding: var(--charts-space-2xs);
    border-radius: var(--charts-radius-sm);
  }

  .charts-side-panel__item-row--comment {
    grid-template-columns: 0.7fr 1.6fr 0.6fr 0.6fr auto;
  }

  .charts-side-panel__item-row--drag-over {
    background: rgba(59, 130, 246, 0.08);
    outline: 1px dashed rgba(59, 130, 246, 0.45);
  }

  .charts-side-panel__item-row--dragging {
    opacity: 0.7;
  }

  .charts-side-panel__item-row--selected {
    background: rgba(59, 130, 246, 0.12);
    outline: 1px solid rgba(59, 130, 246, 0.5);
  }

  .charts-side-panel__drag-handle {
    border: 1px solid rgba(148, 163, 184, 0.5);
    background: #f8fafc;
    color: #475569;
    border-radius: var(--charts-radius-sm);
    width: 32px;
    height: 32px;
    cursor: grab;
    font-weight: 700;
  }

  .charts-side-panel__drag-handle:active {
    cursor: grabbing;
  }

  .charts-side-panel__icon {
    border: none;
    background: #fee2e2;
    color: #b91c1c;
    border-radius: 999px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-weight: 700;
  }

  .charts-side-panel__row-delete {
    border: none;
    background: #fef2f2;
    color: #b91c1c;
    border-radius: 999px;
    padding: var(--charts-space-2xs) var(--charts-space-sm);
    cursor: pointer;
    font-weight: 700;
    font-size: 0.78rem;
  }

  .charts-side-panel__ghost--danger {
    border-color: rgba(239, 68, 68, 0.45);
    color: #b91c1c;
    background: #fff1f2;
  }

  .charts-side-panel__ghost:disabled,
  .charts-side-panel__actions button:disabled,
  .charts-side-panel__item-actions button:disabled,
  .charts-side-panel__row-delete:disabled,
  .charts-side-panel__drag-handle:disabled,
  .charts-side-panel__icon:disabled {
    background: #e2e8f0;
    border-color: rgba(148, 163, 184, 0.4);
    color: #94a3b8;
    cursor: not-allowed;
  }

  .charts-side-panel__list {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-side-panel__search-table {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: var(--charts-radius-sm);
    overflow: hidden;
    background: #f8fafc;
  }

  .charts-side-panel__search-header {
    display: grid;
    grid-template-columns: 1.2fr 2.2fr 0.9fr 1fr 1.4fr;
    gap: var(--charts-space-xs);
    padding: var(--charts-space-xs) var(--charts-space-sm);
    font-size: 0.75rem;
    color: #475569;
    background: #eef2ff;
    font-weight: 600;
  }

  .charts-side-panel__search-row {
    display: grid;
    grid-template-columns: 1.2fr 2.2fr 0.9fr 1fr 1.4fr;
    gap: var(--charts-space-xs);
    padding: var(--charts-space-sm);
    border: none;
    background: #ffffff;
    cursor: pointer;
    text-align: left;
    font-size: 0.82rem;
    color: #1f2937;
  }

  .charts-side-panel__search-row:nth-child(even) {
    background: #f9fafb;
  }

  .charts-side-panel__search-row:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
  }

  .charts-side-panel__search-row span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .charts-side-panel__list-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #64748b;
  }

  .charts-side-panel__items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-side-panel__items li {
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm);
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
  }

  .charts-document-list {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-document-list__header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #475569;
  }

  .charts-document-list__filters {
    display: grid;
    grid-template-columns: minmax(160px, 1.2fr) minmax(120px, 0.6fr) minmax(140px, 0.8fr) minmax(140px, 0.7fr) auto;
    gap: var(--charts-space-xs);
    align-items: center;
  }

  .charts-document-list__filters input,
  .charts-document-list__filters select {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.35);
    padding: var(--charts-space-xs) var(--charts-space-sm);
    font-size: 0.8rem;
    background: #ffffff;
    color: #0f172a;
  }

  .charts-document-list__clear {
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.45);
    background: #f1f5f9;
    color: #475569;
    padding: var(--charts-space-2xs) var(--charts-space-md);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
  }

  @media (max-width: 900px) {
    .charts-document-list__filters {
      grid-template-columns: 1fr;
    }
  }

  .charts-document-list__items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--charts-space-xs);
  }

  .charts-document-list__items li {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: #ffffff;
    padding: var(--charts-space-sm);
    display: grid;
    gap: var(--charts-space-2xs);
    box-shadow: var(--charts-shadow-none);
  }

  .charts-document-list__row {
    display: flex;
    justify-content: space-between;
    gap: var(--charts-space-sm);
    font-size: 0.85rem;
  }

  .charts-document-list__meta {
    display: flex;
    justify-content: space-between;
    color: #64748b;
    font-size: 0.78rem;
  }

  .charts-document-list__status {
    display: inline-flex;
    align-items: center;
    gap: var(--charts-space-2xs);
    padding: 2px var(--charts-space-sm);
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    background: #e2e8f0;
    color: #475569;
  }

  .charts-document-list__status--success {
    background: rgba(16, 185, 129, 0.15);
    color: #047857;
  }

  .charts-document-list__status--failed {
    background: rgba(239, 68, 68, 0.15);
    color: #b91c1c;
  }

  .charts-document-list__status--pending {
    background: rgba(59, 130, 246, 0.15);
    color: #1d4ed8;
  }

  .charts-document-list__status--none {
    background: #e2e8f0;
    color: #475569;
  }

  .charts-document-list__items li strong {
    color: #1e3a8a;
  }

  .charts-document-list__items li small {
    color: #64748b;
  }

  .charts-document-list__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--charts-space-xs);
  }

  .charts-document-list__actions button {
    border-radius: 999px;
    border: 1px solid rgba(37, 99, 235, 0.3);
    background: #eff6ff;
    color: #1d4ed8;
    cursor: pointer;
    padding: var(--charts-space-2xs) var(--charts-space-sm);
    font-size: 0.78rem;
    font-weight: 600;
  }

  .charts-document-list__actions button:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    border-color: rgba(148, 163, 184, 0.4);
    cursor: not-allowed;
  }

  .charts-document-list__guard {
    font-size: 0.75rem;
    color: #b91c1c;
  }

  .charts-document-list__recovery {
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-xs);
    align-items: center;
    font-size: 0.75rem;
  }

  .charts-document-list__recovery button,
  .charts-document-list__recovery a {
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.45);
    background: #f8fafc;
    color: #334155;
    padding: var(--charts-space-2xs) var(--charts-space-sm);
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: none;
  }

  .charts-side-panel__bundle-items {
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-xs) var(--charts-space-sm);
    color: #475569;
    font-size: 0.85rem;
  }

  .charts-side-panel__item-actions {
    display: flex;
    gap: var(--charts-space-xs);
  }

  .charts-side-panel__item-actions button {
    border-radius: 999px;
    border: 1px solid rgba(59, 130, 246, 0.25);
    background: #eff6ff;
    color: #1d4ed8;
    cursor: pointer;
    padding: var(--charts-space-2xs) var(--charts-space-sm);
    font-size: 0.78rem;
  }

  .charts-side-panel__item-actions button:last-child {
    border-color: rgba(239, 68, 68, 0.35);
    color: #b91c1c;
    background: #fef2f2;
  }

  .charts-side-panel__empty {
    margin: 0;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .charts-card {
    background: #ffffff;
    border-radius: var(--charts-radius-md);
    padding: var(--charts-space-md);
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: var(--charts-shadow-1);
  }

  .charts-card--actions {
    position: relative;
    overflow: hidden;
  }

  .charts-actions {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-actions--locked {
    border-left: 4px solid #1d4ed8;
  }

  .charts-actions__header h2 {
    margin: var(--charts-space-2xs) 0 var(--charts-space-2xs);
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
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .charts-actions__pill {
    font-size: 0.85rem;
  }

  .charts-actions__controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--charts-space-sm);
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

  .charts-actions__button--danger {
    background: #fef2f2;
    border-color: rgba(239, 68, 68, 0.45);
    color: #991b1b;
  }

  .charts-actions__button--unlock {
    background: #ecfdf5;
    border-color: rgba(16, 185, 129, 0.45);
    color: #065f46;
  }

  .charts-actions__skeleton {
    background: #f8fafc;
    border: 1px dashed rgba(148, 163, 184, 0.6);
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-md);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
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
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm) var(--charts-space-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--charts-space-sm);
  }

  .charts-actions__toast p {
    margin: var(--charts-space-2xs) 0 0;
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
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-md);
    color: #92400e;
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .charts-actions__conflict-title {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--charts-space-md);
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
    gap: var(--charts-space-sm);
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
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-xs) var(--charts-space-sm);
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
    gap: var(--charts-space-sm);
  }

  .auth-service-controls__description {
    margin: 0;
    color: #475569;
    line-height: 1.5;
  }

  .auth-service-controls__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--charts-space-sm);
  }

  .auth-service-controls__toggle {
    padding: var(--charts-space-sm);
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(37, 99, 235, 0.35);
    background: #eff6ff;
    color: #0f172a;
    font-weight: 700;
    cursor: pointer;
  }

  .auth-service-controls__select {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
    font-size: 0.9rem;
    color: #475569;
  }

  .auth-service-controls__select input,
  .auth-service-controls__select select {
    border-radius: var(--charts-radius-sm);
    border: 1px solid #cbd5f5;
    padding: var(--charts-space-sm) var(--charts-space-md);
    font-family: inherit;
  }

  .soap-note {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-md);
  }

  .soap-note__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--charts-space-md);
    flex-wrap: wrap;
  }

  .soap-note__header h2 {
    margin: 0;
    font-size: 1.2rem;
    color: #0f172a;
  }

  .soap-note__subtitle {
    margin: var(--charts-space-xs) 0 0;
    color: #475569;
    font-size: 0.9rem;
  }

  .soap-note__actions {
    display: flex;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
  }

  .soap-note__primary,
  .soap-note__ghost {
    border-radius: 999px;
    border: 1px solid rgba(59, 130, 246, 0.35);
    padding: var(--charts-space-xs) var(--charts-space-md);
    font-weight: 700;
    cursor: pointer;
  }

  .soap-note__primary {
    background: #1d4ed8;
    color: #ffffff;
    border-color: transparent;
  }

  .soap-note__ghost {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .soap-note__primary:disabled,
  .soap-note__ghost:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .soap-note__guard {
    margin: 0;
    color: #b45309;
    font-size: 0.9rem;
  }

  .soap-note__feedback {
    margin: 0;
    color: #2563eb;
    font-size: 0.9rem;
  }

  .soap-note__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--charts-space-md);
  }

  .soap-note__section {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
    padding: var(--charts-space-md);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
    box-shadow: var(--charts-shadow-none);
  }

  .soap-note__section-header {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
  }

  .soap-note__section-header strong {
    color: #0f172a;
  }

  .soap-note__section-header span {
    color: #64748b;
    font-size: 0.85rem;
  }

  .soap-note__section textarea {
    border-radius: var(--charts-radius-sm);
    border: 1px solid #cbd5f5;
    padding: var(--charts-space-sm) var(--charts-space-sm);
    font-family: inherit;
    resize: vertical;
    background: #ffffff;
  }

  .soap-note__section-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-sm);
    align-items: center;
  }

  .soap-note__section-actions label {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
    font-size: 0.85rem;
    color: #475569;
  }

  .soap-note__section-actions select {
    border-radius: var(--charts-radius-sm);
    border: 1px solid #cbd5f5;
    padding: var(--charts-space-xs) var(--charts-space-xs);
    font-family: inherit;
  }

  .soap-note__template-tag {
    font-size: 0.8rem;
    color: #1d4ed8;
    background: #e0e7ff;
    border-radius: 999px;
    padding: var(--charts-space-2xs) var(--charts-space-xs);
  }

  .document-timeline {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-md);
  }

  .document-timeline__header {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .document-timeline__header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #0f172a;
  }

  .document-timeline__meta-bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-xs);
    padding: var(--charts-space-xs) var(--charts-space-sm);
    border-radius: var(--charts-radius-sm);
    background: #0f172a;
    color: #f8fafc;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .document-timeline__meta-bar span {
    padding: var(--charts-space-2xs) var(--charts-space-xs);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
  }

  .document-timeline__content {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.9fr);
    gap: var(--charts-space-md);
    align-items: start;
  }

  .document-timeline__timeline {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .document-timeline__section-logs {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
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
    gap: var(--charts-space-sm);
  }

  .document-timeline__section-log {
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm);
    background: #ffffff;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
  }

  .document-timeline__section-log header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--charts-space-xs);
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

  .document-timeline__soap-history {
    margin-top: var(--charts-space-sm);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .document-timeline__soap-history-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
  }

  .document-timeline__soap-history-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #0f172a;
  }

  .document-timeline__soap-history-header span {
    color: #64748b;
    font-size: 0.85rem;
  }

  .document-timeline__soap-empty {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
  }

  .document-timeline__soap-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .document-timeline__soap-entry {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #ffffff;
    padding: var(--charts-space-sm);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
  }

  .document-timeline__soap-entry header {
    display: flex;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
    align-items: baseline;
  }

  .document-timeline__soap-action {
    font-size: 0.85rem;
    font-weight: 700;
    color: #1d4ed8;
  }

  .document-timeline__soap-time {
    font-size: 0.85rem;
    color: #475569;
  }

  .document-timeline__soap-entry p {
    margin: 0;
    color: #0f172a;
    font-size: 0.9rem;
    white-space: pre-wrap;
  }

  .document-timeline__soap-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-sm);
    font-size: 0.85rem;
    color: #64748b;
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
    gap: var(--charts-space-sm);
    align-items: center;
  }

  .document-timeline__control-group {
    display: inline-flex;
    gap: var(--charts-space-xs);
    align-items: center;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-xs) var(--charts-space-sm);
  }

  .document-timeline__pager {
    border: 1px solid rgba(59, 130, 246, 0.35);
    background: #fff;
    color: #1d4ed8;
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-2xs) var(--charts-space-sm);
    cursor: pointer;
  }

  .document-timeline__pager:hover {
    background: #eff6ff;
  }

  .document-timeline__window-meta {
    color: #334155;
    font-size: 0.9rem;
    margin-left: var(--charts-space-xs);
  }

  .document-timeline__control-group input[type="number"] {
    width: 76px;
    border: 1px solid #cbd5f5;
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-2xs) var(--charts-space-xs);
  }

  .document-timeline__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--charts-space-sm);
    font-size: 0.9rem;
    color: #475569;
  }

  .document-timeline__list {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .document-timeline__section {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
    border: 1px solid #e2e8f0;
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm);
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
    gap: var(--charts-space-2xs);
  }

  .document-timeline__section-badge {
    padding: var(--charts-space-2xs) var(--charts-space-sm);
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
    padding-top: var(--charts-space-sm);
  }

  .document-timeline__entry {
    background: #f8fafc;
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm) var(--charts-space-md);
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .document-timeline__entry--warning {
    border-color: #f59e0b;
    box-shadow: var(--charts-shadow-none);
    background: #fffbeb;
  }

  .document-timeline__entry--selected {
    border-color: #2563eb;
  }

  .document-timeline__entry header {
    display: flex;
    align-items: center;
    gap: var(--charts-space-xs);
    margin-bottom: var(--charts-space-xs);
  }

  .document-timeline__entry-title {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
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
    padding: var(--charts-space-2xs) var(--charts-space-xs);
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
    gap: var(--charts-space-xs);
    margin: var(--charts-space-2xs) 0;
  }

  .document-timeline__step {
    padding: var(--charts-space-xs) var(--charts-space-sm);
    border-radius: var(--charts-radius-sm);
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
    margin: var(--charts-space-2xs) 0;
    color: #0f172a;
  }

  .document-timeline__actions {
    display: flex;
    gap: var(--charts-space-xs);
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
    margin: 0 0 var(--charts-space-xs);
    color: #334155;
    line-height: 1.5;
  }

  .document-timeline__next-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-xs);
    margin-top: var(--charts-space-2xs);
  }

  .document-timeline__cta {
    border: 1px solid #2563eb;
    background: #2563eb;
    color: #ffffff;
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-xs) var(--charts-space-sm);
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
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm) var(--charts-space-md);
    border: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    gap: var(--charts-space-sm);
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
    gap: var(--charts-space-xs);
  }

  .document-timeline__queue-phase {
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-xs);
    align-items: center;
  }

  .document-timeline__queue-label {
    font-weight: 700;
    color: #0f172a;
  }

  .document-timeline__pill {
    display: inline-flex;
    align-items: center;
    gap: var(--charts-space-2xs);
    padding: var(--charts-space-2xs) var(--charts-space-xs);
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
    gap: var(--charts-space-xs);
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
    gap: var(--charts-space-sm);
  }

  .document-timeline__skeleton-row {
    height: 72px;
    border-radius: var(--charts-radius-sm);
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
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm) var(--charts-space-md);
    background: #fff7ed;
    border: 1px solid #fdba74;
    color: #7c2d12;
  }

  .document-timeline__retry-button {
    margin-top: var(--charts-space-xs);
    background: #2563eb;
    border: 1px solid #2563eb;
    color: #fff;
    padding: var(--charts-space-xs) var(--charts-space-md);
    border-radius: var(--charts-radius-sm);
    cursor: pointer;
  }

  .document-timeline__insights {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .document-timeline__transition {
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm);
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
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-sm);
    background: #fef9c3;
    border: 1px solid #f59e0b;
    color: #92400e;
  }

  .document-timeline__audit-text {
    margin: var(--charts-space-2xs) 0 0;
    line-height: 1.5;
  }

  .document-timeline__queue {
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-md);
    background: #f0f9ff;
    border: 1px solid rgba(59, 130, 246, 0.25);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
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
    gap: var(--charts-space-sm);
  }

  .document-timeline__queue-meta {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
  }

  .orca-summary {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .orca-summary__details {
    display: grid;
    grid-template-columns: minmax(220px, 0.9fr) minmax(220px, 1fr);
    gap: var(--charts-space-sm);
  }

  .orca-summary__meta {
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-md);
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
  }

  .orca-summary__badges {
    display: flex;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
  }

  .medical-record {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .medical-record__header {
    display: flex;
    justify-content: space-between;
    gap: var(--charts-space-sm);
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .medical-record__title {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
  }

  .medical-record__meta {
    color: #475569;
    font-size: 0.9rem;
  }

  .medical-record__badges {
    display: flex;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .medical-record__empty {
    margin: 0;
    padding: var(--charts-space-md);
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
    color: #475569;
  }

  .medical-record__sections {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .medical-record__section {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #ffffff;
    overflow: hidden;
  }

  .medical-record__section-summary {
    padding: var(--charts-space-sm) var(--charts-space-md);
    display: flex;
    justify-content: space-between;
    gap: var(--charts-space-sm);
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
    padding: var(--charts-space-md);
    color: #475569;
  }

  .medical-record__section-list {
    margin: 0;
    padding: var(--charts-space-md);
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
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
    gap: var(--charts-space-md);
  }

  .patients-tab__important {
    display: flex;
    gap: var(--charts-space-sm);
    align-items: stretch;
    justify-content: space-between;
    padding: var(--charts-space-sm) var(--charts-space-md);
    border-radius: var(--charts-radius-md);
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
    gap: var(--charts-space-2xs);
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
    gap: var(--charts-space-sm);
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
    gap: var(--charts-space-md);
    flex-wrap: wrap;
    align-items: center;
  }

  .patients-tab__search {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
    font-size: 0.9rem;
    color: #475569;
  }

  .patients-tab__search input {
    border-radius: var(--charts-radius-sm);
    border: 1px solid #cbd5f5;
    padding: var(--charts-space-sm) var(--charts-space-md);
    min-width: 240px;
  }

  .patients-tab__edit-guard {
    padding: var(--charts-space-xs) var(--charts-space-sm);
    background: #f0f9ff;
    border: 1px solid rgba(59, 130, 246, 0.25);
    border-radius: var(--charts-radius-sm);
    color: #0f172a;
  }

  .patients-tab__header {
    display: flex;
    justify-content: space-between;
    gap: var(--charts-space-md);
    align-items: flex-start;
  }

  .patients-tab__badges {
    display: flex;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
    align-items: center;
  }

  .patients-tab__badge {
    font-size: 0.85rem;
  }

  .patients-tab__table {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .patients-tab__body {
    display: grid;
    grid-template-columns: minmax(240px, 0.9fr) minmax(260px, 1fr);
    gap: var(--charts-space-md);
  }

  .patients-tab__row {
    padding: var(--charts-space-md);
    border-radius: var(--charts-radius-sm);
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
    text-align: left;
    width: 100%;
    cursor: pointer;
  }

  .patients-tab__row--selected {
    border-color: #1d4ed8;
    box-shadow: var(--charts-shadow-none);
  }

  .patients-tab__row:focus-visible {
    outline: 2px solid #1d4ed8;
    outline-offset: 2px;
  }

  .patients-tab__row-meta {
    display: flex;
    justify-content: space-between;
    gap: var(--charts-space-sm);
    align-items: center;
  }

  .patients-tab__row-id {
    font-size: 0.82rem;
    color: #475569;
  }

  .patients-tab__row-id .patient-meta-row__line {
    gap: 0.2rem 0.45rem;
  }

  .patients-tab__row-id .patient-meta-row__value {
    font-weight: 700;
    color: #0f172a;
  }

  .patients-tab__row-detail {
    margin: var(--charts-space-xs) 0 var(--charts-space-2xs);
    color: #475569;
  }

  .patients-tab__row-status {
    font-size: 0.9rem;
    color: #1d4ed8;
  }

  .patients-tab__detail {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .patients-tab__card {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
    padding: var(--charts-space-sm);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
    box-shadow: var(--charts-shadow-none);
  }

  .patients-tab__card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
  }

  .patients-tab__card-header h3 {
    margin: 0;
    font-size: 1.05rem;
    color: #0f172a;
  }

  .patients-tab__card-actions {
    display: flex;
    gap: var(--charts-space-xs);
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .patients-tab__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--charts-space-xs) var(--charts-space-sm);
  }

  .patients-tab__kv {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
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
    gap: var(--charts-space-xs);
  }

  .patients-tab__memo-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
  }

  .patients-tab__memo-header h4 {
    margin: 0;
    font-size: 0.95rem;
    color: #0f172a;
  }

  .patients-tab__memo-actions {
    display: flex;
    gap: var(--charts-space-xs);
    flex-wrap: wrap;
  }

  .patients-tab__memo textarea {
    border-radius: var(--charts-radius-sm);
    border: 1px solid #cbd5f5;
    padding: var(--charts-space-sm) var(--charts-space-sm);
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
    gap: var(--charts-space-xs);
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
    gap: var(--charts-space-sm);
    align-items: end;
  }

  .patients-tab__history-filters label {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
    color: #475569;
    font-size: 0.9rem;
  }

  .patients-tab__history-filters input {
    border-radius: var(--charts-radius-sm);
    border: 1px solid #cbd5f5;
    padding: var(--charts-space-sm) var(--charts-space-sm);
    font-family: inherit;
  }

  .patients-tab__history {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
  }

  .patients-tab__history-row {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #ffffff;
    padding: var(--charts-space-sm);
    text-align: left;
    cursor: pointer;
  }

  .patients-tab__history-row.is-active {
    border-color: #1d4ed8;
    box-shadow: var(--charts-shadow-none);
  }

  .patients-tab__history-main {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--charts-space-sm);
  }

  .patients-tab__history-badge {
    background: #eef2ff;
    border: 1px solid rgba(37, 99, 235, 0.25);
    border-radius: 999px;
    padding: var(--charts-space-2xs) var(--charts-space-xs);
    font-size: 0.85rem;
    font-weight: 800;
    color: #1d4ed8;
    white-space: nowrap;
  }

  .patients-tab__history-sub {
    margin-top: var(--charts-space-2xs);
    display: flex;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
    color: #475569;
    font-size: 0.9rem;
  }

  .patients-tab__diff {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
  }

  .patients-tab__diff-head {
    display: grid;
    grid-template-columns: 0.9fr 1fr 1.2fr;
    gap: var(--charts-space-sm);
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 800;
    padding-bottom: var(--charts-space-2xs);
    border-bottom: 1px dashed rgba(148, 163, 184, 0.6);
  }

  .patients-tab__diff-row {
    display: grid;
    grid-template-columns: 0.9fr 1fr 1.2fr;
    gap: var(--charts-space-sm);
    border-radius: var(--charts-radius-sm);
    padding: var(--charts-space-xs) var(--charts-space-sm);
    background: #ffffff;
    border: 1px solid rgba(148, 163, 184, 0.25);
    align-items: start;
  }

  .patients-tab__diff-row.is-changed {
    border-color: rgba(245, 158, 11, 0.55);
    background: #fffbeb;
  }

  .patients-tab__diff-row.is-highlighted {
    box-shadow: var(--charts-shadow-none);
    outline: 2px solid rgba(29, 78, 216, 0.35);
    outline-offset: 0;
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
    margin-top: var(--charts-space-2xs);
    padding: var(--charts-space-sm);
    border-radius: var(--charts-radius-sm);
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
    border-radius: var(--charts-radius-lg);
    border: 1px solid rgba(148, 163, 184, 0.35);
    box-shadow: var(--charts-shadow-2);
    padding: var(--charts-space-md);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .patients-tab__modal-header {
    display: flex;
    justify-content: space-between;
    gap: var(--charts-space-sm);
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
    gap: var(--charts-space-sm);
  }

  .patients-tab__modal-row {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #f8fafc;
    padding: var(--charts-space-sm) var(--charts-space-md);
    text-align: left;
    cursor: pointer;
  }

  .patients-tab__modal-row-main {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--charts-space-sm);
  }

  .patients-tab__modal-pill {
    border-radius: 999px;
    background: #eef2ff;
    border: 1px solid rgba(37, 99, 235, 0.25);
    color: #1d4ed8;
    padding: var(--charts-space-2xs) var(--charts-space-sm);
    font-weight: 800;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .patients-tab__modal-row-sub {
    margin-top: var(--charts-space-2xs);
    color: #475569;
    font-size: 0.88rem;
    display: flex;
    flex-wrap: wrap;
    gap: var(--charts-space-sm);
  }

  .patients-tab__modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
  }

  .patient-form__alert {
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(239, 68, 68, 0.35);
    background: #fef2f2;
    padding: var(--charts-space-sm) var(--charts-space-md);
    color: #991b1b;
  }

  .patient-form__alert-title {
    margin: 0;
    font-weight: 900;
    color: #7f1d1d;
  }

  .patient-form__alert-list {
    margin: var(--charts-space-xs) 0 0;
    padding-left: var(--charts-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
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
    border-radius: var(--charts-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.4);
    background: #f8fafc;
    padding: var(--charts-space-sm) var(--charts-space-md);
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
    margin: var(--charts-space-xs) 0 0;
    color: #475569;
  }

  .patient-edit__meta {
    display: flex;
    gap: var(--charts-space-sm);
    flex-wrap: wrap;
    color: #64748b;
    font-size: 0.85rem;
  }

  .patient-edit__form {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .patient-edit__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--charts-space-sm) var(--charts-space-sm);
  }

  .patient-edit__field {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-2xs);
    color: #475569;
    font-size: 0.9rem;
  }

  .patient-edit__field--wide {
    grid-column: 1 / -1;
  }

  .patient-edit__field input,
  .patient-edit__field select {
    border-radius: var(--charts-radius-sm);
    border: 1px solid #cbd5f5;
    padding: var(--charts-space-sm) var(--charts-space-sm);
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
    gap: var(--charts-space-sm);
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
    gap: var(--charts-space-xs);
  }

  .patient-edit__diff-header {
    display: grid;
    grid-template-columns: 0.8fr 1fr 1fr;
    gap: var(--charts-space-sm);
    color: #64748b;
    font-weight: 900;
    font-size: 0.85rem;
    padding-bottom: var(--charts-space-2xs);
    border-bottom: 1px dashed rgba(148, 163, 184, 0.6);
  }

  .patient-edit__diff-row {
    display: grid;
    grid-template-columns: 0.8fr 1fr 1fr;
    gap: var(--charts-space-sm);
    padding: var(--charts-space-xs) var(--charts-space-sm);
    border-radius: var(--charts-radius-sm);
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
    gap: var(--charts-space-sm);
    align-items: center;
    color: #0f172a;
    font-weight: 800;
  }

  .patient-edit__blocked {
    padding: var(--charts-space-md);
    border-radius: var(--charts-radius-md);
    background: #fef2f2;
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #991b1b;
  }

  .patient-edit__blocked p {
    margin: var(--charts-space-xs) 0;
  }

  .telemetry-panel {
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-sm);
  }

  .telemetry-panel__meta {
    margin: 0;
    color: #475569;
  }

  .telemetry-panel__list {
    margin: 0;
    padding-left: var(--charts-space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--charts-space-xs);
    color: #0f172a;
  }

  @media (max-width: 1280px) {
    .charts-workbench__layout {
      grid-template-columns: 1fr;
    }

    .charts-workbench__body {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .charts-workbench__column--right {
      grid-column: 1 / -1;
    }

    .charts-workbench__side {
      position: static;
    }
  }

  @media (max-width: 1023px) {
    .charts-workbench {
      --charts-utility-width: 0px;
      --charts-utility-height: clamp(280px, 40vh, 420px);
      --charts-side-width: 100%;
    }

    .charts-workbench__layout {
      grid-template-columns: 1fr;
    }

    .charts-workbench__body {
      grid-template-columns: 1fr;
    }

    .charts-workbench[data-utility-state='expanded'] .charts-workbench__body {
      padding-bottom: var(--charts-utility-height);
    }

    .charts-workbench__sticky,
    .document-timeline__content,
    .orca-summary__details,
    .charts-page__grid {
      grid-template-columns: 1fr;
    }

    .charts-workbench__side {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      top: auto;
      width: 100%;
    }

    .charts-docked-panel {
      border-radius: var(--charts-radius-lg) var(--charts-radius-lg) 0 0;
    }

    .charts-workbench[data-utility-state='expanded'] .charts-docked-panel {
      height: var(--charts-utility-height);
    }

    .charts-docked-panel__tabs {
      flex-direction: row;
      flex-wrap: nowrap;
      overflow-x: auto;
    }

    .charts-docked-panel__tab {
      flex: 0 0 auto;
      min-width: 72px;
    }

    .charts-docked-panel__drawer {
      flex: 1;
      max-height: none;
    }
  }

  @media (max-width: 920px) {
    .charts-workbench__sticky,
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

    .patients-tab__grid {
      grid-template-columns: 1fr;
    }

    .patients-tab__history-filters {
      grid-template-columns: 1fr;
    }
  }
`;
