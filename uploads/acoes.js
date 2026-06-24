/* ═══════════════════════════════════════════════════════
   System Mérito — acoes.js
   Ações remotas nas máquinas via PowerShell WebSocket
═══════════════════════════════════════════════════════ */

// ── CATÁLOGO DE APPS (Lojinha) ────────────────────────────────────
const APPS_CATALOG = [
  { id:"chrome",    cat:"Navegadores",  nome:"Google Chrome",        icon:"🌐", cmd:`winget install --id Google.Chrome -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"firefox",   cat:"Navegadores",  nome:"Mozilla Firefox",      icon:"🦊", cmd:`winget install --id Mozilla.Firefox -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"edge",      cat:"Navegadores",  nome:"Microsoft Edge",       icon:"🔷", cmd:`winget install --id Microsoft.Edge -e --silent` },
  { id:"teams",     cat:"Comunicação",  nome:"Microsoft Teams",      icon:"💬", cmd:`winget install --id Microsoft.Teams -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"zoom",      cat:"Comunicação",  nome:"Zoom",                 icon:"📹", cmd:`winget install --id Zoom.Zoom -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"whatsapp",  cat:"Comunicação",  nome:"WhatsApp Desktop",     icon:"💚", cmd:`winget install --id 9NKSQGP7F2NH -e --silent` },
  { id:"7zip",      cat:"Utilitários",  nome:"7-Zip",                icon:"🗜", cmd:`winget install --id 7zip.7zip -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"winrar",    cat:"Utilitários",  nome:"WinRAR",               icon:"📦", cmd:`winget install --id RARLab.WinRAR -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"notepad",   cat:"Utilitários",  nome:"Notepad++",            icon:"📝", cmd:`winget install --id Notepad++.Notepad++ -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"anydesk",   cat:"Utilitários",  nome:"AnyDesk",              icon:"🖥", cmd:`winget install --id AnyDesk.AnyDesk -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"vlc",       cat:"Multimídia",   nome:"VLC Media Player",     icon:"🎬", cmd:`winget install --id VideoLAN.VLC -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"spotify",   cat:"Multimídia",   nome:"Spotify",              icon:"🎵", cmd:`winget install --id Spotify.Spotify -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"acrobat",   cat:"PDF / Office", nome:"Adobe Acrobat Reader", icon:"📄", cmd:`winget install --id Adobe.Acrobat.Reader.64-bit -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"libreoff",  cat:"PDF / Office", nome:"LibreOffice",          icon:"📊", cmd:`winget install --id TheDocumentFoundation.LibreOffice -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"foxit",     cat:"PDF / Office", nome:"Foxit PDF Reader",     icon:"📋", cmd:`winget install --id Foxit.FoxitReader -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"java",      cat:"Runtime",      nome:"Java (JRE)",           icon:"☕", cmd:`winget install --id Oracle.JavaRuntimeEnvironment -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"dotnet",    cat:"Runtime",      nome:".NET Runtime 8",       icon:"🔵", cmd:`winget install --id Microsoft.DotNet.Runtime.8 -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"vcredist",  cat:"Runtime",      nome:"Visual C++ Redist",    icon:"⚙️", cmd:`winget install --id Microsoft.VCRedist.2015+.x64 -e --silent --accept-source-agreements --accept-package-agreements` },
  { id:"malware",   cat:"Segurança",    nome:"Malwarebytes",         icon:"🛡", cmd:`winget install --id Malwarebytes.Malwarebytes -e --silent --accept-source-agreements --accept-package-agreements` },
];

// ── AÇÕES REMOTAS ─────────────────────────────────────────────────
const ACOES = {
  reiniciar:    { label:"Reiniciar",            icon:"🔄", cat:"Sistema",    confirm:true,  cmd:`Restart-Computer -Force` },
  desligar:     { label:"Desligar",             icon:"⏻",  cat:"Sistema",    confirm:true,  cmd:`Stop-Computer -Force` },
  hibernar:     { label:"Hibernar",             icon:"💤", cat:"Sistema",    confirm:false, cmd:`shutdown /h` },
  bloquear:     { label:"Bloquear tela",        icon:"🔒", cat:"Sistema",    confirm:false, cmd:`rundll32.exe user32.dll,LockWorkStation` },
  logout:       { label:"Logout usuário",       icon:"🚪", cat:"Sistema",    confirm:true,  cmd:`shutdown /l /f` },
  cancelar_rbt: { label:"Cancelar reinício",    icon:"❌", cat:"Sistema",    confirm:false, cmd:`shutdown /a` },
  lixeira:      { label:"Limpar Lixeira",       icon:"🗑", cat:"Manutenção", confirm:false, cmd:`Clear-RecycleBin -Force -ErrorAction SilentlyContinue; Write-Output "Lixeira limpa!"` },
  temp:         { label:"Limpar Temporários",   icon:"🧹", cat:"Manutenção", confirm:false, cmd:`Remove-Item "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item "C:\\Windows\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue; Write-Output "Temporarios limpos!"` },
  disco_info:   { label:"Info do Disco",        icon:"💾", cat:"Manutenção", confirm:false, cmd:`Get-PSDrive -PSProvider FileSystem | Select-Object Name,@{N='Usado(GB)';E={[math]::Round(($_.Used/1GB),2)}},@{N='Livre(GB)';E={[math]::Round(($_.Free/1GB),2)}},@{N='Total(GB)';E={[math]::Round((($_.Used+$_.Free)/1GB),2)}} | Format-Table -AutoSize` },
  win_update:   { label:"Verificar Updates",    icon:"🔃", cat:"Manutenção", confirm:false, cmd:`Get-WindowsUpdate -ErrorAction SilentlyContinue | Select-Object Title,Size | Format-Table` },
  chkdsk:       { label:"Verificar Disco",      icon:"🔍", cat:"Manutenção", confirm:false, cmd:`chkdsk C: /scan` },
  proc_list:    { label:"Ver Processos",        icon:"📊", cat:"Manutenção", confirm:false, cmd:`Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Name,CPU,@{N='Mem(MB)';E={[math]::Round($_.WorkingSet/1MB,1)}} | Format-Table -AutoSize` },
  kill_proc:    { label:"Matar Processo",       icon:"💀", cat:"Manutenção", confirm:false, cmd_prompt:"Nome do processo (ex: chrome):", cmd_tpl:`Stop-Process -Name "{input}" -Force -ErrorAction SilentlyContinue; Write-Output "Processo {input} encerrado"` },
  ip_info:      { label:"Info de Rede",         icon:"🌐", cat:"Rede",       confirm:false, cmd:`ipconfig /all` },
  dns_flush:    { label:"Limpar DNS",           icon:"🔄", cat:"Rede",       confirm:false, cmd:`ipconfig /flushdns; Write-Output "Cache DNS limpo!"` },
  ip_renew:     { label:"Renovar IP",           icon:"🔁", cat:"Rede",       confirm:false, cmd:`ipconfig /release; ipconfig /renew; Write-Output "IP renovado!"` },
  ping_srv:     { label:"Ping Servidor",        icon:"📡", cat:"Rede",       confirm:false, cmd:`ping 8.8.8.8 -n 4` },
  conexoes:     { label:"Conexões Ativas",      icon:"🔗", cat:"Rede",       confirm:false, cmd:`netstat -an | Select-String "ESTABLISHED" | Select-Object -First 20` },
  wifi_list:    { label:"Redes Wi-Fi",          icon:"📶", cat:"Rede",       confirm:false, cmd:`netsh wlan show profiles` },
  fila_imp:     { label:"Limpar Fila Impressão",icon:"🖨", cat:"Impressora", confirm:false, cmd:`Stop-Service -Name Spooler -Force; Remove-Item "C:\\Windows\\System32\\spool\\PRINTERS\\*" -Recurse -Force -ErrorAction SilentlyContinue; Start-Service -Name Spooler; Write-Output "Fila limpa!"` },
  listar_imp:   { label:"Listar Impressoras",   icon:"📋", cat:"Impressora", confirm:false, cmd:`Get-Printer | Select-Object Name,DriverName,PortName,PrinterStatus | Format-Table -AutoSize` },
  usuarios:     { label:"Usuários Logados",     icon:"👤", cat:"Usuários",   confirm:false, cmd:`query user 2>&1` },
  ultimo_login: { label:"Último Login",         icon:"🕐", cat:"Usuários",   confirm:false, cmd:`Get-EventLog -LogName Security -InstanceId 4624 -Newest 5 | Select-Object TimeGenerated,Message | Format-List` },
  sys_info:     { label:"Info do Sistema",      icon:"ℹ️", cat:"Info",       confirm:false, cmd:`systeminfo | Select-String "Host Name|OS Name|OS Version|Total Physical|Available Physical"` },
  uptime:       { label:"Tempo Ligado",         icon:"⏱", cat:"Info",       confirm:false, cmd:`$up=(Get-Date)-(gcim Win32_OperatingSystem).LastBootUpTime; Write-Output "Online há: $($up.Days)d $($up.Hours)h $($up.Minutes)m"` },
  eventos:      { label:"Erros Recentes",       icon:"⚠️", cat:"Info",       confirm:false, cmd:`Get-EventLog -LogName System -EntryType Error -Newest 10 | Select-Object TimeGenerated,Source,Message | Format-List` },
};

// ── RENDER ────────────────────────────────────────────────────────
function renderAcoes() {
  document.getElementById("pageContent").innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 360px;gap:16px;height:calc(100vh - 120px)">
      <div style="display:flex;flex-direction:column;gap:14px;overflow:hidden">
        <div class="card" style="padding:16px;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap">
            <div style="font-size:13px;font-weight:700">Selecionar Máquinas</div>
            <button class="btn-secondary btn-sm" onclick="selectAllMachines()">Selecionar Todas</button>
            <button class="btn-secondary btn-sm" onclick="clearMachineSelection()">Limpar</button>
            <select class="filter-select" id="acoesLocFilter" onchange="renderMachineList()">
              <option value="all">Todas localidades</option>
              <option value="escritorio">Escritório</option>
              <option value="stand">Stand</option>
              <option value="obra">Obra</option>
            </select>
            <select class="filter-select" id="acoesStatusFilter" onchange="renderMachineList()">
              <option value="all">Todos status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <span id="selCount" style="font-size:12px;color:var(--text-3);margin-left:auto">0 selecionadas</span>
          </div>
          <div id="machineCheckList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;max-height:180px;overflow-y:auto"></div>
        </div>
        <div class="card" style="padding:16px;flex:1;overflow-y:auto">
          <div style="font-size:13px;font-weight:700;margin-bottom:14px">Ações Remotas</div>
          ${renderAcoesCategorias()}
        </div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;overflow:hidden">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div style="font-size:13px;font-weight:700">Resultado</div>
          <button class="btn-secondary btn-sm" onclick="document.getElementById('acoesLog').innerHTML=''">Limpar</button>
        </div>
        <div id="acoesLog" style="flex:1;overflow-y:auto;padding:12px;font-family:monospace;font-size:12px;background:var(--surface-2);line-height:1.8"></div>
      </div>
    </div>

    <!-- Modal Wallpaper -->
    <div id="wallpaperModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(6px);z-index:200;align-items:center;justify-content:center">
      <div style="background:var(--surface);border-radius:var(--radius-xl);padding:28px;width:500px;box-shadow:var(--shadow-xl)">
        <div style="font-size:15px;font-weight:700;margin-bottom:18px">🎨 Alterar Papel de Parede</div>
        <div style="margin-bottom:14px">
          <label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:6px">URL da imagem</label>
          <input type="text" id="wallpaperUrl" placeholder="https://exemplo.com/imagem.jpg"
            style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius);font-size:13px;background:var(--surface-2)">
        </div>
        <div style="margin-bottom:18px">
          <label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:6px">Ou carregar imagem local</label>
          <input type="file" id="wallpaperFile" accept="image/*" onchange="previewWallpaper(this)" style="font-size:13px">
          <img id="wallpaperPreview" src="" style="max-height:120px;border-radius:8px;margin-top:10px;display:none;border:1px solid var(--border)">
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px">
          <button class="btn-secondary" onclick="closeWallpaperModal()">Cancelar</button>
          <button class="btn-primary" onclick="applyWallpaper()">🎨 Aplicar</button>
        </div>
      </div>
    </div>

    <!-- Modal Impressora -->
    <div id="printerModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(6px);z-index:200;align-items:center;justify-content:center">
      <div style="background:var(--surface);border-radius:var(--radius-xl);padding:28px;width:480px;box-shadow:var(--shadow-xl)">
        <div style="font-size:15px;font-weight:700;margin-bottom:18px">🖨️ Instalar Impressora de Rede</div>
        <div class="form-grid" style="gap:14px">
          <div class="form-field span2"><label>IP da Impressora *</label><input type="text" id="prtIp" placeholder="192.168.1.100"></div>
          <div class="form-field span2"><label>Nome da Impressora *</label><input type="text" id="prtName" placeholder="Impressora-RH"></div>
          <div class="form-field span2"><label>Driver (padrão se vazio)</label><input type="text" id="prtDriver" placeholder="Generic / Text Only"></div>
          <div class="form-field"><label>Protocolo</label><select id="prtProto"><option value="RAW">RAW</option><option value="LPR">LPR</option></select></div>
          <div class="form-field"><label>Porta</label><input type="text" id="prtPort" value="9100"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px">
          <button class="btn-secondary" onclick="closePrinterModal()">Cancelar</button>
          <button class="btn-primary" onclick="installPrinter()">🖨️ Instalar</button>
        </div>
      </div>
    </div>

    <!-- Modal Loja -->
    <div id="lojaModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(6px);z-index:200;align-items:center;justify-content:center">
      <div style="background:var(--surface);border-radius:var(--radius-xl);width:720px;max-height:85vh;overflow:hidden;box-shadow:var(--shadow-xl);display:flex;flex-direction:column">
        <div style="padding:20px 24px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:15px;font-weight:700">📦 Loja de Aplicativos</div>
          <button onclick="document.getElementById('lojaModal').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-3)">×</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:20px">${renderLoja()}</div>
      </div>
    </div>

    <!-- Modal PowerShell -->
    <div id="psModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(6px);z-index:200;align-items:center;justify-content:center">
      <div style="background:var(--surface);border-radius:var(--radius-xl);padding:28px;width:580px;box-shadow:var(--shadow-xl)">
        <div style="font-size:15px;font-weight:700;margin-bottom:16px">⌨️ PowerShell em Massa</div>
        <textarea id="psCmd" rows="6" placeholder="Get-Process | Select-Object Name,CPU | Sort-Object CPU -Descending | Select-Object -First 10"
          style="width:100%;padding:12px;background:var(--surface-2);border:1.5px solid var(--border);border-radius:var(--radius);font-family:monospace;font-size:13px;resize:vertical"></textarea>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px">
          <button class="btn-secondary" onclick="document.getElementById('psModal').style.display='none'">Cancelar</button>
          <button class="btn-primary" onclick="runPSMass()">▶ Executar</button>
        </div>
      </div>
    </div>`;

  renderMachineList();
}

function renderAcoesCategorias() {
  const cats = {};
  Object.entries(ACOES).forEach(([id,a]) => { if(!cats[a.cat])cats[a.cat]=[]; cats[a.cat].push({id,...a}); });
  const catColors = {"Sistema":"var(--red)","Manutenção":"var(--amber)","Rede":"var(--brand)","Impressora":"var(--cyan)","Usuários":"var(--purple)","Info":"var(--green)"};
  let html = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">
    <button class="btn-primary" onclick="document.getElementById('psModal').style.display='flex'"><i class="fa-solid fa-terminal"></i> PowerShell em Massa</button>
    <button class="btn-secondary" onclick="document.getElementById('wallpaperModal').style.display='flex'">🎨 Papel de Parede</button>
    <button class="btn-secondary" onclick="document.getElementById('printerModal').style.display='flex'">🖨️ Instalar Impressora</button>
    <button class="btn-secondary" onclick="document.getElementById('lojaModal').style.display='flex'">📦 Loja de Apps</button>
  </div>`;
  Object.entries(cats).forEach(([cat,acoes]) => {
    const color = catColors[cat]||'var(--text-2)';
    html += `<div style="margin-bottom:16px">
      <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${color};margin-bottom:8px">${cat}</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap">
        ${acoes.map(a=>`<button onclick="runAcao('${a.id}')"
          style="padding:6px 12px;border-radius:var(--radius-sm);border:1.5px solid var(--border);background:var(--surface);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .12s;font-weight:500"
          onmouseover="this.style.borderColor='${color}';this.style.color='${color}'"
          onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text)'">${a.icon} ${a.label}</button>`).join('')}
      </div></div>`;
  });
  return html;
}

function renderLoja() {
  const cats = {};
  APPS_CATALOG.forEach(a => { if(!cats[a.cat])cats[a.cat]=[]; cats[a.cat].push(a); });
  let html = '';
  Object.entries(cats).forEach(([cat,apps]) => {
    html += `<div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:10px">${cat}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">
        ${apps.map(a=>`<div style="border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--surface-2);transition:border-color .12s"
          onmouseover="this.style.borderColor='var(--brand)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="display:flex;align-items:center;gap:9px">
            <div style="font-size:24px">${a.icon}</div>
            <div><div style="font-size:12.5px;font-weight:600">${a.nome}</div><div style="font-size:10.5px;color:var(--text-3)">winget</div></div>
          </div>
          <button onclick="installApp('${a.id}')" style="padding:6px;border-radius:var(--radius-sm);border:none;background:var(--brand);color:#fff;font-size:12px;cursor:pointer;font-weight:600">Instalar</button>
        </div>`).join('')}
      </div></div>`;
  });
  return html;
}

// ── SELEÇÃO DE MÁQUINAS ───────────────────────────────────────────
let selectedMachines = new Set();

function renderMachineList() {
  const lf = document.getElementById('acoesLocFilter')?.value||'all';
  const sf = document.getElementById('acoesStatusFilter')?.value||'all';
  const list = computers.filter(c=>(lf==='all'||c.localidade===lf)&&(sf==='all'||c.status===sf));
  const container = document.getElementById('machineCheckList');
  if (!container) return;
  container.innerHTML = list.map(c=>`
    <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--radius-sm);
      border:1.5px solid ${selectedMachines.has(c.id)?'var(--brand)':'var(--border)'};cursor:pointer;
      background:${selectedMachines.has(c.id)?'var(--brand-l)':'var(--surface)'};transition:all .12s;font-size:12.5px"
      onclick="toggleMachine(${c.id},this)">
      <input type="checkbox" ${selectedMachines.has(c.id)?'checked':''} style="accent-color:var(--brand)">
      <span class="badge-dot" style="background:${c.status==='online'?'var(--green)':'var(--red)'}"></span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.hostname}</div>
        <div style="font-size:10.5px;color:var(--text-3)">${c.ip} · ${c.localidade||'—'}</div>
      </div>
    </label>`).join('');
  updateSelCount();
}

function toggleMachine(id, el) {
  if (selectedMachines.has(id)) { selectedMachines.delete(id); el.style.borderColor='var(--border)'; el.style.background='var(--surface)'; }
  else { selectedMachines.add(id); el.style.borderColor='var(--brand)'; el.style.background='var(--brand-l)'; }
  updateSelCount();
}
function selectAllMachines() { computers.forEach(c=>selectedMachines.add(c.id)); renderMachineList(); }
function clearMachineSelection() { selectedMachines.clear(); renderMachineList(); }
function updateSelCount() { const el=document.getElementById('selCount'); if(el) el.textContent=`${selectedMachines.size} selecionada(s)`; }

// ── EXECUTAR AÇÃO ─────────────────────────────────────────────────
async function runAcao(id) {
  const acao = ACOES[id];
  if (!acao) return;
  if (selectedMachines.size===0) { toast('Selecione pelo menos uma máquina.','error'); return; }
  let cmd = acao.cmd;
  if (acao.cmd_tpl) {
    const input = prompt(acao.cmd_prompt||'Digite o valor:');
    if (!input) return;
    cmd = acao.cmd_tpl.replace(/\{input\}/g, input);
  }
  if (acao.confirm) {
    const names = computers.filter(c=>selectedMachines.has(c.id)).map(c=>c.hostname).join(', ');
    if (!confirm(`${acao.icon} ${acao.label} em:\n${names}\n\nConfirmar?`)) return;
  }
  logAcao(`▶ ${acao.icon} ${acao.label} — ${selectedMachines.size} máquina(s)`,'cmd');
  for (const pc of computers.filter(c=>selectedMachines.has(c.id))) {
    await runCmdOnPC(pc, cmd, acao.label);
  }
}

async function runCmdOnPC(pc, cmd, label) {
  logAcao(`⏳ ${pc.hostname} (${pc.ip})...`,'info');
  try {
    const r = await fetch(`${API_BASE}/api/action`, {
      method:'POST',
      headers:{'Content-Type':'application/json','X-API-Key':'inventopc-chave-secreta'},
      body:JSON.stringify({computer_id:pc.id, ip:pc.ip, ws_port:pc.ws_port||8765, cmd}),
    });
    const d = await r.json();
    if (d.output) logAcao(`✅ ${pc.hostname}:\n${d.output}`,'ok');
    if (d.error)  logAcao(`❌ ${pc.hostname}: ${d.error}`,'err');
    if (!d.output&&!d.error) logAcao(`✅ ${pc.hostname}: Comando enviado.`,'ok');
  } catch(e) {
    logAcao(`❌ ${pc.hostname}: ${e.message}`,'err');
  }
}

function logAcao(msg, type='info') {
  const el = document.getElementById('acoesLog');
  if (!el) return;
  const colors={cmd:'var(--brand)',ok:'var(--green)',err:'var(--red)',info:'var(--text-3)'};
  const ts = new Date().toLocaleTimeString('pt-BR');
  el.innerHTML += `<div style="color:${colors[type]||'var(--text)'};margin-bottom:3px"><span style="color:var(--text-4)">[${ts}]</span> ${msg.replace(/\n/g,'<br>')}</div>`;
  el.scrollTop = el.scrollHeight;
}

// ── POWERSHELL EM MASSA ───────────────────────────────────────────
async function runPSMass() {
  const cmd = document.getElementById('psCmd')?.value.trim();
  if (!cmd) { toast('Digite um comando.','error'); return; }
  if (selectedMachines.size===0) { toast('Selecione máquinas.','error'); return; }
  document.getElementById('psModal').style.display='none';
  logAcao(`▶ ⌨️ PowerShell em ${selectedMachines.size} máquina(s)`,'cmd');
  for (const pc of computers.filter(c=>selectedMachines.has(c.id))) {
    await runCmdOnPC(pc, cmd, 'PowerShell');
  }
}

// ── PAPEL DE PAREDE ────────────────────────────────────────────────
let wallpaperB64 = '';
let wallpaperReady = false;

function previewWallpaper(input) {
  const file = input.files[0];
  if (!file) return;
  wallpaperB64 = ''; wallpaperReady = false;
  const reader = new FileReader();
  reader.onload = e => {
    wallpaperB64 = e.target.result.split(',')[1];
    wallpaperReady = true;
    const prev = document.getElementById('wallpaperPreview');
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
    toast(`Imagem pronta (${Math.round(wallpaperB64.length*0.75/1024)}KB) — clique Aplicar`, 'info');
  };
  reader.readAsDataURL(file);
}

async function applyWallpaper() {
  if (selectedMachines.size===0) { toast('Selecione máquinas.','error'); return; }
  const url = document.getElementById('wallpaperUrl')?.value.trim();
  closeWallpaperModal();
  logAcao(`▶ 🎨 Papel de parede — ${selectedMachines.size} máquina(s)`,'cmd');
  const targets = computers.filter(c=>selectedMachines.has(c.id));

  if (wallpaperB64) {
    // Enviar arquivo via WebSocket diretamente (sem embutir base64 no PS)
    for (const pc of targets) {
      logAcao(`⏳ ${pc.hostname} — enviando imagem...`,'info');
      await sendWallpaperViaWS(pc, wallpaperB64);
    }
    wallpaperB64 = '';
    return;
  }

  if (url) {
    // Baixar da URL diretamente no PC remoto
    const cmd = `
$imgPath = "$env:TEMP\\wallpaper_merito.jpg"
try {
  Invoke-WebRequest -Uri '${url}' -OutFile $imgPath -UseBasicParsing -TimeoutSec 30
  Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class WP{[DllImport("user32.dll",CharSet=CharSet.Auto)]public static extern int SystemParametersInfo(int a,int b,string c,int d);}'
  [WP]::SystemParametersInfo(20, 0, $imgPath, 3) | Out-Null
  Write-Output "Papel de parede aplicado com sucesso!"
} catch { Write-Error "Erro: $_" }`;
    for (const pc of targets) {
      await runCmdOnPC(pc, cmd, 'Papel de Parede');
    }
    return;
  }

  // Verificar se arquivo ainda está carregando
  const fileInput = document.getElementById('wallpaperFile');
  if (fileInput && fileInput.files.length > 0 && !wallpaperB64) {
    toast('Aguarde o arquivo terminar de carregar.', 'error');
  } else {
    toast('Informe uma URL ou selecione uma imagem.', 'error');
  }
}

async function sendWallpaperViaWS(pc, b64) {
  return new Promise((resolve) => {
    try {
      const ws      = new WebSocket(`ws://${pc.ip}:${pc.ws_port||8765}`);
      const fileId  = 'wp_' + Date.now();
      const chunkSz = 32 * 1024; // 32KB por chunk
      const total   = Math.ceil(b64.length / chunkSz);
      let   done    = false;

      const timeout = setTimeout(() => {
        if (!done) { logAcao(`❌ ${pc.hostname}: Timeout ao enviar wallpaper`,'err'); try{ws.close();}catch{} resolve(); }
      }, 60000);

      ws.onmessage = async (e) => {
        try {
          const msg = JSON.parse(e.data);

          // Conectado — enviar chunks
          if (msg.type === 'connected') {
            for (let i = 0; i < total; i++) {
              const slice = b64.slice(i*chunkSz, (i+1)*chunkSz);
              ws.send(JSON.stringify({
                type:'file_chunk', file_id:fileId,
                filename:'wallpaper_merito.jpg',
                dest:'C:\\Windows\\Temp',
                chunk:i, total, data:slice, size:b64.length,
              }));
              if (i%10===0) await new Promise(r=>setTimeout(r,20));
            }
          }

          // Arquivo chegou — aplicar wallpaper
          if (msg.type==='file_progress' && msg.file_id===fileId && msg.done) {
            const imgPath = (msg.path||'C:\\Windows\\Temp\\wallpaper_merito.jpg').replace(/\\/g,'\\\\');
            const cmd = `
$path = '${imgPath}'
if (Test-Path $path) {
  Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class WP{[DllImport("user32.dll",CharSet=CharSet.Auto)]public static extern int SystemParametersInfo(int a,int b,string c,int d);}'
  [WP]::SystemParametersInfo(20, 0, $path, 3) | Out-Null
  Write-Output "Papel de parede aplicado!"
} else { Write-Error "Arquivo nao encontrado: $path" }`;
            ws.send(JSON.stringify({type:'powershell', cmd, id:'wp_apply'}));
          }

          if (msg.type==='file_progress' && msg.file_id===fileId && msg.error) {
            logAcao(`❌ ${pc.hostname}: ${msg.error}`,'err');
            done=true; clearTimeout(timeout); try{ws.close();}catch{} resolve();
          }

          // Resultado do PS
          if (msg.type==='ps_result' && msg.id==='wp_apply') {
            if (msg.output) logAcao(`✅ ${pc.hostname}: ${msg.output.trim()}`,'ok');
            if (msg.error && msg.error.trim()) logAcao(`❌ ${pc.hostname}: ${msg.error}`,'err');
            done=true; clearTimeout(timeout); try{ws.close();}catch{} resolve();
          }

        } catch(err) {
          logAcao(`❌ ${pc.hostname}: ${err.message}`,'err');
          done=true; clearTimeout(timeout); try{ws.close();}catch{} resolve();
        }
      };

      ws.onerror = () => {
        logAcao(`❌ ${pc.hostname}: Falha na conexão WebSocket`,'err');
        done=true; clearTimeout(timeout); resolve();
      };

    } catch(e) {
      logAcao(`❌ ${pc.hostname}: ${e.message}`,'err');
      resolve();
    }
  });
}

function closeWallpaperModal() {
  document.getElementById('wallpaperModal').style.display='none';
  wallpaperB64='';
}

// ── IMPRESSORA ────────────────────────────────────────────────────
async function installPrinter() {
  const ip     = document.getElementById('prtIp')?.value.trim();
  const name   = document.getElementById('prtName')?.value.trim();
  const driver = document.getElementById('prtDriver')?.value.trim()||'Generic / Text Only';
  const port   = document.getElementById('prtPort')?.value||'9100';
  if (!ip||!name) { toast('IP e nome são obrigatórios.','error'); return; }
  if (selectedMachines.size===0) { toast('Selecione máquinas.','error'); return; }
  const portName = `IP_${ip}`;
  const cmd = `
$portExists = Get-PrinterPort -Name '${portName}' -ErrorAction SilentlyContinue
if (-not $portExists) { Add-PrinterPort -Name '${portName}' -PrinterHostAddress '${ip}' }
$driverExists = Get-PrinterDriver -Name '${driver}' -ErrorAction SilentlyContinue
if (-not $driverExists) { Add-PrinterDriver -Name '${driver}' -ErrorAction SilentlyContinue }
$prtExists = Get-Printer -Name '${name}' -ErrorAction SilentlyContinue
if (-not $prtExists) {
  Add-Printer -Name '${name}' -DriverName '${driver}' -PortName '${portName}'
  Write-Output "Impressora '${name}' instalada em ${ip}!"
} else { Write-Output "Impressora '${name}' ja existe." }`;
  closePrinterModal();
  logAcao(`▶ 🖨️ Instalando '${name}' em ${selectedMachines.size} máquina(s)`,'cmd');
  for (const pc of computers.filter(c=>selectedMachines.has(c.id))) {
    await runCmdOnPC(pc, cmd, 'Impressora');
  }
}
function closePrinterModal() { document.getElementById('printerModal').style.display='none'; }

// ── LOJA DE APPS ──────────────────────────────────────────────────
async function installApp(appId) {
  const app = APPS_CATALOG.find(a=>a.id===appId);
  if (!app) return;
  if (selectedMachines.size===0) { toast('Selecione máquinas antes de instalar.','error'); return; }
  if (!confirm(`Instalar "${app.nome}" em ${selectedMachines.size} máquina(s)?`)) return;
  document.getElementById('lojaModal').style.display='none';
  logAcao(`▶ 📦 ${app.icon} ${app.nome} — ${selectedMachines.size} máquina(s)`,'cmd');
  for (const pc of computers.filter(c=>selectedMachines.has(c.id))) {
    await runCmdOnPC(pc, app.cmd, app.nome);
  }
}


// ── PAPEL DE PAREDE ────────────────────────────────────────────────
