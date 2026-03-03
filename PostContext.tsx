import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Language } from './types';

interface PostContextType {
  posts: Post[];
  addPost: (post: Post) => void;
  updatePost: (postId: string, updater: (post: Post) => Post) => void;
  isLoading: boolean;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial mock data
  useEffect(() => {
    const initialPosts: Post[] = [
      {
        id: 'mock-1',
        post_metadata: { username: 'Aleksey', timestamp: Date.now() - 3600000, user_id: 'mock' },
        mnemonic_data: { 
          english_word: 'Vibrant', 
          native_keyword: 'Vay-brant (Voy, qanday rang!)', 
          story: 'Tasavvur qiling, siz juda yorqin rangli xonaga kirdingiz va hayratdan "Voy, qanday rang!" deb yubordingiz.' 
        },
        visuals: { user_uploaded_image: 'https://picsum.photos/seed/vibrant/800/600', ui_style: 'light' },
        language: Language.UZBEK,
        engagement: { 
          likes: 12, 
          dislikes: 0, 
          impression_emojis: [
            { emoji: "🧠", count: 5 }, 
            { emoji: "🔥", count: 8 },
            { emoji: "🌸", count: 0 },
            { emoji: "💡", count: 0 }
          ] 
        }
      },
      {
        id: 'mock-2',
        post_metadata: { username: 'Elena', timestamp: Date.now() - 7200000, user_id: 'mock' },
        mnemonic_data: { 
          english_word: 'Pensive', 
          native_keyword: 'Pen-siv (Pen - ruchka)', 
          story: 'Elena ruchkasini (pen) tishlab, chuqur o\'yga botgan (pensive) holda derazadan qarab turibdi.' 
        },
        visuals: { user_uploaded_image: 'https://picsum.photos/seed/pensive/800/600', ui_style: 'light' },
        language: Language.UZBEK,
        engagement: { 
          likes: 24, 
          dislikes: 1, 
          impression_emojis: [
            { emoji: "🧠", count: 0 }, 
            { emoji: "🔥", count: 0 },
            { emoji: "🌸", count: 4 },
            { emoji: "💡", count: 12 }
          ] 
        }
      },
      {
        id: 'mock-3',
        post_metadata: { username: 'Ivan', timestamp: Date.now() - 10800000, user_id: 'mock' },
        mnemonic_data: { 
          english_word: 'Glimpse', 
          native_keyword: 'Глимпс (Глянь - посмотри)', 
          story: 'Я мельком (glimpse) увидел что-то интересное и сказал другу: "Глянь!"' 
        },
        visuals: { user_uploaded_image: null, ui_style: 'light' },
        language: Language.RUSSIAN,
        engagement: { 
          likes: 15, 
          dislikes: 0, 
          impression_emojis: [
            { emoji: "🧠", count: 2 }, 
            { emoji: "🔥", count: 4 },
            { emoji: "🌸", count: 0 },
            { emoji: "💡", count: 6 }
          ] 
        }
      },
      {
        id: 'mock-4',
        post_metadata: { username: 'Sardor', timestamp: Date.now() - 14400000, user_id: 'mock' },
        mnemonic_data: { 
          english_word: 'Obstacle', 
          native_keyword: 'Обстакл (Об стену)', 
          story: 'Yo\'limda to\'siq (obstacle) paydo bo\'ldi, xuddi boshim bilan devorga (об стену) urilgandek bo\'ldim.' 
        },
        visuals: { user_uploaded_image: null, ui_style: 'light' },
        language: Language.UZBEK,
        engagement: { 
          likes: 30, 
          dislikes: 2, 
          impression_emojis: [
            { emoji: "🧠", count: 10 }, 
            { emoji: "🔥", count: 15 },
            { emoji: "🌸", count: 0 },
            { emoji: "💡", count: 5 }
          ] 
        }
      }
    ];
    
    // Try to load from localStorage for session persistence
    const saved = localStorage.getItem('mnemonix_posts');
    if (saved) {
      try {
        setPosts(JSON.parse(saved));
      } catch (e) {
        setPosts(initialPosts);
      }
    } else {
      setPosts(initialPosts);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever posts change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('mnemonix_posts', JSON.stringify(posts));
    }
  }, [posts]);

  const addPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const updatePost = (postId: string, updater: (post: Post) => Post) => {
    setPosts(prev => prev.map(p => p.id === postId ? updater(p) : p));
  };

  return (
    <PostContext.Provider value={{ posts, addPost, updatePost, isLoading }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};
