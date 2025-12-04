# Architecture & structure du dépôt

Ce fichier décrit la structure du dépôt et l'architecture générale pour aider les nouveaux contributeurs.

## Architecture globale

Secured Whisker est organisé en microservices :

- `user/` : service Symfony (gestion des utilisateurs, API REST)
- `message/` : microservice Go (WebSocket, envoi/stockage des messages)
- `front/` : application Next.js (interface client)
- `TextManagerGPT/` : service de traduction

Chaque service dispose d'un `Dockerfile` et des configurations nécessaires pour le démarrage via `docker-compose`.

## Arborescence principale

```
/
├─ front/                # Next.js (UI)
├─ user/                 # Symfony (API REST)
├─ message/              # Go (WebSocket)
├─ TextManagerGPT/       # Service de traduction
├─ docker-compose.yml
├─ docker-compose.dev.yml
├─ docs/                 # Politique, changelog, RGPD
└─ README.md
```

## Démarrage local (dev)

Utiliser le `docker-compose.dev.yml` fourni :

```
docker compose -f docker-compose.dev.yml up --build -d
```

## Où regarder en priorité

- Pour le front : `front/` (scripts npm, Dockerfile)
- Pour l'API utilisateur : `user/` (routes, controllers, config)
- Pour WebSocket : `message/` (point d'entrée du serveur, protocoles)
