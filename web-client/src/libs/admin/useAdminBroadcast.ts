import { useEffect, useState } from 'react';

import { publishAdminBroadcast, readAdminBroadcast, subscribeAdminBroadcast, type AdminBroadcast } from './broadcast';

export function useAdminBroadcast() {
  const [broadcast, setBroadcast] = useState<AdminBroadcast | null>(() => readAdminBroadcast());

  useEffect(() => {
    return subscribeAdminBroadcast((payload) => {
      setBroadcast(payload);
    });
  }, []);

  return { broadcast, publish: publishAdminBroadcast };
}
