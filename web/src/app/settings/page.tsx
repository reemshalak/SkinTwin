"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Bell, Check, Download, ImageOff, Loader2, LogOut, Monitor, Moon, Palette, RotateCcw, ScanFace, Shield, Sun, UserRound } from "lucide-react";
import { Reveal } from "@/components/motion";
import { ScanModeToggle } from "@/components/ScanModeToggle";
import { TOUR_KEY } from "@/components/Tour";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useT } from "@/lib/i18n";
import { Page, PageTitle } from "@/components/Page";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useTheme, type ThemePref } from "@/lib/theme";

function Section({ icon: Icon, title, children }: { icon: typeof Sun; title: string; children: React.ReactNode }) {
  return (
    <Reveal className="rounded-[2rem] border border-line bg-surface p-6">
      <h2 className="flex items-center gap-2 text-base font-medium">
        <span className="grid size-8 place-items-center rounded-full bg-blush-100 text-plum">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </Reveal>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 rounded-full transition ${on ? "bg-plum-deep" : "bg-blush-200"}`}
    >
      <motion.span layout className={`absolute top-1 size-5 rounded-full bg-white shadow ${on ? "right-1" : "left-1"}`} transition={{ type: "spring", stiffness: 500, damping: 32 }} />
    </button>
  );
}

const input = "rounded-2xl border border-line bg-blush-50 px-4 py-2.5 text-sm outline-none transition focus:border-plum";

export default function SettingsPage() {
  const { t } = useT();
  const auth = useAuth();
  const store = useStore();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => setName(auth.name ?? ""), [auth.name]);

  const selfies = store.scans.filter((s) => s.photo?.startsWith("data:")).length;

  async function run(key: string, fn: () => Promise<{ error?: string }>, ok: string) {
    setBusy(key);
    const { error } = await fn();
    setBusy(null);
    setStatus((s) => ({ ...s, [key]: error ?? ok }));
    setTimeout(() => setStatus((s) => ({ ...s, [key]: "" })), 3000);
  }

  async function toggleReminders(on: boolean) {
    if (on && "Notification" in window && Notification.permission === "default") await Notification.requestPermission();
    store.setReminders(on);
  }

  function exportData() {
    const { scans, routine, savedTwins, savedProducts, reminders, reminderTimes } = store;
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), scans, routine, savedTwins, savedProducts, reminders, reminderTimes }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "skintwin-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const themes: { id: ThemePref; label: string; icon: typeof Sun; hint: string }[] = [
    { id: "light", label: "Light", icon: Sun, hint: "Soft blush" },
    { id: "dark", label: "Dark", icon: Moon, hint: "Easy at night" },
    { id: "system", label: "Auto", icon: Monitor, hint: "Match device" },
  ];

  return (
    <Page className="!max-w-3xl">
      <PageTitle eyebrow="Settings" title="Your preferences" subtitle="Account, appearance, reminders and your data." />

      <div className="space-y-6">
        <Section icon={UserRound} title={t("set.account")}>
          {auth.user ? (
            <>
              <Row label="First name">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run("name", () => auth.updateName(name.trim()), "Saved");
                  }}
                >
                  <input value={name} onChange={(e) => setName(e.target.value)} className={`${input} w-40`} aria-label="First name" />
                  <button className="rounded-full bg-plum-deep px-4 text-sm text-white" disabled={busy === "name"}>
                    {busy === "name" ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                  </button>
                </form>
              </Row>
              {status.name && <p className="-mt-2 mb-2 text-right text-xs text-good">{status.name}</p>}
              <Row label="Email" hint="Used to log in">
                <span className="text-sm text-muted">{auth.user.email}</span>
              </Row>
              <Row label="Password" hint="At least 6 characters">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (password.length < 6) return setStatus((s) => ({ ...s, pw: "Use at least 6 characters." }));
                    run("pw", () => auth.updatePassword(password), "Password updated").then(() => setPassword(""));
                  }}
                >
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" autoComplete="new-password" className={`${input} w-40`} aria-label="New password" />
                  <button className="rounded-full border border-line px-4 text-sm text-plum" disabled={busy === "pw"}>
                    {busy === "pw" ? <Loader2 className="size-4 animate-spin" /> : "Update"}
                  </button>
                </form>
              </Row>
              {status.pw && <p className="text-right text-xs text-muted">{status.pw}</p>}
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">You&apos;re using SkinTwin as a guest. Results are saved on this device only.</p>
              {auth.enabled && (
                <div className="flex gap-2">
                  <Link href="/login?next=/settings" className="rounded-full border border-line px-4 py-2 text-sm text-plum">Log in</Link>
                  <Link href="/signup?next=/settings" className="rounded-full bg-plum-deep px-4 py-2 text-sm text-white">Sign up</Link>
                </div>
              )}
            </div>
          )}
        </Section>

        <Section icon={Palette} title={t("set.appearance")}>
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
            {themes.map(({ id, label, icon: Icon, hint }) => (
              <button
                key={id}
                role="radio"
                aria-checked={theme === id}
                onClick={() => setTheme(id)}
                className={`rounded-3xl border p-4 text-left transition ${theme === id ? "border-plum bg-blush-100" : "border-line hover:border-blush-300"}`}
              >
                <span className={`grid size-9 place-items-center rounded-full ${id === "dark" ? "bg-[#231a22] text-[#f0c9d9]" : id === "light" ? "bg-[#fdfcff] text-[#9c5a78] ring-1 ring-[#ecdde5]" : "bg-gradient-to-br from-[#fdfcff] to-[#231a22] text-[#9c5a78]"}`}>
                  <Icon className="size-4" />
                </span>
                <span className="mt-3 flex items-center gap-1 text-sm font-medium">
                  {label} {theme === id && <Check className="size-3.5 text-plum" />}
                </span>
                <span className="text-xs text-muted">{hint}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              try {
                localStorage.removeItem(TOUR_KEY);
              } catch {}
              window.location.href = "/";
            }}
            className="mt-4 rounded-full border border-line px-4 py-2 text-sm text-plum"
          >
            {t("set.tour")}
          </button>
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-sm">Language</p>
            <LanguagePicker variant="row" />
          </div>
        </Section>

        <div id="source" className="scroll-mt-24" />
        <Section icon={ScanFace} title={t("set.source")}>
          <p className="mb-4 text-xs text-muted">
            Demo mode gives simulated scores in the same format as YouCam and costs nothing. Live mode sends new photos to YouCam AI Skin
            Analysis (12 API units each; repeats of the same photo are free).
          </p>
          <ScanModeToggle className="max-w-md" />
        </Section>

        <div id="reminders" className="scroll-mt-24" />
        <Section icon={Bell} title={t("set.reminders")}>
          <Row label="Reminders" hint="A browser notification while SkinTwin is open">
            <Switch on={store.reminders} onChange={toggleReminders} label="Routine reminders" />
          </Row>
          <Row label="Morning routine">
            <input type="time" value={store.reminderTimes.am} onChange={(e) => store.setReminderTimes({ ...store.reminderTimes, am: e.target.value })} className={input} aria-label="Morning reminder time" />
          </Row>
          <Row label="Evening routine">
            <input type="time" value={store.reminderTimes.pm} onChange={(e) => store.setReminderTimes({ ...store.reminderTimes, pm: e.target.value })} className={input} aria-label="Evening reminder time" />
          </Row>
          <Row label="Bedtime" hint="A wind-down nudge 30 minutes before. Skin repairs while you sleep.">
            <div className="flex items-center gap-2">
              <input type="time" value={store.wellness.sleep.time} disabled={!store.wellness.sleep.on} onChange={(e) => store.setWellness({ sleep: { ...store.wellness.sleep, time: e.target.value } })} className={input} aria-label="Bedtime" />
              <Switch on={store.wellness.sleep.on} onChange={() => store.setWellness({ sleep: { ...store.wellness.sleep, on: !store.wellness.sleep.on } })} label="Bedtime reminder" />
            </div>
          </Row>
          <Row label="Rest break" hint="A short pause in the afternoon. Stress shows up on skin too.">
            <div className="flex items-center gap-2">
              <input type="time" value={store.wellness.rest.time} disabled={!store.wellness.rest.on} onChange={(e) => store.setWellness({ rest: { ...store.wellness.rest, time: e.target.value } })} className={input} aria-label="Rest break time" />
              <Switch on={store.wellness.rest.on} onChange={() => store.setWellness({ rest: { ...store.wellness.rest, on: !store.wellness.rest.on } })} label="Rest break reminder" />
            </div>
          </Row>
          <Row label="Water" hint="A nudge to drink water between 9am and 9pm.">
            <div className="flex items-center gap-2">
              <select value={store.wellness.water.everyHours} disabled={!store.wellness.water.on} onChange={(e) => store.setWellness({ water: { ...store.wellness.water, everyHours: Number(e.target.value) } })} className={input} aria-label="Water reminder interval">
                {[1, 2, 3].map((h) => <option key={h} value={h}>Every {h} h</option>)}
              </select>
              <Switch on={store.wellness.water.on} onChange={() => store.setWellness({ water: { ...store.wellness.water, on: !store.wellness.water.on } })} label="Water reminder" />
            </div>
          </Row>
          <Row label="Weekly journal note" hint="How your skin felt, sleep, stress, anything new.">
            <div className="flex items-center gap-2">
              <select value={store.wellness.journal.day} disabled={!store.wellness.journal.on} onChange={(e) => store.setWellness({ journal: { ...store.wellness.journal, day: Number(e.target.value) } })} className={input} aria-label="Journal day">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
              <Switch on={store.wellness.journal.on} onChange={() => store.setWellness({ journal: { ...store.wellness.journal, on: !store.wellness.journal.on } })} label="Journal reminder" />
            </div>
          </Row>
        </Section>

        <Section icon={Shield} title={t("set.privacy")}>
          <Row label="Photos on this device" hint={selfies ? `${selfies} selfie${selfies === 1 ? "" : "s"} stored in this browser only` : "No selfies stored"}>
            <button onClick={store.clearPhotos} disabled={!selfies} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-plum disabled:opacity-40">
              <ImageOff className="size-4" /> Remove photos
            </button>
          </Row>
          <Row label="Download my data" hint="Scores, routine and saved items as a JSON file">
            <button onClick={exportData} disabled={!store.scans.length} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-plum disabled:opacity-40">
              <Download className="size-4" /> Download
            </button>
          </Row>
          <Row label="Reset this device" hint={auth.user ? "Clears local data. Your account keeps its copy." : "Deletes all scans, photos and your routine here"}>
            {confirmReset ? (
              <span className="flex gap-2">
                <button onClick={() => { store.reset(); setConfirmReset(false); }} className="rounded-full bg-bad px-4 py-2 text-sm text-white">Delete</button>
                <button onClick={() => setConfirmReset(false)} className="rounded-full border border-line px-4 py-2 text-sm">Cancel</button>
              </span>
            ) : (
              <button onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-bad">
                <RotateCcw className="size-4" /> Reset
              </button>
            )}
          </Row>
          {auth.user && (
            <Row label="Sign out" hint="Your results stay saved to your account">
              <button onClick={auth.signOut} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-bad">
                <LogOut className="size-4" /> Sign out
              </button>
            </Row>
          )}
        </Section>

        <p className="text-center text-[11px] text-muted">
          Skin analysis by YouCam AI · Demo product catalogue · Cosmetic guidance, not a medical diagnosis
        </p>
      </div>
    </Page>
  );
}
