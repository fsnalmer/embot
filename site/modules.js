// Description des modules du bot et de leurs réglages (les clés correspondent aux réglages du bot).
// Types de champs : bool, int, text, longtext, color, select, channel, channels, role, roles, template, access.

const on = { key: "enabled", type: "bool", label: "Module activé" };

export const MODULES = [
  {
    key: "general", emoji: "🎨", label: "Général et apparence", toggle: false,
    description: "Couleur et pied de page des messages du bot",
    fields: [
      { key: "color", type: "color", label: "Couleur des messages" },
      { key: "footer", type: "text", label: "Pied de page", max: 100 },
      { key: "show_footer", type: "bool", label: "Afficher le pied de page" },
    ],
  },
  {
    key: "welcome", emoji: "👋", label: "Arrivées et départs",
    description: "Messages de bienvenue et d'au revoir",
    fields: [
      on,
      { key: "welcome_on", type: "bool", label: "Annoncer les arrivées" },
      { key: "welcome_channel", type: "channel", label: "Salon des arrivées" },
      { key: "welcome_msg", type: "template", label: "Message d'arrivée", hint: "Variables : {user} {username} {server} {count}" },
      { key: "leave_on", type: "bool", label: "Annoncer les départs" },
      { key: "leave_channel", type: "channel", label: "Salon des départs" },
      { key: "leave_msg", type: "template", label: "Message de départ" },
      { key: "mention_member", type: "bool", label: "Mentionner le nouveau membre" },
      { key: "announce_bots", type: "bool", label: "Annoncer aussi les bots" },
      { key: "excluded_roles", type: "roles", label: "Rôles exclus des annonces" },
    ],
  },
  {
    key: "autoroles", emoji: "🏷️", label: "Rôles automatiques",
    description: "Rôles donnés aux nouveaux membres",
    fields: [
      on,
      { key: "member_roles", type: "roles", label: "Rôles des membres" },
      { key: "bot_roles", type: "roles", label: "Rôles des bots" },
    ],
  },
  {
    key: "tickets", emoji: "🎫", label: "Tickets",
    description: "Support par salons privés",
    fields: [
      on,
      { key: "panel_channel", type: "channel", label: "Salon du panneau" },
      { key: "category", type: "channel", kinds: ["category"], label: "Catégorie des tickets" },
      { key: "support_roles", type: "roles", label: "Rôles du support" },
      { key: "ping_support", type: "bool", label: "Mentionner le support" },
      { key: "max_per_user", type: "int", label: "Tickets ouverts par membre", min: 1, max: 20 },
      { key: "owner_can_close", type: "bool", label: "Le créateur peut fermer" },
      { key: "confirm_close", type: "bool", label: "Confirmer la fermeture" },
      { key: "panel_title", type: "text", label: "Titre du panneau", max: 100 },
      { key: "panel_text", type: "longtext", label: "Texte du panneau", max: 1000 },
      { key: "transcripts", type: "bool", label: "Enregistrer les transcripts" },
      { key: "transcript_channel", type: "channel", label: "Salon des transcripts" },
      { key: "log_channel", type: "channel", label: "Salon des logs" },
    ],
  },
  {
    key: "levels", emoji: "📈", label: "Niveaux et expérience",
    description: "XP, niveaux et récompenses",
    fields: [
      on,
      { key: "xp_min", type: "int", label: "XP minimum par message", min: 0, max: 500 },
      { key: "xp_max", type: "int", label: "XP maximum par message", min: 0, max: 500 },
      { key: "cooldown", type: "int", label: "Délai anti-farm (secondes)", min: 0, max: 3600 },
      { key: "channel_mode", type: "select", label: "Salons concernés", options: [["all", "Tous"], ["allow", "Seulement ceux choisis"], ["deny", "Tous sauf ceux choisis"]] },
      { key: "channels", type: "channels", label: "Salons choisis" },
      { key: "excluded_roles", type: "roles", label: "Rôles exclus" },
      { key: "announce_mode", type: "select", label: "Annonce du niveau", options: [["same", "Dans le salon du message"], ["channel", "Dans un salon dédié"], ["dm", "En message privé"], ["off", "Aucune"]] },
      { key: "announce_channel", type: "channel", label: "Salon d'annonce" },
      { key: "announce_mention", type: "bool", label: "Mentionner le membre" },
      { key: "stack_rewards", type: "bool", label: "Cumuler les récompenses de rôles" },
      { key: "leaderboard_size", type: "int", label: "Taille du classement", min: 3, max: 25 },
    ],
  },
  {
    key: "moderation", emoji: "🔨", label: "Modération",
    description: "Avertissements, sanctions, historique",
    fields: [
      on,
      { key: "dm_user", type: "bool", label: "Prévenir le sanctionné en MP" },
      { key: "require_reason", type: "bool", label: "Motif obligatoire" },
      { key: "warn_threshold", type: "int", label: "Avertissements avant sanction", min: 1, max: 20 },
      { key: "warn_action", type: "select", label: "Sanction automatique", options: [["timeout", "Exclusion temporaire"], ["kick", "Expulsion"], ["ban", "Bannissement"]] },
      { key: "warn_timeout_minutes", type: "int", label: "Durée de l'exclusion (minutes)", min: 1, max: 40320 },
    ],
  },
  {
    key: "automod", emoji: "🛡️", label: "Anti-spam et anti-raid",
    description: "Protection automatique",
    fields: [
      on,
      { key: "spam_on", type: "bool", label: "Anti-flood" },
      { key: "max_messages", type: "int", label: "Messages max", min: 2, max: 50 },
      { key: "interval", type: "int", label: "Sur combien de secondes", min: 1, max: 60 },
      { key: "duplicates", type: "int", label: "Messages identiques max", min: 2, max: 20 },
      { key: "invites_on", type: "bool", label: "Bloquer les invitations" },
      { key: "links_on", type: "bool", label: "Bloquer les liens" },
      { key: "mentions_on", type: "bool", label: "Limiter les mentions" },
      { key: "max_mentions", type: "int", label: "Mentions max", min: 2, max: 50 },
      { key: "timeout_minutes", type: "int", label: "Exclusion (minutes)", min: 1, max: 40320 },
      { key: "exempt_roles", type: "roles", label: "Rôles ignorés" },
      { key: "exempt_channels", type: "channels", label: "Salons ignorés" },
      { key: "raid_on", type: "bool", label: "Détection de raid" },
      { key: "raid_joins", type: "int", label: "Arrivées déclenchant l'alerte", min: 2, max: 100 },
      { key: "raid_window", type: "int", label: "Fenêtre (secondes)", min: 1, max: 300 },
      { key: "raid_min_age_days", type: "int", label: "Âge minimum des comptes (jours)", min: 0, max: 365 },
      { key: "raid_action", type: "select", label: "Action en cas de raid", options: [["alert", "Alerte seulement"], ["timeout", "Exclusion"], ["kick", "Expulsion"]] },
    ],
  },
  {
    key: "logs", emoji: "📜", label: "Logs et historique",
    description: "Journal des événements du serveur",
    fields: [
      on,
      { key: "channel", type: "channel", label: "Salon des logs" },
      { key: "retention_days", type: "int", label: "Conservation (jours)", min: 1, max: 3650 },
    ],
  },
  {
    key: "suggestions", emoji: "💡", label: "Suggestions",
    description: "Boîte à idées avec votes",
    fields: [
      on,
      { key: "channel", type: "channel", label: "Salon des suggestions" },
      { key: "staff_roles", type: "roles", label: "Rôles du staff" },
      { key: "create_thread", type: "bool", label: "Créer un fil de discussion" },
      { key: "anonymous", type: "bool", label: "Suggestions anonymes" },
      { key: "reason_required", type: "bool", label: "Motif obligatoire pour trancher" },
    ],
  },
  {
    key: "giveaways", emoji: "🎉", label: "Giveaways et concours",
    description: "Tirages au sort",
    fields: [
      on,
      { key: "channel", type: "channel", label: "Salon" },
      { key: "ping_role", type: "role", label: "Rôle mentionné" },
      { key: "manager_roles", type: "roles", label: "Rôles gestionnaires" },
      { key: "dm_winners", type: "bool", label: "Prévenir les gagnants en MP" },
    ],
  },
  {
    key: "polls", emoji: "📊", label: "Sondages",
    description: "Sondages avec résultats en direct",
    fields: [
      on,
      { key: "channel", type: "channel", label: "Salon" },
      { key: "ping_role", type: "role", label: "Rôle mentionné" },
      { key: "manager_roles", type: "roles", label: "Rôles créateurs" },
    ],
  },
  {
    key: "social", emoji: "📣", label: "Réseaux sociaux et annonces",
    description: "Flux RSS/YouTube et annonces",
    fields: [on],
  },
  {
    key: "access", emoji: "🔐", label: "Permissions et accès", toggle: false,
    description: "Qui peut configurer et modérer",
    fields: [
      { key: "config", type: "access", label: "Utiliser /config", hint: "Les membres individuels se gèrent dans Discord ; ils sont conservés." },
      { key: "moderation", type: "access", label: "Utiliser la modération" },
    ],
  },
];

export const MODULE_BY_KEY = Object.fromEntries(MODULES.map((m) => [m.key, m]));
