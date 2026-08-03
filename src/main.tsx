import { patchUrlMappings } from '@discord/embedded-app-sdk';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// In Discord Activities, the Embedded App iframe enforces a strict Content
// Security Policy that blocks direct connections to third-party origins such
// as the Supabase project. Discord exposes a URL-mapping proxy so that
// requests to `https://xvhtqkhsuafcsocgikgt.supabase.co/...` can instead go
// to `https://<CLIENT_ID>.discoddsays.com/.proxy/supabase/...`, which is
// allow-listed. `patchUrlMappings` rewrites outgoing fetch/XHR/WebSocket
// calls to use the proxy automatically, so it must be installed before any
// Supabase code runs. See src/p2p/supabaseEnv.ts for the matching mapping.
const SUPABASE_PROJECT_HOST = 'xvhtqkhsuafcsocgikgt.supabase.co';

patchUrlMappings([
  { prefix: '/supabase', target: SUPABASE_PROJECT_HOST },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
