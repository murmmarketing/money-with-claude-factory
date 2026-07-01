# The Freelance Web Dev & Designer Vault
### 20 battle-tested prompts for the boring, recurring parts of client work

**How to use:** copy a prompt, replace the `[BRACKETED]` variables, paste into Claude or ChatGPT.
Each prompt is engineered to give a role, context, constraints, and an output format — that's why
they beat one-liners. Notes tell you when to reach for each.

---

## 🧲 Section 1 — Winning the work

### 1. Discovery-call question generator
> You are a senior freelance web consultant preparing for a first call with a prospective client.
> The client is [ONE-LINE DESCRIPTION OF CLIENT + PROJECT]. Generate 12 discovery questions that
> uncover: real business goal, success metric, budget range, decision-maker, timeline, existing
> assets, and hidden scope risks. Order them from rapport-building to money. For each, add a
> one-line note on what a bad answer signals.

*Use before every intro call so you never wing it.*

### 2. Proposal draft from messy notes
> You are writing a client proposal for a freelance web project. Here are my raw notes from the
> discovery call: [PASTE NOTES]. Write a proposal with: (1) a one-paragraph restatement of their
> goal in their words, (2) scope broken into phases with deliverables, (3) explicit out-of-scope
> list, (4) timeline, (5) three pricing tiers (good/better/best) with what each includes, (6) next
> step. Tone: confident, plain-English, no jargon. Flag any assumption I should confirm.

*Turns 20 minutes of notes into a send-ready proposal.*

### 3. Price-objection responder
> A client said: "[PASTE THEIR OBJECTION ABOUT PRICE]." I'm a freelance web developer. Write 3
> reply options: (A) hold the price and reframe value, (B) reduce scope to hit their budget, (C)
> phased payment. Each 3–5 sentences, warm but firm, never apologetic or discount-desperate.

*Stops you from panic-discounting over email.*

### 4. Scope-creep defense email
> A client is asking for [DESCRIBE THE EXTRA REQUEST] which is outside our agreed scope: [PASTE
> AGREED SCOPE]. Write a friendly but clear email that: acknowledges the request, explains it's
> outside scope without sounding rigid, offers to add it as a change order with a rough estimate,
> and keeps the relationship warm. Give me a short and a slightly longer version.

*The single most profit-saving prompt in this vault.*

### 5. Follow-up sequence for a cold proposal
> I sent a proposal to [CLIENT] [X DAYS] ago for a [PROJECT TYPE] and heard nothing. Write a
> 3-email follow-up sequence spaced over 10 days: email 1 (gentle nudge + add value), email 2
> (address likely hesitation), email 3 (graceful breakup that leaves the door open). Keep each
> under 90 words.

---

## 🛠️ Section 2 — Doing the work

### 6. Bug triage & root-cause hypotheses
> I'm debugging a web app. Symptom: [DESCRIBE BEHAVIOR]. Stack: [TECH STACK]. Relevant code:
> [PASTE CODE]. What I've already tried: [LIST]. Give me a ranked list of the 5 most likely root
> causes, the fastest test to confirm or rule out each, and the first thing you'd check. Don't
> rewrite the code yet — help me diagnose.

*Diagnosis-first, so you stop guessing.*

### 7. Code review of my own work
> Review this code as a senior engineer doing a PR review. Flag: bugs, security issues, edge cases,
> performance, and readability. Rank findings by severity (blocker/should-fix/nit). Be specific and
> reference line context. Code: [PASTE]. Stack/constraints: [CONTEXT].

### 8. "Explain this legacy code" for handovers
> Explain what this code does as if onboarding a new developer. Give: a one-paragraph summary, a
> step-by-step of the main flow, any surprising behavior or gotchas, and 3 questions I should ask
> the original author. Code: [PASTE].

### 9. Responsive-layout planner
> I'm building [DESCRIBE PAGE/COMPONENT]. Content blocks: [LIST THEM]. Give me a responsive layout
> plan for mobile, tablet, and desktop: stacking order, which elements collapse/hide, breakpoints,
> and 3 layout options ranked by conversion for this content type. Assume Tailwind.

### 10. Accessibility pass
> Audit this component for WCAG 2.2 AA issues: [PASTE HTML/JSX]. List concrete problems with the
> exact fix (color contrast, focus order, labels, alt text, keyboard nav, ARIA). Prioritize by
> user impact. Give me copy-paste corrected snippets.

### 11. Copywriting for a section I'm building
> Write client-ready copy for a [SECTION TYPE, e.g. hero/pricing/features] on a [BUSINESS TYPE]
> website. Audience: [WHO]. Goal: [ACTION]. Give a headline, subhead, 3 benefit bullets, and a CTA.
> Tone: [TONE]. Provide 2 variants. No lorem ipsum — real, specific copy.

*So you stop shipping placeholder text to clients.*

### 12. Meta / SEO tags generator
> Generate SEO metadata for this page: [DESCRIBE PAGE + PRIMARY KEYWORD]. Give: a <title> (≤60
> chars), meta description (≤155 chars, with a CTA), an H1, and 5 semantically related keywords to
> work into the copy. Make the title and description click-worthy, not robotic.

### 13. Git commit + PR description writer
> Write a clear git commit message (conventional-commits format) and a PR description for this
> change: [DESCRIBE WHAT CHANGED AND WHY]. PR description should include: summary, what changed,
> why, how to test, and any risk. Keep the commit subject ≤72 chars.

---

## 📦 Section 3 — Closing & keeping clients

### 14. Client-friendly progress update
> Write a weekly progress update email for a non-technical client on their [PROJECT]. This week I:
> [BULLET WHAT YOU DID]. Next week: [PLAN]. Blocked on: [ANYTHING FROM THEM]. Translate the
> technical work into business value they care about. Warm, concise, confident. Under 150 words.

### 15. Launch / handoff checklist generator
> Generate a pre-launch checklist for a [SITE TYPE] I'm handing to a client. Cover: functionality
> QA, cross-browser/device, performance, SEO basics, analytics, forms, security, backups, and
> what the client needs to maintain it. Format as a checkbox list grouped by category.

### 16. Handoff documentation writer
> Write client handoff documentation for [PROJECT]. Include: how to log in and edit content, how to
> add a blog post/page, where images live, how to update [SPECIFIC THING], who to contact for what,
> and a "please don't touch these" list. Write for a non-technical business owner. Friendly, clear.

### 17. Maintenance-retainer pitch
> I just finished [PROJECT] for [CLIENT]. Write a short email pitching an ongoing monthly
> maintenance & small-updates retainer. Explain what it covers (security updates, backups, small
> tweaks, priority support), why it protects their investment, and offer 2 tiers with prices
> [YOUR PRICES]. Make it feel like care, not an upsell.

*Turns one-off projects into recurring revenue — pairs with your dev business.*

### 18. Testimonial-request email
> Write a short, easy email asking [CLIENT] for a testimonial after a successful [PROJECT]. Make it
> effortless: offer to draft it for them based on our results, or give them 3 quick prompt
> questions to answer. Include a line asking for a referral if they know anyone who needs [SERVICE].

### 19. Case-study writer from a finished project
> Turn this project into a portfolio case study. Details: client [WHO], problem [WHAT], what I built
> [WHAT], results [ANY METRICS/OUTCOMES]. Structure: challenge → approach → solution → result. Keep
> it skimmable with a strong one-line summary at top. Tone: confident, specific, no fluff.

### 20. Niche-positioning statement
> Help me sharpen my freelance positioning. I do [SERVICES], I'm best with [CLIENT TYPE], and what
> makes me different is [DIFFERENTIATOR]. Write 5 one-sentence positioning statements ("I help X do
> Y so they can Z"), ranked by how specific and compelling they are, plus a matching bio line for
> my site and LinkedIn.

---

### Bonus — how to make ANY of these better
Add this to the end of any prompt when the output feels generic:
> "Before you answer, ask me up to 3 clarifying questions if anything is ambiguous. Then give your
> best answer assuming reasonable defaults for anything I didn't specify."

---
*Freelance Web Dev & Designer Vault · v1.0 · Sell it, use it, don't redistribute the file.
Built for solo devs and small studios who'd rather build than fight the blank prompt box.*
