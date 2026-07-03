export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  PEXELS_API_KEY: process.env.EXPO_PUBLIC_PEXELS_API_KEY ?? '',
  isSupabaseConfigured:
    Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  isPexelsConfigured: Boolean(process.env.EXPO_PUBLIC_PEXELS_API_KEY),
} as const;
