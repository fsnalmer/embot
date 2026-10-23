// Le vrai site dans un vrai navigateur face à la VRAIE API Python du bot (faux Discord uniquement).
// Nécessite : HEYEM_BOT_DIR = dépôt du bot avec l'API du dashboard intégrée (et ses dépendances installées) ;
//             HEYEM_PYTHON = interpréteur Python correspondant (défaut : python3).
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const botDir = process.env.HEYEM_BOT_DIR;
if (!botDir) { console.log("HEYEM_BOT_DIR non défini : test de l'API réelle ignoré."); process.exit(0); }

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, "..", "site");
const BASE = "/embot/";
const require = createRequire(import.meta.url);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const { chromium } = (() => { for (const p of ["playwright", "/opt/node-tools/node_modules/playwright"]) { try { return require(p); } catch {} } throw new Error("Playwright introuvable"); })();

let apiUrl = "";
const web = createServer((req, res) => {
  const p = new URL(req.url, "http://x").pathname;
  if (!p.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  const rel = p.slice(BASE.length) || "index.html";
  const file = join(site, rel);
  if (!existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[extname(file)] || "text/plain" });
  res.end(rel === "config.js" ? `window.HEYEM_CONFIG={apiUrl:${JSON.stringify(apiUrl)},discordClientId:"123456789012345678"};` : readFileSync(file));
});
await new Promise((r) => web.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${web.address().port}`;

// e2e_server.py vit dans le dépôt du bot (tests/)
const serverScript = join(botDir, "tests", "e2e_server.py");
if (!existsSync(serverScript)) { console.error(`${serverScript} introuvable : HEYEM_BOT_DIR doit être le dépôt du bot avec l'API du dashboard.`); process.exit(1); }
const server = spawn(process.env.HEYEM_PYTHON || "python3", [serverScript, origin, origin + BASE], {
  cwd: botDir, env: { ...process.env, PYTHONPATH: botDir }, stdio: ["ignore", "pipe", "inherit"],
});
apiUrl = await new Promise((ok, ko) => {
  server.stdout.once("data", (d) => ok(JSON.parse(d.toString()).api_url));
  server.once("exit", (c) => ko(new Error("API Python arrêtée (code " + c + ")")));
});

let failed = false, n = 0;
const ok = (m) => { n++; console.log("  ✔", m); };
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext()).newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") problems.push(m.text()); });
  await page.route("https://discord.com/oauth2/authorize*", (route) => {
    const u = new URL(route.request().url());
    const back = new URL(u.searchParams.get("redirect_uri"));
    back.searchParams.set("code", "any-code"); back.searchParams.set("state", u.searchParams.get("state"));
    route.fulfill({ status: 302, headers: { Location: back.toString() } });
  });

  await page.goto(origin + BASE + "index.html");
  await page.getByRole("button", { name: "Se connecter avec Discord" }).click();
  await page.getByRole("heading", { name: "Vos serveurs" }).waitFor();
  ok("connexion : le site envoie le code, la vraie API l'échange (redirect_uri exacte acceptée, même via index.html)");

  await page.locator("a.card").click();
  await page.getByRole("heading", { name: "Serveur test" }).waitFor();
  ok("serveur listé et ouvert (CORS réel accepté par le navigateur)");

  await page.getByText("Modération").first().click();
  await page.getByLabel("Avertissements avant sanction").fill("7");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Réglages enregistrés").waitFor();
  await page.reload();
  assert.equal(await page.getByLabel("Avertissements avant sanction").inputValue(), "7");
  ok("enregistrement : la valeur est relue depuis la base après rechargement");

  await page.getByLabel("Avertissements avant sanction").fill("99");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText(/entre 1 et 20/).waitFor();
  ok("valeur hors limites refusée par la vraie API, message affiché sous le champ");

  await page.goto(origin + BASE + "#/guild/100/welcome");
  await page.getByPlaceholder("Titre").first().fill("Bienvenue à toi");
  await page.getByLabel("Salon des arrivées").selectOption("500");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Réglages enregistrés").waitFor();
  await page.reload();
  assert.equal(await page.getByLabel("Salon des arrivées").inputValue(), "500");
  ok("modèle de message et salon (ID en chaîne) enregistrés et relus");

  await page.getByRole("button", { name: "Déconnexion" }).click();
  await page.getByRole("button", { name: "Se connecter avec Discord" }).waitFor();
  ok("déconnexion");

  const fatal = problems.filter((p) => !/Failed to load resource/.test(p));
  assert.deepEqual(fatal, []);
  ok("aucune erreur JS ni CSP");
  console.log(`\n${n} vérifications réussies contre la vraie API Python.`);
} catch (e) { console.error("✘", e); failed = true; }
finally { await browser.close(); server.kill(); process.exit(failed ? 1 : 0); }
