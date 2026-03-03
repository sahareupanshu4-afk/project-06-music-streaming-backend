const { createClient } = require('@supabase/supabase-js');

let supabase;

const connectDB = async () => {
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    
    // Test connection
    const { data, error } = await supabase.from('tracks').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('Database connection error:', error);
      throw error;
    }
    
    console.log('✅ Connected to Supabase database');
    return supabase;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

const getSupabase = () => {
  if (!supabase) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return supabase;
};

module.exports = { connectDB, getSupabase };