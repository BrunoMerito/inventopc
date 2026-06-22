"""
System Merito - Agente Windows v4
- Captura tela e envia via WebSocket (sem VNC)
- Recebe eventos de mouse/teclado e executa
- Executa comandos PowerShell remotamente
- Registra no inventario automaticamente
- Gera .exe com: pyinstaller --onefile --noconsole --name "SistemaMerito-Agente" agent.py
"""

import sys, os, json, socket, uuid, subprocess, threading, time, datetime
import urllib.request, urllib.error, ctypes, winreg, base64, io
import asyncio, websockets

# ── CONFIG ────────────────────────────────────────────────────────
SERVER_URL   = "http://127.0.0.1:5000"
API_KEY      = "inventopc-chave-secreta"
INTERVAL     = 30    # heartbeat a cada 30s
VERSION      = "4.0.0"
WS_PORT      = 8765  # porta WebSocket do agente

DATA_DIR    = os.path.join(os.environ.get("APPDATA", "C:\\Users\\Public"), "SistemaMerito")
CONFIG_FILE = os.path.join(DATA_DIR, "config.json")
LOG_FILE    = os.path.join(DATA_DIR, "agent.log")
os.makedirs(DATA_DIR, exist_ok=True)

# ── LOG ───────────────────────────────────────────────────────────
def log(msg):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

def load_cfg():
    try:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_cfg(data):
    existing = load_cfg()
    existing.update(data)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

# ── CAPTURA DE TELA ───────────────────────────────────────────────
def capture_screen(quality=30, scale=0.7):
    """Captura tela e retorna JPEG em base64."""
    try:
        from PIL import ImageGrab, Image
        img = ImageGrab.grab()
        # Reduzir tamanho para velocidade
        w = int(img.width * scale)
        h = int(img.height * scale)
        img = img.resize((w, h), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        return base64.b64encode(buf.getvalue()).decode()
    except Exception as e:
        log(f"Captura erro: {e}")
        return None

# ── MOUSE E TECLADO ───────────────────────────────────────────────
def move_mouse(x, y):
    try:
        import ctypes
        # Converter coordenadas relativas para absolutas
        from PIL import ImageGrab
        img = ImageGrab.grab()
        abs_x = int(x * img.width)
        abs_y = int(y * img.height)
        ctypes.windll.user32.SetCursorPos(abs_x, abs_y)
    except Exception as e:
        log(f"Mouse move erro: {e}")

def click_mouse(x, y, button="left", double=False):
    try:
        import ctypes
        from PIL import ImageGrab
        img = ImageGrab.grab()
        abs_x = int(x * img.width)
        abs_y = int(y * img.height)
        ctypes.windll.user32.SetCursorPos(abs_x, abs_y)
        time.sleep(0.05)

        MOUSEEVENTF_LEFTDOWN   = 0x0002
        MOUSEEVENTF_LEFTUP     = 0x0004
        MOUSEEVENTF_RIGHTDOWN  = 0x0008
        MOUSEEVENTF_RIGHTUP    = 0x0010

        if button == "right":
            ctypes.windll.user32.mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0)
            time.sleep(0.05)
            ctypes.windll.user32.mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0)
        else:
            ctypes.windll.user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
            time.sleep(0.05)
            ctypes.windll.user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
            if double:
                time.sleep(0.1)
                ctypes.windll.user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
                time.sleep(0.05)
                ctypes.windll.user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    except Exception as e:
        log(f"Click erro: {e}")

def scroll_mouse(x, y, delta):
    try:
        import ctypes
        from PIL import ImageGrab
        img = ImageGrab.grab()
        abs_x = int(x * img.width)
        abs_y = int(y * img.height)
        ctypes.windll.user32.SetCursorPos(abs_x, abs_y)
        MOUSEEVENTF_WHEEL = 0x0800
        ctypes.windll.user32.mouse_event(MOUSEEVENTF_WHEEL, 0, 0, int(delta * 120), 0)
    except Exception as e:
        log(f"Scroll erro: {e}")

def send_key(key_code, down=True):
    try:
        import ctypes
        KEYEVENTF_KEYUP = 0x0002
        flags = 0 if down else KEYEVENTF_KEYUP
        ctypes.windll.user32.keybd_event(key_code, 0, flags, 0)
    except Exception as e:
        log(f"Key erro: {e}")

def type_text(text):
    try:
        import ctypes
        for char in text:
            vk = ctypes.windll.user32.VkKeyScanW(ord(char))
            if vk == -1:
                continue
            vk_code = vk & 0xFF
            shift    = (vk >> 8) & 0xFF
            if shift & 1:
                send_key(0x10, True)  # Shift down
            send_key(vk_code, True)
            time.sleep(0.01)
            send_key(vk_code, False)
            if shift & 1:
                send_key(0x10, False)  # Shift up
            time.sleep(0.01)
    except Exception as e:
        log(f"Type erro: {e}")

# ── POWERSHELL REMOTO ─────────────────────────────────────────────
def run_powershell(cmd, timeout=30):
    """Executa comando PowerShell e retorna output."""
    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive",
             "-ExecutionPolicy", "Bypass", "-Command", cmd],
            capture_output=True, text=True, timeout=timeout,
            creationflags=0x08000000  # CREATE_NO_WINDOW
        )
        output = result.stdout or ""
        errors = result.stderr or ""
        return {
            "output": output,
            "error":  errors,
            "code":   result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"output": "", "error": "Timeout: comando demorou demais.", "code": -1}
    except Exception as e:
        return {"output": "", "error": str(e), "code": -1}

# ── WEBSOCKET SERVER ──────────────────────────────────────────────
connected_clients = set()
screen_streaming  = {}  # client -> bool

async def ws_handler(websocket):
    """Gerencia cada conexão WebSocket do painel."""
    client_id = id(websocket)
    connected_clients.add(websocket)
    screen_streaming[client_id] = False
    log(f"Cliente conectado: {websocket.remote_address}")

    # Enviar info inicial
    cfg = load_cfg()
    await websocket.send(json.dumps({
        "type": "connected",
        "hostname": socket.gethostname(),
        "ip":       get_ip(),
        "agent_id": cfg.get("agent_id"),
        "version":  VERSION,
    }))

    # Task de streaming de tela
    stream_task = None

    async def stream_screen():
        """Envia frames da tela continuamente."""
        while screen_streaming.get(client_id, False):
            try:
                frame = capture_screen(quality=25, scale=0.65)
                if frame:
                    await websocket.send(json.dumps({
                        "type":  "frame",
                        "data":  frame,
                        "ts":    time.time(),
                    }))
            except Exception:
                break
            await asyncio.sleep(0.1)  # ~10 FPS

    try:
        async for message in websocket:
            try:
                msg = json.loads(message)
                mtype = msg.get("type", "")

                # Iniciar streaming de tela
                if mtype == "start_stream":
                    screen_streaming[client_id] = True
                    if stream_task is None or stream_task.done():
                        stream_task = asyncio.create_task(stream_screen())
                    log("Streaming de tela iniciado.")

                # Parar streaming
                elif mtype == "stop_stream":
                    screen_streaming[client_id] = False
                    log("Streaming parado.")

                # Captura única
                elif mtype == "screenshot":
                    frame = capture_screen(quality=60, scale=1.0)
                    if frame:
                        await websocket.send(json.dumps({"type":"frame","data":frame}))

                # Movimento de mouse
                elif mtype == "mouse_move":
                    move_mouse(msg.get("x", 0), msg.get("y", 0))

                # Clique
                elif mtype == "mouse_click":
                    click_mouse(
                        msg.get("x", 0), msg.get("y", 0),
                        msg.get("button", "left"),
                        msg.get("double", False)
                    )

                # Scroll
                elif mtype == "mouse_scroll":
                    scroll_mouse(msg.get("x",0), msg.get("y",0), msg.get("delta",1))

                # Tecla
                elif mtype == "key_event":
                    send_key(msg.get("keyCode", 0), msg.get("down", True))

                # Digitar texto
                elif mtype == "type_text":
                    threading.Thread(
                        target=type_text, args=(msg.get("text",""),), daemon=True
                    ).start()

                # Ctrl+Alt+Del
                elif mtype == "ctrl_alt_del":
                    send_key(0x11, True)   # Ctrl
                    send_key(0x12, True)   # Alt
                    send_key(0x2E, True)   # Del
                    time.sleep(0.1)
                    send_key(0x2E, False)
                    send_key(0x12, False)
                    send_key(0x11, False)

                # Comando PowerShell
                elif mtype == "powershell":
                    cmd    = msg.get("cmd", "")
                    req_id = msg.get("id", "")
                    log(f"PS> {cmd[:80]}")
                    result = run_powershell(cmd)
                    await websocket.send(json.dumps({
                        "type":   "ps_result",
                        "id":     req_id,
                        "output": result["output"],
                        "error":  result["error"],
                        "code":   result["code"],
                    }))

                # Ping
                elif mtype == "ping":
                    await websocket.send(json.dumps({"type":"pong","ts":time.time()}))

            except json.JSONDecodeError:
                pass
            except Exception as e:
                log(f"WS handler erro: {e}")

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        screen_streaming.pop(client_id, None)
        if stream_task and not stream_task.done():
            stream_task.cancel()
        log(f"Cliente desconectado.")

async def start_ws_server():
    log(f"WebSocket server na porta {WS_PORT}...")
    async with websockets.serve(
        ws_handler, "0.0.0.0", WS_PORT,
        max_size=10*1024*1024,  # 10MB por frame
        ping_interval=20,
        ping_timeout=10,
    ):
        await asyncio.Future()  # Rodar para sempre

def run_ws_loop():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(start_ws_server())
    except Exception as e:
        log(f"WS server erro: {e}")

# ── HARDWARE ──────────────────────────────────────────────────────
def run_ps(q):
    try:
        cmd = ["powershell","-NoProfile","-NonInteractive","-Command",
               f'Get-WmiObject -Query "{q}" | ConvertTo-Json -Depth 2']
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL,
                                      timeout=15, creationflags=0x08000000)
        d = json.loads(out.decode("utf-8","ignore"))
        return (d[0] if isinstance(d,list) else d) or {}
    except Exception:
        return {}

def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80)); ip = s.getsockname()[0]; s.close()
        return ip
    except Exception:
        return socket.gethostbyname(socket.gethostname())

def collect_hardware():
    o = run_ps("SELECT Caption,OSArchitecture FROM Win32_OperatingSystem")
    c = run_ps("SELECT Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed FROM Win32_Processor")
    r = run_ps("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem")
    d = run_ps("SELECT Size FROM Win32_DiskDrive")
    b = run_ps("SELECT SerialNumber FROM Win32_BIOS")
    m = run_ps("SELECT Manufacturer,Product FROM Win32_BaseBoard")
    ch= run_ps("SELECT ChassisTypes FROM Win32_SystemEnclosure")

    ram_gb  = round(int(r.get("TotalPhysicalMemory",0))/(1024**3))
    disk_gb = round(int(d.get("Size",0))/(1024**3))
    cpu_mhz = int(c.get("MaxClockSpeed",0))
    mac = ":".join([f"{(uuid.getnode()>>i)&0xff:02x}" for i in range(0,48,8)][::-1])

    try:
        usuario = os.environ.get("USERNAME", os.getlogin())
        dom     = os.environ.get("USERDOMAIN","")
        if dom and dom != socket.gethostname(): usuario = f"{dom}\\{usuario}"
    except Exception:
        usuario = "Desconhecido"

    ct = ch.get("ChassisTypes",[])
    if isinstance(ct,int): ct=[ct]
    tipo = "notebook" if any(t in [8,9,10,11,12,14,18,21] for t in (ct or [])) else "desktop"

    return {
        "hostname":     socket.gethostname(),
        "ip":           get_ip(),
        "mac":          mac,
        "usuario":      usuario,
        "so":           f"{o.get('Caption','Windows')} ({o.get('OSArchitecture','x64')})",
        "cpu":          c.get("Name","").strip(),
        "cpu_detalhes": f"{c.get('NumberOfCores','?')} nucleos / {c.get('NumberOfLogicalProcessors','?')} threads {cpu_mhz/1000:.1f}GHz".strip(),
        "ram":          f"{ram_gb} GB",
        "disco":        f"{disk_gb} GB",
        "fabricante":   m.get("Manufacturer","").strip(),
        "modelo":       m.get("Product","").strip(),
        "serial":       b.get("SerialNumber","").strip() or str(uuid.getnode()),
        "tipo":         tipo,
        "ws_port":      WS_PORT,
        "agente_versao": VERSION,
        "timestamp":    datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

# ── API ───────────────────────────────────────────────────────────
def api_post(endpoint, payload):
    url  = SERVER_URL.rstrip("/") + "/" + endpoint.lstrip("/")
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-API-Key",    API_KEY)
    req.add_header("User-Agent",   f"SistemaMerito-Agent/{VERSION}")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return True, json.loads(r.read().decode() or "{}")
    except Exception as e:
        return False, {"error": str(e)}

def register():
    hw = collect_hardware()
    ok, resp = api_post("/api/register", hw)
    if ok:
        save_cfg({"agent_id": resp.get("id"), "hostname": hw["hostname"]})
        log(f"Registrado! ID={resp.get('id')} | {hw['hostname']} | {hw['ip']}")
    else:
        log(f"Falha no registro: {resp.get('error')}")
    return ok

def heartbeat():
    cfg = load_cfg()
    ok, _ = api_post("/api/heartbeat", {
        "id":       cfg.get("agent_id"),
        "hostname": socket.gethostname(),
        "ip":       get_ip(),
        "usuario":  os.environ.get("USERNAME",""),
        "ws_port":  WS_PORT,
        "timestamp":datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    return ok

# ── AUTOSTART ─────────────────────────────────────────────────────
def set_autostart():
    exe = sys.executable if getattr(sys,"frozen",False) else os.path.abspath(__file__)
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                             r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                             0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, "SistemaMerito", 0, winreg.REG_SZ,
                          f'"{sys.executable}" "{exe}"' if not getattr(sys,"frozen",False) else f'"{exe}"')
        winreg.CloseKey(key)
    except Exception as e:
        log(f"Autostart erro: {e}")

# ── TRAY ──────────────────────────────────────────────────────────
def make_icon(status="connecting"):
    from PIL import Image, ImageDraw
    colors = {"online":"#16A34A","offline":"#DC2626","connecting":"#D97706"}
    color  = colors.get(status,"#D97706")
    img    = Image.new("RGBA",(64,64),(0,0,0,0))
    draw   = ImageDraw.Draw(img)
    # Fundo (monitor)
    draw.rounded_rectangle([4,8,60,44], radius=6, fill="#1E40AF")
    draw.rectangle([10,14,54,38], fill="#0F172A")
    # Letras "SM" na tela
    draw.rectangle([16,20,22,32], fill=color)  # S
    draw.rectangle([16,20,26,23], fill=color)
    draw.rectangle([16,25,26,28], fill=color)
    draw.rectangle([16,29,26,32], fill=color)
    draw.rectangle([30,20,36,32], fill=color)  # M
    draw.rectangle([30,20,44,32], fill=color)
    draw.rectangle([36,20,40,28], fill="#0F172A")
    # Base
    draw.rectangle([26,44,38,50], fill="#1E40AF")
    draw.rectangle([20,50,44,55], fill="#1E40AF")
    # Status dot
    draw.ellipse([44,44,60,60], fill=color, outline="white", width=2)
    return img

def run_tray(status_ref):
    try:
        import pystray
        icon_ref = [None]

        def get_label(item):
            s  = status_ref.get("status","connecting")
            ts = status_ref.get("last_sync","")
            lbl = {"online":f"System Merito - Conectado | {ts}",
                   "offline":f"System Merito - Sem conexao | {ts}",
                   "connecting":"System Merito - Conectando..."}
            return lbl.get(s,"System Merito")

        def open_painel(i,_): 
            import webbrowser; webbrowser.open(SERVER_URL)

        def force_reg(i,_):
            threading.Thread(target=lambda:_do_reg(icon_ref[0]),daemon=True).start()

        def open_log(i,_):
            if os.path.exists(LOG_FILE): os.startfile(LOG_FILE)

        def quit_app(i,_):
            log("Agente encerrado."); i.stop(); sys.exit(0)

        menu = pystray.Menu(
            pystray.MenuItem(get_label,None,enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Abrir painel",     open_painel),
            pystray.MenuItem("Forcar registro",  force_reg),
            pystray.MenuItem("Ver log",          open_log),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Sair",             quit_app),
        )
        icon = pystray.Icon("SistemaMerito", make_icon("connecting"),
                             "System Merito Agent", menu)
        icon_ref[0] = icon
        icon.run_detached()
        return icon
    except Exception as e:
        log(f"Tray erro: {e}"); return None

def update_icon(icon, status):
    if not icon: return
    try:
        icon.icon  = make_icon(status)
        lbl = {"online":"System Merito - Conectado",
               "offline":"System Merito - Sem conexao",
               "connecting":"System Merito - Conectando..."}
        icon.title = lbl.get(status,"System Merito")
    except Exception: pass

def _do_reg(icon):
    ok = register()
    update_icon(icon,"online" if ok else "offline")

# ── MAIN ──────────────────────────────────────────────────────────
def main():
    # Prevenir multiplas instancias
    try:
        mutex = ctypes.windll.kernel32.CreateMutexW(None,False,"SistemaMerito_v4")
        if ctypes.windll.kernel32.GetLastError() == 183:
            sys.exit(0)
    except Exception: pass

    cfg = load_cfg()
    global SERVER_URL
    if cfg.get("server_url"): SERVER_URL = cfg["server_url"]

    log(f"System Merito Agent v{VERSION} | {SERVER_URL}")

    # Autostart
    set_autostart()

    # Iniciar WebSocket server em thread separada
    ws_thread = threading.Thread(target=run_ws_loop, daemon=True)
    ws_thread.start()
    log(f"WebSocket server iniciado na porta {WS_PORT}")

    # Tray icon
    status_ref = {"status":"connecting","last_sync":""}
    icon = run_tray(status_ref)

    # Loop de registro e heartbeat
    def loop():
        time.sleep(2)
        ok = register()
        status_ref["status"]    = "online" if ok else "offline"
        status_ref["last_sync"] = datetime.datetime.now().strftime("%H:%M:%S")
        update_icon(icon, status_ref["status"])

        while True:
            time.sleep(INTERVAL)
            try:
                ok = heartbeat()
                status_ref["status"]    = "online" if ok else "offline"
                status_ref["last_sync"] = datetime.datetime.now().strftime("%H:%M:%S")
                update_icon(icon, status_ref["status"])
            except Exception as e:
                log(f"Loop erro: {e}")
                time.sleep(30)

    threading.Thread(target=loop, daemon=True).start()

    # Manter vivo
    try:
        while True: time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        log("Encerrado.")

if __name__ == "__main__":
    main()
