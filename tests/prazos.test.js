import { validarDataEntrega, criarObjetoPrazo } from '../src/js/utils.js';

describe('Regras de Negócio - Validação de Prazos Acadêmicos', () => {

    describe('validarDataEntrega', () => {
        
        test('Deve retornar true para uma data de entrega no futuro longo', () => {
            const dataFutura = new Date();
            dataFutura.setDate(dataFutura.getDate() + 7); // 7 dias no futuro
            expect(validarDataEntrega(dataFutura.toISOString())).toBe(true);
        });

        test('Deve retornar false para uma data de entrega no passado', () => {
            const dataPassada = new Date();
            dataPassada.setDate(dataPassada.getDate() - 2); // 2 dias atrás
            expect(validarDataEntrega(dataPassada.toISOString())).toBe(false);
        });

        test('Deve retornar false para datas vazias ou não fornecidas', () => {
            expect(validarDataEntrega('')).toBe(false);
            expect(validarDataEntrega(null)).toBe(false);
            expect(validarDataEntrega(undefined)).toBe(false);
        });
    });

    describe('criarObjetoPrazo (Factory)', () => {

        test('Deve construir o objeto corretamente se todos os dados forem válidos', () => {
            const dataFutura = new Date();
            dataFutura.setDate(dataFutura.getDate() + 1);
            const dataStr = dataFutura.toISOString();
            
            const novoPrazo = criarObjetoPrazo('Prova de BD', 'Capítulos 1 a 3', dataStr, 'prova', 3);
            
            expect(novoPrazo).toHaveProperty('titulo', 'Prova de BD');
            expect(novoPrazo).toHaveProperty('tipo_evento', 'prova');
            expect(novoPrazo).toHaveProperty('data_entrega', dataStr);
            expect(novoPrazo).toHaveProperty('periodo', 3);
        });

        test('Deve lançar erro caso falte campos obrigatórios', () => {
            const dataFutura = new Date();
            dataFutura.setDate(dataFutura.getDate() + 1);
            
            expect(() => {
                criarObjetoPrazo('', '', dataFutura.toISOString(), 'atividade', 2);
            }).toThrow('O título é obrigatório');
        });

        test('Deve lançar erro caso a data seja no passado', () => {
            const dataPassada = new Date();
            dataPassada.setDate(dataPassada.getDate() - 1);
            
            expect(() => {
                criarObjetoPrazo('Trabalho', 'Desc', dataPassada.toISOString(), 'trabalho', 4);
            }).toThrow('data de entrega não pode estar no passado');
        });
    });

});
