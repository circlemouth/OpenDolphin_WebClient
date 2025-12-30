# 02 AppRouter パスプレフィックス実装

- RUN_ID: `20251230T032453Z`
- Parent RUN_ID: `20251229T220416Z`
- YAML ID: `web-client/src/webclient_facility_prefix/02_AppRouterパスプレフィックス実装.md`

## 目的
- `/f/:facilityId/*` へルーティングを集約し、旧URLからの導線を衝突なく維持する。
- `/login` 直アクセスの入口と旧URLリダイレクトを AppRouter に集約する。

## 実装内容
- `AppRouter` に旧URLの明示ルートを追加し、`LegacyRootRedirect` で `/f/:facilityId/*` へ誘導。
- `/f/:facilityId/*` を正規ルートとし、FacilityGate 配下で認証と facilityId 正規化を維持。

## 影響範囲
- `web-client/src/AppRouter.tsx`

## 検証
- ユニットテスト: `npm test -- FacilityLoginEntry`
- ローカル起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`

## 補足
- 旧URLへのアクセスは `/login` 経由で施設選択後に `/f/:facilityId/*` へ復帰する。
