# Email Configuration Guide

Project: The Executive Card™  
Email provider: Namecheap Private Email

## Current Application State

The current production card experience still uses `mailto:` links for public contact actions.

The card profile currently points to:

- `contact@theexecutivecard.com`

The receptionist notification runtime also checks these server-side environment variables:

- `EMAIL_HOST`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`

Current runtime meaning:

- if those variables are present, receptionist notification status reports `email_ready`
- if they are absent, receptionist notification status reports `provider_unconfigured`

This is a readiness/configuration signal only. It does not by itself create a full SMTP sending pipeline.

## Recommended Product Mailboxes

Create these mailboxes or aliases in Namecheap Private Email:

- `contact@theexecutivecard.online`
- `support@theexecutivecard.online`
- `sales@theexecutivecard.online`
- `hello@theexecutivecard.online`
- `notifications@theexecutivecard.online`
- `noreply@theexecutivecard.online`

## Environment Contract

Document but do not commit real values for:

- `EMAIL_HOST`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`

Store any real values only in:

```text
/opt/the-executive-card/shared/env/production.env
```

## DNS Requirements

- MX `mx1.privateemail.com`
- MX `mx2.privateemail.com`
- SPF `v=spf1 include:spf.privateemail.com ~all`
- DKIM copied exactly from Namecheap
- DMARC launch policy `v=DMARC1; p=none`
