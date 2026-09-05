#!/usr/bin/env bash
# Usage: tools/mkpage.sh <file> <title> <description> <pagekey> <section:hub|f1|endurance> <root:""|"../"> < body.html
set -euo pipefail
file="$1"; title="$2"; desc="$3"; key="$4"; section="$5"; root="$6"
mkdir -p "$(dirname "$file")"
{
cat <<HEAD
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="theme-color" content="#08090b">
  <meta name="color-scheme" content="dark">
  <link rel="icon" href="${root}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="${root}manifest.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;700;900&family=Titillium+Web:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${root}assets/css/styles.css">
  <script>window.TRL_ROOT = "${root}";</script>
</head>
<body data-page="${key}" data-section="${section}">
<main id="main">
HEAD
cat
cat <<TAIL
</main>
<script src="${root}data/config.js"></script>
<script src="${root}data/seasons/2026.js"></script>
<script src="${root}data/endurance.js"></script>
<script src="${root}assets/js/engine.js"></script>
<script src="${root}assets/js/app.js"></script>
<script src="${root}assets/js/pages/${key}.js"></script>
</body>
</html>
TAIL
} > "$file"
echo "wrote $file"
