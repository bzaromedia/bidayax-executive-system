# Rollback Runbook

Levels:

1. application rollback
2. proxy rollback
3. database rollback

Application rollback:

- restore exact card image
- restore exact dashboard image
- restore prior compose artifact if needed
- restore prior environment artifact if needed

Proxy rollback:

- restore prior Executive Card Nginx site artifact
- run `nginx -t`
- reload Nginx only if validation passes

Database rollback:

- never automatic
- requires explicit typed confirmation
- requires verified dump path
- requires exact database identity
- requires post-restore integrity validation
