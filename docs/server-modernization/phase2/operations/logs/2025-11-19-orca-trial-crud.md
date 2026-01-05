# 2025-11-19 WebORCA Trial CRUD ログ

> Template 用メモ: Trial 環境で新規登録／更新／削除を行った際は本ファイルへ追記する。RUN_ID は `YYYYMMDDTorcaTrialCrudZ#` を使用し、Evidence へのフルパスを記載する。

- RUN_ID: `20251119TorcaTrialCrudZ1` / API: `/api01rv2/system01dailyv2`（当時は `?class=00` 付き）
  - 操作: 2025-11-15 基準日の基本情報取得（UTF-8 XML POST、auth=`<MASKED>/<MASKED>`）。レスポンスで `Api_Result=00` / `Information_Date=2025-11-15` を確認。  
  - Evidence: `artifacts/orca-connectivity/20251119TorcaTrialCrudZ1/trial/system01dailyv2/`（request.xml / response.xml / response.headers / trace.log / README.md）。  
  - 後片付け: 読み取り系のため追加削除は不要。CRUD 系 API 実測時に削除まで完了すること。  

- RUN_ID: _(todo)_ / API: _(例 `/orca14/appointmodv2` class=01)_  
  - 操作: _(例 予約新規登録 → 即削除)_  
  - Evidence: `artifacts/orca-connectivity/<RUN_ID>/trial/<api>/`  
  - 後片付け: _(例 該当予約を UI から削除済み、UTC=2025-11-19T12:34:56Z)_

- RUN_ID: _(追加の CRUD 実測が完了したら以下に追記する)_
