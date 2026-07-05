import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFrontendRuntimeEnv } from '../config/runtimeEnv';
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

type AuthMode = 'sign-in' | 'sign-up' | 'reset';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('construction');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = getSafeNextPath(location.search);
  const authConfigError = supabaseAuthConfigError;
  const isSignUp = mode === 'sign-up';
  const isReset = mode === 'reset';

  async function bootstrapAuthenticatedAccount(accessToken?: string) {
    await serverApiPost('/api/auth/bootstrap', {}, accessToken);
  }

  function buildPasswordResetRedirectTo() {
    const runtimeEnv = getFrontendRuntimeEnv();
    const isLocalDev = typeof window !== 'undefined'
      && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const origin = runtimeEnv.publicAppUrl || (isLocalDev && typeof window !== 'undefined' ? window.location.origin : '');

    if (!origin) {
      throw new Error('Public app URL is not configured. Set VITE_PUBLIC_APP_URL or derive it from VITE_PUBLIC_API_BASE_URL.');
    }

    return `${origin}/reset-password?next=${encodeURIComponent(nextPath)}`;
  }

  useEffect(() => {
    if (authConfigError) {
      setErrorMsg(authConfigError);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(nextPath);
    }).catch((error) => {
      setErrorMsg(error instanceof Error ? error.message : 'Supabase auth is not configured.');
    });
  }, [authConfigError, navigate, nextPath]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (authConfigError) {
        throw new Error(authConfigError);
      }

      if (isReset) {
        const resetRedirectTo = buildPasswordResetRedirectTo();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetRedirectTo,
        });
        if (error) throw error;

        setErrorMsg('If an account exists for that email, a reset link has been sent. Check your inbox.');
        setMode('sign-in');
        return;
      }

      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;

        if (authData.session) {
          await bootstrapAuthenticatedAccount(authData.session.access_token);
          navigate(nextPath);
        } else {
          setErrorMsg('Registration submitted. If confirmation is required, check your email, then sign in.');
        }

        setMode('sign-in');
        return;
      }

      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (!signInData.session) {
        throw new Error('Signed in, but no session was returned. Please try again.');
      }

      await bootstrapAuthenticatedAccount(signInData.session.access_token);
      navigate(nextPath);
    } catch (error: any) {
      const message = String(error?.message || 'Authentication error.');
      if (/already registered|already exists|user already exists/i.test(message)) {
        setErrorMsg('This account already exists. Sign in instead.');
      } else {
        setErrorMsg(message);
      }
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
            {isReset ? 'Reset Password' : isSignUp ? 'Create Account' : 'System Entry'}
          </h1>
          <p style={{ color: 'var(--text-dim)', marginTop: '10px', fontSize: '1rem' }}>
            {isReset ? 'Send yourself a reset link or finish recovery from your inbox' : isSignUp ? 'Join the Warpala ecosystem' : 'Sign in to your dashboard'}
          </p>
        </div>

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

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isSignUp && (
            <label>
              Business category
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="construction">Construction & Fit-Out</option>
                <option value="tech">Information Technology</option>
                <option value="creative">Creative Industry</option>
                <option value="cleaning">Services</option>
              </select>
            </label>
          )}

          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
            />
          </label>

          {!isReset && (
            <label>
              Password
              <input
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="********"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '18px' }}
          >
            {isLoading ? 'SYNCING...' : (isReset ? 'SEND RESET LINK' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px' }}>
          {isReset ? 'Remembered your password? ' : isSignUp ? 'Already have an account? ' : 'Need an account? '}
          <button
            onClick={() => {
              setErrorMsg('');
              setMode(isReset ? 'sign-in' : isSignUp ? 'sign-in' : 'sign-up');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}
          >
            {isReset ? 'Back to sign in' : isSignUp ? 'Sign in' : 'Register now'}
          </button>
        </div>

        {!isReset && (
          <div style={{ marginTop: '18px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setMode('reset');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}
            >
              Forgot password?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
