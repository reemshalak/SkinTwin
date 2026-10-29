"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Check, ScanFace, Star, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BeforeAfter } from "@/components/BeforeAfter";
import { HeroPortrait } from "@/components/home/HeroPortrait";
import { CountUp, EASE, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProductVisual } from "@/components/ProductArt";
import { COHORT_SIZE, FEATURED } from "@/lib/cohort";
import { PEOPLE, personAvatar, portraitPath } from "@/lib/people";
import { productById, PRODUCTS } from "@/lib/products";
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

const STEPS = [
  { img: "/showcase/m-analysis.jpg", title: "Scan", text: "8 skin scores in 10 seconds" },
  { img: "/showcase/m-twins.jpg", title: "Match", text: "People whose skin measures like yours" },
  { img: "/showcase/m-product.jpg", title: "Shop", text: "What measurably worked for them" },
];

function Phone({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`rounded-[2.2rem] border-[6px] border-ink bg-ink p-0.5 shadow-soft ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full rounded-[1.7rem]" loading="lazy" />
    </div>
  );
}

export default function Home() {
  const { latest, ready } = useStore();
  return (
    <div className="overflow-hidden">
      {/* Hero: portrait with scan frames, headline left, stats right */}
      <section className="relative bg-gradient-to-b from-blush-100/60 to-blush-50">
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[1fr_1.2fr_11rem] lg:px-8 lg:py-14">
          <div className="lg:order-1">
            <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-plum shadow-card">
              <span className="size-1.5 rounded-full bg-rose" /> Powered by YouCam AI Skin Analysis
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
              className="mt-5 font-display text-5xl leading-[1.02] sm:text-6xl"
            >
              Skincare matched to <em className="text-plum">skin like yours.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
              className="mt-5 max-w-sm text-base text-muted"
            >
              Scan your face. Meet your skin twins. Buy what actually worked for them.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.25 }} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/scan" className="inline-flex items-center gap-2 rounded-full bg-plum-deep px-7 py-3.5 text-sm font-medium text-white shadow-soft transition hover:bg-plum">
                <ScanFace className="size-4" /> Analyse my skin
              </Link>
              {ready && latest && (
                <Link href="/report" className="rounded-full border border-line bg-surface px-6 py-3.5 text-sm text-plum">
                  My results
                </Link>
              )}
            </motion.div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {PEOPLE.slice(0, 5).map((p) => (
                  <Avatar key={p.id} config={personAvatar(p.id)} className="size-8 border-2 border-blush-50 text-xs" />
                ))}
              </div>
              <p className="text-xs text-muted">Free · no sign-up · photos stay private</p>
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

      {/* Same product, different skin */}
      <section className="bg-surface/70 py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl lg:text-5xl">
              Same product. <em className="text-plum">Different skin.</em>
            </h2>
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
              <h2 className="font-display text-3xl lg:text-5xl">
                Progress you can <em className="text-plum">actually see.</em>
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

      {/* Three taps: real screens */}
      <section className="bg-gradient-to-b from-blush-100/60 to-blush-50 py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl lg:text-5xl">Three taps. That&apos;s it.</h2>
          </Reveal>
          <Stagger as="div" className="mt-14 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <StaggerItem as="div" key={s.title} className={`text-center ${i === 1 ? "sm:-translate-y-6" : ""}`}>
                <motion.div whileHover={{ y: -8, rotate: i === 0 ? -2 : i === 2 ? 2 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
                  <Phone src={s.img} alt={`${s.title} screen`} className="mx-auto max-w-[15rem]" />
                </motion.div>
                <p className="mt-6 flex items-center justify-center gap-2 text-lg font-medium">
                  <span className="grid size-7 place-items-center rounded-full bg-plum-deep text-xs text-white">{i + 1}</span> {s.title}
                </p>
                <p className="text-sm text-muted">{s.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* People marquee */}
      <section className="py-16">
        <Reveal className="mx-auto max-w-6xl px-5 text-center lg:px-8">
          <h2 className="font-display text-3xl lg:text-4xl">
            Real routines. <em className="text-plum">Measured results.</em>
          </h2>
        </Reveal>
        <div className="relative mt-10 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div className="flex w-max gap-4" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 40, ease: "linear", repeat: Infinity }}>
            {[...PEOPLE, ...PEOPLE].map((p, i) => (
              <Link key={`${p.id}-${i}`} href={`/twins/${p.id}`} className="group w-44 shrink-0 rounded-3xl border border-line bg-surface p-4 transition hover:shadow-soft">
                <Avatar config={personAvatar(p.id)} label={`${p.name}'s avatar`} className="size-12 text-lg transition group-hover:scale-105" />
                <p className="mt-3 text-sm font-medium">
                  {p.name}, {p.age}
                </p>
                <p className="text-[11px] text-muted">{p.city}</p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-muted">&ldquo;{p.goal}&rdquo;</p>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="bg-surface/70 py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl lg:text-4xl">
              Ranked by <em className="text-plum">results, not reviews.</em>
            </h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-plum">
              Discover products <ArrowRight className="size-4" />
            </Link>
          </Reveal>
          <Stagger as="div" className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PRODUCTS.filter((p) => p.category !== "makeup")
              .slice(0, 8)
              .map((p) => (
                <StaggerItem as="div" key={p.id}>
                  <Link href={`/product/${p.id}`} className="group block rounded-[2rem] bg-blush-100/70 p-4 text-center transition hover:-translate-y-1 hover:shadow-soft">
                    <div className={`relative mx-auto aspect-square rounded-full bg-gradient-to-br ${p.hue}`}>
                      <ProductVisual product={p} className="absolute inset-[12%] h-[76%] w-[76%] transition duration-500 group-hover:-rotate-3" />
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm font-medium">{p.name}</p>
                    <p className="text-[11px] text-muted">{p.brand}</p>
                  </Link>
                </StaggerItem>
              ))}
          </Stagger>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-5 py-20 lg:px-8">
        <Reveal className="glow-card relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] px-8 py-16 text-center text-white shadow-soft">
          <Users className="mx-auto size-10 opacity-80" />
          <h2 className="mt-4 font-display text-4xl lg:text-5xl">Find your skin twins</h2>
          <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm opacity-95">
            {["Free", "No sign-up to start", "Photos never shared"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="size-4" /> {t}
              </li>
            ))}
          </ul>
          <Link href="/scan" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-medium text-plum-deep">
            Scan my skin <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
