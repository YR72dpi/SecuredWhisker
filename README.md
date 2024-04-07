# Secured Whisker (beta)
Secure Messaging Application

This is a secure messaging application that allows users to send encrypted messages to each other using RSA encryption. The application ensures the security and privacy of communication by encrypting messages before transmission and decrypting them upon reception. It's built with JavaScript and TypeScript, utilizing the JSEncrypt library for RSA encryption.

## ⚠ Warning ⚠

*Secured Whisker* use user's ip to manage account on database. Make sure that you've an active VPN if you want a full anonymous

## Features

- **User Registration**: Users can register with a unique username and public key, which are used for encryption and identification purposes.
- **Message Encryption**: Messages are encrypted using RSA encryption before being sent, ensuring that only the intended recipient can decrypt and read them.
- **Secure Communication**: By using RSA encryption, the application provides end-to-end encryption, preventing eavesdropping and ensuring the privacy of communication.
- **Message Retrieval**: Users can retrieve messages sent to them, decrypting them using their private key to read the contents.

## Technologies Used

- **Express.js**: A web application framework for Node.js, used for building the backend server.
- **TypeScript**: A typed superset of JavaScript, providing enhanced code quality and maintainability.
- **Prisma**: A modern database toolkit for Node.js and TypeScript, used for interacting with the database.
- **JSEncrypt**: A JavaScript library for RSA encryption __on client side__, utilized for encrypting and decrypting messages securely.
- **cors**: Middleware for enabling Cross-Origin Resource Sharing (CORS), allowing communication between different domains.
- **dotenv**: A module for loading environment variables from a `.env` file into `process.env`, used for environment configuration.

## How to Run

This project contains an ExpressJs server ("back" folder) and the client ("front" folder).

Deploy ExpressJS on a server.
The "front" folder contains the client (full vanilla HTML CSS JS)

All encryptions/decryptions are done on the client's side. Your PrivateKey is saved on IndexedDB et your PublicKey are saved on DB during register

## How it works
```mermaid
sequenceDiagram
    participant Client as Client HTML/CSS/JS
    participant Server as Server Express.js

    Client ->> Client: Generate RSA key pair
    Client ->> Server: Request for user registration with username and public key
    Server ->> Server: Process registration and store username and public key in database
    Server -->> Client: Response with unique username
    Client ->> Client: Save private key in IndexedDB

    Client ->> Client: Encrypt message with public key of the targeted user
    Client ->> Server: Request for sending a message with encrypted content
    Server -->> Client: Response with confirmation

    Client ->> Server: Request for getting receive messages
    Server -->> Client: Response with messages
    Client ->> Client: Decrypt with the private key
```

## Configuration

The following environment variables need to be configured in the `.env` file:

- `PORT`: Port number for the server to listen on.
- `DATABASE_URL`: the url of your __postgre__ database. Turrent configuration for the postegre database in the docker compose file.

```properties
PORT=3000

# This was inserted by `prisma init`:
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgresql://root:securedwhisker@localhost:5432/securedwhisker?schema=public"
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to contribute to the development of this application.

## License

This project is licensed under the [MIT License](LICENSE).