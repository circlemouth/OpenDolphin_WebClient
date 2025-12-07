import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppRouter } from './AppRouter';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
