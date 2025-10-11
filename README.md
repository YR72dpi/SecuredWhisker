
<img src="docs/banner.png">

<sub><i>
AI-Generated and photoshopped logo
</i></sub>

# Secured Whisker 👨

[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/security-check-symfony.yml/badge.svg?branch=main "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/security-check-symfony.yml?query=branch%3Amain)
[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/security-check-go.yml/badge.svg?branch=main "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/security-check-go.yml?query=branch%3Amain)
[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/security-check-nextjs.yml/badge.svg?branch=main "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/security-check-front.yml?query=branch%3Amain)
[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/lint-nextjs.yml/badge.svg?branch=dev "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/lint-nextjs.yml?query=branch%3Adev)

This is a secure messaging application that allows users to send encrypted messages to each other, using RSA encryption on message. The application ensures the security and privacy of communication by encrypting messages before transmission and decrypting them upon reception, even if there is no https __(https-less not available yet)__.

## 📚 Documentation

- [🧭 Q&A Policy](./docs/Q&A_POLICY.md)
- [📜 RGPD Policy](./docs/RGPD.md)
<!-- - [🤝 Contributing Guidelines](./CONTRIBUTING.md) -->
<!-- - [🔐 Security Policy](./SECURITY.md) -->
<!-- - [🏗️ Technical Architecture](./ARCHITECTURE.md) -->

## Security 🔐

The will of this project is to allow user to exchange messages securely even if there is no https.

All messages are encrypted with the recipient's public rsa key before being sent and stored on the server. And the recipient decrypts it with his private key stored in his browser.

## ⚠ Warning ⚠

The __RSA private key is stored in your browser__. If you clean up “Cookies and site data”, this key, which is used to decrypt messages, will be lost.


## Features 📜

- Signin
- Login
- Add someone
- Send / receive message
- Translate messages (with chatGPT)
- Copy Rsa key pair if needed
- Secure transfer of private keys via QR code or manual entry

## How to use 🤔

<!-- docker-compose --env-file .env.dev -f docker-compose.dev.yml up -->

``` bash 
git clone --recurse-submodules https://github.com/YR72dpi/SecuredWhisker.git
cd SecuredWhisker
mv .env.example .env
# Edit .env
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
VERSION=2.0.0

# User manager (Symfony, PHP)
APP_ENV=prod
DATABASE_URL="pgsql://root:securedwhisker@localhost:5432/securedwhisker?serverVersion=16&charset=utf8"
CORS_ALLOW_ORIGIN='^.*$'
SYMFONY_PORT=5000
SERVER_HOST=swapi.your-domain-example.com
###> nelmio/cors-bundle ###

# message service (Fiber, GO)
SHOW_ONLY_ERROR=false
SOCKET_PORT=5050
SOCKET_HOST=swws.your-domain-example.com

# To complete

# Frontend
NEXTJS_PORT=5010
NEXTJS_DOMAIN=securedWhisker.your-domain-example.com

#TextManagerGPT
GPT_API_KEY="your-gpt-api-key"
TextManagerGPT_PORT=5020

# POSTGRES (for docker compose)
POSTGRES_DB=securedwhisker
POSTGRES_PASSWORD=securedwhisker
POSTGRES_USER=root
POSTGRES_PORT=5432
POSTGRES_VERSION=
```

## Architecture 🕸

```mermaid
graph LR;
    subgraph "Microservices Architecture"
        UserService["User management"] 
        MessageService["Messages management"]
        UserDatabase[("User Database")]
        Translator["Translator"]
    end

    Frontend["Frontend"]

    Frontend -->|API Rest| UserService
    UserService -->|Storage| UserDatabase
    UserService -->|Storage| Translator

    Frontend -->|WebSocket| MessageService
```

### When messages are translate

```mermaid
graph LR;
    subgraph "Microservices Architecture"
        UserService["User management"] 
        MessageService["Messages management"]
        Translator["Translator"]
    end

    Frontend["Frontend"]

    Frontend -- 1 --> UserService
    UserService -- 2 --> Translator
    Translator -- 3 --> UserService
    UserService -- 4 --> Frontend
    Frontend -- 5 --> MessageService

```

## Stack 👁‍🗨

- Domain and ssl management : Traefik 

- User management
    - Language: __PHP__
    - Framework: __Symfony__
    - ORM: __Doctrine__
    - Database: __PostgreSQL__

- Messages management
    - Language: __GO__
    - WebSocket: __Gorilla WebSocket__

- Translator : [YR72dpi/TextManagerGPT](https://github.com/YR72dpi/TextManagerGPT)

- Frontend
    - Language: __TypeScript__
    - Framework: __NextJs__
    - Encryption:  __window.crypto__
    - Saving on client : __Dexie.js__ (library for indexedDB )

All of that are Docker-_ized_

## How it works ⚙

### Sign up

On subscription form, enter pseudo, password.
These data will be encrypted with the public key of the User Service.

A tag will be generate like __pseudo#randomNumber__ like Discord. 
It gonna be used to add someone.

### Login

On login form, enter pseudo, password.
These data will be encrypted with the public key of the User Service and it will return a jwtToken.

### Sending Message

```mermaid
sequenceDiagram
    Client->>MessageServer: Ask recipient public key
    MessageServer-->>Client: Recipient Public Key
    Client->>Client: Generate AES key
    Client->>Client: Encrypt message with AES key
    Client->>Client: Encrypt AES key with RSA public key
    Client->>MessageServer: Send encrypted message + encrypted AES key
```

### Sending Message (with translation)

```mermaid
sequenceDiagram
    Client->>UserServer: Ask recipient public key
    UserServer-->>Client: Recipient Public Key
    Client->>UserServer: Send the message and the wanted language
    UserServer-->>GPTApi: Send the message and the wanted language
    GPTApi-->>UserServer: Receive the translated message
    UserServer-->>Client: Receive the translated message
    Client->>Client: Generate AES key
    Client->>Client: Encrypt message with AES key
    Client->>Client: Encrypt AES key with RSA public key
    Client->>MessageServer: Send encrypted message + encrypted AES key
```

### Receive Message 

```mermaid
sequenceDiagram
    MessageServer->>Client: Receive encrypted messages + encrypted AES key
    Client->>Client: Get his own private key
    Client->>Client: Decrypt AES key with RSA private key
    Client->>Client: Decrypt message with AES key
```

## Git flow

When I release version 1.0.0, Git Flow should look like this. 

```mermaid
gitGraph
   commit id: "Initial Commit" tag: "v1.0.0"
   branch dev
   checkout dev
   commit id: "Set up dev environment"

   branch feature1
   checkout feature1
   commit id: "Develop Feature 1 part 1"
   commit id: "Develop Feature 1 part 2"
   checkout dev
   merge feature1 id: "Merge feature1 into dev"

   branch feature2
   checkout feature2
   commit id: "Develop Feature 2 part 1"
   commit id: "Develop Feature 2 part 2"
   checkout dev
   merge feature2 id: "Merge feature2 into dev"

   branch feature3
   checkout feature3
   commit id: "Develop Feature 3 part 1"
   commit id: "Develop Feature 3 part 2"
   checkout dev
   merge feature3 id: "Merge feature3 into dev" tag: "2.1.0"

   checkout main
   merge dev id: "Merge dev into main" tag: "v2.1.0"
   commit id: "Release v2.1.0"

```

## Versioning

The versionning convention follow the [Semantic Versioning 2.0.0](https://semver.org/)

Given a version number MAJOR.MINOR.PATCH, increment the:

- __MAJOR__ version when you make incompatible API changes
- __MINOR__ version when you add functionality in a backward compatible manner
- __PATCH__ version when you make backward compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

## ChangeLog

## [1.3.1] - 2025-10-10

### Added

- (UI) Spinne loader
- Disconnection button

### Changed

- Check JWT token by GET method
- Contacts list line height (to 44px)

### Fixed

- Decrypt saved message on all browser 

---

[Full changelog](./docs/changelog.md)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to contribute to the development of this application.

## To improve it

- Create groups
- Crypt private key on local storage in AES with the user password
- send image (transmit the base64) (which means that you have to determine the type of message)
- everything that passes through the web socket in TLV
- make it https less
- passing all of the stack in typescript (no php) (or in Go, who know ?)
- Notification
- Reload /chat when fetching contact fail
- Versionning (de)crypting message mode
- manage multiple display of recorded messages received

## Support me 😘

<a href="http://buymeacoffee.com/yr72dpi">
<img style="border-radius: 15px; max-width: 300px;" src="./docs/bmac.png" style="width: 50%;">
</a>