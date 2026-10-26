# Rapport de contrôle qualité

## Fichier final (mesuré avec ffprobe / ffmpeg)
| Contrôle | Résultat |
|---|---|
| Format | MP4 H.264 High, yuv420p, 1080×1920 (9:16), 30 fps constant, 1020 images, 34,000 s |
| Audio | AAC-LC stéréo 44,1 kHz, −13,1 LUFS, crête vraie −1,0 dBFS, LRA 2,7 LU |
| Décodage | Complet sans erreur (`ffmpeg -f null`) |
| Images noires | 0 détectée (`blackdetect`), luminance min 9,5/255 |
| Images figées | 0 séquence immobile ≥ 0,7 s ; plus longue séquence quasi statique 0,43 s ; 0 image dupliquée |
| Synchronisation | Corrélation croisée « variation d'image » / « attaque audio » : décalage global 0 image. Aux 19 temps forts, écart médian ±1–2 images (≤ 0,17 s dans le pire cas, aux endroits où plusieurs impacts se chevauchent) |

## Contrôle visuel
Inspection image par image aux moments critiques (hook, chaque transition, compteurs, final) et planches contact à 2 images/s. Problèmes trouvés et corrigés pendant la production : tailles de texte mal calculées (mesure faite dans des scènes masquées), tunnel d'affiches trop petit/désordonné, premier « slash » masqué par le suivant, chevauchement texte/barres du panneau « jury », art 3D qui noyait le logo final, zone morte 27–28 s (remplacée par la reprise du hook), éléments dans la zone des boutons TikTok (colonnes ramenées à x ≤ 960, bouton centré).
Marges de sécurité : texte principal entre y≈230 et y≈1500 ; logo d'en-tête à y≈128–200 ; colonnes et boutons tenus à x ≤ 960 à droite.
Limite : le rendu **à vitesse normale** a été jugé par mesures (continuité, synchro) et par échantillonnage dense, pas par visionnage humain ; un dernier visionnage sur téléphone est recommandé.
Photosensibilité : 4 flashs violets/blancs brefs (≈0,2 s) sur 34 s, jamais plus de 3 par seconde.

## Exactitude des informations (source : tvec.gg, relevé le 2026-10-26)
| Affiché | Source / vérification |
|---|---|
| COMPETE. CREATE. WIN. · Your talent deserves to be paid · The premium platform for paid edit contests… · Start Competing | Page `/editors` (hero) |
| 7 catégories : Music, Film/Series, Anime, Gaming, Creators, Community, Brand | Page `/sponsors` (« Choose your world ») |
| €9,500 « across 7 TVEC contests » | Somme calculée des 7 cashprizes affichés (2000 + 3×1500 + 3×1000) — `research/verified_data.json` |
| 57M+ vues · 715 inscriptions | Somme calculée : 57 144 522 vues, 715 entries sur les 7 pages concours (le « 57M+ » est un arrondi inférieur) |
| YOU EDIT. YOU POST. YOU CASH. · paid out to your PayPal | `/editors` (« Three steps ») et FAQ |
| Ranked : Season 01, 16 rangs Bronze III→Ultimate, seuils TR, Top 100 | Page `/ranked` |
| 100 % free · unlimited entries · entry free, no subscription | `/editors`, FAQ |
| Talent, not audience size · jury · critères propres à chaque concours | Page About, FAQ |
| Creativity 60 % / Execution 40 % | Critères du concours SEM DEMORA (présenté comme exemple) |
| Withdraw from €10 · frais TVEC de 2 % du net, affiché avant confirmation | About, FAQ |
| Your TikTok / views / followers remain yours | `/editors` (« Gain visibility ») |
| 2 422 665 vues « on a single contest — SEM DEMORA » | Page du concours SEM DEMORA |
| « Rewards depend on each contest's rules and are not guaranteed » | Mention ajoutée (aucune promesse de gain) |

Textes de création (non issus du site, assumés comme copie publicitaire) : « Real contests. Real cashprizes », « It's already paying », « Real editors. Real wins. », « Why TVEC ».
Non utilisés volontairement : pseudos et vidéos des participants, extraits de la page Discover, seuil de followers, tout chiffre non vérifié.

## Droits et ressources
- Musique : originale, synthétisée par code, aucune piste tierce.
- Visuels : ressources servies publiquement par tvec.gg (`robots.txt` autorise l'exploration des pages utilisées). **À confirmer par TVEC** : usage vidéo de la police Suprapower, des affiches (artistes crédités sur les visuels) et du logo.
- Aucun filigrane, élément de montage, texte coupé ou image déformée relevé sur les images inspectées.
