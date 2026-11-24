import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://tozra.com.tr').replace(/\/$/, '');

let supabaseClient = null;
let initializationPromise = null;

export async function initializeSupabase() {
  if (supabaseClient) return supabaseClient;
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/config`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const config = await response.json().catch(() => ({}));
      if (!response.ok || !config.success || !config.supabaseUrl || !config.supabaseKey) {
        throw new Error(config.error || `TOZRA sunucu yapılandırması alınamadı (${response.status}).`);
      }
      supabaseClient = createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
      return supabaseClient;
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
}

export function getSupabase() {
  if (!supabaseClient) {
    throw new Error('Supabase henüz başlatılmadı. İnternet bağlantını kontrol edip yeniden dene.');
  }
  return supabaseClient;
}
