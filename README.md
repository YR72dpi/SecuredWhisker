# Secured Whisker — Encrypted, privacy-first messaging

![Banner](docs/banner.png)

<sub><i>
AI-Generated and photoshopped logo
</i></sub>

---

Secured Whisker is a secure messaging application built around privacy-by-default. Client-side end-to-end encryption, per-user RSA key management, and a microservices architecture make the project scalable and production-ready.

Why Secured Whisker?

- Privacy-first: private keys are owned and managed by users in their browsers.
- Real-time: WebSocket-based message delivery for low-latency communication.
- Extensible: microservices (Symfony, Go, Next.js) and an optional translation service.
- Developer-friendly: Docker Compose, CI workflows and clear modular structure.

[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/security-check-symfony.yml/badge.svg?branch=main "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/security-check-symfony.yml?query=branch%3Amain)
[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/security-check-go.yml/badge.svg?branch=main "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/security-check-go.yml?query=branch%3Amain)
[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/security-check-nextjs.yml/badge.svg?branch=main "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/security-check-front.yml?query=branch%3Amain)
[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/lint-nextjs.yml/badge.svg?branch=dev "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/lint-nextjs.yml?query=branch%3Adev)

## 😎 Features 

- Secure signup & authentication
- End-to-end encrypted messaging (RSA + AES hybrid)
- Add contacts via unique tag identifiers
- Optional translation via GPT-based service
- Push notifications and PWA support
- Secure private-key transfer (QR / passphrase)

## ⚠️ Warning ⚠️

The __RSA private key is stored in your browser__. If you clean up “Cookies and site data”, this key, which is used to decrypt messages, will be lost. 😲

## 📚 Documentation

- [📜 Changelog](./docs/changelog.md)
- [🧭 Q&A Policy](./docs/Q&A_POLICY.md)
- [🧑‍⚖️ RGPD Policy](./docs/RGPD.md)
- [🤝 Contributing Guidelines](./CONTRIBUTING.md)
- [🔐 Security Policy](./SECURITY.md)
- [🏗️ Technical Architecture](./ARCHITECTURE.md)
- [⚙️ How the security works](./docs/HOW_IT_WORKS.md)



## 🤔 How to use 

<!-- docker-compose --env-file .env.dev -f docker-compose.dev.yml up -->

``` bash 
git clone --recurse-submodules https://github.com/YR72dpi/SecuredWhisker.git
cd SecuredWhisker
mv .env.example .env
# Now, edit .env, I can't do everything for you.
sudo docker compose up --build -d
```

That's all.

### Configuration

You mainly need to modify :

- ``SERVER_HOST`` : that's the user microservice
- ``SOCKET_HOST`` : the websocket server who transmit the messages
- ``NEXTJS_DOMAIN`` : The front end

```env
# SecuredWhisker
VERSION=1.3.4

# User manager (Symfony, PHP) 
APP_ENV=dev
DATABASE_URL="pgsql://root:securedwhisker@localhost:5432/securedwhisker?serverVersion=16&charset=utf8"
CORS_ALLOW_ORIGIN='^.*$'
SYMFONY_PORT=5000
SERVER_HOST=[YOUR_SERVER_DOMAIN_OR_IP]
LIMIT_MESSAGES_AGE="-1 week"
###> nelmio/cors-bundle ###

# message service (Fiber, GO)
SHOW_ONLY_ERROR=false
SOCKET_PORT=5050
SOCKET_HOST=[YOUR_SERVER_IP]

# To complete

# Frontend
NEXTJS_PORT=5010
NEXTJS_DOMAIN=[YOUR_FRONTEND_DOMAIN_OR_IP]
IP_WHITELIST="ip,ip,ip"
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

#TextManagerGPT
NEXT_PUBLIC_GPT_API_KEY=""
TextManagerGPT_PORT=5020

# POSTGRES (for docker compose)
POSTGRES_DB=securedwhisker
POSTGRES_PASSWORD=securedwhisker
POSTGRES_USER=root
POSTGRES_PORT=5432
POSTGRES_VERSION=

```

## ChangeLog

## [1.3.4] - 2025-10-30

### Added

- Display an invitation to install the pwa on iOS
- Notification Web push
    - Subscribe a device
    - page to remove notifications for each device linked to the account

### Changed

-

### Fixed

-

---

## To improve it

- Create groups
- Crypt private key on local storage in AES with the user password
- send image (transmit the base64) (which means that you have to determine the type of message)
- passing all of the stack in typescript (no php) (or in Go, who know ?)
- Reload /chat when fetching contact fail
- Versionning (de)crypting message mode
- Manage multiple display of recorded messages received
- Friendship management
- Show how many unseen message by contact
- Save private key on the serveur, crypted by a password defined by the user

## Support me 😘

<a href="http://buymeacoffee.com/yr72dpi">
<img style="border-radius: 15px; max-width: 300px;" src="./docs/bmac.png" style="width: 50%;">
</a>