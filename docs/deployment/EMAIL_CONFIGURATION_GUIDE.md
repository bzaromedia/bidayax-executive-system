# Email Configuration Guide

Project: The Executive Card™  
Email provider: Namecheap Private Email

## Current Application State

The current application does not send email through SMTP or IMAP. It uses `mailto:` links in production executive cards.

Current profile source:

- `packages/config/executives/profiles.ts`

Current card email value:

- `contact@bidayax.com`

The owner selected product-domain email addresses for commercial identity. Switching card links from `contact@bidayax.com` to `contact@theexecutivecard.online` requires a separate code/data change and test update. This deployment configuration pass does not change application profile data.

## Recommended Product Mailboxes

Create these mailboxes or aliases in Namecheap Private Email:

| Mailbox | Purpose | Required by current code? |
| --- | --- | --- |
| `contact@theexecutivecard.online` | General contact and future card contact address | Recommended, not currently used by code |
| `support@theexecutivecard.online` | Customer support | Recommended, not currently used by code |
| `sales@theexecutivecard.online` | Sales inquiries | Recommended, not currently used by code |
| `hello@theexecutivecard.online` | Lightweight public inquiry address | Optional, not currently used by code |
| `notifications@theexecutivecard.online` | Future operational notifications | Optional, not currently used by code |
| `noreply@theexecutivecard.online` | Future no-reply sending identity | Optional, not currently used by code |

## SMTP And IMAP

| Setting | Current requirement |
| --- | --- |
| SMTP host | Not required by current repository |
| SMTP port | Not required by current repository |
| SMTP username | Not required by current repository |
| SMTP password | Not required by current repository |
| IMAP host | Not required by current repository |
| IMAP port | Not required by current repository |

If future application-sent email is implemented, SMTP settings should be added to `.env.production.example`, validated in `packages/config`, and documented before deployment.

## Namecheap DNS Requirements

The MX and SPF values are visible in the Namecheap Private Email screenshot. The DKIM record must be copied exactly from Namecheap because the visible field is truncated.

| Record | Source | Purpose |
| --- | --- | --- |
| MX `@` priority `10` value `mx1.privateemail.com` | Namecheap Private Email screenshot | Receives mail for `theexecutivecard.online` |
| MX `@` priority `10` value `mx2.privateemail.com` | Namecheap Private Email screenshot | Receives mail for `theexecutivecard.online` |
| TXT `@` value `v=spf1 include:spf.privateemail.com ~all` | Namecheap Private Email screenshot | Authorizes outgoing mail |
| TXT `privateemail._domainkey` | Namecheap Private Email DKIM panel | Cryptographic mail signing; copy exact full value |
| TXT `_dmarc` value `v=DMARC1; p=none` | Owner-selected launch policy | Monitoring-only DMARC launch policy |

## DMARC Progression

Start with:

```text
v=DMARC1; p=none
```

After SPF and DKIM pass reliably, upgrade deliberately:

```text
v=DMARC1; p=quarantine
```

Then, after monitoring confirms legitimate mail passes:

```text
v=DMARC1; p=reject
```

Do not move to `quarantine` or `reject` until Namecheap mail passes SPF and DKIM.

## Verification Checklist

- Namecheap Email mailboxes or aliases created.
- MX record copied exactly from Namecheap.
- SPF TXT copied exactly from Namecheap.
- DKIM TXT copied exactly from Namecheap.
- DMARC TXT configured as `v=DMARC1; p=none` for launch.
- Send test mail to each mailbox.
- Send test mail from each mailbox.
- Confirm mail is not routed to spam for major mailbox providers.
- If card profile email is changed later, rerun production card tests and route validation.
