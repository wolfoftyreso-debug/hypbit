import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./Dashboard";
import LoginScreen from "./LoginScreen";
import OnboardingWizard from "./OnboardingWizard";
import { LanguageProvider } from "@pixdrift/i18n";

const API = "https://api.bc.pixdrift.com";

function Root() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("pixdrift_token");
    const savedUser = localStorage.getItem("pixdrift_user");

    if (savedToken && savedUser) {
      // Validera token direkt mot Supabase (ingen backend-proxy)
      const SUPABASE_URL = "https://znmxtnxxjpmgtycmsqjv.supabase.co";
      const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubXh0bnh4anBtZ3R5Y21zcWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4ODA2NjUsImV4cCI6MjA4OTQ1NjY2NX0.3LzBF2cE95X0vtW-5LwfJu8iGebnE9AUXglHchMPH60";
      fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${savedToken}` },
      })
        .then(res => {
          if (res.ok) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          } else {
            localStorage.removeItem("pixdrift_token");
            localStorage.removeItem("pixdrift_user");
          }
          setLoading(false);
        })
        .catch(() => {
          // Offline — visa appen med sparad user
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  function handleLogin(newToken: string, newUser: any) {
    setToken(newToken);
    setUser(newUser);
  }

  function handleLogout() {
    localStorage.removeItem("pixdrift_token");
    localStorage.removeItem("pixdrift_user");
    setToken(null);
    setUser(null);
    // Rensa cookie + Supabase-session
    fetch(`${API}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#F2F2F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ fontSize: 13, color: "#8E8E93" }}>Laddar pixdrift...</div>
      </div>
    );
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem("pixdrift_onboarding_complete")
  );

  if (showOnboarding) {
    return (
      <LanguageProvider>
        <OnboardingWizard
          onComplete={() => {
            localStorage.setItem("pixdrift_onboarding_complete", "true");
            setShowOnboarding(false);
          }}
          onSkip={() => {
            // Don't mark complete on skip — remind next login
            setShowOnboarding(false);
          }}
        />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <App user={user} onLogout={handleLogout} />
    </LanguageProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
