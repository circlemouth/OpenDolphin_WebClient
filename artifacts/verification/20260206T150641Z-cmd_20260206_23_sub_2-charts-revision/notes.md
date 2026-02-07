# notes
RUN_ID=20260206T150641Z-cmd_20260206_23_sub_2-charts-revision

根拠（現行コードの監査拡張余地）:
- `logAuditEvent` の payload/details は `Record<string, unknown>` で柔軟（新規フィールドを追加可能）。
  - 例: `payload.details.sourceRevisionId` / `payload.details.baseRevisionId` を追加しても型破壊しない。

既存のDo操作（operationPhase='do'）と整合:
- DocumentCreatePanel 等で `operationPhase: 'do'` が既に用いられているため、同じキーで revisionId を付与する設計が自然。

注意点:
- 差分ビューは Phase1 では「変更量/変更セクション」程度でも成立し、詳細diffは遅延ロード・後回しが可能。
- 競合は「禁止」より「安全に並存」を優先（別改訂として保存できる）に寄せると運用が止まりにくい。
