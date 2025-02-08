<img src="docs/banner.png">

<sub><i>
AI-Generated and photoshopped logo
</i></sub>

# Secured Whisker 👨

[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/security-check-symfony.yml/badge.svg?branch=main "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/security-check-symfony.yml?query=branch%3Amain)
[![CI Status](https://github.com/YR72dpi/SecuredWhisker/actions/workflows/security-check-go.yml/badge.svg?branch=main "CI Status")](https://github.com/yr72dpi/SecuredWhisker/actions/workflows/security-check-go.yml?query=branch%3Amain)

This is a secure messaging application that allows users to send encrypted messages and files to each other, using RSA encryption on message and AES on file. The application ensures the security and privacy of communication by encrypting messages before transmission and decrypting them upon reception, even if there is no https.

<sub><i>
This is a one year school project but i would like to make it a real full project [See the subject](./docs/subject.md)
</i></sub>

## Support me 😘

<a href="http://buymeacoffee.com/yr72dpi">
<img style="border-radius: 15px; max-width: 300px;" src="./docs/bmac.jpg" style="width: 50%;">
</a>

## Security 🔐

The will of this project is to allow user to exchange messages and files securely even if there is no https.

All messages are encrypted with the recipient's public rsa key before being sent and stored on the server. And the recipient decrypts it with his private key stored in his browser. Which is AES encrypted with his password.

About files, they will be encrypted in the browser in AES with a randomly generated or user-generated key.

## ⚠ Warning ⚠

__RSA private key__: The RSA private key is stored in your browser. If you clean up “Cookies and site data”, this key, which is used to decrypt messages, will be lost.

__Message database__: this is a redis database without persistence, it's mean that if you stop the server or docker container, all messages will be lost.

## Features 📜

- Login
- Sign up
- Add someone
- Send / receive message
- Send file

## How to use 🤔
### Configuration

```env
# SecuredWhisker
VERSION=0.0.0

# User manager (Symfony, PHP) 
APP_ENV="dev"

# Messages manager (Fiber, GO) 
SHOW_ONLY_ERROR=false

# File manager (Fiber, GO)
# To complete

# Frontend
# To complete

# REDIS (docker container)
REDIS_PASSWORD=SecuredPassword123

# POSTGRES (docker container)
POSTGRES_DB=securedwhisker
POSTGRES_PASSWORD=securedwhisker
POSTGRES_USER=root
POSTGRES_PORT=5432
```

<!-- 

_// TODO: To details_

### Start
_// TODO: To complete_

-->

## Architecture 🕸

```mermaid
graph LR;
    subgraph "Microservices Architecture"
        UserService["User management"] 
        MessageService["Messages management"]
        UserDatabase[("User Database")]
        MessageDatabase[("Message Database")]
        FileManager["File management"]
    end

    DropBox{{Dropbox}}
    Frontend["Frontend"]

    Frontend -->|API Rest| UserService
    Frontend -->|WebSocket| MessageService
    Frontend -->|API REST| FileManager
    FileManager -->| API REST| DropBox
    UserService -->|Storage| UserDatabase
    MessageService -->|Storage| MessageDatabase

```

<!-- - [User Management](./docs/UserManagement.md) 

- [Messages Management](./docs/MessagesManagement.md) 

- [File Management](./docs/FileManagement.md) 

- [Frontend](./docs/Frontend.md) -->

## Stack 👁‍🗨

- User management
    - Language: __PHP__
    - Framework: __Symfony__
    - ORM: __Doctrine__
    - Database: __PostgreSQL__

- Messages management
    - Language: __GO__
    - Framework: __Fiber__
    - WebSocket: __Gorilla WebSocket__
    - ORM: __Go Redis__
    - Database: __Redis__

- File management
    - Language: __GO__
    - Upload : __github.com/chyroc/dropbox__

- Frontend
    - Language: __TypeScript__
    - Framework: __NextJs__
    - WebSockets : __socket.io__
    - Encryption: __node-forge__
    - Saving on client : __Dexie.js__ (library for indexedDB )

All of that are Docker-_ized_

## How it works ⚙

### Sign up

On subscription form, enter pseudo, password.

The password will be used to encrypt the private key in AES.

A tag will be generate like __pseudo#randomNumber__ like Discord. 
It gonna be used to add someone.

<!-- TODO 
how it secured password when clien -> server
 -->

### Login

On login form, enter pseudo, password and 2FA code.

<!-- TODO 
how it secured
 -->

### Sending Message

<!-- TODO 
how it secured
 -->

```mermaid
sequenceDiagram
    Client->>Server: Ask recipient public key
    Server-->>Client: Recipient Public Key
    Client->>Client: Crypt message
    Client->>Server: Send crypted message
```

### Receive Message

```mermaid
sequenceDiagram
    Server->>Client: Receive crypted messages
    Client->>Client: Decrypt his own AES crypted private key
    Client->>Client: Decrypt message 
```

### Upload Files

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Microservice
    participant Dropbox

    User->>Browser: Submits the form (file to upload)
    Browser->>Browser: Generates a random AES key
    Browser->>Browser: Encrypts the file with the AES key
    Browser->>Microservice: Sends the encrypted file and the AES key
    Microservice->>Dropbox: Uploads the encrypted file
    Dropbox-->>Microservice: Upload confirmation
    Microservice-->>Browser: Upload confirmation
    Browser-->>User: Upload complete
    Browser-->>User: Give random generated AES key
```

### Download File

```mermaid
sequenceDiagram
    participant Client
    participant Microservice
    participant Dropbox

    Client->>Microservice: Request to download file
    Microservice->>Dropbox: Retrieves the encrypted file
    Dropbox-->>Microservice: Sends the encrypted file
    Microservice-->>Client: Sends the encrypted file
    Client->>Client: Decrypts the file with the AES key
    Client->>Client: Uses the decrypted file
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

_This changelog will make sense after that version 1.0.0 will be released_

[Full changelog](./docs/changelog.md)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to contribute to the development of this application.

## To improve it

- 2FA
- Create groups
- React-native front
- Gateway if necessary
