FROM php:8.2-cli

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libcurl4-openssl-dev \
    && docker-php-ext-install pdo pdo_pgsql curl

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Ajout : créer .env si absent
COPY .env.example .env
# Install PHP dependencies
RUN composer install

RUN mkdir -p /app/config/jwt \
    && openssl genrsa -out /app/config/jwt/private.pem -aes256 -passout pass:$(head -c 32 /dev/urandom | xxd -p) 4096 \
    && openssl rsa -pubout -in /app/config/jwt/private.pem -passin pass:$(head -c 32 /dev/urandom | xxd -p) -out /app/config/jwt/public.pem

# Générer un APP_SECRET aléatoire et l'injecter dans .env
RUN APP_SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64) && \
    sed -i "s/^APP_SECRET=.*/APP_SECRET=${APP_SECRET}/" .env


# Expose port 8000 and start the server
EXPOSE 8000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]