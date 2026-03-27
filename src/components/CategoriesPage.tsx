import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, Briefcase, Heart, Globe, FlaskConical, Palette, Scale, Building2, Users, Coffee, TreePine, Newspaper, Gavel, Landmark, Cpu, Stethoscope, GraduationCap, ShieldAlert } from 'lucide-react';
import { SavedMnemonic, AppView } from '../types';

interface Props {
  savedMnemonics: SavedMnemonic[];
  onNavigate: (view: AppView) => void;
  onSelectCategory: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Crime': ShieldAlert,
  'Technology': Cpu,
  'Medicine': Stethoscope,
  'Education': GraduationCap,
  'Environment': TreePine,
  'Economy': Landmark,
  'Travel': Globe,
  'Food': Coffee,
  'Sports': Users,
  'Art': Palette,
  'Science': FlaskConical,
  'Law': Gavel,
  'Business': Briefcase,
  'Health': Heart,
  'History': BookOpen,
  'Politics': Landmark,
  'Media': Newspaper,
  'Nature': TreePine,
  'People': Users,
  'Daily Life': Coffee,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Crime': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  'Technology': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Medicine': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Education': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Environment': 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  'Economy': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'Travel': 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  'Food': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'Sports': 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  'Art': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  'Science': 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Law': 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
  'Business': 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  'Health': 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  'History': 'bg-stone-100 text-stone-600 dark:bg-stone-900/30 dark:text-stone-400',
  'Politics': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Media': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Nature': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  'People': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'Daily Life': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export const CategoriesPage: React.FC<Props> = ({ savedMnemonics, onNavigate, onSelectCategory }) => {
  const categories = Array.from(new Set(savedMnemonics.map(m => m.data.category).filter(Boolean))) as string[];
  
  const getWordCount = (category: string) => {
    return savedMnemonics.filter(m => m.data.category === category).length;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate(AppView.PROFILE)}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 hover:scale-110 transition-transform active:scale-95"
        >
          <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Kategoriyalar</h2>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center shadow-xl border border-gray-100 dark:border-slate-800">
          <BookOpen size={64} className="mx-auto text-gray-200 dark:text-slate-800 mb-6" />
          <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">Hali hech qanday so'z kategoriyalanmagan.</p>
          <p className="text-gray-400 dark:text-gray-500 mt-2">Yangi so'zlarni qidiring va ular avtomatik ravishda kategoriyalarga ajratiladi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((category, index) => {
            const Icon = CATEGORY_ICONS[category] || BookOpen;
            const colorClass = CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-600';
            
            return (
              <motion.button
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectCategory(category)}
                className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-lg border border-gray-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500 transition-all text-left"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 ${colorClass} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{category}</h3>
                    <p className="text-gray-500 dark:text-gray-400 font-bold">{getWordCount(category)} so'z</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};
