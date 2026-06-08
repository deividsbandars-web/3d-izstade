import { useState, useEffect } from 'react';
import { supabase } from '../core/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import '../components/calculator/styles/CalculatorPro.css';

function getSafeNextPath(search: string) {
  const nextPath = new URLSearchParams(search).get('next')?.trim();
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/dashboard';
  }

  return nextPath;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('construction'); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = getSafeNextPath(location.search);

  // Pārbauda esošo sesiju
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(nextPath);
    });
  }, [navigate, nextPath]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // 1. Reģistrēt lietotāju
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;

        if (authData.user) {
          // 2. Izveidot uzņēmumu jaunajai tabulai 'companies'
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .insert([{ 
                name: `${email.split('@')[0]} Org`, 
                country: 'LV'
            }])
            .select()
            .single();
          
          if (companyError) throw companyError;

          // 3. Izveidot lietotāja profilu
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{ 
                id: authData.user.id,
                company_id: companyData.id,
                email: email,
                plan: 'pro'
            }]);
          
          if (profileError) throw profileError;
        }
        
        alert("Reģistrācija veiksmīga! Lūdzu, apstipriniet e-pastu (ja iespējots) un ielogojieties.");
        setIsSignUp(false);
      } else {
        // Ielogošanās
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(nextPath);
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Autentifikācijas kļūda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#020617',
      padding: '24px'
    }}>
      <div className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '50px', borderColor: 'var(--accent-blue)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '60px', height: '60px', 
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', 
            borderRadius: '15px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            fontWeight: 900, fontSize: '1.8rem', color: '#fff', marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)'
          }}>W</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-2px', color: '#fff', margin: 0 }}>
            {isSignUp ? 'Reģistrēt Kontu' : 'Sistēmas Ieja'}
          </h1>
          <p style={{ color: 'var(--text-dim)', marginTop: '10px', fontSize: '1rem' }}>
            {isSignUp ? 'Pievienojies Warpala ekosistēmai' : 'Autorizējies savā vadības panelī'}
          </p>
        </div>

        {errorMsg && (
          <div className="glass-card" style={{ padding: '15px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', color: '#f43f5e', marginBottom: '25px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {isSignUp && (
            <label>Darbības nozare
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="construction">Būvniecība un Apdare</option>
                <option value="tech">Informācijas Tehnoloģijas</option>
                <option value="creative">Radošā industrija</option>
                <option value="cleaning">Servisi un pakalpojumi</option>
              </select>
            </label>
          )}

          <label>E-pasts
            <input 
              type="email" value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="vards@uznemums.lv"
            />
          </label>
          
          <label>Parole
            <input 
              type="password" value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </label>
          
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', marginTop: '10px', padding: '18px' }}>
            {isLoading ? 'SINHRONIZĒ...' : (isSignUp ? 'IZVEIDOT KONTU' : 'AUTORIZĒTIES')}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px' }}>
          {isSignUp ? 'Jau esi platformā? ' : 'Vēl neesi pievienojies? '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}
          >
            {isSignUp ? 'Ielogoties' : 'Reģistrēties tagad'}
          </button>
        </div>
      </div>
    </div>
  );
}
