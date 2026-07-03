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
| iPhone QR scan | Scan each QR and confirm the correct HTTPS card opens with `?source=qr`. | Owner validation required |
| Android QR scan | Scan each QR and confirm the correct HTTPS card opens with `?source=qr`. | Owner validation required |
| QR transfer feedback | Confirm the receiving device shows `Executive Card received` and the card remains usable. | Owner validation required |
| QR haptics | Confirm supported receiver devices vibrate when haptics are enabled, and unsupported devices fail silently. | Owner validation required |
| QR sound setting | Enable sound in feedback settings and confirm a low-volume generated tone plays only after browser permission. | Owner validation required |
| QR animation setting | Toggle animation off and confirm the confirmation remains readable without motion. | Owner validation required |
| Mobile rendering | Confirm no text clipping, horizontal drift, or broken spacing. | Owner validation required |
| Desktop rendering | Confirm each card remains centered, readable, and action-ready. | Owner validation required |
| Splash screen | Confirm the logo appears only during the brief loading transition and not on the main card page. | Owner validation required |
| Fixed bottom actions | Confirm QR, Download, and Share remain accessible at the bottom of the mobile viewport and do not overlap final content. | Owner validation required |
| Hidden scrollbars | Confirm no visible scrollbar appears during normal mobile card use while scrolling still works if needed. | Owner validation required |

## Contact Checks

| Check | Required action | Status |
| --- | --- | --- |
| Call link | Confirm the call prompt uses `+1 (302) 330-5547`. | Owner validation required |
| Email link | Confirm the compose window uses `contact@theexecutivecard.com`. | Owner validation required |
| Website link | Confirm the website action opens `https://bidayax.com`. | Owner validation required |
| vCard import | Confirm name, role, company, phone, email, website, and two-line address import correctly. | Owner validation required |
| Share action | Confirm shared URLs use the correct executive card URL. | Owner validation required |
| Save Contact from QR feedback | Open a QR-marked route and confirm the feedback `Save Contact` action downloads that executive vCard. | Owner validation required |
| Download | Confirm each download route returns only that executive package. | Owner validation required |

## Calendar Checks

| Check | Required action | Status |
| --- | --- | --- |
| Calendar route | Tap `Schedule now` and confirm it opens `/card/[slug]/calendar`, not an email client. | Owner validation required |
| Slot selection | Select each available window and confirm the form remains usable. | Owner validation required |
| Queued request | Submit a meeting request and confirm the page shows a queued confirmation state. | Owner validation required |
| Event capture | Confirm calendar view, slot selection, and request submission events appear where implemented. | Owner validation required |

## Receptionist Checks

| Check | Required action | Status |
| --- | --- | --- |
| Consent required | Submit without consent and confirm the form blocks submission. | Owner validation required |
| Modal launcher | Confirm the main card shows only the receptionist launcher until `Open Receptionist` is tapped. | Owner validation required |
| Compact sheet | Open the receptionist form and confirm the sheet fits the viewport cleanly with reachable close and submit controls. | Owner validation required |
| Meeting request | Submit a receptionist meeting request and confirm dashboard visibility. | Owner validation required |
| Callback request | Submit a callback request and confirm dashboard visibility. | Owner validation required |
| Language routing | Submit at least one non-English request and confirm language appears in the dashboard. | Owner validation required |
| Provider status | Confirm missing SMTP does not break the user submission. | Owner validation required |

## Completion Rule

Marketing may begin only after owner device validation passes without launch-blocking issues. QR transfer feedback validation is receiver-side only; sender-side haptics require an active paired web session or native bridge and are not active v1.0 behavior.
