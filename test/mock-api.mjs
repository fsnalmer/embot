// Fausse API du bot, uniquement pour les tests (voir docs/api.md pour le contrat réel).
import { createServer } from "node:http";

export function startMockApi({ origin, port = 0 }) {
  const settings = {
    general: { color: 0x5865f2, footer: "HEYEMTV BOT", show_footer: true },
    welcome: { enabled: false, welcome_on: true, welcome_channel: null, welcome_msg: { style: "embed", title: "Bienvenue", text: "Salut {user}", image: "" }, excluded_roles: [] },
    moderation: { enabled: true, dm_user: true, require_reason: false, warn_threshold: 3, warn_action: "timeout", warn_timeout_minutes: 60 },
    access: { config: { roles: [], users: ["42"] }, moderation: { roles: [], users: [] } },
  };
  const guild = {
    id: "111111111111111111", name: "Serveur Test", icon: null,
    channels: [{ id: "201", name: "général", type: "text" }, { id: "202", name: "Vocal", type: "voice" }, { id: "203", name: "Tickets", type: "category" }],
    roles: [{ id: "301", name: "Admin" }, { id: "302", name: "Modo" }],
  };
  const log = [];
  const state = { offline: false, loggedOut: false };

  const server = createServer((req, res) => {
    const hdr = {
      "Access-Control-Allow-Origin": origin, "Vary": "Origin",
      "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    };
    const send = (code, body) => { res.writeHead(code, { ...hdr, "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
    if (req.method === "OPTIONS") { res.writeHead(204, hdr); return res.end(); }
    if (state.offline) return req.socket.destroy();
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = raw ? JSON.parse(raw) : {};
      const path = new URL(req.url, "http://x").pathname;
      log.push(`${req.method} ${path}`);
      if (req.method === "POST" && path === "/auth/discord") {
        return body.code === "good-code" ? send(200, { token: "tok", user: { id: "42", username: "Noah", avatar: null } }) : send(400, { error: "Code Discord invalide." });
      }
      if (req.method === "POST" && path === "/auth/logout") { state.loggedOut = true; return send(200, { ok: true }); }
      if (req.headers.authorization !== "Bearer tok") return send(401, { error: "Non authentifié." });
      if (path === "/api/me") return send(200, { id: "42", username: "Noah", avatar: null });
      if (path === "/api/guilds") return send(200, [{ id: guild.id, name: guild.name, icon: null, bot_present: true }, { id: "222", name: "Sans bot", icon: null, bot_present: false }]);
      let m;
      if ((m = path.match(/^\/api\/guilds\/(\d+)$/))) {
        return m[1] === guild.id ? send(200, { ...guild, settings }) : send(404, { error: "Serveur introuvable." });
      }
      if ((m = path.match(/^\/api\/guilds\/(\d+)\/settings\/(\w+)$/)) && req.method === "PUT") {
        if (m[1] !== guild.id) return send(403, { error: "Vous ne gérez pas ce serveur." });
        const cur = settings[m[2]];
        if (!cur) return send(404, { error: "Module inconnu." });
        const ch = body.changes || {};
        const unknown = Object.keys(ch).filter((k) => !(k in cur));
        if (unknown.length) return send(422, { error: "Réglage inconnu.", fields: Object.fromEntries(unknown.map((k) => [k, "Réglage inconnu."])) });
        if ("warn_threshold" in ch && !(ch.warn_threshold >= 1 && ch.warn_threshold <= 20)) {
          return send(422, { error: "Valeur invalide.", fields: { warn_threshold: "Doit être entre 1 et 20." } });
        }
        for (const [k, v] of Object.entries(ch)) {
          // comme la vraie API : modèles et accès sont fusionnés, et n'acceptent que les clés modifiables
          if (k === "welcome_msg" || k === "leave_msg") {
            if (Object.keys(v).some((x) => !["title", "text"].includes(x))) return send(422, { error: "Valeur invalide.", fields: { [k]: "Un objet {title, text} est attendu." } });
            cur[k] = { ...cur[k], ...v };
          } else if (m[2] === "access") {
            if (Object.keys(v).some((x) => x !== "roles")) return send(422, { error: "Valeur invalide.", fields: { [k]: "Un objet {roles} est attendu." } });
            cur[k] = { ...cur[k], ...v };
          } else cur[k] = v;
        }
        return send(200, { settings: cur });
      }
      send(404, { error: "Route inconnue." });
    });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => {
    resolve({ url: `http://127.0.0.1:${server.address().port}`, settings, log, state, close: () => server.close() });
  }));
}
