
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, Github, Chrome, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col lg:flex-row overflow-hidden">
      {/* Left Pane - Editorial Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 p-16 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-indigo-600 font-black text-xl">M</span>
            </div>
            <span className="font-black tracking-tighter text-xl">MNEMONIX</span>
          </div>
          
          <h1 className="text-[8vw] font-black text-white leading-[0.85] tracking-tighter uppercase mb-8">
            Master<br />Words<br />Faster
          </h1>
          
          <p className="text-indigo-100 text-xl font-medium max-w-md leading-relaxed">
            Join thousands of learners using AI-powered mnemonics to build an indestructible vocabulary.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex -space-x-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-indigo-600 bg-indigo-400 overflow-hidden">
                <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
          <p className="text-indigo-100 font-bold text-sm uppercase tracking-widest">
            +12k Active Learners
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] aspect-square bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[80%] aspect-square bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      {/* Right Pane - Auth Form */}
      <div className="flex-1 flex flex-col p-6 lg:p-16 justify-center relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-8 left-8 lg:left-16 flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-bold uppercase text-xs tracking-widest"
          >
            <ArrowLeft size={16} />
            Back to App
          </button>
        )}

        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
              {isSignUp ? 'Start your journey to fluency today.' : 'Enter your details to continue learning.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-3 py-4 border-2 border-gray-100 dark:border-slate-800 rounded-2xl font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
            >
              <Chrome size={20} />
              Google
            </button>
            <button
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-3 py-4 border-2 border-gray-100 dark:border-slate-800 rounded-2xl font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
            >
              <Github size={20} />
              GitHub
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-100 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.2em] font-black">
              <span className="px-4 bg-white dark:bg-black text-gray-400">Or Email</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-2xl font-bold flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="mt-12 text-center text-gray-500 dark:text-gray-400 font-bold">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1"
            >
              {isSignUp ? 'Sign In' : 'Join Mnemonix'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
