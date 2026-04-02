/**
 * Validação de data visando impedir prazos no passado.
 * Regra de negócio pura.
 */
export const validarDataEntrega = (dataString) => {
    if (!dataString) return false;
    
    const dataPrazo = new Date(dataString);
    const agora = new Date();
    
    // Zera os segundos e ms para evitar falhas em datas no memo minuto exato
    dataPrazo.setSeconds(0, 0);
    agora.setSeconds(0, 0);
    
    return dataPrazo > agora;
};

/**
 * Validação Institucional do Domínio de Email da Faculdade
 */
export const validarEmailInstitucional = (email, role) => {
    const dominioLimpado = email.trim().toLowerCase();
    if (role === 'aluno') {
        return dominioLimpado.endsWith('@discente.uemg.br');
    } else if (role === 'professor') {
        return dominioLimpado.endsWith('@uemg.br');
    }
    return false;
};

/**
 * Fabrica o objeto de persistência seguindo padrão Factory.
 * Garante que apenas objetos perfeitamente bem-formados passem para o backend.
 */
export const criarObjetoPrazo = (titulo, descricao, data_entrega, tipo_evento, periodo) => {
    if (!titulo || titulo.trim() === '') throw new Error("O título é obrigatório");
    if (!tipo_evento) throw new Error("O tipo de evento é obrigatório");
    if (!data_entrega) throw new Error("A data de entrega é obrigatória");
    if (!periodo) throw new Error("O prazo deve ser direcioado a um período acadêmico");
    
    if (!validarDataEntrega(data_entrega)) {
        throw new Error("A data de entrega não pode estar no passado");
    }

    return {
        titulo: titulo.trim(),
        descricao: descricao ? descricao.trim() : '',
        data_entrega,
        tipo_evento,
        periodo: Number(periodo) // converte a string do HTML para número da matriz curricular
    };
};
