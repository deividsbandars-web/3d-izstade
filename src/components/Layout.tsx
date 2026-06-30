import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import GlobalChat from './chat/GlobalChat';

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

const Layout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/expo/sponsor-packages" style={{ background: 'rgba(56, 189, 248, 0.14)', border: '1px solid rgba(56, 189, 248, 0.34)', color: '#e0f2fe', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 900, fontSize: '0.74rem' }} className="desktop-nav">SPONSOR PACKAGES</Link>
          <Link to="/expo" style={{ background: '#8b5cf6', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 900, fontSize: '0.8rem' }} className="desktop-nav">LIVE EXPO</Link>
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
