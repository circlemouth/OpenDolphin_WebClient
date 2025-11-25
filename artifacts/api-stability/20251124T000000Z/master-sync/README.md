# Master Sync Assets (RUN_ID=20251124T073245Z, 親=20251124T000000Z)

- 生成日: 2025-11-24（schemas=`artifacts/api-stability/20251123T130134Z/schemas/orca-master-*.json` を唯一の入力）
- スナップショット: snapshotVersion=`2025-11-23` / version=`20251123` / dataSource=`snapshot` / cacheHit=`false`
- 出力: `master-sync/20251124/hashes/msw/{orca05,orca06,orca08}.hash`（msw フィクスチャから現行整形ロジックで JSON フラット化→sha256）
- ハッシュ: orca05=`13832d8f5e091145073ff1c26ac2cef085f766ad50d4bebef665c514692e40a2`, orca06=`a33be23a1cd8c4d9bb7b2030d6fdb4e3f76b6dd68c8702be70d442dcb1abfc36`, orca08=`1a2974d25b204ba414caee1d150e105e3938e9e2897ecefa00dc718d59467c85`（orca06/08 は server 版と一致、orca05 は generic-class 未収集のため DIFF）
- server 版ハッシュ: 2025-11-25 取得（入力=`artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/`、整形→sha256）。保存先=`hashes/server/`。値: orca05=`5c38f4029ee950fbc825b8d8d602188097c8f7ca27278026ba01bec38f294922`, orca06=`a33be23a1cd8c4d9bb7b2030d6fdb4e3f76b6dd68c8702be70d442dcb1abfc36`, orca08=`1a2974d25b204ba414caee1d150e105e3938e9e2897ecefa00dc718d59467c85`（diff=`master-sync/20251124/diffs/server-vs-msw-orca*.json`）
