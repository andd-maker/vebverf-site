#!/usr/bin/env bash
# Выкатка сайта вебверфь.рф: репозиторий → /var/www/verf на priemka.
#   deploy/site_deploy.sh           — изменённые файлы, с бэкапом и смоуком
#   deploy/site_deploy.sh --dry     — только показать, что изменится
# Выкатывается только закоммиченное и запушенное (правило проекта: прод = origin/main).
set -euo pipefail

HOST=priemka
DIR=/var/www/verf
DOMAIN=https://xn--90abbkc0e2a8d.xn--p1ai        # вебверфь.рф в punycode
RS=(rsync -az --exclude 'blog/' --exclude '*.bak_*' --exclude '_backup_*' --exclude '.git/')
DRY=${1:-}

cd "$(dirname "$0")/.."

[ -z "$(git status --porcelain)" ] || { echo "Есть незакоммиченные правки — сначала commit"; exit 1; }
git fetch -q origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || { echo "HEAD не совпадает с origin/main — сначала push"; exit 1; }

# Что изменится: dry-run + разбор списка файлов
CHANGED=$("${RS[@]}" --dry-run --itemize-changes ./ "$HOST:$DIR/" | awk '$1 ~ /^[<>ch*]/ {print $2}' | grep -v '/$' || true)
if [ -z "$CHANGED" ]; then echo "Изменений нет — выкатывать нечего"; exit 0; fi
echo "== изменятся файлы ($(echo "$CHANGED" | wc -l | tr -d ' ')):"; echo "$CHANGED" | head -30
[ "$DRY" = "--dry" ] && { echo "(сухой прогон, ничего не залито)"; exit 0; }

TS=$(date +%Y%m%d_%H%M%S)
BK="$DIR/_backup_$TS"
echo "== бэкап изменяемых файлов → $BK"
echo "$CHANGED" | while read -r f; do
  [ -n "$f" ] || continue
  ssh "$HOST" "if [ -f '$DIR/$f' ]; then mkdir -p '$BK/$(dirname "$f")' && cp -p '$DIR/$f' '$BK/$f'; fi"
done

echo "== заливка → $HOST:$DIR"
"${RS[@]}" ./ "$HOST:$DIR/"

echo "== смоук"
for path in / /blog/ /proekt-priemka.html /letopis.html; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$DOMAIN$path" || true)
  echo "  $code  $path"
  [ "$code" = "200" ] || { echo "Страница $path не отвечает 200 — откат: файлы в $BK"; exit 1; }
done
echo "✓ выкачено. Бэкап изменённых файлов: $BK"
