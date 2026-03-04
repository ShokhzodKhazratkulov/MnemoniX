import React, { useState } from 'react';
import { supabase } from '../src/services/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Chrome, ArrowRight, Loader2, AlertCircle, User } from 'lucide-react';
import { Language } from '../types';

interface Props {
  onSuccess: () => void;
  language: Language;
}

export const Auth: React.FC<Props> = ({ onSuccess, language }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const t = ({
    [Language.UZBEK]: {
      signIn: "Kirish",
      signUp: "Ro'yxatdan o'tish",
      email: "Email manzili",
      password: "Parol",
      fullName: "To'liq ism",
      google: "Google orqali davom etish",
      noAccount: "Hisobingiz yo'qmi?",
      hasAccount: "Hisobingiz bormi?",
      error: "Xatolik yuz berdi",
      loading: "Yuklanmoqda...",
      welcome: "Xush kelibsiz!",
      subtitle: "MnemoniX bilan o'rganishni boshlang",
      checkEmail: "Hisobingiz yaratildi. Iltimos, tizimga kirishdan oldin elektron pochtangizni tekshiring va tasdiqlang."
    },
    [Language.RUSSIAN]: {
      signIn: "Войти",
      signUp: "Регистрация",
      email: "Email адрес",
      password: "Пароль",
      fullName: "Полное имя",
      google: "Продолжить через Google",
      noAccount: "Нет аккаунта?",
      hasAccount: "Уже есть аккаунт?",
      error: "Произошла ошибка",
      loading: "Загрузка...",
      welcome: "Добро пожаловать!",
      subtitle: "Начните учиться с MnemoniX",
      checkEmail: "Ваш аккаунт создан. Пожалуйста, проверьте почту и подтвердите адрес перед входом."
    }
  } as any)[language] || {
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name",
    google: "Continue with Google",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    error: "An error occurred",
    loading: "Loading...",
    welcome: "Welcome Back!",
    subtitle: "Start learning with MnemoniX",
    checkEmail: "Your account has been created. Please check your email and verify your address before logging in."
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (signUpError) throw signUpError;
        
        if (!data.session) {
          setSuccessMessage(t.checkEmail);
          setIsSignUp(false);
          setPassword('');
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
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
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-xl shadow-indigo-500/20">
          M
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          {isSignUp ? t.signUp : t.signIn}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">
          {t.subtitle}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t.fullName}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all"
              required
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all"
            required
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-bold"
            >
              <Sparkles size={18} />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? t.signUp : t.signIn)}
          {!loading && <ArrowRight size={20} />}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[#f8fafc] dark:bg-[#020617] text-gray-400 font-bold uppercase tracking-widest">OR</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="w-full py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-2xl font-bold text-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
      >
        <Chrome size={20} />
        {t.google}
      </button>

      <p className="text-center mt-8 text-gray-500 dark:text-gray-400 font-bold">
        {isSignUp ? t.hasAccount : t.noAccount}{' '}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setSuccessMessage(null);
          }}
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {isSignUp ? t.signIn : t.signUp}
        </button>
      </p>
    </div>
  );
};
