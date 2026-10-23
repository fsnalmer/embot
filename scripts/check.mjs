// Vérification du site : syntaxe des scripts, fichiers référencés, config vide, absence de secrets.
// Usage : node scripts/check.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const errors = [];
const fail = (m) => errors.push(m);

function walk(dir, skip = new Set([".git", "node_modules"])) {
  return readdirSync(dir).flatMap((n) => {
    if (skip.has(n)) return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p, skip) : [p];
  });
}

// 1. Syntaxe
const tmp = mkdtempSync(join(tmpdir(), "heyem-check-"));
for (const f of walk(site).filter((p) => p.endsWith(".js"))) {
  const copy = join(tmp, "check.mjs");
  writeFileSync(copy, readFileSync(f));
  try {
    execFileSync(process.execPath, ["--check", copy], { stdio: "pipe" });
  } catch (e) {
    fail(`Erreur de syntaxe dans ${relative(root, f)} :\n${e.stderr}`);
  }
}
rmSync(tmp, { recursive: true, force: true });

// 2. Fichiers référencés (index.html et imports relatifs)
const html = readFileSync(join(site, "index.html"), "utf8");
for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const ref = m[1];
  if (/^(https?:)?\/\//.test(ref)) continue;
  if (ref.startsWith("/")) fail(`index.html : chemin absolu « ${ref} » (casse sous /nom-du-depot/)`);
  else if (!existsSync(join(site, ref))) fail(`index.html référence « ${ref} » qui n'existe pas`);
}
for (const f of walk(site).filter((p) => p.endsWith(".js"))) {
  for (const m of readFileSync(f, "utf8").matchAll(/from\s+"(\.[^"]+)"/g)) {
    if (!existsSync(resolve(dirname(f), m[1]))) fail(`${relative(root, f)} importe « ${m[1]} » qui n'existe pas`);
  }
}

// 3. config.js doit être vide dans le dépôt
const cfg = readFileSync(join(site, "config.js"), "utf8");
if (/apiUrl:\s*"[^"]+"/.test(cfg) || /discordClientId:\s*"[^"]+"/.test(cfg)) {
  fail("site/config.js contient des valeurs : il doit rester vide (rempli par le workflow).");
}

// 4. Secrets
const patterns = [
  [/[MNO][A-Za-z\d_-]{23,25}\.[\w-]{6}\.[\w-]{27,}/, "jeton de bot Discord"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "clé privée"],
  [/client_?secret["']?\s*[:=]\s*["'][^"']{8,}/i, "client secret", { skipTests: true }],
  [/ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/, "jeton GitHub"],
];
for (const f of walk(root)) {
  if (/\.(png|jpg|ico|woff2?)$/.test(f) || f.endsWith("check.mjs")) continue;
  const rel = relative(root, f);
  if (/(^|\/)\.env($|\.)/.test(rel) && !rel.endsWith(".example")) fail(`${rel} : fichier d'environnement à ne pas publier`);
  const text = readFileSync(f, "utf8");
  const inTests = /^test\//.test(rel); // les tests utilisent de faux secrets
  for (const [re, label, opt] of patterns) if (!(opt?.skipTests && inTests) && re.test(text)) fail(`${rel} : ressemble à un secret (${label})`);
}

if (errors.length) {
  console.error("✘ Vérification échouée :\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("✔ Vérification réussie (syntaxe, fichiers référencés, config vide, aucun secret).");
