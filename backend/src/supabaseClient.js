// Simple Supabase client wrapper for optional Postgres (Supabase) provider
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase not configured: SUPABASE_URL or SUPABASE_KEY is missing');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '', {
  // Optional: add any global options here
});

module.exports = { supabase };
