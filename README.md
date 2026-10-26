# Aamil Dev Studio

Existing portfolio, enhanced in place. Static HTML/CSS/JavaScript with a Node.js Vercel contact function. No frontend framework or production dependencies.

## Development and checks

Node.js 24. `npm ci --ignore-scripts`, `npm test`, `npm run validate`, `npm run build`. The static build writes only public assets to `dist`. Vercel packages `api/contact.js` separately. Preview: `python3 -m http.server 8080 --directory dist` (static preview does not provide the API).

Browser checks: `npx playwright install chromium` then `npx playwright test`. Checks cover 390, 768, and 1440px layouts, navigation, form validation, overflow, browser exceptions, links, and axe WCAG A/AA scans. GitHub Actions runs these on pushes and pull requests.

## Vercel

Import **Aamilsamsung/Aamil-Dev-Studio** into workspace **aamilsamsungm56-9276**, project **aamil-dev-studio**, framework **Other**, root `/`, production branch **main**. `vercel.json` sets `npm run build` and `dist`. Keep automatic Git deployments enabled. Do not publish the repository root as the static directory: it contains tests and setup files.

Production is live at https://aamil-dev-studio.vercel.app/ (deployed through the authenticated dashboard on 26 October 2026). GitHub App access was granted specifically for this repository. The initial deployment was Ready at commit 9d07dbb; the dashboard confirms pushes to main update production automatically. The connected API still cannot see this new project; dashboard access was used. The public homepage and contact configuration endpoint return HTTP 200; contact delivery remains disabled until provider credentials are authorized.

Absolute canonical, og:url, and og:image metadata now use the production URL. The supplied social image is 1200×630. No domain purchase is needed.

## Real contact delivery setup

Delivery is deliberately disabled until all four environment variables are configured on Vercel:

- `RESEND_API_KEY`: send-only Resend API key, server-side only.
- `CONTACT_FROM`: verified Resend sender. For testing to the account owner, use a sender allowed by that account. Never use a visitor address as sender.
- `TURNSTILE_SITE_KEY`: public Cloudflare Turnstile site key for the actual production hostname.
- `TURNSTILE_SECRET_KEY`: matching private verification key.

Recipient is hardcoded to **aamil.dev@gmail.com**. Visitor email becomes Reply-To. Resend API acceptance is not proof of inbox delivery. Test with an identifiable enquiry, inspect provider delivery logs and verify receipt in the destination inbox before calling delivery verified. Never put secrets in chat, source, screenshots, or public environment variables.

Server checks JSON type, bounded field lengths, service allowlist, request origin, honeypot and single-use Turnstile verification with matching hostname. No enquiry body, address, API token or secret is logged. Responses and configuration are no-store. Challenge tokens prevent simple replay; configure Vercel Firewall rate limits and provider spending caps before higher traffic (no paid feature activated here). No durable enquiry store exists; network timeouts may leave delivery uncertain, and the UI says so. Provider outages offer direct email as a fallback.

A direct email link always remains. Visitors are told how enquiry data is used. Third-party privacy and retention terms apply to Resend and Cloudflare. Do not send sensitive information in the form.

## Project descriptions

The four showcased repositories and their READMEs were read on 26 October 2026. Descriptions are restrained and distinguish personal projects and prototypes from production-certified products. No other repository was changed. Prices remain indicative starting estimates, with third-party charges quoted separately.

## Current validation

14 contact endpoint unit tests passed using provider stubs; these are not live delivery tests. HTML validation, JS syntax checks and the static production build passed. Production dependency audit: zero vulnerabilities. Local browser install failed because the downloaded Chromium archive was invalid. GitHub CI subsequently passed the desktop/tablet/mobile browser checks at 390, 768 and 1440px, including axe WCAG scans, on commit 83d200be75be81070161818f4b1efb9098f20ca6 (run 40342069798). Live performance and production checks remain unverified pending deployment. No fake metrics or testimonials are used.

## Remaining launch requirements

The current Vercel workspace is Hobby. Vercel restricts Hobby to personal, non-commercial use; an eligible plan is required for ongoing commercial hosting of the advertised studio services. No paid plan or domain was activated.

Resend installation is pending the owner's specific approval to create a provider API key and store it securely in Vercel. Turnstile site/secret configuration and sender authorization are also pending. Inbox delivery has not been tested. The public endpoint correctly returns disabled configuration rather than claiming email success. Live cross-origin POST rejection was verified (403).

The original responsive browser/axe suite passed in GitHub CI. The workflow now additionally tests the public production origin at the same three widths; consult the latest Actions run for the current outcome. Live performance has no Lighthouse score yet; one uncached network fetch is not a performance benchmark.
