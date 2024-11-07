<img src="docs/banner.png">

<sub><i>
AI-Generated and photoshopped logo
</i></sub>


# Secured Whisker 2.0

This is a secure messaging application that allows users to send encrypted messages and files to each other, using RSA encryption on message and AES on file. The application ensures the security and privacy of communication by encrypting messages before transmission and decrypting them upon reception, even if there is no https.

<sub><i>
This is a one year school project but i would like to make it a real full project_ [See the subject](./docs/subject.md)
</i></sub>

## ⚠ Warning ⚠
 
The RSA private key is stored in your browser. If you clean up “Cookies and site data”, this key, which is used to decrypt messages, gonna be lost.

_// To complete_

## Features

- Login
- Sign up
- Add someone
- Send / receive message
- Send file

## How to Run

// To complete...

## Architecture

```mermaid
graph RL;
    subgraph "Microservices Architecture"
        UserService["User management"] 
        MessageService["Messages management"]
        UserDatabase[("User Database")]
        MessageDatabase[("Message Database")]
        FileManager["File manager"]
    end
        DropBox{{Dropbox}}
        Frontend["Frontend"]

    Frontend -->|API Rest| UserService
    Frontend -->|WebSocket| MessageService
    Frontend -->|API REST| FileManager
    FileManager -->| API REST| DropBox
    UserService -->|Stockage| UserDatabase
    MessageService -->|Stockage| MessageDatabase

```

## Stack

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
    - Encryption: __JSEncrypt__ 🚨
    - Saving on client : __Dexie.js__ (library for indexedDB )

All of that are Docker-_ized_

## How it works

### Sign up

On subscription form, enter pseudo, password.

The password will be used to encrypt the private key in AES.

A tag will be generate like __pseudo#randomNumber__ like Discord. 
It gonna be used to add someone.

### Login

On login form, enter pseudo, password and 2FA code.

### Sending Message

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

### Sending Files

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
```

### Download File

```Mermaid
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
## Configuration

// To complete...

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to contribute to the development of this application.

## To improve it

- Create groups
- 2FA
- React-native front
- Gateway if necessary
