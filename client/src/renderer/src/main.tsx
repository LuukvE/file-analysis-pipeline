import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

window.electron.ipcRenderer.on('token', (_, token) => {
  localStorage.setItem('token', token);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
