import { persistirPrazo, buscarPrazos, cadastrarUsuario, logarUsuario, deslogarUsuario, getSessaoAtual, excluirPrazo, atualizarPrazo } from './supabase.js';

import { validarDataEntrega, criarObjetoPrazo, validarEmailInstitucional } from './utils.js';

const state = {
    userRole: null, // 'aluno' ou 'professor'
    userPeriodo: null, // 1 ao 8
    prazos: [],
    editingId: null // Id do prazo atualmente em edição, se houver
};

// Referências de DOM
const elements = {
    loginScreen: document.getElementById('login-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    authForm: document.getElementById('auth-form'),
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    registerRoleGroup: document.getElementById('register-role-group'),
    btnAuthSubmit: document.getElementById('btn-auth-submit'),
    btnOut: document.getElementById('btn-logout'),
    userAvatar: document.getElementById('user-avatar'),
    userNameLabel: document.getElementById('user-name-label'),
    userRoleLabel: document.getElementById('user-role-label'),
    formSection: document.getElementById('form-section'),
    formPrazo: document.getElementById('form-prazo'),
    prazosList: document.getElementById('prazos-list'),
    emptyState: document.getElementById('empty-state'),
    loader: document.getElementById('loader'),
    toastContainer: document.getElementById('toast-container')
};

/**
 * Cria alertas dinâmicos na tela (Toasts)
 */
export const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' 
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        
    toast.innerHTML = `${icon} <span>${message}</span>`;
    
    // Anexa se possível, pois pode ser rodado por Jest onde o DOM não existe.
    if(elements.toastContainer) {
        elements.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
};

const initApp = () => {
    if(!elements.loginScreen) return; // Evita falha no Jest
    
    // Auto-login roda em background sem travar o UI binding
    getSessaoAtual().then(sessao => {
        if (sessao && sessao.user) {
            const role = sessao.user.user_metadata?.role || 'aluno';
            const curso = sessao.user.user_metadata?.curso || 'Sistemas de Informação';
            const periodo = sessao.user.user_metadata?.periodo || null;
            const email = sessao.user.email;
            entrarNoDashboard(role, email, curso, periodo);
        }
    }).catch(console.warn);
    
    let modoAtual = 'login'; // 'login' ou 'register'

    // Alterna abas de Auth
    const setModo = (modo) => {
        modoAtual = modo;
        if (modo === 'login') {
            elements.tabLogin.className = 'btn btn-primary';
            elements.tabRegister.className = 'btn btn-danger';
            elements.tabRegister.style.background = 'transparent';
            elements.tabRegister.style.color = 'var(--text-main)';
            elements.registerRoleGroup.classList.add('hidden');
            elements.btnAuthSubmit.textContent = 'Acessar Plataforma';
        } else {
            elements.tabRegister.className = 'btn btn-primary';
            elements.tabLogin.className = 'btn btn-danger';
            elements.tabLogin.style.background = 'transparent';
            elements.tabLogin.style.color = 'var(--text-main)';
            elements.registerRoleGroup.classList.remove('hidden');
            
            // Controle dinâmico para Alunos exibirem período e curso
            const currRole = document.getElementById('auth-role').value;
            if(currRole === 'aluno') {
                document.getElementById('register-academico-group').classList.remove('hidden');
                document.getElementById('register-periodo-group').classList.remove('hidden');
            }
            
            elements.btnAuthSubmit.textContent = 'Criar Minha Conta';
        }
    };

    elements.tabLogin?.addEventListener('click', () => setModo('login'));
    elements.tabRegister?.addEventListener('click', () => setModo('register'));
    
    // Ocultar periodos caso o usuário switche para professor no select
    document.getElementById('auth-role')?.addEventListener('change', (e) => {
        if (e.target.value === 'aluno') {
            document.getElementById('register-academico-group').classList.remove('hidden');
            document.getElementById('register-periodo-group').classList.remove('hidden');
        } else {
            document.getElementById('register-academico-group').classList.add('hidden');
            document.getElementById('register-periodo-group').classList.add('hidden');
        }
    });

    // Processar Login / Cadastro
    elements.authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(elements.authForm);
        const email = formData.get('email');
        const password = formData.get('password');
        const role = formData.get('role'); // só útil no register
        const curso = formData.get('curso');
        const periodo = role === 'aluno' ? formData.get('periodo') : null;
        
        // Block de Segurança Institucional UEMG
        if (modoAtual === 'register') {
            if (!validarEmailInstitucional(email, role)) {
                let msg = role === 'aluno' ? 'E-mail de discente restrito a: @discente.uemg.br' : 'E-mail docência restrito a: @uemg.br';
                showToast(msg, 'error');
                return;
            }
        }
        
        const btnOriginalText = elements.btnAuthSubmit.textContent;
        elements.btnAuthSubmit.textContent = 'Aguarde...';
        elements.btnAuthSubmit.disabled = true;

        try {
            let data;
            if (modoAtual === 'login') {
                const response = await logarUsuario(email, password);
                data = response;
                
                const userRole = data.user?.user_metadata?.role || 'aluno';
                const useCurso = data.user?.user_metadata?.curso || 'Sistemas de Informação';
                const usePer = data.user?.user_metadata?.periodo || null;
                entrarNoDashboard(userRole, email, useCurso, usePer);
            } else {
                const response = await cadastrarUsuario(email, password, role, curso, periodo);
                
                // Supabase retorna session = null se exigir confirmacao de email
                if (response.user && !response.session) {
                    showToast('Verifique sua caixa de E-mail para confirmar o cadastro UEMG!', 'success');
                    setModo('login'); // Retorna pra aba login
                } else {
                    showToast('Conta UEMG criada com sucesso! Entrando...', 'success');
                    const userRole = response.user?.user_metadata?.role || 'aluno';
                    const useCurso = response.user?.user_metadata?.curso || 'Sistemas de Informação';
                    const usePer = response.user?.user_metadata?.periodo || null;
                    entrarNoDashboard(userRole, email, useCurso, usePer);
                }
            }
            
        } catch (error) {
            showToast(error.message || 'Falha na autenticação', 'error');
        } finally {
            elements.btnAuthSubmit.textContent = btnOriginalText;
            elements.btnAuthSubmit.disabled = false;
        }
    });

    elements.btnOut?.addEventListener('click', async () => {
        await deslogarUsuario();
        location.reload();
    });

    // Função de transição visual
    function entrarNoDashboard(role, email, curso, periodo) {
        state.userRole = role;
        state.userPeriodo = periodo;
        
        elements.loginScreen.classList.remove('active');
        elements.loginScreen.classList.add('hidden');
        
        elements.dashboardScreen.classList.remove('hidden');
        elements.dashboardScreen.classList.add('active');
        
        // Atualiza sidebar com informacao real da UEMG
        let subText = role === 'aluno' ? `S.I. — ${periodo}º Período` : 'Docência — UEMG';
        elements.userRoleLabel.textContent = subText;
        
        const loginName = email.split('@')[0];
        elements.userNameLabel.textContent = role === 'professor' ? 'Prof. ' + loginName : 'Aluno ' + loginName;
        elements.userAvatar.textContent = role === 'professor' ? 'P' : 'A';
        
        // Oculta/Exibe form de cadastro de Prazos dependendo da permissão
        if (role === 'professor') {
            elements.formSection.classList.remove('hidden');
        } else {
            elements.formSection.classList.add('hidden');
        }
        
        carregarPrazos();
    }

    // Cadastro de Prazos (Form)
    elements.formPrazo.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(elements.formPrazo);
        const prazoData = Object.fromEntries(formData.entries());
        
        try {
            // Cria objeto utilizando Factory Pattern para validações complexas e encapsuladas
            const novoPrazo = criarObjetoPrazo(
                prazoData.titulo,
                prazoData.descricao,
                prazoData.data_entrega,
                prazoData.tipo_evento,
                prazoData.periodo // do form de criacao q mapeia o alvo
            );
            
            // Tratamento de criador anonimo ou real
            const sessao = await getSessaoAtual();
            if(sessao && sessao.user) {
                novoPrazo.criado_por = sessao.user.id;
            }
            
            if (state.editingId) {
                // Modo Edição
                elements.formPrazo.querySelector('button').textContent = "Atualizando...";
                await atualizarPrazo(state.editingId, novoPrazo);
                showToast('Prazo acadêmico alterado com sucesso!', 'success');
                
                // Reinicia estado de edição
                state.editingId = null;
            } else {
                // Modo Inclusão
                elements.formPrazo.querySelector('button').textContent = "Gravando...";
                await persistirPrazo(novoPrazo);
                showToast('Prazo acadêmico gravado com sucesso!', 'success');
            }
            
            elements.formPrazo.reset();
            elements.formPrazo.querySelector('button').textContent = "Gravar Prazo";
            
            // Recarrega lista fresca do banco (mais seguro após CRUD)
            carregarPrazos();
            
        } catch(error) {
            showToast(error.message || 'Falha na conexão de sistema.', 'error');
            elements.formPrazo.querySelector('button').textContent = state.editingId ? "Salvar Alterações" : "Gravar Prazo";
        }
    });

    // Delegação de eventos para Edição e Exclusão nos cards renderizados
    elements.prazosList.addEventListener('click', async (e) => {
        const btnDelete = e.target.closest('.btn-delete');
        const btnEdit = e.target.closest('.btn-edit');

        if (btnDelete) {
            const id = btnDelete.dataset.id;
            if (window.confirm("Atenção Docente: Realmente deseja excluir este prazo definitivamente?")) {
                try {
                    await excluirPrazo(id);
                    showToast('Prazo excluído com sucesso!', 'success');
                    carregarPrazos();
                } catch (error) {
                    showToast('Erro ao remover prazo.', 'error');
                }
            }
        }

        if (btnEdit) {
            const id = btnEdit.dataset.id;
            const prazoSelecionado = state.prazos.find(p => p.id === id);
            
            if (prazoSelecionado) {
                // Coloca dados no formulário e rola a tela pra cima
                document.getElementById('titulo').value = prazoSelecionado.titulo;
                document.getElementById('tipo_evento').value = prazoSelecionado.tipo_evento;
                
                // Converter Z timestamp to local datetime-local format
                const tDate = new Date(prazoSelecionado.data_entrega);
                const isoLocal = new Date(tDate.getTime() - tDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                document.getElementById('data_entrega').value = isoLocal;
                
                document.getElementById('descricao').value = prazoSelecionado.descricao || '';
                
                state.editingId = id;
                elements.formPrazo.querySelector('button').textContent = "Salvar Alterações";
                window.scrollTo({ top: 0, behavior: 'smooth' });
                showToast('Modo de edição ativado.', 'success');
            }
        }
    });
};

const carregarPrazos = async () => {
    elements.loader.classList.remove('hidden');
    elements.prazosList.innerHTML = '';
    elements.emptyState.classList.add('hidden');
    
    // Busca do Backend BaaS passando o periodo caso seja aluno para filtragem
    try {
        const paramFiltro = state.userRole === 'aluno' ? state.userPeriodo : null;
        const dados = await buscarPrazos(paramFiltro);
        state.prazos = dados && dados.length > 0 ? dados : []; 
    } catch(err) {
        showToast('Não foi possível carregar os prazos da UEMG.', 'error');
    }
    
    elements.loader.classList.add('hidden');
    renderizarPrazos();
};

const renderizarPrazos = () => {
    elements.prazosList.innerHTML = '';
    
    if (state.prazos.length === 0) {
        elements.emptyState.classList.remove('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    
    // Ordenar do menor tempo até o maior (Cronologicamente pendentes)
    const cronologico = state.prazos.sort((a,b) => new Date(a.data_entrega) - new Date(b.data_entrega));

    cronologico.forEach(prazo => {
        const prazoDate = new Date(prazo.data_entrega);
        // Formata dinamicamente
        const dataVisual = prazoDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit' });
        
        const card = document.createElement('div');
        card.className = `prazo-card glass-panel tipo-${prazo.tipo_evento}`;
        
        // Regra de Permissão Analógica Visual
        let actionsHTML = '';
        if (state.userRole === 'professor') {
            actionsHTML = `
            <div class="crud-actions">
                <button class="btn-icon btn-edit" data-id="${prazo.id}" title="Alterar Atividade">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon btn-delete" data-id="${prazo.id}" title="Remover Turma">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>`;
        }
        
        card.innerHTML = `
            <div class="prazo-header">
                <span class="prazo-badge ${prazo.tipo_evento}">${prazo.tipo_evento}</span>
                ${actionsHTML}
            </div>
            <h3 class="prazo-title">${prazo.titulo}</h3>
            <p class="prazo-body">${prazo.descricao || 'Sem descrição.'}</p>
            <div class="prazo-footer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Entrega: ${dataVisual}</span>
            </div>
        `;
        
        elements.prazosList.appendChild(card);
    });
};

// Inicializa EventListeners 
initApp();
