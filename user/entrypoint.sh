#!/bin/sh
set -e

echo "Entrypoint script started..."
echo "Running migrations..."
php bin/console doctrine:migration:diff --no-interaction
php bin/console doctrine:migrations:migrate --no-interaction
echo "Generating JWT keys..."
php bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction
echo "Generating RSA keys..."
php bin/console app:generate-rsa-keys

exec "$@"