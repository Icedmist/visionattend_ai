import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Successful Auth
      localStorage.setItem('auth_token', data.token);
      onLoginSuccess(data.token);
    } catch (err) {
      setErrorMsg(err.message || 'Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans">
      
      {/* Background Matrix/Cyber HUD elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.07),transparent_70%)]" />
      <div className="absolute inset-0 bg-hud-grid opacity-10" />

      {/* Cyberpunk Accent Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full filter blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full filter blur-[100px] animate-pulse delay-700" />

      <div className="relative w-full max-w-md p-6">
        
        {/* Main Glowing Container */}
        <div className="glass p-8 rounded-3xl border border-slate-800/80 shadow-[0_0_50px_rgba(6,182,212,0.05)] relative overflow-hidden">
          
          {/* Top HUD Line decoration */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
          
          <div className="flex flex-col items-center mb-8">
            {/* Holographic Logo Shield */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center mb-4 group hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                <Shield className="w-8 h-8 text-neon-cyan" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              VISIONATTEND AI
            </h1>
            <p className="text-xs text-neon-purple font-semibold tracking-widest mt-1 uppercase">
              Admin Portal
            </p>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Security ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter admin ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-dark-input border border-slate-800 text-slate-200 placeholder-slate-600 text-xs font-semibold outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300"
                />
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Access Token
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-dark-input border border-slate-800 text-slate-200 placeholder-slate-600 text-xs font-semibold outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300"
                />
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-cyan hover:to-neon-purple text-white text-xs font-bold uppercase tracking-wider shadow-neon-purple hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-500 flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Authenticate Securely</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Decoration */}
          <div className="mt-8 text-center">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
              Biometric Authorization Protocol 2.4.0
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
