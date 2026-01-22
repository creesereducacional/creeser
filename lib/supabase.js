import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar que as variáveis de ambiente estão definidas
if (!supabaseUrl) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL não está definida em .env.local');
}
if (!supabaseAnonKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida em .env.local');
}

// Cliente para operações do cliente (navegador)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Cliente para operações do servidor (Node.js) - com permissões administrativas
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Função para autenticar usuário
export async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// Função para criar usuário
export async function createUser(email, password) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  return { data, error };
}

// Função para fazer logout
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Função para obter usuário atual
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

// Função para obter sessão
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}
