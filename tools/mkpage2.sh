#!/usr/bin/env bash
set -euo pipefail
file="$1"; title="$2"; desc="$3"; key="$4"
{
cat <<HEAD
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="theme-color" content="#0a0b0f">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body data-page="${key}">
<main id="main">
HEAD
cat
cat <<TAIL
</main>
<script src="data/config.js"></script>
<script src="data/seasons/2025.js"></script>
<script src="data/seasons/2026.js"></script>
<script src="data/news.js"></script>
<script src="data/gallery.js"></script>
<script src="assets/js/engine.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/pages/${key}.js"></script>
</body>
</html>
TAIL
} > "$file"
echo "wrote $file"
