import { 
    persistirPrazo, buscarPrazos, cadastrarUsuario, logarUsuario, 
    deslogarUsuario, getSessaoAtual, excluirPrazo, atualizarPrazo,
    uploadArquivo 
} from './supabase.js';

// 1. ESTADO GLOBAL
const state = {
    userRole: null, 
    userPeriod: null,
    prazos: [],
    editingId: null
};

// 2. MAPEAMENTO DE ELEMENTOS
const elements = {
    loginScreen: document.getElementById('login-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    authForm: document.getElementById('auth-form'),
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    registerFields: document.getElementById('register-fields'),
    btnAuthSubmit: document.getElementById('btn-auth-submit'),
    btnOut: document.getElementById('btn-logout'),
    userNameLabel: document.getElementById('user-name-label'),
    userRoleLabel: document.getElementById('user-role-label'),
    userAvatar: document.getElementById('user-avatar'),
    formSection: document.getElementById('form-section'),
    formPrazo: document.getElementById('form-prazo'),
    prazosList: document.getElementById('prazos-list'),
    openFormBtn: document.getElementById('open-form-btn'),
    cancelarForm: document.getElementById('cancelar-form'),
    emptyState: document.getElementById('empty-state')
};

// Variável global do Calendário
let dataExibida = new Date(); 

const initApp = () => {
    // --- LÓGICA DE LOGIN / REGISTRO ---
    let modoAtual = 'login';

    elements.tabRegister?.addEventListener('click', () => {
        modoAtual = 'register';
        elements.registerFields.classList.remove('hidden');
        elements.btnAuthSubmit.textContent = 'Criar Minha Conta';
        
        elements.tabRegister.classList.add('active');
        elements.tabLogin.classList.remove('active');
        
        elements.tabRegister.style.background = "";
        elements.tabLogin.style.background = "";
    });

    elements.tabLogin?.addEventListener('click', () => {
        modoAtual = 'login';
        elements.registerFields.classList.add('hidden');
        elements.btnAuthSubmit.textContent = 'Entrar';
        
        elements.tabLogin.classList.add('active');
        elements.tabRegister.classList.remove('active');
        
        elements.tabLogin.style.background = "";
        elements.tabRegister.style.background = "";
    });

    // --- AUTO-LOGIN ---
    getSessaoAtual().then(sessao => {
        if (sessao?.user) {
            const meta = sessao.user.user_metadata;
            entrarNoDashboard(meta.role, sessao.user.email, meta.period);
        }
    });

    // --- SUBMIT AUTENTICAÇÃO ---
    elements.authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        
        elements.btnAuthSubmit.disabled = true;
        elements.btnAuthSubmit.textContent = 'Processando...';

        try {
            if (modoAtual === 'login') {
                const { user } = await logarUsuario(email, password);
                const m = user.user_metadata;
                entrarNoDashboard(m.role, user.email, m.period);
            } else {
                const nome = document.getElementById('auth-name').value;
                const periodo = document.getElementById('auth-periodo').value;
                const chave = document.getElementById('chave-rep').value;

                const { user, session } = await cadastrarUsuario(email, password, { 
                    name: nome, 
                    period: parseInt(periodo), 
                    secret_key: chave 
                });

                if (user && !session) {
                    Swal.fire('Sucesso!', 'Confirme seu e-mail institucional.', 'success');
                } else {
                    const roleFinal = (chave === 'UEMG2026') ? 'representative' : 'student';
                    entrarNoDashboard(roleFinal, email, periodo);
                }
            }
        } catch (err) {
            Swal.fire('Erro', err.message, 'error');
        } finally {
            elements.btnAuthSubmit.disabled = false;
            elements.btnAuthSubmit.textContent = modoAtual === 'login' ? 'Entrar' : 'Criar Conta';
        }
    });

    // --- LOGOUT ---
    elements.btnOut?.addEventListener('click', async () => {
        await deslogarUsuario();
        location.reload();
    });

    // --- CONTROLE DO FORMULÁRIO DE PRAZOS ---
    elements.openFormBtn?.addEventListener('click', () => {
        elements.formSection.classList.toggle('hidden');
    });

    elements.cancelarForm?.addEventListener('click', () => {
        elements.formSection.classList.add('hidden');
        elements.formPrazo.reset();
        state.editingId = null;
        document.getElementById('file-name-display').textContent = "Nenhum arquivo selecionado";
    });

    // Nome do arquivo selecionado no form
    document.getElementById('post-file')?.addEventListener('change', (e) => {
        const fileNameDisplay = document.getElementById('file-name-display');
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = e.target.files[0].name;
            fileNameDisplay.style.color = 'var(--primary)';
        } else {
            fileNameDisplay.textContent = "Nenhum arquivo selecionado";
            fileNameDisplay.style.color = 'var(--text-muted)';
        }
    });

    // --- ENVIAR PRAZO ---
    elements.formPrazo?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSalvar = document.getElementById('btn-salvar');
        btnSalvar.disabled = true;

        try {
            const fileInput = document.getElementById('post-file');
            let fileUrl = null;

            if (fileInput.files.length > 0) {
                btnSalvar.textContent = 'Subindo arquivo...';
                fileUrl = await uploadArquivo(fileInput.files[0]);
            }

            const sessao = await getSessaoAtual();
            
            // O objeto agora inclui a Disciplina
            const novoPrazo = {
                user_id: sessao.user.id,
                title: document.getElementById('titulo').value,
                disciplina: document.getElementById('disciplina').value, // <-- NOVO CAMPO AQUI
                description: document.getElementById('descricao').value,
                event_date: document.getElementById('data_entrega').value.split('T')[0],
                tipo_evento: document.getElementById('tipo_evento').value,
                is_public: document.getElementById('post-public')?.checked || false,
                file_url: fileUrl
            };

            if (state.editingId) {
                await atualizarPrazo(state.editingId, novoPrazo);
                Swal.fire('Sucesso', 'Prazo atualizado!', 'success');
                state.editingId = null;
            } else {
                await persistirPrazo(novoPrazo);
                Swal.fire('Sucesso', 'Publicado!', 'success');
            }

            elements.formPrazo.reset();
            elements.formSection.classList.add('hidden');
            document.getElementById('file-name-display').textContent = "Nenhum arquivo selecionado"; 
            carregarPrazos();
        } catch (err) {
            Swal.fire('Erro', err.message, 'error');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Gravar no Sistema';
        }
    });

    // --- EVENTOS DO CALENDÁRIO ---
    document.getElementById('prev-month')?.addEventListener('click', () => {
        dataExibida.setMonth(dataExibida.getMonth() - 1);
        renderizarCalendario();
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
        dataExibida.setMonth(dataExibida.getMonth() + 1);
        renderizarCalendario();
    });
};

// --- FUNÇÕES DE DASHBOARD E RENDERIZAÇÃO ---
function entrarNoDashboard(role, email, period) {
    state.userRole = role;
    state.userPeriod = period;
    
    elements.loginScreen.classList.add('hidden');
    elements.dashboardScreen.classList.remove('hidden');
    
    elements.openFormBtn.classList.remove('hidden');
    
    const labelPublic = document.getElementById('label-public');
    if (labelPublic) {
        labelPublic.style.display = (role === 'representative') ? 'flex' : 'none';
    }

    getSessaoAtual().then(sessao => {
        if (sessao?.user) {
            const meta = sessao.user.user_metadata || {};
            const nomeExibicao = meta.name || email.split('@')[0];
            const periodoExibicao = meta.period || period;

            elements.userNameLabel.textContent = nomeExibicao;
            document.getElementById('user-period-label').textContent = periodoExibicao ? `${periodoExibicao}º Período` : 'Sem período';
            
            elements.userRoleLabel.textContent = role === 'representative' ? 'Representante' : 'Estudante';
            elements.userAvatar.textContent = nomeExibicao.charAt(0).toUpperCase();
        }
    });
    
    carregarPrazos();
    renderizarCalendario();
}

const carregarPrazos = async () => {
    try {
        const dados = await buscarPrazos(state.userRole === 'student' ? state.userPeriod : null);
        state.prazos = dados || [];
        renderizarPrazos();
    } catch (err) {
        console.error(err);
    }
};

const renderizarPrazos = () => {
    elements.prazosList.innerHTML = '';
    
    if (state.prazos.length === 0) {
        elements.emptyState?.classList.remove('hidden');
        return;
    }

    elements.emptyState?.classList.add('hidden');

    state.prazos.forEach(prazo => {
        const card = document.createElement('div');
        const tipo = prazo.tipo_evento?.toLowerCase() || 'atividade';
        card.className = `prazo-card glass-panel tipo-${tipo} ${prazo.is_public ? 'oficial' : ''}`;
        
        const [ano, mes, dia] = prazo.event_date.split('-');
        
        card.innerHTML = `
            <div class="prazo-header">
                <span class="prazo-badge ${tipo}">${tipo.toUpperCase()}</span>
                ${state.userRole === 'representative' ? `
                    <button class="btn-icon" onclick="window.deletarPrazo('${prazo.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
            
            <h3 class="prazo-title">${prazo.title}</h3>
            
            ${prazo.disciplina ? `<span style="font-size: 0.8rem; color: var(--primary); font-weight: 700; display: block; margin-bottom: 10px;"><i class="fas fa-book"></i> ${prazo.disciplina}</span>` : ''}
            
            <p class="prazo-body">${prazo.description || ''}</p>
            
            <div class="prazo-extras">
                ${prazo.file_url ? `
                    <a href="${prazo.file_url}" target="_blank" class="badge-anexo">
                        <i class="fas fa-paperclip"></i> Ver Material
                    </a>
                ` : ''}
            </div>
            <div class="prazo-footer">
                <i class="far fa-calendar-alt"></i> Entrega: <strong>${dia}/${mes}/${ano}</strong>
            </div>
        `;
        elements.prazosList.appendChild(card);
    });
};

// LÓGICA DO CALENDÁRIO LATERAL
const renderizarCalendario = () => {
    const monthYearDisplay = document.getElementById('month-year-display');
    const daysContainer = document.getElementById('calendar-days');
    if (!monthYearDisplay || !daysContainer) return;

    const ano = dataExibida.getFullYear();
    const mes = dataExibida.getMonth();

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    monthYearDisplay.textContent = `${meses[mes]} ${ano}`;
    daysContainer.innerHTML = '';

    const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const hoje = new Date();

    for (let i = 0; i < primeiroDiaDoMes; i++) {
        daysContainer.appendChild(document.createElement('div'));
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const divDia = document.createElement('div');
        divDia.className = 'day';
        divDia.textContent = dia;

        if (dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) {
            divDia.classList.add('today');
        }

        daysContainer.appendChild(divDia);
    }
};

// GLOBAL PARA O BOTÃO TRASH
window.deletarPrazo = async (id) => {
    const confirm = await Swal.fire({
        title: 'Excluir?',
        text: 'Remover este aviso da timeline?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir'
    });

    if (confirm.isConfirmed) {
        await excluirPrazo(id);
        carregarPrazos();
    }
};

initApp();