// Escolhe automaticamente o "motor" de dados:
//  - Supabase, se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estiverem no .env
//  - Modo demonstração (localStorage) caso contrário
import { api as supabaseApi, isSupabaseConfigured } from "./supabase";
import { api as localApi } from "./local";

export const DEMO_MODE = !isSupabaseConfigured;
export const api = DEMO_MODE ? localApi : supabaseApi;
