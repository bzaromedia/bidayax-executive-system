# Owner Public Validation Checklist

Project: The Executive Card  
Phase: Recovery Phase B6 - Owner Validation  
Status: OWNER VALIDATION REQUIRED

Codex validated live endpoints and repository gates. The remaining checks require owner devices, owner accounts, or real mailboxes.

## Card URLs

Validate each workflow against all three cards:

- `https://theexecutivecard.online/card/ad-garner`
- `https://theexecutivecard.online/card/naimah-barnes`
- `https://theexecutivecard.online/card/sean-hall`

## Device And Browser Checks

| Check | Required action | Status |
| --- | --- | --- |
| iPhone QR scan | Scan each card QR with the iPhone camera and confirm the correct card opens over HTTPS. | Owner validation required |
| Android QR scan | Scan each card QR with an Android camera app and confirm the correct card opens over HTTPS. | Owner validation required |
| iPhone Safari rendering | Open each card in Safari and inspect layout, buttons, logo, QR, and text fit. | Owner validation required |
| Android Chrome rendering | Open each card in Chrome and inspect layout, buttons, logo, QR, and text fit. | Owner validation required |
| Desktop Chrome rendering | Open each card and confirm the desktop layout is usable. | Owner validation required |
| Desktop Edge rendering | Open each card and confirm the desktop layout is usable. | Owner validation required |
| Desktop Safari or Firefox rendering | Open each card where available and confirm no layout breakage. | Owner validation required |

## Contact And Communication Checks

| Check | Required action | Status |
| --- | --- | --- |
| Apple Contacts import | Download each vCard on iPhone and confirm the contact imports with correct name, role, phone, email, website, and address. | Owner validation required |
| Google Contacts import | Download each vCard on Android or desktop and confirm the contact imports with correct name, role, phone, email, website, and address. | Owner validation required |
| Outlook contact import | Import one vCard into Outlook if Outlook is part of the launch workflow. | Owner validation required |
| Phone call link | Tap the call button and confirm it opens a call prompt for `+1 (302) 330-5547`. | Owner validation required |
| Gmail email link | Tap the email button and confirm Gmail or the default mail app opens the expected compose window. | Owner validation required |
| Website link | Tap the website button and confirm it opens `https://theexecutivecard.online`. | Owner validation required |
| Share action | Use the share button on iPhone and Android and confirm the shared URL is the correct executive card URL. | Owner validation required |

## Social Preview Checks

| Check | Required action | Status |
| --- | --- | --- |
| iMessage preview | Paste each card URL into iMessage and confirm the preview renders acceptably. | Owner validation required |
| SMS preview | Paste each card URL into an SMS conversation and confirm the URL is usable if a rich preview is unavailable. | Owner validation required |
| LinkedIn preview | Use LinkedIn post preview or a private test post where available and confirm title/image/copy are correct. | Owner validation required |
| OpenGraph image | Confirm OpenGraph image loads for each card route. | Owner validation required |

## Dashboard And Analytics Checks

| Check | Required action | Status |
| --- | --- | --- |
| Dashboard sign-in | Open `https://dashboard.theexecutivecard.online` and confirm basic authentication prompts. | Owner validation required |
| Dashboard health | After sign-in, open `https://dashboard.theexecutivecard.online/api/system/health`. | Owner validation required |
| Card view events | Open each card and confirm interaction activity appears in the dashboard where implemented. | Owner validation required |
| QR scan events | Scan each QR and confirm the scan interaction is captured where implemented. | Owner validation required |
| Button click events | Click call, email, website, share, vCard, and package download actions and confirm event capture where implemented. | Owner validation required |

## Email Checks

Validate these product-domain mailboxes or aliases in Namecheap Private Email:

- `contact@theexecutivecard.online`
- `support@theexecutivecard.online`
- `sales@theexecutivecard.online`
- `hello@theexecutivecard.online`
- `notifications@theexecutivecard.online`
- `noreply@theexecutivecard.online`

| Check | Required action | Status |
| --- | --- | --- |
| Inbound mail | Send a message from Gmail to each mailbox and confirm receipt. | Owner validation required |
| Outbound mail | Send a message from each launch-critical mailbox to Gmail and confirm receipt. | Owner validation required |
| SPF/DKIM/DMARC | Confirm mail authentication passes in the recipient message details. | Owner validation required |
| Spam placement | Confirm test messages do not land in spam for major mailbox providers. | Owner validation required |

## Backup And Restore Checks

| Check | Required action | Status |
| --- | --- | --- |
| Backup file exists | Confirm `/opt/the-executive-card/backups/the-executive-card-20260702-014505.dump` exists on the VPS. | Owner validation required |
| Backup retention | Decide retention period and off-server backup destination. | Owner validation required |
| Restore drill | Restore the dump into a non-production database and confirm migrations/data can be read. | Owner validation required |

## Completion Rule

Marketing may begin only after the owner completes this checklist with no launch-blocking issues.
