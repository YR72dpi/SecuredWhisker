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

For an extra layer of protection, the companion project [SecuredWhisker KeyBox](https://github.com/YR72dpi/SecuredWhisker-keybox) moves the RSA private key out of the browser and into a dedicated offline hardware device, reducing the risk of loss or theft while keeping decryption under your control.

## 📚 Documentation

- [📜 Changelog](./docs/changelog.md)
- [🧭 Q&A Policy](./docs/Q&A_POLICY.md)
- [🧑‍⚖️ RGPD Policy](./docs/RGPD.md)
- [🤝 Contributing Guidelines](./CONTRIBUTING.md)
- [🔐 Security Policy](./SECURITY.md)
- [🏗️ Technical Architecture](./ARCHITECTURE.md)
- [⚙️ How the security works](./docs/HOW_IT_WORKS.md)

You can copy the key pair too and save it yourself.


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

Copy [`.env.example`](./.env.example) to `.env` for the production stack, or
copy [`.env.dev.example`](./.env.dev.example) to `.env.dev` for development.
Set `SERVER_HOST`, `SOCKET_HOST`, and `NEXTJS_DOMAIN` to the hostnames used by
your deployment. Set `GPT_API_KEY` for the translation service and configure
`VAPID_PUBLIC_KEY` with its matching `VAPID_PRIVATE_KEY` for push notifications.

`POSTGRES_PORT` is the port published on the host; services in Compose always
connect to PostgreSQL on its internal port `5432`. The development stack uses
separate database storage and publishes PostgreSQL on port `5433` by default.

Start development with:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
```

## ChangeLog

## [1.4.0] - 2025-12-15

### Added

- Full doc

### Changed

- Refoctor code management

### Fixed

- Security issue on Nextjs

---

[See the guide](./docs/development_guide.md)

## To improve it

- Create groups
- send image (transmit the base64) (which means that you have to determine the type of message)
- passing all of the stack in typescript (no php) (or in Go, who know ?)
- Reload /chat when fetching contact fail
- Versionning (de)crypting message mode
- Show how many unseen message by contact
- Save private key on the serveur, crypted by a password defined by the user
- Get contact list only if there is a private key set
## Support me 😘

<a href="http://buymeacoffee.com/yr72dpi">
<img style="border-radius: 15px; max-width: 300px;" src="./docs/bmac.png" style="width: 50%;">
</a>