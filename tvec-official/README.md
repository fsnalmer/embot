# TVEC — Official Edit (9:16)

**Vidéo finale : `out/TVEC_official_edit_1080x1920.mp4`**
H.264 High 4.2 · 1080×1920 · 30 fps constant (1020 images) · yuv420p · AAC-LC stéréo 44,1 kHz 256 kb/s · **34,0 s** · ≈ 28 Mo · −13,1 LUFS intégré, crête vraie −1,0 dBFS.

Edit promotionnel « teaser » construit à partir de l'identité réelle de https://tvec.gg (typographie Suprapower, noir + violet `#8545ed`, logo « V », grille de points, boutons biseautés, affiches officielles des concours). Les chiffres affichés viennent du site (relevé du 2026-10-26, voir `research/verified_data.json`).

Le dossier `../tvec/` (premier montage « carrousel ») n'est pas modifié.

## Structure
| Dossier | Contenu |
|---|---|
| `out/` | Vidéo finale MP4 |
| `compositions/video.html` | Composition motion design complète (HTML/CSS/JS). Toute l'animation est pilotée par `seek(t)` : déterministe, sans dépendance. Textes modifiables directement. |
| `render/` | `crawl.cjs` / `crawl_faq.cjs` / `crawl_editor.cjs` (exploration du site), `shot.cjs` (captures de contrôle), `render.cjs` (rendu image par image) |
| `audio/make_audio.py` | Musique + sound design **100 % synthétisés** (numpy), 120 BPM, la mineur → `audio/tvec_official_soundtrack.wav` |
| `assets/` | Ressources officielles téléchargées depuis tvec.gg : 7 affiches de concours (`poster_*.webp`), art « V » 3D (`chooser-print…`, `hero-print…`), texture violette (`sponsor-print-texture…`), carte membre, logos, favicon, SVG du logo. + `grain.png`, `dots.png` générés. |
| `fonts/` | Suprapower Heavy + Inter (variable), servies par tvec.gg |
| `research/` | Texte de chaque page explorée (`pages/*.json`), réponses de la FAQ, données vérifiées (`verified_data.json`), liste des médias réseau |
| `STORYBOARD.md` · `QC_REPORT.md` | Storyboard réalisé · rapport de contrôle qualité |

## Relancer le rendu
Prérequis : Node 22 + `playwright` (Chromium), Python 3 + numpy, ffmpeg.
```bash
cd tvec-official
python3 audio/make_audio.py                                   # musique
F=/tmp/tvec_frames; mkdir -p $F
for w in 0 1 2 3; do node render/render.cjs $w 4 $F 30 34 & done; wait   # 1020 images
ffmpeg -framerate 30 -i $F/f_%04d.jpg -i audio/tvec_official_soundtrack.wav \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -level 4.2 -r 30 -movflags +faststart \
  -c:a aac -b:a 256k -ar 44100 -shortest out/TVEC_official_edit_1080x1920.mp4
node render/shot.cjs /tmp 4.3 28.8      # captures de contrôle à des instants précis
```
Mettre à jour les chiffres : relancer `node render/crawl.cjs`, relire `research/verified_data.json`, puis ajuster `CONTESTS`, `LADDER` et les textes dans `compositions/video.html`.

## Limites à connaître
- **Pas de séquences vidéo d'edits** : le site ne fournit pas de vidéos téléchargeables, et les edits des participants (page Discover) appartiennent à leurs auteurs. La séquence « univers » est donc typographique + affiches officielles. Les 7 concours existants sont tous musicaux (Phonk) : les catégories Film/Anime/Gaming/etc. sont affichées comme catégories sponsors, sans fausses démos.
- **Droits à confirmer avant publication** : police Suprapower (fournie par tvec.gg), affiches (artistes crédités sur les visuels), logo. La musique est originale (aucune piste tierce). Aucune voix off.
- **Chiffres datés** : 57 144 522 vues, 715 inscriptions, 9 500 € de cashprizes (somme des 7 concours listés), 2 422 665 vues sur SEM DEMORA — relevés le 26/10/2026, ils évoluent.
