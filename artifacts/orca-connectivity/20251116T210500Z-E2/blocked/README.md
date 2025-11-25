# 20251116T210500Z-E2 Blocked API メモ

- `/orca14/appointmodv2` (Trial): `HTTP/1.1 405 Method Not Allowed`。Allow=`OPTIONS, GET`。証跡: `../appointmodv2/trial/`。
- `/orca11/acceptmodv2` (Trial): `HTTP/1.1 405 Method Not Allowed`。Allow=`OPTIONS, GET`。証跡: `../acceptmodv2/trial/`。
- ORMaster 到達性: `nslookup ormaster.orca.med.or.jp` → `NXDOMAIN`（`../dns/ormaster.nslookup.txt`）。`curl -u ormaster:ormaster https://ormaster.orca.med.or.jp/...` は `curl: (6)` で終了。DNS/Firewall 解決後に再測が必要。
