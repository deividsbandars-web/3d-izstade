import React, { useState } from 'react';

export default function AuthPage({ onLogin }: { onLock?: any, onLogin: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      // Assuming backend is at localhost:3000 as configured previously
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection to server failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 font-sans">
      <div className="w-full max-w-md p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-black text-white text-center mb-2 tracking-tighter">
          WARPALA <span className="text-blue-500">EXPO</span>
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm uppercase font-bold tracking-widest">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Username</label>
            <input 
              type="text" 
              className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 uppercase tracking-tighter"
          >
            {isLogin ? 'Login to Dashboard' : 'Register Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
