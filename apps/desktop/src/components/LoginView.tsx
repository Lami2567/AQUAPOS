import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { BRAND_ASSETS } from '../config/assets.config';
import { UserRole, User } from '@water-business/shared-types';
import {
  Lock,
  UserCheck,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Info,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { setUser, usersList } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const LogoIcon = BRAND_ASSETS.LogoIcon;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setErrorMsg('Please enter your username');
      return;
    }
    if (!trimmedPass) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user in registered users list
      const existingUser = usersList.find(
        (u) => u.username.toLowerCase() === trimmedUser.toLowerCase()
      );

      // 1. Check if user exists
      if (!existingUser) {
        setErrorMsg(`Invalid Credentials: User "${trimmedUser}" is not registered in the system.`);
        setIsLoading(false);
        return;
      }

      // 2. Validate password credentials
      // Default passwords: admin -> admin123; other staff -> password123 (or custom user password if set)
      const expectedPassword =
        (existingUser as any).password ||
        (existingUser.username === 'admin' ? 'admin123' : 'password123');

      if (trimmedPass !== expectedPassword) {
        setErrorMsg(`Invalid Credentials: Password is incorrect for user "${trimmedUser}".`);
        setIsLoading(false);
        return;
      }

      // Successful authentication!
      setUser(existingUser, `jwt-token-${Date.now()}`);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-8 relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-cyan-950/90 rounded-2xl border border-cyan-500/40 text-cyan-400 mb-1">
            <LogoIcon className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1">
            AQUA<span className="text-cyan-400">POS</span>
          </h1>
          <p className="text-xs text-slate-400">
            Water Business Management System • User Sign In
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/90 border border-rose-500/60 text-rose-200 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-lg animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div className="leading-tight font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1.5 font-semibold">Username</label>
            <div className="relative">
              <UserCheck className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. admin or mgr_lwengo"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1.5 font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-950 text-xs tracking-wide cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating Credentials...</span>
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Info Hint */}
        <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            <span>Registered Staff Accounts</span>
          </div>
          <div className="font-mono text-[10px] text-slate-300 space-y-0.5">
            <div>• Super Admin: <span className="text-cyan-300 font-bold">admin</span> (pass: <span className="text-amber-300 font-bold">admin123</span>)</div>
            <div>• Branch Manager: <span className="text-cyan-300 font-bold">mgr_lwengo</span> (pass: <span className="text-amber-300 font-bold">password123</span>)</div>
            <div>• Storekeeper: <span className="text-cyan-300 font-bold">storekeeper_a</span> (pass: <span className="text-amber-300 font-bold">password123</span>)</div>
            <div>• Cashier: <span className="text-cyan-300 font-bold">cashier_isingiro</span> (pass: <span className="text-amber-300 font-bold">password123</span>)</div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="pt-2 border-t border-slate-800/80 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Strict Role-Based Access Control • Offline AES Engine</span>
        </div>

      </div>
    </div>
  );
};
