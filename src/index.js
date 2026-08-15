import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './style.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in public/index.html');
}
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
