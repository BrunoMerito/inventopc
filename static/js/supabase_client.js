/* ═══════════════════════════════════════════════════════
   System Mérito — supabase.js
   Integração completa com Supabase
═══════════════════════════════════════════════════════ */

const SUPABASE_URL = "https://cawgdmhjbocjunondego.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZXQKcK80wCwhL0R-Mt52iw_HAiuF61i";

let sb = null;

// Inicializar Supabase
async function initSupabase() {
  try {
    const { createClient } = supabase;
    sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("[Supabase] Conectado!");
    return true;
  } catch (e) {
    console.warn("[Supabase] Erro ao inicializar:", e);
    return false;
  }
}

// ── COMPUTADORES ──────────────────────────────────────────────────
async function sbGetComputers() {
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('computadores')
      .select('*')
      .order('id');
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("[Supabase] getComputers:", e);
    return null;
  }
}

async function sbSaveComputer(computer) {
  if (!sb) return null;
  try {
    const { mac, hostname } = computer;

    // Buscar existente
    const { data: existing } = await sb
      .from('computadores')
      .select('id')
      .or(`mac.eq.${mac},hostname.eq.${hostname}`)
      .single();

    if (existing) {
      const { data, error } = await sb
        .from('computadores')
        .update({ ...computer, ultimo_visto: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await sb
        .from('computadores')
        .insert({ ...computer, registrado_em: new Date().toISOString(), ultimo_visto: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  } catch (e) {
    console.error("[Supabase] saveComputer:", e);
    return null;
  }
}

async function sbUpdateComputer(id, data) {
  if (!sb) return null;
  try {
    const { data: result, error } = await sb
      .from('computadores')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  } catch (e) {
    console.error("[Supabase] updateComputer:", e);
    return null;
  }
}

async function sbDeleteComputer(id) {
  if (!sb) return false;
  try {
    const { error } = await sb.from('computadores').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[Supabase] deleteComputer:", e);
    return false;
  }
}

// ── TICKETS ───────────────────────────────────────────────────────
async function sbGetTickets() {
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('tickets')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("[Supabase] getTickets:", e);
    return null;
  }
}

async function sbCreateTicket(ticket) {
  if (!sb) return null;
  try {
    // Gerar próximo ID para protocolo
    const { data: last } = await sb
      .from('tickets')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    const nextNum = (last?.id || 100) + 1;
    const protocolo = `#${String(nextNum).padStart(3, '0')}`;

    const { data, error } = await sb
      .from('tickets')
      .insert({
        ...ticket,
        protocolo,
        historico: JSON.stringify(ticket.historico || []),
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("[Supabase] createTicket:", e);
    return null;
  }
}

async function sbUpdateTicket(id, updates) {
  if (!sb) return null;
  try {
    if (updates.historico && typeof updates.historico !== 'string') {
      updates.historico = JSON.stringify(updates.historico);
    }
    updates.atualizado_em = new Date().toISOString();
    const { data, error } = await sb
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("[Supabase] updateTicket:", e);
    return null;
  }
}

async function sbDeleteTicket(id) {
  if (!sb) return false;
  try {
    const { error } = await sb.from('tickets').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[Supabase] deleteTicket:", e);
    return false;
  }
}

// ── USUÁRIOS ──────────────────────────────────────────────────────
async function sbGetUsuarios() {
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('usuarios')
      .select('id,username,nome,role,telefone,ativo,ultimo_login,criado_em');
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("[Supabase] getUsuarios:", e);
    return null;
  }
}

async function sbLogin(username, password) {
  if (!sb) return null;
  try {
    const hashPass = async (str) => {
      const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    };
    const hash = await hashPass(password);
    const { data, error } = await sb
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .eq('password_hash', hash)
      .eq('ativo', true)
      .single();
    if (error || !data) return null;

    // Atualizar último login
    await sb.from('usuarios').update({ ultimo_login: new Date().toISOString() }).eq('id', data.id);
    return data;
  } catch (e) {
    console.error("[Supabase] login:", e);
    return null;
  }
}

// ── REALTIME ──────────────────────────────────────────────────────
function sbSubscribeComputers(callback) {
  if (!sb) return null;
  return sb
    .channel('computadores-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'computadores' }, callback)
    .subscribe();
}

function sbSubscribeTickets(callback) {
  if (!sb) return null;
  return sb
    .channel('tickets-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, callback)
    .subscribe();
}

// ── CARREGAR DADOS COM FALLBACK ────────────────────────────────────
async function loadDataWithSupabase() {
  // Sempre buscar do Flask primeiro (fonte de verdade do agente)
  try {
    const r = await fetch(`${API_BASE}/api/computers`);
    if (r.ok) {
      const flaskData = await r.json();
      if (flaskData && flaskData.length > 0) {
        computers = flaskData.map(c => ({
          ...c,
          localidade: c.localidade || 'escritorio',
          status:     c.status || 'offline',
          ws_port:    c.ws_port || 8765,
        }));
        setServerStatus(true, 'Online');

        // Sincronizar com Supabase em background
        if (sb) {
          flaskData.forEach(c => sbSaveComputer(c).catch(() => {}));
        }
        return;
      }
    }
  } catch {}

  // Tentar Supabase se Flask falhou
  if (sb) {
    const data = await sbGetComputers();
    if (data && data.length > 0) {
      computers = data.map(c => ({
        ...c,
        localidade: c.localidade || 'escritorio',
        status:     c.status || 'offline',
        ws_port:    c.ws_port || 8765,
      }));
      setServerStatus(true, 'Supabase');
      return;
    }
  }

  // Demo
  setServerStatus(false);
  if (!computers.length) loadDemoData();
}

async function saveComputerWithSupabase(data) {
  if (sb) {
    const result = await sbSaveComputer(data);
    if (result) return result;
  }
  // Fallback Flask
  try {
    const r = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': 'inventopc-chave-secreta' },
      body: JSON.stringify(data)
    });
    if (r.ok) return await r.json();
  } catch {}
  return null;
}

async function updateComputerWithSupabase(id, data) {
  if (sb) {
    const result = await sbUpdateComputer(id, data);
    if (result) return result;
  }
  try {
    await fetch(`${API_BASE}/api/computers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch {}
}

async function deleteComputerWithSupabase(id) {
  if (sb) await sbDeleteComputer(id);
  try { await fetch(`${API_BASE}/api/computers/${id}`, { method: 'DELETE' }); } catch {}
}

// Tickets com Supabase
async function loadTicketsWithSupabase() {
  if (sb) {
    const data = await sbGetTickets();
    if (data) {
      tickets = data.map(t => ({
        ...t,
        historico: typeof t.historico === 'string'
          ? JSON.parse(t.historico || '[]')
          : (t.historico || []),
        tags: t.tags || [],
      }));
      updateTicketBadge();
      return;
    }
  }
  loadTickets(); // localStorage fallback
}

async function createTicketWithSupabase(ticket) {
  if (sb) {
    const result = await sbCreateTicket(ticket);
    if (result) {
      result.historico = typeof result.historico === 'string'
        ? JSON.parse(result.historico || '[]')
        : (result.historico || []);
      tickets.unshift(result);
      updateTicketBadge();
      return result;
    }
  }
  // Fallback localStorage
  const id  = nextTicketId++;
  const novo = { id, protocolo:`#${id}`, ...ticket };
  tickets.unshift(novo);
  saveTickets();
  return novo;
}

async function updateTicketWithSupabase(id, updates) {
  if (sb) await sbUpdateTicket(id, updates);
  // Atualizar local também
  const idx = tickets.findIndex(t => t.id === id);
  if (idx >= 0) Object.assign(tickets[idx], updates);
  updateTicketBadge();
}

async function deleteTicketWithSupabase(id) {
  if (sb) await sbDeleteTicket(id);
  tickets = tickets.filter(t => t.id !== id);
  updateTicketBadge();
}
