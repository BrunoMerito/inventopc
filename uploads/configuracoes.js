/* System Mérito — configuracoes.js */

let configTab = "empresa";

function renderConfiguracoes() {
  const cfg = loadConfig();
  document.getElementById("pageContent").innerHTML = `
    <div class="config-tabs">
      ${[["empresa","fa-building","Empresa"],["helpdesk","fa-headset","Helpdesk"],
         ["inventario","fa-desktop","Inventário"],["usuarios","fa-users","Usuários"],
         ["integracao","fa-plug","Integrações"]].map(([id,icon,label])=>`
        <button class="config-tab ${configTab===id?'active':''}" onclick="setConfigTab('${id}')">
          <i class="fa-solid ${icon}"></i> ${label}
        </button>`).join("")}
    </div>
    <div id="configTabContent"></div>`;
  renderConfigTab();
}

function setConfigTab(tab) {
  configTab = tab;
  document.querySelectorAll(".config-tab").forEach(el => {
    el.classList.toggle("active", el.textContent.trim().toLowerCase().includes(tab.substring(0,4)));
  });
  renderConfigTab();
}

function renderConfigTab() {
  const cfg = loadConfig();
  const content = document.getElementById("configTabContent");
  if (!content) return;

  if (configTab === "empresa") {
    content.innerHTML = `
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-image"></i> Logo da Empresa</div>
        <div class="config-row">
          <div>
            <div class="config-label">Logotipo</div>
            <div class="config-desc">PNG, JPG ou SVG. Aparece na sidebar e tela de login.</div>
          </div>
          <div>
            <div class="logo-upload-area" style="width:220px" onclick="document.getElementById('logoInput').click()">
              ${cfg.empresa_logo
                ? `<img src="${cfg.empresa_logo}" class="logo-preview" id="logoPreview">`
                : `<i class="fa-solid fa-cloud-arrow-up" style="font-size:24px;color:var(--text-3);margin-bottom:8px;display:block"></i>
                   <div style="font-size:12.5px;color:var(--text-3)">Clique para enviar o logo</div>`}
              <input type="file" id="logoInput" accept="image/*" style="display:none" onchange="uploadLogo(this)">
            </div>
            ${cfg.empresa_logo?`<button class="btn-secondary btn-sm" style="margin-top:8px;width:220px" onclick="removeLogo()"><i class="fa-solid fa-trash"></i> Remover logo</button>`:""}
          </div>
        </div>
        <div class="config-row">
          <div><div class="config-label">Nome da empresa</div></div>
          <input type="text" id="cfg-empresa-nome" value="${cfg.empresa_nome||""}" placeholder="System Mérito">
        </div>
        <div class="config-row">
          <div><div class="config-label">Subtítulo / Slogan</div></div>
          <input type="text" id="cfg-empresa-sub" value="${cfg.empresa_sub||""}" placeholder="Gestão de TI">
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <button class="btn-primary" onclick="saveEmpresaConfig()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
        </div>
      </div>`;
  }

  else if (configTab === "helpdesk") {
    content.innerHTML = `
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-tags"></i> Categorias de Ticket</div>
        <div class="list-editor">
          ${cfg.categorias.map((c,i)=>`
            <div class="list-editor-item"><span>${c}</span>
              <button class="row-btn danger" onclick="removeListItem('categorias',${i})"><i class="fa-solid fa-xmark"></i></button>
            </div>`).join("")}
        </div>
        <div class="list-editor-add">
          <input type="text" id="newCategoria" placeholder="Nova categoria..." onkeydown="if(event.key==='Enter')addListItem('categorias','newCategoria')">
          <button class="btn-primary btn-sm" onclick="addListItem('categorias','newCategoria')"><i class="fa-solid fa-plus"></i> Adicionar</button>
        </div>
      </div>
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-desktop"></i> Tipos de Equipamento</div>
        <div class="list-editor">
          ${cfg.tipos_equipamento.map((t,i)=>`
            <div class="list-editor-item"><span>${t}</span>
              <button class="row-btn danger" onclick="removeListItem('tipos_equipamento',${i})"><i class="fa-solid fa-xmark"></i></button>
            </div>`).join("")}
        </div>
        <div class="list-editor-add">
          <input type="text" id="newTipo" placeholder="Novo tipo..." onkeydown="if(event.key==='Enter')addListItem('tipos_equipamento','newTipo')">
          <button class="btn-primary btn-sm" onclick="addListItem('tipos_equipamento','newTipo')"><i class="fa-solid fa-plus"></i> Adicionar</button>
        </div>
      </div>
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-layer-group"></i> Grupos</div>
        <div class="list-editor">
          ${cfg.grupos.map((g,i)=>`
            <div class="list-editor-item"><span>${g}</span>
              <button class="row-btn danger" onclick="removeListItem('grupos',${i})"><i class="fa-solid fa-xmark"></i></button>
            </div>`).join("")}
        </div>
        <div class="list-editor-add">
          <input type="text" id="newGrupo" placeholder="Novo grupo..." onkeydown="if(event.key==='Enter')addListItem('grupos','newGrupo')">
          <button class="btn-primary btn-sm" onclick="addListItem('grupos','newGrupo')"><i class="fa-solid fa-plus"></i> Adicionar</button>
        </div>
      </div>
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-user-tie"></i> Agentes / Técnicos</div>
        <div class="list-editor">
          ${cfg.agentes.map((a,i)=>`
            <div class="list-editor-item">
              <div class="user-avatar" style="width:26px;height:26px;font-size:11px">${a.charAt(0).toUpperCase()}</div>
              <span>${a}</span>
              <button class="row-btn danger" onclick="removeListItem('agentes',${i})"><i class="fa-solid fa-xmark"></i></button>
            </div>`).join("")}
        </div>
        <div class="list-editor-add">
          <input type="text" id="newAgente" placeholder="Nome do agente..." onkeydown="if(event.key==='Enter')addListItem('agentes','newAgente')">
          <button class="btn-primary btn-sm" onclick="addListItem('agentes','newAgente')"><i class="fa-solid fa-plus"></i> Adicionar</button>
        </div>
      </div>`;
  }

  else if (configTab === "inventario") {
    content.innerHTML = `
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-map-location-dot"></i> Localidades</div>
        <div class="list-editor">
          ${cfg.localidades.map((l,i)=>`
            <div class="list-editor-item">
              <i class="fa-solid fa-location-dot" style="color:var(--brand)"></i>
              <span>${l}</span>
              ${i>2?`<button class="row-btn danger" onclick="removeListItem('localidades',${i})"><i class="fa-solid fa-xmark"></i></button>`:'<span style="font-size:11px;color:var(--text-3)">padrão</span>'}
            </div>`).join("")}
        </div>
        <div class="list-editor-add">
          <input type="text" id="newLocalidade" placeholder="Nova localidade...">
          <button class="btn-primary btn-sm" onclick="addListItem('localidades','newLocalidade')"><i class="fa-solid fa-plus"></i> Adicionar</button>
        </div>
      </div>
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-desktop"></i> Acesso Remoto</div>
        <div class="config-row">
          <div><div class="config-label">Porta VNC padrão</div></div>
          <input type="number" id="cfg-vnc-port" value="${cfg.vnc_default_port||5900}" style="width:100px">
        </div>
        <div class="config-row">
          <div><div class="config-label">Prefixo de rede</div><div class="config-desc">Ex: 192.168.1</div></div>
          <input type="text" id="cfg-rede-range" value="${cfg.rede_range||'192.168.1'}" style="width:160px">
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <button class="btn-primary" onclick="saveInventarioConfig()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
        </div>
      </div>`;
  }

  else if (configTab === "usuarios") {
    content.innerHTML = `
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-users"></i> Usuários do Sistema</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Usuário</th><th>Papel</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td><strong>admin</strong></td><td><span class="badge badge-aberto">Administrador</span></td><td><span class="badge badge-online"><span class="badge-dot"></span>Ativo</span></td></tr>
              <tr><td><strong>tecnico</strong></td><td><span class="badge" style="background:var(--purple-l);color:var(--purple);border:1px solid var(--purple-b)">Técnico</span></td><td><span class="badge badge-online"><span class="badge-dot"></span>Ativo</span></td></tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:16px;font-size:13px;font-weight:600;margin-bottom:10px">Alterar senhas</div>
        <div class="form-grid" style="max-width:480px">
          <div class="form-field">
            <label>Usuário</label>
            <select id="cfg-user-sel"><option value="admin">admin</option><option value="tecnico">tecnico</option></select>
          </div>
          <div class="form-field">
            <label>Nova senha</label>
            <input type="password" id="cfg-user-pass" placeholder="Nova senha" autocomplete="new-password">
          </div>
        </div>
        <button class="btn-primary btn-sm" style="margin-top:10px" onclick="toast('Senha alterada! (requer Supabase para persistir)','info')">
          <i class="fa-solid fa-key"></i> Alterar senha
        </button>
      </div>`;
  }

  else if (configTab === "integracao") {
    const sbConectado = typeof sb !== 'undefined' && sb !== null;
    content.innerHTML = `
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-database"></i> Supabase</div>
        
        <!-- Status atual -->
        <div id="sb-status-banner" style="padding:10px 14px;border-radius:var(--radius);margin-bottom:14px;font-size:12.5px;display:flex;align-items:center;gap:8px;
          background:${sbConectado?'var(--green-l)':'var(--amber-l)'};border:1px solid ${sbConectado?'var(--green-b)':'var(--amber-b)'};color:${sbConectado?'var(--green)':'var(--amber)'}">
          <i class="fa-solid ${sbConectado?'fa-circle-check':'fa-triangle-exclamation'}"></i>
          ${sbConectado?'Supabase conectado e funcionando!':'Supabase não conectado. Configure a URL e a Chave Anon abaixo.'}
        </div>

        <div class="config-row">
          <div><div class="config-label">URL do projeto</div><div class="config-desc">https://xxxx.supabase.co</div></div>
          <input type="text" id="cfg-sb-url" value="${cfg.supabase_url||'https://cawgdmhjbocjunondego.supabase.co'}" placeholder="https://xxxx.supabase.co">
        </div>
        <div class="config-row">
          <div><div class="config-label">Chave Anon (eyJ...)</div><div class="config-desc">Settings → API → anon public</div></div>
          <input type="text" id="cfg-sb-key" value="${cfg.supabase_key||''}" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
        </div>
        <div id="sb-test-result" style="font-size:12.5px;padding:8px 0;display:none"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button class="btn-secondary" onclick="testSupabase()"><i class="fa-solid fa-plug"></i> Testar conexão</button>
          <button class="btn-primary" onclick="saveIntegracaoConfig()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
        </div>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-message"></i> Twilio — SMS / WhatsApp</div>
        <div class="config-row">
          <div><div class="config-label">Account SID</div></div>
          <input type="text" id="cfg-twilio-sid" placeholder="ACxxxxxxxxxxxxxxxx">
        </div>
        <div class="config-row">
          <div><div class="config-label">Auth Token</div></div>
          <input type="password" id="cfg-twilio-token" placeholder="••••••••••••••••">
        </div>
        <div class="config-row">
          <div><div class="config-label">Número remetente</div></div>
          <input type="text" id="cfg-twilio-from" placeholder="+5511999999999">
        </div>
        <div class="config-row">
          <div><div class="config-label">Notificar para</div></div>
          <input type="text" id="cfg-twilio-to" value="${cfg.twilio_notify_to||''}" placeholder="+5511888888888">
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button class="btn-secondary" onclick="testTwilio()"><i class="fa-solid fa-paper-plane"></i> Enviar teste</button>
          <button class="btn-primary" onclick="saveIntegracaoConfig()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
        </div>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-key"></i> Chave de API do Agente</div>
        <div class="config-row">
          <div><div class="config-label">API Key</div><div class="config-desc">Use no agente instalado nas máquinas</div></div>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" value="inventopc-chave-secreta" id="cfg-apikey" style="min-width:220px;font-family:monospace">
            <button class="row-btn" onclick="copyToClipboard(document.getElementById('cfg-apikey').value)"><i class="fa-solid fa-copy"></i></button>
          </div>
        </div>
      </div>`;
  }
}

// ── HANDLERS ──────────────────────────────────────────────────────
function saveEmpresaConfig() {
  const cfg = loadConfig();
  cfg.empresa_nome = document.getElementById("cfg-empresa-nome")?.value.trim() || cfg.empresa_nome;
  cfg.empresa_sub  = document.getElementById("cfg-empresa-sub")?.value.trim()  || cfg.empresa_sub;
  saveConfig(cfg);
  toast("Configurações da empresa salvas!", "success");
}

function saveInventarioConfig() {
  const cfg = loadConfig();
  cfg.vnc_default_port = parseInt(document.getElementById("cfg-vnc-port")?.value)||5900;
  cfg.rede_range       = document.getElementById("cfg-rede-range")?.value.trim()||"192.168.1";
  saveConfig(cfg);
  toast("Configurações de inventário salvas!", "success");
}

function saveIntegracaoConfig() {
  const cfg    = loadConfig();
  const sbUrl  = document.getElementById("cfg-sb-url")?.value.trim();
  const sbKey  = document.getElementById("cfg-sb-key")?.value.trim();
  const tto    = document.getElementById("cfg-twilio-to")?.value.trim();
  if (sbUrl) cfg.supabase_url = sbUrl;
  if (sbKey) cfg.supabase_key = sbKey;
  if (tto)   cfg.twilio_notify_to = tto;
  saveConfig(cfg);
  toast("Configurações salvas! Recarregue a página para aplicar.", "success");
}

async function testSupabase() {
  const urlEl  = document.getElementById("cfg-sb-url");
  const keyEl  = document.getElementById("cfg-sb-key");
  const result = document.getElementById("sb-test-result");

  const cfg    = loadConfig();
  const testUrl = urlEl?.value.trim() || cfg.supabase_url || "https://cawgdmhjbocjunondego.supabase.co";
  const testKey = keyEl?.value.trim() || cfg.supabase_key || SUPABASE_KEY;

  if (!testUrl || !testKey) {
    toast("Preencha a URL e a Chave Anon.", "error");
    return;
  }

  if (result) { result.style.display="block"; result.innerHTML="⏳ Testando..."; }

  try {
    const r = await fetch(`${testUrl}/rest/v1/computadores?select=id,hostname&limit=5`, {
      headers: {
        "apikey":        testKey,
        "Authorization": `Bearer ${testKey}`,
      }
    });

    if (r.ok) {
      const data = await r.json();
      const msg  = `✅ Conectado! ${data.length} máquina(s) no banco: ${data.map(d=>d.hostname).join(", ")||"nenhuma ainda"}`;
      if (result) { result.innerHTML = `<span style="color:var(--green)">${msg}</span>`; }
      toast("Supabase funcionando!", "success");
    } else {
      const err = await r.text();
      if (result) { result.innerHTML = `<span style="color:var(--red)">❌ Erro ${r.status} — verifique a Chave Anon (deve começar com eyJ...)</span>`; }
      toast(`Erro ${r.status} no Supabase.`, "error");
    }
  } catch(e) {
    if (result) { result.innerHTML = `<span style="color:var(--red)">❌ Falha: ${e.message}</span>`; }
    toast("Falha na conexão.", "error");
  }
}

function addListItem(key, inputId) {
  const input = document.getElementById(inputId);
  const val   = input?.value.trim();
  if (!val) return;
  const cfg = loadConfig();
  if (!cfg[key]) cfg[key] = [];
  if (!cfg[key].includes(val)) {
    cfg[key].push(val);
    saveConfig(cfg);
    if (input) input.value = "";
    renderConfigTab();
    toast("Item adicionado!", "success");
  } else {
    toast("Item já existe.", "error");
  }
}

function removeListItem(key, index) {
  const cfg = loadConfig();
  cfg[key].splice(index, 1);
  saveConfig(cfg);
  renderConfigTab();
  toast("Item removido.", "info");
}

function uploadLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const cfg = loadConfig();
    cfg.empresa_logo = e.target.result;
    saveConfig(cfg);
    applyBranding(cfg);
    renderConfigTab();
    toast("Logo atualizado!", "success");
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  const cfg = loadConfig();
  cfg.empresa_logo = "";
  saveConfig(cfg);
  applyBranding(cfg);
  renderConfigTab();
  toast("Logo removido.", "info");
}

async function testTwilio() {
  toast("Enviando mensagem de teste via Twilio...", "info");
  try {
    const r = await fetch(`${API_BASE}/api/twilio/send`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ to:loadConfig().twilio_notify_to, body:"[System Mérito] Teste OK!", mode:"sms" })
    });
    const j = await r.json();
    toast(j.sent?"SMS enviado!":"Falha — verifique credenciais no servidor.", j.sent?"success":"error");
  } catch {
    toast("Configure as credenciais Twilio no servidor (.env).", "error");
  }
}
