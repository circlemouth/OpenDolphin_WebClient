import { useEffect, useMemo, useState } from 'react';

import {
  publishAdminBroadcast,
  readAdminBroadcast,
  subscribeAdminBroadcast,
  type AdminBroadcast,
  type AdminBroadcastScope,
} from './broadcast';

export function useAdminBroadcast(scope?: AdminBroadcastScope) {
  const stableScope = useMemo(() => scope, [scope?.facilityId, scope?.userId]);
  const [broadcast, setBroadcast] = useState<AdminBroadcast | null>(() => readAdminBroadcast(stableScope));

  useEffect(() => {
    setBroadcast(readAdminBroadcast(stableScope));
    return subscribeAdminBroadcast((payload) => {
      setBroadcast(payload);
    }, stableScope);
  }, [stableScope]);

  return { broadcast, publish: publishAdminBroadcast };
}
