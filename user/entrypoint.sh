#!/bin/sh
set -e

php bin/console doctrine:migrations:migrate --no-interaction || true
php bin/console doctrine:migration:diff --no-interaction || true
php bin/console app:generate-rsa-keys || true

exec "$@"