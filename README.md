# Dashboard HeyemBot

Dashboard web du bot Discord HeyemBot : un site **statique** (HTML, CSS, JavaScript, sans build) hébergé sur **GitHub Pages**. Il se connecte avec Discord et configure le bot en passant par l'API HTTP du bot.

* Aucun secret dans ce dépôt : `site/config.js` reste vide, le workflow le remplit à partir de deux variables du dépôt.
* Routage par ancre (`#/…`) et chemins relatifs : fonctionne sous `https://fsnalmer.github.io/embot/`.
* L'échange du code OAuth2 (qui demande le *client secret*) se fait **côté API du bot**, jamais dans le navigateur. Contrat : [`docs/api.md`](docs/api.md).
* Ce dépôt ne contient **que le site**. L'API Python qui le relie au bot vit dans le dépôt (privé) du bot, `docs/DASHBOARD.md`, et tourne sur votre hébergement.

## Contenu

| Chemin | Rôle |
|---|---|
| `site/` | Le site publié (`index.html`, `app.js`, `api.js`, `form.js`, `modules.js`, `style.css`, `config.js`) |
| `.github/workflows/deploy.yml` | Vérifie, écrit `config.js`, déploie sur Pages |
| `.github/workflows/check.yml` | Vérification sur les branches et pull requests |
| `scripts/check.mjs` | Syntaxe, fichiers référencés, config vide, recherche de secrets |
| `test/` | Fausse API du bot et test de bout en bout (Playwright) |
| `docs/api.md` | Routes et sécurité attendues de l'API du bot |

## Mise en ligne

Adresse du site : **https://fsnalmer.github.io/embot/** (dépôt `fsnalmer/embot`, public).

1. **Fusionner** la pull request sur `main` : le workflow de déploiement ne se lance que sur `main`.
2. **GitHub Pages** : *Settings → Pages → Build and deployment → Source : GitHub Actions*.
3. **Variables** : *Settings → Secrets and variables → Actions → onglet Variables → New repository variable* :
   * `HEYEM_API_URL` : adresse HTTPS de l'API du bot, **sans `/` final** (ex. `https://api.mondomaine.fr`) ;
   * `DISCORD_CLIENT_ID` : *Application ID* de l'application Discord.

   Ce sont des variables (publiques dans le site), pas des secrets. Le *client secret* ne va **jamais** dans GitHub.
4. **Déployer** : onglet *Actions → « Déployer le dashboard » → Run workflow* (ou nouveau push sur `main`). Le workflow vérifie le projet, écrit `config.js` avec les deux variables (il échoue si elles sont mal formées) puis publie. L'adresse s'affiche à la fin.
5. **Discord Developer Portal** → *OAuth2 → Redirects → Add* : `https://fsnalmer.github.io/embot/` (avec le `/` final, à l'identique). Le site calcule toujours cette adresse, même ouvert via `…/embot/index.html`.
6. **Bot** (dépôt privé du bot, `docs/DASHBOARD.md`) : dans son `.env`, `DASHBOARD_ORIGIN=https://fsnalmer.github.io` (sans `/embot`), `DASHBOARD_REDIRECT_URI=https://fsnalmer.github.io/embot/`, `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET`. L'API doit être joignable en HTTPS à l'adresse donnée à `HEYEM_API_URL`.
7. **Tester** : ouvrez le site, *Se connecter avec Discord*, choisissez un serveur, modifiez un réglage, enregistrez, rechargez la page, puis vérifiez dans Discord (`/config`) que la valeur est la même.

> Si le jeton du bot a déjà été publié quelque part, régénérez-le (*Developer Portal → Bot → Reset Token*).

## Développement

Node 20 ou plus, aucune dépendance à installer.

```bash
npm run check   # vérification du projet
npm test        # vérification + tests de bout en bout (nécessite Playwright et Chromium)
```

`npm test` termine par `test/e2e-real-api.mjs`, qui lance la **vraie** API Python face au site dans un navigateur ; il est ignoré tant que `HEYEM_BOT_DIR` n'est pas défini (copie locale du dépôt du bot, dépendances installées, et `HEYEM_PYTHON` pour son interpréteur).

Le test sert le site sous `/embot/` face à une fausse API et couvre : connexion OAuth simulée (faux `state` refusé), liste des serveurs, enregistrement, erreur 422, bot hors ligne avec « Réessayer », jeton expiré, configuration vide.

Non couvert : l'échange réel avec Discord (identifiants requis), le bot connecté à un vrai serveur, et le workflow GitHub Actions (exécutable seulement sur GitHub).

## Ajouter un réglage

Les formulaires sont générés depuis `site/modules.js` : ajoutez un champ (`bool`, `int`, `text`, `longtext`, `color`, `select`, `channel`, `channels`, `role`, `roles`, `template`, `access`) dont la `key` correspond au réglage du bot. L'API reste la seule source de validation.
