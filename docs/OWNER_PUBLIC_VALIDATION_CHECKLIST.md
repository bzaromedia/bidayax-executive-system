# Owner Public Validation Checklist

Project: The Executive Card  
Phase: Production Card Owner Validation  
Status: OWNER VALIDATION REQUIRED

Validate each workflow against all three cards:

- `https://theexecutivecard.online/card/ad-garner`
- `https://theexecutivecard.online/card/naimah-barnes`
- `https://theexecutivecard.online/card/sean-hall`

## Device Checks

| Check | Required action | Status |
| --- | --- | --- |
| iPhone QR scan | Scan each QR and confirm the correct HTTPS card opens. | Owner validation required |
| Android QR scan | Scan each QR and confirm the correct HTTPS card opens. | Owner validation required |
| Mobile rendering | Confirm no text clipping, horizontal drift, or broken spacing. | Owner validation required |
| Desktop rendering | Confirm each card remains centered, readable, and action-ready. | Owner validation required |

## Contact Checks

| Check | Required action | Status |
| --- | --- | --- |
| Call link | Confirm the call prompt uses `+1 (302) 330-5547`. | Owner validation required |
| Email link | Confirm the compose window uses `contact@theexecutivecard.com`. | Owner validation required |
| Website link | Confirm the website action opens `https://bidayax.com`. | Owner validation required |
| vCard import | Confirm name, role, company, phone, email, website, and two-line address import correctly. | Owner validation required |
| Share action | Confirm shared URLs use the correct executive card URL. | Owner validation required |
| Download | Confirm each download route returns only that executive package. | Owner validation required |

## Receptionist Checks

| Check | Required action | Status |
| --- | --- | --- |
| Consent required | Submit without consent and confirm the form blocks submission. | Owner validation required |
| Meeting request | Submit a meeting request and confirm dashboard visibility. | Owner validation required |
| Callback request | Submit a callback request and confirm dashboard visibility. | Owner validation required |
| Language routing | Submit at least one non-English request and confirm language appears in the dashboard. | Owner validation required |
| Provider status | Confirm missing SMTP does not break the user submission. | Owner validation required |

## Completion Rule

Marketing may begin only after owner device validation passes without launch-blocking issues.
