# Nyanchiew Malual

Production React/Vite website deployed on Netlify, with Netlify Functions,
Supabase content and authentication, and booking emails through Resend or an
owner-authorized Gmail/Outlook mailbox.

## Deploy to Netlify

Connect the repository to Netlify and use the project root as the base directory.
[`netlify.toml`](netlify.toml) configures the build (`npm run build`), publish
directory (`dist`), Node.js 22, Functions, API rewrites, SPA fallback, and security
headers. Netlify installs from `package-lock.json`; the production build runs lint
and checks the required configuration before compiling.

Before the first successful production deploy:

1. Complete the Supabase database and studio setup below.
2. Configure a verified Resend sender domain, or complete Gmail/Outlook mailbox
   authorization as described below. The production build checks for a working
   email configuration, so it will fail until one is set.
3. Create the Netlify site and add the required variables from
   [`.env.example`](.env.example) in **Site configuration → Environment variables**.
   Use the Production deploy context. The production check runs during the build,
   so `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the selected email provider's
   variables must be available to both Builds and Functions. The `VITE_` Supabase
   values are needed during Builds. Never prefix secrets with `VITE_`.
4. Trigger or retry a deploy. Environment variable changes require a new deploy.
5. In Supabase Authentication URL Configuration, set the Site URL to your Netlify
   site URL and configure any authentication redirects you use.
6. Check direct visits to `/stories`, `/podcast`, and `/nyanchiew-studio`. Then
   verify publishing, a booking, both booking emails, and newsletter signup.

In Netlify, choose **Add new site → Import an existing project**, connect the Git
provider that holds this repository, and select the repository. Set the base
directory to the repository root. Netlify may start an initial deploy as soon as
you create the site; if the required variables are not set yet, that build will
fail its configuration check. Add the variables and retry the deploy. The values
from `netlify.toml` should appear as
the build command, publish directory, and Functions directory; confirm they are
`npm run build`, `dist`, and `netlify/functions`, then create the site. Add the
environment variables above and start or retry the deploy. You can also deploy
from the repository root with the Netlify CLI, but connecting Git is the easiest
way to get automatic production deploys after future pushes.

The site keeps its `/api/...` URLs. Netlify rewrites those requests to the matching
Functions, while other paths fall back to the React application. See the official
[Netlify configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/)
and [Functions](https://docs.netlify.com/build/functions/overview/) guides.

## Supabase and studio access

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor. It is
safe to rerun for this project's existing schema and updates the access policies.

Create a confirmed email/password account in **Authentication → Users**. Edit
the owner email in [`supabase/create-admin.sql`](supabase/create-admin.sql), then
run that script in the SQL Editor. For an existing owner account, grant access to
that same account; you do not need to recreate it.

Only accounts listed in `studio_admins` can publish, edit content, or read booking
and subscriber records. Signing in alone does not grant studio access. Keep public
account sign-ups disabled when only the owner needs a login.

Open `https://your-netlify-site/nyanchiew-studio` and sign in. The studio supports
YouTube links for episodes and story text/external article links for written
content. Images use hosted URLs; direct media uploads are not implemented. The
portrait is `public/images/chiogong.jpeg`.

## Environment variables

| Variables | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Public browser configuration; required at build time |
| `SUPABASE_URL` | Same project's server URL; falls back to `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database writes and view counting |
| `EMAIL_PROVIDER` | `resend`, `gmail`, or `outlook` |
| `ADMIN_EMAIL` | Inbox receiving booking notifications and visitor replies |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Resend API key and verified sender address |
| `MAILBOX_EMAIL`, `MAILBOX_CLIENT_ID`, `MAILBOX_CLIENT_SECRET`, `MAILBOX_REFRESH_TOKEN` | Optional Gmail/Outlook mailbox authorization |
| `MAILBOX_NAME` | Optional mailbox sender name |
| `MAILBOX_TENANT_ID` | Optional Outlook tenant; defaults to `common` |

Use the Supabase publishable/anon key in `VITE_SUPABASE_ANON_KEY`. Never put
service-role keys, email API keys, mailbox secrets, or refresh tokens in a `VITE_`
variable. Set sensitive values in Netlify's environment variable settings, not in
`netlify.toml` or committed files. Netlify Functions need the server secrets at
runtime, and the production build check needs the server values during Builds;
the Vite `VITE_` values need to be available during Builds. If you enable Deploy
Previews or branch deploys, configure valid values for those deploy contexts too,
or disable those deploy types. See Netlify's
[environment variable guide](https://docs.netlify.com/build/environment-variables/overview/).

## Booking emails

Visitors can book with any valid email address. The configured owner sender sends
both the notification to `ADMIN_EMAIL` and the confirmation to the visitor. The
visitor address is used as Reply-To; it is never used as the sender.

### Resend (recommended)

Resend is the simplest option for production transactional email. You need a
domain you control and access to its DNS settings; you do not need to buy a mailbox
for that domain. Add and verify the domain in Resend, then set:

- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY` to your Resend API key
- `RESEND_FROM_EMAIL` to an address on the verified domain, such as
  `Bookings <bookings@yourdomain.com>`
- `ADMIN_EMAIL` to the inbox where you want notifications (Gmail is fine)

See Resend's [domain verification guide](https://resend.com/docs/dashboard/domains/introduction).
Resend's test sender and personal Gmail/Outlook From addresses are not accepted
by the production configuration check.

### Gmail or Outlook mailbox (optional)

These providers send from the owner's actual mailbox and require OAuth app
credentials plus a refresh token. Visitors do not need to authorize their account.
If you already have the credentials, copy `.env.example` to `.env.local`, configure
the mailbox values, and run `npm run connect:mail -- gmail` or
`npm run connect:mail -- outlook`. The setup command stores a refresh token locally
without printing it. Copy the resulting settings to Netlify's Function environment
and redeploy. Mailbox refresh tokens can expire or be revoked, so Resend is easier
to maintain for a site that only needs booking notifications.

Bookings remain saved if an email fails; the receipt reports the email status.
Netlify Function logs include booking reference, recipient role, and provider
acceptance or failure. Provider acceptance does not guarantee inbox delivery.

## Project checks and layout

Run `npm run lint`, `npm run check:production`, and `npm run build` before
deployment. Set valid credentials in your local environment first; the production
check does not connect to Supabase or send email.

`src/` and `public/` hold the website. `netlify/functions/` contains Netlify entry
points; `server/handlers/` contains the shared `/api/...` request logic, and
`server/` contains runtime helpers. `supabase/` contains the database schema and
studio owner SQL. `scripts/check-production.mjs` checks deployment configuration.
