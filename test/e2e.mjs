// Test de bout en bout : le vrai site, servi sous un sous-dossier (comme GitHub Pages), face à une fausse API.
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { startMockApi } from "./mock-api.mjs";

const require = createRequire(import.meta.url);
const site = resolve(dirname(fileURLToPath(import.meta.url)), "..", "site");
const BASE = "/embot/";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

function loadPlaywright() {
  for (const p of ["playwright", "/opt/node-tools/node_modules/playwright", "/opt/node22/lib/node_modules/playwright"]) {
    try { return require(p); } catch { /* suivant */ }
  }
  throw new Error("Playwright introuvable (npm i -D playwright).");
}

function serveSite(getConfig) {
  const server = createServer((req, res) => {
    const p = new URL(req.url, "http://x").pathname;
    if (!p.startsWith(BASE)) { res.writeHead(404); return res.end(); }
    const rel = p.slice(BASE.length) || "index.html";
    const file = join(site, rel);
    if (!file.startsWith(site) || !existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": types[extname(file)] || "text/plain" });
    const override = rel === "config.js" ? getConfig() : null;
    res.end(override ?? readFileSync(file));
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

let passed = 0;
const ok = (name) => { passed++; console.log("  ✔", name); };

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
try {
  // L'origine du site doit être connue avant l'API (CORS) ; la config est injectée ensuite.
  let cfg = null;
  const probe = await serveSite(() => cfg);
  const origin = probe.origin;
  const api = await startMockApi({ origin });
  cfg = `window.HEYEM_CONFIG={apiUrl:${JSON.stringify(api.url)},discordClientId:"123456789012345678"};`;

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) problems.push("console: " + m.text()); });

  // Discord simulé : renvoie directement vers le site avec code + state.
  let seenAuthorize = null;
  await page.route("https://discord.com/oauth2/authorize*", (route) => {
    const u = new URL(route.request().url());
    seenAuthorize = u;
    const back = new URL(u.searchParams.get("redirect_uri"));
    back.searchParams.set("code", "good-code");
    back.searchParams.set("state", u.searchParams.get("state"));
    route.fulfill({ status: 302, headers: { Location: back.toString() } });
  });

  console.log("Site sous", origin + BASE);
  await page.goto(origin + BASE);
  await page.getByRole("button", { name: "Se connecter avec Discord" }).click();
  await page.getByRole("heading", { name: "Vos serveurs" }).waitFor();
  assert.equal(seenAuthorize.searchParams.get("redirect_uri"), origin + BASE);
  assert.equal(seenAuthorize.searchParams.get("scope"), "identify");
  assert.ok(!page.url().includes("code="));
  ok("connexion OAuth (redirect_uri sous-dossier, state vérifié, URL nettoyée)");

  assert.equal(await page.locator("a.card").count(), 1);
  assert.equal(await page.getByText("Bot absent").count(), 1);
  ok("liste des serveurs (serveur sans bot non cliquable)");

  await page.locator("a.card").click();
  await page.getByRole("heading", { name: "Serveur Test" }).waitFor();
  for (const label of ["Général et apparence", "Tickets", "Permissions et accès", "Sondages"]) {
    assert.ok(await page.getByText(label).first().isVisible(), label);
  }
  ok("page du serveur : tous les modules listés");

  // Enregistrement
  await page.getByText("Modération", { exact: false }).first().click();
  await page.getByRole("heading", { name: /Modération/ }).waitFor();
  await page.getByLabel("Avertissements avant sanction").fill("5");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Réglages enregistrés").waitFor();
  assert.equal(api.settings.moderation.warn_threshold, 5);
  ok("enregistrement : seule la valeur modifiée est envoyée et stockée");

  // Validation côté API
  await page.getByLabel("Avertissements avant sanction").fill("99");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Doit être entre 1 et 20.").waitFor();
  assert.equal(api.settings.moderation.warn_threshold, 5);
  ok("erreur 422 affichée sous le champ, rien d'enregistré");

  // Les membres individuels de « access » sont conservés
  await page.goto(origin + BASE + "#/guild/111111111111111111/access");
  await page.getByRole("heading", { name: /Permissions/ }).waitFor();
  await page.locator(".checks").first().getByText("Admin").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Réglages enregistrés").waitFor();
  assert.deepEqual(api.settings.access.config, { roles: ["301"], users: ["42"] });
  ok("permissions : rôle ajouté, membres existants conservés");

  // Modèle de message : seuls titre et texte partent vers l'API, style et image sont conservés
  await page.goto(origin + BASE + "#/guild/111111111111111111/welcome");
  await page.getByRole("heading", { name: /Arrivées/ }).waitFor();
  await page.getByPlaceholder("Titre").first().fill("Salut !");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Réglages enregistrés").waitFor();
  assert.deepEqual(api.settings.welcome.welcome_msg, { style: "embed", title: "Salut !", text: "Salut {user}", image: "" });
  ok("modèle de message : titre et texte envoyés, style et image conservés");

  // Module inconnu / serveur inconnu
  await page.goto(origin + BASE + "#/guild/999/welcome");
  await page.getByText("Serveur introuvable").waitFor();
  ok("serveur inconnu : message 404");

  // Bot hors ligne + Réessayer
  api.state.offline = true;
  await page.goto(origin + BASE + "#/");
  await page.reload();
  await page.getByText("Bot hors ligne").waitFor();
  api.state.offline = false;
  await page.getByRole("button", { name: "Réessayer" }).click();
  await page.getByRole("heading", { name: "Vos serveurs" }).waitFor();
  ok("bot hors ligne : message clair puis « Réessayer » fonctionne");

  // Jeton expiré
  await page.evaluate(() => localStorage.setItem("heyem_token", "perime"));
  await page.reload();
  await page.getByText("Session expirée").waitFor();
  ok("jeton invalide : session expirée, reconnexion proposée");

  // Déconnexion : le jeton est révoqué côté API puis supprimé
  await page.evaluate(() => localStorage.setItem("heyem_token", "tok"));
  await page.goto(origin + BASE + "#/");
  await page.reload();
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await page.getByRole("button", { name: "Se connecter avec Discord" }).waitFor();
  assert.equal(api.state.loggedOut, true);
  assert.equal(await page.evaluate(() => localStorage.getItem("heyem_token")), null);
  ok("déconnexion : jeton révoqué côté API puis supprimé");

  // Ouvert via index.html ou sans « / » final : la redirection reste identique à celle enregistrée
  for (const entry of ["index.html", "index.html#/guild/1", ""]) {
    seenAuthorize = null;
    await page.goto(origin + BASE + entry);
    await page.evaluate(() => localStorage.removeItem("heyem_token"));
    await page.reload();
    await page.getByRole("button", { name: "Se connecter avec Discord" }).click();
    await page.getByRole("heading", { name: "Vos serveurs" }).waitFor();
    assert.equal(seenAuthorize.searchParams.get("redirect_uri"), origin + BASE, entry);
    await page.evaluate(() => localStorage.removeItem("heyem_token"));
  }
  const noSlash = await ctx.newPage();
  await noSlash.route("https://discord.com/oauth2/authorize*", (route) => {
    seenAuthorize = new URL(route.request().url());
    route.abort();
  });
  await noSlash.goto(origin + BASE.slice(0, -1) + "/index.html");
  await noSlash.getByRole("button", { name: "Se connecter avec Discord" }).click();
  await noSlash.waitForTimeout(300);
  assert.equal(seenAuthorize.searchParams.get("redirect_uri"), origin + BASE);
  ok("redirect_uri identique avec index.html : toujours « …/embot/ »");

  // state falsifié
  const bad = await ctx.newPage();
  await bad.route("https://discord.com/oauth2/authorize*", (route) => {
    const back = new URL(new URL(route.request().url()).searchParams.get("redirect_uri"));
    back.searchParams.set("code", "good-code"); back.searchParams.set("state", "forged");
    route.fulfill({ status: 302, headers: { Location: back.toString() } });
  });
  await bad.goto(origin + BASE);
  await bad.getByRole("button", { name: "Se connecter avec Discord" }).click();
  await bad.getByText("« state » ne correspond pas").waitFor();
  assert.equal(await bad.evaluate(() => localStorage.getItem("heyem_token")), null);
  ok("faux « state » OAuth refusé, aucun jeton stocké");

  assert.deepEqual(problems, []);
  ok("aucune erreur JS ni violation de la politique de sécurité (CSP)");

  // Configuration vide
  const empty = await serveSite(() => null);
  const p2 = await browser.newPage();
  await p2.goto(empty.origin + BASE);
  await p2.getByText("Dashboard non configuré").waitFor();
  await p2.getByText("HEYEM_API_URL").first().waitFor();
  ok("config.js vide : « Dashboard non configuré » avec la raison");

  console.log(`\n${passed} vérifications réussies.`);
} catch (e) {
  console.error("\n✘ Échec :", e);
  process.exitCode = 1;
} finally {
  await browser.close();
  process.exit(process.exitCode ?? 0); // les serveurs de test gardent des connexions ouvertes
}
