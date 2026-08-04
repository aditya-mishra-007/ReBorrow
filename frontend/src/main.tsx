import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

/**
 * main.tsx
 * ------------------------------------------------------------------
 * Application entry point. Responsibilities:
 *   1. Mount the React tree into the DOM (#root, defined in index.html)
 *   2. Wrap the app in StrictMode for development-time checks
 *      (detects unsafe lifecycle usage, deprecated APIs, etc. — has
 *      no effect on production builds)
 *   3. Wrap the app in BrowserRouter so routing (react-router-dom) is
 *      available everywhere below this point in the tree
 *
 * Note: AuthProvider (React Context for authentication state) is
 * deliberately NOT wrapped here — it's applied inside App.tsx instead,
 * keeping this file focused purely on DOM mounting and top-level
 * routing setup, not application-specific state.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element with id "root" not found. Check that index.html contains <div id="root"></div>.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);