import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'money-history' },
  },
  db: {
    schema: 'public',
  },
  // Adding retry logic for better offline/flaky connection support
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
