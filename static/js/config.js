/* InventoPC — config.js  (tudo configurável) */

const CFG_KEY = "inventopc_config";

const DEFAULT_CONFIG = {
  // Identidade
  empresa_nome:     "System Mérito",
  empresa_sub:      "Gestão de TI — Mérito",
  empresa_logo:     "",          // base64 ou URL

  // Helpdesk
  categorias: [
    "Admissão - RH",
    "Bloqueio de Acesso",
    "Suporte Técnico",
    "Manutenção de Hardware",
    "Instalação de Software",
    "Rede / Internet",
    "Impressora",
    "Outro"
  ],
  tipos_equipamento: [
    "Desktop / PC",
    "Notebook / Laptop",
    "Servidor",
    "Impressora",
    "Switch / Roteador",
    "Telefone IP",
    "Outro"
  ],
  grupos: ["Tecnologia", "RH", "Financeiro", "Diretoria", "Operações"],
  agentes: ["Admin", "Técnico 1", "Técnico 2"],
  prioridades: ["baixa", "media", "alta", "critica"],

  // Inventário — localidades
  localidades: ["Stand", "Escritório", "Obra"],

  // Rede
  rede_range: "192.168.1",   // prefixo para scan

  // Twilio / Supabase (só guardado localmente para referência)
  twilio_notify_to: "",
  supabase_url:     "",

  // Acesso remoto
  vnc_default_port: 5900,
};

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CFG_KEY) || "{}");
    return { ...DEFAULT_CONFIG, ...saved };
  } catch { return { ...DEFAULT_CONFIG }; }
}

function saveConfig(cfg) {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  applyBranding(cfg);
}

function applyBranding(cfg) {
  cfg = cfg || loadConfig();

  // Título da página
  document.getElementById("pageTitle").textContent = cfg.empresa_nome || "System Mérito";

  // Login
  const loginTitle    = document.getElementById("loginTitle");
  const loginSubtitle = document.getElementById("loginSubtitle");
  if (loginTitle)    loginTitle.textContent    = cfg.empresa_nome || "System Mérito";
  if (loginSubtitle) loginSubtitle.textContent = cfg.empresa_sub  || "Gestão de TI — Mérito";

  // Sidebar brand
  const brandName = document.getElementById("brandName");
  const brandSub  = document.getElementById("brandSub");
  if (brandName) brandName.textContent = cfg.empresa_nome || "System Mérito";
  if (brandSub)  brandSub.textContent  = cfg.empresa_sub  || "Gestão de TI — Mérito";

  // Logo
  if (cfg.empresa_logo) {
    const logoWrapLogin   = document.getElementById("loginLogoWrap");
    const logoWrapSidebar = document.getElementById("sidebarLogoWrap");
    if (logoWrapLogin) {
      logoWrapLogin.innerHTML = `<img src="${cfg.empresa_logo}" alt="Logo">`;
    }
    if (logoWrapSidebar) {
      logoWrapSidebar.innerHTML = `<img src="${cfg.empresa_logo}" alt="Logo">`;
    }
  }
}

// Helpers para selects dinâmicos
function buildSelect(id, items, selectedValue = "") {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(i =>
    `<option value="${i}" ${i === selectedValue ? "selected" : ""}>${i}</option>`
  ).join("");
}

function buildSelectFromConfig(id, configKey, selectedValue = "") {
  const cfg   = loadConfig();
  const items = cfg[configKey] || [];
  buildSelect(id, items, selectedValue);
}

// Aplicar branding ao carregar
document.addEventListener("DOMContentLoaded", () => applyBranding());
