
import React, { useState, useMemo, useEffect } from 'react';
import { SavedMnemonic, Language } from '../types';
import { Shuffle, Flag, ChevronLeft, ChevronRight, X, CheckCircle, Volume2, Sparkles } from 'lucide-react';
import { MnemonicCard } from './MnemonicCard';
import { motion, AnimatePresence } from 'motion/react';
import { GeminiService } from '../services/geminiService';

const gemini = new GeminiService();

function decode(base64: string) {
  if (!base64) return new Uint8Array(0);
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decode error:", e);
    return new Uint8Array(0);
  }
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer | null> {
  if (data.length === 0) return null;
  const byteLength = data.byteLength;
  const bufferToUse = byteLength % 2 === 0 ? data.buffer : data.buffer.slice(0, byteLength - 1);
  const dataInt16 = new Int16Array(bufferToUse);
  const frameCount = dataInt16.length / numChannels;
  if (frameCount <= 0) return null;
  try {
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  } catch (e) {
    console.error("Error creating audio buffer:", e);
    return null;
  }
}

interface Props {
  savedMnemonics: SavedMnemonic[];
  language: Language;
  onToggleHard: (id: string, isHard: boolean) => void;
  onToggleMastered: (id: string, isMastered: boolean) => void;
  onDetailChange?: (isOpen: boolean) => void;
  onReviewChange?: (isReviewing: boolean) => void;
  onPractice?: (word: string, meaning: string) => void;
  onWordSelect?: (word: SavedMnemonic | null) => void;
  forceCloseDetail?: boolean;
  forceCloseReview?: boolean;
}

const FLASH_T: Record<Language, any> = {
  [Language.UZBEK]: { title: "Flash-kartalar", range: "Davrni tanlang", empty: "Hali hech narsa o'rganilmagan", start: "Boshlash", next: "Keyingisi", prev: "Oldingisi", finish: "Tugatish", from: "Boshlanish sanasi", to: "Tugash sanasi", hint: "Kartani aylantirish uchun bosing", hardWords: "Qiyin so'zlar" },
  [Language.KAZAKH]: { title: "Флэш-карталар", range: "Кезеңді таңдаңыз", empty: "Әлі ештеңе үйренілмеген", start: "Бастау", next: "Келесі", prev: "Алдыңғы", finish: "Аяқтау", from: "Басталу күні", to: "Аяқталу күні", hint: "Картаны айналдыру үшін басыңыз", hardWords: "Қиын сөздер" },
  [Language.TAJIK]: { title: "Флэш-кортҳо", range: "Давраро интихоб кунед", empty: "Ҳанӯз чизе омӯхта نشدهаст", start: "Оғоз", next: "Оянда", prev: "Пешина", finish: "Анҷом", from: "Таърихи оғоз", to: "Таърихи анҷом", hint: "Барои чаппа кардани корт пахш кунед", hardWords: "Калимаҳои душвор" },
  [Language.KYRGYZ]: { title: "Флэш-карталар", range: "Мөөнөттү тандаңыз", empty: "Азырынча эч нерсе үйрөнүлө элек", start: "Баштоо", next: "Кийинки", prev: "Мурунку", finish: "Бүтүрүү", from: "Баштоо күнү", to: "Аяктоо күнү", hint: "Картаны которуу үчүн басыңыз", hardWords: "Кыйын сөздөр" },
  [Language.RUSSIAN]: { title: "Флэш-карты", range: "Выберите период", empty: "Еще ничего не выучено", start: "Начать", next: "Далее", prev: "Назад", finish: "Завершить", from: "Дата начала", to: "Дата окончания", hint: "Нажмите, чтобы перевернуть", hardWords: "Трудные слова" },
  [Language.TURKMEN]: { title: "Fleş-kartalar", range: "Döwri saýlaň", empty: "Heniz hiç zat öwrenilmedi", start: "Başlamak", next: "Indiki", prev: "Öňki", finish: "Tamamlamak", from: "Başlanýan senesi", to: "Gutarýan senesi", hint: "Kartany öwürmek üçin basyň", hardWords: "Kyn sözler" },
};

export const Flashcards: React.FC<Props> = ({ 
  savedMnemonics, 
  language, 
  onToggleHard, 
  onToggleMastered, 
  onDetailChange, 
  onReviewChange, 
  onPractice,
  onWordSelect,
  forceCloseDetail, 
  forceCloseReview 
}) => {
  const t = FLASH_T[language];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const backSideRef = React.useRef<HTMLDivElement>(null);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [selectedWord, setSelectedWord] = useState<SavedMnemonic | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const sourceRef = React.useRef<AudioBufferSourceNode | null>(null);
  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const handlePlayAudio = async (text: string) => {
    if (isPlaying) {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
      setIsPlaying(false);
      return;
    }

    setIsAudioLoading(true);
    try {
      const base64Audio = await gemini.generateTTS(text, language);
      if (!base64Audio) throw new Error("No audio data");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const decodedData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioContextRef.current, 24000, 1);

      if (!audioBuffer) throw new Error("Failed to decode audio");

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        if (isMounted.current) setIsPlaying(false);
      };
      
      sourceRef.current = source;
      source.start(0);
      if (isMounted.current) setIsPlaying(true);
    } catch (error) {
      console.error("Audio error:", error);
    } finally {
      if (isMounted.current) setIsAudioLoading(false);
    }
  };

  useEffect(() => {
    if (forceCloseDetail) {
      setSelectedWord(null);
    }
  }, [forceCloseDetail]);

  useEffect(() => {
    if (forceCloseReview) {
      setIsStarted(false);
    }
  }, [forceCloseReview]);

  useEffect(() => {
    onReviewChange?.(isStarted);
  }, [isStarted, onReviewChange]);

  useEffect(() => {
    onDetailChange?.(!!selectedWord);
    onWordSelect?.(selectedWord);
  }, [selectedWord, onDetailChange, onWordSelect]);

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

  // Scroll back side to top when flipped
  useEffect(() => {
    if (isFlipped && backSideRef.current) {
      backSideRef.current.scrollTop = 0;
    }
  }, [isFlipped]);

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
        <div className="max-w-4xl mx-auto animate-fadeIn mt-4 px-2 sm:px-4 pb-24">
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-4 sm:p-12 shadow-2xl border border-gray-100 dark:border-slate-900 relative">
            {/* Back Button */}
            <button 
              onClick={() => setSelectedWord(null)}
              className="absolute top-6 left-6 sm:top-8 sm:left-8 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm z-10"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="pt-12 sm:pt-0">
              <MnemonicCard 
                data={selectedWord.data} 
                imageUrl={selectedWord.imageUrl} 
                language={language} 
              />
            </div>
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
        {filtered.filter(m => m.isHard).length > 0 && (
          <div className="bg-white dark:bg-[#0f172a] p-6 sm:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-gray-400 px-2">
              <Flag size={14} className="text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.hardWords}</span>
            </div>
            <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {filtered
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
            
            <div className="absolute top-6 right-6 sm:top-8 right-8 bg-white/10 backdrop-blur-xl px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-white/60 text-[10px] sm:text-xs font-black tracking-widest border border-white/5">
              {currentIndex + 1} / {filtered.length}
            </div>
          </div>

          {/* Back Side */}
          <div 
            ref={backSideRef}
            className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col justify-start text-center shadow-2xl border-4 border-indigo-500 overflow-y-auto custom-scrollbar"
          >
            {/* Decorative Top Bar (White Line) */}
            <div className="w-20 h-2 bg-white/30 rounded-full mx-auto mb-8 flex-shrink-0" />
            
            <div className="space-y-6 sm:space-y-10">
              <div className="space-y-1 sm:space-y-2 relative">
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{language === Language.UZBEK ? "So'z" : (language === Language.RUSSIAN ? "Слово" : "Word")}</span>
                <div className="flex items-center justify-center gap-4">
                  <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">{current.word}</h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio(current.word);
                    }}
                    disabled={isAudioLoading}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white hover:bg-white/30'
                    } disabled:opacity-50`}
                  >
                    {isAudioLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                    ) : (
                      <Volume2 size={20} />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{language === Language.UZBEK ? "Ma'nosi" : (language === Language.RUSSIAN ? "Значение" : "Meaning")}</span>
                <p className="text-white font-black text-2xl sm:text-3xl px-2">{current.data.meaning}</p>
              </div>

              <div className="space-y-1 sm:space-y-2">
                 <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{language === Language.UZBEK ? "Mnemonik bog'liqlik" : (language === Language.RUSSIAN ? "Мнемоническая связь" : "Mnemonic Link")}</span>
                 <p className="text-indigo-100 font-bold text-sm sm:text-base px-2">{current.data.phoneticLink}</p>
              </div>

              <div className="space-y-3 sm:space-y-4 bg-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-md border border-white/10">
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{language === Language.UZBEK ? "Tasavvur" : (language === Language.RUSSIAN ? "Воображение" : "Imagination")}</span>
                <p className="text-white/90 text-base sm:text-lg italic leading-relaxed">{current.data.imagination}</p>
              </div>

              {current.data.synonyms && current.data.synonyms.length > 0 && (
                <div className="space-y-1 sm:space-y-2">
                  <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{language === Language.UZBEK ? "Sinonimlar" : (language === Language.RUSSIAN ? "Синонимы" : "Synonyms")}</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {current.data.synonyms.map((syn, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white/10 rounded-lg text-xs font-medium text-white/90">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const ttsText = `${current.word}. ${current.data.meaning}. ${current.data.phoneticLink}. ${current.data.imagination}`;
                    handlePlayAudio(ttsText);
                  }}
                  disabled={isAudioLoading}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${
                    isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white hover:bg-white/30'
                  } disabled:opacity-50`}
                >
                  {isAudioLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  ) : (
                    <>
                      <Volume2 size={20} />
                      <span className="font-black uppercase tracking-widest text-xs">
                        {language === Language.UZBEK ? "Hikoyani tinglash" : (language === Language.RUSSIAN ? "Слушать историю" : "Listen Story")}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={handleShuffle}
          className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-white rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95 flex-shrink-0"
          title="Shuffle"
        >
          <Shuffle size={20} className="sm:size-6" />
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={() => onToggleHard(current.id, !current.isHard)}
            className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl transition-all ${
              current.isHard ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-red-500'
            }`}
            title="Mark as Hard"
          >
            <Flag size={20} fill={current.isHard ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={() => onToggleMastered(current.id, !current.isMastered)}
            className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl transition-all ${
              current.isMastered ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-emerald-500'
            }`}
            title="Mark as Mastered"
          >
            <CheckCircle size={20} fill={current.isMastered ? "currentColor" : "none"} />
          </button>
        </div>

        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          className="flex-1 py-3 sm:py-5 bg-gray-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black transition-all disabled:opacity-30 active:scale-95 text-sm sm:text-lg"
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
          className="flex-[1.5] py-3 sm:py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 transition-all active:scale-95 text-sm sm:text-lg"
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