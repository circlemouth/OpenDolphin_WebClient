# DEBUG-001 Parity Notes

RUN_ID: 20260207T044334Z-cmd_20260207_03_sub_10-debug-001

## Conclusion

- Parity ID: `DEBUG-001`
- Status: `仕様差`

Legacy (Swing/on-prem) does not provide a dedicated "Legacy REST compatibility console" as an operator-facing feature.
The Web client intentionally provides **additional diagnostic tooling** for system_admin to probe legacy REST endpoints (2xx/4xx/5xx) while tagging audit/observability metadata (`legacy=true`).

This is not a clinical workflow requirement and should remain debug/admin scoped.

## Legacy Side (what exists)

- Legacy client uses REST endpoints via Delegater classes and operational settings, but there is no single UI that acts as a generic REST console.
  - (Indirect evidence) legacy inventory focuses on clinical/admin plugins and background services, not a debug console.
  - Related legacy concepts:
    - Project settings / connection settings: `client/src/main/java/open/dolphin/project/ProjectSettingDialog.java`

## Web Side (what exists)

Two entry points exist:

1. Debug page (not in normal navigation)
- `/debug/legacy-rest` console
- Implementation: `web-client/src/features/debug/LegacyRestConsolePage.tsx`
- API helper: `web-client/src/features/debug/legacyRestApi.ts`
- Guard: system_admin + `VITE_ENABLE_DEBUG_PAGES=1`

2. Administration page (normal admin route)
- "Legacy REST 互換 API（通常導線）" panel
- Implementation: `web-client/src/features/administration/LegacyRestPanel.tsx`
- Writes audit tags: `source=legacy-rest`, `payload.legacy=true`, `screen=administration/legacy-rest`

## Supporting Docs

- `docs/web-client-unused-features.md` section "D. Legacy REST" documents both debug console and administration panel.

## Impact / Policy

- Impact: P2 (operator diagnostics). Helps migration/QA; not required for core Reception/Charts flows.
- Policy: keep it system_admin gated. Debug route should remain off by default.

