import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import './styles/index.css';
import { isConfigured } from './lib/firebase.js';
import SetupNotice from './components/layout/SetupNotice.jsx';

const root = createRoot(document.getElementById('root'));

async function start() {
  if (!isConfigured) {
    root.render(<SetupNotice />);
    return;
  }
  const { default: App } = await import('./App.jsx');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

start();
