# Immutable Release Plan

Target layout:

```text
/opt/the-executive-card/
  releases/<git-sha>/
  current
  shared/env
  shared/logs
  shared/backups
  repo
```

Preserve:

- `/opt/the-executive-card/repo`
- existing verified backup
- existing compose project name
- existing PostgreSQL volume
- approved rollback image identities

Do not:

- create another permanent compose project
- move live secrets prematurely
- bind new public ports
- emit rollback tagging instructions unless expected and observed image digests match

Compose scope must stay explicit:

- `docker compose --project-name the-executive-card --file <exact-compose-file> ...`
- project identity must never be inferred from a working directory default
- rollback tags must remain inside the approved `the-executive-card-*` repository namespace
