# cmd_20260206_15_sub_18 - Material master items>0 root-cause notes

## Summary
- `/orca/master/material` が常に `200` / `[]` になる主因は、ORCA DB（schema=`master`）の材料マスタ系テーブル `tbl_material_*` が **全て0件**であること。
- 参考として `tbl_generic_*` / `tbl_youhou` / `tbl_kensasort` は非0件であり、DB接続/権限の問題ではなく「材料マスタだけ未投入」と判断できる。

## Additional finding (query shape)
- 現状の `server-modernized` 実装は `master.tbl_material_h_m` を単表参照し、名称は `snamecd`（数値コード）を `materialName` に載せている。
- ORCA DB スキーマ上、名称は `master.tbl_material_h_n.sname` 側にあるため、本来は join が必要。
  - そのため、仮に `tbl_material_h_m` にレコードが存在しても「名称（ガーゼ等）での検索」は成立しにくい。

## Evidence
- `material_table_counts_simple.tsv`: `tbl_material_*` の件数（全0件）
- `other_master_counts.tsv`: 参考（他マスタは非0件）
- `schema_tbl_material_h_m.tsv`, `schema_tbl_material_h_n.tsv`: スキーマ抜粋

## Proposal
1. 正攻法: ORCA 側の標準マスタ更新（特定器材マスタ）を実行し、`master.tbl_material_*` を populated にする。
   - WebORCA では標準マスタ更新スクリプト群が `/opt/jma/weborca/app/scripts/allways/` にある（例: `master_upgrade.sh`, `master_standard_upgrade.sh`）。
2. 開発/検証用: `seed-material-minimal.sql` で最小シードを投入し、UI→`POST /orca/order/bundles` 配線（payload 保存）を実証する。
   - 後始末は `cleanup-material-minimal.sql`。
3. 恒久修正（server-modernized）:
   - `tbl_material_h_m` を読む場合は `tbl_material_h_n`（名称）と join し、`materialName` と keyword 検索対象を `sname` にする。
   - 可能なら `tbl_material_h_c`（メーカー名）も join して `maker` を human-readable にする。
