#!/usr/bin/env bash
# Rebuilds music/christmas-lofi.mp3 from the source tracks listed in
# music/CREDITS.md: loudness-normalizes each, joins them with 2-second
# crossfades, and encodes one 192 kbps MP3. Needs ffmpeg.
#
#   tools/mix-music.sh <folder of downloaded tracks> music
#
# Track files are named by their Free Music Archive page slug (e.g.
# first-snowmp3.mp3). Only add tracks licensed CC0, CC BY or CC BY-SA.
set -euo pipefail
D=$1; O=$2
order=(first-snowmp3 angels-we-have-heard-on-high-lo-fi winter-blues silent-night-lo-fi christmas-market-id-2402 snow-drift oh-holy-night-lo-fi 2-hour-delay-1 sheperd-angels-id-2405 fire-place auld-lang-syne-lo-fi)
args=(); f=""; n=${#order[@]}
for ((i=0;i<n;i++)); do args+=(-i "$D/${order[$i]}.mp3"); f+="[$i:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[n$i];"; done
prev="n0"; for ((i=1;i<n;i++)); do f+="[$prev][n$i]acrossfade=d=2:c1=tri:c2=tri[x$i];"; prev="x$i"; done
f="${f%;}"
ffmpeg -hide_banner -loglevel error -y "${args[@]}" -filter_complex "$f" -map "[$prev]" -ar 44100 -c:a libmp3lame -b:a 192k \
  -metadata title="Claude Christmas Lofi (CC0 / CC BY)" -metadata artist="HoliznaCC0; Lobo Loco" \
  -metadata comment="Credits and licenses: music/CREDITS.md in claude-desktop-christmas-themes" \
  "$O/christmas-lofi.mp3"
