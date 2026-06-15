import { useState, useEffect, useCallback } from "react";

// ── Supabase config ───────────────────────────────────────────────
const SUPA_URL = "https://wslnwqenywgemybtpxmf.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzbG53cWVueXdnZW15YnRweG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjgzMzEsImV4cCI6MjA5NzA0NDMzMX0.nCi0F7vkn_TMcX_jnGCUjebOvhQSXhAiwU6Hy342ag8";
const headers = { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Prefer": "return=representation" };

const db = {
  async get(table) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?select=*&order=created_at.desc`, { headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, { method: "POST", headers, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    const res = await r.json();
    return Array.isArray(res) ? res[0] : res;
  },
  async update(table, id, data) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(table, id) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers });
    if (!r.ok) throw new Error(await r.text());
  },
};

// ── Helpers ───────────────────────────────────────────────────────
const initials = (name) => name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) : "?";
const fmt = (n) => n ? `$${Number(n).toLocaleString("es-CO")}` : "$0";
const fmtDate = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}) : "-";
const cleanPhone = (p) => p ? p.replace(/\D/g, "") : "";

// ── Icons ─────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const icons = {
  needle:   "M12 2l1.5 9h-3L12 2zm0 20v-9m-6-3h12M6 19h12",
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  check:    "M20 6L9 17l-5-5",
  plus:     "M12 5v14M5 12h14",
  close:    "M18 6L6 18M6 6l12 12",
  lead:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  convert:  "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
};

// ── CSS ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0d0d0d; --paper: #f5f0e8; --red: #c0392b; --red-dark: #96281b;
    --gold: #d4a843; --muted: #7a7060; --border: #d6cfc0; --card: #fff9f0; --success: #27ae60;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); min-height: 100vh; }
  h1,h2,h3 { font-family: 'Bebas Neue', sans-serif; letter-spacing: .04em; }
  .app { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; min-height: 100vh; background: var(--ink); color: var(--paper); display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; }
  .sidebar-logo { padding: 28px 24px 20px; border-bottom: 1px solid #2a2a2a; font-family: 'Bebas Neue',sans-serif; font-size: 26px; color: var(--gold); line-height: 1; }
  .sidebar-logo span { display: block; font-size: 11px; font-family: 'DM Sans',sans-serif; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; margin-top: 4px; }
  .nav { flex: 1; padding: 16px 0; }
  .nav-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 12px 24px; background: none; border: none; color: #aaa; font-family: 'DM Sans',sans-serif; font-size: 14px; cursor: pointer; transition: all .15s; text-align: left; }
  .nav-btn:hover { color: var(--paper); background: #1a1a1a; }
  .nav-btn.active { color: var(--gold); background: #1a1a1a; border-left: 3px solid var(--gold); }
  .sidebar-bottom { padding: 20px 24px; border-top: 1px solid #2a2a2a; font-size: 12px; color: #555; }
  .main { flex: 1; padding: 36px 40px; max-width: 960px; }
  .page-header { margin-bottom: 28px; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .page-title { font-family: 'Bebas Neue',sans-serif; font-size: 42px; letter-spacing: .04em; line-height: 1; }
  .page-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px; border-radius: 6px; border: none; font-family: 'DM Sans',sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all .15s; white-space: nowrap; }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
  .btn-primary { background: var(--red); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: var(--red-dark); }
  .btn-ghost { background: transparent; color: var(--muted); border: 1.5px solid var(--border); }
  .btn-ghost:hover:not(:disabled) { border-color: var(--ink); color: var(--ink); }
  .btn-success { background: var(--success); color: #fff; }
  .btn-success:hover:not(:disabled) { background: #219150; }
  .btn-convert { background: #7c3aed; color: #fff; }
  .btn-convert:hover:not(:disabled) { background: #6d28d9; }
  .btn-danger { background: transparent; color: var(--red); border: 1.5px solid var(--red); }
  .btn-danger:hover:not(:disabled) { background: var(--red); color: #fff; }
  .btn-wa { background: #25d366; color: #fff; }
  .btn-wa:hover:not(:disabled) { background: #1ebe5a; }
  .btn-wa-outline { background: transparent; color: #25d366; border: 1.5px solid #25d366; }
  .btn-wa-outline:hover:not(:disabled) { background: #25d366; color: #fff; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: var(--card); border: 1.5px solid var(--border); border-radius: 10px; padding: 20px; position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--gold); }
  .stat-value { font-family: 'Bebas Neue',sans-serif; font-size: 38px; line-height: 1; }
  .stat-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; margin-top: 4px; }
  .cards { display: flex; flex-direction: column; gap: 12px; }
  .record-card { background: var(--card); border: 1.5px solid var(--border); border-radius: 10px; padding: 18px 20px; display: flex; align-items: center; gap: 16px; transition: box-shadow .15s; }
  .record-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
  .record-card.done { opacity: .6; border-style: dashed; }
  .record-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--ink); color: var(--gold); font-family: 'Bebas Neue',sans-serif; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .record-info { flex: 1; min-width: 0; }
  .record-name { font-weight: 600; font-size: 15px; }
  .record-meta { font-size: 12px; color: var(--muted); margin-top: 3px; display: flex; gap: 12px; flex-wrap: wrap; }
  .badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
  .badge-pending { background: #fff3cd; color: #856404; }
  .badge-done { background: #d4edda; color: #155724; }
  .badge-lead { background: #e8d5f5; color: #5a2d82; }
  .record-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn .15s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal { background: var(--card); border-radius: 14px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.25); animation: slideUp .2s ease; }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .modal-header { padding: 24px 28px 20px; border-bottom: 1.5px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .modal-title { font-family: 'Bebas Neue',sans-serif; font-size: 28px; letter-spacing: .04em; line-height: 1; }
  .modal-subtitle { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .modal-body { padding: 24px 28px; }
  .modal-footer { padding: 16px 28px 24px; display: flex; gap: 10px; justify-content: flex-end; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-group.full { grid-column: 1 / -1; }
  label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); }
  input, select, textarea { padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 7px; font-family: 'DM Sans',sans-serif; font-size: 14px; background: #fff; color: var(--ink); transition: border .15s; width: 100%; }
  input:focus, select:focus, textarea:focus { outline: none; border-color: var(--red); }
  textarea { resize: vertical; min-height: 70px; }
  .tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--border); border-radius: 8px; padding: 3px; width: fit-content; flex-wrap: wrap; }
  .tab { padding: 7px 18px; border-radius: 6px; border: none; font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; background: transparent; color: var(--muted); transition: all .15s; }
  .tab.active { background: var(--card); color: var(--ink); box-shadow: 0 1px 4px rgba(0,0,0,.1); }
  .empty { text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: .3; }
  .empty h3 { font-size: 18px; margin-bottom: 6px; }
  .price-row { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
  .price-big { font-family: 'Bebas Neue',sans-serif; font-size: 22px; color: var(--success); }
  .price-abono { font-size: 12px; color: var(--muted); }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; }
  .detail-item { background: #fff; border: 1.5px solid var(--border); border-radius: 8px; padding: 12px 14px; }
  .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: 4px; }
  .detail-value { font-size: 15px; font-weight: 500; }
  .info-banner { background: #f0f4ff; border: 1.5px solid #c0cff5; border-radius: 8px; padding: 10px 14px; margin-bottom: 18px; font-size: 13px; color: #2a3a7a; line-height: 1.5; }
  .section-label { grid-column: 1/-1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--red); margin-bottom: -6px; }
  .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 16px; color: var(--muted); }
  .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--red); border-radius: 50%; animation: spin .7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .toast { position: fixed; bottom: 24px; right: 24px; background: var(--ink); color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; z-index: 999; animation: slideUp .2s ease; box-shadow: 0 4px 20px rgba(0,0,0,.3); }
  .toast.error { background: var(--red); }
  .wa-textarea { width: 100%; padding: 12px; border: 1.5px solid var(--border); border-radius: 8px; font-family: 'DM Sans',sans-serif; font-size: 14px; min-height: 120px; resize: vertical; }
  .wa-textarea:focus { outline: none; border-color: #25d366; }
  .wa-contact { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #fff; border: 1.5px solid var(--border); border-radius: 8px; margin-bottom: 8px; }
  .wa-contact-name { font-weight: 500; font-size: 14px; }
  .wa-contact-phone { font-size: 12px; color: var(--muted); }
  @media (max-width: 700px) {
    .sidebar { width: 60px; }
    .sidebar-logo, .nav-btn span, .sidebar-bottom { display: none; }
    .nav-btn { padding: 14px; justify-content: center; }
    .main { padding: 20px 16px; }
    .stats { grid-template-columns: 1fr 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .record-actions { flex-direction: column; align-items: flex-end; }
  }
`;

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return <div className={`toast ${type==="error"?"error":""}`}>{msg}</div>;
}

// ── App ───────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [citas, setCitas] = useState([]);
  const [asesorias, setAsesorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [waModal, setWaModal] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg, type="ok") => setToast({ msg, type });

  const fetchAll = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([db.get("citas"), db.get("asesorias")]);
      setCitas(c);
      setAsesorias(a);
    } catch (e) {
      notify("Error conectando con la base de datos", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── CITAS ────────────────────────────────────────────────────────
  const addCita = async (data) => {
    setSaving(true);
    try {
      const row = await db.insert("citas", {
        nombre: data.nombre, telefono: data.telefono, fecha: data.fecha,
        diseño: data.diseño, parte_del_cuerpo: data.parteDelCuerpo,
        medidas: data.medidas, precio: data.precio || null, abono: data.abono || null,
        notas: data.notas, status: "pending",
      });
      setCitas(prev => [row, ...prev]);
      notify("Cita guardada ✓");
    } catch { notify("Error guardando cita", "error"); } finally { setSaving(false); }
  };

  const completeCita = async (id) => {
    try {
      await db.update("citas", id, { status: "done" });
      setCitas(prev => prev.map(c => c.id === id ? { ...c, status: "done" } : c));
      notify("Cita marcada como realizada ✓");
    } catch { notify("Error actualizando", "error"); }
  };

  const deleteCita = async (id) => {
    if (!window.confirm("¿Eliminar esta cita?")) return;
    try {
      await db.delete("citas", id);
      setCitas(prev => prev.filter(c => c.id !== id));
      notify("Cita eliminada");
    } catch { notify("Error eliminando", "error"); }
  };

  // ── ASESORÍAS ────────────────────────────────────────────────────
  const addAsesoria = async (data) => {
    setSaving(true);
    try {
      const row = await db.insert("asesorias", {
        nombre: data.nombre, telefono: data.telefono, fecha: data.fecha,
        hora: data.hora || null, diseño: data.diseño, notas: data.notas, status: "asesoria",
      });
      setAsesorias(prev => [row, ...prev]);
      notify("Asesoría guardada ✓");
    } catch { notify("Error guardando asesoría", "error"); } finally { setSaving(false); }
  };

  const deleteAsesoria = async (id) => {
    if (!window.confirm("¿Eliminar esta asesoría?")) return;
    try {
      await db.delete("asesorias", id);
      setAsesorias(prev => prev.filter(a => a.id !== id));
      notify("Asesoría eliminada");
    } catch { notify("Error eliminando", "error"); }
  };

  const convertirEnLead = async (id) => {
    try {
      await db.update("asesorias", id, { status: "lead" });
      setAsesorias(prev => prev.map(a => a.id === id ? { ...a, status: "lead" } : a));
      notify("Marcado como Lead ✓");
    } catch { notify("Error actualizando", "error"); }
  };

  const handleConvertirACita = async (citaData) => {
    setSaving(true);
    try {
      await db.update("asesorias", convertLead.id, { status: "client" });
      setAsesorias(prev => prev.map(a => a.id === convertLead.id ? { ...a, status: "client" } : a));
      const row = await db.insert("citas", {
        nombre: citaData.nombre, telefono: citaData.telefono, fecha: citaData.fecha,
        diseño: citaData.diseño, parte_del_cuerpo: citaData.parteDelCuerpo,
        medidas: citaData.medidas, precio: citaData.precio || null, abono: citaData.abono || null,
        notas: citaData.notas, status: "pending",
      });
      setCitas(prev => [row, ...prev]);
      setConvertLead(null);
      notify("¡Cita agendada y lead convertido ✓");
    } catch { notify("Error al convertir", "error"); } finally { setSaving(false); }
  };

  // ── Derived ──────────────────────────────────────────────────────
  const pendingCitas     = citas.filter(c => c.status === "pending");
  const doneCitas        = citas.filter(c => c.status === "done");
  const leads            = asesorias.filter(a => a.status === "lead");
  const pendingAsesorias = asesorias.filter(a => a.status === "asesoria");

  const nav = [
    { id: "dashboard", label: "Dashboard",  icon: "needle" },
    { id: "citas",     label: "Citas",      icon: "calendar" },
    { id: "asesorias", label: "Asesorías",  icon: "user" },
    { id: "clientes",  label: "Clientes",   icon: "check" },
    { id: "leads",     label: "Leads",      icon: "lead" },
  ];

  // ── Normaliza campos snake_case → camelCase para UI ──────────────
  const normCita = (c) => ({ ...c, parteDelCuerpo: c.parte_del_cuerpo, diseño: c.diseño });

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="loading-screen">
        <div className="spinner" />
        <div>Cargando datos...</div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">🖋 INK<span>Tattoo Studio</span></div>
          <nav className="nav">
            {nav.map(n => (
              <button key={n.id} className={`nav-btn ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                <Icon d={icons[n.icon]} size={16} />
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button className="btn btn-ghost btn-sm" style={{width:"100%"}} onClick={fetchAll}>
              <Icon d={icons.refresh} size={13}/> Sincronizar
            </button>
          </div>
        </aside>

        <main className="main">
          {page === "dashboard" && <Dashboard pendingCitas={pendingCitas} doneCitas={doneCitas} leads={leads} pendingAsesorias={pendingAsesorias} citas={citas} setPage={setPage} />}
          {page === "citas"     && <CitasPage citas={citas.map(normCita)} onAdd={() => setModal("cita")} onComplete={completeCita} onDelete={deleteCita} onView={(item) => setViewItem({ type: "cita", data: normCita(item) })} onWA={(item) => setWaModal({type:"individual",item})} saving={saving} />}
          {page === "asesorias" && <AsesoriasPage asesorias={asesorias} onAdd={() => setModal("asesoria")} onDelete={deleteAsesoria} onView={(item) => setViewItem({ type: "asesoria", data: item })} onConvert={(a) => setConvertLead(a)} onMarkLead={convertirEnLead} onWA={(item) => setWaModal({type:"individual",item})} onWAMasivo={(lista) => setWaModal({type:"masivo",lista})} saving={saving} />}
          {page === "clientes"  && <ClientesPage clientes={doneCitas.map(normCita)} onWA={(item) => setWaModal({type:"individual",item})} onWAMasivo={(lista) => setWaModal({type:"masivo",lista})} />}
          {page === "leads"     && <LeadsPage leads={leads} onConvert={(a) => setConvertLead(a)} onWA={(item) => setWaModal({type:"individual",item})} onWAMasivo={(lista) => setWaModal({type:"masivo",lista})} />}
        </main>
      </div>

      {modal === "cita"     && <CitaModal     onClose={() => setModal(null)} onSave={(d) => { addCita(d); setModal(null); }} saving={saving} />}
      {modal === "asesoria" && <AsesoriaModal onClose={() => setModal(null)} onSave={(d) => { addAsesoria(d); setModal(null); }} saving={saving} />}
      {viewItem    && <DetailModal item={viewItem} onClose={() => setViewItem(null)} />}
      {convertLead && <ConvertirACitaModal asesoria={convertLead} onClose={() => setConvertLead(null)} onSave={handleConvertirACita} saving={saving} />}
      {waModal     && <WhatsAppModal modal={waModal} onClose={() => setWaModal(null)} />}
      {toast       && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────
function Dashboard({ pendingCitas, doneCitas, leads, pendingAsesorias, citas, setPage }) {
  const totalIngresos = doneCitas.reduce((s, c) => s + Number(c.precio || 0), 0);
  const abonos = citas.reduce((s, c) => s + Number(c.abono || 0), 0);
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Dashboard</div><div className="page-sub">Resumen de tu estudio</div></div>
      </div>
      <div className="stats">
        <div className="stat-card"><div className="stat-value">{pendingCitas.length}</div><div className="stat-label">Citas pendientes</div></div>
        <div className="stat-card"><div className="stat-value">{pendingAsesorias.length}</div><div className="stat-label">Asesorías activas</div></div>
        <div className="stat-card"><div className="stat-value">{leads.length}</div><div className="stat-label">Leads activos</div></div>
        <div className="stat-card"><div className="stat-value">{doneCitas.length}</div><div className="stat-label">Tattoos realizados</div></div>
        <div className="stat-card"><div className="stat-value" style={{color:"var(--success)"}}>{fmt(totalIngresos)}</div><div className="stat-label">Ingresos totales</div></div>
        <div className="stat-card"><div className="stat-value" style={{color:"var(--gold)"}}>{fmt(abonos)}</div><div className="stat-label">Abonos recibidos</div></div>
      </div>
      <div className="page-header" style={{marginBottom:12,marginTop:4}}>
        <div className="page-title" style={{fontSize:26}}>Próximas citas</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage("citas")}>Ver todas</button>
      </div>
      <div className="cards">
        {pendingCitas.length === 0 && <div className="empty"><div>No hay citas pendientes 🎉</div></div>}
        {pendingCitas.slice(0,3).map(c => (
          <div key={c.id} className="record-card">
            <div className="record-avatar">{initials(c.nombre)}</div>
            <div className="record-info">
              <div className="record-name">{c.nombre}</div>
              <div className="record-meta"><span>📅 {fmtDate(c.fecha)}</span><span>🎨 {c.diseño}</span><span style={{color:"var(--success)",fontWeight:600}}>{fmt(c.precio)}</span></div>
            </div>
            <span className="badge badge-pending">Pendiente</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Citas Page ────────────────────────────────────────────────────
function CitasPage({ citas, onAdd, onComplete, onDelete, onView, onWA, saving }) {
  const [tab, setTab] = useState("pending");
  const filtered = citas.filter(c => tab === "pending" ? c.status === "pending" : c.status === "done");
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Citas de Tatuaje</div><div className="page-sub">{citas.length} registradas</div></div>
        <button className="btn btn-primary" onClick={onAdd} disabled={saving}><Icon d={icons.plus} size={15}/> Nueva cita</button>
      </div>
      <div className="tabs">
        <button className={`tab ${tab==="pending"?"active":""}`} onClick={() => setTab("pending")}>Pendientes ({citas.filter(c=>c.status==="pending").length})</button>
        <button className={`tab ${tab==="done"?"active":""}`} onClick={() => setTab("done")}>Realizadas ({citas.filter(c=>c.status==="done").length})</button>
      </div>
      <div className="cards">
        {filtered.length === 0 && <div className="empty"><div className="empty-icon">🖋</div><h3>Sin citas aquí</h3></div>}
        {filtered.map(c => (
          <div key={c.id} className={`record-card ${c.status==="done"?"done":""}`}>
            <div className="record-avatar">{initials(c.nombre)}</div>
            <div className="record-info">
              <div className="record-name">{c.nombre}</div>
              <div className="record-meta">
                <span>📅 {fmtDate(c.fecha)}</span>
                {c.diseño && <span>🎨 {c.diseño}</span>}
                {c.parteDelCuerpo && <span>📍 {c.parteDelCuerpo}</span>}
                {c.telefono && <span>📱 {c.telefono}</span>}
              </div>
              <div className="price-row">
                <span className="price-big">{fmt(c.precio)}</span>
                {c.abono > 0 && <span className="price-abono">Abono: {fmt(c.abono)}</span>}
              </div>
            </div>
            <div className="record-actions">
              <span className={`badge ${c.status==="done"?"badge-done":"badge-pending"}`}>{c.status==="done"?"Realizada":"Pendiente"}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => onView(c)}><Icon d={icons.eye} size={14}/></button>
              {c.telefono && <button className="btn btn-wa btn-sm" onClick={() => onWA(c)}>💬</button>}
              {c.status==="pending" && <button className="btn btn-success btn-sm" onClick={() => onComplete(c.id)}><Icon d={icons.check} size={13}/> Listo</button>}
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(c.id)}><Icon d={icons.trash} size={13}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Asesorías Page ────────────────────────────────────────────────
function AsesoriasPage({ asesorias, onAdd, onDelete, onView, onConvert, onMarkLead, onWA, onWAMasivo, saving }) {
  const [tab, setTab] = useState("asesoria");
  const filtered = asesorias.filter(a => a.status === tab);
  const count = (s) => asesorias.filter(a => a.status === s).length;
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Asesorías</div><div className="page-sub">{asesorias.length} registradas</div></div>
        <div className="btn-row">
          <button className="btn btn-wa-outline btn-sm" onClick={() => onWAMasivo(asesorias.filter(a=>a.status==="lead" && a.telefono))}>💬 WA masivo leads</button>
          <button className="btn btn-primary" onClick={onAdd} disabled={saving}><Icon d={icons.plus} size={15}/> Nueva asesoría</button>
        </div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab==="asesoria"?"active":""}`} onClick={() => setTab("asesoria")}>Asesorías ({count("asesoria")})</button>
        <button className={`tab ${tab==="lead"?"active":""}`} onClick={() => setTab("lead")}>Leads ({count("lead")})</button>
        <button className={`tab ${tab==="client"?"active":""}`} onClick={() => setTab("client")}>Con cita ({count("client")})</button>
      </div>
      <div className="cards">
        {filtered.length === 0 && <div className="empty"><div className="empty-icon">💬</div><h3>Sin registros aquí</h3></div>}
        {filtered.map(a => (
          <div key={a.id} className={`record-card ${a.status==="client"?"done":""}`}>
            <div className="record-avatar" style={{background: a.status==="client"?"var(--success)":a.status==="lead"?"#b45309":"#4a1a7a"}}>{initials(a.nombre)}</div>
            <div className="record-info">
              <div className="record-name">{a.nombre}</div>
              <div className="record-meta">
                <span>📅 {fmtDate(a.fecha)}</span>
                {a.hora && <span>🕐 {a.hora}</span>}
                {a.diseño && <span>🎨 {a.diseño}</span>}
                {a.telefono && <span>📱 {a.telefono}</span>}
              </div>
            </div>
            <div className="record-actions">
              <span className={`badge ${a.status==="client"?"badge-done":a.status==="lead"?"badge-pending":"badge-lead"}`}>
                {a.status==="client"?"Con cita":a.status==="lead"?"Lead":"Asesoría"}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => onView(a)}><Icon d={icons.eye} size={14}/></button>
              {a.telefono && <button className="btn btn-wa btn-sm" onClick={() => onWA(a)}>💬</button>}
              {a.status === "asesoria" && (<>
                <button className="btn btn-convert btn-sm" onClick={() => onConvert(a)}><Icon d={icons.convert} size={13}/> Agendar cita</button>
                <button className="btn btn-ghost btn-sm" style={{borderColor:"#b45309",color:"#b45309"}} onClick={() => onMarkLead(a.id)}>🎯 Lead</button>
              </>)}
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(a.id)}><Icon d={icons.trash} size={13}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Clientes Page ─────────────────────────────────────────────────
function ClientesPage({ clientes, onWA, onWAMasivo }) {
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Base de Clientes</div><div className="page-sub">Clientes con tatuaje realizado</div></div>
        {clientes.length > 0 && <button className="btn btn-wa-outline btn-sm" onClick={() => onWAMasivo(clientes.filter(c=>c.telefono))}>💬 WA masivo clientes</button>}
      </div>
      <div className="cards">
        {clientes.length === 0 && <div className="empty"><div className="empty-icon">👥</div><h3>Aún no hay clientes</h3><p>Cuando marques una cita como realizada aparecerá aquí</p></div>}
        {clientes.map(c => (
          <div key={c.id} className="record-card">
            <div className="record-avatar" style={{background:"var(--success)"}}>{initials(c.nombre)}</div>
            <div className="record-info">
              <div className="record-name">{c.nombre}</div>
              <div className="record-meta">
                <span>📅 {fmtDate(c.fecha)}</span>
                {c.diseño && <span>🎨 {c.diseño}</span>}
                {c.parteDelCuerpo && <span>📍 {c.parteDelCuerpo}</span>}
                {c.telefono && <span>📱 {c.telefono}</span>}
                <span style={{color:"var(--success)",fontWeight:600}}>{fmt(c.precio)}</span>
              </div>
            </div>
            <div className="record-actions">
              {c.telefono && <button className="btn btn-wa btn-sm" onClick={() => onWA(c)}>💬</button>}
              <span className="badge badge-done">✓ Cliente</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Leads Page ────────────────────────────────────────────────────
function LeadsPage({ leads, onConvert, onWA, onWAMasivo }) {
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Leads</div><div className="page-sub">Personas interesadas — sin tatuar aún</div></div>
        {leads.length > 0 && <button className="btn btn-wa-outline btn-sm" onClick={() => onWAMasivo(leads.filter(l=>l.telefono))}>💬 WA masivo</button>}
      </div>
      <div className="cards">
        {leads.length === 0 && <div className="empty"><div className="empty-icon">🎯</div><h3>No hay leads activos</h3></div>}
        {leads.map(a => (
          <div key={a.id} className="record-card">
            <div className="record-avatar" style={{background:"#b45309"}}>{initials(a.nombre)}</div>
            <div className="record-info">
              <div className="record-name">{a.nombre}</div>
              <div className="record-meta">
                <span>📅 {fmtDate(a.fecha)}</span>
                {a.hora && <span>🕐 {a.hora}</span>}
                {a.diseño && <span>🎨 {a.diseño}</span>}
                {a.telefono && <span>📱 {a.telefono}</span>}
              </div>
            </div>
            <div className="record-actions">
              <span className="badge badge-pending">Lead</span>
              {a.telefono && <button className="btn btn-wa btn-sm" onClick={() => onWA(a)}>💬</button>}
              <button className="btn btn-convert btn-sm" onClick={() => onConvert(a)}><Icon d={icons.convert} size={13}/> Agendar cita</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WhatsApp Modal ────────────────────────────────────────────────
function WhatsAppModal({ modal, onClose }) {
  const isIndividual = modal.type === "individual";
  const item = modal.item;
  const lista = modal.lista || [];

  const buildMsg = (it) => {
    const nombre = it?.nombre?.split(" ")[0] || "";
    const esCita = it?.fecha && (it?.parte_del_cuerpo || it?.parteDelCuerpo);
    if (esCita) {
      const saldo = (Number(it.precio||0) - Number(it.abono||0));
      return `Hola ${nombre} 👋, te confirmamos tu cita en el estudio:\n\n📅 *Fecha:* ${fmtDate(it.fecha)}\n🎨 *Diseño:* ${it.diseño || "-"}\n📍 *Parte del cuerpo:* ${it.parte_del_cuerpo || it.parteDelCuerpo || "-"}\n📐 *Tamaño:* ${it.medidas || "-"}\n💵 *Precio:* ${fmt(it.precio)}\n✅ *Abono:* ${fmt(it.abono)}\n💳 *Saldo pendiente:* ${fmt(saldo)}\n\n📋 *Políticas de cancelación:*\n• Cancela con mínimo 48 horas de anticipación para reagendar sin costo.\n• El abono no es reembolsable en caso de no presentarse.\n• Llega puntual a tu cita 🙏\n\n¡Nos vemos pronto! 🖋`;
    }
    return `Hola ${nombre} 👋, te escribo del estudio de tatuajes. ¿Cómo estás?`;
  };

  const [msg, setMsg] = useState(() => buildMsg(item));

  const openWA = (nombre, phone) => {
    const texto = isIndividual ? msg : msg.replace("{nombre}", nombre.split(" ")[0]);
    window.open(`https://wa.me/57${cleanPhone(phone)}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:480}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{isIndividual ? "Mensaje WhatsApp" : "Mensaje Masivo"}</div>
            <div className="modal-subtitle">{isIndividual ? item?.nombre : `${lista.length} contactos`}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon d={icons.close} size={14}/></button>
        </div>
        <div className="modal-body">
          <div className="form-group" style={{marginBottom:16}}>
            <label>Mensaje{!isIndividual && " (usa {nombre} para personalizar)"}</label>
            <textarea className="wa-textarea" value={msg} onChange={e => setMsg(e.target.value)} />
          </div>
          {isIndividual ? (
            <button className="btn btn-wa" style={{width:"100%"}} onClick={() => openWA(item.nombre, item.telefono)}>
              💬 Abrir WhatsApp con {item?.nombre?.split(" ")[0]}
            </button>
          ) : (
            <div>
              <div style={{marginBottom:10,fontSize:13,color:"var(--muted)"}}>Se abrirá WhatsApp uno por uno para cada contacto:</div>
              {lista.map((c, i) => (
                <div key={i} className="wa-contact">
                  <div>
                    <div className="wa-contact-name">{c.nombre}</div>
                    <div className="wa-contact-phone">{c.telefono}</div>
                  </div>
                  <button className="btn btn-wa btn-sm" onClick={() => openWA(c.nombre, c.telefono)}>💬 Enviar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal: Nueva Cita ─────────────────────────────────────────────
function CitaModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ nombre:"", telefono:"", fecha:"", diseño:"", parteDelCuerpo:"", medidas:"", precio:"", abono:"", notas:"" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    if (!form.fecha) return alert("La fecha es obligatoria");
    onSave(form);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Nueva Cita de Tatuaje</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon d={icons.close} size={14}/></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Nombre *</label><input value={form.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Ej. María García" /></div>
            <div className="form-group"><label>Teléfono / WhatsApp</label><input type="tel" value={form.telefono} onChange={e=>set("telefono",e.target.value)} placeholder="Ej. 3001234567" /></div>
            <div className="form-group"><label>Fecha *</label><input type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)} /></div>
            <div className="form-group"><label>Diseño / Estilo</label><input value={form.diseño} onChange={e=>set("diseño",e.target.value)} placeholder="Ej. Mandala, Flores" /></div>
            <div className="form-group"><label>Parte del cuerpo</label><input value={form.parteDelCuerpo} onChange={e=>set("parteDelCuerpo",e.target.value)} placeholder="Ej. Antebrazo" /></div>
            <div className="form-group"><label>Medidas (cm)</label><input value={form.medidas} onChange={e=>set("medidas",e.target.value)} placeholder="Ej. 10x15" /></div>
            <div className="form-group"><label>Precio total</label><input type="number" value={form.precio} onChange={e=>set("precio",e.target.value)} placeholder="0" /></div>
            <div className="form-group"><label>Abono</label><input type="number" value={form.abono} onChange={e=>set("abono",e.target.value)} placeholder="0" /></div>
            <div className="form-group full"><label>Notas</label><textarea value={form.notas} onChange={e=>set("notas",e.target.value)} placeholder="Referencias, alergias..." /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?"Guardando...":"Guardar cita"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Nueva Asesoría ─────────────────────────────────────────
function AsesoriaModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ nombre:"", telefono:"", fecha:"", hora:"", diseño:"", notas:"" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    if (!form.fecha) return alert("La fecha es obligatoria");
    onSave(form);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Nueva Asesoría</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon d={icons.close} size={14}/></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Nombre *</label><input value={form.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Nombre completo" /></div>
            <div className="form-group"><label>Teléfono / WhatsApp</label><input type="tel" value={form.telefono} onChange={e=>set("telefono",e.target.value)} placeholder="Ej. 3001234567" /></div>
            <div className="form-group"><label>Fecha *</label><input type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)} /></div>
            <div className="form-group"><label>Hora</label><input type="time" value={form.hora} onChange={e=>set("hora",e.target.value)} /></div>
            <div className="form-group full"><label>Diseño / Idea</label><input value={form.diseño} onChange={e=>set("diseño",e.target.value)} placeholder="Descripción del tatuaje" /></div>
            <div className="form-group full"><label>Notas</label><textarea value={form.notas} onChange={e=>set("notas",e.target.value)} placeholder="Referencias, preguntas..." /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?"Guardando...":"Guardar asesoría"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Convertir Asesoría → Cita ─────────────────────────────
function ConvertirACitaModal({ asesoria, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    nombre: asesoria.nombre || "", telefono: asesoria.telefono || "",
    fecha: "", diseño: asesoria.diseño || "", parteDelCuerpo: "",
    medidas: "", precio: "", abono: "", notas: asesoria.notas || "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    if (!form.fecha) return alert("La fecha de la cita es obligatoria");
    onSave(form);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Agendar Cita</div>
            <div className="modal-subtitle">Convirtiendo asesoría de <strong>{asesoria.nombre}</strong></div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon d={icons.close} size={14}/></button>
        </div>
        <div className="modal-body">
          <div className="info-banner">💡 Los campos prellenados vienen de la asesoría. Completa los datos faltantes.</div>
          <div className="form-grid">
            <div className="form-group"><label>Nombre</label><input value={form.nombre} onChange={e=>set("nombre",e.target.value)} /></div>
            <div className="form-group"><label>Teléfono</label><input type="tel" value={form.telefono} onChange={e=>set("telefono",e.target.value)} /></div>
            <div className="section-label">📅 Datos de la cita</div>
            <div className="form-group"><label>Fecha *</label><input type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)} /></div>
            <div className="form-group"><label>Diseño</label><input value={form.diseño} onChange={e=>set("diseño",e.target.value)} /></div>
            <div className="form-group"><label>Parte del cuerpo</label><input value={form.parteDelCuerpo} onChange={e=>set("parteDelCuerpo",e.target.value)} placeholder="Ej. Antebrazo" /></div>
            <div className="form-group"><label>Medidas (cm)</label><input value={form.medidas} onChange={e=>set("medidas",e.target.value)} placeholder="Ej. 10x15" /></div>
            <div className="section-label">💰 Datos económicos</div>
            <div className="form-group"><label>Precio total</label><input type="number" value={form.precio} onChange={e=>set("precio",e.target.value)} placeholder="0" /></div>
            <div className="form-group"><label>Abono</label><input type="number" value={form.abono} onChange={e=>set("abono",e.target.value)} placeholder="0" /></div>
            <div className="form-group full"><label>Notas</label><textarea value={form.notas} onChange={e=>set("notas",e.target.value)} /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?"Guardando...":"Confirmar cita"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Detalle ────────────────────────────────────────────────
function DetailModal({ item, onClose }) {
  const isCita = item.type === "cita";
  const d = item.data;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{d.nombre}</div>
            <span className={`badge ${d.status==="done"||d.status==="client"?"badge-done":isCita?"badge-pending":"badge-lead"}`}>
              {d.status==="done"?"Realizada":d.status==="client"?"Con cita":d.status==="lead"?"Lead":isCita?"Pendiente":"Asesoría"}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon d={icons.close} size={14}/></button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Fecha</div><div className="detail-value">{fmtDate(d.fecha)}</div></div>
            {d.telefono && (
              <div className="detail-item">
                <div className="detail-label">Teléfono</div>
                <div className="detail-value">
                  <a href={`https://wa.me/57${cleanPhone(d.telefono)}`} target="_blank" rel="noreferrer" style={{color:"#25d366",textDecoration:"none"}}>📱 {d.telefono}</a>
                </div>
              </div>
            )}
            {isCita ? <>
              <div className="detail-item"><div className="detail-label">Diseño</div><div className="detail-value">{d.diseño||"-"}</div></div>
              <div className="detail-item"><div className="detail-label">Parte del cuerpo</div><div className="detail-value">{d.parteDelCuerpo||"-"}</div></div>
              <div className="detail-item"><div className="detail-label">Medidas</div><div className="detail-value">{d.medidas||"-"}</div></div>
              <div className="detail-item"><div className="detail-label">Precio</div><div className="detail-value" style={{color:"var(--success)"}}>{fmt(d.precio)}</div></div>
              <div className="detail-item"><div className="detail-label">Abono</div><div className="detail-value" style={{color:"var(--gold)"}}>{fmt(d.abono)}</div></div>
            </> : <>
              <div className="detail-item"><div className="detail-label">Hora</div><div className="detail-value">{d.hora||"-"}</div></div>
              <div className="detail-item" style={{gridColumn:"1/-1"}}><div className="detail-label">Diseño / Idea</div><div className="detail-value">{d.diseño||"-"}</div></div>
            </>}
            {d.notas && <div className="detail-item" style={{gridColumn:"1/-1"}}><div className="detail-label">Notas</div><div className="detail-value">{d.notas}</div></div>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}