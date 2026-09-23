# FirstCareerSteps: first revenue test

Status: prepared for review. No outreach, ads or spending has started.

## Offer and goal

The code still charges **$1.99/year**, billed annually. Following the company budget discussion, the recommendation is to test **$4.99/year for new customers after checkout is verified**, hold it steady for 30 days and retain existing subscribers' terms. No price change is included in this PR.

If approved and implemented, the first target is ten independent buyers = $49.90 in initial annual receipts; stretch target twenty-five buyers = $124.75. These are targets before fees and costs, not forecasts or monthly revenue. Exclude paid testers, reimbursed purchases and complimentary access.

The proposed LLC-wide launch ceiling is $1,000, including $200 of uncommitted contingency, while protecting $2,000 of the approximately $3,000 cash balance. FirstCareerSteps should use educator and hiring-touchpoint distribution during this month.

The offer is a first resume plus an optional LinkedIn setup guide. The builder reuses the student's actual reviewed headline, About section, experience and education for LinkedIn, with copy buttons and setup instructions. LinkedIn account creation and publishing remain under the student's control. A photo is not part of the resume flow.

## First distribution test: no paid advertising

At the current $1.99 annual price, a $2 acquisition cost exceeds the initial sale. At the proposed $4.99 annual price, a $5 acquisition cost still exceeds first-year receipts after processing fees. Start with existing distribution rather than buying broad traffic:

1. Make the link available at Brenz hiring touchpoints as an optional resource. Never require a purchase to apply for a job.
2. Invite five counselors, teachers or youth-program leaders to review `/for-educators`, then ask two to use it with a small group. Get permission before messaging or sharing student results.
3. Have at least ten students try the complete flow independently. Observe drop-offs and verify that purchased PDFs are usable.
4. Ask whether a school or employer would fund a later cohort. Record an actual purchase commitment before building bulk-seat billing; no school subscription or sponsor checkout is currently implemented.

Student link: `https://www.firstcareersteps.com/?utm_source=brenz&utm_medium=qr&utm_campaign=first_resume`

Educator link: `https://www.firstcareersteps.com/for-educators?utm_source=partner&utm_medium=referral&utm_campaign=first_resume`

Suggested public post at the current price (update all price references together if the $4.99 test is approved):

“Writing your first resume can be hard when you haven't had a job yet. FirstCareerSteps helps you turn school projects, volunteering and everyday experience into a resume, then walks you through setting up LinkedIn if you want to. Preview your resume free; PDF downloads cost $1.99 per year, billed annually. Built for students and first-time job seekers.”

## Price test decision

Aim for fifty relevant visitors from the same partner channels, with at least twenty completed previews. This is a directional learning sample, not a statistically conclusive experiment. If twenty completed previews produce no purchases, talk to five people who stopped and inspect payment errors before cutting the price again.

## Measurement and decision

Measure builder starts, completed previews, confirmed payments, successful PDF downloads, support requests and repeat educator use. Campaign labels are retained in a first-party cookie for up to 30 days and copied into Stripe Checkout/subscription metadata. Count confirmed paid transactions from Stripe. Tracking is best effort on the same browser; it does not measure every visitor or cross-device behavior.

If students finish but do not purchase, interview them about price, payment method and whether they need a PDF. If they abandon the builder, fix the step where they stop. If educators want it but students cannot pay individually, test a funded cohort before implementing another billing system. Do not buy paid traffic until acquisition cost can fit the actual contribution margin or a separately validated higher-value offer exists.

## Release verification

Check signup → skills → review (no photo step) → Stripe test checkout → webhook → PDF download with an authorized test account. Check that LinkedIn content is saved and reloads, and that another account cannot read or overwrite it. The guide starts from the **current saved profile** and preserves the generated guide with the selected resume; historical resumes do not have full profile snapshots in the current database.

No live payments, prices or database schemas were changed by this work.
