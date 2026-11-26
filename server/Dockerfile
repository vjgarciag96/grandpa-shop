# Built from the repository root: docker build -f server/Dockerfile .
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY gradlew settings.gradle.kts build.gradle.kts gradle.properties ./
COPY gradle gradle
COPY server server
# settings.gradle.kts includes the Android module, which the server does not need.
RUN mkdir android && ./gradlew :server:installDist --no-daemon --quiet

FROM eclipse-temurin:21-jre
COPY --from=build /src/server/build/install/server /app
# The catalogue, card images and price guide are kept here; mount a volume to keep them across restarts.
RUN mkdir /cache && chown 65534:65534 /cache
ENV GRANDPA_SHOP_HOST=0.0.0.0 \
    GRANDPA_SHOP_PORT=8080 \
    GRANDPA_SHOP_CACHE_DIR=/cache
EXPOSE 8080
USER 65534:65534
CMD ["/app/bin/server"]
