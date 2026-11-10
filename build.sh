#!/bin/bash
cd "$(dirname "$0")"
{ cat src/01_head.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script>'
  cat src/00_i18n.js
  for f in src/i18n/*.json; do
    echo "I18N['$(basename "$f" .json)'] = $(cat "$f");"
  done
  cat src/02_core.js src/03_net_host.js src/04_client.js src/05_ui.js
  echo '</script>'; } > index.html
