// Importação do cliente Supabase (utilizando ESM)
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Para carregar variáveis de ambiente do arquivo .env

// Estas variáveis devem ser preenchidas com os dados que você coletou no painel do Supabase
// Nota: Em um ambiente de produção real, usaríamos variáveis de ambiente (.env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Inicialização do cliente para uso em todo o projeto
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Exemplo de função de regra de negócio para o Integrante testar:
 * Valida se a data de entrega de um trabalho é uma data futura.
 * Esta função é ideal para os Testes Unitários obrigatórios[cite: 5, 6].
 */
export const validarDataEntrega = (data) => {
    const hoje = new Date();
    const dataEntrega = new Date(data);
    return dataEntrega > hoje;
};