# FirstCareerSteps: first revenue test

Status: prepared for review. No outreach, ads or spending has started.

## Offer and goal

Preserve the current **$1.99/year individual subscription**, billed annually. The first goal is **25 unrelated paid customers = $49.75 in initial gross receipts**, before payment fees and AI/hosting costs. This is annual revenue, not monthly revenue. Do not count test payments or complimentary access.

The offer is a first resume plus an optional LinkedIn setup guide. The builder reuses the student's actual reviewed headline, About section, experience and education for LinkedIn, with copy buttons and setup instructions. LinkedIn account creation and publishing remain under the student's control. A photo is not part of the resume flow.

## First distribution test: no paid advertising

At $1.99 per year, an acquisition cost of $2 already exceeds the initial sale before operating costs. Start with existing distribution rather than buying broad traffic:

1. Make the link available at Brenz hiring touchpoints as an optional resource. Never require a purchase to apply for a job.
2. Invite five counselors, teachers or youth-program leaders to review `/for-educators`, then ask two to use it with a small group. Get permission before messaging or sharing student results.
3. Have at least ten students try the complete flow independently. Observe drop-offs and verify that purchased PDFs are usable.
4. Ask whether a school or employer would fund a later cohort. Record an actual purchase commitment before building bulk-seat billing; no school subscription or sponsor checkout is currently implemented.

Student link: `https://www.firstcareersteps.com/?utm_source=brenz&utm_medium=qr&utm_campaign=first_resume`

Educator link: `https://www.firstcareersteps.com/for-educators?utm_source=partner&utm_medium=referral&utm_campaign=first_resume`

Suggested public post:

“Writing your first resume can be hard when you haven't had a job yet. FirstCareerSteps helps you turn school projects, volunteering and everyday experience into a resume, then walks you through setting up LinkedIn if you want to. Preview your resume free; PDF downloads cost $1.99 per year, billed annually. Built for students and first-time job seekers.”

## Measurement and decision

Measure builder starts, completed previews, confirmed payments, successful PDF downloads, support requests and repeat educator use. Campaign labels are retained in a first-party cookie for up to 30 days and copied into Stripe Checkout/subscription metadata. Count confirmed paid transactions from Stripe. Tracking is best effort on the same browser; it does not measure every visitor or cross-device behavior.

If students finish but do not purchase, interview them about price, payment method and whether they need a PDF. If they abandon the builder, fix the step where they stop. If educators want it but students cannot pay individually, test a funded cohort before implementing another billing system. Do not buy paid traffic until acquisition cost can fit the actual contribution margin or a separately validated higher-value offer exists.

## Release verification

Check signup → skills → review (no photo step) → Stripe test checkout → webhook → PDF download with an authorized test account. Check that LinkedIn content is saved and reloads, and that another account cannot read or overwrite it. The guide starts from the **current saved profile** and preserves the generated guide with the selected resume; historical resumes do not have full profile snapshots in the current database.

No live payments, prices or database schemas were changed by this work.
