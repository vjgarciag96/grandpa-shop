# Built from the repository root: docker build -f web/Dockerfile .
FROM node:22-alpine AS build
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
WORKDIR /src/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY design /src/design
COPY web ./
RUN npm run build

FROM caddy:2.11.4-alpine
COPY --from=build /src/web/dist /srv
COPY web/Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
USER 65534:65534
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
