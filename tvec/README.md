# TVEC — Viral ad 9:16 (1080×1920, 30 fps, 35 s)

**Livrable : `TVEC_viral_ad_1080x1920.mp4`** (H.264 High, CRF 19, AAC 224 kb/s stéréo, ≈18 Mo, 35,0 s).

## Fabrication
| Fichier | Rôle |
|---|---|
| `video.html` | Composition motion design complète. Toute l'animation est pilotée par `seek(t)` (déterministe, sans dépendance). Textes modifiables directement dans le HTML. |
| `render/render.cjs` | Rendu image par image avec Playwright/Chromium (`node render/render.cjs <worker> <nWorkers> <dossier>`), 1050 images JPEG. |
| `audio/make_audio.py` | Sound design 100 % synthétisé (numpy) : musique électronique 120 BPM en la mineur + SFX, libre de droits. Produit `audio/tvec_soundtrack.wav`. |
| `build_assets.py` | Détoure les assets originaux depuis `refs/*.png` vers `assets/`. |
| `refs/` | Les 9 visuels de référence (originaux). |
| `assets/` | Affiches/polaroïds **originaux** (SEM DEMORA, FUNK, BAILA), carte « Breakdown », logo TVEC. Non redessinés ni déformés. |
| `fonts/` | Bricolage Grotesque 800 (titres), Manrope (texte), Caveat Brush (annotations manuscrites) — Google Fonts, licence OFL. |

Rebuild : `python3 build_assets.py && python3 audio/make_audio.py`, puis 4 workers `render.cjs` en parallèle, puis
`ffmpeg -framerate 30 -i frames/f_%04d.jpg -i audio/tvec_soundtrack.wav -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 224k -shortest out.mp4`

## Timeline (battement = 0,5 s, les coupes tombent sur les temps)
| Temps | Scène | Animation / son |
|---|---|---|
| 0:00–0:03 | Hook | Flash violet + impact, timeline et frames qui défilent, « STOP EDITING » (zoom + tremblement + micro-glitch, impact grave 0:00.5), « FOR **FREE.** » (bandeau violet tracé, coupure musicale + zap 0:01.5), titre découpé en 8 fragments |
| 0:03–0:06.5 | Révélation | Les 3 affiches originales entrent en rotation avec ombres (thuds), « GET PAID TO EDIT. », « REAL CONTESTS. REAL PRIZES. » |
| 0:06.5–0:10 | Argent | Wipe violet/menthe, « €9,500 » assemblé caractère par caractère (violet→menthe), « IN PRIZE POOLS », « 7 contests so far », succession de 3 affiches |
| 0:10–0:17 | 3 étapes | Interface d'éditeur minimaliste : 01 sélection d'une carte + son, 02 timeline qui se remplit de clips (CapCut / After Effects / Alight Motion), 03 aperçu → lien → envoi. Clics synchronisés |
| 0:17–0:22.5 | 2 façons de gagner | Panneaux BEST EDIT (couronne) / MOST VIEWS (flamme + compteur) entrant en sens opposés puis se joignant, « YOUR SKILLS. YOUR SHOT. », mention des règles |
| 0:22.5–0:26.5 | Preuve sociale | Compteurs qui s'arrêtent net : €5,935 · 29 editors · €900 · 715 |
| 0:26.5–0:30 | Accessible | Rythme calme, 4 coches violettes dessinées : Free to join / 10+ TikTok followers / any editing app / PayPal |
| 0:30–0:35 | CTA | Riser → logo TVEC + anneaux violets, « YOUR NEXT EDIT COULD PAY YOU. », bouton « JOIN FREE ON TVEC.GG → » (impact 0:31.5, survol + curseur simulés), CTA visible 3,5 s |

## Conformité du contenu
- Chiffres repris tels quels des visuels (€9,500 ; €5,935 ; 29 ; €900 ; 715 ; 7 contests) et présentés comme statistiques des visuels de référence (« stats as shown in TVEC's published visuals »). **À re-vérifier avant publication** : ils peuvent avoir changé.
- Mention affichée aux scènes 5 et 8 : « Prizes depend on each contest's rules. Entering does not guarantee a win. » Aucun gain n'est garanti.
- Le seuil de retrait PayPal (« from €10 ») des références n'est volontairement **pas** repris. Vérifier la condition « 10+ TikTok followers » avant diffusion.
- Aucun faux QR code ni lien inventé. Les interfaces de l'étape 4 sont décoratives. Le « 2.4M views » de la scène 5 est un compteur illustratif.
- Marges de sécurité TikTok : titres et CTA entre y≈130 et y≈1500, x≈60–1020.
- Pas de voix off (aucun moteur TTS ici) ; la vidéo se comprend sans le son. Script prêt à enregistrer : voir le brief.
