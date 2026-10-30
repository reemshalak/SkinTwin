# SkinTwin: first-time visitor audit (29 Oct 2026)

Walked through as a new visitor with no saved data: homepage → scan (sample face) → results → twins → product → plan → journal → profile, then a phone-width pass.

**Rating today: 6.5 / 10.**
**Would I use it?** I'd try it once. "91% of dry and sensitive twins got worse on this popular toner" is useful and new. But I'd likely drop off: there are many tools with no clear path, there's no way to buy, and some screens break.

## Critical: breaks the demo or trust

1. **Three of four sample faces have no photo.** Lena, Mei and Rosa show a broken image on the results screen, and the white text on pale pink is unreadable. Most judges will scan a sample face.
2. **No way to buy.** It's a "Skin AI & eCommerce" app, but product pages offer only "Add to routine" and "Find a store nearby". There's no cart, no price total for a routine, and no checkout. A mock checkout would also create "verified purchase" data for reviews.
3. **Numbers show 0% until their animation runs.** The product page read "0% improved · 0% got worse" while the reviews below showed people getting worse. This happens in background tabs, screen recordings and slow devices.
4. **Developer controls are visible to shoppers:**
   - "Demo / YouCam live · uses credits" on the scan page;
   - "Demo: add 4 sample weeks" in the journal;
   - a "Demo scores" pill on results.

## High: confusing

5. **No clear path.**
   - The navigation has four sections, plus Mix Lab, Quick pick, the AR mirror, Add from cart and the weekly page, all reached from different corners.
   - The step counter says "Step 1 of 4" on scan and "Step 4 of 4" on the plan, but steps 2 and 3 never say so.
6. **The twin count contradicts the avatars.** The page says "76 people share your skin", but the avatar row includes 46–56% matches.
7. **Product pages lead with numbers, not a verdict.** There's no line like "Risky for your skin: 1 in 2 twins got worse."
8. **Product reviews are text-heavy and robotic.** They come from "Member M043" and "Member M0OB", unlike the visual Twins feed.
9. **Slow first paint.** Pages fade in; on a phone the hero button is invisible for about 1–2 seconds; the Twins page flashes blank with only the footer showing.
10. **No cleanser in the catalogue.** Every suggested routine skips step one, which skincare-savvy judges will notice.

## Medium

11. **The overall score is unexplained.** "Dry and sensitive skin, scored 72/100" reads oddly.
12. **The profile privacy line is out of date.** It says "Others see only your name and initial", but profile photos now exist.
13. **"Save your results" appears on almost every page.** Show it once after the first result, then only in the profile.
14. **The homepage is long.** The people marquee repeats; it could be shorter.
15. **The camera features need https on phones.** That only works once the site is deployed.

## Missing

- A cart, checkout and order history (these feed "verified purchase").
- Real sample portraits for all four sample faces.
- A short "how it works" explainer or a 20-second intro.
- Real reminders: browser notifications for check-in day.
- A contrast and accessibility pass, especially pink-on-pink in dark mode.

## Fix plan

**Sprint 1: critical**
- Fix the sample faces, plus a readable results fallback.
- Make the counters always reach the right number.
- Move developer controls behind Settings → Developer, or `?demo`.
- Add a cart and a mock checkout.

**Sprint 2: one clear path**
- Home → Scan → Results → Twins → Plan → Check-in, with step 2 and step 3 labelled.
- Group Mix Lab, the AR mirror, Quick pick and Add from cart under one "Tools" entry.
- Show only real twins (80% match or more) in the avatar row.

**Sprint 3: polish**
- A verdict at the top of product pages.
- Visual reviews with real-sounding names.
- Two cleanser products.
- Updated copy, a faster first paint, and fewer save prompts.

**Then:** deploy, run the live YouCam checks, re-audit, and prepare the submission kit.

## Status (30 Oct)

**Fixed:**
- Sample faces (Amara only until more portraits exist).
- Counters always land on their value.
- The twins row shows only 80%+ matches.
- Two cleansers added.
- Demo controls hidden.
- Fewer "save your results" prompts.
- Step labels removed.
- A verdict on every product, with Where to buy.
- New navigation and My skin.
- Landing page and Today screen.
- First-time tour.
- Sign-out clears the device.

**Still open:**
- Visual product reviews with friendlier names.
- Deploy.
- Live YouCam checks.
- Re-audit.
