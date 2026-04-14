import { validarDataEntrega, criarObjetoPrazo, validarEmailInstitucional } from '../src/js/utils.js';

describe('Regras de Negócio - Validação de Prazos Acadêmicos', () => {

    // --- TESTES DE DATA ---
    describe('validarDataEntrega', () => {
        test('Deve retornar true para uma data de hoje ou futura', () => {
            const hoje = new Date().toISOString().split('T')[0];
            expect(validarDataEntrega(hoje)).toBe(true);
        });
        test('Deve retornar false para uma data no passado', () => {
            const dataPassada = '2020-01-01';
            expect(validarDataEntrega(dataPassada)).toBe(false);
        });
        test('Deve retornar false para entradas inválidas', () => {
            expect(validarDataEntrega('')).toBe(false);
            expect(validarDataEntrega(null)).toBe(false);
        });
    });

    // --- TESTES DE EMAIL ---
    describe('validarEmailInstitucional', () => {
        test('Deve aceitar email de aluno/representante válido', () => {
            expect(validarEmailInstitucional('kayan@discente.uemg.br', 'student')).toBe(true);
            expect(validarEmailInstitucional('representante@discente.uemg.br', 'representative')).toBe(true);
        });
        test('Deve aceitar email de professor válido', () => {
            expect(validarEmailInstitucional('mestre@uemg.br', 'professor')).toBe(true);
        });
        test('Deve rejeitar emails fora do domínio da UEMG', () => {
            expect(validarEmailInstitucional('kayan@gmail.com', 'student')).toBe(false);
            expect(validarEmailInstitucional('professor@hotmail.com', 'professor')).toBe(false);
        });
        test('Deve retornar false para cargos (roles) desconhecidos', () => {
            expect(validarEmailInstitucional('kayan@discente.uemg.br', 'visitante')).toBe(false);
            expect(validarEmailInstitucional('admin@uemg.br', 'admin')).toBe(false);
        });
    });

    // --- TESTES DO OBJETO PRAZO ---
    describe('criarObjetoPrazo (Sincronizado com SQL)', () => {
        test('Deve construir o objeto com as chaves corretas do Banco de Dados', () => {
            const dataValida = "2026-12-31";
            const resultado = criarObjetoPrazo('Prova de SQL', 'Estudar Joins', dataValida, 'prova', 3, 'Banco de Dados I');
            
            expect(resultado).toHaveProperty('title', 'Prova de SQL');
            expect(resultado).toHaveProperty('disciplina', 'Banco de Dados I'); // <-- MUDOU AQUI (Corrigido!)
            expect(resultado).toHaveProperty('event_date', dataValida);
            expect(resultado).toHaveProperty('description', 'Estudar Joins');
            expect(resultado).toHaveProperty('periodo', 3);
        });
        test('Deve lançar erro caso a disciplina falte', () => {
            expect(() => {
                criarObjetoPrazo('Trabalho', 'Desc', '2026-05-05', 'trabalho', 4, '');
            }).toThrow('A disciplina é obrigatória');
        });
        test('Deve lançar erro caso o título (title) falte', () => {
            expect(() => {
                criarObjetoPrazo('', 'Desc', '2026-05-05', 'atividade', 2, 'IHC');
            }).toThrow('O título é obrigatório');
        });
        test('Deve lançar erro para data no passado', () => {
            expect(() => {
                criarObjetoPrazo('TCC', 'Revisão', '2023-01-01', 'trabalho', 8, 'TCC II');
            }).toThrow('data de entrega não pode estar no passado');
        });
        test('Deve lançar erro caso o período falte', () => {
            expect(() => {
                criarObjetoPrazo('Seminário', 'Apresentação', '2026-11-10', 'atividade', null, 'Redes de Computadores');
            }).toThrow('O prazo deve ser direcionado a um período acadêmico');
        });
        test('Deve lançar erro caso o tipo de evento falte', () => {
            expect(() => {
                criarObjetoPrazo('Fórum', 'Discussão', '2026-08-08', '', 5, 'Sistemas Web');
            }).toThrow('O tipo de evento é obrigatório'); // Ajuste a frase se no seu utils.js estiver diferente
        });
    });
});