# Vice City Nights — GTA-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/wj-ship-it/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/wj-ship-it/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A make.fun bounty entry for **Make GTA 6 Cover Art** ($250 in USDC).

Vice City Nights turns your photo and a caption into GTA-poster-style cover art:
a multi-panel poster grid (hero split, 4-panel Vice grid, or full bleed), bold
diagonal title lettering, and three Vice City colour grades — Sunset, Neon Nights,
and Vice City Pink. Upload your own photo or use the two AI-generated samples,
crop and position each panel by dragging, edit the title and subtitle, then
export a PNG in 1080×1080, 1080×1350, or 1920×1080. Everything runs offline in
the browser; photos never leave your machine.

Original art only: no Rockstar Games logo, artwork, or fonts anywhere. The
lettering is a heavy system font stack (Arial Black / Helvetica Bold), and the
two sample photos were made with an image model for make.fun and are free to use.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library (`vendor/makefun-app.ts`).
