"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Check, ScanFace, Star, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BeforeAfter } from "@/components/BeforeAfter";
import { HeroPortrait } from "@/components/home/HeroPortrait";
import { Today } from "@/components/home/Today";
import { WriteOn } from "@/components/WriteOn";
import { useT } from "@/lib/i18n";
import { FaceDiagram } from "@/components/report/Visuals";
import { CONCERN_KEYS, CONCERNS } from "@/lib/concerns";
import { CountUp, EASE, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProductVisual } from "@/components/ProductArt";
import { COHORT_SIZE, FEATURED } from "@/lib/cohort";
import { PEOPLE, personAvatar, portraitPath } from "@/lib/people";
import { productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { everyone, findTwins, outcomeFor } from "@/lib/twins";

const AMARA = portraitPath("amara");
// Placeholder "after" until a YouCam Skin Simulation render is generated.
const AFTER_STYLE = { filter: "saturate(1.04) brightness(1.04) contrast(0.96)" };

const amara = FEATURED.find((m) => m.personId === "amara")!;
const amaraTwins = findTwins(amara.scores, "amara");
// The hero "irritant" concept: loved overall, rough for reactive skin.
const DEMO = (() => {
  const p = productById("aura-bha-toner")!;
  const dry = everyone().filter((x) => x.member.archetype === "dry-sensitive");
  return { p, all: outcomeFor(p.id, everyone()), twins: outcomeFor(p.id, amaraTwins), dry: outcomeFor(p.id, dry) };
})();

const STATS = [
  { value: 8, suffix: "", label: "skin scores per scan" },
  { value: COHORT_SIZE, suffix: "", label: "profiles to match with" },
  { value: 3, suffix: "+ wk", label: "between verified scans" },
];



export default function Home() {
  const { latest, ready } = useStore();
  const { t } = useT();
  if (ready && latest) return <Today />;
  return (
    <div className="overflow-hidden">
      {/* Hero: portrait with scan frames, headline left, stats right */}
      <section className="relative bg-gradient-to-b from-blush-100/60 to-blush-50">
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[1fr_1.2fr_11rem] lg:px-8 lg:py-14">
          <div className="lg:order-1">
            <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-plum shadow-card">
              <span className="size-1.5 rounded-full bg-rose" /> {t("hero.eyebrow")}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
              className="mt-5 font-display text-[3rem] leading-[0.95] tracking-tight sm:text-6xl 2xl:text-7xl"
            >
              <WriteOn key={t("hero.title")} text={t("hero.title")} mark={t("hero.mark")} delay={0.1} />
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
              className="mt-5 max-w-sm text-base text-muted"
            >
              {t("hero.sub")}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.25 }} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/scan" className="inline-flex items-center gap-2 rounded-full bg-plum-deep px-7 py-3.5 text-sm font-medium text-white shadow-soft transition hover:bg-plum">
                <ScanFace className="size-4" /> {t("hero.cta")}
              </Link>
              <Link href="/scan#samples" className="rounded-full border border-line bg-surface px-6 py-3.5 text-sm text-plum">
                {t("hero.sample")}
              </Link>
            </motion.div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {PEOPLE.slice(0, 5).map((p) => (
                  <Avatar key={p.id} config={personAvatar(p.id)} className="size-8 border-2 border-blush-50 text-xs" />
                ))}
              </div>
              <p className="text-xs text-muted">{t("hero.free")}</p>
            </div>
          </div>

          <motion.div className="lg:order-2" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}>
            <HeroPortrait />
          </motion.div>

          <Stagger as="ul" className="grid grid-cols-3 gap-4 lg:order-3 lg:grid-cols-1 lg:gap-8">
            {STATS.map((s) => (
              <StaggerItem key={s.label} className="border-l-2 border-blush-200 pl-3">
                <p className="font-display text-3xl text-plum-deep">
                  <CountUp value={s.value} />
                  {s.suffix}
                </p>
                <p className="text-[11px] leading-snug text-muted">{s.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* The pain, then three promises */}
      <section className="border-y border-line bg-surface/70 py-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="max-w-3xl font-display text-3xl leading-tight tracking-tight lg:text-5xl">
            <WriteOn key={t("pain.title")} text={t("pain.title")} mark={t("pain.mark")} />
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted">{t("pain.sub")}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { t: t("p1.t"), d: t("p1.d") },
              { t: t("p2.t"), d: t("p2.d") },
              { t: t("p3.t"), d: t("p3.d") },
            ].map((x, i) => (
              <Reveal key={x.t} className="rounded-[2rem] border border-line bg-blush-50 p-6" delay={i * 0.08}>
                <span className="grid size-9 place-items-center rounded-full bg-plum-deep text-sm text-white"><Check className="size-4" /></span>
                <p className="mt-4 font-display text-2xl text-ink">{x.t}</p>
                <p className="mt-1 text-sm text-muted">{x.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 1 and 2: your skin, then people like you */}
      <section className="py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-2 lg:px-8">
          <Reveal className="rounded-[2.5rem] border border-line bg-surface p-7">
            <Q n={1} q={t("q1")} a={t("a1")} />
            <p className="mt-3 inline-block rounded-full bg-blush-100 px-2.5 py-0.5 text-[10px] text-plum">Example · sample face</p>
            <div className="mt-6 grid grid-cols-[8rem_1fr] items-center gap-5">
              <div className="aspect-[5/6]"><FaceDiagram scores={amara.scores} /></div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {CONCERN_KEYS.map((k) => (
                  <li key={k} className="flex items-center justify-between border-b border-line pb-1">
                    <span className="text-muted">{CONCERNS[k].label}</span>
                    <span className="font-medium">{amara.scores[k]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal className="rounded-[2.5rem] border border-line bg-surface p-7">
            <Q n={2} q={t("q2")} a={t("a2")} />
            <p className="mt-3 inline-block rounded-full bg-blush-100 px-2.5 py-0.5 text-[10px] text-plum">Example · twins of the sample face</p>
            <ul className="mt-6 space-y-2">
              {amaraTwins
                .filter((t) => t.member.personId)
                .slice(0, 3)
                .map((t) => (
                  <li key={t.member.id} className="flex items-center gap-3 rounded-2xl bg-blush-50 p-2.5">
                    <Avatar config={personAvatar(t.member.personId!)} className="size-10 text-sm" />
                    <span className="flex-1 text-sm">{PEOPLE.find((p) => p.id === t.member.personId)?.name}</span>
                    <span className="rounded-full bg-plum-soft px-2.5 py-1 text-xs font-medium text-plum">{t.similarity}% match</span>
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-xs text-muted">+ {amaraTwins.length - 3} more twins for this sample face</p>
          </Reveal>
        </div>
      </section>

      {/* Same product, different skin */}
      <section className="bg-surface/70 py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal className="text-center">
            <Q n={3} q={t("q3")} a={t("a3")} center />
          </Reveal>
          <div className="mt-12 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <Reveal className="rounded-[2rem] border border-line bg-blush-50 p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Everyone</p>
              <div className="mt-4 flex items-center gap-4">
                <div className={`relative size-24 shrink-0 rounded-full bg-gradient-to-br ${DEMO.p.hue}`}>
                  <ProductVisual product={DEMO.p} className="absolute inset-[10%] h-[80%] w-[80%]" />
                </div>
                <div>
                  <p className="flex items-center gap-1 font-display text-4xl">
                    {DEMO.all.avgRating} <Star className="size-6 fill-rose text-rose" />
                  </p>
                  <p className="text-sm text-muted">{DEMO.all.n} reviews · {DEMO.all.improvedPct}% improved</p>
                </div>
              </div>
            </Reveal>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mx-auto grid size-14 place-items-center rounded-full bg-plum-deep font-display text-white"
            >
              vs
            </motion.div>
            <Reveal delay={0.1} className="glow-card rounded-[2rem] p-6 text-white shadow-soft">
              <p className="text-xs uppercase tracking-[0.18em] opacity-80">Dry & sensitive twins</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {["lena", "hannah", "yuki"].map((id) => (
                    <Avatar key={id} config={personAvatar(id)} className="size-12 border-2 border-white text-base" />
                  ))}
                </div>
                <div>
                  <p className="font-display text-4xl">
                    <CountUp value={DEMO.dry.worsenedPct} />% <span className="text-xl">got worse</span>
                  </p>
                  <p className="flex items-center gap-1 text-sm opacity-90">
                    <BadgeCheck className="size-4" /> measured by skin scan
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            {DEMO.p.brand} {DEMO.p.name} · sample community data
          </p>
        </div>
      </section>

      {/* Before / after */}
      <section className="py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <BeforeAfter before={AMARA} after={AMARA} afterStyle={AFTER_STYLE} labels={["Today", "Week 8"]} className="aspect-[4/5] rounded-[2.5rem] shadow-soft" />
          </Reveal>
          <div>
            <Reveal>
              <Q n={4} q={t("q4")} a={t("a4")} />
              <h2 className="sr-only">
                Progress you can actually see.
              </h2>
              <p className="mt-4 text-muted">Weekly check-ins turn slow changes into numbers. Drag the slider.</p>
            </Reveal>
            <Stagger as="div" className="mt-8 grid grid-cols-2 gap-3">
              {[
                ["Clarity", "+12"],
                ["Pores", "+9"],
                ["Oil balance", "+8"],
                ["Glow", "+6"],
              ].map(([k, v]) => (
                <StaggerItem as="div" key={k} className="rounded-3xl border border-line bg-surface p-5">
                  <p className="text-xs text-muted">{k}</p>
                  <p className="font-display text-3xl text-good">{v}</p>
                </StaggerItem>
              ))}
            </Stagger>
            <p className="mt-3 text-[11px] text-muted">Illustrative 8-week result on a sample face.</p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-5 py-20 lg:px-8">
        <Reveal className="glow-card relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] px-8 py-16 text-center text-white shadow-soft">
          <Users className="mx-auto size-10 opacity-80" />
          <h2 className="mt-4 font-display text-4xl lg:text-5xl">{t("close.title")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm opacity-90">{t("close.sub")}</p>
          <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm opacity-95">
            {[t("close.t1"), t("close.t2"), t("close.t3")].map((x) => (
              <li key={x} className="inline-flex items-center gap-1.5">
                <Check className="size-4" /> {x}
              </li>
            ))}
          </ul>
          <Link href="/scan" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-medium text-plum-deep">
            {t("close.cta")} <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}

// A numbered question with its one-line answer: the four steps of SkinTwin.
function Q({ n, q, a, center }: { n: number; q: string; a: string; center?: boolean }) {
  const { t } = useT();
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : ""}>
      <p className={`flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-plum ${center ? "justify-center" : ""}`}>
        <span className="grid size-6 place-items-center rounded-full bg-plum-deep text-[11px] text-white">{n}</span> {t("step", { n })}
      </p>
      <h2 className="mt-2 font-display text-3xl lg:text-4xl"><WriteOn key={q} text={q} /></h2>
      <p className="mt-2 text-sm text-muted">{a}</p>
    </div>
  );
}
