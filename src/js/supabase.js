// ✅ O jeito correto para rodar direto no navegador via CDN:
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const fallbackUrl = 'https://expdgbgibiqjggbszkbc.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cGRnYmdpYmlxamdnYnN6a2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NjAwOTgsImV4cCI6MjA5MDUzNjA5OH0.YK9D-3fBxw5eKpshrunLPowhT2yVQA3-165souAVUZA';

const supabaseUrl = (typeof process !== 'undefined' && process.env.SUPABASE_URL) ? process.env.SUPABASE_URL : fallbackUrl;
const supabaseKey = (typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY) ? process.env.SUPABASE_ANON_KEY : fallbackKey;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ===================================
// AUTH METHODS
// ===================================

export const cadastrarUsuario = async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: metadata // Passa o objeto com name, period e secret_key para o seu SQL Trigger
        }
    });

    if (error) throw new Error(error.message);
    return data;
};

export const logarUsuario = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    if (error) throw new Error(error.message);
    return data;
};

export const deslogarUsuario = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
};

export const getSessaoAtual = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session;
};

// ===================================
// STORAGE (Upload de Arquivos)
// ===================================

export const uploadArquivo = async (file) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        
        // Faz o upload para o bucket 'anexos' (Certifique-se que ele é PÚBLICO no painel)
        const { data, error } = await supabase.storage
            .from('anexos')
            .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('anexos')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        throw new Error('Erro ao subir arquivo: ' + error.message);
    }
};

// ===================================
// CRUD (Tabela EVENTS conforme seu SQL)
// ===================================

export const persistirPrazo = async (prazo) => {
    // Ajustado para a sua tabela 'events'
    const { data, error } = await supabase
        .from('events')
        .insert([prazo])
        .select();
        
    if (error) throw new Error(error.message);
    return data;
};

export const buscarPrazos = async (periodoParaFiltrar = null) => {
    try {
        // Tabela 'events' conforme seu SQL
        let query = supabase.from('events').select('*');
        
        // Se for aluno, o SQL permite filtrar ou o RLS cuida
        if (periodoParaFiltrar) {
            // Nota: Se você não salvou o período no evento, o aluno verá os is_public=true
            query = query.or(`is_public.eq.true`); 
        }
        
        const { data, error } = await query.order('event_date', { ascending: true });
        if (error) throw new Error(error.message);
        return data;
    } catch(e) {
        throw e;
    }
};

export const atualizarPrazo = async (id, prazo) => {
    const { data, error } = await supabase
        .from('events')
        .update(prazo)
        .eq('id', id)
        .select();
    if (error) throw new Error(error.message);
    return data;
};

export const excluirPrazo = async (id) => {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
    if (error) throw new Error(error.message);
};