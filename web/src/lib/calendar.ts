// A weekly check-in event the user can add to any calendar app (.ics file).
// Reminders then work even when SkinTwin isn't open.

const pad = (n: number) => String(n).padStart(2, "0");
// Floating local time (no Z), so the event stays at the same clock time.
const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function checkinIcs(start: Date, url: string) {
  const end = new Date(start.getTime() + 15 * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SkinTwin//Check-in//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:skintwin-checkin-${start.getTime()}@skintwin`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    "RRULE:FREQ=WEEKLY",
    "SUMMARY:SkinTwin weekly check-in",
    `DESCRIPTION:A 1-minute scan to see what changed this week. Same light\\, same spot\\, no makeup. ${url}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Time for your SkinTwin check-in",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// Next check-in: 7 days after the last scan (or now if overdue), at the given HH:MM.
export function nextCheckin(lastScanAt: string | undefined, time = "09:00", now = new Date()) {
  const base = lastScanAt ? new Date(new Date(lastScanAt).getTime() + 7 * 86_400_000) : now;
  const d = base < now ? new Date(now) : base;
  const [h, m] = time.split(":").map(Number);
  d.setHours(h || 9, m || 0, 0, 0);
  if (d < now) d.setDate(d.getDate() + 1);
  return d;
}

export function downloadCheckinIcs(lastScanAt: string | undefined, time?: string) {
  const url = `${window.location.origin}/scan`;
  const blob = new Blob([checkinIcs(nextCheckin(lastScanAt, time), url)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "skintwin-checkin.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
