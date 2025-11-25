# DTO 差分アーカイブ

Common DTO の Legacy vs Jakarta 差分 CSV を保存する。各 CSV ファイルは以下のカラムを持つ想定。

| Column | 説明 |
| --- | --- |
| `ClassName` | DTO クラス名（例: `AppointmentModel`）。 |
| `LegacyDelta` | Legacy 側との差分概要。 |
| `JakartaDelta` | Jakarta 移行で追加・削除された要素。 |
| `Notes` | 互換性メモ。 |

CSV を作成したら `docs/web-client/planning/phase2/DOC_STATUS.md` の該当行（Archive予定）を「Archive 完了」に更新し、元 Markdown にはスタブを残す。
