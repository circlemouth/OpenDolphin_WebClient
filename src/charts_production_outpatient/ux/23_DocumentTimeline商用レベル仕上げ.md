# 23_DocumentTimeline 商用レベル仕上げ（RUN_ID=`20251217T150614Z`）

## ゴール
- 受付→診療→ORCA キューの状態遷移をタイムライン上で迷わず追えるようにし、失敗/再試行/保留を明示する。
- missingMaster=true 行を強調し、次にやることを即時提示する。送信不可の理由を一目で理解させる。
- 大量データ（>200件）でも破綻しない仮想化・折りたたみ・段階ロードを導入する。

## 実装サマリ
- **ORCA キュー段階表示**: 受付→診療→ORCA キューの 3 ステップを行内ステップバーで可視化。queuePhase を `ok / retrying / pending / holding / error` に正規化。
- **missingMaster/失敗強調**: missingMaster=true または選択患者を行ハイライト。ToneBanner nextAction を missingMaster 時「マスタ再取得」、失敗時「請求再取得」に分岐。
- **次にやることガイド**: 行末に「次にやること」を表示し、状態×キュー段階で具体的文言を返す。
- **仮想化＆折りたたみ**: 32 件ウィンドウをデフォルトに slice し、前後/先頭/選択へジャンプ。ステータスごとに折りたたみ可能。ウィンドウサイズを入力で変更可。
- **メタ表示**: 表示件数/総件数をセクションヘッダーとコントロールに併記。missingMaster の badge と queuePhase badge を追加。

## UI/ARIA ポイント
- aria-live は tone が info 以外で assertive、ステップバーは `aria-label="受付からORCAまでの進捗"` を付与。
- セクション折りたたみボタンに `aria-expanded` を付与。仮想化コントロールはフォームラベル付き。

## データ/監査連携
- runId/cacheHit/missingMaster/dataSourceTransition/fallbackUsed を行・バナーに転写し、StatusBadge と queue meta に同じ値を表示。
- queuePhase 判定に isClaimLoading / claimError / fallbackUsed / cacheHit を使用し、再取得ボタンは既存 onRetryClaim を流用。

## 残課題
- ORCA キュー API の段階ロード（cursor/pagination）が入った場合、仮想ウィンドウ開始位置を API 返却 offset に合わせる改修を別チケットで行う。

## 証跡
- 変更コミット（本ワークツリー）。
- ログ: `docs/web-client/planning/phase2/logs/20251217T150614Z-document-timeline.md`。
