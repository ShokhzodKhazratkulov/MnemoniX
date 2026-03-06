import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Language } from './types';
import { supabase } from './supabase';

interface PostContextType {
  posts: Post[];
  addPost: (post: Post) => Promise<void>;
  updatePost: (postId: string, data: Partial<Post['mnemonic_data'] & { image_url: string | null }>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string, userId: string) => Promise<void>;
  toggleEmoji: (postId: string, userId: string, emoji: string) => Promise<void>;
  isLoading: boolean;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch posts from Supabase
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          reactions (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedPosts: Post[] = data.map((p: any) => {
          const likes = p.reactions?.filter((r: any) => r.reaction_type === 'like').length || 0;
          const dislikes = p.reactions?.filter((r: any) => r.reaction_type === 'dislike').length || 0;
          
          const user_liked = p.reactions?.some((r: any) => r.reaction_type === 'like' && r.user_id === currentUserId);
          const user_disliked = p.reactions?.some((r: any) => r.reaction_type === 'dislike' && r.user_id === currentUserId);
          const user_emoji = p.reactions?.find((r: any) => r.reaction_type !== 'like' && r.reaction_type !== 'dislike' && r.user_id === currentUserId)?.reaction_type;

          // Group emojis
          const emojiMap: Record<string, number> = {};
          p.reactions?.forEach((r: any) => {
            if (r.reaction_type !== 'like' && r.reaction_type !== 'dislike') {
              emojiMap[r.reaction_type] = (emojiMap[r.reaction_type] || 0) + 1;
            }
          });

          return {
            id: p.id,
            post_metadata: {
              username: p.profiles?.full_name || 'Anonymous',
              timestamp: new Date(p.created_at).getTime(),
              user_id: p.user_id
            },
            mnemonic_data: {
              english_word: p.english_word,
              native_keyword: p.native_keyword,
              story: p.story
            },
            visuals: {
              user_uploaded_image: p.image_url,
              ui_style: p.ui_style as 'light' | 'dark'
            },
            language: p.language as Language,
            engagement: {
              likes,
              dislikes,
              impression_emojis: Object.entries(emojiMap).map(([emoji, count]) => ({ emoji, count })),
              user_liked,
              user_disliked,
              user_emoji
            }
          };
        });
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchPosts();

    // Set up real-time subscription
    const subscription = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const addPost = async (post: Post) => {
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: post.post_metadata.user_id,
        english_word: post.mnemonic_data.english_word,
        native_keyword: post.mnemonic_data.native_keyword,
        story: post.mnemonic_data.story,
        image_url: post.visuals.user_uploaded_image,
        ui_style: post.visuals.ui_style,
        language: post.language
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  const toggleLike = async (postId: string, userId: string) => {
    try {
      // Check if already liked
      const { data: existing } = await supabase
        .from('reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', 'like')
        .single();

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('reactions').insert({
          post_id: postId,
          user_id: userId,
          reaction_type: 'like'
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleEmoji = async (postId: string, userId: string, emoji: string) => {
    try {
      // Check if this specific emoji reaction exists
      const { data: existing } = await supabase
        .from('reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', emoji)
        .single();

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        // Remove any other emoji reaction from this user on this post (optional, depending on UX)
        // For simplicity, let's allow multiple emojis or just one?
        // Let's stick to one emoji per user per post for now to match the UI logic
        await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .not('reaction_type', 'in', '("like","dislike")');

        await supabase.from('reactions').insert({
          post_id: postId,
          user_id: userId,
          reaction_type: emoji
        });
      }
    } catch (error) {
      console.error('Error toggling emoji:', error);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const updatePost = async (postId: string, data: Partial<Post['mnemonic_data'] & { image_url: string | null }>) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          english_word: data.english_word,
          native_keyword: data.native_keyword,
          story: data.story,
          image_url: data.image_url
        })
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  return (
    <PostContext.Provider value={{ posts, addPost, updatePost, deletePost, toggleLike, toggleEmoji, isLoading }}>
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

