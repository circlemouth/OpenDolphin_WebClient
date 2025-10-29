import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/App';
import { initializeAuditTrail } from '@/libs/audit';
import { initializeSecurityPolicies } from '@/libs/security';

initializeSecurityPolicies();
initializeAuditTrail();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
