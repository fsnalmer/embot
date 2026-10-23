// Écrit site/config.js à partir des variables d'environnement HEYEM_API_URL et DISCORD_CLIENT_ID.
// Vides : le site s'affichera « Dashboard non configuré ». Invalides : échec (mieux vaut ne pas déployer).
// Usage : node scripts/write-config.mjs [chemin-de-sortie]
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2] || join(root, "site", "config.js");
const apiUrl = (process.env.HEYEM_API_URL || "").trim();
const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();

const problems = [];
if (apiUrl) {
  if (!/^https:\/\/[^\s/]+(\/[^\s]*)?$/.test(apiUrl)) problems.push("HEYEM_API_URL doit être une adresse https://… sans espace.");
  if (apiUrl.endsWith("/")) problems.push("HEYEM_API_URL ne doit pas se terminer par « / ».");
}
if (clientId && !/^\d{15,25}$/.test(clientId)) problems.push("DISCORD_CLIENT_ID doit être l'Application ID Discord (15 à 25 chiffres).");
if (problems.length) {
  console.error("✘ " + problems.join("\n✘ "));
  process.exit(1);
}
if (!apiUrl || !clientId) {
  console.log("::warning::HEYEM_API_URL ou DISCORD_CLIENT_ID est vide : le site affichera « Dashboard non configuré ».");
}
writeFileSync(out, "window.HEYEM_CONFIG = " + JSON.stringify({ apiUrl, discordClientId: clientId }, null, 2) + ";\n");
console.log(`config.js écrit (${apiUrl ? "API renseignée" : "API vide"}, ${clientId ? "client ID renseigné" : "client ID vide"}).`);
