import { api, ApiError, configProblem, finishLoginIfNeeded, getToken, setToken, startLogin } from "./api.js";
import { buildField, h } from "./form.js";
import { MODULES, MODULE_BY_KEY } from "./modules.js";

const app = document.getElementById("app");
const userBox = document.getElementById("user");
const toastEl = document.getElementById("toast");
let renderId = 0;
let toastTimer;

function toast(msg, bad = false) {
  toastEl.textContent = msg;
  toastEl.className = "show" + (bad ? " bad" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.className = ""), 3500);
}

const show = (...nodes) => app.replaceChildren(...nodes);
const crumbs = (...parts) => h("nav", { class: "crumbs muted" }, parts.flatMap((p, i) => (i ? [" › ", p] : [p])));
const notice = (title, text, kind = "", ...extra) =>
  h("div", { class: "notice " + kind }, h("h2", {}, title), h("p", {}, text), ...extra);

function iconUrl(kind, id, hash) {
  return hash ? `https://cdn.discordapp.com/${kind}/${encodeURIComponent(id)}/${encodeURIComponent(hash)}.png?size=64` : null;
}

function showError(err, retry) {
  if (err instanceof ApiError && err.status === 401) {
    renderUser(null);
    return show(notice("Session expirée", "Reconnectez-vous avec Discord.", "warn", h("button", { class: "btn", onclick: startLogin }, "Se connecter avec Discord")));
  }
  const title = err instanceof ApiError && err.status === 0 ? "Bot hors ligne" : err instanceof ApiError && err.status === 403 ? "Accès refusé" : err instanceof ApiError && err.status === 404 ? "Introuvable" : "Erreur";
  show(notice(title, err.message || String(err), "err", retry && h("button", { class: "btn", onclick: retry }, "Réessayer")));
}

/** Ce que l'API accepte pour un champ : modèle = titre + texte, accès = rôles (le reste est conservé côté bot). */
function payload(field, value) {
  if (field.type === "template") return { title: value?.title ?? "", text: value?.text ?? "" };
  if (field.type === "access") return { roles: value?.roles ?? [] };
  return value;
}

async function logout() {
  try { await api.logout(); } catch { /* jeton déjà invalide ou bot injoignable : on se déconnecte quand même */ }
  setToken(null);
  renderUser(null);
  route();
}

function renderUser(user) {
  if (!user) return userBox.replaceChildren();
  userBox.replaceChildren(
    h("img", { class: "avatar", alt: "", src: iconUrl("avatars", user.id, user.avatar) || undefined }),
    h("span", {}, user.username),
    h("button", { class: "btn ghost", onclick: logout }, "Déconnexion"),
  );
}

async function guildsPage(rid) {
  show(h("p", { class: "muted" }, "Chargement des serveurs…"));
  const guilds = await api.guilds();
  if (rid !== renderId) return;
  const cards = guilds.map((g) => {
    const icon = iconUrl("icons", g.id, g.icon);
    const body = [
      h("div", { class: "head" }, h("span", { class: "icon" }, icon ? h("img", { src: icon, alt: "" }) : g.name.slice(0, 1)), g.name),
      h("span", { class: "badge " + (g.bot_present ? "on" : "off") }, g.bot_present ? "Bot présent" : "Bot absent"),
    ];
    return g.bot_present
      ? h("a", { class: "card", href: `#/guild/${encodeURIComponent(g.id)}` }, body)
      : h("div", { class: "card muted" }, body);
  });
  show(
    h("h1", {}, "Vos serveurs"),
    h("p", { class: "muted" }, "Serveurs où vous avez la permission de gérer le bot."),
    cards.length ? h("div", { class: "grid" }, cards) : notice("Aucun serveur", "Vous ne gérez aucun serveur où le bot est présent."),
  );
}

async function guildPage(rid, gid) {
  show(h("p", { class: "muted" }, "Chargement…"));
  const guild = await api.guild(gid);
  if (rid !== renderId) return;
  const cards = MODULES.map((m) => {
    const s = guild.settings[m.key] || {};
    const badge = m.toggle === false ? null : h("span", { class: "badge " + (s.enabled ? "on" : "off") }, s.enabled ? "Activé" : "Désactivé");
    return h("a", { class: "card", href: `#/guild/${encodeURIComponent(gid)}/${m.key}` },
      h("div", { class: "head" }, `${m.emoji} ${m.label}`), h("span", { class: "muted" }, m.description), badge);
  });
  show(crumbs(h("a", { href: "#/" }, "Serveurs"), guild.name), h("h1", {}, guild.name), h("div", { class: "grid" }, cards));
}

async function modulePage(rid, gid, key) {
  const mod = MODULE_BY_KEY[key];
  if (!mod) throw new ApiError(404, "Module inconnu.");
  show(h("p", { class: "muted" }, "Chargement…"));
  const guild = await api.guild(gid);
  if (rid !== renderId) return;
  let saved = structuredClone(guild.settings[key] || {});
  const values = structuredClone(saved);
  const fields = mod.fields.map((f) => ({ f, ui: buildField(f, values, guild) }));
  const saveBtn = h("button", { class: "btn", type: "submit" }, "Enregistrer");
  const form = h("form", { class: "settings", novalidate: true }, fields.map((x) => x.ui.el), h("div", { class: "actions" }, saveBtn, h("a", { class: "btn ghost", href: `#/guild/${encodeURIComponent(gid)}` }, "Retour")));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const changes = {};
    for (const { f } of fields) if (JSON.stringify(values[f.key]) !== JSON.stringify(saved[f.key])) changes[f.key] = payload(f, values[f.key]);
    fields.forEach((x) => x.ui.setError(""));
    if (!Object.keys(changes).length) return toast("Aucun changement à enregistrer.");
    saveBtn.disabled = true;
    try {
      const res = await api.save(gid, key, changes);
      saved = structuredClone(res.settings);
      toast("Réglages enregistrés ✔");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return showError(err);
      if (err instanceof ApiError && err.status === 422) fields.forEach((x) => x.ui.setError(err.fields[x.f.key]));
      toast(err.message || "Échec de l'enregistrement.", true);
    } finally {
      saveBtn.disabled = false;
    }
  });

  show(crumbs(h("a", { href: "#/" }, "Serveurs"), h("a", { href: `#/guild/${encodeURIComponent(gid)}` }, guild.name), mod.label),
    h("h1", {}, `${mod.emoji} ${mod.label}`), h("p", { class: "muted" }, mod.description), form);
}

async function route() {
  const rid = ++renderId;
  const problem = configProblem();
  if (problem) {
    renderUser(null);
    return show(notice("Dashboard non configuré", problem, "warn", h("p", { class: "muted" }, "Voir le README : variables HEYEM_API_URL et DISCORD_CLIENT_ID du dépôt GitHub.")));
  }
  if (!getToken()) {
    renderUser(null);
    return show(h("h1", {}, "Dashboard HeyemBot"), h("p", { class: "muted" }, "Connectez-vous avec Discord pour configurer le bot sur vos serveurs."), h("button", { class: "btn", onclick: startLogin }, "Se connecter avec Discord"));
  }
  const retry = () => route();
  try {
    if (!userBox.hasChildNodes()) renderUser(await api.me());
    if (rid !== renderId) return;
    const [, section, gid, key] = location.hash.split("/").map((p) => decodeURIComponent(p));
    if (section === "guild" && gid && key) await modulePage(rid, gid, key);
    else if (section === "guild" && gid) await guildPage(rid, gid);
    else await guildsPage(rid);
  } catch (err) {
    if (rid === renderId) showError(err, retry);
  }
}

window.addEventListener("hashchange", route);
const loginError = await finishLoginIfNeeded();
if (loginError) {
  show(notice("Connexion impossible", loginError, "err", h("button", { class: "btn", onclick: startLogin }, "Réessayer")));
} else {
  if (location.search === "" && getToken() && !location.hash) location.hash = "#/";
  route();
}
