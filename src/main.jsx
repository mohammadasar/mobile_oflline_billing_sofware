/**
 * main.jsx
 * Application entry point.
 * - Imports global styles
 * - Renders App into the DOM
 *
 * Note: jeep-sqlite web component is NOT loaded here because we're
 * targeting Android as the primary platform. If you later add
 * web browser support, add the jeep-sqlite initialization here.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { defineCustomElements as defineJeepSqlite } from 'jeep-sqlite/dist/esm/loader.js';
import './index.css';
import App from './App.jsx';

defineJeepSqlite(window);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
