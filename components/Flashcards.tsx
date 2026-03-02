
import React, { useState, useMemo, useEffect } from 'react';
import { SavedMnemonic, Language } from '../types';
import { RotateCcw, Flag, ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react';
import { MnemonicCard } from './MnemonicCard';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  savedMnemonics: SavedMnemonic[];
  language: Language;
  onToggleHard: (id: string, isHard: boolean) => void;
  onToggleMastered: (id: string, isMastered: boolean) => void;
  onDetailChange?: (isOpen: boolean) => void;
  forceCloseDetail?: boolean;
}

const FLASH_T: Record<Language, any> = {
  [Language.UZBEK]: { title: "Flash-kartalar", range: "Davrni tanlang", empty: "Hali hech narsa o'rganilmagan", start: "Boshlash", next: "Keyingisi", prev: "Oldingisi", finish: "Tugatish", from: "Boshlanish sanasi", to: "Tugash sanasi", hint: "Kartani aylantirish uchun bosing", hardWords: "Qiyin so'zlar" },
  [Language.KAZAKH]: { title: "Флэш-карталар", range: "Кезеңді таңдаңыз", empty: "Әлі ештеңе үйренілмеген", start: "Бастау", next: "Келесі", prev: "Алдыңғы", finish: "Аяқтау", from: "Басталу күні", to: "Аяқталу күні", hint: "Картаны айналдыру үшін басыңыз", hardWords: "Қиын сөздер" },
  [Language.TAJIK]: { title: "Флэш-кортҳо", range: "Давраро интихоб кунед", empty: "Ҳанӯз чизе омӯхта نشدهаст", start: "Оғоз", next: "Оянда", prev: "Пешина", finish: "Анҷом", from: "Таърихи оғоз", to: "Таърихи анҷом", hint: "Барои чаппа кардани корт пахш кунед", hardWords: "Калимаҳои душвор" },
  [Language.KYRGYZ]: { title: "Флэш-карталар", range: "Мөөнөттү тандаңыз", empty: "Азырынча эч нерсе үйрөнүлө элек", start: "Баштоо", next: "Кийинки", prev: "Мурунку", finish: "Бүтүрүү", from: "Баштоо күнү", to: "Аяктоо күнү", hint: "Картаны которуу үчүн басыңыз", hardWords: "Кыйын сөздөр" },
  [Language.RUSSIAN]: { title: "Флэш-карты", range: "Выберите период", empty: "Еще ничего не выучено", start: "Начать", next: "Далее", prev: "Назад", finish: "Завершить", from: "Дата начала", to: "Дата окончания", hint: "Нажмите, чтобы перевернуть", hardWords: "Трудные слова" },
  [Language.TURKMEN]: { title: "Fleş-kartalar", range: "Döwri saýlaň", empty: "Heniz hiç zat öwrenilmedi", start: "Başlamak", next: "Indiki", prev: "Öňki", finish: "Tamamlamak", from: "Başlanýan senesi", to: "Gutarýan senesi", hint: "Kartany öwürmek üçin basyň", hardWords: "Kyn sözler" },
};

export const Flashcards: React.FC<Props> = ({ savedMnemonics, language, onToggleHard, onToggleMastered, onDetailChange, forceCloseDetail }) => {
  const t = FLASH_T[language];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [selectedWord, setSelectedWord] = useState<SavedMnemonic | null>(null);

  useEffect(() => {
    if (forceCloseDetail) {
      setSelectedWord(null);
    }
  }, [forceCloseDetail]);

  useEffect(() => {
    onDetailChange?.(!!selectedWord);
  }, [selectedWord, onDetailChange]);

  const filtered = useMemo(() => {
    return savedMnemonics.filter(m => {
      const ts = new Date(m.timestamp);
      ts.setHours(0,0,0,0);
      const from = dateFrom ? new Date(dateFrom) : null;
      if (from) from.setHours(0,0,0,0);
      const to = dateTo ? new Date(dateTo) : null;
      if (to) to.setHours(23,59,59,999);

      if (from && ts < from) return false;
      if (to && ts > to) return false;
      return true;
    });
  }, [savedMnemonics, dateFrom, dateTo]);

  // Initialize shuffled indices when starting or shuffling
  useEffect(() => {
    if (filtered.length > 0) {
      setShuffledIndices(filtered.map((_, i) => i));
    }
  }, [filtered]);

  const handleShuffle = () => {
    const indices = [...shuffledIndices];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    setCurrentIndex(0);
  };

  // Reset flip state when moving to a new card
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  if (savedMnemonics.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-6">
        <div className="text-8xl float-anim">📭</div>
        <div className="space-y-2">
          <p className="text-2xl font-black text-gray-800 dark:text-gray-200">{t.empty}</p>
          <p className="text-gray-400">{language === Language.UZBEK ? "Siz o'rgangan so'zlar avtomatik tarzda shu yerda paydo bo'ladi." : 
             language === Language.RUSSIAN ? "Выученные вами слова автоматически появятся здесь." :
             language === Language.KAZAKH ? "Сіз үйренген сөздер автоматты түрде осында пайда болады." :
             language === Language.TAJIK ? "Калимаҳои омӯхтаи шумо ба таври худкор дар ин ҷо пайдо мешаванд." :
             language === Language.KYRGYZ ? "Сиз үйрөнгөн сөздөр автоматтык түрдө бул жерде пайда болот." :
             "The words you learn will automatically appear here."}</p>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    if (selectedWord) {
      return (
        <div className="max-w-4xl mx-auto animate-fadeIn mt-4 px-4 space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 sm:p-12 shadow-2xl border border-gray-100 dark:border-slate-900 relative">
            {/* Desktop/Tablet Back Button */}
            <button 
              onClick={() => setSelectedWord(null)}
              className="hidden md:flex absolute top-8 left-8 w-12 h-12 items-center justify-center bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm z-10"
            >
              <ChevronLeft size={24} />
            </button>
            
            <MnemonicCard 
              data={selectedWord.data} 
              imageUrl={selectedWord.imageUrl} 
              language={language} 
            />
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto animate-fadeIn mt-8 sm:mt-12 px-4 space-y-6 sm:space-y-8">
        {/* Main Setup Container */}
        <div className="bg-white dark:bg-[#0f172a] p-8 sm:p-16 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 text-center space-y-8 sm:space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight">{t.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg sm:text-xl font-medium">{t.range}</p>
          </div>

          {/* Date Range inside Main Container */}
          <div className="grid grid-cols-2 gap-3 sm:gap-8">
            <div className="space-y-2 sm:space-y-3">
              <span className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2 sm:ml-4">{t.from}</span>
              <div className="relative group">
                <input 
                  type="date" 
                  value={dateFrom} 
                  onChange={e => setDateFrom(e.target.value)} 
                  className="date-input w-full pl-2 pr-1 sm:px-8 py-3 sm:py-6 bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent rounded-xl sm:rounded-[2rem] outline-none focus:border-indigo-500 font-black text-gray-900 dark:text-white transition-all text-[10px] sm:text-lg" 
                />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <span className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2 sm:ml-4">{t.to}</span>
              <div className="relative group">
                <input 
                  type="date" 
                  value={dateTo} 
                  onChange={e => setDateTo(e.target.value)} 
                  className="date-input w-full pl-2 pr-1 sm:px-8 py-3 sm:py-6 bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent rounded-xl sm:rounded-[2rem] outline-none focus:border-indigo-500 font-black text-gray-900 dark:text-white transition-all text-[10px] sm:text-lg" 
                />
              </div>
            </div>
          </div>

          <button 
            disabled={filtered.length === 0}
            onClick={() => setIsStarted(true)}
            className="w-full py-6 sm:py-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-2xl sm:rounded-[2rem] font-black text-xl sm:text-3xl shadow-2xl shadow-indigo-500/20 transition-all active:scale-95 transform hover:-translate-y-1"
          >
            {t.start} <span className="opacity-50 ml-2">({filtered.length})</span>
          </button>
        </div>

        {/* Hard Words Container */}
        {savedMnemonics.filter(m => m.isHard).length > 0 && (
          <div className="bg-white dark:bg-[#0f172a] p-6 sm:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-gray-400 px-2">
              <Flag size={14} className="text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.hardWords}</span>
            </div>
            <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {savedMnemonics
                .filter(m => m.isHard)
                .map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => setSelectedWord(m)}
                    className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800 rounded-2xl group hover:border-red-500/30 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-700">
                      <img src={m.imageUrl} className="w-full h-full object-cover" alt={m.word} referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 dark:text-white font-black text-lg leading-tight">{m.word}</h4>
                      <p className="text-gray-500 font-mono text-xs">[{m.data.transcription}]</p>
                    </div>
                    <div className="text-gray-600 group-hover:text-red-500 transition-colors">
                      <Flag size={16} fill="currentColor" />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const current = filtered[shuffledIndices[currentIndex]];

  return (
    <div className="max-w-xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn mt-4 px-4">
      <div 
        className="relative aspect-[4/5] sm:aspect-[4/4] lg:aspect-[4/3] perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-[#0f172a] rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border-4 border-gray-100 dark:border-slate-800">
            <img src={current.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Word Visual" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8 sm:p-10">
              <h3 className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-lg">{current.word}</h3>
              <p className="text-white/70 font-mono mt-2 text-lg sm:text-xl drop-shadow-md">[{current.data.transcription}]</p>
            </div>
            
            <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHard(current.id, !current.isHard);
                }}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl transition-all ${
                  current.isHard ? 'bg-red-500 text-white' : 'bg-white/10 text-white/40 hover:bg-white/20'
                }`}
              >
                <Flag size={20} fill={current.isHard ? "currentColor" : "none"} />
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMastered(current.id, !current.isMastered);
                }}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl transition-all ${
                  current.isMastered ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40 hover:bg-white/20'
                }`}
              >
                <CheckCircle size={20} fill={current.isMastered ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="absolute top-6 right-6 sm:top-8 right-8 bg-white/10 backdrop-blur-xl px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-white/60 text-[10px] sm:text-xs font-black tracking-widest border border-white/5">
              {currentIndex + 1} / {filtered.length}
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-16 flex flex-col justify-start sm:justify-center text-center shadow-2xl border-4 border-indigo-500 overflow-y-auto custom-scrollbar">
            <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-24">
              <div className="space-y-1 sm:space-y-2">
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{language === Language.UZBEK ? "So'z" : (language === Language.RUSSIAN ? "Слово" : "Word")}</span>
                <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">{current.word}</h3>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{language === Language.UZBEK ? "Ma'nosi" : (language === Language.RUSSIAN ? "Значение" : "Meaning")}</span>
                <p className="text-white font-black text-2xl sm:text-3xl px-2">{current.data.meaning}</p>
              </div>

              <div className="space-y-2 sm:space-y-3 bg-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-md border border-white/10">
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{language === Language.UZBEK ? "Tasavvur" : (language === Language.RUSSIAN ? "Воображение" : "Imagination")}</span>
                <p className="text-white/90 text-base sm:text-lg italic leading-relaxed">{current.data.imagination}</p>
              </div>

              <div className="space-y-1 sm:space-y-2">
                 <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{language === Language.UZBEK ? "Mnemonik bog'liqlik" : (language === Language.RUSSIAN ? "Мнемоническая связь" : "Mnemonic Link")}</span>
                 <p className="text-indigo-100 font-bold text-sm sm:text-base px-2">{current.data.phoneticLink}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={handleShuffle}
          className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-white rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          title="Shuffle"
        >
          <RotateCcw size={24} />
        </button>

        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          className="flex-1 py-4 sm:py-5 bg-gray-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black transition-all disabled:opacity-30 active:scale-95 text-base sm:text-lg"
          disabled={currentIndex === 0}
        >
          {t.prev}
        </button>

        <button 
          onClick={() => {
            if (currentIndex < filtered.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              setIsStarted(false);
              setCurrentIndex(0);
            }
          }}
          className="flex-[2] py-4 sm:py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-500/20 transition-all active:scale-95 text-lg sm:text-xl"
        >
          {currentIndex === filtered.length - 1 ? t.finish : t.next}
        </button>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(var(--date-icon-invert, 0));
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .date-input::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        .dark .date-input {
          --date-icon-invert: 1;
          color-scheme: dark;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};