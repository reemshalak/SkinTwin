# SkinTwin: full evaluation (30 Oct 2026)

Judged as a real product and as a hackathon entry, based on the code and a fresh visit.

## Who it's for
- **Main user:** 18–35, buys skincare often, has wasted money on products that broke them out (acne-prone, sensitive, oily). Arrives from social media, wants an answer before buying.
- **Second user:** someone starting a routine who wants to know if it's working.
- **Brands** (the "For brands" page) are a later business model, not a user today.

## Scores
| Area | Score | Why |
|---|---|---|
| Idea and value | 8.5 | "Results from people with skin like yours, measured by scans" is clear, new and useful. |
| Clarity | 7 | The landing tells the 4-question story well. Inside the app, ~20 pages blur it. |
| Accuracy and trust | 4.5 | Without live mode, a selfie gets made-up scores that look real. All twins and results are sample data. |
| Flow | 6.5 | Scan → twins → product works. Extra features (Swipe, Mix Lab, Mirror, Import, Circles) pull attention away. |
| Return rate | 3.5 | Nothing is saved to the account, so a new device or sign-out loses everything. Reminders only fire while the tab is open. |
| Polish | 7.5 | Looks good, 4 languages, dark mode. Small bugs (landing counters can show 0). |
| **Overall** | **6** | A strong idea held back by data that doesn't persist and scores that aren't real. |

## Main problems, by impact
1. **Account saving was fragile.** Data was saved inside the sign-in token, which grows with every scan and profile photo. Now moved to a private table (supabase/add-user-state.sql), with the old way as a fallback until the SQL is run.
2. **Demo scores look real.** With live mode off, a selfie gets numbers made from the photo's hash. Someone scanning their own face sees confident numbers that aren't about their skin.
3. **Twins are all sample people.** 1,240 generated profiles. Two real users never match each other, and real reviews don't change the verdicts.
4. **Too many features for the story.** Judges have a few minutes. Swipe deck, Mix Lab, Mirror makeup and cart import are fun but aren't one of the four questions.
5. **Live YouCam features are untested.** Skin Simulation and Makeup try-on have never run live; the makeup endpoint name is a guess. For a YouCam hackathon, this matters (about 18 units to test).
6. **Nothing brings people back.** No email or calendar reminder for the weekly check-in.
7. **Small catalogue.** 16 products, so cart import and search often find nothing.
8. **Landing counters can show 0** if the count-up animation doesn't run.

## Recommended fixes, in order
| # | Fix | Effort | Effect |
|---|---|---|---|
| 1 | Save scans, routine, goal and journal to the account (Supabase, private to the user) and load them on sign-in | Medium | Return rate, trust |
| 2 | Mark demo results clearly ("Demo scores, not your skin yet") and run the live checks with approval | Small + units | Accuracy, judging |
| 3 | Move Swipe, Mix Lab, Mirror and Import into one "Extras" area; keep the 4 questions up front | Small | Clarity, flow |
| 4 | Add real users' scores (no photos) to the twin pool, labelled "real" vs "sample" | Medium | Accuracy |
| 5 | "Add weekly check-in to my calendar" button (.ics file) | Small | Return rate |
| 6 | Grow the catalogue to about 40 fictional products | Small | Usefulness |
| 7 | Make landing counters always show their final number | Tiny | Polish |
