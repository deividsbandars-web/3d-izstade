import { createRoot } from 'react-dom/client';
import App from './App';
import { getFrontendRuntimeEnv } from './config/runtimeEnv';
import './index.css';

getFrontendRuntimeEnv();

createRoot(document.getElementById('root')!).render(
  <App />
);
