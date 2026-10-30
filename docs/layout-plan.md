# SkinTwin: layout and journey plan

## 1. The vision, in the user's words

> "Scan my face. Meet people whose skin measures like mine. See what actually worked for them, proven by their scans. Follow that routine and watch my own skin prove it."

SkinTwin is **not a store**. It tells you *what* to use and *why*, then links out to *where* to buy it: a retailer, or the creator's own link.

Every screen should answer one of four questions, in this order:

| # | The user is asking | SkinTwin answers with |
|---|---|---|
| 1 | "What's my skin like?" | Your skin map, 8 scores, skin type |
| 2 | "Who has skin like mine?" | Your twins: real people, % match |
| 3 | "What worked for them, and will it work for me?" | Products ranked by twin results, with a clear verdict |
| 4 | "Is it working for me?" | Your plan, weekly check-ins, progress toward your goal |

**Test for any feature:** if it doesn't help answer one of these, it's hidden, merged or cut.

---

## 2. What's wrong today

- **The homepage sells the idea, then the app forgets it.** After the first scan nothing repeats the loop, so users see tools, not a journey.
- **Your skin map disappears.** It's shown once after scanning, then buried in "Full report". There's no "my skin" home.
- **The top bar has four sections, plus five tools reached from random corners:** Mix Lab, Quick pick, AR mirror, Add from cart, This week. Nobody knows they exist or why.
- **It looks like a shop:** shopping-bag icons, prices up front, "Find a store nearby". The point gets lost.
- **No first-time guidance.**

---

## 3. New structure: five tabs that follow the loop

| Tab | Name | Answers | Holds |
|---|---|---|---|
| 1 | **Home** | "What should I do today?" | Before a scan: the landing page. After: a *Today* dashboard. |
| 2 | **Twins** | Q2 | Feed of twin results, search, twin profiles, routines to adopt |
| ◉ | **Check-in** (centre button) | Q1 and Q4 | First visit: scan. After: weekly check-in |
| 3 | **Products** | Q3 | Ranked for *your* skin with a verdict on every product; Quick pick lives here |
| 4 | **Plan** | Q4 | Today's routine, weekly planner, what you own, Mix Lab preview |
| 5 | **Me** | Q1 and Q4 | **My skin** (heatmap, scores, progress, goal, journal), AR mirror, saved items, settings |

Desktop uses the same five items in the top bar. **Journal stops being its own tab** and moves into *Me → My skin*, because progress belongs to your skin.

---

## 4. Every feature: keep, move, merge or cut

| Feature | Today | Decision | New home |
|---|---|---|---|
| Landing page | Long, repeats itself | **Keep, shorten** to the 4 questions with a visual each | Home (logged out) |
| Scan | Shows the Demo/Live switch | **Keep**, move the switch to Settings → Developer | Check-in button |
| Skin map reveal | Shown once | **Keep** as the post-scan reveal, and **pin it permanently** | Me → My skin (top) |
| Full report | Separate page | **Merge** | Me → My skin (scroll sections) |
| Twins feed and search | Good | **Keep**; the avatar row shows only real twins (80% match or more) | Twins |
| Twin profile and "Copy routine with swaps" | Good | **Keep**; this is the core action | Twins → profile |
| Routines from people like you | On Plan | **Keep**, and also show at the top of Twins | Twins and Plan |
| Discover | Shop-like grid | **Rework**: a verdict badge on every card ("Worked for 82% of twins" / "Risky for your skin"), no shopping bags | Products |
| Product page | Numbers first | **Rework**: verdict first, then twin results, visual reviews, **Where to buy** (outbound links), Add to plan | Products → product |
| Quick pick (swipe) | Hidden | **Keep, small**: a "Can't decide? Quick pick" button | Products |
| Mix Lab | Hidden | **Move**: "Preview my routine on my face" | Plan |
| AR mirror | Hidden | **Move**: "Live mirror" | Me → My skin, plus makeup product pages |
| Makeup shade match | Product page | **Keep** on makeup products only | Products → makeup |
| Add from cart (import) | Hidden | **Rename** "Add what I own" | Plan → My shelf |
| Weekly planner | Plan | **Keep** | Plan |
| This week (check-in result) | Separate page | **Keep** as the screen after each check-in; Home shows a "Check-in due" card | After check-in |
| Goals | Journal | **Move** | Me → My skin |
| Journal photos | Journal tab | **Move** | Me → My skin → Journal |
| Write a review (voice, link) | /share | **Keep**; prompted from Plan once a product hits 3 weeks | Plan prompt and product page |
| Profile photo and name | Me | **Keep** | Me header |
| Wishlist, following, my reviews | Me | **Keep** | Me |
| For brands | Footer | **Keep** in the footer only | Footer |
| Cart or checkout | Not built | **Won't build** (not a store) | — |
| Demo controls | Visible | **Hide** in Settings → Developer, or behind `?demo` | Settings |

---

## 5. Key screens: what the eye catches first

### Home, before scanning (landing)

1. **First:** a big face with a scan frame, and the headline *"Find people with your skin. See what actually worked."*
2. **Then:** one button, **"Scan my skin (10 sec)"**, plus "Try a sample face".
3. **Below:** 4 short visual rows, one per question:
   - **Skin map:** heatmap face.
   - **Twins:** three avatars with % match.
   - **Verdict:** "Same toner: 75% improved for everyone, 91% worse for dry skin."
   - **Progress:** a before/after slider.
4. Footer. *(Cut the duplicated marquee and the second product grid.)*

### Home, after scanning ("Today")

1. **First:** my skin card. Mini heatmap, score and skin type, with "Open my skin".
2. A **"Check-in due Thu"** card (or the streak).
3. **Today's routine:** tick boxes for morning and evening.
4. **New from your twins:** 3 visual post tiles.
5. A goal ring (small).

### Me → My skin (the new profile home)

1. **First:** a profile card in the same style as the twin cards. Cover, avatar ring = overall score, name, skin type, "76 twins".
2. **The heatmap face** with the 8 rings. *This is where the skin map always lives.*
3. **Progress:** a score graph plus the goal ring.
4. **Journal:** photo strip, private and blurred.
5. Live mirror button.
6. Tabs: Saved products · Following · My reviews · My shelf.

### Products

1. **First:** a search bar, then **"For you" verdict rails**: "Worked for your twins" (green), and "Popular but risky for you" (orange).
2. Concern tiles.
3. Every card: product art, **verdict chip**, % of twins improved. No price emphasis, no bag icon.
4. A "Can't decide? Quick pick" button.

### Product page

1. **First:** product art plus a **verdict banner**: "Good match for you: 82% of twins like you improved", or "Risky for your skin: 1 in 2 twins got worse".
2. Twin results (bars).
3. Visual reviews from twins.
4. **Where to buy:** outbound retailer links plus creator links, labelled as affiliate.
5. Add to plan, and ingredients (collapsed).

### Plan

1. **First:** today's checklist with progress.
2. The week strip, with strong products spaced out.
3. "Preview my routine on my face" (Mix Lab).
4. **My shelf:** what I own, and "Add what I own".
5. "How's it going?" review prompts.
6. Routines from twins.

---

## 6. First-time tour (after the first scan, never before)

A light coach-mark tour: the screen dims, the item is spotlit, and a short tip shows. You can skip it or replay it from Settings. Five steps:

1. **Skin map:** "This is your skin today. It's always in **Me**."
2. **Twins tab:** "People whose skin measures like yours. Their results are scan-verified."
3. **Products tab:** "Green worked for your twins. Orange was risky for skin like yours."
4. **Plan tab:** "Your routine. We space strong products so they never clash."
5. **Check-in button:** "Scan once a week. We'll show what's working."

It's built in-house: a small spotlight component and `data-tour` markers, with no library.

---

## 7. Wording rules

- One plain sentence per screen headline, in the user's words. No "raw score", "units", "demo", "cohort" or "fit".
- Verbs over nouns: "See what worked", not "Outcomes".
- Every number says *who* it's about: "82% **of twins like you**".

---

## 8. Build order (one commit each, light checks)

1. **Navigation and Me → My skin.**
   - Five tabs; journal, goal and report merged into My skin; heatmap pinned.
   - Tools moved to their homes; demo controls hidden.
2. **Products and product page.**
   - Verdict chips and banner; no shop look; "Where to buy" links out.
   - Quick pick button.
3. **Home.**
   - A shorter landing page built on the 4 questions.
   - A "Today" dashboard after the first scan.
4. **Tour:** the 5-step coach marks.
5. **Fixes from the audit:**
   - a confidence chip next to every verdict. Under 5 twins, it says "Few twins have tried this. Showing everyone's results" and falls back to everyone's results automatically;
   - sample faces;
   - stuck counters;
   - twins row showing only 80%+ matches;
   - a cleanser product;
   - the wording pass.

## 9. For the submission write-up (from external review)

- **State exactly which YouCam APIs do what.** Only claim what's built:
  - **Skin Analysis** (8 concerns, SD): the skin map, scores and twin matching.
  - **Skin Simulation:** Mix Lab's realistic "6 weeks" preview.
  - **Makeup Virtual Try-On:** the mirror's Capture render.
  - We don't use Erythema, Fitzpatrick or Colour-Tone APIs, so we don't claim them. Skin tone for shade matching is measured on the device.
- **Publish the twin-match formula:**
  `match = max(0, 100 − 2.5 × RMS(user − twin))` over the 8 YouCam scores.
  - A twin is 80% or more, which means an average gap of 8 points or less per concern.
  - It's stricter than plain Euclidean-over-max-distance, which would rate almost everyone 80%+.
- **Add a small test suite** (Vitest) for match %, verdicts, the combination model, the planner and swaps, so the core logic is visibly checked.
