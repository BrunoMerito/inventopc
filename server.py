"""
System Merito Server v3 — Flask + Supabase + Twilio + Acoes Remotas
"""

import json, os, datetime, subprocess, sys, hashlib, secrets, base64
from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS

app = Flask(__name__, static_folder="static", static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(32))
CORS(app, supports_credentials=True)

API_KEY          = os.environ.get("INVENTOPC_KEY",      "inventopc-chave-secreta")
SUPABASE_URL     = os.environ.get("SUPABASE_URL",       "")
SUPABASE_KEY     = os.environ.get("SUPABASE_ANON_KEY",  "")
TWILIO_SID       = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN     = os.environ.get("TWILIO_AUTH_TOKEN",  "")
TWILIO_FROM      = os.environ.get("TWILIO_FROM",        "")
TWILIO_NOTIFY_TO = os.environ.get("TWILIO_NOTIFY_TO",   "")
DATA_FILE        = os.environ.get("INVENTOPC_DB",       "inventopc_data.json")

vnc_sessions = {}
WS_BASE_PORT = 6900

# ── SUPABASE ──────────────────────────────────────────────────────
supabase = None
def init_supabase():
    global supabase
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[Supabase] Conectado!")
        return True
    except Exception as e:
        print(f"[Supabase] Erro: {e}")
        return False
USE_SUPABASE = init_supabase()

# ── TWILIO ────────────────────────────────────────────────────────
twilio_client = None
def init_twilio():
    global twilio_client
    if not TWILIO_SID or not TWILIO_TOKEN:
        return False
    try:
        from twilio.rest import Client
        twilio_client = Client(TWILIO_SID, TWILIO_TOKEN)
        print("[Twilio] Conectado!")
        return True
    except Exception as e:
        print(f"[Twilio] Erro: {e}")
        return False
USE_TWILIO = init_twilio()

def send_sms(to, body):
    if not twilio_client or not to: return False
    try:
        twilio_client.messages.create(body=body, from_=TWILIO_FROM, to=to)
        return True
    except Exception as e:
        print(f"[Twilio] {e}"); return False

# ── HELPERS ───────────────────────────────────────────────────────
def now():
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat() + "Z"

def hash_pass(p):
    return hashlib.sha256(p.encode()).hexdigest()

def agent_auth():
    if request.headers.get("X-API-Key","") != API_KEY:
        return jsonify({"error":"Chave invalida"}), 401

def load_db():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE,"r",encoding="utf-8") as f:
            return json.load(f)
    return {"computers":{},"next_id":1}

def save_db(db):
    with open(DATA_FILE,"w",encoding="utf-8") as f:
        json.dump(db,f,ensure_ascii=False,indent=2)

def mark_offline(lst):
    ts_now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    for c in lst:
        last = c.get("ultimo_visto","")
        if last:
            try:
                dt = datetime.datetime.fromisoformat(last.replace("Z",""))
                if (ts_now-dt).total_seconds()>600 and c.get("status")=="online":
                    c["status"]="offline"
            except: pass
    return lst

# ── STATIC ────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory("static","index.html")

# ── AUTH ──────────────────────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True) or {}
    username = data.get("username","").strip()
    password = data.get("password","")

    if USE_SUPABASE:
        try:
            r = supabase.table("usuarios").select("*").eq("username",username).single().execute()
            user = r.data
            if not user or user.get("password_hash") != hash_pass(password):
                return jsonify({"error":"Usuario ou senha incorretos"}),401
            if not user.get("ativo",True):
                return jsonify({"error":"Usuario desativado"}),403
            supabase.table("usuarios").update({"ultimo_login":now()}).eq("id",user["id"]).execute()
            session["username"] = user["username"]
            session["role"]     = user["role"]
            return jsonify({"username":user["username"],"role":user["role"],"nome":user.get("nome","")})
        except Exception as e:
            print(f"[Login Supabase] {e}")

    LOCAL = {
        "admin":   {"pass":hash_pass("admin123"),"role":"admin","nome":"Administrador"},
        "tecnico": {"pass":hash_pass("tec2024"), "role":"tecnico","nome":"Tecnico"},
    }
    u = LOCAL.get(username)
    if not u or u["pass"] != hash_pass(password):
        return jsonify({"error":"Usuario ou senha incorretos"}),401
    session["username"] = username
    session["role"]     = u["role"]
    return jsonify({"username":username,"role":u["role"],"nome":u["nome"]})

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message":"ok"})

@app.route("/api/auth/me", methods=["GET"])
def me():
    if "username" not in session:
        return jsonify({"error":"nao autenticado"}),401
    return jsonify({"username":session["username"],"role":session["role"]})

@app.route("/api/usuarios", methods=["GET"])
def list_usuarios():
    if not USE_SUPABASE:
        return jsonify([
            {"username":"admin","role":"admin","nome":"Administrador","ativo":True},
            {"username":"tecnico","role":"tecnico","nome":"Tecnico","ativo":True}
        ])
    try:
        r = supabase.table("usuarios").select("id,username,nome,role,ativo,ultimo_login,criado_em").execute()
        return jsonify(r.data)
    except Exception as e:
        return jsonify({"error":str(e)}),500

@app.route("/api/usuarios", methods=["POST"])
def criar_usuario():
    data = request.get_json(force=True) or {}
    if not USE_SUPABASE:
        return jsonify({"error":"Supabase nao configurado"}),503
    try:
        novo = {
            "username":      data.get("username",""),
            "password_hash": hash_pass(data.get("password","")),
            "nome":          data.get("nome",""),
            "role":          data.get("role","tecnico"),
            "telefone":      data.get("telefone",""),
            "ativo":         True,
            "criado_em":     now(),
        }
        r = supabase.table("usuarios").insert(novo).execute()
        return jsonify(r.data[0])
    except Exception as e:
        return jsonify({"error":str(e)}),500

@app.route("/api/usuarios/<uid>", methods=["PUT"])
def atualizar_usuario(uid):
    data = request.get_json(force=True) or {}
    if not USE_SUPABASE:
        return jsonify({"error":"Supabase nao configurado"}),503
    try:
        upd = {}
        for f in ["nome","role","telefone","ativo"]:
            if f in data: upd[f] = data[f]
        if data.get("password"):
            upd["password_hash"] = hash_pass(data["password"])
        supabase.table("usuarios").update(upd).eq("id",uid).execute()
        return jsonify({"message":"ok"})
    except Exception as e:
        return jsonify({"error":str(e)}),500

@app.route("/api/usuarios/<uid>", methods=["DELETE"])
def deletar_usuario(uid):
    if not USE_SUPABASE:
        return jsonify({"error":"Supabase nao configurado"}),503
    try:
        supabase.table("usuarios").delete().eq("id",uid).execute()
        return jsonify({"message":"removido"})
    except Exception as e:
        return jsonify({"error":str(e)}),500

# ── COMPUTADORES ──────────────────────────────────────────────────
@app.route("/api/computers", methods=["GET"])
def list_computers():
    if USE_SUPABASE:
        try:
            r = supabase.table("computadores").select("*").order("id").execute()
            return jsonify(mark_offline(r.data or []))
        except Exception as e:
            print(f"[Supabase list] {e}")
    db  = load_db()
    lst = list(db["computers"].values())
    mark_offline(lst)
    save_db(db)
    return jsonify(sorted(lst,key=lambda c:c.get("id",0)))

@app.route("/api/computers/<int:cid>", methods=["GET"])
def get_computer(cid):
    if USE_SUPABASE:
        try:
            r = supabase.table("computadores").select("*").eq("id",cid).single().execute()
            return jsonify(r.data) if r.data else (jsonify({"error":"nao encontrado"}),404)
        except Exception as e:
            return jsonify({"error":str(e)}),500
    db = load_db()
    c  = db["computers"].get(str(cid))
    return jsonify(c) if c else (jsonify({"error":"nao encontrado"}),404)

@app.route("/api/computers/<int:cid>", methods=["PUT"])
def update_computer(cid):
    data   = request.get_json(force=True) or {}
    fields = ["hostname","ip","usuario","setor","obs","status","so","cpu","cpu_detalhes",
              "ram","disco","fabricante","modelo","serial","mac","vnc_port","ws_port",
              "tipo","patrimonio","localidade","localizacao"]
    if USE_SUPABASE:
        try:
            upd = {f:data[f] for f in fields if f in data}
            supabase.table("computadores").update(upd).eq("id",cid).execute()
            return jsonify({"message":"ok"})
        except Exception as e:
            return jsonify({"error":str(e)}),500
    db=load_db(); key=str(cid)
    if key not in db["computers"]: return jsonify({"error":"nao encontrado"}),404
    for f in fields:
        if f in data: db["computers"][key][f]=data[f]
    save_db(db)
    return jsonify({"message":"ok"})

@app.route("/api/computers/<int:cid>", methods=["DELETE"])
def delete_computer(cid):
    if USE_SUPABASE:
        try:
            supabase.table("computadores").delete().eq("id",cid).execute()
            return jsonify({"message":"removido"})
        except Exception as e:
            return jsonify({"error":str(e)}),500
    db=load_db(); key=str(cid)
    if key not in db["computers"]: return jsonify({"error":"nao encontrado"}),404
    del db["computers"][key]; save_db(db)
    return jsonify({"message":"removido"})

@app.route("/api/register", methods=["POST"])
def register():
    err = agent_auth()
    if err: return err
    data=request.get_json(force=True) or {}
    hostname=data.get("hostname",""); mac=data.get("mac",""); ts=now()

    if USE_SUPABASE:
        try:
            existing=None
            r=supabase.table("computadores").select("id").eq("mac",mac).execute()
            if r.data: existing=r.data[0]["id"]
            if not existing:
                r=supabase.table("computadores").select("id").eq("hostname",hostname).execute()
                if r.data: existing=r.data[0]["id"]
            payload={**data,"status":"online","ultimo_visto":ts}
            if existing:
                supabase.table("computadores").update(payload).eq("id",existing).execute()
                cid=existing
            else:
                payload["registrado_em"]=ts; payload["obs"]=""
                r=supabase.table("computadores").insert(payload).execute()
                cid=r.data[0]["id"]
                print(f"[NOVO Supabase] {hostname} ID={cid}")
            return jsonify({"id":cid,"message":"ok"})
        except Exception as e:
            print(f"[Register Supabase] {e}")

    db=load_db(); existing=None
    for cid,c in db["computers"].items():
        if mac and c.get("mac")==mac: existing=cid; break
        if c.get("hostname")==hostname: existing=cid; break
    if existing:
        db["computers"][existing].update({**data,"id":int(existing),"status":"online","ultimo_visto":ts})
        cid=existing
    else:
        cid=str(db["next_id"]); db["next_id"]+=1
        db["computers"][cid]={**data,"id":int(cid),"status":"online","registrado_em":ts,"ultimo_visto":ts,"obs":""}
        print(f"[NOVO JSON] {hostname} ID={cid}")
    save_db(db)
    return jsonify({"id":int(cid),"message":"ok"})

@app.route("/api/heartbeat", methods=["POST"])
def heartbeat():
    err=agent_auth()
    if err: return err
    data=request.get_json(force=True) or {}
    cid=data.get("id"); ts=now()
    upd={"status":"online","ultimo_visto":ts,"ip":data.get("ip",""),"usuario":data.get("usuario","")}
    if USE_SUPABASE and cid:
        try:
            supabase.table("computadores").update(upd).eq("id",cid).execute()
            return jsonify({"status":"ok"})
        except Exception as e:
            print(f"[Heartbeat] {e}")
    db=load_db(); key=str(cid)
    if key in db["computers"]:
        db["computers"][key].update(upd); save_db(db)
        return jsonify({"status":"ok"})
    return jsonify({"error":"nao encontrado"}),404

# ── TICKETS ───────────────────────────────────────────────────────
@app.route("/api/tickets", methods=["GET"])
def list_tickets():
    if USE_SUPABASE:
        try:
            r=supabase.table("tickets").select("*").order("criado_em",desc=True).execute()
            return jsonify(r.data or [])
        except Exception as e:
            return jsonify({"error":str(e)}),500
    return jsonify([])

@app.route("/api/tickets", methods=["POST"])
def criar_ticket():
    data=request.get_json(force=True) or {}; ts=now()
    ticket={
        "titulo":data.get("titulo",""),"descricao":data.get("descricao",""),
        "solicitante":data.get("solicitante",""),"email":data.get("email",""),
        "setor":data.get("setor",""),"prioridade":data.get("prioridade","media"),
        "status":"aberto","tipo_equip":data.get("tipo_equip","desktop"),
        "patrimonio":data.get("patrimonio",""),"criado_em":ts,"atualizado_em":ts,
        "historico":json.dumps([{"autor":"Sistema","texto":"Ticket criado.","data":ts}]),
    }
    if USE_SUPABASE:
        try:
            r=supabase.table("tickets").insert(ticket).execute()
            cid=r.data[0]["id"]; protocolo=r.data[0].get("protocolo","")
            if USE_TWILIO and TWILIO_NOTIFY_TO:
                send_sms(TWILIO_NOTIFY_TO,f"Novo ticket: {data.get('titulo','')} | {data.get('solicitante','')}")
            return jsonify({"id":cid,"protocolo":protocolo,"message":"ok"})
        except Exception as e:
            return jsonify({"error":str(e)}),500
    return jsonify({"protocolo":"LOCAL","message":"ok"})

@app.route("/api/tickets/<int:tid>", methods=["PUT"])
def atualizar_ticket(tid):
    data=request.get_json(force=True) or {}
    if USE_SUPABASE:
        try:
            upd={"atualizado_em":now()}
            for f in ["status","prioridade","titulo","descricao","patrimonio","agente","grupo"]:
                if f in data: upd[f]=data[f]
            if data.get("historico_add"):
                r=supabase.table("tickets").select("historico").eq("id",tid).single().execute()
                hist=r.data.get("historico",[]) if r.data else []
                if isinstance(hist,str): hist=json.loads(hist or "[]")
                hist.append(data["historico_add"])
                upd["historico"]=hist
            supabase.table("tickets").update(upd).eq("id",tid).execute()
            return jsonify({"message":"ok"})
        except Exception as e:
            return jsonify({"error":str(e)}),500
    return jsonify({"message":"ok"})

@app.route("/api/tickets/<int:tid>", methods=["DELETE"])
def deletar_ticket(tid):
    if USE_SUPABASE:
        try:
            supabase.table("tickets").delete().eq("id",tid).execute()
            return jsonify({"message":"removido"})
        except Exception as e:
            return jsonify({"error":str(e)}),500
    return jsonify({"message":"ok"})

# ── TWILIO ────────────────────────────────────────────────────────
@app.route("/api/twilio/send", methods=["POST"])
def twilio_send():
    data=request.get_json(force=True) or {}
    ok=send_sms(data.get("to",""),data.get("body",""))
    return jsonify({"sent":ok})

# ── ACESSO REMOTO ─────────────────────────────────────────────────
@app.route("/api/remote/start/<int:cid>", methods=["POST"])
def remote_start(cid):
    if USE_SUPABASE:
        try:
            r=supabase.table("computadores").select("ip,vnc_port").eq("id",cid).single().execute()
            c=r.data
        except: c=None
    else:
        db=load_db(); c=db["computers"].get(str(cid))
    if not c: return jsonify({"error":"nao encontrado"}),404
    ip=c.get("ip",""); vnc_port=int(c.get("vnc_port",5900)); key=str(cid)
    if key in vnc_sessions:
        sess=vnc_sessions[key]
        if sess["proc"].poll() is None:
            return jsonify({"ws_port":sess["ws_port"],"reused":True})
        del vnc_sessions[key]
    used={s["ws_port"] for s in vnc_sessions.values()}
    ws_port=WS_BASE_PORT
    while ws_port in used: ws_port+=1
    try:
        cmd=[sys.executable,"-m","websockify",str(ws_port),f"{ip}:{vnc_port}"]
        proc=subprocess.Popen(cmd,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        vnc_sessions[key]={"proc":proc,"ws_port":ws_port}
        return jsonify({"ws_port":ws_port})
    except Exception as e:
        return jsonify({"error":str(e)}),500

@app.route("/api/remote/stop/<int:cid>", methods=["POST"])
def remote_stop(cid):
    key=str(cid)
    if key in vnc_sessions:
        vnc_sessions[key]["proc"].terminate(); del vnc_sessions[key]
    return jsonify({"message":"ok"})

@app.route("/api/remote/ws_info/<int:cid>", methods=["GET"])
def remote_ws_info(cid):
    if USE_SUPABASE:
        try:
            r=supabase.table("computadores").select("ip,ws_port,hostname,status").eq("id",cid).single().execute()
            c=r.data
        except: c=None
    else:
        db=load_db(); c=db["computers"].get(str(cid))
    if not c: return jsonify({"error":"nao encontrado"}),404
    return jsonify({"ip":c.get("ip",""),"ws_port":c.get("ws_port",8765),"hostname":c.get("hostname","")})

# ── ACAO REMOTA VIA WEBSOCKET ──────────────────────────────────────
@app.route("/api/action", methods=["POST"])
def remote_action():
    """Envia comando PowerShell ao agente via WebSocket e retorna resultado."""
    data    = request.get_json(force=True) or {}
    ip      = data.get("ip","")
    ws_port = int(data.get("ws_port", 8765))
    cmd     = data.get("cmd","")

    if not ip or not cmd:
        return jsonify({"error":"ip e cmd obrigatorios"}), 400

    try:
        import websocket as ws_lib
        import uuid, time

        req_id = str(uuid.uuid4())[:8]
        result = {"output":"","error":""}

        ws = ws_lib.create_connection(f"ws://{ip}:{ws_port}", timeout=10)
        ws.recv()  # mensagem de conexao
        ws.send(json.dumps({"type":"powershell","cmd":cmd,"id":req_id}))

        deadline = time.time() + 30
        while time.time() < deadline:
            try:
                msg = json.loads(ws.recv())
                if msg.get("type")=="ps_result" and msg.get("id")==req_id:
                    result["output"] = msg.get("output","")
                    result["error"]  = msg.get("error","")
                    break
            except: break
        ws.close()
        return jsonify(result)

    except ImportError:
        subprocess.run([sys.executable,"-m","pip","install","websocket-client","-q"],
                      capture_output=True)
        return jsonify({"error":"Instalando websocket-client. Tente novamente em 30s."}),503
    except Exception as e:
        return jsonify({"error":str(e)}),500

# ── STARTUP ───────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT",5000))
    print(f"""
  ╔══════════════════════════════════════╗
  ║   System Merito Server v3            ║
  ║   http://localhost:{port}              ║
  ╠══════════════════════════════════════╣
  ║  Supabase : {"conectado" if USE_SUPABASE else "nao configurado (JSON)"}
  ║  Twilio   : {"conectado" if USE_TWILIO else "nao configurado"}
  ╚══════════════════════════════════════╝
""")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
