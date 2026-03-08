
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  LayoutDashboard, 
  Layers, 
  User as UserIcon, 
  Mic, 
  MessageSquare, 
  LogOut,
  Loader2,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Brain,
  Moon,
  Sun,
  Languages,
  Home,
  Globe
} from 'lucide-react';

import { Language, AppState, AppView, MnemonicResponse, SavedMnemonic, Post } from './types';
import { GeminiService } from './services/geminiService';
import { usePosts } from './context/PostContext';
import { supabase } from './supabaseClient';
import { getStorageUrl } from './services/supabase';

// Components
import { Dashboard } from './components/Dashboard';
import { Flashcards } from './components/Flashcards';
import { MnemonicCard } from './components/MnemonicCard';
import { VoiceMode } from './components/VoiceMode';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import AboutSection from './components/AboutSection';
import { SearchPage } from './components/SearchPage';
import { FeedbackModal } from './components/FeedbackModal';
import { Posts } from './components/Posts';
import { PracticePartner } from './components/PracticePartner';

import { TRANSLATIONS } from './constants/translations';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [hasKey, setHasKey] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const gemini = React.useMemo(() => new GeminiService(), []);

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [viewHistory, setViewHistory] = useState<AppView[]>([]);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [isFlashcardDetailOpen, setIsFlashcardDetailOpen] = useState(false);
  const [isFlashcardReviewOpen, setIsFlashcardReviewOpen] = useState(false);
  const [forceCloseFlashcardDetail, setForceCloseFlashcardDetail] = useState(false);
  const [forceCloseFlashcardReview, setForceCloseFlashcardReview] = useState(false);
  const [language, setLanguage] = useState<Language>(Language.UZBEK);
  const [searchQuery, setSearchQuery] = useState('');
  const [mnemonic, setMnemonic] = useState<MnemonicResponse | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [savedMnemonics, setSavedMnemonics] = useState<SavedMnemonic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { posts, fetchPosts } = usePosts();
  const [showFeedback, setShowFeedback] = useState(false);

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      if (session?.user) setIsGuest(false);
      setIsAuthReady(true);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        // If we are on the AUTH view, navigate home after successful OAuth redirect
        setView(prev => prev === AppView.AUTH ? AppView.HOME : prev);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user words
  const fetchUserWords = async () => {
    if (!user) {
      setSavedMnemonics([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_words')
        .select(`
          *,
          mnemonics (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted: SavedMnemonic[] = data.map((uw: any) => ({
          id: uw.id,
          word: uw.mnemonics.word,
          data: uw.mnemonics.data,
          imageUrl: uw.mnemonics.image_url,
          timestamp: new Date(uw.created_at).getTime(),
          language: language,
          isHard: uw.is_hard,
          isMastered: uw.is_mastered
        }));
        setSavedMnemonics(formatted);
      }
    } catch (err) {
      console.error('Error fetching user words:', err);
    }
  };

  useEffect(() => {
    if (isAuthReady && user) {
      fetchUserWords();
    }
  }, [user, isAuthReady]);

  // Protect private views on auth change
  useEffect(() => {
    if (isAuthReady && !user) {
      const privateViews = [
        AppView.DASHBOARD,
        AppView.FLASHCARDS,
        AppView.PROFILE,
        AppView.MY_POSTS,
        AppView.MY_REMIXES,
        AppView.CREATE_POST,
        AppView.PRACTICE
      ];
      if (privateViews.includes(view)) {
        setView(AppView.AUTH);
      }
    }
  }, [user, view, isAuthReady]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const t = TRANSLATIONS[language];

  const navigateTo = async (newView: AppView) => {
    if (newView !== view) {
      // Protect private views
      const privateViews = [
        AppView.DASHBOARD,
        AppView.FLASHCARDS,
        AppView.PROFILE,
        AppView.MY_POSTS,
        AppView.MY_REMIXES,
        AppView.CREATE_POST,
        AppView.PRACTICE
      ];

      if (privateViews.includes(newView)) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setView(AppView.AUTH);
          return;
        }
      }

      if (newView !== AppView.CREATE_POST) {
        setRemixSource(null);
        setEditingPost(null);
      }
      setViewHistory(prev => [...prev, view]);
      setView(newView);
    }
  };

  const goBack = () => {
    // 1. If reviewing flashcards, go back to flashcards list
    if (view === AppView.FLASHCARDS && isFlashcardReviewOpen) {
      setForceCloseFlashcardReview(true);
      setTimeout(() => setForceCloseFlashcardReview(false), 100);
      return;
    }

    // 2. If viewing flashcard detail (hard word), go back to flashcards list
    if (view === AppView.FLASHCARDS && isFlashcardDetailOpen) {
      setForceCloseFlashcardDetail(true);
      setTimeout(() => setForceCloseFlashcardDetail(false), 100);
      return;
    }

    // 3. Specific views that should always go to HOME
    if (view === AppView.FLASHCARDS || view === AppView.DASHBOARD || view === AppView.SEARCH || view === AppView.POSTS) {
      setView(AppView.HOME);
      setViewHistory([]);
      return;
    }

    if (view === AppView.MY_POSTS) {
      setView(AppView.PROFILE);
      return;
    }

    if (view === AppView.CREATE_POST) {
      setView(AppView.POSTS);
      return;
    }

    if (view === AppView.AUTH) {
      setView(AppView.HOME);
      return;
    }

    if (view === AppView.PRACTICE) {
      setView(AppView.SEARCH);
      return;
    }

    // 4. Default back behavior
    if (viewHistory.length > 0) {
      const prev = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setView(prev);
    } else if (view !== AppView.HOME) {
      setView(AppView.HOME);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme as 'light' | 'dark');
    
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const [loadingMessage, setLoadingMessage] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setState(AppState.LOADING);
    setLoadingMessage(t.checkingSpelling);
    setError(null);
    setMnemonic(null);
    setImageUrl('');

    try {
      let correctedWord = await gemini.checkSpelling(searchQuery);
      correctedWord = correctedWord.toLowerCase().trim();
      
      // 1. Check if word exists in global mnemonics library
      let mnemonicData: MnemonicResponse;
      let img: string;
      let audio: string | undefined;

      const { data: existingMnemonic } = await supabase
        .from('mnemonics')
        .select('*')
        .eq('word', correctedWord)
        .single();

      if (existingMnemonic) {
        mnemonicData = existingMnemonic.data as MnemonicResponse;
        img = existingMnemonic.image_url;
        audio = existingMnemonic.audio_url;
      } else {
        // Generate new
        setLoadingMessage(t.loadingMnemonic);
        mnemonicData = await gemini.getMnemonic(correctedWord, language);
        
        setLoadingMessage(t.loadingImage);
        const base64Image = await gemini.generateImage(mnemonicData.imagePrompt);
        
        // Upload image to storage
        let storedImageUrl = '';
        if (base64Image) {
          try {
            const imageBlob = await (await fetch(base64Image)).blob();
            const fileName = `${correctedWord}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
              .from('mnemonic_assets')
              .upload(`images/${fileName}`, imageBlob, { upsert: true });
            
            if (!uploadError) {
              storedImageUrl = getStorageUrl('mnemonic_assets', `images/${fileName}`);
            } else {
              console.error('Image upload error:', uploadError);
            }
          } catch (imgErr) {
            console.error('Error processing image for upload:', imgErr);
          }
        }

        // Generate and upload audio
        let storedAudioUrl = '';
        const ttsText = `${mnemonicData.word}. ${mnemonicData.meaning}. ${mnemonicData.imagination}. ${mnemonicData.connectorSentence}`;
        const base64Audio = await gemini.generateTTS(ttsText, language);
        
        if (base64Audio) {
          try {
            const audioResponse = await fetch(`data:audio/wav;base64,${base64Audio}`);
            const audioBlob = await audioResponse.blob();
            const audioFileName = `${correctedWord}-${Date.now()}.wav`;
            const { error: audioUploadError } = await supabase.storage
              .from('mnemonic_assets')
              .upload(`audio/${audioFileName}`, audioBlob, { upsert: true });
            
            if (!audioUploadError) {
              storedAudioUrl = getStorageUrl('mnemonic_assets', `audio/${audioFileName}`);
            } else {
              console.error('Audio upload error:', audioUploadError);
            }
          } catch (audioErr) {
            console.error('Error processing audio for upload:', audioErr);
          }
        }

        img = storedImageUrl || base64Image;
        audio = storedAudioUrl;
        mnemonicData.audioUrl = audio;

        // Save to global library
        const { data: newMnemonic, error: insertError } = await supabase.from('mnemonics').insert({
          word: correctedWord,
          data: mnemonicData,
          image_url: img,
          audio_url: audio,
          language: language,
          keyword: mnemonicData.phoneticLink,
          story: mnemonicData.imagination
        }).select().single();

        if (insertError) {
          console.error('Error inserting mnemonic:', insertError);
          throw new Error(`Supabase Mnemonic Insert Error: ${insertError.message} (${insertError.code})`);
        }

        // 2. Automatically create a post if user is logged in
        if (user && newMnemonic) {
          const { error: postError } = await supabase.from('posts').insert({
            user_id: user.id,
            mnemonic_id: newMnemonic.id,
            language: language,
            mnemonic_data: {
              english_word: mnemonicData.word,
              native_keyword: mnemonicData.phoneticLink,
              story: mnemonicData.imagination
            },
            visuals: {
              user_uploaded_image: img,
              ui_style: theme
            },
            engagement: {
              likes: 0,
              dislikes: 0,
              impression_emojis: [
                { emoji: "🧠", count: 0 },
                { emoji: "🔥", count: 0 },
                { emoji: "🌸", count: 0 },
                { emoji: "💡", count: 0 }
              ]
            }
          });
          if (postError) {
            console.error('Error creating automatic post:', postError);
            throw new Error(`Supabase Post Insert Error: ${postError.message} (${postError.code})`);
          } else {
            fetchPosts(); // Refresh feed
          }
        }
      }

      setMnemonic(mnemonicData);
      setImageUrl(img);
      setState(AppState.RESULTS);
      setLoadingMessage('');

      // 2. Save to user's personal list if logged in
      if (user) {
        const { data: wordRecord, error: fetchError } = await supabase
          .from('mnemonics')
          .select('id')
          .eq('word', correctedWord)
          .single();

        if (fetchError) {
          console.error('Error fetching word record:', fetchError);
          throw new Error(`Supabase Fetch Error: ${fetchError.message}`);
        }

        if (wordRecord) {
          const { error: upsertError } = await supabase
            .from('user_words')
            .upsert({
              user_id: user.id,
              word_id: wordRecord.id,
              last_reviewed_at: new Date().toISOString(),
              is_mastered: false
            }, { onConflict: 'user_id,word_id' });
          
          if (upsertError) {
            console.error('Error upserting user word:', upsertError);
            throw new Error(`Supabase UserWord Upsert Error: ${upsertError.message}`);
          }
          fetchUserWords();
        }
      } else {
        // Guest mode - local state only
        const newSavedMnemonic: SavedMnemonic = {
          id: Math.random().toString(36).substr(2, 9),
          word: mnemonicData.word,
          data: mnemonicData,
          imageUrl: img,
          timestamp: Date.now(),
          language: language,
          isHard: false,
          isMastered: false
        };
        setSavedMnemonics(prev => [newSavedMnemonic, ...prev]);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        setError(t.errorQuota);
      } else {
        setError(msg || t.errorGeneral);
      }
      setState(AppState.ERROR);
    }
  };

  const handleShareMnemonic = async (data: MnemonicResponse, img: string) => {
    if (!user) {
      setView(AppView.AUTH);
      return;
    }
    
    try {
      // 1. Ensure mnemonic exists in DB
      let mnemonicId;
      const { data: existing } = await supabase
        .from('mnemonics')
        .select('id')
        .eq('word', data.word)
        .maybeSingle();
        
      if (existing) {
        mnemonicId = existing.id;
      } else {
        const { data: newM, error: mErr } = await supabase
          .from('mnemonics')
          .insert({
            word: data.word,
            data: data,
            image_url: img,
            audio_url: data.audioUrl,
            language: language
          })
          .select()
          .single();
        if (mErr) throw mErr;
        mnemonicId = newM.id;
      }

      // 2. Create post
      const { error: pErr } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          mnemonic_id: mnemonicId,
          language: language
        });
      
      if (pErr) throw pErr;
      
      fetchPosts();
      setView(AppView.POSTS);
    } catch (err) {
      console.error('Error sharing mnemonic:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (user) {
      await supabase.from('user_words').delete().eq('id', id);
      fetchUserWords();
    } else {
      setSavedMnemonics(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleSavePostToLibrary = async (post: Post) => {
    try {
      // Create a full MnemonicResponse object from the post data
      const mnemonicData: MnemonicResponse = {
        word: post.mnemonic_data.english_word,
        transcription: '',
        meaning: post.mnemonic_data.native_keyword, // Fallback to keyword
        morphology: '',
        imagination: post.mnemonic_data.story,
        phoneticLink: post.mnemonic_data.native_keyword,
        connectorSentence: '',
        examples: [],
        synonyms: [],
        imagePrompt: '',
        level: 'Intermediate'
      };

      // 1. Save to global library if not exists
      const { data: existing } = await supabase
        .from('mnemonics')
        .select('id')
        .eq('word', post.mnemonic_data.english_word)
        .maybeSingle();

      if (!existing) {
        await supabase.from('mnemonics').insert({
          word: post.mnemonic_data.english_word,
          data: mnemonicData,
          image_url: post.visuals.user_uploaded_image
        });
      }

      // 2. Save to user's personal list
      if (user) {
        const { data: wordRecord } = await supabase
          .from('mnemonics')
          .select('id')
          .eq('word', post.mnemonic_data.english_word)
          .maybeSingle();

        if (wordRecord) {
          const { error: upsertError } = await supabase
            .from('user_words')
            .upsert({
              user_id: user.id,
              word_id: wordRecord.id,
              last_reviewed_at: new Date().toISOString(),
              is_mastered: false
            }, { onConflict: 'user_id,word_id' });
          
          if (!upsertError) fetchUserWords();
        }
      } else {
        // Guest mode
        const newSavedMnemonic: SavedMnemonic = {
          id: Math.random().toString(36).substr(2, 9),
          word: post.mnemonic_data.english_word,
          data: mnemonicData,
          imageUrl: post.visuals.user_uploaded_image || '',
          timestamp: Date.now(),
          language: language,
          isHard: false,
          isMastered: false
        };
        setSavedMnemonics(prev => [newSavedMnemonic, ...prev]);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleRemixPost = (post: Post) => {
    setRemixSource(post);
    setView(AppView.CREATE_POST);
  };

  const [practiceWord, setPracticeWord] = useState<{word: string, meaning: string} | null>(null);
  const [selectedFlashcardWord, setSelectedFlashcardWord] = useState<SavedMnemonic | null>(null);
  const [remixSource, setRemixSource] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const startPractice = (word: string, meaning: string) => {
    setPracticeWord({ word, meaning });
    setView(AppView.PRACTICE);
  };

  const handleToggleHard = async (id: string, isHard: boolean) => {
    if (user) {
      await supabase.from('user_words').update({ is_hard: isHard }).eq('id', id);
      fetchUserWords();
    } else {
      setSavedMnemonics(prev => prev.map(m => m.id === id ? { ...m, isHard } : m));
    }
  };

  const handleToggleMastered = async (id: string, isMastered: boolean) => {
    if (user) {
      await supabase.from('user_words').update({ is_mastered: isMastered }).eq('id', id);
      fetchUserWords();
    } else {
      setSavedMnemonics(prev => prev.map(m => m.id === id ? { ...m, isMastered } : m));
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const masteredCount = savedMnemonics.filter(m => m.isMastered).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 px-4 py-4 sm:py-6 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Desktop Logo */}
          <div 
            className="hidden md:flex items-center gap-3 cursor-pointer group"
            onClick={() => navigateTo(AppView.HOME)}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              M
            </div>
            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight hidden lg:block">
              Mnemonix
            </span>
          </div>

          {/* Mobile Back Button */}
          <div className="md:hidden flex-1 flex items-center">
            {(view !== AppView.HOME || isFlashcardDetailOpen || isFlashcardReviewOpen) && (
              <button 
                onClick={goBack}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-gray-500 dark:text-gray-400 active:scale-90 transition-transform"
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>

          {/* Mobile Centered Logo */}
          <div className="md:hidden flex-[2] flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">
              M
            </div>
            <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              Mnemonix
            </span>
          </div>

          {/* Tablet/Desktop Navigation (md and up) */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {/* Center Nav - Pill */}
            <div className="flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-100 dark:border-slate-800 p-1.5 rounded-full shadow-sm">
              {[
                { id: AppView.HOME, label: t.navHome },
                { id: AppView.SEARCH, label: t.navSearch },
                { id: AppView.POSTS, label: t.navPosts },
                { id: AppView.DASHBOARD, label: t.navDash },
                { id: AppView.FLASHCARDS, label: t.navFlash }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    view === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Voice Assistant Toggle */}
            <button 
              onClick={() => setState(AppState.VOICE_MODE)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg shadow-indigo-500/20 font-bold text-sm hover:bg-indigo-700 transition-all"
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <Mic size={18} />
            </button>

            {/* Settings Icons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setView(AppView.PROFILE)}
                className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
              >
                <UserIcon size={20} />
              </button>
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              
              {/* Language Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                >
                  <Languages size={20} />
                </button>
                
                <AnimatePresence>
                  {isLangOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50"
                    >
                      {Object.values(Language).map((l) => (
                        <button
                          key={l}
                          onClick={() => {
                            setLanguage(l);
                            setIsLangOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            language === l 
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Navigation (md:hidden) */}
          <div className="md:hidden flex-1 flex justify-end">
            {/* Hamburger Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                  isMenuOpen 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white/80 dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-gray-400'
                } shadow-sm`}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50"
                    >
                      {/* Profile */}
                      <button
                        onClick={() => {
                          setView(AppView.PROFILE);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <UserIcon size={18} />
                        {t.navProfile}
                      </button>

                      {/* Theme Toggle */}
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                      >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        {theme === 'light' ? t.darkMode : t.lightMode}
                      </button>

                      {/* Language Selector */}
                      <div className="border-t border-gray-100 dark:border-slate-800 mt-2 pt-2">
                        <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {t.langLabel}
                        </div>
                        {Object.values(Language).map((l) => (
                          <button
                            key={l}
                            onClick={() => {
                              setLanguage(l);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              language === l 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          {view === AppView.AUTH && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Auth onClose={() => goBack()} onSuccess={() => { setIsGuest(false); setView(AppView.HOME); }} />
            </motion.div>
          )}

          {view === AppView.HOME && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 sm:space-y-12"
            >
              {/* Hero Section */}
              <div className="text-center max-w-4xl mx-auto space-y-6 py-4 sm:py-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-black uppercase tracking-wider animate-bounce">
                  <Sparkles size={16} />
                  AI-Powered Learning
                </div>
                <h1 className="text-4xl sm:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1]">
                  {t.heroTitle}
                </h1>
                <p className="text-lg sm:text-2xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
                  {t.heroSubtitle}
                </p>

                <div className="grid grid-cols-2 sm:flex sm:flex-row justify-center gap-3 sm:gap-4 pt-4 sm:pt-6">
                   <button 
                    onClick={() => setView(AppView.SEARCH)}
                    className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-4 sm:px-10 sm:py-5 bg-indigo-600 text-white rounded-2xl sm:rounded-[2rem] font-black text-sm sm:text-xl shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 w-full sm:w-auto text-center"
                   >
                     <Search size={20} className="sm:w-6 sm:h-6" />
                     <span className="leading-tight">{t.btnStartSearch}</span>
                   </button>
                   <button 
                    onClick={() => setState(AppState.VOICE_MODE)}
                    className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-4 sm:px-10 sm:py-5 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-[2rem] font-black text-sm sm:text-xl text-gray-600 dark:text-gray-400 hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm w-full sm:w-auto text-center"
                   >
                     <Mic size={20} className="sm:w-6 sm:h-6" />
                     <span className="leading-tight">{t.btnVoice}</span>
                   </button>
                </div>
              </div>

              {/* Results / Loading States */}
              <div className="min-h-[200px]">
                <AboutSection t={t} />
              </div>
            </motion.div>
          )}

          {view === AppView.SEARCH && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SearchPage 
                user={user}
                language={language}
                state={state}
                mnemonic={mnemonic}
                imageUrl={imageUrl}
                error={error}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                handleShare={handleShareMnemonic}
                savedMnemonics={savedMnemonics}
                setState={setState}
                onNavigate={navigateTo}
                t={t}
                loadingMessage={loadingMessage}
              />
            </motion.div>
          )}

          {view === AppView.DASHBOARD && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard savedMnemonics={savedMnemonics} language={language} onDelete={handleDelete} t={t.dashboard} />
            </motion.div>
          )}

          {view === AppView.FLASHCARDS && (
            <motion.div key="flashcards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Flashcards 
                savedMnemonics={savedMnemonics} 
                language={language} 
                onToggleHard={handleToggleHard}
                onToggleMastered={handleToggleMastered}
                onDetailChange={(isOpen) => {
                  setIsFlashcardDetailOpen(isOpen);
                  if (!isOpen) setSelectedFlashcardWord(null);
                }}
                onReviewChange={setIsFlashcardReviewOpen}
                onWordSelect={setSelectedFlashcardWord}
                forceCloseDetail={forceCloseFlashcardDetail}
                forceCloseReview={forceCloseFlashcardReview}
                onPractice={startPractice}
              />
            </motion.div>
          )}

          {view === AppView.PROFILE && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Profile 
                user={user} 
                savedMnemonics={savedMnemonics}
                totalWords={savedMnemonics.length} 
                masteredCount={masteredCount}
                userPostCount={posts.filter(p => p.post_metadata.user_id === user?.id).length}
                userRemixCount={posts.filter(p => p.post_metadata.user_id === user?.id && !!p.remix_data).length}
                onSignOut={async () => { 
                  await supabase.auth.signOut();
                  setIsGuest(false); 
                  setUser(null); 
                }} 
                onSignIn={() => navigateTo(AppView.AUTH)}
                onNavigate={navigateTo}
                language={language}
                t={t.profile}
              />
            </motion.div>
          )}

          {view === AppView.POSTS && (
            <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Posts 
                user={user} 
                language={language} 
                theme={theme} 
                viewMode="all" 
                onNavigate={navigateTo}
                onSaveToLibrary={handleSavePostToLibrary}
                onRemix={handleRemixPost}
                onEditPost={(post) => {
                  setEditingPost(post);
                  setView(AppView.CREATE_POST);
                }}
              />
            </motion.div>
          )}

          {view === AppView.MY_POSTS && (
            <motion.div key="my-posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Posts 
                user={user} 
                language={language} 
                theme={theme} 
                viewMode="mine" 
                onNavigate={navigateTo}
                onSaveToLibrary={handleSavePostToLibrary}
                onRemix={handleRemixPost}
                onEditPost={(post) => {
                  setEditingPost(post);
                  setView(AppView.CREATE_POST);
                }}
              />
            </motion.div>
          )}

          {view === AppView.MY_REMIXES && (
            <motion.div key="my-remixes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Posts 
                user={user} 
                language={language} 
                theme={theme} 
                viewMode="remixes" 
                onNavigate={navigateTo}
                onSaveToLibrary={handleSavePostToLibrary}
                onRemix={handleRemixPost}
                onEditPost={(post) => {
                  setEditingPost(post);
                  setView(AppView.CREATE_POST);
                }}
              />
            </motion.div>
          )}

          {view === AppView.CREATE_POST && (
            <motion.div key="create-post" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Posts 
                user={user} 
                language={language} 
                theme={theme} 
                viewMode="create" 
                onNavigate={navigateTo}
                onSaveToLibrary={handleSavePostToLibrary}
                onRemix={handleRemixPost}
                remixSource={remixSource}
                editingPost={editingPost}
              />
            </motion.div>
          )}

          {view === AppView.PRACTICE && (practiceWord || mnemonic || selectedFlashcardWord || savedMnemonics.length > 0) && (
            <PracticePartner 
              word={practiceWord?.word || mnemonic?.word || selectedFlashcardWord?.word || savedMnemonics[0]?.data.word}
              meaning={practiceWord?.meaning || mnemonic?.meaning || selectedFlashcardWord?.data.meaning || savedMnemonics[0]?.data.meaning}
              language={language}
              onClose={() => {
                setView(AppView.SEARCH);
                setPracticeWord(null);
              }}
              onComplete={async () => {
                const wordToMaster = practiceWord?.word || mnemonic?.word || savedMnemonics[0]?.data.word;
                const savedWord = savedMnemonics.find(m => m.word === wordToMaster);
                if (savedWord && !savedWord.isMastered) {
                  await handleToggleMastered(savedWord.id, true);
                }
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Floating Practice Button */}
      <AnimatePresence>
        {((view === AppView.SEARCH && mnemonic) || (view === AppView.FLASHCARDS && selectedFlashcardWord)) && (
          <motion.button
            initial={{ opacity: 0, scale: 0, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0, x: 50 }}
            onClick={() => setView(AppView.PRACTICE)}
            className="fixed right-6 bottom-24 md:bottom-8 z-[60] flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-full font-black shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:scale-110 transition-all active:scale-95 group"
          >
            <div className="relative">
              <Sparkles size={18} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-indigo-600 animate-pulse" />
            </div>
            <span className="hidden sm:inline">Practice</span>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-4 px-3 py-1.5 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold uppercase tracking-widest">
              Master "{mnemonic?.word || selectedFlashcardWord?.word || savedMnemonics[0]?.data.word}" now
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-gray-100 dark:border-slate-800/50 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1">
          {[
            { id: AppView.HOME, icon: <Home size={22} />, label: t.navHome },
            { id: AppView.SEARCH, icon: <Search size={22} />, label: t.navSearch },
            { id: AppView.POSTS, icon: <MessageSquare size={22} />, label: t.navPosts },
            { id: AppView.DASHBOARD, icon: <LayoutDashboard size={22} />, label: t.navDash },
            { id: AppView.FLASHCARDS, icon: <Layers size={22} />, label: t.navFlash }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                view === item.id 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${view === item.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-bold mt-0 ${view === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {state === AppState.VOICE_MODE && (
          <VoiceMode onClose={() => setState(AppState.IDLE)} targetLanguage={language} />
        )}
        {showFeedback && (
          <FeedbackModal 
            onClose={() => setShowFeedback(false)} 
            language={language} 
            receiverEmail="khazratkulovusa@gmail.com" 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
