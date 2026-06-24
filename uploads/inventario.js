/* System Mérito — inventario.js */

function renderInventario(localidade) {
  const list      = getFiltered(localidade);
  const locLabel  = { stand:"Stand", escritorio:"Escritório", obra:"Obra" };
  const total     = computers.filter(c=>c.localidade===localidade).length;
  const online    = computers.filter(c=>c.localidade===localidade&&c.status==="online").length;
  const offline   = computers.filter(c=>c.localidade===localidade&&c.status==="offline").length;
  const maint     = computers.filter(c=>c.localidade===localidade&&c.status==="manutencao").length;
  const locColors = { stand:"var(--green)", escritorio:"var(--brand)", obra:"var(--orange)" };
  const locIconC  = { stand:"fa-store", escritorio:"fa-building", obra:"fa-hard-hat" };

  const typeIcons = {
    desktop:"fa-desktop", notebook:"fa-laptop", servidor:"fa-server",
    impressora:"fa-print", switch:"fa-network-wired", outro:"fa-microchip"
  };

  const rows = list.length ? list.map(c => `
    <tr>
      <td class="col-host">
        <div style="display:flex;align-items:center;gap:9px">
          <div style="width:28px;height:28px;border-radius:7px;background:var(--brand-l);display:flex;align-items:center;justify-content:center;color:var(--brand);font-size:13px;flex-shrink:0">
            <i class="fa-solid ${typeIcons[c.tipo]||'fa-desktop'}"></i>
          </div>
          <div>
            <strong>${c.hostname}</strong>
            <span>${c.serial||"—"}</span>
          </div>
        </div>
      </td>
      <td><span class="mono">${c.ip||"—"}</span></td>
      <td>
        <div style="font-size:12.5px;font-weight:500">${c.usuario||"—"}</div>
        <div style="font-size:11px;color:var(--text-3)">${c.setor||""}</div>
      </td>
      <td>
        <div style="display:flex;flex-direction:column;gap:3px">
          ${badgeLoc(c.localidade)}
          <span style="font-size:11px;color:var(--text-3);display:flex;align-items:center;gap:4px">
            <i class="fa-solid fa-location-dot" style="font-size:10px"></i>
            ${c.localizacao||"—"}
          </span>
        </div>
      </td>
      <td>
        ${c.tipo==="notebook" && c.patrimonio
          ? `<span class="patrimonio-tag"><i class="fa-solid fa-tag"></i>${c.patrimonio}</span>`
          : `<span style="font-size:12px;color:var(--text-3)">${c.tipo||"desktop"}</span>`}
      </td>
      <td>${badgeStatus(c.status)}</td>
      <td style="font-size:11px;color:var(--text-3)">${relativeTime(c.ultimo_visto)}</td>
      <td>
        <div class="row-actions">
          <button class="row-btn success" onclick="openDetail(${c.id})" title="Ver detalhes">
            <i class="fa-solid fa-display"></i>
          </button>
          <button class="row-btn" onclick="openEdit(${c.id})" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="row-btn danger" onclick="deleteComputer(${c.id})" title="Remover">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`).join("") : `
    <tr><td colspan="8">
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-desktop"></i></div>
        <h3>Nenhum dispositivo em ${locLabel[localidade]}</h3>
        <p>Clique em "+ Adicionar" para cadastrar um dispositivo nesta localidade.</p>
      </div>
    </td></tr>`;

  document.getElementById("pageContent").innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:18px">
      <div class="stat-card" style="border-top:3px solid ${locColors[localidade]}">
        <div class="stat-icon-wrap" style="background:${locColors[localidade]}18;color:${locColors[localidade]}">
          <i class="fa-solid ${locIconC[localidade]}"></i>
        </div>
        <div class="stat-label">Total ${locLabel[localidade]}</div>
        <div class="stat-num">${total}</div>
      </div>
      <div class="stat-card green"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-circle-check"></i></div>
        <div class="stat-label">Online</div><div class="stat-num">${online}</div>
      </div>
      <div class="stat-card red"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-circle-xmark"></i></div>
        <div class="stat-label">Offline</div><div class="stat-num">${offline}</div>
      </div>
      <div class="stat-card amber"><div class="stat-accent"></div>
        <div class="stat-icon-wrap"><i class="fa-solid fa-wrench"></i></div>
        <div class="stat-label">Manutenção</div><div class="stat-num">${maint}</div>
      </div>
    </div>

    <div class="filter-bar">
      <span class="filter-label"><i class="fa-solid fa-filter"></i> Filtrar:</span>
      <select class="filter-select" onchange="filterStatus=this.value;render()">
        <option value="all">Todos os status</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
        <option value="manutencao">Manutenção</option>
      </select>
      <select class="filter-select" id="filterTipo" onchange="render()">
        <option value="all">Todos os tipos</option>
        <option value="desktop">Desktop</option>
        <option value="notebook">Notebook</option>
        <option value="servidor">Servidor</option>
        <option value="impressora">Impressora</option>
        <option value="switch">Switch</option>
      </select>
      <span style="margin-left:auto;font-size:12px;color:var(--text-3)">${list.length} de ${total} dispositivos</span>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Dispositivo</th>
          <th>IP</th>
          <th>Usuário / Setor</th>
          <th>Localização</th>
          <th>Tipo / Patrimônio</th>
          <th>Status</th>
          <th>Último contato</th>
          <th>Ações</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
