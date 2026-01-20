# オーダー入力と ORCA マスタ連携の再検証（RUN_ID=20260120T091852Z）

## 目的
各オーダー項目が **ORCA サーバーから取得した薬剤名・処置名等のマスタ情報を基に入力できているか** を現行実装で確認し、不備があれば洗い出す。実環境への送信は行っていない（コードリーディングと既存フロー確認のみ）。

## 対象コード
- オーダー編集 UI: `web-client/src/features/charts/OrderBundleEditPanel.tsx`
- マスタ検索: `web-client/src/features/charts/orderMasterSearchApi.ts`
- オーダー送信: `web-client/src/features/charts/orderBundleApi.ts`

## 再検証結果
| 項目 | 実装状況 | 根拠 |
| --- | --- | --- |
| 薬剤検索（一般名/コード） | OK: `/orca/master/generic-class` で検索し、コード検索時は `medicationgetv2` で補正候補を提示。選択時に `code` と `name` をアイテムへ挿入。 | `OrderBundleEditPanel.tsx` L703-748, L2712-2755; `orderMasterSearchApi.ts` L200-260 |
| 用法検索 | OK: `/orca/master/youhou` から取得し、選択時に管理欄へコード+名称をセット。 | 同上 L715-737 / L2684-2748 |
| 材料検索 | OK: `material` 種別で `/orca/master/material` を検索。該当エンティティ（general/treatment/test/instraction）で利用可。 | `supportsMaterials` L540、クエリ L728-734 |
| 点数・検査区分 | OK: `/orca/master/kensa-sort`・`/orca/tensu/etensu` 検索を提供。選択でコード/名称を挿入。 | `masterSearchType` select とテーブル描画 L2580-2760 |
| 部位コード（radiology/general 用） | **NG（ブロッカー）**: 部位検索クエリ `bodyPartSearchQuery` が `enabled: false` のまま固定で、入力しても `/orca/tensu/etensu?category=2` に到達しない。結果、部位コードを ORCA マスタから取得できず手入力依存となり、ORCA名称に基づく正確な登録が担保されていない。 | `OrderBundleEditPanel.tsx` L731-737, L2580-2620 |
| オーダー送信 payload | OK: 選択したマスタから `code`/`name` を items に保持し、そのまま `/orca/order/bundles` へ送信。 | `collectBundleItems` L1111-1120 → `mutateOrderBundles` L1047-1185 |

## 影響とリスク
- 部位コード未取得により、放射線・リハビリ系オーダーで ORCA マスタ名称／コードに依拠した入力が不可。マスタ齟齬や請求不整合のリスクが残存。
- それ以外の薬剤・用法・材料・点数検索は ORCA マスタ経由で動作し、選択結果が送信 payload へ反映されることを確認。

## 推奨修正（最小）
`OrderBundleEditPanel.tsx` の `bodyPartSearchQuery` を有効化し、部位検索入力時に実際の ORCA マスタへ問い合わせる。
```ts
const bodyPartSearchQuery = useQuery({
  queryKey: ['charts-order-bodypart-search', bodyPartKeyword],
  queryFn: () => fetchOrderMasterSearch({ type: 'bodypart', keyword: bodyPartKeyword }),
  enabled: supportsBodyPartSearch && bodyPartKeyword.trim().length > 0, // ←現在 false 固定
  staleTime: 30 * 1000,
});
```
加えて `supportsBodyPartSearch` が true のエンティティ（現状 radiology/general）で UI が動くことを手動/自動テストで確認する。

## フォローアップ候補
1. 上記修正後、ORCA Trial もしくは MSW スタブで部位コード取得→オーダー送信までの回帰テストを追加（Vitest or Playwright）。  
2. 注射オーダーで材料検索が必要か現場確認し、必要なら `supportsMaterials` に `injectionOrder` を追加。  
3. マスタ未取得を防ぐため、アイテム保存時に `code` 未入力を警告するガードを検討（現状フリーテキスト許容）。 

## 付記: 用法・投与量の入力/送信経路
- UI: 「用法」入力欄 + 用法マスタ検索（/orca/master/youhou）。選択時に `admin` に名称、`adminMemo` にコードをセット。`OrderBundleEditPanel.tsx` L2335-L2475, L703-L748。  
- 投与量: 明細行の `quantity` `unit` を入力し、マスタ選択時に名称+コードを保持。`collectBundleItems` でまとめて送信 payload へ含める。  
- バリデーション: medOrder では `requiresUsage=true` で用法未入力をブロック。`validateBundleForm` L438-L470。  
- 送信: `/orca/order/bundles` に POST（items + admin/adminMemo + classCode）。`orderBundleApi.ts`。  
- リスク: 投与量の単位コード・日数はフリーテキストで厳格チェックなし。必要ならサーバー側バリデーション/単位コードマスタ連携の強化を検討。
