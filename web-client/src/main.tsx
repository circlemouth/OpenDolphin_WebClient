import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { LoginScreen } from './LoginScreen';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoginScreen />
  </StrictMode>,
);
