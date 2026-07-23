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

Do not:

- create another permanent compose project
- move live secrets prematurely
- bind new public ports
