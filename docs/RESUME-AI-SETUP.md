# Restore resume AI generation

The production headline endpoint was tested on September 22, 2026. It returned:

> 401 You do not have access to the organization tied to the API key.

This is an OpenAI credential/organization access failure. Changing the model or
retrying the button will not repair it. The code changes remove the preview
watermarks and handle AI failures, but production generation still requires the
hosting configuration below.

## Hosting configuration

1. In your own OpenAI account, choose a project in an organization you can access.
   Create an API key with permission to use Chat Completions. Keep it private.
   Confirm the project has API billing/credits and access to `gpt-3.5-turbo`, the
   existing resume model (unchanged by this patch).
2. In the hosting project serving `www.firstcareersteps.com`, replace the
   server-only `OPENAI_API_KEY` with that key. On Vercel this is under **Settings
   → Environment Variables**. Apply it to Production and any Preview environment
   where you want AI enabled. Do not use a `NEXT_PUBLIC_` variable for the key.
3. If `OPENAI_ORG_ID` or `OPENAI_PROJECT_ID` is set, ensure each belongs to the
   same organization/project as the new key. Remove stale optional overrides;
   project API keys ordinarily do not need them.
4. Deploy this branch and redeploy after saving the environment changes. Existing
   deployments do not automatically pick up changed environment variables.
5. In the deployed builder, generate headline suggestions, an About section and
   experience bullets. Confirm the new text appears, remains editable and saves
   when continuing to the next step. Confirm the review preview has no watermark.

The connected Vercel account available during this investigation did not expose
this site's hosting project, so production secrets could not be changed or
verified. No production credentials are included in this repository.

## Code changes

- Remove watermark overlays from both resume preview components and the obsolete
  payment/watermark notice on the review page.
- Initialize the OpenAI client inside each resume request; missing keys produce a
  controlled response instead of a route initialization crash.
- Bound requests to 30 seconds on the provider side and 55 seconds in the browser;
  allow 60 seconds for the route. Do not automatically retry provider failures.
- Distinguish configuration, billing, rate-limit, timeout and empty-output errors.
  Log only diagnostic codes, status and request IDs, never keys or resume text.
- Preserve existing resume text on failures, and accept common bullet formats.

No database migration is required. Pricing and payment requirements are unchanged.

## Verification

Run `npm ci`, `npm run test:resume-ai`, and `npx tsc --noEmit`.
The regression tests mock the provider response through the actual OpenAI SDK;
they do not call OpenAI or prove that production credentials have been repaired.

OpenAI's authentication troubleshooting:
https://developers.openai.com/api/docs/guides/error-codes#401---invalid-authentication
