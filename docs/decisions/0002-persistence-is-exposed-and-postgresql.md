# Persistence is Exposed and PostgreSQL

Status: accepted

The database is PostgreSQL (JDBC driver 42.7.14). Schema access is JetBrains Exposed 1.6.1 (`exposed-core`, `exposed-jdbc`).

Why: it is the same persistence pair as furbo-papa, and PostgreSQL runs cleanly in Docker on a self-hosted machine.

The migration tool is not chosen. The first persistence slice frames it and records a decision before adding Flyway, Exposed's migration module, or anything else. No schema is in the repo yet.
