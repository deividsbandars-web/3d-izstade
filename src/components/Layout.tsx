import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalChat from './chat/GlobalChat';
import { supabaseClient } from '../lib/supabaseClient';

type SessionSummary = {
  email: string;
  role: string;
};

const navItems = [
  { path: '/dashboard', label: 'DASHBOARD', icon: '📊' },
  { path: '/projects', label: 'PROJECTS', icon: '📁' },
  { path: '/clients', label: 'CLIENTS', icon: '👥' },
  { path: '/calculators', label: 'CALCULATORS', icon: '🧮' },
  { path: '/inventory', label: 'INVENTORY', icon: '📦' },
  { path: '/generator', label: 'AI TOOLS', icon: '🧠' },
  { path: '/documents', label: 'DOCUMENTS', icon: '📄' },
  { path: '/finances', label: 'FINANCE', icon: '💰' },
  { path: '/settings', label: 'SETTINGS', icon: '⚙️' }
];

function buildLoginHref(pathname: string) {
  if (pathname === '/expo/admin' || pathname.startsWith('/expo/admin/')) {
    return '/login?next=/expo/admin';
  }

  if (pathname === '/modular-homes/quotes' || pathname.startsWith('/modular-homes/quotes/')) {
    return '/login?next=/modular-homes/quotes';
  }

  if (pathname === '/expo/sponsor-leads' || pathname.startsWith('/expo/sponsor-leads/')) {
    return '/login?next=/expo/sponsor-leads';
  }

  return '/login';
}

function redactEmail(email: string) {
  const [localPart = '', domain = ''] = String(email || '').split('@');
  const safeLocal = localPart ? `${localPart.slice(0, 1)}***` : 'user';
  const safeDomain = domain ? domain.split('.').map((part, index) => (index === 0 && part ? `${part.slice(0, 1)}***` : part)).join('.') : 'local';
  return `${safeLocal}@${safeDomain}`;
}

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabaseClient.auth.getSession();
      if (!active) return;

      const session = data.session;
      if (!session) {
        setSessionSummary(null);
        return;
      }

      setSessionSummary({
        email: session.user.email || 'signed-in user',
        role: session.user.app_metadata?.role === 'admin' ? 'admin' : 'user',
      });
    }

    void loadSession();

    const { data: authSubscription } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session) {
        setSessionSummary(null);
        return;
      }

      setSessionSummary({
        email: session.user.email || 'signed-in user',
        role: session.user.app_metadata?.role === 'admin' ? 'admin' : 'user',
      });
    });

    return () => {
      active = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const loginHref = useMemo(() => buildLoginHref(location.pathname), [location.pathname]);

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    setSessionSummary(null);
    navigate(loginHref, { replace: true });
    setIsMobileMenuOpen(false);
  }

  const accountLabel = sessionSummary
    ? `${redactEmail(sessionSummary.email)} · ${sessionSummary.role.toUpperCase()}`
    : '';

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* TOP NAV */}
      <nav style={{
        height: '70px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 1000
      }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', textDecoration: 'none', letterSpacing: '-1px' }}>
          30Sek24<span style={{ color: '#3b82f6' }}>.com</span>
        </Link>

        {/* Desktop Nav */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '5px' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '10px 15px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.75rem',
                fontWeight: 800, color: location.pathname === item.path ? '#fff' : '#64748b',
                background: location.pathname === item.path ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ marginRight: '8px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/expo/sponsor-packages" style={{ background: 'rgba(56, 189, 248, 0.14)', border: '1px solid rgba(56, 189, 248, 0.34)', color: '#e0f2fe', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 900, fontSize: '0.74rem' }} className="desktop-nav">SPONSOR PACKAGES</Link>
          <Link to="/expo" style={{ background: '#8b5cf6', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 900, fontSize: '0.8rem' }} className="desktop-nav">LIVE EXPO</Link>
          {sessionSummary ? (
            <>
              <div
                aria-label="Current account"
                style={{
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.82)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '999px',
                  color: '#e2e8f0',
                  display: 'inline-flex',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  gap: '8px',
                  padding: '8px 12px',
                }}
              >
                <span style={{ color: '#7dd3fc', fontWeight: 900 }}>{accountLabel}</span>
              </div>
              <button
                onClick={() => void handleLogout()}
                style={{
                  background: 'rgba(244, 63, 94, 0.16)',
                  border: '1px solid rgba(244, 63, 94, 0.34)',
                  borderRadius: '999px',
                  color: '#fecdd3',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  padding: '10px 16px',
                }}
              >
                LOGOUT
              </button>
            </>
          ) : (
            <Link
              to={loginHref}
              style={{
                background: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.34)',
                color: '#e0f2fe',
                padding: '10px 16px',
                borderRadius: '999px',
                textDecoration: 'none',
                fontWeight: 900,
                fontSize: '0.74rem',
              }}
            >
              LOGIN
            </Link>
          )}
          <button className="burger-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
          <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} className="desktop-nav"></div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>MENU</span>
            <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2rem' }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '20px' }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <Link
              to="/expo/sponsor-packages"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ marginTop: '20px', background: 'rgba(56, 189, 248, 0.16)', border: '1px solid rgba(56, 189, 248, 0.42)', color: '#e0f2fe', padding: '20px', borderRadius: '15px', textDecoration: 'none', fontWeight: 900, textAlign: 'center' }}
            >
              SPONSOR PACKAGES
            </Link>
            <Link
              to="/expo"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ background: '#8b5cf6', color: '#fff', padding: '20px', borderRadius: '15px', textDecoration: 'none', fontWeight: 900, textAlign: 'center' }}
            >
              ENTER LIVE EXPO 🚀
            </Link>
            {sessionSummary ? (
              <>
                <div style={{ padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(148, 163, 184, 0.22)', background: 'rgba(15, 23, 42, 0.72)', color: '#e2e8f0' }}>
                  <div style={{ color: '#7dd3fc', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Current account
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: 800 }}>{redactEmail(sessionSummary.email)}</div>
                  <div style={{ marginTop: '4px', color: '#94a3b8', fontSize: '0.8rem' }}>Role: {sessionSummary.role.toUpperCase()}</div>
                </div>
                <button
                  onClick={() => void handleLogout()}
                  style={{
                    background: 'rgba(244, 63, 94, 0.18)',
                    border: '1px solid rgba(244, 63, 94, 0.36)',
                    borderRadius: '15px',
                    color: '#fecdd3',
                    cursor: 'pointer',
                    fontWeight: 900,
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <Link
                to={loginHref}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: 'rgba(56, 189, 248, 0.16)',
                  border: '1px solid rgba(56, 189, 248, 0.42)',
                  color: '#e0f2fe',
                  padding: '20px',
                  borderRadius: '15px',
                  textDecoration: 'none',
                  fontWeight: 900,
                  textAlign: 'center',
                }}
              >
                LOGIN
              </Link>
            )}
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <main style={{ padding: '20px', paddingBottom: '80px' }}>
        <Outlet />
      </main>

      <GlobalChat />

      {/* SYSTEM STATUS BAR */}
      <footer style={{
        height: '30px', background: '#0f172a', borderTop: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: '0.65rem',
        color: '#94a3b8', position: 'fixed', bottom: 0, width: '100%', zIndex: 1000
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>MEZGLS: RTX_4080_ULTRA</span>
          <span style={{ color: '#10b981' }}>SYSTEM_SYNC: ACTIVE</span>
        </div>
      </footer>    </div>
  );
};

export default Layout;
