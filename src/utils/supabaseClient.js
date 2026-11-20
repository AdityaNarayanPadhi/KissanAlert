import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ervoiurdzfjuivjqbhdf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_60vzVTz8BLmfk87j-M2wWw_adLZr-dq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
