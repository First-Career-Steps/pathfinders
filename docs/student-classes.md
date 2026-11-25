# Student classes

The public catalog is at `/classes`. All five Leadership classes are free and published, covering the 23 chapters in the five parts of Brenen Morse’s book. The five source files in `src/lib/classes/content` include attributed excerpts, editable worksheet fields, quizzes and six scripted walkthroughs. Basics of AI (44 slides) and Brainstorming with AI (42) are published. Leveraging Multiple AIs (46) and Building with AI (48) have full player content staged as Coming soon. Each practical AI JSON file in `src/lib/classes/content` contains slides, quiz questions, copyable prompts, an offline prompt sheet and the narration script. Both advanced classes resolve the same two full texts from `requirements-prompts.json`. Stable slide keys restore progress.

The four retired AI slugs have public replacement notices. Existing learners see their original status in the dashboard archive. An owner with progress can read the old lesson text wherever it exists. Archive reads never start or complete a class. The practical-AI migration widens the course constraint on the existing progress table; the owner policy and deletion cascade still apply.

Editorial speaker notes stay on the server. Distinguish labeled teaching examples from book stories. Guest quotations retain their own attributions. The original Lead Yourself First slide keys map to the corresponding revised topics when a learner returns. Completion dates and scores stay on the original enrollment. Leadership Rhythm is an optional Chapter 20 companion. Supply a video URL, English WebVTT captions and a transcript together in the recording field, and update the landing-page availability. Use the actual learner flow when recording.

## Free enrollment and progress

The SQL migration under `supabase/migrations` creates owner-readable progress with an auth-user deletion cascade. The server grades quizzes. A four-out-of-five pass is retained across later attempts. Worksheets download as editable local HTML with a Print or save as PDF action. Activity drafts stay in the open tab. The only resume transfer is an explicit preview and confirmation, followed by an editable builder draft.

## Later paid release

`CLASSES_PAID_ENABLED` is off unless its server environment value is exactly `true`. Leave it off in v1. Existing enrollments, including started classes, retain full access. With the flag on and no purchase integration, new enrollment closes.

After owner approval, add `class_purchases`, a separate $4.99 one-time Stripe price, a class-specific checkout route, a signature-verified idempotent webhook and a few preview slides. Map purchased entitlements per user and course. Preserve prior free enrollments. Keep the annual subscription flow separate.

## Release checks

Open the catalog and the published class landings signed out. Try the player directly and follow its return link through sign-in. In a test account, navigate away and return, check the mid-quiz, score 3/5 then 4/5 on the end quiz, retry and confirm the pass remains. Download a filled worksheet and print it offline. Preview a completion, skill or bullet, dismiss it, then explicitly confirm a draft and remove it in the builder. Check desktop and phone widths, the keyboard outline and captions when a recording is added. Check database ownership and the account deletion cascade against test identities.
