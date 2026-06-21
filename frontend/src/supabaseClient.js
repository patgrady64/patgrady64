import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvfwppymqjlzyvnkysoq.supabase.co';
const supabaseAnonKey = 'sb_publishable_OFuWH6Rm5EZ6m7ojXza97w_3ngvVz1F';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);