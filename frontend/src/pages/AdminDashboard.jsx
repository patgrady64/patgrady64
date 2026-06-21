import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UploadCloud, LogOut, Terminal, ShieldAlert, FileCode } from 'lucide-react';

export default function AdminDashboard() {
    const [session, setSession] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check for an active session when the page loads
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) setError(error.message);
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // --- 1. LOGIN SCREEN ---
    if (!session) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: '#fff' }}>
                <form onSubmit={handleLogin} style={{ background: '#1e1e1e', padding: '2rem', borderRadius: '8px', width: '320px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Admin Portal</h2>
                    
                    {error && <div style={{ color: '#ff4d4d', marginBottom: '1rem', fontSize: '14px' }}>{error}</div>}
                    
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', background: '#121212', color: '#fff' }} />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', background: '#121212', color: '#fff' }} />
                    </div>

                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </div>
        );
    }

    // --- 2. PROTECTED ADMIN PANEL ---
return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Console Row */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Terminal className="text-emerald-400 stroke-[2.5]" size={24} /> 
              SYSTEM INGESTION ENGINE
            </h1>
            <p className="text-xs font-mono text-gray-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              SECURE SESSION ACCESS // {session.user.email}
            </p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 font-mono text-xs text-red-400 hover:text-white bg-red-950/20 hover:bg-red-600 border border-red-900/40 hover:border-red-500 px-4 py-2 rounded-xl transition-all duration-200 self-start sm:self-auto shadow-md"
          >
            <LogOut size={14} /> Sign Out Terminal
          </button>
        </header>

        {/* Dynamic Drag and Drop Asset Control */}
        <main>
          <div className="group relative bg-gradient-to-b from-gray-950/40 to-gray-950/80 border-2 border-dashed border-gray-800 hover:border-emerald-500/40 rounded-3xl p-12 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/5 flex flex-col items-center justify-center min-h-[340px]">
            {/* Background Hover Accent Glow */}
            <div className="absolute inset-0 bg-emerald-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center shadow-inner group-hover:border-emerald-500/20 group-hover:bg-gray-900/60 transition-colors duration-300">
                <UploadCloud className="text-gray-500 group-hover:text-emerald-400 transition-colors duration-300 stroke-[1.5]" size={32} />
              </div>
              
              <div className="space-y-1.5">
                <p className="text-base font-semibold text-slate-200">
                  Drag & drop your project build folder
                </p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Provide a localized production directory containing a structural <span className="text-amber-400 font-mono">info.csv</span> file and compiled application assets.
                </p>
              </div>

              {/* Mini Pipeline Requirements Spec Pill */}
              <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-[10px] font-mono text-gray-400 shadow-inner">
                <span className="flex items-center gap-1"><FileCode size={11} className="text-emerald-400" /> info.csv</span>
                <span className="text-gray-700">|</span>
                <span className="flex items-center gap-1"><ShieldAlert size={11} className="text-purple-400" /> Build Asset</span>
              </div>
            </div>
          </div>
        </main>
        
      </div>
    </div>
  );
}