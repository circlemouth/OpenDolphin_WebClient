RUN_ID: 20260121T111246Z
Date: 2026-01-22
Test: npx playwright test tests/charts/e2e-orca-billing-status.spec.ts
Result: PASS
Notes:
- incomeinfv2 手動リフレッシュで Api_Result=00 バナー表示を確認。
- 送信済み伝票 INV-001 が会計済みへ更新されることを確認。
Screenshot: billing-status.png

## 追加検証 (2026-01-21)
RUN_ID: 20260121T122721Z

### Unit (vitest)
- Command: npx vitest web-client/src/features/charts/__tests__/orcaSummary.billing-status.test.ts --run
- Result: PASS (8 tests)

### E2E (Playwright)
- Command: npx playwright test tests/charts/e2e-orca-billing-status.spec.ts
- Result: PASS
- Queue: ORCAキュー 応答済 を確認
- Latency: billing_status_update.durationMs=5 (<=500ms)

Artifacts:
- billing-status-funnel.json
- billing-status-queue-ack.png
