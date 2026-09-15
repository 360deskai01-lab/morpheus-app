import { supabase } from '../lib/supabase';

export interface ForumCategory {
  id: string;
  title: string;
  description?: string;
  display_order: number;
}

export interface ForumTopic {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  created_at: string;
  author?: {
    full_name?: string;
    membership_tier?: string;
    is_master_admin?: boolean;
  };
  replies_count?: number;
}

export interface ForumReply {
  id: string;
  topic_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    full_name?: string;
    membership_tier?: string;
    is_master_admin?: boolean;
  };
}

export async function fetchForumCategories(): Promise<ForumCategory[]> {
  const { data, error } = await supabase
    .from('morfeus_forum_categories')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Kategoriler alınamadı:', error);
    return [];
  }
  return data as ForumCategory[];
}

export async function fetchTopics(categoryId?: string): Promise<ForumTopic[]> {
  let query = supabase
    .from('morfeus_forum_topics')
    .select(`
      *,
      author:morfeus_profiles!morfeus_forum_topics_author_id_fkey(full_name, membership_tier, is_master_admin)
    `)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (categoryId && categoryId !== 'ALL') {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Konular alınamadı:', error);
    return [];
  }
  return data as ForumTopic[];
}

export async function fetchTopicReplies(topicId: string): Promise<ForumReply[]> {
  const { data, error } = await supabase
    .from('morfeus_forum_replies')
    .select(`
      *,
      author:morfeus_profiles!morfeus_forum_replies_author_id_fkey(full_name, membership_tier, is_master_admin)
    `)
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Yanıtlar alınamadı:', error);
    return [];
  }
  return data as ForumReply[];
}

export async function createTopic(categoryId: string, authorId: string, title: string, content: string) {
  const { data, error } = await supabase
    .from('morfeus_forum_topics')
    .insert([{ category_id: categoryId, author_id: authorId, title, content }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createReply(topicId: string, authorId: string, content: string) {
  const { data, error } = await supabase
    .from('morfeus_forum_replies')
    .insert([{ topic_id: topicId, author_id: authorId, content }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTopicByAdmin(topicId: string) {
  const { error } = await supabase.from('morfeus_forum_topics').delete().eq('id', topicId);
  if (error) throw error;
}

export async function deleteReplyByAdmin(replyId: string) {
  const { error } = await supabase.from('morfeus_forum_replies').delete().eq('id', replyId);
  if (error) throw error;
}