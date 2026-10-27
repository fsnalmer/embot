#!/usr/bin/env bash
# Rend et encode les shorts : bash render/make_shorts.sh [nom …]  (depuis tvec-official/)
set -e
FR=${FRAMES_DIR:-/tmp/tvec_short_frames}; mkdir -p out/shorts "$FR"
for v in ${@:-money steps ranked faq sponsors spotlight}; do
  d="$FR/$v"; mkdir -p "$d"
  for w in 0 1 2 3; do node render/shorts_render.cjs $v $w 4 "$d" & done; wait
  ffmpeg -hide_banner -v error -y -framerate 30 -i "$d/f_%04d.jpg" -i audio/shorts/$v.wav -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -level 4.2 -r 30 -movflags +faststart -c:a aac -b:a 256k -ar 44100 -shortest out/shorts/TVEC_$v.mp4
  echo "DONE $v"
done
