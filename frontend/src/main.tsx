import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import './index.css';

import App from './App.tsx';

import { useAuthStore } from './modules/auth/store';

useAuthStore
  .getState()
  .loadUser();

createRoot(
  document.getElementById(
    'root'
  )!
).render(
  <StrictMode>
    <App />
  </StrictMode>
);