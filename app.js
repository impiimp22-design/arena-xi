import { api } from "./api.js";
import { SUPABASE_URL, CONTACT_EMAIL } from "./config.js";

/* ============ Utilidades ============ */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fdate = (iso) => new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
const safeUrl = (u) => (/^https?:\/\/[^\s"'<>]{3,255}$/i.test(u || "") ? u : "");
const IMG_BASE = SUPABASE_URL + "/storage/v1/object/public/";
const safeImg = (u) => (typeof u === "string" && u.startsWith(IMG_BASE) && !/["'<>\s()]/.test(u) ? u : "");
const note = (t) => `<p class="meta">${t}</p>`;
let flT = null;
function flash(t) { const el = $("flash"); el.textContent = t; el.hidden = false; clearTimeout(flT); flT = setTimeout(() => (el.hidden = true), 5000); }

/* ============ Contenido ============ */
const RU = [
  ["Reglas de los retos", "Cada jugador con equipo puede crear un reto eligiendo la hora del partido, con un máximo de 3 retos abiertos a la vez, y cancelarlo mientras nadie lo haya aceptado. Cualquier jugador de otro equipo puede aceptarlo sin que el tablero muestre quién lo acepta; si dos aceptan a la vez, vale el primero. Al aceptarse se abre un chat entre los dos jugadores, donde cada uno ve el nick y el ID de FC 27 de su rival; es solo para organizar la partida, así que no compartas datos personales. A la hora del partido, cada jugador reporta si ha ganado o perdido y puede añadir un enlace (vídeo o captura) como prueba. Si los dos reportes coinciden, el resultado queda confirmado; si los dos dicen que han ganado, los dos que han perdido o uno no reporta, decide el staff con las pruebas y su decisión es definitiva. Hasta 449 XP, ganar da 20 XP y perder quita 7; de 450 a 749 XP, ganar da 15 y perder quita 7; desde 750 XP, ganar da 10 y perder quita 5. La XP no baja de 0 y es del equipo. Cada partido cerrado da 10 denarios al equipo, ganes o pierdas, y se gastan en la Tienda sin afectar a la XP ni al rango; el objeto Doble XP cuesta 1000 denarios y duplica la XP de las victorias en los 5 siguientes partidos del equipo (las derrotas no cambian, cada partido cerrado gasta un uso y las compras se acumulan). El rango depende de la XP del equipo: todos empiezan como Plebeyo y, entre los Imperator, solo los cinco con más XP forman el Top 5."],
  ["Reglas de juego", "Los equipos no necesitan registrar ningún jugador. La altura máxima permitida es de 1,82 m para los jugadores de campo, 1,87 m para los defensas y 1,92 m para el portero. Están prohibidos los potenciadores. Si la partida se cae, se juega media parte. Cada equipo puede reiniciar el partido una sola vez, y si se ha encajado un gol antes de abandonar la partida, ese gol cuenta."],
];
const ROM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const PAGES = [["", "Inicio"], ["ranking", "Ranking"], ["retos", "Retos"], ["equipos", "Equipos"], ["torneos", "Torneos"], ["reglas", "Reglas"], ["tienda", "Tienda"]];
const GATES = [["ranking", "Ranking", "Quién domina la liga"], ["retos", "Retos", "Partidos entre equipos"], ["equipos", "Equipos", "Las legiones en competición"], ["torneos", "Torneos", "Copas y ligas"], ["reglas", "Reglas", "Normas y rangos"], ["tienda", "Tienda", "Gasta tus denarios"]];
const RK = [{ n: "Plebeyo", x: 0, c: "#7A7266" }, { n: "Recluta", x: 150, c: "#8A5A3C" }, { n: "Legionario", x: 300, c: "#7F8A94" }, { n: "Veterano", x: 450, c: "#4E7D5B" }, { n: "Optio", x: 600, c: "#3E6C9E" }, { n: "Centurión", x: 750, c: "#7A4C93" }, { n: "Tribuno", x: 850, c: "#A33A30" }, { n: "Imperator", x: 1000, c: "#C9A227" }];
const PLAT = ["PlayStation", "Xbox", "PC"];
const BGS = { "": "inicio", ranking: "ranking", retos: "retos", equipos: "equipos", torneos: "torneos", reglas: "reglas", tienda: "tienda" };

/* ============ Cascos ============ */
let HID = 0;
const CT = [0, 0, 0, 0, 0, -4, -14, -24], CB = [0, 0, 0, 0, 0, 10, 6, 2];
function shade(h, a) { const n = parseInt(h.slice(1), 16), o = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => { v = a > 0 ? v + (255 - v) * a : v * (1 + a); return ("0" + Math.round(v).toString(16)).slice(-2); }); return "#" + o.join(""); }
function helmet(L, col, small) {
  const id = "hg" + (HID++), f = `fill="url(#${id})" stroke="#0A0908" stroke-width="1.6" stroke-linejoin="round"`;
  let s = `<svg class="hm${small ? " hs" : ""}" viewBox="0 -10 64 74" role="img" aria-label="${L ? "Casco de rango " + L : "Sin casco"}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(col, .3)}"/><stop offset="1" stop-color="${shade(col, -.4)}"/></linearGradient></defs>`;
  if (L === 0) return s + `<path d="M10 62 C10 46 20 40 32 40 C44 40 54 46 54 62Z" ${f}/><circle cx="32" cy="24" r="12" ${f}/></svg>`;
  if (L === 4) s += `<path d="M27 15 Q26 4 32 0 Q38 4 37 15Z" ${f}/>`;
  if (L >= 5) s += `<path d="M8 20 Q32 ${CT[L]} 56 20 L52 24 Q32 ${CB[L]} 12 24Z" ${f}/>`;
  if (L >= 7) s += `<path d="M6 30 Q4 46 18 60" fill="none" stroke="#C9A227" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="4 3"/><path d="M58 30 Q60 46 46 60" fill="none" stroke="#C9A227" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="4 3"/>`;
  s += `<path d="M12 40 L12 54 Q12 58 17 58 L24 58 L24 40Z" ${f}/><path d="M52 40 L52 54 Q52 58 47 58 L40 58 L40 40Z" ${f}/>`;
  s += `<path d="M12 40 C12 22 22 14 32 14 C42 14 52 22 52 40Z" ${f}/>`;
  s += `<path d="M17 36 C17 26 23 20 31 19" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>`;
  if (L >= 2) s += `<rect x="12" y="31" width="40" height="5" fill="#000" fill-opacity=".35"/>`;
  if (L >= 3) s += `<rect x="29" y="9" width="6" height="7" rx="1" ${f}/>`;
  if (L >= 6) s += `<circle cx="18" cy="50" r="1.8" fill="#E9E2D2"/><circle cx="46" cy="50" r="1.8" fill="#E9E2D2"/>`;
  if (L >= 7) s += `<circle cx="32" cy="25" r="2.6" fill="#C9A227"/>`;
  return s + "</svg>";
}
function rank(x) { let r = RK[0], l = 0; RK.forEach((k, j) => { if (x >= k.x) { r = k; l = j; } }); return { k: r, l }; }
const rkcell = (t) => { const r = rank(t.xp); return helmet(r.l, r.k.c, 1) + r.k.n; };

/* ============ Estado ============ */
const S = { session: null, uid: null, prof: null, ids: null, teams: [], shop: [], live: [], closed: [], mine: [], reports: {}, nicks: {}, rivalIds: {}, ready: false, error: "",
  tab: "login", pOpen: false, pmsg: "", pmsgErr: false, recovery: false, openChat: "", chat: {}, unwatch: null, shopTeam: "", armTeam: null, armDel: null,
  A: { decide: [], reports: {}, closed: [], profiles: [], q: "", teamImgs: {}, newLogo: null, newBanner: null } };
const role = () => (S.prof && !S.prof.banned ? S.prof.role : "player");
const isStaff = () => role() === "staff" || role() === "admin";
const isAdmin = () => role() === "admin";
const myTeam = () => (S.uid ? S.teams.find((t) => t.leader_id === S.uid) : null);
const teamById = (id) => S.teams.find((t) => t.id === id);
const teamName = (id) => (teamById(id) || { name: "Equipo" }).name;
const nickOf = (u) => S.nicks[u] || "Jugador";

/* ============ Carga de datos ============ */
async function loadPublic() {
  const [teams, shop, pm] = await Promise.all([api.teams(), api.shop(), api.publicMatches()]);
  S.teams = teams; S.shop = shop; S.live = pm.live; S.closed = pm.closed;
}
async function loadMine() {
  if (!S.uid) { S.mine = []; S.reports = {}; return; }
  S.mine = await api.myMatches(S.uid);
  const rep = await api.reportsFor(S.mine.map((m) => m.id));
  S.reports = {}; rep.forEach((r) => (S.reports[r.match_id] = S.reports[r.match_id] || []).push(r));
  const users = [...new Set(S.mine.flatMap((m) => [m.owner_id, m.acceptor_id]).filter(Boolean))];
  const [ns, ids] = await Promise.all([api.nicks(users), api.idsFor(users)]);
  ns.forEach((n) => (S.nicks[n.id] = n.nick)); ids.forEach((i) => (S.rivalIds[i.user_id] = i));
}
async function loadAdmin() {
  if (!isStaff()) return;
  const dec = await api.toDecide();
  S.A.decide = dec;
  const rep = await api.reportsFor(dec.map((m) => m.id));
  S.A.reports = {}; rep.forEach((r) => (S.A.reports[r.match_id] = S.A.reports[r.match_id] || []).push(r));
  const users = [...new Set(dec.flatMap((m) => [m.owner_id, m.acceptor_id]).filter(Boolean))];
  (await api.nicks(users)).forEach((n) => (S.nicks[n.id] = n.nick));
  if (isAdmin()) {
    S.A.closed = await api.recentClosed();
    S.A.profiles = await api.searchProfiles(S.A.q);
    S.A.profiles.forEach((p) => (S.nicks[p.id] = p.nick));
  }
}
let refT = null;
function scheduleRefresh() { clearTimeout(refT); refT = setTimeout(refresh, 400); }
async function refresh() {
  try {
    await loadPublic(); await loadMine();
    if (curPage() === "admin") await loadAdmin();
    S.error = ""; S.ready = true;
  } catch (e) { S.error = e.message || "No se pudo cargar la liga."; S.ready = true; }
  sched();
}
async function setUser(session) {
  S.session = session; S.uid = session ? session.user.id : null; S.prof = null; S.ids = null;
  if (S.uid) { try { S.prof = await api.profile(S.uid); S.ids = await api.myIds(S.uid); } catch (e) { /* se mostrará sin perfil */ } }
}

/* ============ Cuenta y perfil ============ */
function hdr() {
  const t = myTeam(), r = rank(t ? t.xp : 0), label = S.prof ? S.prof.nick : S.uid ? "Mi perfil" : "Entrar";
  $("pbtn").innerHTML = helmet(r.l, r.k.c, 1) + `<span>${esc(label)}</span>`;
  $("pbtn").setAttribute("aria-label", `Perfil: ${label}, ${r.k.n}`);
}
function setMsg(t, err) { S.pmsg = t; S.pmsgErr = !!err; const el = $("p-msg"); if (el) { el.textContent = t; el.className = "msg" + (err ? " err" : ""); } }
const pmsg = () => `<p class="msg${S.pmsgErr ? " err" : ""}" id="p-msg" role="status">${esc(S.pmsg)}</p>`;
function ppanel() {
  const el = $("ppanel"); el.hidden = !S.pOpen; $("pbtn").setAttribute("aria-expanded", S.pOpen ? "true" : "false");
  if (!S.pOpen) return;
  if (!S.ready) { el.innerHTML = note("Conectando con la liga..."); return; }
  if (S.recovery) {
    el.innerHTML = `<h3>Nueva contraseña</h3><form class="frm" id="newpw" novalidate><label for="np1">Contraseña nueva (mínimo 8 caracteres)<input id="np1" type="password" autocomplete="new-password" minlength="8"></label><div class="acts"><button class="btn" type="submit">Guardar contraseña</button></div>${pmsg()}</form>`;
    return;
  }
  if (!S.uid) {
    const login = S.tab === "login";
    el.innerHTML = `<div class="pdiv">${helmet(0, RK[0].c)}<div><h3>Plebeyo</h3><p>Entra o crea tu cuenta para jugar.</p></div></div>
<div class="acts" role="tablist"><button class="btn sm${login ? " on" : ""}" type="button" data-act="tab" data-t="login">Entrar</button><button class="btn sm${login ? "" : " on"}" type="button" data-act="tab" data-t="signup">Crear cuenta</button></div>
${login ? `<form class="frm" id="lform" novalidate style="margin-top:14px"><label for="l-mail">Correo<input id="l-mail" type="email" autocomplete="email" data-keep></label><label for="l-pw">Contraseña<input id="l-pw" type="password" autocomplete="current-password" data-keep></label><div class="acts"><button class="btn" type="submit">Entrar</button><button class="btn sm" type="button" data-act="forgot">He olvidado mi contraseña</button></div>${pmsg()}</form>`
    : `<form class="frm" id="sform" novalidate style="margin-top:14px"><label for="s-mail">Correo<input id="s-mail" type="email" autocomplete="email" data-keep></label><label for="s-pw">Contraseña (mínimo 8 caracteres)<input id="s-pw" type="password" autocomplete="new-password" data-keep></label><label for="s-nick">Nick (3 a 16: letras, números, . _ -)<input id="s-nick" maxlength="16" autocomplete="off" data-keep></label><label for="s-fc">ID de jugador en FC 27<input id="s-fc" maxlength="24" autocomplete="off" data-keep></label><label for="s-pl">Plataforma<select id="s-pl" data-keep>${PLAT.map((p) => `<option>${p}</option>`).join("")}</select></label><div class="acts"><button class="btn" type="submit" id="s-go">Crear cuenta</button></div>${pmsg()}<p class="msg">Recibirás un correo para confirmar tu cuenta. Tu nick y tu plataforma son visibles para los demás; tu correo no. Al crear tu cuenta aceptas la <a class="link" href="#privacidad">política de privacidad</a>.</p></form>`}`;
    return;
  }
  const t = myTeam(), x = t ? t.xp : 0, r = rank(x), m = S.prof, v = S.ids || { fc_id: "", platform: "PC" };
  el.innerHTML = `<div class="pdiv">${helmet(r.l, r.k.c)}<div><h3>${esc(m ? m.nick : "Mi perfil")}</h3><p>${r.k.n}${m && m.role !== "player" ? " · " + (m.role === "admin" ? "Administrador" : "Staff") : ""}</p><p>${t ? esc(t.name) + ", " + x + " XP" : "Sin equipo todavía. Lo asigna el organizador."}</p></div></div>
${m && m.banned ? `<p class="msg err">Tu cuenta está bloqueada. Contacta con el staff.</p>` : ""}
<form class="frm" id="pform" novalidate><label for="p-fc">ID de jugador en FC 27<input id="p-fc" maxlength="24" autocomplete="off" value="${esc(v.fc_id)}"></label><label for="p-pl">Plataforma<select id="p-pl">${PLAT.map((p) => `<option${p === v.platform ? " selected" : ""}>${p}</option>`).join("")}</select></label><div class="acts"><button class="btn" type="submit">Guardar cambios</button><button class="btn dng" type="button" data-act="logout">Cerrar sesión</button></div>${pmsg()}</form>
${isStaff() ? `<p style="margin:14px 0 0"><a class="link" href="#admin">${isAdmin() ? "Administrar liga" : "Panel de staff"}</a></p>` : ""}`;
}

/* ============ Páginas ============ */
function top5() {
  const im = S.teams.filter((t) => t.xp >= 1000).slice(0, 5);
  return `<div class="sec"><span>Top 5 Imperator</span></div>` + (im.length ? im.map((t, i) => `<div class="card tour"><div><h3>${i + 1}. ${esc(t.name)}</h3><p>${t.xp} XP</p></div>${helmet(7, "#C9A227", 1)}</div>`).join("") : `<div class="card"><p class="meta" style="margin:0">Todavía nadie ha llegado a Imperator. Hacen falta 1000 XP.</p></div>`);
}
function rangos() {
  return `<div class="sec"><span>Rangos</span></div><p class="lead">Tu rango depende de la XP de tu equipo. Cuanto más alto es el rango, más completo es el casco. El Plebeyo todavía no tiene casco ni división.</p><div class="rkg">${RK.map((k, i) => `<div class="card rkc" style="--c:${k.c}">${helmet(i, k.c)}<h3>${k.n}</h3><p>${k.x} XP</p></div>`).join("")}</div><p class="meta">Entre los Imperator, solo los cinco con más XP forman el Top 5.</p>`;
}
const tlogo = (t, big) => { const u = safeImg(t.logo_url); return u ? `<img class="${big ? "tl" : "tm"}" alt="" src="${u}">` : big ? `<div class="tl ph" aria-hidden="true">${esc((t.name || "?").charAt(0).toUpperCase())}</div>` : `<span class="dot" style="background:${esc(t.color)}"></span>`; };

function home() {
  const s = S.teams.filter((t) => t.played > 0).slice(0, 3);
  return `<section class="hero"><p class="kick">Liga de desafíos de FC 27</p><h1>Arena XI</h1><img class="emb" alt="Emblema de Arena XI: casco espartano con penacho rojo sobre un coliseo" src="assets/emblem.webp"><hr><p class="motto">Retos, rangos y un solo trono. Demuestra en el campo quién merece el nombre de Imperator.</p></section>
<div class="gates">${GATES.map((g) => `<a class="gate" href="#${g[0]}"><b>${g[1]}</b><small>${g[2]}</small></a>`).join("")}</div>
${s.length ? `<div class="sec"><span>El podio</span><a class="link" href="#ranking">Ver ranking completo</a></div><div class="pod">${s.map((t, i) => `<div class="card"><div class="n">${i + 1}</div><div class="t">${esc(t.name)}</div><div class="x">${t.xp} XP</div></div>`).join("")}</div>` : ""}`;
}
function ranking() {
  if (!S.teams.length) return `<h2>Ranking</h2><p class="lead">Todavía no hay equipos en el ranking.</p>`;
  return `<h2>Ranking</h2><p class="lead">Ordenado por XP, que se gana con los partidos de los retos. En caso de empate, manda quien tenga más victorias.</p><div class="tw"><table class="tb"><thead><tr><th>#</th><th>Equipo</th><th>Ganados</th><th>Perdidos</th><th>XP</th><th>Rango</th></tr></thead><tbody>${S.teams.map((t, i) => `<tr><td class="pos">${i + 1}</td><td class="tn"><span style="white-space:nowrap">${tlogo(t, 0)}${esc(t.name)}</span></td><td class="w">${t.wins}</td><td class="l">${t.losses}</td><td>${t.xp}</td><td class="rk">${rkcell(t)}</td></tr>`).join("")}</tbody></table></div>${top5()}`;
}
function equipos() {
  if (!S.teams.length) return `<h2>Equipos</h2><p class="lead">Todavía no hay equipos.</p>`;
  const list = [...S.teams].sort((a, b) => a.name.localeCompare(b.name, "es"));
  return `<h2>Equipos</h2><p class="lead">Las legiones que compiten en la liga.</p><div class="teams">${list.map((t) => {
    const bn = safeImg(t.banner_url), ld = t.leader && t.leader.nick;
    return `<div class="card tcard" style="--c:${esc(t.color)}"><div class="tban"${bn ? ` style="background-image:url('${bn}')"` : ""}></div><div class="tbody">${tlogo(t, 1)}<h3 style="margin-top:8px">${esc(t.name)}</h3><p>Líder: ${ld ? esc(ld) : "sin líder"}</p><p class="rk2">${rkcell(t)}</p>${t.boost_left ? `<p style="color:var(--gt)">Doble XP activo: ${t.boost_left} partidos</p>` : ""}<p><b>${t.xp}</b> XP</p><p><span class="w">${t.wins} ganados</span> y <span class="l">${t.losses} perdidos</span></p></div></div>`;
  }).join("")}</div>`;
}
const torneos = () => `<h2>Torneos</h2><p class="lead">Todavía no hay torneos.</p>`;
const reglas = () => `<h2>Reglas</h2><p class="lead">La ley de la arena. Todos los equipos la aceptan al entrar.</p>${RU.map((r, i) => `<div class="card rule"><div class="n">${ROM[i]}</div><div><h3>${r[0]}</h3><p>${r[1]}</p></div></div>`).join("")}${rangos()}`;
function privacidad() {
  const c = CONTACT_EMAIL ? esc(CONTACT_EMAIL) : "el staff de la liga, a través de la propia web";
  return `<h2>Privacidad</h2><p class="lead">Qué datos guarda Arena XI y para qué.</p>
<div class="card"><h3>Datos que guardamos</h3><p>Tu correo (solo para iniciar sesión y recuperar la contraseña; no es público), tu nick, tu plataforma y tu ID de FC 27, tus retos, resultados, pruebas (enlaces) y los mensajes del chat de tus partidos.</p></div>
<div class="card"><h3>Quién ve qué</h3><p>El nick, el rango y los resultados de tu equipo son públicos. Tu ID de FC 27 solo lo ven tu rival en un partido aceptado y el staff. El chat solo lo ven los dos jugadores del partido y el staff para moderar.</p></div>
<div class="card"><h3>Para qué</h3><p>Solo para organizar la liga: asignar equipos, jugar los retos, calcular el ranking y resolver disputas. No vendemos tus datos.</p></div>
<div class="card"><h3>Tus derechos</h3><p>Puedes pedir acceso, corrección o borrado de tus datos escribiendo a ${c}. Si borramos tu cuenta, desaparecen tu perfil y tus datos personales.</p></div>`;
}

/* ---- Retos ---- */
function matchState(m) {
  if (m.status === "open") return "abierto";
  if (m.status === "disputed") return "disputa";
  if (m.status === "closed") return "cerrado";
  const rs = S.reports[m.id] || [];
  return rs.some((r) => r.reporter_id === S.uid) ? "pendiente" : "aceptado";
}
function chatHtml(m) {
  const msgs = S.chat[m.id];
  return `<div class="chat"><div class="msgs" id="msgs-${esc(m.id)}">${!msgs ? note("Cargando...") : msgs.length ? msgs.map((x) => `<div class="bb${x.sender_id === S.uid ? " me" : ""}"><small>${x.sender_id === S.uid ? "Tú" : esc(nickOf(x.sender_id))}</small>${esc(x.body)}</div>`).join("") : note("Todavía no hay mensajes. Saluda a tu rival e invítale a la partida.")}</div>${m.status === "accepted" || m.status === "disputed" ? `<div class="cin"><input class="in" id="ci-${esc(m.id)}" data-keep maxlength="300" autocomplete="off" aria-label="Mensaje"><button class="btn sm" data-act="send" data-id="${esc(m.id)}">Enviar</button></div>` : note("El chat está cerrado.")}</div>`;
}
function matchCard(m) {
  const own = m.owner_id === S.uid, opp = own ? m.acceptor_id : m.owner_id, oppTeam = own ? m.acceptor_team : m.owner_team, st = matchState(m), rs = S.reports[m.id] || [];
  const mr = rs.find((r) => r.reporter_id === S.uid), tr = rs.find((r) => r.reporter_id !== S.uid);
  const lab = { abierto: "Abierto", aceptado: "Aceptado", pendiente: "Falta el otro reporte", disputa: "En disputa", cerrado: "Cerrado" }[st], id = esc(m.id);
  let h = `<div class="card mt"><div class="top2"><h3>${m.acceptor_id ? "Contra " + esc(teamName(oppTeam)) : "Reto abierto"}</h3><span class="st${st === "disputa" ? " c" : st === "cerrado" ? " f" : ""}">${lab}</span></div><p>${esc(fdate(m.scheduled_at))}</p>`;
  if (m.acceptor_id) { const p = S.rivalIds[opp]; h += `<p>Rival: ${esc(nickOf(opp))}${p ? `. ID de FC 27: ${esc(p.fc_id)}. ${esc(p.platform)}.` : ""}</p>`; }
  if (st === "cerrado") {
    h += `<p>${m.voided || !m.winner_team ? "Partido anulado por el staff." : m.winner_team === (myTeam() || {}).id ? "Resultado: victoria." : "Resultado: derrota."}</p>`;
  } else if (m.acceptor_id) {
    if (mr) h += `<p>Tu reporte: ${mr.result === "win" ? "has ganado" : "has perdido"}${safeUrl(mr.proof_url) ? `. <a class="link" href="${esc(safeUrl(mr.proof_url))}" target="_blank" rel="noopener noreferrer">Ver tu prueba</a>` : ""}.</p>`;
    if (st === "disputa") h += `<p>Los dos reportes no coinciden. El staff decidirá con las pruebas.${tr && safeUrl(tr.proof_url) ? ` <a class="link" href="${esc(safeUrl(tr.proof_url))}" target="_blank" rel="noopener noreferrer">Ver la prueba de tu rival</a>` : ""}</p>`;
    if (st === "pendiente") h += `<p>Esperando el reporte de tu rival. Si no responde, decide el staff.</p>`;
    if (!mr) {
      if (Date.parse(m.scheduled_at) > Date.now()) h += `<p>Podrás reportar el resultado a la hora del partido.</p>`;
      else h += `<div class="rep"><input class="in" id="r-link-${id}" data-keep maxlength="255" placeholder="Enlace de prueba (opcional)" aria-label="Enlace de prueba"><div class="acts"><button class="btn sm" data-act="rep" data-id="${id}" data-r="win">He ganado</button><button class="btn sm dng" data-act="rep" data-id="${id}" data-r="loss">He perdido</button></div><p class="msg" id="rm-${id}" role="status"></p></div>`;
    }
  }
  if (m.acceptor_id) h += `<div class="acts"><button class="btn sm" data-act="chat" data-id="${id}">${S.openChat === m.id ? "Cerrar chat" : "Abrir chat"}</button></div>${S.openChat === m.id ? chatHtml(m) : ""}`;
  else if (own) h += `<div class="acts"><button class="btn sm dng" data-act="cancel" data-id="${id}">Cancelar reto</button></div>`;
  return h + "</div>";
}
function history() {
  const l = S.closed.filter((m) => !m.voided && m.winner_team).slice(0, 10);
  return `<div class="sec"><span>Últimos partidos</span></div>` + (l.length ? l.map((m) => { const lo = m.winner_team === m.owner_team ? m.acceptor_team : m.owner_team; return `<div class="card pc"><div><h3>${esc(teamName(m.winner_team))} venció a ${esc(teamName(lo))}</h3><p>${esc(fdate(m.scheduled_at))}</p></div></div>`; }).join("") : `<div class="card"><p class="meta" style="margin:0">Todavía no se ha jugado ningún partido.</p></div>`);
}
function retos() {
  const head = `<h2>Retos</h2><p class="lead">Crea un reto y elige la hora. Cuando otro equipo lo acepta se abre un chat para organizar la partida.</p>`;
  if (!S.ready) return head + `<div class="card">${note("Conectando con la liga...")}</div>`;
  if (S.error) return head + `<div class="card">${note(esc(S.error))}</div>`;
  if (!S.uid) return head + `<div class="card">${note("Entra con tu cuenta (icono de arriba a la izquierda) para crear y aceptar retos.")}</div>` + history();
  if (!S.prof) return head + `<div class="card">${note("No encuentro tu perfil. Cierra sesión y vuelve a entrar.")}</div>`;
  if (S.prof.banned) return head + `<div class="card">${note("Tu cuenta está bloqueada. Contacta con el staff.")}</div>` + history();
  const t = myTeam();
  if (!t) return head + `<div class="card">${note("El organizador todavía no te ha asignado equipo.")}</div>` + history();
  const tz = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const mine = S.mine;
  const open = S.live.filter((m) => m.status === "open" && m.owner_team !== t.id && Date.parse(m.scheduled_at) > Date.now() - 3600000);
  return head + `<div class="sec"><span>Crear reto</span></div><form class="card frm cform" id="cform" novalidate><label for="c-time">Hora del partido<input type="datetime-local" id="c-time" data-keep min="${tz}"></label><div class="acts"><button class="btn" type="submit">Publicar reto</button></div><p class="msg" id="c-msg" role="status"></p></form>
<div class="sec"><span>Retos abiertos</span><span class="meta">${open.length}</span></div>${open.length ? open.map((m) => `<div class="card pc"><div><h3>${esc(teamName(m.owner_team))}</h3><p>${esc(fdate(m.scheduled_at))}</p></div><button class="btn sm" data-act="accept" data-id="${esc(m.id)}">Aceptar reto</button></div>`).join("") : `<div class="card"><p class="meta" style="margin:0">No hay retos abiertos de otros equipos.</p></div>`}
<div class="sec"><span>Mis partidos</span><span class="meta">${mine.length}</span></div>${mine.length ? mine.map(matchCard).join("") : `<div class="card"><p class="meta" style="margin:0">Todavía no tienes partidos. Crea un reto o acepta uno abierto.</p></div>`}${history()}`;
}

/* ---- Tienda ---- */
function tienda() {
  if (!S.shop.length || !S.teams.length) return `<h2>Tienda</h2><p class="lead">Todavía no hay artículos en la tienda.</p>`;
  if (!S.shopTeam || !teamById(S.shopTeam)) S.shopTeam = (myTeam() || S.teams[0]).id;
  const t = teamById(S.shopTeam), adm = isAdmin();
  return `<h2>Tienda</h2><p class="lead">Cada partido jugado da 10 denarios al equipo.${adm ? "" : " Las compras las registra el organizador: pídele la tuya."}</p><div class="shopbar"><label>${adm ? "Comprar como " : "Ver denarios de "}<select id="sel">${[...S.teams].sort((a, b) => a.name.localeCompare(b.name, "es")).map((x) => `<option value="${x.id}"${x.id === S.shopTeam ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label><span class="coins">${t.denarios} denarios</span></div>
${S.shop.map((i) => `<div class="card item"><div><h3>${esc(i.name)}</h3><p>${esc(i.description)}</p>${i.boost_uses && t.boost_left ? `<p style="color:var(--gt)">Usos activos: ${t.boost_left} partidos</p>` : ""}</div><button class="buy" data-act="buy" data-i="${esc(i.id)}"${!adm || t.denarios < i.cost ? " disabled" : ""}>Cuesta ${i.cost}</button></div>`).join("")}`;
}

/* ---- Administración ---- */
function teamsAdmin() {
  const prev = (b) => (b ? `<img class="lg" alt="" src="${URL.createObjectURL(b)}">` : "");
  let h = `<div class="sec"><span>Equipos</span><span class="meta">${S.teams.length}</span></div>
<form class="card frm cform" id="tform" novalidate><h3>Crear equipo</h3><label for="t-n">Nombre<input id="t-n" data-keep maxlength="24" autocomplete="off"></label><label for="t-c">Color<input id="t-c" data-keep type="color" value="#A9803C"></label>
<label for="t-lf">Logo (cuadrado o con transparencia)<input id="t-lf" type="file" accept="image/*" data-file="logo" data-id="new"></label><label for="t-bf">Banner (mejor apaisado, 3:1)<input id="t-bf" type="file" accept="image/*" data-file="banner" data-id="new"></label>
${S.A.newLogo || S.A.newBanner ? `<div class="prev">${prev(S.A.newLogo)}${S.A.newBanner ? `<img class="bn" alt="" src="${URL.createObjectURL(S.A.newBanner)}">` : ""}</div>` : ""}
<div class="acts"><button class="btn" type="submit">Crear equipo</button></div><p class="msg" id="t-msg" role="status"></p><p class="msg">El líder se asigna después, desde la lista de jugadores.</p></form>`;
  h += S.teams.map((t) => `<div class="card frm tadm" style="--c:${esc(t.color)}"><div class="prev">${safeImg(t.logo_url) ? `<img class="lg" alt="" src="${safeImg(t.logo_url)}">` : ""}${safeImg(t.banner_url) ? `<img class="bn" alt="" src="${safeImg(t.banner_url)}">` : ""}<h3>${esc(t.name)}</h3></div>
<p class="msg">Líder: ${t.leader && t.leader.nick ? esc(t.leader.nick) : "sin líder"}. ${t.played} partidos.</p>
<label for="tn-${esc(t.id)}">Nombre<input id="tn-${esc(t.id)}" data-keep maxlength="24" value="${esc(t.name)}"></label><label for="tc-${esc(t.id)}">Color<input id="tc-${esc(t.id)}" data-keep type="color" value="${esc(t.color)}"></label>
<label for="tlf-${esc(t.id)}">Cambiar logo<input id="tlf-${esc(t.id)}" type="file" accept="image/*" data-file="logo" data-id="${esc(t.id)}"></label><label for="tbf-${esc(t.id)}">Cambiar banner<input id="tbf-${esc(t.id)}" type="file" accept="image/*" data-file="banner" data-id="${esc(t.id)}"></label>
<div class="acts"><button class="btn sm" type="button" data-act="tsave" data-id="${esc(t.id)}">Guardar nombre y color</button><button class="btn sm dng" type="button" data-act="tdel" data-id="${esc(t.id)}">${S.armTeam === t.id ? "¿Seguro? Pulsa otra vez" : "Borrar equipo"}</button></div><p class="msg" id="tm-${esc(t.id)}" role="status"></p></div>`).join("");
  return h;
}
function decideAdmin() {
  const l = S.A.decide;
  return `<div class="sec"><span>Partidos por decidir</span><span class="meta">${l.length}</span></div>` + (l.length ? l.map((m) => {
    const rs = S.A.reports[m.id] || [], line = (u) => { const r = rs.find((x) => x.reporter_id === u); return `${esc(nickOf(u))}: ${r ? (r.result === "win" ? "dice que ganó" : "dice que perdió") + (safeUrl(r.proof_url) ? `. <a class="link" href="${esc(safeUrl(r.proof_url))}" target="_blank" rel="noopener noreferrer">Ver prueba</a>` : "") : "no ha reportado"}`; };
    return `<div class="card mt"><div class="top2"><h3>${esc(teamName(m.owner_team))} contra ${esc(teamName(m.acceptor_team))}</h3><span class="st${m.status === "disputed" ? " c" : ""}">${m.status === "disputed" ? "En disputa" : "Falta un reporte"}</span></div><p>${esc(fdate(m.scheduled_at))}</p><p>${line(m.owner_id)}</p><p>${line(m.acceptor_id)}</p><div class="acts"><button class="btn sm" data-act="rule" data-id="${esc(m.id)}" data-w="${esc(m.owner_team)}">Gana ${esc(teamName(m.owner_team))}</button><button class="btn sm" data-act="rule" data-id="${esc(m.id)}" data-w="${esc(m.acceptor_team)}">Gana ${esc(teamName(m.acceptor_team))}</button><button class="btn sm dng" data-act="rule" data-id="${esc(m.id)}" data-w="void">Anular partido</button></div></div>`;
  }).join("") : `<div class="card"><p class="meta" style="margin:0">No hay partidos por decidir.</p></div>`);
}
function playersAdmin() {
  const l = S.A.profiles, me = S.uid;
  return `<div class="sec"><span>Jugadores</span><span class="meta">${l.length}</span></div><form class="card frm cform" id="qform" novalidate><label for="q">Buscar por nick<input id="q" data-keep maxlength="16" value="${esc(S.A.q)}" autocomplete="off"></label><div class="acts"><button class="btn sm" type="submit">Buscar</button></div></form>` +
    (l.length ? l.map((p) => {
      const lead = S.teams.find((t) => t.leader_id === p.id), self = p.id === me;
      return `<div class="card frm"><div class="pc"><div><h3>${esc(p.nick)}${p.banned ? " (bloqueado)" : ""}</h3><p>${p.role === "admin" ? "Administrador" : p.role === "staff" ? "Staff" : "Jugador"}. Alta: ${esc(new Date(p.created_at).toLocaleDateString("es-ES"))}.</p></div></div>
<label for="pt-${esc(p.id)}">Equipo (este jugador es su líder)<select id="pt-${esc(p.id)}" data-lead="${esc(p.id)}"><option value="">Sin equipo</option>${[...S.teams].sort((a, b) => a.name.localeCompare(b.name, "es")).map((t) => `<option value="${esc(t.id)}"${lead && lead.id === t.id ? " selected" : ""}${t.leader_id && t.leader_id !== p.id ? " disabled" : ""}>${esc(t.name)}${t.leader_id && t.leader_id !== p.id ? " (ocupado)" : ""}</option>`).join("")}</select></label>
<label for="pr-${esc(p.id)}">Rol<select id="pr-${esc(p.id)}" data-role="${esc(p.id)}"${self ? " disabled" : ""}>${[["player", "Jugador"], ["staff", "Staff"], ["admin", "Administrador"]].map((r) => `<option value="${r[0]}"${p.role === r[0] ? " selected" : ""}>${r[1]}</option>`).join("")}</select></label>
${self ? "" : `<div class="acts"><button class="btn sm dng" data-act="ban" data-id="${esc(p.id)}" data-f="${p.banned ? "0" : "1"}">${p.banned ? "Desbloquear" : "Bloquear cuenta"}</button></div>`}</div>`;
    }).join("") : `<div class="card"><p class="meta" style="margin:0">No hay jugadores con ese nick.</p></div>`);
}
function maintAdmin() {
  const l = S.A.closed.filter((m) => !m.voided);
  return `<div class="sec"><span>Mantenimiento</span></div><div class="card"><p class="meta" style="margin:0 0 10px">Si algo no cuadra, recalcula toda la liga desde los partidos cerrados.</p><div class="acts"><button class="btn sm" data-act="recompute">Recalcular liga</button></div></div>
<div class="sec"><span>Partidos cerrados recientes</span><span class="meta">${l.length}</span></div>${l.length ? l.map((m) => `<div class="card pc"><div><h3>${esc(teamName(m.owner_team))} contra ${esc(teamName(m.acceptor_team))}</h3><p>${esc(fdate(m.scheduled_at))}. Ganó ${esc(teamName(m.winner_team))}.</p></div><button class="btn sm dng" data-act="void" data-id="${esc(m.id)}">Anular</button></div>`).join("") : `<div class="card"><p class="meta" style="margin:0">Todavía no hay partidos cerrados.</p></div>`}`;
}
function admin() {
  if (!S.ready) return `<h2>Administración</h2><div class="card">${note("Cargando...")}</div>`;
  if (!isStaff()) return `<h2>Administración</h2><div class="card"><p class="meta" style="margin:0">Esta página es solo para el staff.</p></div>`;
  return `<h2>${isAdmin() ? "Administración" : "Panel de staff"}</h2><p class="lead">${isAdmin() ? "Crea los equipos, asigna a cada jugador su equipo, decide las disputas y gestiona los roles." : "Decide los partidos en disputa y los que no se han reportado."}</p>${isAdmin() ? teamsAdmin() : ""}${decideAdmin()}${isAdmin() ? playersAdmin() + maintAdmin() : ""}`;
}

const R = { "": home, ranking, retos, equipos, torneos, reglas, tienda, admin, privacidad };
const curPage = () => { const h = location.hash.slice(1); return Object.prototype.hasOwnProperty.call(R, h) ? h : ""; };
const links = (cur) => PAGES.map((p) => `<a href="#${p[0]}"${p[0] === cur ? ' aria-current="page"' : ""}>${p[1]}</a>`).join("");

/* ============ Render ============ */
function keepState() { const o = {}; document.querySelectorAll("#view [data-keep]").forEach((e) => { if (e.id) o[e.id] = e.value; }); const a = document.activeElement; return { v: o, f: a && a.id && $("view").contains(a) ? [a.id, a.selectionStart, a.selectionEnd] : null }; }
function restoreState(k) { Object.keys(k.v).forEach((i) => { const e = $(i); if (e && k.v[i]) e.value = k.v[i]; }); if (k.f) { const e = $(k.f[0]); if (e) { e.focus(); try { e.setSelectionRange(k.f[1], k.f[2]); } catch (x) { /* */ } } } }
let bgUrl = "", bgCur = 0;
function setBg(h) {
  const u = BGS[h] ? `assets/bg-${BGS[h]}.webp` : "", a = $("bga"), b = $("bgb");
  if (u === bgUrl) return; bgUrl = u;
  const bg = $("bg"), o = h === "" ? [".3", ".62"] : [".52", ".82"];
  bg.style.setProperty("--o1", o[0]); bg.style.setProperty("--o2", o[1]);
  const nx = bgCur ? a : b, pv = bgCur ? b : a;
  if (u) { nx.style.backgroundImage = `url("${u}")`; nx.style.opacity = 1; } else nx.style.opacity = 0;
  pv.style.opacity = 0; bgCur = 1 - bgCur;
}
let rq = 0;
function sched() { if (rq) return; rq = requestAnimationFrame(() => { rq = 0; render(); }); }
function render() {
  const h = curPage(), k = keepState(); let keepScroll = null;
  if (S.openChat) { const ms = document.querySelector(".msgs"); if (ms) keepScroll = ms.scrollTop; }
  if (!S.ready && h !== "" && h !== "reglas" && h !== "privacidad") $("view").innerHTML = `<p class="lead">Cargando...</p>`;
  else $("view").innerHTML = R[h]();
  $("nav").innerHTML = links(h); $("fnav").innerHTML = links(h) + `<a href="#privacidad">Privacidad</a>`;
  restoreState(k);
  if (S.openChat) { const m2 = document.querySelector(".msgs"); if (m2) m2.scrollTop = keepScroll == null ? m2.scrollHeight : keepScroll; }
  setBg(h); hdr(); if (!$("ppanel").contains(document.activeElement)) ppanel();
  const pg = PAGES.find((p) => p[0] === h);
  document.title = (h ? (pg ? pg[1] : h === "admin" ? "Administración" : "Privacidad") + " | " : "") + "Arena XI";
}

/* ============ Acciones ============ */
async function run(fn, okMsg) { try { await fn(); if (okMsg) flash(okMsg); } catch (e) { flash(e.message); } }
async function afterAction() { await refresh(); }
function imgBlob(file, w, h, cover) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type) || file.size > 12e6) return rej(new Error("Imagen no válida (máximo 12 MB)."));
    const fr = new FileReader(); fr.onerror = () => rej(new Error("No se pudo leer la imagen.")); fr.onload = () => {
      const im = new Image(); im.onerror = () => rej(new Error("No se pudo leer la imagen.")); im.onload = () => {
        const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
        const sc = (cover ? Math.max : Math.min)(w / im.width, h / im.height), dw = im.width * sc, dh = im.height * sc;
        x.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
        c.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo procesar la imagen."))), "image/webp", 0.85);
      }; im.src = fr.result;
    }; fr.readAsDataURL(file);
  });
}
async function openChat(id) {
  if (S.unwatch) { S.unwatch(); S.unwatch = null; }
  if (S.openChat === id) { S.openChat = ""; sched(); return; }
  S.openChat = id; sched();
  try {
    S.chat[id] = await api.messages(id);
    const need = [...new Set(S.chat[id].map((x) => x.sender_id))].filter((u) => !S.nicks[u]);
    if (need.length) (await api.nicks(need)).forEach((n) => (S.nicks[n.id] = n.nick));
    S.unwatch = api.watchChat(id, (p) => { const r = p.new; if (r && !(S.chat[id] || []).some((x) => x.id === r.id)) { (S.chat[id] = S.chat[id] || []).push(r); sched(); } });
  } catch (e) { S.chat[id] = []; flash(e.message); }
  sched();
}
function sendMsg(id) {
  const inp = $("ci-" + id), txt = inp ? inp.value.trim().slice(0, 300) : ""; if (!txt) return; inp.value = "";
  run(async () => { await api.sendMessage(id, S.uid, txt); S.chat[id] = await api.messages(id); sched(); });
}

document.addEventListener("click", (e) => {
  if (S.pOpen && !e.target.closest("#ppanel") && !e.target.closest("#pbtn")) { S.pOpen = false; ppanel(); }
  const t = e.target.closest("button"); if (!t) return;
  if (t.id === "pbtn") { S.pOpen = !S.pOpen; ppanel(); if (S.pOpen) { const f = $("ppanel").querySelector("input,a,button"); if (f) f.focus(); } return; }
  const act = t.dataset.act, id = t.dataset.id;
  if (act === "tab") { S.tab = t.dataset.t; S.pmsg = ""; ppanel(); return; }
  if (act === "logout") { run(async () => { await api.signOut(); S.pOpen = false; }); return; }
  if (act === "forgot") { const m = $("l-mail").value.trim(); if (!/^\S+@\S+\.\S+$/.test(m)) return setMsg("Escribe tu correo arriba y vuelve a pulsar.", true); run(async () => { await api.resetPassword(m); setMsg("Te hemos enviado un correo para cambiar la contraseña.", false); }).catch(() => {}); return; }
  if (act === "chat") { openChat(id); return; }
  if (act === "send") { sendMsg(id); return; }
  if (act === "cancel") { run(async () => { await api.cancelChallenge(id); await afterAction(); }); return; }
  if (act === "accept") { run(async () => { await api.acceptChallenge(id); await afterAction(); openChat(id); }, "Reto aceptado. Ya puedes hablar con tu rival."); return; }
  if (act === "rep") {
    const lk = $("r-link-" + id), link = lk ? lk.value.trim() : "";
    if (link && !safeUrl(link)) { const m = $("rm-" + id); if (m) { m.textContent = "El enlace debe empezar por http:// o https://"; m.className = "msg err"; } return; }
    run(async () => { await api.report(id, t.dataset.r, link); await afterAction(); }); return;
  }
  if (act === "buy") { run(async () => { await api.buy(S.shopTeam, t.dataset.i); await afterAction(); }, "Compra registrada."); return; }
  if (act === "rule") { run(async () => { await api.staffResolve(id, t.dataset.w === "void" ? null : t.dataset.w); await afterAction(); }, "Decisión guardada."); return; }
  if (act === "void") { run(async () => { await api.voidMatch(id); await afterAction(); }, "Partido anulado y liga recalculada."); return; }
  if (act === "recompute") { run(async () => { await api.recompute(); await afterAction(); }, "Liga recalculada."); return; }
  if (act === "ban") { run(async () => { await api.ban(id, t.dataset.f === "1"); await afterAction(); }); return; }
  if (act === "tsave") {
    const tt = teamById(id), nn = $("tn-" + id).value.trim(), cc = $("tc-" + id).value, m = $("tm-" + id);
    if (!tt) return;
    if (nn.length < 2 || nn.length > 24) { m.textContent = "El nombre debe tener de 2 a 24 caracteres."; m.className = "msg err"; return; }
    run(async () => { await api.updateTeam(id, { name: nn, color: /^#[0-9a-fA-F]{6}$/.test(cc) ? cc : tt.color }); await afterAction(); }, "Equipo guardado."); return;
  }
  if (act === "tdel") {
    if (S.armTeam !== id) { S.armTeam = id; sched(); return; }
    S.armTeam = null; run(async () => { await api.deleteTeam(id); await afterAction(); }, "Equipo borrado."); return;
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && S.pOpen) { S.pOpen = false; ppanel(); $("pbtn").focus(); }
  if (e.key === "Enter" && e.target.id && e.target.id.indexOf("ci-") === 0) { e.preventDefault(); sendMsg(e.target.id.slice(3)); }
});
document.addEventListener("submit", async (e) => {
  const id = e.target.id; if (!id) return; e.preventDefault();
  if (id === "lform") {
    const m = $("l-mail").value.trim(), p = $("l-pw").value; if (!m || !p) return setMsg("Escribe tu correo y tu contraseña.", true);
    try { setMsg("Entrando...", false); await api.signIn(m, p); S.pOpen = false; flash("Sesión iniciada."); } catch (er) { setMsg(er.message, true); }
  } else if (id === "sform") {
    const mail = $("s-mail").value.trim(), pw = $("s-pw").value, nick = $("s-nick").value.trim(), fc = $("s-fc").value.trim(), pl = $("s-pl").value;
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setMsg("Escribe un correo válido.", true);
    if (pw.length < 8) return setMsg("La contraseña debe tener al menos 8 caracteres.", true);
    if (!/^[A-Za-z0-9_.-]{3,16}$/.test(nick)) return setMsg("El nick debe tener de 3 a 16 caracteres: letras, números, punto, guion o guion bajo.", true);
    if (fc.length < 2 || fc.length > 24) return setMsg("Escribe tu ID de jugador en FC 27.", true);
    $("s-go").disabled = true;
    try {
      if (!(await api.nickAvailable(nick))) { setMsg("Ese nick ya lo usa otro jugador.", true); }
      else { const r = await api.signUp(mail, pw, { nick, fc_id: fc, platform: pl }); S.tab = "login"; setMsg(r.session ? "Cuenta creada." : "Cuenta creada. Revisa tu correo para confirmarla y luego entra.", false); }
    } catch (er) { setMsg(er.message, true); }
    const b = $("s-go"); if (b) b.disabled = false;
  } else if (id === "pform") {
    const fc = $("p-fc").value.trim(), pl = $("p-pl").value; if (fc.length < 2) return setMsg("Escribe tu ID de jugador en FC 27.", true);
    try { await api.updateIds(S.uid, fc, pl); S.ids = { fc_id: fc, platform: pl }; setMsg("Guardado.", false); } catch (er) { setMsg(er.message, true); }
  } else if (id === "newpw") {
    const p = $("np1").value; if (p.length < 8) return setMsg("Mínimo 8 caracteres.", true);
    try { await api.setPassword(p); S.recovery = false; S.pOpen = false; flash("Contraseña cambiada."); sched(); } catch (er) { setMsg(er.message, true); }
  } else if (id === "cform") {
    const v = $("c-time").value, d = new Date(v), msg = $("c-msg");
    if (!v || isNaN(d.getTime()) || d.getTime() < Date.now()) { msg.textContent = "Elige una fecha y una hora futuras."; msg.className = "msg err"; return; }
    run(async () => { await api.createChallenge(d.toISOString()); $("c-time").value = ""; await afterAction(); }, "Reto publicado.");
  } else if (id === "qform") {
    S.A.q = $("q").value.trim(); run(async () => { await loadAdmin(); sched(); });
  } else if (id === "tform") {
    const n = $("t-n").value.trim(), c = $("t-c").value, msg = $("t-msg");
    if (n.length < 2 || n.length > 24) { msg.textContent = "El nombre debe tener de 2 a 24 caracteres."; msg.className = "msg err"; return; }
    run(async () => {
      const r = await api.createTeam(n, /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#A9803C"), patch = {};
      if (S.A.newLogo) patch.logo_url = await api.uploadImage(r.id, "logo", S.A.newLogo);
      if (S.A.newBanner) patch.banner_url = await api.uploadImage(r.id, "banner", S.A.newBanner);
      if (Object.keys(patch).length) await api.updateTeam(r.id, patch);
      S.A.newLogo = S.A.newBanner = null; $("t-n").value = ""; await afterAction();
    }, "Equipo creado.");
  }
});
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "sel") { S.shopTeam = el.value; sched(); return; }
  if (el.dataset && el.dataset.lead !== undefined) {
    const pid = el.dataset.lead, cur = S.teams.find((t) => t.leader_id === pid);
    run(async () => { if (cur && cur.id !== el.value) await api.setLeader(cur.id, null); if (el.value) await api.setLeader(el.value, pid); await afterAction(); }, "Equipo asignado.").catch(() => {}); return;
  }
  if (el.dataset && el.dataset.role !== undefined) { run(async () => { await api.setRole(el.dataset.role, el.value); await afterAction(); }, "Rol actualizado."); return; }
  if (el.dataset && el.dataset.file) {
    const f = el.files && el.files[0], kind = el.dataset.file, tid = el.dataset.id; if (!f) return;
    run(async () => {
      const b = await imgBlob(f, kind === "logo" ? 256 : 960, kind === "logo" ? 256 : 320, kind === "banner");
      if (tid === "new") { if (kind === "logo") S.A.newLogo = b; else S.A.newBanner = b; sched(); return; }
      const url = await api.uploadImage(tid, kind, b); await api.updateTeam(tid, kind === "logo" ? { logo_url: url } : { banner_url: url }); await afterAction();
    }, tid === "new" ? "" : "Imagen guardada.").catch(() => { el.value = ""; });
  }
});
window.addEventListener("hashchange", async () => { S.pOpen = false; if (S.unwatch) { S.unwatch(); S.unwatch = null; } S.openChat = ""; ppanel(); if (curPage() === "admin" && S.ready) { sched(); await run(loadAdmin); } sched(); window.scrollTo(0, 0); });

/* ============ Arranque ============ */
async function boot() {
  render();
  api.onAuth(async (ev, session) => {
    if (ev === "PASSWORD_RECOVERY") { S.recovery = true; S.pOpen = true; }
    if (ev === "TOKEN_REFRESHED") return;
    await setUser(session); scheduleRefresh();
  });
  try { await setUser(await api.getSession()); } catch (e) { /* sin sesión */ }
  await refresh();
  api.watchTables(scheduleRefresh);
}
boot();
