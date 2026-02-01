import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { AuthProvider } from "./contexts/AuthContext";
import { supabase } from "./lib/supabase";

// CRITICAL: Process OAuth tokens BEFORE React renders
// This ensures tokens are captured before history.pushState in Index.tsx
(async () => {
  const hash = window.location.hash;
  const search = window.location.search;

  // Check for OAuth callback in URL hash (implicit flow)
  const hasHashTokens = hash && (hash.includes('access_token') || hash.includes('error'));

  // Check for OAuth callback in URL query (PKCE flow)
  const hasCodeParam = search && search.includes('code=');

  if (hasHashTokens || hasCodeParam) {
    // console.log('🔓 OAuth callback detected!');
    // console.log('   Hash:', hash ? 'present' : 'empty');
    // console.log('   Query:', search ? search : 'empty');

    try {
      // For PKCE flow, we need to exchange the code for session
      if (hasCodeParam) {
        // console.log('📤 Exchanging PKCE code for session...');
        // Supabase automatically handles code exchange when we get session
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          new URLSearchParams(search).get('code') || ''
        );

        if (error) {
          // console.error('❌ Error exchanging code:', error.message);
        } else if (data.session) {
          // console.log('✅ Session established:', data.session.user.email);
          // Clear URL params
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (hasHashTokens) {
        // For implicit flow (older method)
        // console.log('📤 Processing hash tokens...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          // console.error('❌ Error processing hash:', error.message);
        } else if (data.session) {
          // console.log('✅ Session established:', data.session.user.email);
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch (err) {
      console.error('❌ OAuth callback error:', err);
    }
  } else {
    console.log('🔓 Initial session check (no OAuth callback)');
  }
})();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
