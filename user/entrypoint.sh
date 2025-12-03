#!/bin/sh
set -e

echo "--- copy_vendor.sh: ensure /app/vendor exists ---"

if [ ! -d /app/vendor ] || [ -z "$(ls -A /app/vendor 2>/dev/null)" ]; then
  echo "Copying vendor from image snapshot to /app/vendor ..."
  mkdir -p /app/vendor
  if [ -d /opt/vendor/vendor ]; then
    cp -a /opt/vendor/vendor/. /app/vendor/ || true
  else
    cp -a /opt/vendor/. /app/vendor/ || true
  fi
  if command -v id >/dev/null 2>&1; then
    CHOWN_UID=$(id -u)
    CHOWN_GID=$(id -g)
    chown -R "${CHOWN_UID}:${CHOWN_GID}" /app/vendor 2>/dev/null || true
  fi
else
  echo "/app/vendor already present, skipping copy"
fi

echo "--- Entrypoint script started... ---"
echo "------------------------------------"
echo "Generating JWT keys..."
php bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction || true
echo "------------------------------------"
echo "Generating RSA keys..."
php bin/console app:generate-rsa-keys || true
echo "------------------------------------"
echo "Clearing the symfony cache"
php bin/console cache:clear --no-interaction || true
echo "------------------------------------"
echo "Running migrations..."
php bin/console doctrine:migration:diff --no-interaction
php bin/console doctrine:migrations:migrate --no-interaction


exec "$@"