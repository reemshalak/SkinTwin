"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { ConfidenceBadge, DemoNote, ProductThumb, Stars } from "@/components/ui";
import { COHORT } from "@/lib/cohort";
import { PRODUCTS, productById } from "@/lib/products";
import { REVIEWER_PROFILES } from "@/lib/reviewer-profiles";
import { outcomeFor } from "@/lib/twins";

const SEGMENTS: Record<string, string> = {
  "oily-breakout": "Oily, breakout-prone",
  "dry-sensitive": "Dry & sensitive",
  combination: "Combination",
  mature: "Mature",
  balanced: "Balanced",
};

export default function MerchantPage() {
  const [pid, setPid] = useState("aura-bha-toner");
  const product = productById(pid)!;

  const { all, segments } = useMemo(() => {
    const all = outcomeFor(pid, COHORT.map((member) => ({ member })));
    const segments = Object.keys(SEGMENTS).map((seg) => ({
      seg,
      o: outcomeFor(pid, COHORT.filter((m) => m.archetype === seg).map((member) => ({ member }))),
    }));
    return { all, segments };
  }, [pid]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/shop" className="flex items-center gap-1.5 text-sm text-plum">
          <ArrowLeft className="size-4" /> Back to app
        </Link>
        <p className="font-display text-xl text-plum-deep">SkinTwin for brands</p>
      </header>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        A white-label, Shopify-ready eCommerce layer for premium cosmetics storefronts and digital skin clinics. Add one widget
        to your luxury beauty product pages: shoppers scan once and see results from people with skin like theirs, so they buy
        what will work and return less. You see which skin types each product actually suits.
      </p>

      <label className="mt-5 block text-xs text-muted">
        Product
        <select
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          className="mt-1 block w-full max-w-sm rounded-2xl border border-line bg-surface px-3 py-2.5 text-sm text-ink"
        >
          {PRODUCTS.filter((p) => p.category !== "makeup").map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Store product page mock with the embedded widget */}
        <section className="rounded-[2rem] border border-line bg-surface p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Luxury beauty PDP · preview</p>
          <div className="mt-3 flex gap-4">
            <ProductThumb product={product} />
            <div>
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted"><Stars value={all.avgRating} /> {all.avgRating} · {all.n} reviews</p>
              <p className="mt-1 text-sm font-medium text-plum">${product.price}</p>
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-blush-200 bg-blush-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-plum">
              <Users className="size-3.5" /> SkinTwin widget
            </p>
            <p className="mt-2 text-sm">Will this work for <em>your</em> skin?</p>
            <button className="mt-3 w-full rounded-full bg-gradient-to-r from-rose to-plum py-2.5 text-xs font-medium text-white">
              Scan my skin · 10 sec
            </button>
            <p className="mt-2 text-center text-[10px] text-muted">Powered by YouCam Skin Analysis</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-line bg-surface p-5">
          <h2 className="text-sm font-medium">Who this product works for</h2>
          <p className="text-[11px] text-muted">Measured before/after change by skin segment</p>
          <table className="mt-3 w-full text-xs">
            <thead className="text-left text-[10px] text-muted">
              <tr>
                <th className="py-1 font-normal">Segment</th>
                <th className="py-1 text-right font-normal">Improved</th>
                <th className="py-1 text-right font-normal">Got worse</th>
                <th className="py-1 text-right font-normal">Stars</th>
              </tr>
            </thead>
            <tbody>
              {segments.map(({ seg, o }) => (
                <tr key={seg} className="border-t border-line">
                  <td className="py-2">
                    {SEGMENTS[seg]}
                    <div className="mt-0.5"><ConfidenceBadge level={o.confidence} n={o.n} /></div>
                  </td>
                  <td className="py-2 text-right font-medium text-good">{o.improvedPct}%</td>
                  <td className={`py-2 text-right font-medium ${o.worsenedPct >= 25 ? "text-bad" : "text-muted"}`}>{o.worsenedPct}%</td>
                  <td className="py-2 text-right">{o.avgRating}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 rounded-2xl bg-blush-100 p-3 text-[11px] leading-relaxed text-ink">
            Star ratings hide this: the product averages {all.avgRating}★ overall, yet results differ sharply by skin type. Steering
            each shopper to the right product is where returns and bad reviews drop.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-[2rem] border border-line bg-surface p-5">
        <h2 className="text-sm font-medium">Embed</h2>
        <pre className="mt-2 overflow-x-auto rounded-2xl bg-ink p-4 text-[11px] leading-relaxed text-blush-100">
{`<script src="https://skintwin.app/widget.js"
  data-product-sku="${product.id}" async></script>`}
        </pre>
        <p className="mt-2 text-[11px] text-muted">Concept snippet for the prototype. The widget isn&apos;t a published package.</p>
      </section>

      <section className="mt-6 rounded-[2rem] border border-line bg-surface p-5">
        <h2 className="text-sm font-medium">Reviewer dataset</h2>
        <p className="mt-1 text-xs text-muted">
          {REVIEWER_PROFILES.length.toLocaleString()} anonymised reviewer records in the <code>ReviewerProfile</code> schema: product concept, YouCam skin
          metrics and rating, no names or brands.
        </p>
        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([JSON.stringify(REVIEWER_PROFILES, null, 2)], { type: "application/json" }));
            a.download = "skintwin-reviewer-profiles.json";
            a.click();
            URL.revokeObjectURL(a.href);
          }}
          className="mt-3 rounded-full border border-line px-4 py-2 text-sm text-plum"
        >
          Download sample dataset (JSON)
        </button>
      </section>

      <div className="mt-4 max-w-2xl">
        <DemoNote>Segment results come from the synthetic demo cohort, not real shoppers.</DemoNote>
      </div>
    </div>
  );
}
