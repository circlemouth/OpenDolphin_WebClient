RUN_ID=20260207T124724Z-cmd_20260207_13_sub_6-charts-ui-opt-b-regression1
QA_LABEL=flag-off
baseURL=http://127.0.0.1:5178
facilityId=1.3.6.1.4.1.9414.72.103
patientId=01415
visitDate=2026-02-07

目的:
- Charts UI opt B の flag OFF/ON で、最小UI回帰（入力/保存/送信/印刷/文書/パネル）を実測し証跡化する。

実施内容（最小）:
- Charts 画面表示（msw=1）
- Topbar 開閉
- Utility panel: document を開く→閉じる（右パネルの開閉）
- SOAP Subjective 入力
- ドラフト保存（結果は banner/toast を目視）
- ORCA送信ダイアログの開閉（blocked の場合は banner 証跡）
- 印刷/帳票ダイアログの開閉 + outpatient preview の best-effort

スクリーンショット:
- screenshots/*.png（1366x768 / 1440x900）

エラー:
- 1366x768:print-dialog: TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('#charts-action-print')[22m
[2m    - locator resolved to <button disabled type="button" aria-disabled="true" id="charts-action-print" aria-keyshortcuts="Alt+I" class="charts-actions__button" data-disabled-reason="patient_not_selected" aria-describedby="charts-actions-print-guard">印刷/エクスポート</button>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not enabled[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not enabled[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    58 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not enabled[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

- 1440x900:print-dialog: TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('#charts-action-print')[22m
[2m    - locator resolved to <button disabled type="button" aria-disabled="true" id="charts-action-print" aria-keyshortcuts="Alt+I" class="charts-actions__button" data-disabled-reason="patient_not_selected" aria-describedby="charts-actions-print-guard">印刷/エクスポート</button>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not enabled[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not enabled[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    58 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not enabled[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

