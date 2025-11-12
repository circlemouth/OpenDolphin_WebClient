# legacy_mdb_restart_template.sh
#
# 目的:
#   Legacy WildFly 上の StampSenderMDB (Message-Driven Bean) を docker compose exec 経由で安全に
#   stop/start する際の CLI テンプレート。実際の停止/開始操作はマネージャー指示が出た場合のみ実行し、
#   本ファイル内のコマンドはすべてコメントのまま参照すること。
#
# 前提:
#   - docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml が利用可能であること。
#   - RUN_ID=UTC タイムスタンプ（例: 20251112T094500Z）を事前に export 済み。
#   - 証跡は artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/ に集約し、legacy_mdb_restart.log を作成する。
#   - `docs/server-modernization/phase2/operations/TRACEID_JMS_RUNBOOK.md §5.7` の運用コメントを確認済みであること。
#
# 手順メモ（実行時はコメントを解除）:
#
# 1. jboss-cli を helper 経由で起動し、StampSenderMDB を停止
# docker compose --profile modernized-dev run --rm helper bash -lc '
#   set -euo pipefail
#   cd /workspace
#   docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml exec opendolphin-server \
#     /opt/jboss/wildfly/bin/jboss-cli.sh --connect \
#     --commands="/deployment=opendolphin.war/subsystem=ejb3/message-driven-bean=StampSenderMDB:stop" \
#     | tee artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/legacy_mdb_restart.log
# '
#
# 2. 停止確認（jboss-cli で state=STOPPED を取得）
# docker compose ... exec opendolphin-server \
#   /opt/jboss/wildfly/bin/jboss-cli.sh --connect \
#   --commands="/deployment=opendolphin.war/subsystem=ejb3/message-driven-bean=StampSenderMDB:read-resource(include-runtime=true)" \
#   | tee -a artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/legacy_mdb_restart.log
#
# 3. StampSenderMDB を開始
# docker compose ... exec opendolphin-server \
#   /opt/jboss/wildfly/bin/jboss-cli.sh --connect \
#   --commands="/deployment=opendolphin.war/subsystem=ejb3/message-driven-bean=StampSenderMDB:start" \
#   | tee -a artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/legacy_mdb_restart.log
#
# 4. 再度 state=STARTED を確認し、dolphinQueue runtime を採取
# docker compose ... exec opendolphin-server \
#   /opt/jboss/wildfly/bin/jboss-cli.sh --connect \
#   --commands="/deployment=opendolphin.war/subsystem=ejb3/message-driven-bean=StampSenderMDB:read-resource(include-runtime=true)" \
#   | tee -a artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/legacy_mdb_restart.log
# docker compose ... exec opendolphin-server \
#   /opt/jboss/wildfly/bin/jboss-cli.sh --connect \
#   --commands="/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource(include-runtime=true)" \
#   | tee artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/after_jms_dolphinQueue_read-resource_legacy.txt
#
# 5. ログ保存と差分テンプレ整備
#   - 同 RUN_ID の before/after ログを `diff -u before after` で比較し、messages-added / consumer-count の変化を
#     `domain-transaction-parity.md Appendix A.6` に記録。
#   - `docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md §3.4` に従い、
#     standalone-full.xml / ejb-jar.xml の抜粋も `artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/` に保存し server.log のタイムスタンプを控える。
