# Controlled Upgrade Runbook

High-level order:

1. verify local and live baseline
2. preserve rollback images
3. verify backup checksum
4. collect schema inventory
5. reconcile migrations
6. validate environment contract
7. materialize immutable release
8. validate compose invariants
9. build and validate canonical images
10. apply approved migration action only if separately authorized
11. replace card only
12. validate card
13. replace dashboard only
14. validate dashboard
15. apply proposed Nginx route policy only if separately authorized
16. validate callback, webhook, health, readiness
17. compare unrelated workload fingerprints
18. promote release pointer

Prohibited:

- `docker compose down`
- `docker compose down -v`
- prune operations
- broad Docker restart
- `systemctl restart docker`
- host reboot
- firewall or DNS changes
