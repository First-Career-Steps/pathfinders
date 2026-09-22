# Restore resume AI generation

The production headline endpoint was tested on September 22, 2026. Initially it
returned an organization-access 401. After the owner replaced the API key, the
response changed to:

> 403 Project does not have access to model gpt-3.5-turbo.

The new key gets past the previous authentication failure. The current blocker is
model access. Resume and LinkedIn writing now default to `gpt-4o-mini`; the optional
server-only `OPENAI_RESUME_MODEL` setting can select another enabled model with
compatible Chat Completions parameters (for example `gpt-4.1-mini`).

PR #1 was confirmed merged, but the production endpoint still returned the old
error format and still requested GPT-3.5 Turbo. The owner's screenshots also showed
the old watermark. The merged commit had no GitHub deployment checks/statuses at
the time of investigation. Deploy the updated `main` branch to the project serving
`www.firstcareersteps.com`; redeploying an older commit would retain the old code.

## Hosting configuration

1. In the OpenAI project that owns the new key, confirm API billing/credits and
   model access for `gpt-4o-mini`. Check the project's model limits/permissions and
   ensure the key can use Chat Completions. A code change cannot grant model access.
2. Keep the new server-only `OPENAI_API_KEY` in the Vercel project serving
   `www.firstcareersteps.com` under **Settings → Environment Variables**, scoped to
   Production and any Preview environment where AI is enabled. Never use a
   `NEXT_PUBLIC_` variable for the key. `OPENAI_RESUME_MODEL` is optional; leave it
   unset for GPT-4o mini. If present, it must name an enabled compatible model.
3. If `OPENAI_ORG_ID` or `OPENAI_PROJECT_ID` is set, ensure each belongs to the
   same organization/project as the new key. Remove stale optional overrides;
   project API keys ordinarily do not need them.
4. Merge the model update and create a new Production deployment from the latest
   `main` commit. In Vercel, check **Settings → Git** is connected to
   `First-Career-Steps/pathfinders` and that the production branch is `main`. On the
   new deployment, verify its Source commit matches the latest merged code and
   that `www.firstcareersteps.com` points to it. Existing deployments do not pick
   up changed environment variables. Do not redeploy an older commit.
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
- Use GPT-4o mini for resume and LinkedIn writing, with a server-side model override.
- Distinguish model-access, configuration, billing, rate-limit, timeout and empty-output errors.
  Log only diagnostic codes, status and request IDs, never keys or resume text.
- Preserve existing resume text on failures, and accept common bullet formats.

No database migration is required. Pricing and payment requirements are unchanged.

## Verification

Run `npm ci`, `npm run test:resume-ai`, and `npx tsc --noEmit`.
The regression tests mock the provider response through the actual OpenAI SDK;
they do not call OpenAI or prove that production credentials have been repaired.

OpenAI's authentication troubleshooting:
https://developers.openai.com/api/docs/guides/error-codes#401---invalid-authentication

Model compatibility: https://developers.openai.com/api/docs/models/gpt-4o-mini
Vercel environment/deployment behavior: https://vercel.com/docs/environment-variables
