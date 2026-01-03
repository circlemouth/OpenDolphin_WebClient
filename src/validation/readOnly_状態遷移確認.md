# readOnly 状態遷移確認

## 目的
sidePanelMeta の readOnly/missingMaster/fallback などの状態が UI と API で一致し、運用上の誤解がないことを確認する。

## 手順
- Patients/Charts で readOnly になる条件（missingMaster/fallback/dataSourceTransition）を再現
- 画面表示と監査イベントの内容を突合
- 反映停止/反映可能のステータス表示が運用と一致するか確認

## 成果物
- 状態遷移の確認表
- 不整合の一覧
