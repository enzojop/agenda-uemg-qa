import { validarDataEntrega, criarObjetoPrazo } from '../src/js/utils.js';

describe('Regras de Negócio - Validação de Prazos Acadêmicos', () => {

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

    describe('criarObjetoPrazo (Sincronizado com SQL)', () => {

        test('Deve construir o objeto com as chaves corretas do Banco de Dados', () => {
            const dataValida = "2026-12-31";
            
            // Ordem: titulo, descricao, data, tipo, periodo, disciplina
            const resultado = criarObjetoPrazo(
                'Prova de SQL', 
                'Estudar Joins', 
                dataValida, 
                'prova', 
                3, 
                'Banco de Dados I'
            );
            
            // Verificando se os nomes das chaves batem EXATAMENTE com o seu SQL
            expect(resultado).toHaveProperty('title', 'Prova de SQL');
            expect(resultado).toHaveProperty('discipline_name', 'Banco de Dados I');
            expect(resultado).toHaveProperty('event_date', dataValida);
            expect(resultado).toHaveProperty('description', 'Estudar Joins');
            expect(resultado).toHaveProperty('periodo', 3);
        });

        test('Deve lançar erro caso a disciplina (discipline_name) falte', () => {
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
    });
});