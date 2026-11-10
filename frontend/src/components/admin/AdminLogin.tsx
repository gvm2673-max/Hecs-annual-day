import React, { useState } from 'react';
import { Lock, ArrowRight, User, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { HecsLogo } from '../../theme';

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
  onBackToInvite?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToInvite }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the administrator password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<{ success: boolean; token: string }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      localStorage.setItem('admin_token', data.token);
      onLoginSuccess(data.token);
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F8F2] flex flex-col items-center justify-center p-4 selection:bg-[#16834A]/20 selection:text-[#16834A]">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (onBackToInvite) {
              onBackToInvite();
            } else {
              window.location.href = '/';
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F2937] hover:text-[#16834A] px-3 py-1.5 rounded-xl hover:bg-[#FFFFFF] border border-transparent hover:border-[#E5E7EB] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#16834A]" />
          <span>Return to Guest Invitation</span>
        </button>

        <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-[#16834A] bg-[#FFFFFF] px-3 py-1 rounded-full border border-[#E5E7EB] shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16834A]" />
          <span>Secure Enterprise Access</span>
        </span>
      </div>

      <div className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-xl p-8 sm:p-10 relative overflow-hidden">
        {/* Subtle Green Top Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#16834A] to-[#27AE60]" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <HecsLogo className="h-11 w-auto" />
          </div>

          <div className="w-12 h-12 rounded-xl bg-[#F1F8F2] border border-[#E5E7EB] flex items-center justify-center text-[#16834A] mb-3 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-bold text-[#1F2937]">
            Administrator Portal
          </h1>
          <p className="text-xs text-[#6B7280] mt-1.5 max-w-xs leading-relaxed">
            Sign in with authorized HECS administrative credentials to oversee events, guest directories, and live RSVP confirmations.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A] pr-10 transition-all"
              />
              <User className="w-4 h-4 text-[#6B7280] absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A] pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#6B7280] hover:text-[#16834A] cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-5 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white font-semibold text-sm tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
          <p className="text-[11px] text-[#6B7280] leading-relaxed">
            HECS Enterprise Portal &copy; {new Date().getFullYear()}. Restricted to authorized event hosts and system operators.
          </p>
        </div>
      </div>
    </div>
  );
};
