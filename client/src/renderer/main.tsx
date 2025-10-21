import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './components/App';

window.auth = { token: '' };

window.electron.ipcRenderer.on('token', (_, token) => (window.auth.token = token));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
