// Capa de acceso a Supabase. Todo lo que habla con el servidor está aquí.
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const MSG = [
  [/Invalid login credentials/i, "Correo o contraseña incorrectos."],
  [/Email not confirmed/i, "Debes confirmar tu correo. Revisa tu bandeja (y el spam)."],
  [/User already registered/i, "Ya existe una cuenta con ese correo."],
  [/Password should be at least/i, "La contraseña es demasiado corta."],
  [/rate limit|too many/i, "Demasiados intentos. Espera unos minutos."],
  [/Database error saving new user/i, "No se pudo crear la cuenta. Revisa el nick, el ID de FC 27 y la plataforma."],
  [/duplicate key|already exists|unique/i, "Ese nombre ya está en uso."],
  [/violates row-level security|permission denied/i, "No tienes permiso para hacer eso."],
  [/Failed to fetch|NetworkError|network/i, "Sin conexión con el servidor. Inténtalo de nuevo."],
];
export function friendly(m) {
  const t = String(m || "");
  for (const [re, out] of MSG) if (re.test(t)) return out;
  return t || "Ha ocurrido un error.";
}
function ok(r) {
  if (r.error) throw new Error(friendly(r.error.message));
  return r.data;
}
const rpc = (name, args) => sb.rpc(name, args).then(ok);

export const api = {
  /* ---- Cuenta ---- */
  async getSession() { const { data } = await sb.auth.getSession(); return data.session; },
  onAuth(cb) { sb.auth.onAuthStateChange((ev, s) => { setTimeout(() => cb(ev, s), 0); }); },
  async signUp(email, password, meta) {
    const r = await sb.auth.signUp({ email, password, options: { data: meta, emailRedirectTo: location.origin + location.pathname } });
    if (r.error) throw new Error(friendly(r.error.message));
    return r.data;
  },
  async signIn(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
  async signOut() { await sb.auth.signOut(); },
  async resetPassword(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })); },
  async setPassword(pw) { ok(await sb.auth.updateUser({ password: pw })); },
  nickAvailable: (n) => rpc("nick_available", { p_nick: n }),

  /* ---- Lectura ---- */
  async profile(uid) { return ok(await sb.from("profiles").select("id,nick,role,banned").eq("id", uid).maybeSingle()); },
  async myIds(uid) { return ok(await sb.from("player_ids").select("fc_id,platform").eq("user_id", uid).maybeSingle()); },
  async updateIds(uid, fc_id, platform) { ok(await sb.from("player_ids").update({ fc_id, platform }).eq("user_id", uid)); },
  async teams() { return ok(await sb.from("teams").select("*, leader:profiles(nick)").order("xp", { ascending: false }).order("wins", { ascending: false }).limit(500)); },
  async shop() { return ok(await sb.from("shop_items").select("*").eq("active", true).order("cost")); },
  async publicMatches() {
    const live = ok(await sb.from("matches").select("*").in("status", ["open", "accepted", "disputed"]).order("scheduled_at").limit(300));
    const closed = ok(await sb.from("matches").select("*").eq("status", "closed").order("closed_at", { ascending: false }).limit(30));
    return { live, closed };
  },
  async myMatches(uid) {
    return ok(await sb.from("matches").select("*").or(`owner_id.eq.${uid},acceptor_id.eq.${uid}`).neq("status", "cancelled").order("scheduled_at", { ascending: false }).limit(60));
  },
  async reportsFor(ids) { return ids.length ? ok(await sb.from("match_reports").select("*").in("match_id", ids)) : []; },
  async nicks(ids) { return ids.length ? ok(await sb.from("profiles").select("id,nick").in("id", ids)) : []; },
  async idsFor(ids) { return ids.length ? ok(await sb.from("player_ids").select("user_id,fc_id,platform").in("user_id", ids)) : []; },
  async messages(matchId) { return ok(await sb.from("match_messages").select("*").eq("match_id", matchId).order("id").limit(200)); },
  async sendMessage(matchId, uid, body) { ok(await sb.from("match_messages").insert({ match_id: matchId, sender_id: uid, body })); },

  /* ---- Acciones de jugador (reglas aplicadas en el servidor) ---- */
  createChallenge: (iso) => rpc("create_challenge", { p_time: iso }),
  cancelChallenge: (id) => rpc("cancel_challenge", { p_id: id }),
  acceptChallenge: (id) => rpc("accept_challenge", { p_id: id }),
  report: (id, result, url) => rpc("report_result", { p_id: id, p_result: result, p_url: url || null }),

  /* ---- Staff y administración ---- */
  staffResolve: (id, winner) => rpc("staff_resolve", { p_id: id, p_winner: winner }),
  async toDecide() {
    const cutoff = new Date(Date.now() - 2 * 3600e3).toISOString();
    const a = ok(await sb.from("matches").select("*").eq("status", "disputed").order("scheduled_at").limit(100));
    const b = ok(await sb.from("matches").select("*").eq("status", "accepted").lt("scheduled_at", cutoff).order("scheduled_at").limit(100));
    return [...a, ...b];
  },
  async recentClosed() { return ok(await sb.from("matches").select("*").eq("status", "closed").order("closed_at", { ascending: false }).limit(20)); },
  async searchProfiles(q) {
    let req = sb.from("profiles").select("id,nick,role,banned,created_at").order("created_at", { ascending: false }).limit(50);
    if (q) req = req.ilike("nick", `%${q.replace(/[%_]/g, "")}%`);
    return ok(await req);
  },
  setRole: (id, role) => rpc("admin_set_role", { p_user: id, p_role: role }),
  ban: (id, flag) => rpc("admin_ban", { p_user: id, p_flag: flag }),
  setLeader: (team, user) => rpc("admin_set_leader", { p_team: team, p_user: user || null }),
  deleteTeam: (team) => rpc("admin_delete_team", { p_team: team }),
  buy: (team, item) => rpc("admin_buy", { p_team: team, p_item: item }),
  recompute: () => rpc("admin_recompute", {}),
  voidMatch: (id) => rpc("admin_void_match", { p_id: id }),
  async createTeam(name, color) { return ok(await sb.from("teams").insert({ name, color }).select("id").single()); },
  async updateTeam(id, patch) { ok(await sb.from("teams").update(patch).eq("id", id)); },
  async uploadImage(teamId, kind, blob) {
    const ext = blob.type === "image/png" ? "png" : "webp";
    const path = `${teamId}/${kind}-${Date.now()}.${ext}`;
    ok(await sb.storage.from("team-images").upload(path, blob, { contentType: blob.type || "image/webp", upsert: true }));
    return sb.storage.from("team-images").getPublicUrl(path).data.publicUrl;
  },

  /* ---- Tiempo real ---- */
  watchTables(cb) {
    const ch = sb.channel("arena-changes");
    ["matches", "teams"].forEach((t) => ch.on("postgres_changes", { event: "*", schema: "public", table: t }, cb));
    ch.subscribe();
  },
  watchChat(matchId, cb) {
    const ch = sb.channel("chat-" + matchId).on("postgres_changes", { event: "INSERT", schema: "public", table: "match_messages", filter: `match_id=eq.${matchId}` }, cb);
    ch.subscribe();
    return () => sb.removeChannel(ch);
  },
};
