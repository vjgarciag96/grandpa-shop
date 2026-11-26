# Server and web ship as container images

**Accepted**

CI builds two images on every push to `main` and publishes them to GitHub Container Registry, tagged with the commit SHA: `grandpa-shop-server`, the Ktor server on the Eclipse Temurin 21 JRE, and `grandpa-shop-web`, the built Vite site served by Caddy, which forwards `/api` to the server at `GRANDPA_SHOP_API`. Where they run, and under which hostname, lives outside this repository.

Two images keep the boundary the repo already draws: the server answers the API and does not serve a page. Caddy and Temurin follow the images Víctor's other services already run. Configuration still comes only from the environment, as [0005](0005-local-database-is-docker-compose.md) asked.
