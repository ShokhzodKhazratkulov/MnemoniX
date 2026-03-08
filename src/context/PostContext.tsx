import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Language } from '../types';
import { supabase } from '../supabaseClient';

interface PostContextType {
  posts: Post[];
  addPost: (post: Partial<Post>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  hidePost: (postId: string) => void;
  updatePost: (postId: string, updater: (post: Post) => Post) => void;
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

  const fetchPosts = async (retryCount = 0) => {
    setIsLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username),
          mnemonics:mnemonic_id (*),
          reactions (*)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData) {
        setPosts([]);
        return;
      }

      const mappedPosts: Post[] = postsData.map((p: any) => {
        if (!p.mnemonics) return null;

        const likes = p.reactions?.filter((r: any) => r.reaction_type === 'like') || [];
        const dislikes = p.reactions?.filter((r: any) => r.reaction_type === 'dislike') || [];
        const emojis = p.reactions?.filter((r: any) => !['like', 'dislike'].includes(r.reaction_type)) || [];

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

        return {
          id: p.id,
          post_metadata: {
            username: p.profiles?.username || 'Unknown',
            timestamp: new Date(p.created_at).getTime(),
            user_id: p.user_id
          },
          mnemonic_data: {
            english_word: p.mnemonics.word,
            native_keyword: p.mnemonics.data?.meaning || p.mnemonics.keyword || '',
            story: p.mnemonics.data?.imagination || p.mnemonics.story || ''
          },
          visuals: {
            user_uploaded_image: p.mnemonics.image_url,
            audio_url: p.mnemonics.audio_url,
            ui_style: 'light'
          },
          language: p.language as Language,
          engagement: {
            likes: likes.length,
            dislikes: dislikes.length,
            impression_emojis: impression_emojis
          },
          remix_data: p.parent_post_id ? {
            parent_post_id: p.parent_post_id,
            parent_username: 'Original'
          } : undefined
        };
      }).filter(Boolean) as Post[];

      setPosts(mappedPosts);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      // Retry once on network failure
      if ((err.message === 'Failed to fetch' || err.message?.includes('fetch')) && retryCount < 1) {
        setTimeout(() => fetchPosts(retryCount + 1), 2000);
      }
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
    console.log("Adding post:", postData);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("Cannot add post: No user logged in");
      return;
    }

    try {
      // 1. Ensure mnemonic exists or create it
      let mnemonicId;
      console.log("Checking if mnemonic exists for word:", postData.mnemonic_data?.english_word);
      const { data: existingMnemonic, error: mFetchError } = await supabase
        .from('mnemonics')
        .select('id')
        .eq('word', postData.mnemonic_data?.english_word)
        .maybeSingle();

      if (mFetchError) console.error("Error fetching mnemonic:", mFetchError);

      if (existingMnemonic) {
        console.log("Using existing mnemonic ID:", existingMnemonic.id);
        mnemonicId = existingMnemonic.id;
      } else {
        console.log("Creating new mnemonic for post...");
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
            language: postData.language
          })
          .select()
          .single();
        if (mError) throw mError;
        mnemonicId = newMnemonic.id;
        console.log("New mnemonic created with ID:", mnemonicId);
      }

      // 2. Create post
      console.log("Inserting post into Supabase...");
      const { error: pError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          mnemonic_id: mnemonicId,
          language: postData.language,
          parent_post_id: postData.remix_data?.parent_post_id
        });

      if (pError) throw pError;
      console.log("Post created successfully!");
      
      await fetchPosts();
    } catch (err) {
      console.error('Error adding post:', err);
      alert("Failed to save post. Please check your connection.");
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
    try {
      // Check if reaction exists
      const { data: existing } = await supabase
        .from('reactions')
        .select()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', 'like')
        .single();

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
    try {
      const { data: existing } = await supabase
        .from('reactions')
        .select()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', 'dislike')
        .single();

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
    try {
      const { data: existing } = await supabase
        .from('reactions')
        .select()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', emoji)
        .single();

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        // Users can only have one emoji reaction at a time? 
        // Let's remove other emojis first
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
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;

    const updatedPost = updater(currentPost);
    
    // Update local state immediately
    setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));

    try {
      // Find the mnemonic ID for this post
      const { data: postRecord } = await supabase
        .from('posts')
        .select('mnemonic_id')
        .eq('id', postId)
        .single();

      if (postRecord) {
        // Update the mnemonic data
        await supabase
          .from('mnemonics')
          .update({
            word: updatedPost.mnemonic_data.english_word,
            image_url: updatedPost.visuals.user_uploaded_image,
            data: {
              ...updatedPost.mnemonic_data,
              imagination: updatedPost.mnemonic_data.story,
              meaning: updatedPost.mnemonic_data.native_keyword
            }
          })
          .eq('id', postRecord.mnemonic_id);
      }
    } catch (err) {
      console.error('Error updating post in Supabase:', err);
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

