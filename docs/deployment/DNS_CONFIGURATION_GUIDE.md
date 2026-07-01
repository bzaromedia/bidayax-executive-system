# DNS Configuration Guide

Project: The Executive Card™  
DNS provider: Namecheap  
Deployment target: Hostinger VPS

## Source Of Truth

This guide includes only DNS records required by the current repository configuration or by the owner-selected Namecheap Email setup. Hostinger VPS IPv4 has been supplied from the Hostinger screenshot.

## Required Application DNS Records

| Record Type | Host | Expected Value | TTL | Purpose |
| --- | --- | --- | --- | --- |
| A | `@` | `187.124.251.190` | Automatic / Namecheap default | Routes `theexecutivecard.online` to the card app through host-level Caddy |
| A | `dashboard` | `187.124.251.190` | Automatic / Namecheap default | Routes password-protected `dashboard.theexecutivecard.online` to the dashboard through host-level Caddy |

## Conditional Application DNS Records

| Record Type | Host | Expected Value | TTL | Purpose |
| --- | --- | --- | --- | --- |
| AAAA | `@` | Hostinger VPS IPv6 address, owner-supplied if available | Namecheap default or owner-selected | IPv6 route for apex domain |
| AAAA | `dashboard` | Hostinger VPS IPv6 address, owner-supplied if available | Namecheap default or owner-selected | IPv6 route for dashboard subdomain |
| CNAME | `www` | `@` | Automatic / Namecheap default | Optional only if the host-level Caddyfile includes `www.theexecutivecard.online` as a redirect host |

## Namecheap Email DNS Records

These records come from the Namecheap Private Email screenshot and owner-selected DMARC launch policy. The DKIM value must still be copied exactly from Namecheap because the screenshot truncates the DNS record field.

| Record Type | Host | Expected Value | TTL | Purpose |
| --- | --- | --- | --- | --- |
| MX | `@` | `mx1.privateemail.com` | Automatic / Namecheap default | Receives mail for `theexecutivecard.online` |
| MX | `@` | `mx2.privateemail.com` | Automatic / Namecheap default | Receives mail for `theexecutivecard.online` |
| TXT | `@` | `v=spf1 include:spf.privateemail.com ~all` | Automatic / Namecheap default | Authorizes Namecheap Private Email to send mail |
| TXT | `privateemail._domainkey` | Copy exact full DKIM value from Namecheap Private Email | Automatic / Namecheap default | DKIM signing for Namecheap Private Email |
| TXT | `_dmarc` | `v=DMARC1; p=none` | Automatic / Namecheap default | Launch DMARC monitoring policy |

## Not Required By Current Repository

| Record | Reason |
| --- | --- |
| `api.theexecutivecard.online` | No separate API domain exists in current deployment configuration. |
| `docs.theexecutivecard.online` | No docs app/domain exists in current deployment configuration. |
| SRV | No service in the repository requires SRV records. |
| CAA | Not required by the repository. If an existing CAA policy is used, it must allow Caddy's ACME certificate issuer. |

## Validation After DNS Changes

After records are configured in Namecheap:

- Confirm `theexecutivecard.online` resolves to the Hostinger VPS.
- Confirm `dashboard.theexecutivecard.online` resolves to the Hostinger VPS.
- Confirm `www.theexecutivecard.online` resolves if the optional CNAME is added.
- Confirm Caddy can issue HTTPS certificates.
- Confirm `https://theexecutivecard.online/card/ad-garner` responds publicly.
- Confirm `https://dashboard.theexecutivecard.online/api/system/health` is protected by basic auth.
