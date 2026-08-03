export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('VITE_SUPABASE_URL environment variable is required');
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required');
  }
  return key;
}

export function getRelayFunctionUrl(): string {
  const url = import.meta.env.VITE_RELAY_FUNCTION_URL;
  if (url) return url;
  const base = getSupabaseUrl();
  const project = base.replace(/^https:\/\//, '');
  return `https://${project}.supabase.co/functions/v1/authorize-activity`;
}
