import { validarDataEntrega } from './supabase.js';

// este arquivo contém os testes unitários para a função `validarDataEntrega`, 
// que é uma regra de negócio essencial para o projeto de prazos acadêmicos.
//  Os testes verificam se a função retorna os resultados esperados para datas futuras, passadas e o momento atual.

describe('Validação de Prazos Acadêmicos', () => {
    
    test('Deve retornar true para uma data de entrega no futuro', () => {
        const dataFutura = new Date();
        dataFutura.setDate(dataFutura.getDate() + 7); // 7 dias no futuro
        
        expect(validarDataEntrega(dataFutura)).toBe(true);
    });

    test('Deve retornar false para uma data de entrega que já passou', () => {
        const dataPassada = new Date();
        dataPassada.setDate(dataPassada.getDate() - 1); // Ontem
        
        expect(validarDataEntrega(dataPassada)).toBe(false);
    });

    test('Deve retornar false se a data de entrega for hoje (mesmo horário)', () => {
        const agora = new Date();
        
        // Como a função usa "> hoje", a mesma data/hora deve retornar false
        expect(validarDataEntrega(agora)).toBe(false);
    });
});