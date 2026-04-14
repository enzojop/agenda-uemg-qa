import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './env.js';

// Tenta usar o process.env injetado do build ou Jest, senão usa as credenciais ativas via import (evitando vazar no git)
const supabaseUrl = (typeof process !== 'undefined' && process.env.SUPABASE_URL) ? process.env.SUPABASE_URL : SUPABASE_URL;
const supabaseKey = (typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY) ? process.env.SUPABASE_ANON_KEY : SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ===================================
// AUTH METHODS (Sistema de contas)
// ===================================

/**
 * Cria uma nova conta de usuário injetando no meta-data a role da academia
 */
export const cadastrarUsuario = async (email, password, role, curso, periodo) => {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                role: role, // 'aluno' ou 'professor'
                curso: curso, // 'Sistemas de Informação'
                periodo: Number(periodo)
            }
        }
    });

    if (error) throw new Error(error.message);
    return data;
};

/**
 * Efetua login autenticado
 */
export const logarUsuario = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) throw new Error(error.message);
    return data;
};

/**
 * Realiza o Logout da sessão baseada em Cookies/Local Storage no navegador.
 */
export const deslogarUsuario = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
};

/**
 * Verifica ativamente se existe um usuário guardado na cache do navegador.
 */
export const getSessaoAtual = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session;
};

// ===================================
// BASE METHODS (Tabela Prazos)
// ===================================

export const persistirPrazo = async (prazo) => {
    try {
        const { data, error } = await supabase
            .from('prazos')
            .insert([prazo])
            .select();
            
        if (error) {
            console.error("Erro ao inserir no Supabase DB:", error.message);
            throw new Error(error.message);
        }
        return data;
    } catch(e) {
        console.error("Falha de conexão persistir:", e);
        throw e;
    }
};

export const buscarPrazos = async (periodoParaFiltrar = null) => {
    try {
        let query = supabase.from('prazos').select('*');
        
        if (periodoParaFiltrar) {
            query = query.eq('periodo', Number(periodoParaFiltrar));
        }
        
        const { data, error } = await query.order('data_entrega', { ascending: true });
            
        if (error) {
            console.error("Erro buscarPrazos DB:", error.message);
            throw new Error(error.message);
        }
        return data;
    } catch(e) {
        console.error("Falha ao buscar prazos da rede:", e);
        throw e;
    }
};

export const atualizarPrazo = async (id, prazo) => {
    try {
        const { data, error } = await supabase
            .from('prazos')
            .update(prazo)
            .eq('id', id)
            .select();
            
        if (error) {
            console.error("Erro atualizarPrazo DB:", error.message);
            throw new Error(error.message);
        }
        return data;
    } catch(e) {
        throw e;
    }
};

export const excluirPrazo = async (id) => {
    try {
        const { error } = await supabase
            .from('prazos')
            .delete()
            .eq('id', id);
            
        if (error) {
            console.error("Erro excluirPrazo DB:", error.message);
            throw new Error(error.message);
        }
    } catch(e) {
        throw e;
    }
};
