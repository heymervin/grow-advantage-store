import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mxqxsptrvubpjmkfkqwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14cXhzcHRydnVicGpta2ZrcXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjA0MDcsImV4cCI6MjA4NTg5NjQwN30.5wzLbWe-af7KbrJ_taS3QC06NzLALpOZQAPxG-V3Wjo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
