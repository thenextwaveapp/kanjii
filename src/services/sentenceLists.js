import { supabase } from './supabase';

/**
 * Fetch all lists for a user
 */
export async function fetchSentenceLists(userId) {
  const { data, error } = await supabase
    .from('sentence_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching sentence lists:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new sentence list
 */
export async function createSentenceList(userId, name, color) {
  const { data, error } = await supabase
    .from('sentence_lists')
    .insert({ user_id: userId, name, color })
    .select()
    .single();

  if (error) {
    console.error('Error creating sentence list:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a sentence list
 */
export async function deleteSentenceList(listId) {
  const { error } = await supabase
    .from('sentence_lists')
    .delete()
    .eq('id', listId);

  if (error) {
    console.error('Error deleting sentence list:', error);
    throw error;
  }
}

/**
 * Add sentence to list
 */
export async function addSentenceToList(listId, sentenceId) {
  const { error } = await supabase
    .from('sentence_list_items')
    .insert({ list_id: listId, sentence_id: sentenceId });

  if (error && error.code !== '23505') { // Ignore duplicate key errors
    console.error('Error adding sentence to list:', error);
    throw error;
  }
}

/**
 * Remove sentence from list
 */
export async function removeSentenceFromList(listId, sentenceId) {
  const { error } = await supabase
    .from('sentence_list_items')
    .delete()
    .eq('list_id', listId)
    .eq('sentence_id', sentenceId);

  if (error) {
    console.error('Error removing sentence from list:', error);
    throw error;
  }
}

/**
 * Get lists for a specific sentence
 */
export async function getSentenceLists(sentenceId) {
  const { data, error } = await supabase
    .from('sentence_list_items')
    .select('list_id, sentence_lists(*)')
    .eq('sentence_id', sentenceId);

  if (error) {
    console.error('Error fetching sentence lists:', error);
    return [];
  }

  return (data || []).map(item => item.sentence_lists);
}

/**
 * Fetch sentences from a specific list
 */
export async function fetchListSentences(listId) {
  const { data, error } = await supabase
    .from('sentence_list_items')
    .select(`
      sentence_id,
      sentences (
        id,
        japanese,
        english,
        words,
        jlpt_level,
        domain
      )
    `)
    .eq('list_id', listId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching list sentences:', error);
    return [];
  }

  return (data || []).map(item => item.sentences).filter(Boolean);
}
