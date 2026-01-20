# オーダー/文書セット最短操作チェック（RUN_ID=20260120T103242Z）

## 対象と方法
- 対象: Charts 右ペインのオーダー編集パネル（`OrderBundleEditPanel`）と文書作成パネル（`DocumentCreatePanel`）。
- 方法: コードリーディングと既存テスト実行（`npm test -- --run src/features/charts/__tests__/orderBundleStampFlow.test.tsx src/features/charts/__tests__/documentCreatePanel.test.tsx`）。

## 既存の最短動線（確認できた実装）
- オーダーセット（スタンプ）
  - ローカル保存/コピー/ペースト、サーバースタンプ取り込み、履歴コピーを提供。保存・展開は `/orca/order/bundles` POST で一括送信。UI は「展開」「展開継続」「保存して追加」の3ボタンで最短2クリック（スタンプ選択→展開）。
  - マスタ検索（薬剤/用法/材料/部位/コメントコード）と禁忌チェックをフォーム内で完結。検証テストは全て通過済み。
- 文書テンプレ
  - 紹介状/診断書/返信書の固定テンプレを選択し、必須入力を満たせば保存→プレビュー/印刷/PDF 出力が可能。保存済み文書はフィルタ・検索・再出力導線あり。

## 回収が必要な問題（セット登録/展開を阻害）
1. **サーバースタンプ取得が常に失敗する実装バグ**
   - `OrderBundleEditPanel` 内の `userName` が `storedAuth ? ":" : null` となっており、施設ID/ユーザーIDが一切結合されない（`web-client/src/features/charts/OrderBundleEditPanel.tsx:578`）。
   - そのため `fetchUserProfile(userName)` が `/user/:` を叩いて 404 となり、`userPk` 不在で `/touch/stampTree/{userPk}` が無効化される。結果として **サーバー配布スタンプを取り込めず、セット展開の最短経路（スタンプ選択→展開）が封鎖** されている。
   - ローカル保存も `web-client:order-stamps::` という固定キーに集約され、施設/ユーザーを跨いで共有されるためデータ汚染リスクと運用上の混乱を招く。
2. **文書セットを再利用できない（保存＝履歴のみ）**
   - `DocumentCreatePanel` の保存先は `sessionStorage('opendolphin:web-client:charts:document-history')` のみで、履歴からフォームへ再適用する導線が無い。医師は毎回テンプレ選択と全入力をやり直す必要があり、セット登録・展開の最短経路を提供できていない。
3. **文書テンプレが固定＆セッション限定**
   - テンプレートはハードコーディング（`documentTemplates.ts`）で、施設別のカスタムセット登録・配布が不可。セッションを跨ぐと履歴が消えるため、再来患者や別端末での迅速展開ができない。
4. **文書履歴が患者非限定**
   - 履歴フィルタに `patientId` が含まれず、他患者の文書が一覧に混在する。再出力対象を探す工数が増え、誤出力リスクもある。

## 修正提案（優先順）
1. **P0: userName 結合バグ修正**
   - `userName` を `${facilityId}:${userId}` で組み立て、`fetchUserProfile` / ローカルスタンプキー / 監査に同一値を渡すテストを追加。
   - スタンプツリー未取得時は「サーバースタンプ未取得（認証/接続要確認）」のバナーを出し、ローカルのみで進める場合の文言も提示。
2. **P1: 文書セットの再利用導線**
   - 履歴行に「コピーして編集」ボタンを追加し、選択した文書内容をフォームへ再適用（発行日とタイトルのみ初期化）。
   - 保存先を `localStorage` + `facilityId:userId` スコープへ昇格し、セッションを跨いでも同ユーザーは再利用可にする。
3. **P1: 文書テンプレ/セットのサーバー連携計画**
   - server-modernized のテンプレ API（未実装）前提で、取得→キャッシュ→上書き保存/新規登録の REST を設計。暫定として `DocumentTemplateApiResponse` スキーマを UI へ接続可能な形に差し替え。
4. **P2: 文書履歴の患者フィルタ**
   - `savedDocs` 保存時に patientId を必須化し、一覧表示は「選択中患者のみ」をデフォルトにするトグルを追加。

## 検証ログ
- 実行テスト: `npm test -- --run src/features/charts/__tests__/orderBundleStampFlow.test.tsx src/features/charts/__tests__/documentCreatePanel.test.tsx`（いずれも PASS）。
- 本チェックの RUN_ID: **20260120T103242Z**。

## 影響範囲
- スタンプ系: サーバースタンプ取り込み不可により、セット展開の主経路が現状使えない。修正後はユーザー毎のスタンプキーローテーションが発生するため、既存ローカルデータの移行処理（`: → facility:user`）を検討する。
- 文書系: セット再利用・共有性を欠くため、複数患者・複数端末の診療効率が落ちる。保存先変更はデータ互換性の告知が必要。
