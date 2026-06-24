/* InventoPC — rede.js */

function renderRede() {
  const cfg     = loadConfig();
  const byLoc   = groupBy(computers, "localidade");
  const byType  = groupBy(computers, "tipo");
  const online  = computers.filter(c=>c.status==="online").length;
  const locIcons= {stand:"fa-store",escritorio:"fa-building",obra:"fa-hard-hat"};
  const locNames= {stand:"Stand",escritorio:"Escritório",obra:"Obra"};

  document.getElementById("pageContent").innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      <div class="stat-card blue"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-network-wired"></i></div>
        <div class="stat-label">Dispositivos</div><div class="stat-num">${computers.length}</div>
      </div>
      <div class="stat-card green"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-wifi"></i></div>
        <div class="stat-label">Online</div><div class="stat-num">${online}</div>
      </div>
      <div class="stat-card cyan"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-store"></i></div>
        <div class="stat-label">Stand</div><div class="stat-num">${(byLoc.stand||[]).length}</div>
      </div>
      <div class="stat-card blue"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-building"></i></div>
        <div class="stat-label">Escritório</div><div class="stat-num">${(byLoc.escritorio||[]).length}</div>
      </div>
      <div class="stat-card amber"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-hard-hat"></i></div>
        <div class="stat-label">Obra</div><div class="stat-num">${(byLoc.obra||[]).length}</div>
      </div>
    </div>

    <!-- Filtros e scan -->
    <div class="filter-bar" style="margin-bottom:16px">
      <span class="filter-label"><i class="fa-solid fa-filter"></i></span>
      <select class="filter-select" id="redeViewFilter" onchange="renderRedeDevices()">
        <option value="all">Todas as localidades</option>
        <option value="stand">Stand</option>
        <option value="escritorio">Escritório</option>
        <option value="obra">Obra</option>
      </select>
      <select class="filter-select" id="redeTypeFilter" onchange="renderRedeDevices()">
        <option value="all">Todos os tipos</option>
        <option value="desktop">Desktop</option>
        <option value="notebook">Notebook</option>
        <option value="servidor">Servidor</option>
        <option value="impressora">Impressora</option>
        <option value="switch">Switch</option>
      </select>
      <select class="filter-select" id="redeStatusFilter" onchange="renderRedeDevices()">
        <option value="all">Todos os status</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
        <option value="manutencao">Manutenção</option>
      </select>
      <div style="display:flex;gap:8px;margin-left:auto">
        <button class="topbar-btn" id="viewModeGrid" onclick="setRedeView('grid')" style="border-color:var(--brand);color:var(--brand)">
          <i class="fa-solid fa-grip"></i> Cards
        </button>
        <button class="topbar-btn" id="viewModeTable" onclick="setRedeView('table')">
          <i class="fa-solid fa-list"></i> Lista
        </button>
        <button class="topbar-btn primary" onclick="scanRede()">
          <i class="fa-solid fa-radar"></i> Scan da rede
        </button>
      </div>
    </div>

    <!-- Localidades como seções -->
    <div id="redeDevicesArea"></div>`;

  renderRedeDevices();
}

let redeViewMode = "grid";
function setRedeView(mode) {
  redeViewMode = mode;
  document.getElementById("viewModeGrid")?.style && (document.getElementById("viewModeGrid").style.cssText = mode==="grid"?"border-color:var(--brand);color:var(--brand)":"");
  document.getElementById("viewModeTable")?.style && (document.getElementById("viewModeTable").style.cssText = mode==="table"?"border-color:var(--brand);color:var(--brand)":"");
  renderRedeDevices();
}

function renderRedeDevices() {
  const lf = document.getElementById("redeViewFilter")?.value  || "all";
  const tf = document.getElementById("redeTypeFilter")?.value  || "all";
  const sf = document.getElementById("redeStatusFilter")?.value || "all";

  let list = computers.filter(c =>
    (lf==="all"||c.localidade===lf) &&
    (tf==="all"||c.tipo===tf) &&
    (sf==="all"||c.status===sf)
  );

  const area = document.getElementById("redeDevicesArea");
  if (!area) return;

  if (!list.length) {
    area.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fa-solid fa-network-wired"></i></div><h3>Nenhum dispositivo encontrado</h3><p>Ajuste os filtros ou adicione dispositivos ao inventário.</p></div>`;
    return;
  }

  if (redeViewMode === "grid") {
    // Agrupar por localidade
    const grouped = groupBy(list, "localidade");
    const locOrder = ["stand","escritorio","obra"];
    const locNames = {stand:"Stand",escritorio:"Escritório",obra:"Obra"};
    const locIcons = {stand:"fa-store",escritorio:"fa-building",obra:"fa-hard-hat"};
    const locColors= {stand:"var(--green)",escritorio:"var(--brand)",obra:"var(--orange)"};

    area.innerHTML = locOrder
      .filter(loc => grouped[loc]?.length)
      .map(loc => `
        <div style="margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <div style="width:30px;height:30px;border-radius:8px;background:${locColors[loc]}18;display:flex;align-items:center;justify-content:center;color:${locColors[loc]};font-size:14px">
              <i class="fa-solid ${locIcons[loc]}"></i>
            </div>
            <span style="font-size:14px;font-weight:700">${locNames[loc]}</span>
            <span style="font-size:12px;color:var(--text-3);background:var(--surface-3);border:1px solid var(--border);padding:2px 8px;border-radius:99px">${grouped[loc].length} dispositivos</span>
          </div>
          <div class="network-grid">
            ${grouped[loc].map(c => deviceCard(c)).join("")}
          </div>
        </div>`).join("") + (grouped[""]||grouped["outro"]||[]).map(c=>deviceCard(c)).join("");
  } else {
    // Modo lista / tabela
    area.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Dispositivo</th><th>IP</th><th>Localidade</th><th>Localização</th>
            <th>Tipo</th><th>Usuário</th><th>Status</th><th>Último contato</th><th>Ações</th>
          </tr></thead>
          <tbody>
            ${list.map(c=>`
              <tr>
                <td class="col-host"><strong>${c.hostname}</strong><span>${c.ip||""}</span></td>
                <td><span class="mono">${c.ip||"—"}</span></td>
                <td>${badgeLoc(c.localidade)}</td>
                <td style="font-size:12px;color:var(--text-2)">${c.localizacao||"—"}</td>
                <td><span class="sector-tag">${c.tipo||"—"}</span></td>
                <td style="font-size:12px">${c.usuario||"—"}</td>
                <td>${badgeStatus(c.status)}</td>
                <td style="font-size:11px;color:var(--text-3)">${relativeTime(c.ultimo_visto)}</td>
                <td><div class="row-actions">
                  <button class="row-btn success" onclick="openDetail(${c.id})"><i class="fa-solid fa-display"></i></button>
                  <button class="row-btn" onclick="openEdit(${c.id})"><i class="fa-solid fa-pen"></i></button>
                </div></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }
}

function deviceCard(c) {
  const typeIcons = {desktop:"fa-desktop",notebook:"fa-laptop",servidor:"fa-server",
    impressora:"fa-print",switch:"fa-network-wired",outro:"fa-microchip"};
  const icon = typeIcons[c.tipo] || "fa-desktop";
  const dot  = c.status==="online" ? "#16A34A" : c.status==="manutencao" ? "#D97706" : "#DC2626";

  return `
    <div class="device-card ${c.status}" onclick="openDetail(${c.id})">
      <div style="position:relative;display:inline-block">
        <div class="device-icon ${c.tipo||'outro'}">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div style="position:absolute;bottom:2px;right:2px;width:10px;height:10px;border-radius:50%;background:${dot};border:2px solid #fff"></div>
      </div>
      <div class="device-hostname">${c.hostname}</div>
      <div class="device-ip">${c.ip||"—"}</div>
      ${c.localizacao?`<div class="device-location"><i class="fa-solid fa-location-dot"></i>${c.localizacao}</div>`:""}
      <div style="display:flex;justify-content:center;gap:5px;flex-wrap:wrap">
        ${badgeStatus(c.status)}
        ${c.patrimonio?`<span class="patrimonio-tag" style="font-size:10.5px"><i class="fa-solid fa-tag"></i>${c.patrimonio}</span>`:""}
      </div>
    </div>`;
}

async function scanRede() {
  const cfg  = loadConfig();
  const btn  = event.target.closest("button");
  if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Escaneando...'; btn.disabled = true; }

  toast("Iniciando scan da rede...", "info");

  try {
    const r = await fetch(`${API_BASE}/api/network/scan`, { method: "POST",
      headers:{"Content-Type":"application/json"}, body:JSON.stringify({range:cfg.rede_range}) });
    if (r.ok) {
      const result = await r.json();
      toast(`Scan concluído: ${result.found||0} dispositivos encontrados.`, "success");
      await loadData();
      renderRedeDevices();
    } else {
      toast("Scan falhou — verifique se o servidor está rodando.", "error");
    }
  } catch {
    // Demo: simular scan
    toast("Scan demo: mostrando dispositivos do inventário.", "info");
  }

  if (btn) { btn.innerHTML = '<i class="fa-solid fa-radar"></i> Scan da rede'; btn.disabled = false; }
}
