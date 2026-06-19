/* InventoPC — helpdesk.js */

let tickets = [];
let nextTicketId = 101;
let selectedTicket = null;

function loadTickets() {
  try {
    const s = localStorage.getItem("inventopc_tickets");
    if (s) {
      tickets = JSON.parse(s);
      nextTicketId = Math.max(nextTicketId, ...tickets.map(t=>t.id)) + 1;
    } else {
      tickets = getDemoTickets();
      saveTickets();
    }
  } catch { tickets = getDemoTickets(); }
  updateTicketBadge();
}

function saveTickets() {
  try { localStorage.setItem("inventopc_tickets", JSON.stringify(tickets)); } catch {}
  updateTicketBadge();
}

function updateTicketBadge() {
  const count = tickets.filter(t=>t.status==="aberto"||t.status==="andamento").length;
  const b = document.getElementById("ticketBadge");
  if (!b) return;
  b.style.display = count > 0 ? "flex" : "none";
  b.textContent = count;
}

function getDemoTickets() {
  const cfg = loadConfig();
  return [
    { id:101, protocolo:"#101", titulo:"Nova Admissão | Santa Catarina | 22/06/2026",
      descricao:"Boa tarde, Bruno\n\nSegue abaixo dados do novo colaborador:\n\nNome: Rafael Cordoba dos Santos Salmeiron\nCargo: Engenheiro Civil\nÁrea: Engenharia\nEmpresa: Livus Santa Catarina\nData de início: 22/06/2026\nEquipamento: (x) Desktop\nTelefone: 11 97783-5111\nLocalização: Livus Santa Catarina",
      solicitante:"Erika Colen", email:"erika.colen@meritoinvestimentos.com.br",
      setor:"RH", categoria:"Admissão - RH", prioridade:"baixa",
      status:"aberto", grupo:"Tecnologia", agente:"Bruno Ribamar",
      tipo_equip:"desktop", patrimonio:"",
      tags:["admissão","novo colaborador"],
      criado:new Date(Date.now()-7200000).toISOString(),
      atualizado:new Date(Date.now()-7200000).toISOString(),
      historico:[{autor:"Sistema",tipo:"sistema",texto:"Ticket criado via e-mail.",data:new Date(Date.now()-7200000).toISOString()}]
    },
    { id:102, protocolo:"#102", titulo:"Bloqueio de Acessos - Realty",
      descricao:"Olá,\n\nPreciso bloquear os acessos do colaborador Pedro Alves que saiu da empresa ontem.",
      solicitante:"Carlos Lima", email:"carlos@empresa.com",
      setor:"RH", categoria:"Bloqueio de Acesso", prioridade:"alta",
      status:"andamento", grupo:"Tecnologia", agente:"Técnico 1",
      tipo_equip:"desktop", patrimonio:"",
      tags:["bloqueio","desligamento"],
      criado:new Date(Date.now()-172800000).toISOString(),
      atualizado:new Date(Date.now()-3600000).toISOString(),
      historico:[
        {autor:"Sistema",tipo:"sistema",texto:"Ticket criado via e-mail.",data:new Date(Date.now()-172800000).toISOString()},
        {autor:"Técnico 1",tipo:"resposta",texto:"Iniciando processo de bloqueio. Conta AD desabilitada. Aguardando confirmação do RH para remoção dos grupos.",data:new Date(Date.now()-3600000).toISOString()}
      ]
    },
    { id:103, protocolo:"#103", titulo:"Nova Admissão | Livus Mooca | 08/06/2026",
      descricao:"Novo colaborador para o escritório Mooca.",
      solicitante:"Ana Paula", email:"ana.paula@empresa.com",
      setor:"RH", categoria:"Admissão - RH", prioridade:"baixa",
      status:"resolvido", grupo:"Tecnologia", agente:"Bruno Ribamar",
      tipo_equip:"notebook", patrimonio:"PAT-0234",
      tags:["admissão"],
      criado:new Date(Date.now()-864000000).toISOString(),
      atualizado:new Date(Date.now()-432000000).toISOString(),
      historico:[
        {autor:"Sistema",tipo:"sistema",texto:"Ticket criado via e-mail.",data:new Date(Date.now()-864000000).toISOString()},
        {autor:"Bruno Ribamar",tipo:"resposta",texto:"Equipamento configurado e entregue. Notebook patrimônio PAT-0234 configurado com Windows 11 Pro.",data:new Date(Date.now()-432000000).toISOString()}
      ]
    },
  ];
}

// ── RENDER LISTA — estilo Freshdesk ───────────────────────────────
function renderTickets() {
  loadTickets();
  const cfg = loadConfig();
  const sf  = "all", pf = "all";

  const statCounts = s => tickets.filter(t=>t.status===s).length;

  document.getElementById("pageContent").innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:18px">
      <div class="stat-card blue"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-ticket"></i></div>
        <div class="stat-label">Total</div><div class="stat-num">${tickets.length}</div>
      </div>
      <div class="stat-card amber"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-label">Abertos</div><div class="stat-num">${statCounts("aberto")}</div>
      </div>
      <div class="stat-card purple"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-spinner"></i></div>
        <div class="stat-label">Em andamento</div><div class="stat-num">${statCounts("andamento")}</div>
      </div>
      <div class="stat-card green"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-circle-check"></i></div>
        <div class="stat-label">Resolvidos</div><div class="stat-num">${statCounts("resolvido")}</div>
      </div>
    </div>

    <div class="section-header">
      <div class="section-title">Todos os tickets</div>
      <div class="section-count">${tickets.length}</div>
      <div class="section-actions">
        <select class="filter-select" id="tkStatus" onchange="renderTicketList()">
          <option value="all">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="andamento">Em andamento</option>
          <option value="resolvido">Resolvido</option>
          <option value="fechado">Fechado</option>
        </select>
        <select class="filter-select" id="tkPrior" onchange="renderTicketList()">
          <option value="all">Todas prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <select class="filter-select" id="tkCat" onchange="renderTicketList()">
          <option value="all">Todas categorias</option>
          ${cfg.categorias.map(c=>`<option value="${c}">${c}</option>`).join("")}
        </select>
        <button class="topbar-btn primary" onclick="switchView('novo-ticket')">
          <i class="fa-solid fa-plus"></i> Novo Ticket
        </button>
      </div>
    </div>

    <div class="table-wrap">
      <div class="ticket-list-header">
        <div style="min-width:70px">Nº</div>
        <div style="width:32px"></div>
        <div style="flex:1">Assunto</div>
        <div style="min-width:100px">Categoria</div>
        <div style="min-width:80px">Agente</div>
        <div style="min-width:90px">Prioridade</div>
        <div style="min-width:90px">Status</div>
        <div style="min-width:80px">Criado</div>
      </div>
      <div id="ticketListBody"></div>
    </div>`;

  renderTicketList();
}

function renderTicketList() {
  const sf  = document.getElementById("tkStatus")?.value || "all";
  const pf  = document.getElementById("tkPrior")?.value  || "all";
  const cf  = document.getElementById("tkCat")?.value    || "all";

  const list = tickets.filter(t => {
    return (sf==="all"||t.status===sf) &&
           (pf==="all"||t.prioridade===pf) &&
           (cf==="all"||t.categoria===cf);
  }).sort((a,b)=>new Date(b.criado)-new Date(a.criado));

  const body = document.getElementById("ticketListBody");
  if (!body) return;

  if (!list.length) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fa-solid fa-inbox"></i></div><h3>Nenhum ticket encontrado</h3><p>Ajuste os filtros ou crie um novo ticket.</p></div>`;
    return;
  }

  body.innerHTML = list.map(t => {
    const initials = (t.solicitante||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
    return `
    <div class="ticket-row ${t.prioridade}" onclick="openTicketDetail(${t.id})">
      <div class="ticket-num">${t.protocolo}</div>
      <div class="ticket-avatar" title="${t.solicitante}">${initials}</div>
      <div class="ticket-info">
        <div class="ticket-title">${t.titulo}</div>
        <div class="ticket-meta">
          <span><i class="fa-solid fa-user"></i> ${t.solicitante}</span>
          ${t.patrimonio?`<span><i class="fa-solid fa-tag" style="color:var(--purple)"></i> ${t.patrimonio}</span>`:""}
          ${t.setor?`<span><i class="fa-solid fa-building"></i> ${t.setor}</span>`:""}
        </div>
      </div>
      <div style="min-width:100px;font-size:12px;color:var(--text-2)">${t.categoria||"—"}</div>
      <div style="min-width:80px;font-size:12px;color:var(--text-2)">${t.agente||"—"}</div>
      <div style="min-width:90px">${badgePrioridade(t.prioridade)}</div>
      <div style="min-width:90px">${badgeStatus2(t.status)}</div>
      <div class="ticket-time">${relativeTime(t.criado)}</div>
    </div>`;
  }).join("");
}

// ── DETALHE — estilo Freshdesk ────────────────────────────────────
function openTicketDetail(id) {
  const t = tickets.find(x=>x.id===id);
  if (!t) return;
  selectedTicket = t;
  const cfg = loadConfig();

  document.getElementById("ticketModalTitle").textContent = t.protocolo + " — " + t.titulo;
  document.getElementById("ticketModalSub").textContent   = t.solicitante + " · " + relativeTime(t.criado);

  const initials = (t.solicitante||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();

  document.getElementById("ticketModalBody").innerHTML = `
    <div class="ticket-detail-layout">

      <!-- COLUNA PRINCIPAL -->
      <div class="ticket-detail-main">

        <!-- Action buttons (Freshdesk style) -->
        <div class="ticket-actions-bar">
          <button class="ticket-action-btn primary" onclick="setReplyTab('responder')">
            <i class="fa-solid fa-reply"></i> Responder
          </button>
          <button class="ticket-action-btn" onclick="setReplyTab('anotacao')">
            <i class="fa-solid fa-note-sticky"></i> Anotação
          </button>
          <button class="ticket-action-btn" onclick="setReplyTab('encaminhar')">
            <i class="fa-solid fa-share"></i> Encaminhar
          </button>
          <button class="ticket-action-btn" onclick="resolveTicket(${t.id})" style="margin-left:auto">
            <i class="fa-solid fa-circle-check"></i> Fechar
          </button>
        </div>

        <!-- E-mail original -->
        <div class="ticket-email-header">
          <div class="ticket-email-subject">${t.titulo}</div>
          <div class="ticket-email-from" style="margin-top:10px">
            <div class="ticket-email-avatar">${initials}</div>
            <div>
              <div style="font-size:13px;font-weight:600">${t.solicitante}</div>
              <div class="ticket-email-meta">
                relatado por e-mail · ${new Date(t.criado).toLocaleString("pt-BR")}
              </div>
              <div class="ticket-email-meta" style="margin-top:3px">
                Para: <span style="color:var(--brand)">suporte.ti@empresa.com.br</span>
                ${t.email?`&nbsp;· De: <span style="color:var(--brand)">${t.email}</span>`:""}
              </div>
            </div>
          </div>
        </div>

        <div class="ticket-email-body">${(t.descricao||"").replace(/\n/g,"<br>")}</div>

        <!-- Timeline -->
        <div class="timeline" style="margin-top:18px">
          ${t.historico.map((h,i)=>`
            <div class="timeline-item">
              <div>
                <div class="timeline-dot ${h.tipo==='sistema'?'system':''}"></div>
              </div>
              <div class="timeline-body">
                <div class="timeline-time"><strong>${h.autor}</strong> · ${relativeTime(h.data)}</div>
                <div class="timeline-text">${h.texto.replace(/\n/g,"<br>")}</div>
              </div>
            </div>`).join("")}
        </div>

        <!-- Reply box -->
        <div class="reply-box">
          <div class="reply-tabs">
            <button class="reply-tab active" id="tab-responder" onclick="setReplyTab('responder')">Responder</button>
            <button class="reply-tab" id="tab-anotacao" onclick="setReplyTab('anotacao')">Anotação Interna</button>
            <button class="reply-tab" id="tab-encaminhar" onclick="setReplyTab('encaminhar')">Encaminhar</button>
          </div>
          <textarea id="replyText" placeholder="Digite sua resposta..."></textarea>
          <div class="reply-footer">
            <span style="font-size:12px;color:var(--text-3)">
              <i class="fa-solid fa-lock"></i> Resposta para ${t.email||t.solicitante}
            </span>
            <button class="btn-primary btn-sm" onclick="sendReply(${t.id})">
              <i class="fa-solid fa-paper-plane"></i> Enviar
            </button>
          </div>
        </div>
      </div>

      <!-- SIDEBAR — Propriedades (Freshdesk style) -->
      <div class="ticket-detail-sidebar">

        <div style="font-size:13px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
          Aberto <span style="font-size:12px;font-weight:400;color:var(--text-3)">${t.protocolo}</span>
        </div>

        <div class="ticket-sidebar-section">
          <h4>Propriedades</h4>

          <div class="ticket-prop">
            <label>Tags</label>
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">
              ${(t.tags||[]).map(tag=>`<span style="background:var(--surface-3);border:1px solid var(--border);border-radius:99px;padding:2px 9px;font-size:11.5px">${tag}</span>`).join("")}
              <button onclick="addTag(${t.id})" style="background:none;border:1.5px dashed var(--border);border-radius:99px;padding:2px 9px;font-size:11.5px;color:var(--text-3);cursor:pointer">+ add</button>
            </div>
          </div>

          <div class="ticket-prop">
            <label>Tipo *</label>
            <select onchange="updateTicketProp(${t.id},'categoria',this.value)">
              <option value="">Selecione...</option>
              ${cfg.categorias.map(c=>`<option value="${c}" ${t.categoria===c?"selected":""}>${c}</option>`).join("")}
            </select>
          </div>

          <div class="ticket-prop">
            <label>Status *</label>
            <select onchange="updateTicketProp(${t.id},'status',this.value)">
              ${["aberto","andamento","resolvido","fechado"].map(s=>
                `<option value="${s}" ${t.status===s?"selected":""}>${{aberto:"Aberto",andamento:"Em andamento",resolvido:"Resolvido",fechado:"Fechado"}[s]}</option>`
              ).join("")}
            </select>
          </div>

          <div class="ticket-prop">
            <label>Prioridade</label>
            <select onchange="updateTicketProp(${t.id},'prioridade',this.value)">
              ${["baixa","media","alta","critica"].map(p=>
                `<option value="${p}" ${t.prioridade===p?"selected":""}>${{baixa:"Baixa",media:"Média",alta:"Alta",critica:"Crítica"}[p]}</option>`
              ).join("")}
            </select>
          </div>

          <div class="ticket-prop">
            <label>Grupo</label>
            <select onchange="updateTicketProp(${t.id},'grupo',this.value)">
              <option value="">Selecione...</option>
              ${cfg.grupos.map(g=>`<option value="${g}" ${t.grupo===g?"selected":""}>${g}</option>`).join("")}
            </select>
          </div>

          <div class="ticket-prop">
            <label>Agente</label>
            <select onchange="updateTicketProp(${t.id},'agente',this.value)">
              <option value="">Selecione...</option>
              ${cfg.agentes.map(a=>`<option value="${a}" ${t.agente===a?"selected":""}>${a}</option>`).join("")}
            </select>
          </div>

          ${t.patrimonio?`
          <div class="ticket-prop">
            <label>Nº Patrimônio</label>
            <div class="patrimonio-tag" style="display:inline-flex;margin-top:4px"><i class="fa-solid fa-tag"></i>${t.patrimonio}</div>
          </div>`:""}
        </div>

        <!-- Informações do contato -->
        <div class="ticket-sidebar-section">
          <h4>Informações de contato <a href="#" style="font-size:11px;color:var(--brand);font-weight:400">Editar</a></h4>
          <div class="contact-info">
            <div class="ticket-email-avatar" style="width:36px;height:36px;margin-bottom:8px;font-size:13px">${initials}</div>
            <div class="contact-name">${t.solicitante}</div>
            <div class="contact-detail"><i class="fa-solid fa-envelope" style="width:14px"></i> ${t.email||"—"}</div>
            <div class="contact-detail"><i class="fa-solid fa-building" style="width:14px"></i> ${t.setor||"—"}</div>
          </div>
        </div>

        <!-- Linha do tempo recente -->
        <div class="ticket-sidebar-section">
          <h4>Linha do tempo recente</h4>
          ${tickets.filter(x=>x.id!==t.id&&x.email===t.email).slice(0,3).map(x=>`
            <div onclick="openTicketDetail(${x.id})" style="cursor:pointer;padding:8px;border-radius:var(--radius);margin-bottom:6px;background:var(--surface-2);border:1px solid var(--border)">
              <div style="font-size:12px;font-weight:600;margin-bottom:2px">${x.titulo}</div>
              <div style="font-size:11px;color:var(--text-3)">${x.protocolo} · ${relativeTime(x.criado)}</div>
              <div style="font-size:11px;color:var(--text-3)">Status: ${x.status}</div>
            </div>`).join("") || '<div style="font-size:12px;color:var(--text-3)">Nenhum ticket anterior.</div>'}
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
      <button class="btn-danger btn-sm" onclick="deleteTicketConfirm(${t.id})"><i class="fa-solid fa-trash"></i> Excluir ticket</button>
      <button class="btn-secondary btn-sm" onclick="closeTicketModal()">Fechar</button>
    </div>`;

  show("ticketModal"); show("ticketBackdrop");
}

function setReplyTab(tab) {
  ["responder","anotacao","encaminhar"].forEach(t => {
    const el = document.getElementById("tab-"+t);
    if (el) el.classList.toggle("active", t===tab);
  });
  const ta = document.getElementById("replyText");
  const placeholders = { responder:"Digite sua resposta...", anotacao:"Adicione uma anotação interna (visível apenas para a equipe)...", encaminhar:"Digite o e-mail de destino e a mensagem..." };
  if (ta) ta.placeholder = placeholders[tab] || "";
}

function sendReply(id) {
  const t    = tickets.find(x=>x.id===id);
  const text = document.getElementById("replyText")?.value?.trim();
  if (!t || !text) { toast("Digite uma mensagem antes de enviar.", "error"); return; }
  t.historico.push({ autor: currentUser?.nome||currentUser?.username||"Técnico", tipo:"resposta", texto:text, data:new Date().toISOString() });
  t.atualizado = new Date().toISOString();
  saveTickets();
  openTicketDetail(id);
  toast("Resposta adicionada!", "success");
}

function updateTicketProp(id, prop, value) {
  const t = tickets.find(x=>x.id===id);
  if (!t) return;
  const old = t[prop];
  t[prop]  = value;
  t.historico.push({ autor:"Sistema", tipo:"sistema", texto:`${prop} alterado de "${old}" para "${value}".`, data:new Date().toISOString() });
  t.atualizado = new Date().toISOString();
  saveTickets();
  toast("Atualizado!", "success");
}

function resolveTicket(id) {
  updateTicketProp(id, "status", "fechado");
  closeTicketModal();
  renderTickets();
}

function deleteTicketConfirm(id) {
  if (!confirm("Excluir este ticket permanentemente?")) return;
  tickets = tickets.filter(x=>x.id!==id);
  saveTickets();
  closeTicketModal();
  toast("Ticket excluído.", "info");
  renderTickets();
}

function addTag(id) {
  const tag = prompt("Nova tag:");
  if (!tag) return;
  const t = tickets.find(x=>x.id===id);
  if (!t) return;
  if (!t.tags) t.tags = [];
  t.tags.push(tag.trim());
  saveTickets();
  openTicketDetail(id);
}

// ── NOVO TICKET ───────────────────────────────────────────────────
function renderNovoTicket() {
  const cfg = loadConfig();
  document.getElementById("pageContent").innerHTML = `
    <div style="max-width:700px">
      <div class="card" style="padding:28px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;padding-bottom:16px;border-bottom:1px solid var(--border)">
          <div style="width:44px;height:44px;background:var(--brand-l);border-radius:11px;display:flex;align-items:center;justify-content:center;color:var(--brand);font-size:20px">
            <i class="fa-solid fa-headset"></i>
          </div>
          <div>
            <div style="font-size:16px;font-weight:700">Abrir Novo Ticket</div>
            <div style="font-size:12px;color:var(--text-3)">Preencha as informações do chamado</div>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-field span2">
            <label>Título / Assunto *</label>
            <input type="text" id="nt-titulo" placeholder="Ex: Nova Admissão | Livus SC | 22/06/2026">
          </div>
          <div class="form-field">
            <label>Nome do solicitante *</label>
            <input type="text" id="nt-solicitante" placeholder="Nome completo">
          </div>
          <div class="form-field">
            <label>E-mail *</label>
            <input type="email" id="nt-email" placeholder="email@empresa.com">
          </div>
          <div class="form-field">
            <label>Setor / Empresa</label>
            <input type="text" id="nt-setor" placeholder="RH, Financeiro...">
          </div>
          <div class="form-field">
            <label>Categoria / Tipo</label>
            <select id="nt-categoria">
              <option value="">Selecione...</option>
              ${cfg.categorias.map(c=>`<option value="${c}">${c}</option>`).join("")}
            </select>
          </div>
          <div class="form-field">
            <label>Prioridade</label>
            <select id="nt-prioridade">
              <option value="baixa">Baixa</option>
              <option value="media" selected>Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div class="form-field">
            <label>Grupo</label>
            <select id="nt-grupo">
              <option value="">Selecione...</option>
              ${cfg.grupos.map(g=>`<option value="${g}">${g}</option>`).join("")}
            </select>
          </div>
          <div class="form-field">
            <label>Agente Responsável</label>
            <select id="nt-agente">
              <option value="">Não atribuído</option>
              ${cfg.agentes.map(a=>`<option value="${a}">${a}</option>`).join("")}
            </select>
          </div>
          <div class="form-field">
            <label>Tipo de Equipamento</label>
            <select id="nt-tipo" onchange="toggleNtPat()">
              ${cfg.tipos_equipamento.map(t=>`<option value="${t}">${t}</option>`).join("")}
            </select>
          </div>
          <div class="form-field" id="nt-pat-wrap" style="display:none">
            <label><i class="fa-solid fa-tag" style="color:var(--purple);margin-right:5px"></i> Nº Patrimônio <span style="font-size:10px;background:var(--purple-l);color:var(--purple);padding:1px 6px;border-radius:4px">Notebook</span></label>
            <input type="text" id="nt-patrimonio" placeholder="PAT-000001" style="font-family:monospace;font-weight:600">
          </div>
          <div class="form-field span2">
            <label>Descrição *</label>
            <textarea id="nt-descricao" rows="6" placeholder="Descreva o chamado com detalhes..."></textarea>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
          <button class="btn-secondary" onclick="switchView('tickets')">Cancelar</button>
          <button class="btn-primary" onclick="criarTicket()">
            <i class="fa-solid fa-paper-plane"></i> Criar Ticket
          </button>
        </div>
      </div>
    </div>`;
}

function toggleNtPat() {
  const t = document.getElementById("nt-tipo");
  const w = document.getElementById("nt-pat-wrap");
  if (t && w) w.style.display = t.value.toLowerCase().includes("notebook") ? "flex" : "none";
}

function criarTicket() {
  const titulo      = document.getElementById("nt-titulo")?.value.trim();
  const solicitante = document.getElementById("nt-solicitante")?.value.trim();
  const email       = document.getElementById("nt-email")?.value.trim();
  const descricao   = document.getElementById("nt-descricao")?.value.trim();
  if (!titulo||!solicitante||!email||!descricao) { toast("Preencha os campos obrigatórios.", "error"); return; }

  const id = nextTicketId++;
  const ts = new Date().toISOString();
  tickets.unshift({
    id, protocolo:`#${id}`, titulo, descricao, solicitante, email,
    setor:        document.getElementById("nt-setor")?.value||"",
    categoria:    document.getElementById("nt-categoria")?.value||"",
    prioridade:   document.getElementById("nt-prioridade")?.value||"media",
    grupo:        document.getElementById("nt-grupo")?.value||"",
    agente:       document.getElementById("nt-agente")?.value||"",
    tipo_equip:   document.getElementById("nt-tipo")?.value||"",
    patrimonio:   document.getElementById("nt-patrimonio")?.value.trim()||"",
    tags:[], status:"aberto",
    criado:ts, atualizado:ts,
    historico:[{autor:"Sistema",tipo:"sistema",texto:`Ticket criado por ${solicitante} via painel.`,data:ts}]
  });
  saveTickets();
  toast(`Ticket #${id} criado com sucesso!`, "success");
  switchView("tickets");
}
