# Contrat de l'API du bot

Le site est statique : il parle uniquement à l'API HTTP du bot (`HEYEM_API_URL`). Toutes les réponses sont du JSON. Les identifiants Discord (serveurs, salons, rôles, membres) sont **toujours des chaînes** (un snowflake dépasse la précision d'un nombre JavaScript).

## Sécurité attendue côté bot

* **CORS** : renvoyer `Access-Control-Allow-Origin: <DASHBOARD_ORIGIN>` (jamais `*`), avec `Authorization, Content-Type` autorisés et les méthodes `GET, POST, PUT, OPTIONS`.
* **HTTPS** obligatoire (le site refuse une API en `http://` hors `localhost`).
* Le **client secret** Discord ne vit que dans l'API du bot : le site envoie le `code` OAuth, l'API l'échange.
* Jeton de session aléatoire, révocable, à durée limitée (l'implémentation de référence ne garde que son hachage SHA-256). Le site l'envoie en `Authorization: Bearer <jeton>`.
* Limiter les tentatives sur `/auth/discord` et refuser tout `redirect_uri` différent de celui configuré côté bot.
* Vérifier **à chaque requête** que l'utilisateur peut gérer le serveur demandé (`403` sinon) ; ne jamais se fier au site.

## Erreurs

Corps : `{"error": "message lisible"}`. Pour `422` : `{"error": "…", "fields": {"clé_du_réglage": "message"}}`.

| Code | Sens | Comportement du site |
|---|---|---|
| 401 | Jeton absent, invalide ou expiré | Jeton supprimé, « Session expirée » |
| 403 | Pas le droit de gérer ce serveur, ou serveur inconnu du bot (même réponse, pour ne pas révéler où le bot est installé) | « Accès refusé » |
| 404 | Module ou route inconnu | « Introuvable » |
| 422 | Valeur refusée | Message sous le champ concerné |
| 429 | Trop de tentatives | Message d'erreur |

## Routes

### `POST /auth/discord`
Corps : `{"code": "<code OAuth>", "redirect_uri": "<URL du site>"}`. L'API échange le code avec Discord (scope `identify` seulement : le site ne demande pas la liste de vos serveurs, c'est le bot qui sait lesquels vous pouvez gérer) et répond :
```json
{"token": "…", "user": {"id": "42", "username": "Noah", "avatar": "hash ou null"}}
```

### `POST /auth/logout`
Révoque le jeton envoyé. Répond `{"ok": true}` (idempotent).

### `GET /api/me`
`{"id": "42", "username": "Noah", "avatar": null}`

### `GET /api/guilds`
Serveurs où le bot est présent **et** que l'utilisateur peut configurer (mêmes règles que `/config`) :
```json
[{"id": "111", "name": "Mon serveur", "icon": "hash ou null", "bot_present": true}]
```

### `GET /api/guilds/{id}`
```json
{
  "id": "111", "name": "Mon serveur", "icon": null,
  "channels": [{"id": "201", "name": "général", "type": "text"}],
  "roles": [{"id": "301", "name": "Admin"}],
  "settings": {"welcome": {"enabled": false, "welcome_channel": null}}
}
```
`type` d'un salon : `text`, `announcement`, `voice` ou `category`. `settings` contient un objet par module (clés : voir `site/modules.js`), avec les valeurs par défaut du bot complétées par les valeurs enregistrées. Les IDs y sont des chaînes.

### `PUT /api/guilds/{id}/settings/{module}`
Corps : `{"changes": {"clé": valeur}}` — uniquement les réglages modifiés. L'API valide (types, bornes, salons/rôles existants), enregistre, **relit** la valeur stockée et répond `{"settings": {…module complet…}}`.

Particularités des valeurs :

* Salons et rôles : identifiant en **chaîne** (ou `null`) ; listes : tableau de chaînes. L'API vérifie qu'ils existent sur le serveur (et le type de salon attendu).
* Modèles de message (`welcome_msg`, `leave_msg`) : on n'envoie que `{"title", "text"}` ; `style` et `image` sont conservés côté bot.
* Accès (`access.config`, `access.moderation`) : on n'envoie que `{"roles": […]}` ; les membres individuels, gérés dans Discord, sont conservés.
* Un `changes` contenant une valeur refusée n'enregistre **rien** (réponse 422 avec `fields`).

Implémentation de référence : le dépôt (privé) du bot, `heyemtv/dashboard_api.py` et `docs/DASHBOARD.md`.
