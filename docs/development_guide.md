# Development guide

```bash
mv .env.dev.example .env.dev
# edit the .env.dev
docker compose -f docker-compose.dev.yml --env-file .env.dev up
```