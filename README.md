
# Sistema de Controle de Prazos Academicos

## 1. Descricao da Aplicacao

Este projeto tem como objetivo desenvolver uma plataforma para apoiar a comunicacao entre professores e alunos, permitindo o cadastro, o acompanhamento e a consulta de provas, trabalhos e demais atividades avaliativas. A proposta central e reduzir a perda de prazos por meio de uma organizacao clara das entregas academicas.

## 2. Justificativa Tecnica

Foi adotada a abordagem de integracao com backend por meio do Supabase (BaaS). Essa decisao possibilita:

1. Persistencia real dos dados.
2. Simplificacao da infraestrutura, sem necessidade de manter servidor proprio.
3. Maior foco no desenvolvimento de testes automatizados e no fluxo de CI/CD.

## 3. Escopo Ja Implementado

### 3.1 Configuracao do Banco de Dados (Supabase)

1. Criacao das tabelas `usuarios` e `prazos`.
2. Definicao de tipos de dados apropriados.
3. Estruturacao de relacionamentos com chaves estrangeiras.

### 3.2 Pipeline de CI/CD (GitHub Actions)

1. Criacao do arquivo [main.yml](main.yml) para execucao automatizada do fluxo.
2. Configuracao de etapas para instalacao de dependencias.
3. Execucao automatica de testes.
4. Processo de deploy automatizado.

### 3.3 Seguranca e Governanca

1. Configuracao de Secrets no GitHub para protecao das chaves de API do Supabase.
2. Aplicacao de Branch Protection Rules, tornando obrigatoria a utilizacao de Pull Requests para integracao na branch principal.

## 4. Pendencias e Etapas de Finalizacao

### 4.1 Desenvolvimento Frontend

Implementar interface em JavaScript para interacao com os perfis de professor e aluno.

### 4.2 Testes Unitarios

Implementar testes para funcoes JavaScript, incluindo validacao de datas de entrega e regras de negocio.

### 4.3 Revisao de Codigo Automatizada

Integrar um GitHub App (por exemplo, Qodo ou Gemini Code Assist) para geracao automatica de comentarios em Pull Requests.

### 4.4 Ciclo de Pull Request

Realizar ao menos um Pull Request durante o desenvolvimento, com analise critica dos apontamentos da IA e resposta tecnica as sugestoes apresentadas.

### 4.5 Demonstracao Pratica

Preparar apresentacao com demonstracao da aplicacao, dos testes e da pipeline em funcionamento.

## 5. Prazo

Data limite de entrega: **14/04/2026**.
