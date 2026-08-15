import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './style.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("L'élément #root est introuvable dans public/index.html");
}
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
