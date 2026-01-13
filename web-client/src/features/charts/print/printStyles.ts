import { css } from '@emotion/react';

export const chartsPrintStyles = css`
  body[data-route='charts-print'] .app-shell__topbar,
  body[data-route='charts-print'] .app-shell__nav {
    display: none;
  }

  body[data-route='charts-print'] .app-shell__body {
    padding: 0;
  }

  .charts-print {
    min-height: 100vh;
    padding: 1.25rem;
    background: #0f172a;
    background: linear-gradient(180deg, #0b1220 0%, #111827 55%, #0b1220 100%);
    color: #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .charts-print__toolbar {
    width: min(900px, 100%);
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .charts-print__toolbar h1 {
    margin: 0;
    font-size: 1.15rem;
    letter-spacing: 0.02em;
    color: #f8fafc;
  }

  .charts-print__toolbar p {
    margin: 0.25rem 0 0;
    color: rgba(226, 232, 240, 0.85);
    line-height: 1.5;
    max-width: 52ch;
  }

  .charts-print__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .charts-print__button {
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.55);
    background: rgba(15, 23, 42, 0.65);
    padding: 0.55rem 0.85rem;
    color: #f8fafc;
    cursor: pointer;
    font-weight: 700;
    transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  }

  .charts-print__button:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 32px rgba(2, 6, 23, 0.4);
    background: rgba(30, 41, 59, 0.75);
  }

  .charts-print__button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .charts-print__button--primary {
    border-color: rgba(37, 99, 235, 0.6);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(79, 70, 229, 0.9));
  }

  .charts-print__button--ghost {
    background: transparent;
  }

  .charts-print__paper {
    width: min(210mm, 100%);
    background: #ffffff;
    color: #0f172a;
    border-radius: 12px;
    box-shadow: 0 28px 55px rgba(2, 6, 23, 0.55);
    border: 1px solid rgba(148, 163, 184, 0.35);
    overflow: hidden;
  }

  .charts-print__page {
    padding: 14mm 12mm;
    display: flex;
    flex-direction: column;
    gap: 10mm;
    min-height: 297mm;
  }

  .charts-print__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0.6rem;
  }

  .charts-print__title {
    margin: 0;
    font-size: 1.2rem;
    letter-spacing: 0.04em;
  }

  .charts-print__meta {
    text-align: right;
    font-size: 0.85rem;
    color: #334155;
    display: grid;
    gap: 0.15rem;
  }

  .charts-print__section {
    display: grid;
    gap: 0.35rem;
  }

  .charts-print__section h2 {
    margin: 0;
    font-size: 0.95rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #1d4ed8;
  }

  .charts-print__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.35rem 1rem;
    font-size: 0.95rem;
  }

  .charts-print__row {
    display: grid;
    grid-template-columns: 9rem 1fr;
    gap: 0.6rem;
  }

  .charts-print__key {
    color: #475569;
    font-weight: 700;
  }

  .charts-print__value {
    color: #0f172a;
  }

  .charts-print__footer {
    margin-top: auto;
    padding-top: 0.8rem;
    border-top: 1px solid #e2e8f0;
    font-size: 0.85rem;
    color: #475569;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .charts-print__screen-only {
    width: min(900px, 100%);
  }

  .charts-print__recovery {
    margin-top: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .charts-print__pdf-preview {
    width: min(1000px, 100%);
    background: #0f172a;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    overflow: hidden;
    box-shadow: 0 24px 45px rgba(2, 6, 23, 0.45);
  }

  .charts-print__pdf-preview iframe {
    width: 100%;
    height: 80vh;
    border: none;
    display: block;
    background: #0f172a;
  }

  @media print {
    body[data-route='charts-print'] {
      background: #ffffff;
    }

    body[data-route='charts-print'] .app-shell__body {
      padding: 0;
    }

    .charts-print {
      background: #ffffff;
      color: #0f172a;
      padding: 0;
      align-items: stretch;
    }

    .charts-print__toolbar,
    .charts-print__screen-only {
      display: none !important;
    }

    .charts-print__paper {
      width: auto;
      border-radius: 0;
      box-shadow: none;
      border: none;
    }

    .charts-print__page {
      padding: 0;
      min-height: auto;
    }

    @page {
      size: A4;
      margin: 14mm 12mm 14mm 12mm;
    }
  }
`;
