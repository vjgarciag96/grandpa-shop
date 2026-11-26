# Local database is Docker Compose

Status: accepted

`docker-compose.yml` starts PostgreSQL 18 for local development. Connection settings come from the environment. `.env.example` holds placeholders. `.env` is gitignored.

Why: the collection is self-hosted and the server should be runnable with Docker, without writing a machine address into the repo.

The server image is in [0015](0015-server-and-web-ship-as-container-images.md). The server does not open a database connection yet. Do not commit a hostname, an IP, or a real password.
