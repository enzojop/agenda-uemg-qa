/**
 * Validação de data visando impedir prazos no passado.
 * Permite datas iguais ao dia de hoje.
 */
export const validarDataEntrega = (dataString) => {
    if (!dataString) return false;
    
    const dataPrazo = new Date(dataString);
    const hoje = new Date();
    
    // Zera as horas para comparar apenas o dia civil
    hoje.setHours(0, 0, 0, 0);
    dataPrazo.setHours(0, 0, 0, 0);
    
    return dataPrazo >= hoje;
};

/**
 * Validação de e-mail institucional da UEMG.
 */
export const validarEmailInstitucional = (email, role) => {
    const emailLimpo = email.trim().toLowerCase();
    if (role === 'student' || role === 'representative' || role === 'aluno') {
        return emailLimpo.endsWith('@discente.uemg.br');
    } else if (role === 'professor') {
        return emailLimpo.endsWith('@uemg.br');
    }
    return false;
};

/**
 * Factory que prepara o objeto para o Banco de Dados (Supabase).
 * Converte os campos para os nomes exatos das colunas do seu SQL.
 */
export const criarObjetoPrazo = (titulo, descricao, data, tipo, periodo, disciplina) => {
    // 1. Validações de obrigatoriedade
    if (!titulo || titulo.trim() === '') {
        throw new Error("O título é obrigatório");
    }
    if (!disciplina || disciplina.trim() === '') {
        throw new Error("A disciplina é obrigatória");
    }
    if (!data) {
        throw new Error("A data de entrega é obrigatória");
    }
    if (!periodo) {
        throw new Error("O prazo deve ser direcionado a um período acadêmico");
    }
    
    // 👇 A TRAVA QUE FALTAVA ESTÁ AQUI! 👇
    if (!tipo || tipo.trim() === '') {
        throw new Error("O tipo de evento é obrigatório");
    }
    
    // 2. Validação de Regra de Negócio (Data)
    if (!validarDataEntrega(data)) {
        throw new Error("data de entrega não pode estar no passado");
    }

    // 3. Retorno mapeado para o seu Script SQL atual
    return {
        title: titulo.trim(),                   // Coluna SQL: title
        disciplina: disciplina.trim(),          // AQUI MUDOU: Coluna SQL exata do seu print
        description: descricao ? descricao.trim() : '', 
        event_date: data,                       
        tipo_evento: tipo,                      
        periodo: Number(periodo)                
    };
};