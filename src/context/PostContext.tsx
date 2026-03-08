import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Language } from '../types';
import { supabase } from '../supabaseClient';

interface PostContextType {
  posts: Post[];
  addPost: (post: Partial<Post>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  hidePost: (postId: string) => void;
  updatePost: (postId: string, updater: (post: Post) => Post) => Promise<void>;
  toggleLike: (postId: string, userId: string) => Promise<void>;
  toggleDislike: (postId: string, userId: string) => Promise<void>;
  toggleEmoji: (postId: string, userId: string, emoji: string) => Promise<void>;
  isLoading: boolean;
  hiddenPosts: string[];
  fetchPosts: () => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!user_id (username, full_name),
          mnemonics:mnemonic_id (*),
          reactions (*),
          parent:parent_post_id (
            user_id,
            profiles:user_id (username, full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Detailed Supabase Fetch Error:', postsError);
        throw postsError;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const mappedPosts: Post[] = postsData.map((p: any) => {
        const likes = p.reactions.filter((r: any) => r.reaction_type === 'like');
        const dislikes = p.reactions.filter((r: any) => r.reaction_type === 'dislike');
        const emojis = p.reactions.filter((r: any) => !['like', 'dislike'].includes(r.reaction_type));

        // Group emojis
        const emojiCounts: Record<string, number> = {};
        emojis.forEach((r: any) => {
          emojiCounts[r.reaction_type] = (emojiCounts[r.reaction_type] || 0) + 1;
        });

        const impression_emojis = [
          { emoji: "🧠", count: emojiCounts["🧠"] || 0 },
          { emoji: "🔥", count: emojiCounts["🔥"] || 0 },
          { emoji: "🌸", count: emojiCounts["🌸"] || 0 },
          { emoji: "💡", count: emojiCounts["💡"] || 0 }
        ];

        const user_liked = user ? likes.some((r: any) => r.user_id === user.id) : false;
        const user_disliked = user ? dislikes.some((r: any) => r.user_id === user.id) : false;
        const user_emoji_reaction = user ? emojis.find((r: any) => r.user_id === user.id) : null;
        
        return {
          id: p.id,
          post_metadata: {
            username: p.profiles?.username || p.profiles?.full_name || 'Unknown',
            timestamp: new Date(p.created_at).getTime(),
            user_id: p.user_id
          },
          mnemonic_data: {
            english_word: p.mnemonics.word,
            native_keyword: p.mnemonics.keyword || p.mnemonics.data?.phoneticLink || '',
            story: p.mnemonics.story || p.mnemonics.data?.imagination || ''
          },
          visuals: {
            user_uploaded_image: p.mnemonics.image_url,
            ui_style: 'light'
          },
          language: p.language as Language,
          engagement: {
            likes: likes.length,
            dislikes: dislikes.length,
            impression_emojis: impression_emojis,
            user_liked,
            user_disliked,
            user_emoji: user_emoji_reaction?.reaction_type
          },
          remix_data: p.parent_post_id ? {
            parent_post_id: p.parent_post_id,
            parent_username: p.parent?.profiles?.username || p.parent?.profiles?.full_name || 'Original'
          } : undefined,
          is_updated: p.is_updated
        } as any;
      });

      setPosts(mappedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    const savedHidden = localStorage.getItem('mnemonix_hidden_posts');
    if (savedHidden) {
      try {
        setHiddenPosts(JSON.parse(savedHidden));
      } catch (e) {
        console.error('Error parsing hidden posts:', e);
      }
    }
  }, []);

  const addPost = async (postData: Partial<Post>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Iltimos, post yaratish uchun tizimga kiring.");

    try {
      // 1. Ensure mnemonic exists or create it
      let mnemonicId;
      const { data: existingMnemonic } = await supabase
        .from('mnemonics')
        .select('id')
        .eq('word', postData.mnemonic_data?.english_word)
        .single();

      if (existingMnemonic) {
        mnemonicId = existingMnemonic.id;
      } else {
        const mnemonicData = {
          word: postData.mnemonic_data?.english_word || '',
          transcription: '',
          meaning: postData.mnemonic_data?.native_keyword || '',
          morphology: '',
          imagination: postData.mnemonic_data?.story || '',
          phoneticLink: postData.mnemonic_data?.native_keyword || '',
          connectorSentence: '',
          examples: [],
          synonyms: [],
          imagePrompt: '',
          level: 'Intermediate'
        };

        const { data: newMnemonic, error: mError } = await supabase
          .from('mnemonics')
          .insert({
            word: postData.mnemonic_data?.english_word,
            data: mnemonicData,
            image_url: postData.visuals?.user_uploaded_image,
            language: postData.language,
            keyword: postData.mnemonic_data?.native_keyword,
            story: postData.mnemonic_data?.story
          })
          .select()
          .single();
        if (mError) throw mError;
        mnemonicId = newMnemonic.id;
      }

      // 2. Create post
      const { error: pError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          mnemonic_id: mnemonicId,
          language: postData.language,
          parent_post_id: postData.remix_data?.parent_post_id,
          mnemonic_data: {
            english_word: postData.mnemonic_data?.english_word,
            native_keyword: postData.mnemonic_data?.native_keyword,
            story: postData.mnemonic_data?.story
          },
          visuals: {
            user_uploaded_image: postData.visuals?.user_uploaded_image,
            ui_style: 'light'
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

      if (pError) {
        console.error('Detailed Supabase Insert Error:', pError);
        console.log('Data attempted to insert:', {
          user_id: user.id,
          mnemonic_id: mnemonicId,
          language: postData.language,
          mnemonic_data: postData.mnemonic_data,
          visuals: postData.visuals,
          engagement: postData.engagement
        });
        throw pError;
      }
      
      await fetchPosts();
    } catch (err) {
      console.error('Error adding post:', err);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const hidePost = (postId: string) => {
    const newHidden = [...hiddenPosts, postId];
    setHiddenPosts(newHidden);
    localStorage.setItem('mnemonix_hidden_posts', JSON.stringify(newHidden));
  };

  const toggleLike = async (postId: string, userId: string) => {
    if (!userId || userId === 'guest') {
      alert("Iltimos, reaksiya bildirish uchun tizimga kiring.");
      return;
    }
    try {
      // Check if reaction exists
      const { data: existing } = await supabase
        .from('reactions')
        .select()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', 'like')
        .maybeSingle();

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        // Remove dislike if exists
        await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', userId).eq('reaction_type', 'dislike');
        await supabase.from('reactions').insert({ post_id: postId, user_id: userId, reaction_type: 'like' });
      }
      await fetchPosts();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const toggleDislike = async (postId: string, userId: string) => {
    if (!userId || userId === 'guest') {
      alert("Iltimos, reaksiya bildirish uchun tizimga kiring.");
      return;
    }
    try {
      const { data: existing } = await supabase
        .from('reactions')
        .select()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', 'dislike')
        .maybeSingle();

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', userId).eq('reaction_type', 'like');
        await supabase.from('reactions').insert({ post_id: postId, user_id: userId, reaction_type: 'dislike' });
      }
      await fetchPosts();
    } catch (err) {
      console.error('Error toggling dislike:', err);
    }
  };

  const toggleEmoji = async (postId: string, userId: string, emoji: string) => {
    if (!userId || userId === 'guest') {
      alert("Iltimos, reaksiya bildirish uchun tizimga kiring.");
      return;
    }
    try {
      const { data: existing } = await supabase
        .from('reactions')
        .select()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        // Remove other emojis first
        const { data: otherEmojis } = await supabase
          .from('reactions')
          .select('reaction_type')
          .eq('post_id', postId)
          .eq('user_id', userId);
        
        if (otherEmojis) {
          const emojiTypes = otherEmojis.map((r: any) => r.reaction_type).filter((t: any) => !['like', 'dislike'].includes(t));
          if (emojiTypes.length > 0) {
            await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', userId).in('reaction_type', emojiTypes);
          }
        }

        await supabase.from('reactions').insert({ post_id: postId, user_id: userId, reaction_type: emoji });
      }
      await fetchPosts();
    } catch (err) {
      console.error('Error toggling emoji:', err);
    }
  };

  const updatePost = async (postId: string, updater: (post: Post) => Post) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const updatedPost = updater(post);
      
      const { error } = await supabase
        .from('posts')
        .update({
          mnemonic_data: updatedPost.mnemonic_data,
          visuals: updatedPost.visuals,
          is_updated: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
      
      await fetchPosts();
    } catch (err) {
      console.error('Error updating post:', err);
      throw err;
    }
  };

  return (
    <PostContext.Provider value={{ 
      posts, 
      addPost, 
      deletePost,
      hidePost,
      updatePost, 
      toggleLike, 
      toggleDislike,
      toggleEmoji, 
      isLoading,
      hiddenPosts,
      fetchPosts
    }}>
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

