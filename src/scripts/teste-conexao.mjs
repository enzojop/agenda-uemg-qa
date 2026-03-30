import { supabase } from './supabase.mjs';

async function testarConexao() {
    console.log("--- 🛠️ Testando Conexão com Supabase ---");

    // Tenta buscar apenas 1 registro da tabela 'prazos' que você criou
    const { data, error } = await supabase
        .from('prazos')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ Erro ao conectar:", error.message);
        console.log("Dica: Verifique se as chaves no seu .env estão corretas.");
    } else {
        console.log("✅ Conexão estabelecida com sucesso!");
        console.log("Dados recebidos (vazio se a tabela estiver limpa):", data);
    }
}

testarConexao();