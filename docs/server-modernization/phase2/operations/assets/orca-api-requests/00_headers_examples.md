# ServerInfo 認証ヘッダー例

ServerInfoResource（`/openDolphin/resources/serverinfo/claim/conn`）への疎通で使用する `-H userName` / `-H password` / `-H clientUUID` の最小テンプレート。`curl` の `-i` オプションで HTTP ステータスを直接確認できるようにしている。

```bash
export SERVERINFO_URL=${SERVERINFO_URL:-http://localhost:9080/openDolphin/resources/serverinfo/claim/conn}
export CLIENT_UUID=${CLIENT_UUID:-00000000-0000-0000-0000-000000000000}

# sysad（期待: 401 authentication_failed）
export SYSAD_USERNAME=${SYSAD_USERNAME:-1.3.6.1.4.1.9414.10.1:dolphin}
export SYSAD_PASSWORD_HASH=${SYSAD_PASSWORD_HASH:-36cdf8b887a5cffc78dcd5c08991b993}

curl -i -sS \
  -H "userName: ${SYSAD_USERNAME}" \
  -H "password: ${SYSAD_PASSWORD_HASH}" \
  -H "clientUUID: ${CLIENT_UUID}" \
  "$SERVERINFO_URL"

# LOCAL.FACILITY（期待: 200 server）
export FACILITY_USERNAME=${FACILITY_USERNAME:-LOCAL.FACILITY.0001:dolphin}
export FACILITY_PASSWORD_HASH=${FACILITY_PASSWORD_HASH:-36cdf8b887a5cffc78dcd5c08991b993}

curl -i -sS \
  -H "userName: ${FACILITY_USERNAME}" \
  -H "password: ${FACILITY_PASSWORD_HASH}" \
  -H "clientUUID: ${CLIENT_UUID}" \
  "$SERVERINFO_URL" | jq .
```

- 401 発生時は `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md:21` の再現条件を参照し、sysad ヘッダーが `/dolphin` 固有権限であることを監査記録に残す。
- 200 応答の証跡（`serverinfo_claim_conn_local.json`）は `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md:22` を参照し、`LOCAL.FACILITY.0001` 系アカウントでの検証をデフォルトとする。
