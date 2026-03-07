
import React, { useMemo } from 'react';
import { SavedMnemonic, Language } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Props {
  savedMnemonics: SavedMnemonic[];
  language: Language;
  onDelete: (id: string) => void;
  t: any;
}

export const Dashboard: React.FC<Props> = ({ savedMnemonics, language, onDelete, t }) => {

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

    // Level logic: Analyze today's words first, then all words
    const todayWords = savedMnemonics.filter(m => m.timestamp >= today);
    const targetWords = todayWords.length > 0 ? todayWords : savedMnemonics;
    
    let level = "BEGINNER";
    if (targetWords.length > 0) {
      const levelCounts: Record<string, number> = {};
      targetWords.forEach(m => {
        const l = (m.data.level || 'BEGINNER').toUpperCase();
        levelCounts[l] = (levelCounts[l] || 0) + 1;
      });
      
      // Find the level with the highest count
      level = Object.entries(levelCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
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

    return { todayCount, totalCount, averageDaily, level, chartData, hardWords };
  }, [savedMnemonics]);

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

        {/* Today's Count */}
        <div className="bg-white dark:bg-slate-900/50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 transform hover:scale-105 transition-transform duration-300">
          <span className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 dark:text-white">{stats.todayCount}</span>
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
