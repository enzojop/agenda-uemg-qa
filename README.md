# 🎓 Agenda UEMG - Unidade Carangola

**Agenda UEMG** é uma plataforma acadêmica completa de página única (SPA) desenvolvida para gerenciar prazos, provas e avaliações do curso de Sistemas de Informação da Universidade do Estado de Minas Gerais (UEMG) - Unidade Carangola.

## 1️⃣ Descrição da Aplicação

O sistema combate a desinformação de datas e centraliza a vida acadêmica, unindo Professores (que emitem prazos) e Alunos (que visualizam prazos pertinentes ao seu período atual).

## 2️⃣ Justificativa da Escolha do Tipo de Projeto (Abordagem 2)

Optamos pela **Abordagem (2): Aplicação com integração a backend (BaaS)** pois ela simula a arquitetura real do mercado de software contemporâneo (Front-end Desacoplado consumindo Serviços Cloud). O uso do Supabase como provedor de banco de dados e autenticação nos permitiu focar intensamente na construção da interface, regras de negócio ricas no Javascript puro e na automação do CI/CD, sem sacrificar a persistência de banco de dados relacionais e controle de segurança e usuários.

## 3️⃣ Principais Decisões Técnicas Adotadas

*   **Autenticação Institucional Nativa:** O sistema usa regex estrutural no Javascript interceptando submissões a fim de bloquear domínios externos. Apenas namespaces `@uemg.br` e `@discente.uemg.br` são autorizados a enviar *payloads* de cadastro ao backend.
*   **Role-Based Access Control (RBAC):** Os perfis diferem na arquitetura.
    *   **Professor:** Carrega os poderes de criação (CRUD completo), edição, exclusão e visualização ampla de todos os prazos no dashboard.
    *   **Aluno:** Foi instaurado um filtro arquitetural (Read-Only) baseado na matriz lógica do curso: cada aluno visualiza restritamente os dados que batam com o `periodo` gravado em eu Supabase JWT.
*   **Design System Limpo (Light Mode):** A UI foi desenvolvida em CSS Vanilla (`style.css`), porém componentizando variáveis globais (CSS Variables) para injetar o tom oficial do azul da UEMG e a tipografia `Roboto` das plataformas governamentais, garantindo familiaridade e alto contraste.
*   **Factory Pattern na Manipulação de Dados:** Nenhuma data ou prazo é despachado para a API sem passar pelo nosso módulo injetor `criarObjetoPrazo` (dentro de `utils.js`), que garante barreiras contra submissões e edições de datas atemporais (eventos no passado).

---

## 🛠️ Tecnologias Utilizadas

Apesar da simplicidade, a plataforma foi moldada buscando escalabilidade e modularidade:

*   **Frontend Vanilla:** HTML5, CSS3 Customizado (CSS puro, variáveis CSS, Grid/Flexbox) e Arquitetura ES6 Vanilla JS. Sem dependências pesadas, entregando a interface instantaneamente.
*   **Backend como Serviço (BaaS):** Supabase (PostgreSQL sob os panos). Realiza o papel de robustos bancos relacionais REST controlando a tabela `prazos`, sincronizando logins com DB Triggers e lidando com Autorização Persistente em LocalStorage.
*   **Testes Automatizados:** Suíte de testes **Jest (Experimental Modules)** cobre os algoritmos complexos de Factory e os comportamentos lógicos para garantir que períodos e datas sejam perfeitos antes de tocarem a API.
*   **CI/CD Automatizado:** Pipeline pré-configurada em **GitHub Actions** (`main.yml`) pronta para injetar Variáveis de Ambiente e despachar subidas direto para a Web via GH-Pages.

---

## 📂 Arquitetura de Pastas

```text
/prazos_academicos_qa/
│
├── index.html                  # Interface Única (SPA). Contém Layout de Login e Dashboard.
├── package.json                # Gerenciador de módulos, utilitários Jest e flags do Node.
│
├── src/                        # Coração da Lógica Front-end e Engine
│   ├── css/
│   │   └── style.css           # Design System da UI (Aderente ao estilo UEMG)
│   └── js/
│       ├── app.js              # Controlador Principal (Event Listeners e Mutações de DOM)
│       ├── supabase.js         # Interface SDK que faz a malha fina com o Banco Nuvem Supabase
│       └── utils.js            # Foco em "Puro JS": Fábrica de Obejto, Bloqueios de Domínio da Faculdade e Regex de Data.
│
├── tests/
│   └── prazos.test.js          # Arquivo rodado pelo comando `npm test` verificando integridade lógica.
│
└── .github/workflows/
    └── main.yml                # Receita do robô responsável por Deploy contínuo na nuvem.
```

---

## 4️⃣ Instruções para Execução do Projeto

1. **Pré-requisitos:** Você precisa do [Node.js](https://nodejs.org/en) instalado em sua máquina.
2. **Clone ou abra o projeto no seu Terminal.**
3. **Instalação:** Digite:
   ```bash
   npm install
   ```
4. **Variáveis de Ambiente:** Configure seu projeto Supabase e insira as credenciais no arquivo `.env` localizado na raiz deste repositório.
5. **Iniciando Localmente:**
   Levante a aplicação visualmente através do comando:
   ```bash
   npx serve .
   ```
   > Em seguida, acesse no navegador a porta indicada (ex: `http://localhost:3000`).

---

## 5️⃣ Descrição do Funcionamento da Pipeline e dos Testes

### Cobertura de Testes Automatizados (Jest)
Escrevemos os Testes Unitários utilizando o framework de mercado `Jest` focado no arquivo das lógicas de negócio (`src/js/utils.js`). A suíte localizada em `tests/prazos.test.js` testa as seguintes esferas:
1. **Regras de Negócio (Datas):** Funções testam a negação matemática ao tentar inserir dias letivos que já passaram via `validarDataEntrega`.
2. **Manipulação de Dados (Factory):** A construção perfeita dos campos no JS (`periodo`, `tipo`) é validada e testada contra campos vazios ou nulos.

> **Comando de Teste:** Executando `npm test`, o Node inicializa nossa script customizada `--experimental-vm-modules` que simula os Módulos Nativos do navegador e imprime um placar geral. Implementamos também a exibição de Relatório de Cobertura via a tag `--coverage` (Bônus Diferencial).

### Pipeline de Integração Contínua (GitHub Actions)
Nós construímos o robô de infraestrutura `.github/workflows/main.yml`, engatilhado sob cada **Push** e **Pull Request** na branch `main`.

A CI/CD percorre as seguintes esteiras:
1. Instalação e *Cache* das frotas de dependências usando ubuntu-latest.
2. Executa toda nossa matriz rígida de testes estáticos via `npm test`. *Caso os testes reprovem por uma alteração incorreta na DOM de datas, a Action cancela imediatamente o bloqueio e sinala Falha no Pull Request da equipe (feedback automático).*
3. (Deploy Automático): Na esteira final do Pull Request, aprovado os testes nas bases do workflow, o Github Pages recolhe todos arquivos `.js/html` estáticos via a action *upload-pages-artifact*, consumindo serviço e servindo a última versão do sistema mundialmente, blindando assim o ambiente Produtivo contra falhas.

---

## 🗄️ Entendendo a Base de Dados

Esse App exala dados persistentes usando tabelas com a seguinte Modelagem Relacional e Tipagem:

**Tabela: `usuarios`**
*(Sincronizado automaticamente junto a API interna do próprio Supabase via DB Triggers)*
- `id`: *UUID Primary Key*
- `email`: *Text Unique*
- `role`: *Text (aluno|professor)*
- `curso`: *Text*
- `periodo`: *Integer*

**Tabela: `prazos`**
- `id`: *UUID Primary Key*
- `titulo`: *Text*
- `descricao`: *Text*
- `data_entrega`: *Timestamp TZ*
- `tipo_evento`: *Text (Prova, Trabalho, etc)*
- `criado_por`: *UUID (Chave Estrangeira ligada à tabela Usuarios)*
- **`periodo`**: *Integer (Coluna crucial acoplada que limita qual período pode visualizar tal prazo na arquitetura)*

---

*Atividade Avaliativa 1 — Qualidade de Software na
Prática com CI/CD*
