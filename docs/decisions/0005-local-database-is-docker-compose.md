# Local database is Docker Compose

Status: accepted

`docker-compose.yml` starts PostgreSQL 18 for local development. Connection settings come from the environment. `.env.example` holds placeholders. `.env` is gitignored.

Why: the collection is self-hosted and the server should be runnable with Docker, without writing a machine address into the repo.

The server process is not containerised yet and does not open a connection. The first slice that runs the server adds that image, still with configuration only from the environment. Do not commit a hostname, an IP, or a real password.
