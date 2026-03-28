
import React, { useMemo } from 'react';
import { SavedMnemonic, Language, Profile } from '../types';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Target, TrendingUp, Award } from 'lucide-react';

interface Props {
  savedMnemonics: SavedMnemonic[];
  language: Language;
  onDelete: (id: string) => void;
  t: any;
  profile?: Profile | null;
}

export const Dashboard: React.FC<Props> = ({ savedMnemonics, language, onDelete, t, profile }) => {

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const todayCount = savedMnemonics.filter(m => m.timestamp >= today).length;
    const totalCount = savedMnemonics.length;
    const hardWords = savedMnemonics.filter(m => m.isHard);
    
    // Average daily (last 7 days)
    const sevenDaysAgo = today - (7 * 24 * 60 * 60 * 1000);
    const last7DaysCount = savedMnemonics.filter(m => m.timestamp >= sevenDaysAgo).length;
    const averageDaily = Math.round(last7DaysCount / 7);

    // Level logic
    let level = t.beginner;
    if (savedMnemonics.length > 0) {
      const levelCounts: Record<string, number> = {
        [t.beginner]: 0,
        [t.intermediate]: 0,
        [t.advanced]: 0
      };
      
      savedMnemonics.forEach(m => {
        const rawLevel = (m.data.level || 'BEGINNER').toUpperCase();
        if (rawLevel.includes('ADVANCED')) {
          levelCounts[t.advanced]++;
        } else if (rawLevel.includes('INTERMEDIATE')) {
          levelCounts[t.intermediate]++;
        } else {
          levelCounts[t.beginner]++;
        }
      });
      
      level = Object.entries(levelCounts).reduce((a, b) => a[1] >= b[1] ? a : b)[0];
    }

    // Chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today - (i * 24 * 60 * 60 * 1000));
      const dayStart = d.getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      const count = savedMnemonics.filter(m => m.timestamp >= dayStart && m.timestamp < dayEnd).length;
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let label = dayNames[d.getDay()];
      
      chartData.push({ name: label, count });
    }

    // IELTS targets
    const ieltsTargets: Record<number, number> = {
      5: 4000,
      5.5: 4500,
      6: 5000,
      6.5: 6000,
      7: 7000,
      7.5: 8500,
      8: 10000,
      8.5: 11000,
      9: 12000
    };
    const targetWords = ieltsTargets[profile?.ielts_goal || 7] || 7000;
    const ieltsProgress = Math.min(100, (totalCount / targetWords) * 100);

    return { todayCount, totalCount, averageDaily, level, chartData, hardWords, targetWords, ieltsProgress };
  }, [savedMnemonics, profile]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn pb-20 px-4">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">{t.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">{t.stats}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Learned */}
        <div className="bg-indigo-600 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 flex flex-col items-center justify-center text-center space-y-2 transform hover:scale-105 transition-transform duration-300">
          <span className="text-4xl sm:text-5xl lg:text-7xl font-black text-white">{stats.totalCount}</span>
          <span className="text-indigo-100 font-black text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] uppercase leading-tight">{t.total}</span>
        </div>

        {/* Today's Count / Goal */}
        <div className="bg-white dark:bg-slate-900/50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 dark:text-white">{stats.todayCount}</span>
            {profile?.daily_goal && (
              <span className="text-xl sm:text-2xl font-black text-gray-400">/ {profile.daily_goal}</span>
            )}
          </div>
          <span className="text-gray-400 dark:text-gray-500 font-black text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] uppercase leading-tight">{t.today}</span>
        </div>

        {/* Daily Average */}
        <div className="bg-white dark:bg-slate-900/50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 transform hover:scale-105 transition-transform duration-300">
          <span className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 dark:text-white">{stats.averageDaily}</span>
          <span className="text-gray-400 dark:text-gray-500 font-black text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] uppercase leading-tight">{t.average}</span>
        </div>

        {/* Word Level */}
        <div className="bg-white dark:bg-slate-900/50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 transform hover:scale-105 transition-transform duration-300 overflow-hidden">
          <span className="text-lg sm:text-xl lg:text-2xl font-black text-indigo-500 dark:text-indigo-400 tracking-tight whitespace-nowrap">{stats.level}</span>
          <span className="text-gray-400 dark:text-gray-500 font-black text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] uppercase leading-tight">{t.level}</span>
        </div>
      </div>

      {/* IELTS Roadmap */}
      <div className="bg-white dark:bg-slate-900/50 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 text-amber-500">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            <h3 className="text-sm sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t.ieltsRoadmap}</h3>
            <span className="sm:hidden text-lg font-black text-indigo-600 dark:text-indigo-400 ml-2">{Math.round(stats.ieltsProgress)}%</span>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-2xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">{Math.round(stats.ieltsProgress)}%</div>
            <div className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">{t.progressLabel}</div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-6">
          <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{t.goal}: <span className="text-indigo-600 dark:text-indigo-400 font-black">{profile?.ielts_goal ? (profile.ielts_goal % 1 === 0 ? `${profile.ielts_goal}.0` : profile.ielts_goal) : '7.0'} Band Score</span></p>
          
          <div className="relative h-3 sm:h-6 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out"
              style={{ width: `${stats.ieltsProgress}%` }}
            />
            {/* Markers */}
            <div className="absolute top-0 left-0 w-full h-full flex justify-between px-1 pointer-events-none">
              {[0, 25, 50, 75, 100].map(m => (
                <div key={m} className="h-full w-px bg-white/20" />
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[8px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
            <span>0 {t.words}</span>
            <div className="flex items-center gap-1 sm:gap-2 text-indigo-600 dark:text-indigo-400">
              <TrendingUp size={10} className="sm:w-3.5 sm:h-3.5" />
              <span>{stats.totalCount} {t.learned}</span>
            </div>
            <span>{stats.targetWords} {t.words}</span>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white dark:bg-slate-900/50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-6 sm:mb-12">{t.progress}</h3>
        
        <div className="h-[250px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={true} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                domain={[0, 50]}
                ticks={[0, 10, 20, 30, 40, 50]}
                width={40}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '1rem', 
                  color: '#fff',
                  fontWeight: 'bold'
                }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#4f46e5" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
