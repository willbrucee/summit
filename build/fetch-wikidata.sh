#!/usr/bin/env bash
# Refresh the cached Wikidata results in data/raw. The build reads only the cache,
# so it works offline and gives the same output every time.
set -euo pipefail
cd "$(dirname "$0")/sparql"
for f in *.rq; do
  n="${f%.rq}"
  curl -sS -G "https://query.wikidata.org/sparql" --data-urlencode "query@$f" \
    -H "Accept: application/sparql-results+json" \
    -H "User-Agent: SummitGameBuild/0.1 (static quiz game data build)" \
    -o "../../data/raw/$n.json"
  echo "$n: $(node -e "console.log(require('../../data/raw/$n.json').results.bindings.length)") rows"
  sleep 1
done
