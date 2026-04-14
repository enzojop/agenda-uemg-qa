import { 
    persistirPrazo, buscarPrazos, cadastrarUsuario, logarUsuario, 
    deslogarUsuario, getSessaoAtual, excluirPrazo, atualizarPrazo,
    uploadArquivo, buscarDisciplinasPorPeriodo // <-- NOVO IMPORT AQUI
} from './supabase.js';

// IMPORTANTE: Importando nossa fábrica de validação!
import { criarObjetoPrazo, validarEmailInstitucional } from './utils.js';

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

                // 1. Define a role baseada na chave do coordenador
                const roleFinal = (chave === 'UEMG2026') ? 'representative' : 'student';

                // 2. A TRAVA INSTITUCIONAL (Bloqueia quem não é da UEMG)
                if (!validarEmailInstitucional(email, roleFinal)) {
                    throw new Error('Acesso negado. Utilize seu e-mail institucional (@discente.uemg.br)');
                }

                // 3. Se passar, cadastra no banco
                await cadastrarUsuario(email, password, { 
                    name: nome, 
                    period: parseInt(periodo), 
                    secret_key: chave 
                });

                Swal.fire('Sucesso!', 'Conta criada. Faça login para continuar.', 'success');
                elements.tabLogin.click(); // Volta para a aba de login
            }
        } catch (err) {
            Swal.fire('Atenção', err.message, 'warning'); // Mudei para warning para não parecer um "erro" fatal do sistema
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
            
            const titulo = document.getElementById('titulo').value;
            const disciplina = document.getElementById('disciplina').value;
            const descricao = document.getElementById('descricao').value;
            const dataInput = document.getElementById('data_entrega').value;
            const tipo = document.getElementById('tipo_evento').value;
            const periodo = state.userPeriod; 

            // 1. Validação Segura via utils.js
            const dadosValidados = criarObjetoPrazo(titulo, descricao, dataInput, tipo, periodo, disciplina);

            // 2. Removemos 'periodo' pois ele não existe na tabela 'events' do seu SQL
            delete dadosValidados.periodo;

            // 3. Monta o objeto exato para o Supabase
            const novoPrazo = {
                ...dadosValidados,
                user_id: sessao.user.id,
                file_url: fileUrl,
                is_public: document.getElementById('post-public')?.checked || false
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
            Swal.fire('Atenção', err.message, 'warning');
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
// Adicionamos 'async' aqui para poder carregar as disciplinas
async function entrarNoDashboard(role, email, period) {
    state.userRole = role;
    state.userPeriod = period;
    
    elements.loginScreen.classList.add('hidden');
    elements.dashboardScreen.classList.remove('hidden');
    
    elements.openFormBtn.classList.remove('hidden');
    
    const labelPublic = document.getElementById('label-public');
    if (labelPublic) {
        labelPublic.style.display = (role === 'representative') ? 'flex' : 'none';
    }

    const sessao = await getSessaoAtual();
    if (sessao?.user) {
        const meta = sessao.user.user_metadata || {};
        const nomeExibicao = meta.name || email.split('@')[0];
        const periodoExibicao = meta.period || period;

        elements.userNameLabel.textContent = nomeExibicao;
        document.getElementById('user-period-label').textContent = periodoExibicao ? `${periodoExibicao}º Período` : 'Sem período';
        
        elements.userRoleLabel.textContent = role === 'representative' ? 'Representante' : 'Estudante';
        elements.userAvatar.textContent = nomeExibicao.charAt(0).toUpperCase();
    }
    
    // CARREGA AS DISCIPLINAS DO BANCO
    await carregarDisciplinas(period);

    carregarPrazos();
    renderizarCalendario();
}

// BUSCA DISCIPLINAS DINAMICAMENTE
const carregarDisciplinas = async (periodo) => {
    try {
        const disciplinas = await buscarDisciplinasPorPeriodo(periodo);
        const select = document.getElementById('disciplina');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione a disciplina...</option>';
        disciplinas.forEach(d => {
            select.innerHTML += `<option value="${d.name}">${d.name}</option>`;
        });
    } catch (err) {
        console.error("Erro ao carregar disciplinas:", err);
    }
};

const carregarPrazos = async () => {
    try {
        const dados = await buscarPrazos();
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
            
            ${prazo.disciplina ? `<span style="font-size: 0.8rem; color: var(--primary); font-weight: 700; display: block; margin-bottom: 10px;"><i class="fas fa-book"></i> ${prazo.discipline_name}</span>` : ''}
            
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