import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { LoginScreen } from './LoginScreen';
import { OutpatientMockPage } from './features/outpatient/OutpatientMockPage';
import './styles/global.css';

const path = window.location.pathname;
const App = path.startsWith('/outpatient-mock') ? OutpatientMockPage : LoginScreen;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
