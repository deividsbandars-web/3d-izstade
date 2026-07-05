import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, supabaseAuthConfigError } from '../core/supabase';
import { serverApiPost } from '../services/serverApi';
import '../components/calculator/styles/CalculatorPro.css';

function getSafeNextPath(search: string) {
  const nextPath = new URLSearchParams(search).get('next')?.trim();
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/dashboard';
  }

  return nextPath;
}

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = getSafeNextPath(location.search);

  async function bootstrapAuthenticatedAccount(accessToken?: string) {
    await serverApiPost('/api/auth/bootstrap', {}, accessToken);
  }

  useEffect(() => {
    if (supabaseAuthConfigError) {
      setErrorMsg(supabaseAuthConfigError);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatusMsg('Choose a new password to finish recovery.');
        return;
      }

      setStatusMsg('Open the password reset link from your email to continue.');
    }).catch((error) => {
      setErrorMsg(error instanceof Error ? error.message : 'Supabase auth is not configured.');
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setStatusMsg('Choose a new password to finish recovery.');
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (supabaseAuthConfigError) {
        throw new Error(supabaseAuthConfigError);
      }

      if (newPassword.length < 8) {
        throw new Error('Choose a password with at least 8 characters.');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Open the reset link from your email first.');
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      await bootstrapAuthenticatedAccount(sessionData.session.access_token);
      setStatusMsg('Password updated. Redirecting...');
      navigate(nextPath, { replace: true });
    } catch (error: any) {
      setErrorMsg(String(error?.message || 'Could not update password.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        padding: '24px',
      }}
    >
      <div className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '50px', borderColor: 'var(--accent-blue)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              borderRadius: '15px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.8rem',
              color: '#fff',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
            }}
          >
            W
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-2px', color: '#fff', margin: 0 }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--text-dim)', marginTop: '10px', fontSize: '1rem' }}>
            Set a new password for your account
          </p>
        </div>

        {statusMsg && (
          <div
            className="glass-card"
            style={{
              padding: '15px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid var(--accent-blue)',
              color: '#bfdbfe',
              marginBottom: '25px',
              fontSize: '0.9rem',
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div
            className="glass-card"
            style={{
              padding: '15px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid #f43f5e',
              color: '#f43f5e',
              marginBottom: '25px',
              fontSize: '0.9rem',
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="********"
            />
          </label>

          <label>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="********"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '18px' }}
          >
            {isLoading ? 'SYNCING...' : 'UPDATE PASSWORD'}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px' }}>
          <a href="/login" style={{ color: 'var(--accent-blue)', fontWeight: 800, textDecoration: 'none' }}>
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
