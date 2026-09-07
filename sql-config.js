const SUPABASE_URL =
    "https://dhbrmfoainutmimocqit.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_huQ5eTD3dDnbwY2nSAN0qA_XbMkhSY8";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );