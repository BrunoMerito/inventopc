/* InventoPC — app.js  (core) */

const API_BASE = window.location.origin;
const REFRESH_INTERVAL = 30000;

let currentUser  = null;
let currentView  = "dashboard";
let computers    = [];
let searchQuery  = "";
let filterStatus = "all";
let filterLoc    = "all";
let editingId    = null;
let refreshTimer = null;

// ── LOGIN ──────────────────────────────────────────────────────
async function doLogin(e) {
  e.preventDefault();
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;
  const errEl    = document.getElementById("loginError");

  // Tentar API
  try {
    const r = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    if (r.ok) {
      const user = await r.json();
      setCurrentUser(user);
      errEl.style.display = "none";
      return;
    }
  } catch {}

  // Fallback local
  const LOCAL = {
    admin:   { pass: "admin123", role: "admin",   nome: "Administrador" },
    tecnico: { pass: "tec2024",  role: "tecnico", nome: "Técnico" },
  };
  const u = LOCAL[username];
  if (u && u.pass === password) {
    setCurrentUser({ username, role: u.role, nome: u.nome });
    errEl.style.display = "none";
  } else {
    errEl.style.display = "flex";
    document.getElementById("loginPass").value = "";
  }
}

function setCurrentUser(user) {
  currentUser = user;
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display         = "flex";
  const initials = (user.nome || user.username || "A").charAt(0).toUpperCase();
  document.getElementById("sidebarAvatar").textContent   = initials;
  document.getElementById("sidebarUserName").textContent = user.nome || user.username;
  document.getElementById("sidebarUserRole").textContent =
    user.role === "admin" ? "Administrador" : user.role === "tecnico" ? "Técnico" : user.role;
  init();
}

function doLogout() {
  fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  currentUser = null;
  clearInterval(refreshTimer);
  document.getElementById("app").style.display         = "none";
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
}

// ── INIT ────────────────────────────────────────────────────────
async function init() {
  applyBranding();
  loadTickets();
  await loadData();
  switchView("dashboard");
  refreshTimer = setInterval(refreshData, REFRESH_INTERVAL);
}

async function refreshData() {
  await loadData();
  if (["dashboard","inv-stand","inv-escritorio","inv-obra","rede"].includes(currentView)) render();
}

// ── DATA ────────────────────────────────────────────────────────
async function loadData() {
  try {
    const r = await fetch(`${API_BASE}/api/computers`);
    if (r.ok) { computers = await r.json(); setServerStatus(true); return; }
  } catch {}
  setServerStatus(false);
  if (!computers.length) loadDemoData();
}

function loadDemoData() {
  computers = [
    { id:1, hostname:"PC-FINANCEIRO-01", ip:"192.168.1.10", mac:"aa:bb:cc:11:22:33", usuario:"Ana Souza",    setor:"Financeiro", localidade:"escritorio", localizacao:"Sala Financeiro - 2º Andar", so:"Windows 11 Pro", cpu:"Intel i5-12400", ram:"16 GB", disco:"512 GB SSD", fabricante:"Dell", modelo:"OptiPlex", serial:"SN001", tipo:"desktop",  patrimonio:"",         status:"online",     vnc_port:5900, ultimo_visto:new Date().toISOString(), obs:"" },
    { id:2, hostname:"NB-RH-01",         ip:"192.168.1.15", mac:"aa:bb:cc:44:55:66", usuario:"Carlos Lima",  setor:"RH",         localidade:"escritorio", localizacao:"Sala RH - 1º Andar",         so:"Windows 10 Pro", cpu:"Intel i3-10100", ram:"8 GB",  disco:"256 GB SSD", fabricante:"HP",   modelo:"ProBook",   serial:"SN002", tipo:"notebook", patrimonio:"PAT-0042", status:"online",     vnc_port:5900, ultimo_visto:new Date().toISOString(), obs:"" },
    { id:3, hostname:"SRV-TI-01",        ip:"192.168.1.1",  mac:"aa:bb:cc:77:88:99", usuario:"TI",          setor:"TI",         localidade:"escritorio", localizacao:"Sala de Servidores",          so:"Windows Server 2022", cpu:"Xeon E-2234", ram:"32 GB", disco:"2 TB RAID", fabricante:"Dell", modelo:"PowerEdge", serial:"SN003", tipo:"servidor", patrimonio:"",         status:"online",     vnc_port:5900, ultimo_visto:new Date().toISOString(), obs:"Servidor principal" },
    { id:4, hostname:"PC-STAND-SP01",    ip:"192.168.2.10", mac:"bb:cc:dd:11:22:33", usuario:"Vendas SP",   setor:"Vendas",     localidade:"stand",      localizacao:"Stand São Paulo - Expo",      so:"Windows 11 Home", cpu:"Intel i5-11400", ram:"8 GB",  disco:"256 GB SSD", fabricante:"Lenovo",modelo:"ThinkCentre",serial:"SN004", tipo:"desktop",  patrimonio:"",         status:"online",     vnc_port:5900, ultimo_visto:new Date().toISOString(), obs:"" },
    { id:5, hostname:"NB-STAND-RJ01",    ip:"192.168.2.15", mac:"bb:cc:dd:44:55:66", usuario:"Vendas RJ",   setor:"Vendas",     localidade:"stand",      localizacao:"Stand Rio de Janeiro",        so:"Windows 11 Pro", cpu:"AMD Ryzen 5",    ram:"16 GB", disco:"512 GB NVMe",fabricante:"Asus",  modelo:"VivoBook",  serial:"SN005", tipo:"notebook", patrimonio:"PAT-0089", status:"offline",    vnc_port:5900, ultimo_visto:new Date(Date.now()-7200000).toISOString(), obs:"" },
    { id:6, hostname:"PC-OBRA-SP01",     ip:"192.168.3.10", mac:"cc:dd:ee:11:22:33", usuario:"Engenharia",  setor:"Obras",      localidade:"obra",       localizacao:"Obra Livus Santa Catarina",   so:"Windows 10 Pro", cpu:"Intel i3-8100",  ram:"8 GB",  disco:"128 GB SSD", fabricante:"Positivo",modelo:"Master",   serial:"SN006", tipo:"desktop",  patrimonio:"",         status:"online",     vnc_port:5900, ultimo_visto:new Date().toISOString(), obs:"" },
    { id:7, hostname:"NB-OBRA-SC01",     ip:"192.168.3.11", mac:"cc:dd:ee:44:55:66", usuario:"Eng. Civil",  setor:"Obras",      localidade:"obra",       localizacao:"Obra Livus Mooca",            so:"Windows 11 Pro", cpu:"Intel i7-11800H",ram:"16 GB", disco:"512 GB NVMe",fabricante:"Dell",  modelo:"Latitude",  serial:"SN007", tipo:"notebook", patrimonio:"PAT-0103", status:"manutencao", vnc_port:5900, ultimo_visto:new Date(Date.now()-3600000).toISOString(), obs:"Troca de bateria" },
    { id:8, hostname:"IMP-RH-01",        ip:"192.168.1.50", mac:"dd:ee:ff:11:22:33", usuario:"RH",          setor:"RH",         localidade:"escritorio", localizacao:"Sala RH",                     so:"",               cpu:"",               ram:"",      disco:"",           fabricante:"HP",   modelo:"LaserJet",  serial:"SN008", tipo:"impressora",patrimonio:"",         status:"online",     vnc_port:0,    ultimo_visto:new Date().toISOString(), obs:"" },
  ];
}

// ── SERVER STATUS ────────────────────────────────────────────────
function setServerStatus(online) {
  const dot  = document.getElementById("serverDot");
  const text = document.getElementById("serverStatusText");
  dot.className  = "status-dot " + (online ? "online" : "offline");
  text.textContent = online ? "Servidor online" : "Modo demo";
}

// ── ROUTING ──────────────────────────────────────────────────────
function switchView(view) {
  currentView  = view;
  searchQuery  = "";
  filterStatus = "all";
  filterLoc    = "all";
  const inp = document.getElementById("globalSearch");
  if (inp) inp.value = "";

  document.querySelectorAll(".nav-link[data-view]").forEach(el => {
    el.classList.toggle("active", el.dataset.view === view);
  });

  const titles = {
    dashboard:       "Dashboard",
    "inv-stand":     "Inventário — Stand",
    "inv-escritorio":"Inventário — Escritório",
    "inv-obra":      "Inventário — Obra",
    rede:            "Rede & Dispositivos",
    tickets:         "Helpdesk — Tickets",
    "novo-ticket":   "Novo Ticket",
    relatorios:      "Relatórios",
    configuracoes:   "Configurações",
  };
  document.getElementById("topbarTitle").textContent = titles[view] || view;

  // Botão +
  const addBtn = document.getElementById("topAddBtn");
  const addMap = {
    "inv-stand": true, "inv-escritorio": true, "inv-obra": true,
    rede: false, tickets: false, "novo-ticket": false,
    relatorios: false, configuracoes: false,
  };
  if (addBtn) {
    addBtn.style.display = (addMap[view] !== false) ? "flex" : "none";
    // pre-set localidade
    const locMap = { "inv-stand":"stand","inv-escritorio":"escritorio","inv-obra":"obra" };
    if (locMap[view]) {
      const sel = document.getElementById("f-localidade");
      if (sel) sel.value = locMap[view];
    }
  }

  render();
}

function render() {
  const views = {
    dashboard:       renderDashboard,
    "inv-stand":     () => renderInventario("stand"),
    "inv-escritorio":() => renderInventario("escritorio"),
    "inv-obra":      () => renderInventario("obra"),
    rede:            renderRede,
    tickets:         renderTickets,
    "novo-ticket":   renderNovoTicket,
    relatorios:      renderRelatorios,
    configuracoes:   renderConfiguracoes,
  };
  (views[currentView] || renderDashboard)();
}

// ── SEARCH ───────────────────────────────────────────────────────
function onSearch() {
  searchQuery = document.getElementById("globalSearch").value.toLowerCase();
  render();
}

function getFiltered(localidade) {
  return computers.filter(c => {
    const matchLoc = !localidade || c.localidade === localidade;
    const matchSt  = filterStatus === "all" || c.status === filterStatus;
    const q        = searchQuery;
    const matchQ   = !q || [c.hostname,c.ip,c.usuario,c.setor,c.localizacao,c.patrimonio,c.serial]
      .some(v => v && v.toLowerCase().includes(q));
    return matchLoc && matchSt && matchQ;
  });
}

// ── DASHBOARD ────────────────────────────────────────────────────
function renderDashboard() {
  const total   = computers.length;
  const online  = computers.filter(c => c.status === "online").length;
  const offline = computers.filter(c => c.status === "offline").length;
  const maint   = computers.filter(c => c.status === "manutencao").length;
  const byLoc   = { stand: 0, escritorio: 0, obra: 0 };
  computers.forEach(c => { if (byLoc[c.localidade] !== undefined) byLoc[c.localidade]++; });
  const ticketAbertos = tickets.filter(t => t.status === "aberto" || t.status === "andamento").length;

  document.getElementById("pageContent").innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat-card blue"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-desktop"></i></div>
        <div class="stat-label">Total dispositivos</div><div class="stat-num">${total}</div>
      </div>
      <div class="stat-card green"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-circle-check"></i></div>
        <div class="stat-label">Online</div><div class="stat-num">${online}</div>
        <div class="stat-sub">${total?Math.round(online/total*100):0}% da frota</div>
      </div>
      <div class="stat-card red"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-circle-xmark"></i></div>
        <div class="stat-label">Offline</div><div class="stat-num">${offline}</div>
      </div>
      <div class="stat-card amber"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-wrench"></i></div>
        <div class="stat-label">Manutenção</div><div class="stat-num">${maint}</div>
      </div>
      <div class="stat-card purple"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-headset"></i></div>
        <div class="stat-label">Tickets abertos</div><div class="stat-num">${ticketAbertos}</div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="dash-card">
        <h3><i class="fa-solid fa-map-location-dot"></i> Por localidade</h3>
        ${[["Stand","stand","#16A34A"],["Escritório","escritorio","#2563EB"],["Obra","obra","#EA580C"]].map(([label,key,color])=>`
          <div class="bar-item">
            <div class="bar-label"><span>${label}</span><span>${byLoc[key]} disp.</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${total?byLoc[key]/total*100:0}%;background:${color}"></div></div>
          </div>`).join("")}
      </div>
      <div class="dash-card">
        <h3><i class="fa-solid fa-signal"></i> Status da frota</h3>
        ${[["Online",online,"#16A34A"],["Offline",offline,"#DC2626"],["Manutenção",maint,"#D97706"]].map(([label,count,color])=>`
          <div class="bar-item">
            <div class="bar-label"><span>${label}</span><span>${count} (${total?Math.round(count/total*100):0}%)</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${total?count/total*100:0}%;background:${color}"></div></div>
          </div>`).join("")}
      </div>
      <div class="dash-card">
        <h3><i class="fa-solid fa-triangle-exclamation"></i> Atenção necessária</h3>
        ${computers.filter(c=>c.status!=="online").slice(0,5).map(c=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
            ${badgeStatus(c.status)}
            <div style="flex:1">
              <div style="font-size:12.5px;font-weight:600">${c.hostname}</div>
              <div style="font-size:11px;color:var(--text-3)">${c.localizacao||c.setor||"—"} · ${relativeTime(c.ultimo_visto)}</div>
            </div>
            <button class="row-btn" onclick="openDetail(${c.id})"><i class="fa-solid fa-eye"></i></button>
          </div>`).join("") || '<div style="text-align:center;padding:20px;color:var(--text-3)"><i class="fa-solid fa-check" style="color:var(--green)"></i> Tudo ok!</div>'}
      </div>
      <div class="dash-card">
        <h3><i class="fa-solid fa-ticket"></i> Últimos tickets</h3>
        ${tickets.slice(0,4).map(t=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="switchView('tickets')">
            ${badgePrioridade(t.prioridade)}
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.titulo}</div>
              <div style="font-size:11px;color:var(--text-3)">${t.solicitante} · ${relativeTime(t.criado)}</div>
            </div>
            ${badgeStatus2(t.status)}
          </div>`).join("") || '<div style="color:var(--text-3);padding:16px 0;font-size:13px">Nenhum ticket.</div>'}
      </div>
    </div>`;
}

// ── MODAL UTILITÁRIOS ────────────────────────────────────────────
function openAddModal() {
  editingId = null;
  document.getElementById("modalTitle").textContent = "Adicionar Dispositivo";
  document.getElementById("modalSub").textContent   = "";
  const fields = ["hostname","ip","usuario","setor","so","cpu","ram","disco","fabricante","modelo","serial","mac","obs","patrimonio"];
  fields.forEach(f => { const el = document.getElementById("f-"+f); if(el) el.value = ""; });
  const vnc = document.getElementById("f-vnc_port"); if(vnc) vnc.value = "5900";
  const st  = document.getElementById("f-status");   if(st)  st.value  = "online";
  const tp  = document.getElementById("f-tipo");     if(tp)  tp.value  = "desktop";
  togglePatrimonio();

  // Pre-set localidade baseado na view atual
  const locMap = {"inv-stand":"stand","inv-escritorio":"escritorio","inv-obra":"obra"};
  const loc = document.getElementById("f-localidade");
  if (loc) loc.value = locMap[currentView] || "escritorio";

  show("mainModal"); show("modalBackdrop");
}

function openEdit(id) {
  const c = computers.find(x => x.id === id);
  if (!c) return;
  editingId = id;
  document.getElementById("modalTitle").textContent = "Editar Dispositivo";
  document.getElementById("modalSub").textContent   = c.hostname;
  const map = {hostname:c.hostname,ip:c.ip,usuario:c.usuario,setor:c.setor,localidade:c.localidade,
    localizacao:c.localizacao,tipo:c.tipo,so:c.so,cpu:c.cpu,ram:c.ram,disco:c.disco,
    fabricante:c.fabricante,modelo:c.modelo,serial:c.serial,mac:c.mac,patrimonio:c.patrimonio,
    status:c.status,vnc_port:c.vnc_port||5900,obs:c.obs};
  Object.entries(map).forEach(([k,v]) => { const el=document.getElementById("f-"+k); if(el) el.value=v||""; });
  togglePatrimonio();
  show("mainModal"); show("modalBackdrop");
}

async function saveComputer() {
  const hostname = document.getElementById("f-hostname").value.trim();
  if (!hostname) { toast("Hostname é obrigatório.", "error"); return; }

  const data = {
    hostname, ip: document.getElementById("f-ip").value,
    usuario:     document.getElementById("f-usuario").value,
    setor:       document.getElementById("f-setor").value,
    localidade:  document.getElementById("f-localidade").value,
    localizacao: document.getElementById("f-localizacao").value,
    tipo:        document.getElementById("f-tipo").value,
    so:          document.getElementById("f-so").value,
    cpu:         document.getElementById("f-cpu").value,
    ram:         document.getElementById("f-ram").value,
    disco:       document.getElementById("f-disco").value,
    fabricante:  document.getElementById("f-fabricante").value,
    modelo:      document.getElementById("f-modelo").value,
    serial:      document.getElementById("f-serial").value,
    mac:         document.getElementById("f-mac").value,
    patrimonio:  document.getElementById("f-patrimonio").value,
    status:      document.getElementById("f-status").value,
    vnc_port:    parseInt(document.getElementById("f-vnc_port").value)||5900,
    obs:         document.getElementById("f-obs").value,
    ultimo_visto: new Date().toISOString(),
  };

  if (editingId) {
    try { await fetch(`${API_BASE}/api/computers/${editingId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}); } catch {}
    const i = computers.findIndex(x => x.id === editingId);
    computers[i] = { ...computers[i], ...data };
    toast("Dispositivo atualizado!", "success");
  } else {
    let newId = null;
    try {
      const r = await fetch(`${API_BASE}/api/register`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":"inventopc-chave-secreta"},body:JSON.stringify(data)});
      if(r.ok){ const j=await r.json(); newId=j.id; }
    } catch {}
    if(!newId) newId = Math.max(0,...computers.map(c=>c.id))+1;
    computers.push({id:newId,...data});
    toast("Dispositivo adicionado!", "success");
  }
  closeModal();
  render();
}

async function deleteComputer(id) {
  const c = computers.find(x=>x.id===id);
  if (!c || !confirm(`Remover "${c.hostname}" do inventário?`)) return;
  try { await fetch(`${API_BASE}/api/computers/${id}`,{method:"DELETE"}); } catch {}
  computers = computers.filter(x=>x.id!==id);
  toast("Dispositivo removido.", "info");
  render();
}

function togglePatrimonio() {
  const tipo  = document.getElementById("f-tipo");
  const field = document.getElementById("field-patrimonio");
  if (tipo && field) field.style.display = tipo.value==="notebook" ? "flex" : "none";
}

function openDetail(id) {
  const c = computers.find(x=>x.id===id);
  if (!c) return;
  const isOnline = c.status === "online";
  document.getElementById("detailTitle").textContent = c.hostname;
  document.getElementById("detailSub").textContent   = c.localizacao || c.setor || "";

  const typeIcons = {desktop:"fa-desktop",notebook:"fa-laptop",servidor:"fa-server",
    impressora:"fa-print",switch:"fa-network-wired",outro:"fa-microchip"};
  const icon = typeIcons[c.tipo] || "fa-desktop";

  document.getElementById("detailBody").innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:14px;background:var(--surface-2);border-radius:var(--radius-lg);border:1px solid var(--border)">
      <div style="width:48px;height:48px;border-radius:12px;background:var(--brand-l);border:1px solid var(--brand-mid);display:flex;align-items:center;justify-content:center;color:var(--brand);font-size:22px">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div>
        <div style="font-size:16px;font-weight:700">${c.hostname}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:3px;display:flex;gap:10px;flex-wrap:wrap">
          <span>${c.usuario||"—"}</span>
          ${c.localizacao?`<span><i class="fa-solid fa-location-dot"></i> ${c.localizacao}</span>`:""}
          ${c.patrimonio?`<span class="patrimonio-tag"><i class="fa-solid fa-tag"></i>${c.patrimonio}</span>`:""}
        </div>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
        ${badgeStatus(c.status)}
        ${badgeLoc(c.localidade)}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div>
        <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:10px">Rede</div>
        ${dr("IP", `<span class="mono">${c.ip||"—"}</span>`)}
        ${dr("MAC", `<span class="mono">${c.mac||"—"}</span>`)}
        ${dr("VNC", `porta ${c.vnc_port||5900}`)}
        ${dr("Último contato", relativeTime(c.ultimo_visto))}
      </div>
      <div>
        <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:10px">Hardware</div>
        ${dr("SO", c.so||"—")}
        ${dr("CPU", c.cpu||"—")}
        ${dr("RAM", c.ram||"—")}
        ${dr("Disco", c.disco||"—")}
        ${dr("S/N", c.serial||"—")}
      </div>
    </div>

    <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px">
      <div style="font-size:12.5px;font-weight:700;color:var(--brand);margin-bottom:12px;display:flex;align-items:center;gap:7px">
        <i class="fa-solid fa-desktop"></i> Acesso Remoto
      </div>
      ${isOnline ? `
        <div style="background:#0F172A;border-radius:8px;padding:13px;font-family:var(--mono);font-size:12px;color:#4ADE80;line-height:1.9;margin-bottom:14px">
          <span style="color:#334155">$ </span>Host: <b>${c.hostname}</b> · IP: <b>${c.ip}</b><br>
          <span style="color:#334155">$ </span>VNC porta ${c.vnc_port||5900} <span style="color:#86efac">✓ disponível</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-primary btn-sm" onclick="openWebRemote(${c.id},'${c.hostname}','${c.ip}')">
            <i class="fa-solid fa-display"></i> Acessar via Navegador
          </button>
          <button class="btn-secondary btn-sm" onclick="downloadRDP('${c.ip}','${c.hostname}')">
            <i class="fa-solid fa-file-arrow-down"></i> Baixar .RDP
          </button>
          <button class="btn-secondary btn-sm" onclick="copyToClipboard('${c.ip}')">
            <i class="fa-solid fa-copy"></i> Copiar IP
          </button>
        </div>` : `
        <div style="text-align:center;padding:20px;color:var(--text-3)">
          <i class="fa-solid fa-plug-circle-xmark" style="font-size:28px;display:block;margin-bottom:8px;color:var(--red);opacity:.6"></i>
          Máquina <strong>${c.status==="manutencao"?"em manutenção":"offline"}</strong> — acesso remoto indisponível.
        </div>`}
    </div>

    <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">
      <button class="btn-secondary btn-sm" onclick="closeDetail();openEdit(${c.id})"><i class="fa-solid fa-pen"></i> Editar</button>
      <button class="btn-danger btn-sm" onclick="closeDetail();deleteComputer(${c.id})"><i class="fa-solid fa-trash"></i> Remover</button>
    </div>`;

  show("detailModal"); show("detailBackdrop");
}

function dr(key, val) {
  return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
    <span style="color:var(--text-3);font-weight:500">${key}</span>
    <span style="text-align:right;font-size:11.5px">${val}</span>
  </div>`;
}

// ── REMOTE ──────────────────────────────────────────────────────
function openWebRemote(id, hostname, ip) {
  const url = `/remote.html?id=${id}&host=${encodeURIComponent(hostname)}&ip=${encodeURIComponent(ip)}`;
  window.open(url, `remote_${id}`, "width=1280,height=800,menubar=no,toolbar=no,location=no");
}

function downloadRDP(ip, hostname) {
  const content = ["screen mode id:i:2","use multimon:i:0","desktopwidth:i:1920","desktopheight:i:1080",
    "session bpp:i:32","compression:i:1","keyboardhook:i:2","connection type:i:7",
    "networkautodetect:i:1","displayconnectionbar:i:1","full address:s:"+ip,
    "audiomode:i:0","redirectclipboard:i:1","prompt for credentials:i:1"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content],{type:"application/rdp"}));
  a.download = hostname+".rdp"; a.click();
  toast(`${hostname}.rdp baixado!`, "success");
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(()=>toast(`Copiado: ${text}`,"success"));
}

// ── HELPERS ──────────────────────────────────────────────────────
function badgeStatus(s) {
  const map={online:"badge-online",offline:"badge-offline",manutencao:"badge-manutencao"};
  const lbl={online:"Online",offline:"Offline",manutencao:"Manutenção"};
  return `<span class="badge ${map[s]||''}"><span class="badge-dot"></span>${lbl[s]||s}</span>`;
}
function badgeStatus2(s) {
  const map={aberto:"badge-aberto",andamento:"badge-andamento",resolvido:"badge-resolvido",fechado:"badge-fechado"};
  const lbl={aberto:"Aberto",andamento:"Em andamento",resolvido:"Resolvido",fechado:"Fechado"};
  return `<span class="badge ${map[s]||''}" style="font-size:10.5px">${lbl[s]||s}</span>`;
}
function badgePrioridade(p) {
  const map={baixa:"badge-baixa",media:"badge-media",alta:"badge-alta",critica:"badge-critica"};
  const lbl={baixa:"Baixa",media:"Média",alta:"Alta",critica:"Crítica"};
  const ico={baixa:"fa-arrow-down",media:"fa-minus",alta:"fa-arrow-up",critica:"fa-fire"};
  return `<span class="badge ${map[p]||''}" style="font-size:10.5px"><i class="fa-solid ${ico[p]||'fa-flag'}"></i>${lbl[p]||p}</span>`;
}
function badgeLoc(l) {
  const map={stand:"loc-stand",escritorio:"loc-escritorio",obra:"loc-obra"};
  const lbl={stand:"Stand",escritorio:"Escritório",obra:"Obra"};
  const ico={stand:"fa-store",escritorio:"fa-building",obra:"fa-hard-hat"};
  return `<span class="badge ${map[l]||'sector-tag'}"><i class="fa-solid ${ico[l]||'fa-location-dot'}"></i>${lbl[l]||l}</span>`;
}
function relativeTime(iso) {
  if (!iso) return "—";
  const diff = (Date.now()-new Date(iso))/1000;
  if (diff<60)    return "agora";
  if (diff<3600)  return `${Math.floor(diff/60)}min atrás`;
  if (diff<86400) return `${Math.floor(diff/3600)}h atrás`;
  return `${Math.floor(diff/86400)}d atrás`;
}
function groupBy(arr, key) {
  return arr.reduce((acc,item)=>{
    const k=typeof key==="function"?key(item):(item[key]||"Outro");
    (acc[k]=acc[k]||[]).push(item); return acc;
  },{});
}
function show(id){document.getElementById(id)?.classList.add("show")}
function hide(id){document.getElementById(id)?.classList.remove("show")}
function closeModal() { hide("mainModal"); hide("modalBackdrop"); }
function closeDetail(){ hide("detailModal"); hide("detailBackdrop"); }
function closeTicketModal(){ hide("ticketModal"); hide("ticketBackdrop"); }
function toggleSidebar(){ document.getElementById("sidebar").classList.toggle("open"); }

function toast(msg, type="info") {
  const icons={success:"fa-circle-check",error:"fa-circle-xmark",info:"fa-circle-info"};
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type]}"></i>${msg}`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(()=>el.remove(), 3500);
}

function exportCSV() {
  const headers = ["ID","Hostname","IP","MAC","Usuário","Setor","Localidade","Localização","Tipo","Patrimônio","SO","CPU","RAM","Disco","S/N","Status","Último contato"];
  const rows = computers.map(c=>[c.id,c.hostname,c.ip,c.mac,c.usuario,c.setor,c.localidade,c.localizacao,c.tipo,c.patrimonio,c.so,c.cpu,c.ram,c.disco,c.serial,c.status,c.ultimo_visto].map(v=>`"${(v||"").toString().replace(/"/g,'""')}"`).join(","));
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob(["\uFEFF"+[headers.join(","),...rows].join("\n")],{type:"text/csv;charset=utf-8;"}));
  a.download=`inventopc-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); toast("CSV exportado!", "success");
}

function renderRelatorios() {
  document.getElementById("pageContent").innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">
      ${[
        ["fa-file-csv","Exportar CSV","Todos os dispositivos em planilha","exportCSV()","var(--green)"],
        ["fa-circle-xmark","Dispositivos Offline","Máquinas sem comunicação","","var(--red)"],
        ["fa-wrench","Em Manutenção","Aguardando serviço","","var(--amber)"],
        ["fa-tag","Patrimônios","Notebooks com etiqueta","","var(--purple)"],
        ["fa-store","Por Localidade","Stand / Escritório / Obra","","var(--brand)"],
        ["fa-chart-pie","Resumo Geral","Visão consolidada do inventário","","var(--cyan)"],
      ].map(([icon,title,desc,action,color])=>`
        <div onclick="${action}" style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:22px;cursor:pointer;transition:all .15s;box-shadow:var(--shadow-sm)" onmouseover="this.style.borderColor='${color}';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border)';this.style.transform='none'">
          <div style="width:44px;height:44px;border-radius:11px;background:${color}18;display:flex;align-items:center;justify-content:center;color:${color};font-size:20px;margin-bottom:14px"><i class="fa-solid ${icon}"></i></div>
          <div style="font-size:13.5px;font-weight:700;margin-bottom:5px">${title}</div>
          <div style="font-size:12px;color:var(--text-3)">${desc}</div>
        </div>`).join("")}
    </div>`;
}
