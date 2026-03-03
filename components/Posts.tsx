
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Image as ImageIcon, 
  X, 
  Send,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Clock,
  Loader2,
  Search,
  ChevronLeft,
  Mic,
  Eye
} from 'lucide-react';
import { Language, Post, AppView } from '../types';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import { usePosts } from '../PostContext';

interface Props {
  user: User | null;
  language: Language;
  theme: 'light' | 'dark';
  viewMode?: 'all' | 'mine' | 'create';
  onNavigate?: (view: AppView) => void;
}

export const Posts: React.FC<Props> = ({ user, language, theme, viewMode = 'all', onNavigate }) => {
  const { posts, addPost, updatePost, isLoading: contextLoading } = usePosts();
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPost, setNewPost] = useState({
    english_word: '',
    native_keyword: '',
    story: '',
    image: null as string | null
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filter posts based on viewMode, search, and language
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.mnemonic_data.english_word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.mnemonic_data.native_keyword.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Automatic filter by user's language for the main feed
    const matchesLanguage = viewMode === 'all' ? post.language === language : true;

    if (viewMode === 'mine') {
      return post.post_metadata.user_id === user?.id && matchesSearch;
    }
    return matchesSearch && matchesLanguage;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        
        // Use the existing uploadBase64 from supabase.ts
        const { uploadBase64 } = await import('../services/supabase');
        const publicUrl = await uploadBase64(base64, 'posts', fileName, file.type);
        setNewPost(prev => ({ ...prev, image: publicUrl }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
    }
  };

  const t = {
    [Language.UZBEK]: {
      title: "Hamjamiyat",
      create: "Post yaratish",
      placeholderWord: "Inglizcha so'z",
      placeholderKeyword: "Fonetik bog'liqlik (Kalit so'z)",
      placeholderStory: "Tasavvur hikoyasi (Absurd va qiziqarli)",
      post: "Ulashish",
      cancel: "Bekor qilish",
      empty: "Hozircha postlar yo'q. Birinchilardan bo'lib ulashing!",
      loginRequired: "Post yaratish uchun tizimga kiring",
      researchNote: "Tadqiqot siri: Raugh va Atkinson tajribasi shuni ko'rsatdiki, foydalanuvchi tasvirni o'zi tasavvur qilganda, usul 2-3 baravar samaraliroq bo'ladi.",
      searchPlaceholder: "So'zlarni yoki kalit so'zlarni qidirish...",
      yourPosts: "Sening Postlaring",
      revealImage: "Tasvirni ko'rish"
    },
    [Language.RUSSIAN]: {
      title: "Сообщество",
      create: "Создать пост",
      placeholderWord: "Английское слово",
      placeholderKeyword: "Фонетическая связь (Ключевое слово)",
      placeholderStory: "История воображения (Абсурдная и интересная)",
      post: "Поделиться",
      cancel: "Отмена",
      empty: "Пока нет постов. Будьте первым!",
      loginRequired: "Войдите, чтобы создать пост",
      researchNote: "Секрет исследования: Эксперимент Ро и Аткинсона показал, что метод в 2-3 раза эффективнее, когда пользователь сам представляет образ.",
      searchPlaceholder: "Поиск слов или ключевых слов...",
      yourPosts: "Ваши Посты",
      revealImage: "Показать изображение"
    },
    [Language.KAZAKH]: {
      title: "Қауымдастық",
      create: "Пост жасау",
      placeholderWord: "Ағылшын сөзі",
      placeholderKeyword: "Фонетикалық байланыс (Кілт сөз)",
      placeholderStory: "Елестету хикаясы (Абсурд және қызықты)",
      post: "Бөлісу",
      cancel: "Бас тарту",
      empty: "Әзірге посттар жоқ. Бірінші болып бөлісіңіз!",
      loginRequired: "Пост жасау үшін жүйеге кіріңіз",
      researchNote: "Зерттеу құпиясы: Ро мен Аткинсонның тәжірибесі көрсеткендей, пайдаланушы бейнені өзі елестеткенде әдіс 2-3 есе тиімдірек болады.",
      searchPlaceholder: "Сөздерді немесе кілт сөздерді іздеу...",
      yourPosts: "Сіздің Посттарыңыз",
      revealImage: "Кескінді көрсету"
    },
    [Language.TAJIK]: {
      title: "Ҳамҷамоа",
      create: "Эҷоди пост",
      placeholderWord: "Калимаи англисӣ",
      placeholderKeyword: "Пайванди фонетикӣ (Калимаи калидӣ)",
      placeholderStory: "Ҳикояи тасаввур (Абсурд ва ҷолиб)",
      post: "Мубодила",
      cancel: "Лағв",
      empty: "Ҳоло постҳо нест. Аввалин шуда мубодила кунед!",
      loginRequired: "Барои эҷоди пост ворид шавед",
      researchNote: "Сирри тадқиқот: Таҷрибаи Ро ва Аткинсон нишон дод, ки вақте корбар тасвирро худаш тасаввур мекунад, метод 2-3 маротиба самараноктар мешавад.",
      searchPlaceholder: "Ҷустуҷӯи калимаҳо ё калимаҳои калидӣ...",
      yourPosts: "Постҳои Шумо",
      revealImage: "Нишон додани тасвир"
    },
    [Language.KYRGYZ]: {
      title: "Коомчулук",
      create: "Пост түзүү",
      placeholderWord: "Англисче сөз",
      placeholderKeyword: "Фонетикалык байланыш (Ачкыч сөз)",
      placeholderStory: "Элестетүү окуясы (Абсурд жана кызыктуу)",
      post: "Бөлүшүү",
      cancel: "Жокко чыгаруу",
      empty: "Азырынча посттор жок. Биринчилерден болуп бөлүшүңүз!",
      loginRequired: "Пост түзүү үчүн кириңиз",
      researchNote: "Изилдөө сыры: Ро жана Аткинсондун тажрыйбасы көрсөткөндөй, колдонуучу образды өзү элестеткенде ыкма 2-3 эсе натыйжалуу болот.",
      searchPlaceholder: "Сөздөрдү же ачкыч сөздөрдү издөө...",
      yourPosts: "Сиздин Постторуңуз",
      revealImage: "Сүрөттү көрсөтүү"
    },
    [Language.TURKMEN]: {
      title: "Jemgyýet",
      create: "Post döretmek",
      placeholderWord: "Iňlisçe söz",
      placeholderKeyword: "Fonetiki baglanyşyk (Açar söz)",
      placeholderStory: "Göz öňüne getirme hekaýasy (Absurd we gyzykly)",
      post: "Paýlaşmak",
      cancel: "Bes etmek",
      empty: "Häzirlikçe postlar ýok. Birinji bolup paýlaşyň!",
      loginRequired: "Post döretmek üçin ulgama giriň",
      researchNote: "Gözleg syry: Ro we Atkinsonyň tejribesi görkezişi ýaly, ulanyjy şekili özi göz öňüne getirende usul 2-3 esse has täsirli bolýar.",
      searchPlaceholder: "Sözleri ýa-da açar sözleri gözle...",
      yourPosts: "Seniň Postlaryň",
      revealImage: "Şekili görkez"
    }
  }[language] || {
    title: "Community",
    create: "Create Post",
    placeholderWord: "English Word",
    placeholderKeyword: "Phonetic Link (Keyword)",
    placeholderStory: "Visualization Story (Absurd & Fun)",
    post: "Post",
    cancel: "Cancel",
    empty: "No posts yet. Be the first to share!",
    loginRequired: "Sign in to create a post",
    researchNote: "Research secret: Raugh and Atkinson's experiment showed that the method is 2-3 times more effective when the user imagines the image themselves.",
    searchPlaceholder: "Search words or keywords...",
    yourPosts: "Your Posts",
    revealImage: "Reveal Image"
  };

  useEffect(() => {
    // We rely on PostContext for data management
  }, []);

  const handleCreatePost = async () => {
    if (!user) return;
    if (!newPost.english_word || !newPost.native_keyword || !newPost.story) return;

    const post: Post = {
      id: Date.now().toString(),
      post_metadata: {
        username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        timestamp: Date.now(),
        user_id: user.id
      },
      mnemonic_data: {
        english_word: newPost.english_word,
        native_keyword: newPost.native_keyword,
        story: newPost.story
      },
      visuals: {
        user_uploaded_image: newPost.image,
        ui_style: theme
      },
      language: language,
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
    };

    addPost(post);
    setNewPost({ english_word: '', native_keyword: '', story: '', image: null });
    if (onNavigate) onNavigate(AppView.POSTS);
  };

  if (viewMode === 'create') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => onNavigate?.(AppView.POSTS)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {t.create}
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="space-y-3">
            <input 
              type="text"
              placeholder={t.placeholderWord}
              value={newPost.english_word}
              onChange={(e) => setNewPost({...newPost, english_word: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold"
            />
            <input 
              type="text"
              placeholder={t.placeholderKeyword}
              value={newPost.native_keyword}
              onChange={(e) => setNewPost({...newPost, native_keyword: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold"
            />
            <textarea 
              placeholder={t.placeholderStory}
              value={newPost.story}
              onChange={(e) => setNewPost({...newPost, story: e.target.value})}
              rows={5}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-medium resize-none"
            />
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium italic leading-relaxed">
              {t.researchNote}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" size={24} /> : <ImageIcon size={24} />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
              {newPost.image && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                  <img src={newPost.image} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setNewPost(prev => ({ ...prev, image: null }))}
                    className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl-lg"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCreatePost}
                disabled={!newPost.english_word || !newPost.native_keyword || !newPost.story}
                className="px-12 py-3 bg-indigo-600 text-white rounded-full font-bold text-base shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {t.post}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 px-4 sm:px-0 pt-4">
      {/* Search Bar Redesign */}
      <div className="relative flex items-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-full p-1.5 shadow-lg group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        <div className="flex-1 flex items-center px-4">
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white font-medium placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-1">
          <button className="p-3 text-gray-400 hover:text-indigo-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-all">
            <Mic size={20} />
          </button>
          <button className="p-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 hover:bg-indigo-700 transition-all active:scale-90">
            <Search size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {viewMode === 'mine' ? t.yourPosts : t.title}
        </h2>
        {viewMode !== 'mine' && (
          <button 
            onClick={() => user ? onNavigate?.(AppView.CREATE_POST) : alert(t.loginRequired)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            {t.create}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {contextLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-bold animate-pulse">Loading feed...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} theme={theme} t={t} onUpdate={(updater) => updatePost(post.id, updater)} />
          ))
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl">
            <MessageSquare size={48} className="mx-auto text-gray-200 dark:text-slate-800 mb-4" />
            <p className="text-gray-500 font-bold">{t.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post, theme: string, t: any, onUpdate: (updater: (post: Post) => Post) => void }> = ({ post, theme, t, onUpdate }) => {
  const [isImageRevealed, setIsImageRevealed] = useState(false);

  const handleLike = () => {
    onUpdate(prev => ({
      ...prev,
      engagement: {
        ...prev.engagement,
        likes: prev.engagement.user_liked ? prev.engagement.likes - 1 : prev.engagement.likes + 1,
        user_liked: !prev.engagement.user_liked,
        // If liked, remove dislike
        dislikes: prev.engagement.user_disliked ? prev.engagement.dislikes - 1 : prev.engagement.dislikes,
        user_disliked: false
      }
    }));
  };

  const handleDislike = () => {
    onUpdate(prev => ({
      ...prev,
      engagement: {
        ...prev.engagement,
        dislikes: prev.engagement.user_disliked ? prev.engagement.dislikes - 1 : prev.engagement.dislikes + 1,
        user_disliked: !prev.engagement.user_disliked,
        // If disliked, remove like
        likes: prev.engagement.user_liked ? prev.engagement.likes - 1 : prev.engagement.likes,
        user_liked: false
      }
    }));
  };

  const handleEmoji = (emoji: string) => {
    onUpdate(prev => {
      const isSelected = prev.engagement.user_emoji === emoji;
      const newEmojis = prev.engagement.impression_emojis.map(e => {
        if (e.emoji === emoji) {
          return { ...e, count: isSelected ? e.count - 1 : e.count + 1 };
        }
        // If another emoji was selected, decrement its count
        if (e.emoji === prev.engagement.user_emoji) {
          return { ...e, count: e.count - 1 };
        }
        return e;
      });

      return {
        ...prev,
        engagement: {
          ...prev.engagement,
          impression_emojis: newEmojis,
          user_emoji: isSelected ? undefined : emoji
        }
      };
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">
              {post.post_metadata.username[0].toUpperCase()}
            </div>
            <div>
              <h4 className="font-black text-gray-900 dark:text-white text-sm leading-none">
                {post.post_metadata.username}
              </h4>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold mt-1">
                <Clock size={10} />
                {new Date(post.post_metadata.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Mnemonic Content */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {post.mnemonic_data.english_word}
            </span>
            <span className="text-lg sm:text-xl font-black text-gray-400 dark:text-slate-600 italic">
              ≈ {post.mnemonic_data.native_keyword}
            </span>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed text-sm sm:text-base">
            {post.mnemonic_data.story}
          </p>
        </div>

        {/* Emoji Impressions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {post.engagement.impression_emojis.map((e, idx) => {
            const isSelected = post.engagement.user_emoji === e.emoji;
            return (
              <button 
                key={idx}
                onClick={() => handleEmoji(e.emoji)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm font-bold border ${
                  isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-gray-50 dark:bg-slate-800/50 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className={isSelected ? '' : 'grayscale'}>{e.emoji}</span>
                <span>{e.count}</span>
              </button>
            );
          })}
        </div>

        {/* Image if exists */}
        {post.visuals.user_uploaded_image && (
          <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 group">
            <img 
              src={post.visuals.user_uploaded_image} 
              alt={post.mnemonic_data.english_word}
              className={`w-full h-auto object-cover max-h-80 transition-all duration-700 ${!isImageRevealed ? 'blur-3xl scale-110' : 'blur-0 scale-100'}`}
              referrerPolicy="no-referrer"
            />
            
            {!isImageRevealed && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-3">
                <p className="text-white text-[10px] font-medium leading-relaxed drop-shadow-lg max-w-xs">
                  {t.researchNote}
                </p>
                <button 
                  onClick={() => setIsImageRevealed(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl font-black text-xs shadow-xl hover:bg-indigo-50 transition-all active:scale-95"
                >
                  <Eye size={14} />
                  <span>{t.revealImage}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Engagement */}
        <div className="pt-2 flex items-center justify-between border-t border-gray-50 dark:border-slate-800/50">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${post.engagement.user_liked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Heart size={18} fill={post.engagement.user_liked ? "currentColor" : "none"} />
              {post.engagement.likes}
            </button>
            <button 
              onClick={handleDislike}
              className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${post.engagement.user_disliked ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ThumbsDown size={18} fill={post.engagement.user_disliked ? "currentColor" : "none"} />
              {post.engagement.dislikes}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
