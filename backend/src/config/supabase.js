import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseKey &&
    supabaseKey !== 'your-supabase-anon-key' &&
    supabaseKey !== 'your-supabase-service-role-key'
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      message: 'Supabase credentials not configured in environment variables (.env).',
    };
  }

  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        error: error.message,
        message: 'Connected to Supabase endpoint, but table query failed (check schema and permissions).',
      };
    }

    return {
      connected: true,
      orderCount: count ?? 0,
      message: 'Successfully connected to Supabase database.',
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      message: 'Network or authentication error while connecting to Supabase.',
    };
  }
};
