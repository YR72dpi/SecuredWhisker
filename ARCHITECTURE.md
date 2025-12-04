# Architecture & Repository Structure

This file describes the repository structure and the overall architecture to help new contributors get started.

## High-level architecture

SecuredWhisker is organized as microservices:

- `user/`: Symfony service (user management, REST API)
- `message/`: Go microservice (WebSocket, message delivery/storage)
- `front/`: Next.js application (client UI)
- `TextManagerGPT/`: translation service

Each service contains a `Dockerfile` and the necessary configuration to run with `docker-compose`.

## Top-level tree

```
/
├─ front/                # Next.js (UI)
├─ user/                 # Symfony (REST API)
├─ message/              # Go (WebSocket)
├─ TextManagerGPT/       # Translation service
├─ docker-compose.yml
├─ docker-compose.dev.yml
├─ docs/                 # policies, changelog, GDPR
└─ README.md
```

## Local development (dev)

Use the provided `docker-compose.dev.yml`:

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

## Where to look first

- Frontend: `front/` (npm scripts, Dockerfile)
- User API: `user/` (routes, controllers, config)
- WebSocket: `message/` (server entrypoint, protocols)

---
