// Defensive safeguard for iframe sandboxes where window.fetch has only a getter
if (typeof window !== 'undefined') {
  try {
    const win = window;
    const nativeFetch = typeof win.fetch === 'function' ? win.fetch.bind(win) : null;
    let customFetch: typeof window.fetch | null = null;
    const desc = Object.getOwnPropertyDescriptor(win, 'fetch');
    if (!desc || desc.set === undefined) {
      Object.defineProperty(win, 'fetch', {
        get: () => customFetch || nativeFetch || win.fetch,
        set: (fn) => {
          customFetch = fn;
        },
        configurable: true,
        enumerable: true,
      });
    }
  } catch (e) {
    // Non-fatal if already defined
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
