// Client de l'API du bot + connexion Discord (OAuth2, échange du code côté API du bot).
const cfg = window.HEYEM_CONFIG || {};
const TOKEN_KEY = "heyem_token";
const STATE_KEY = "heyem_oauth_state";

export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status; // 0 = bot injoignable
    this.fields = fields || {};
  }
}

function store(area, op, key, value) {
  try {
    const s = window[area];
    if (op === "get") return s.getItem(key);
    if (op === "set") s.setItem(key, value);
    else s.removeItem(key);
  } catch { /* stockage indisponible : on continue sans */ }
  return null;
}

/** Renvoie la raison pour laquelle le site n'est pas configuré, ou null. */
export function configProblem() {
  const url = String(cfg.apiUrl || "");
  if (!url) return "L'adresse de l'API du bot (HEYEM_API_URL) n'est pas renseignée dans config.js.";
  if (!/^https:\/\//.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(url)) {
    return "HEYEM_API_URL doit être une adresse HTTPS.";
  }
  if (url.endsWith("/")) return "HEYEM_API_URL ne doit pas se terminer par « / ».";
  if (!/^\d{15,25}$/.test(String(cfg.discordClientId || ""))) {
    return "L'identifiant de l'application Discord (DISCORD_CLIENT_ID) est absent ou invalide dans config.js.";
  }
  return null;
}

export const getToken = () => store("localStorage", "get", TOKEN_KEY);
export const setToken = (t) => store("localStorage", t ? "set" : "remove", TOKEN_KEY, t);

/** URL de retour OAuth : toujours la racine du site, avec « / » final (index.html retiré),
 *  pour correspondre exactement à l'adresse enregistrée dans le Developer Portal. */
export function redirectUri() {
  const path = location.pathname.replace(/index\.html$/, "");
  return location.origin + (path.endsWith("/") ? path : path + "/");
}

export function startLogin() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  store("sessionStorage", "set", STATE_KEY, state);
  const q = new URLSearchParams({
    client_id: cfg.discordClientId,
    response_type: "code",
    scope: "identify",
    redirect_uri: redirectUri(),
    state,
    prompt: "none",
  });
  location.assign("https://discord.com/oauth2/authorize?" + q);
}

/** Si l'URL contient un retour OAuth (?code=…&state=…), l'échange. Renvoie null, ou un message d'erreur. */
export async function finishLoginIfNeeded() {
  const q = new URLSearchParams(location.search);
  if (!q.has("code") && !q.has("error")) return null;
  const code = q.get("code");
  const state = q.get("state");
  const denied = q.get("error");
  const expected = store("sessionStorage", "get", STATE_KEY);
  store("sessionStorage", "remove", STATE_KEY);
  history.replaceState(null, "", location.pathname + location.hash);
  if (denied) return "Connexion Discord refusée.";
  if (!code || !state || !expected || state !== expected) {
    return "Connexion refusée : le paramètre « state » ne correspond pas. Réessayez.";
  }
  try {
    const res = await call("POST", "/auth/discord", { code, redirect_uri: redirectUri() }, false);
    setToken(res.token);
    return null;
  } catch (e) {
    return e instanceof ApiError ? e.message : String(e);
  }
}

async function call(method, path, body, auth = true) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (auth && token) headers.Authorization = "Bearer " + token;
  let res;
  try {
    res = await fetch(cfg.apiUrl + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "Le bot est injoignable (hors ligne, adresse incorrecte ou CORS mal configuré).");
  }
  let data = null;
  try { data = await res.json(); } catch { /* corps vide ou non JSON */ }
  if (!res.ok) {
    if (res.status === 401 && auth) setToken(null);
    throw new ApiError(res.status, (data && data.error) || `Erreur ${res.status}`, data && data.fields);
  }
  return data;
}

export const api = {
  me: () => call("GET", "/api/me"),
  logout: () => call("POST", "/auth/logout", {}),
  guilds: () => call("GET", "/api/guilds"),
  guild: (id) => call("GET", `/api/guilds/${encodeURIComponent(id)}`),
  save: (id, module, changes) =>
    call("PUT", `/api/guilds/${encodeURIComponent(id)}/settings/${encodeURIComponent(module)}`, { changes }),
};
