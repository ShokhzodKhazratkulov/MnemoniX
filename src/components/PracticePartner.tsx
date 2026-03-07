
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Loader2, User, Bot } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { Language } from '../types';

interface Props {
  word: string;
  meaning: string;
  language: Language;
  onClose: () => void;
  onComplete?: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const gemini = new GeminiService();

export const PracticePartner: React.FC<Props> = ({ word, meaning, language, onClose, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sentencesCount, setSentencesCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    const startSession = async () => {
      setIsLoading(true);
      try {
        const response = await gemini.getPracticeResponse(word, meaning, language, []);
        if (response) {
          setMessages([{ role: 'model', text: response }]);
        }
      } catch (error) {
        console.error("Practice session error:", error);
        setMessages([{ role: 'model', text: "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring!" }]);
      } finally {
        setIsLoading(false);
      }
    };
    startSession();
  }, [word, meaning, language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || sentencesCount >= 5) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await gemini.getPracticeResponse(word, meaning, language, history);
      if (response) {
        setMessages(prev => [...prev, { role: 'model', text: response }]);
        // Simple heuristic: if the AI praises the user, count it as a successful sentence
        // In a real app, we might check the AI's structured output, but for now we'll increment on every model response
        setSentencesCount(prev => Math.min(5, prev + 1));
      }
    } catch (error) {
      console.error("Practice message error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gray-50 dark:bg-slate-950 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={20} />
                Practice Partner
              </h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Word: <span className="text-indigo-600">{word}</span> • {sentencesCount}/5 sentences
              </p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div 
                key={step}
                className={`w-8 h-2 rounded-full transition-all duration-500 ${
                  step <= sentencesCount ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 overflow-y-auto space-y-6">
        {messages.map((m, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
            }`}>
              {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[85%] sm:max-w-[70%] p-5 rounded-3xl text-base font-medium leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-tr-none border border-gray-100 dark:border-slate-800' 
                : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 rounded-tl-none border border-indigo-100/50 dark:border-indigo-800/30'
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-gray-400 font-bold text-xs uppercase tracking-widest px-14">
            <Loader2 size={16} className="animate-spin" />
            AI is thinking...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 p-4 sm:p-8 sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto">
          <div className="relative flex items-center gap-4">
            <div className="relative flex-1">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || sentencesCount >= 5}
                placeholder={sentencesCount >= 5 ? "Mashg'ulot yakunlandi!" : "Write your sentence in English..."}
                className="w-full pl-6 pr-14 py-4 bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-[2rem] outline-none transition-all font-bold text-gray-900 dark:text-white disabled:opacity-50 shadow-inner"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading || sentencesCount >= 5}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:scale-90 shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <Send size={20} />
              </button>
            </div>
            
            {sentencesCount >= 5 && (
              <button 
                type="button"
                onClick={() => {
                  if (onComplete) onComplete();
                  onClose();
                }}
                className="px-8 py-4 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95"
              >
                Finish
              </button>
            )}
          </div>
          <p className="mt-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            {sentencesCount < 5 ? `Step ${sentencesCount + 1} of 5` : "Challenge Complete!"}
          </p>
        </form>
      </div>
    </motion.div>
  );
};
