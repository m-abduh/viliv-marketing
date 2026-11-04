import cron from "node-cron";
import { runPipeline } from "./pipeline.js";
import { store } from "./db.mjs";

function buildSchedule(postsPerDay, startMin, endMin) {
  if (postsPerDay <= 0) return [];
  if (postsPerDay === 1) {
    const m = startMin;
    return [`${m % 60} ${Math.floor(m / 60)} * * *`];
  }
  const span = Math.max(0, endMin - startMin);
  const step = span / (postsPerDay - 1 || 1);
  const times = [];
  for (let i = 0; i < postsPerDay; i++) {
    const m = startMin + Math.round(step * i);
    times.push(`${m % 60} ${Math.floor(m / 60)} * * *`);
  }
  return times;
}

// Wall-clock minutes since midnight, in the scheduler's timezone, for `date`.
// Derived from Intl so it honours DST the same way node-cron does.
function localMinutes(date, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const hour = get("hour") % 24; // some locales report midnight as 24
  return hour * 60 + get("minute") + get("second") / 60;
}

// node-cron timers are in-process only: if the process restarts (pm2 restart,
// deploy, OOM) the pending trigger is gone and that slot never runs again. On
// boot we check whether today's last slot time has already passed without a run
// having happened, and fire it once.
async function catchUpMissedSlot() {
  const { tz, schedules } = await getSettings();
  if (!schedules.length) return;

  const nowMin = localMinutes(new Date(), tz);
  const due = schedules
    .map((expr) => {
      const [m, h] = expr.split(" ").map(Number); // "M H * * *"
      return { expr, min: h * 60 + m };
    })
    .filter((s) => s.min <= nowMin)
    .sort((a, b) => b.min - a.min)[0];
  if (!due) return;

  // Grace window: only recover a slot missed by a few hours. Beyond that the
  // content would be stale and posting it late is worse than skipping it.
  const ageMin = nowMin - due.min;
  const CATCH_UP_MAX_MIN = Number(process.env.CATCH_UP_MAX_MIN || 180);
  if (ageMin > CATCH_UP_MAX_MIN) return;

  // Did a run already cover this slot? Any post created at/after the slot time
  // counts, so a manual run in between suppresses the catch-up.
  const accounts = await store.listAccounts();
  if (!accounts.length) return;
  const posts = await store.listPosts();
  const slotBoundary = Date.now() - ageMin * 60_000;
  const alreadyRan = posts.some((p) => p.created_at && p.created_at.getTime() >= slotBoundary);
  if (alreadyRan) return;

  console.log(
    `[scheduler] Slot "${due.expr}" was missed (${Math.round(ageMin)}min ago) — catching up`
  );
  try {
    const res = await runPipeline({ useAI: true });
    const err = res?.result?.error || (res?.error ? String(res.error) : "");
    console.log(
      err
        ? `[scheduler] Catch-up finished with error: ${err}`
        : "[scheduler] Catch-up finished"
    );
  } catch (err) {
    console.error("[scheduler] Catch-up failed:", err.message);
  }
}

export async function getSettings() {
  const [ppd, tz, startRaw, endRaw] = await Promise.all([
    store.getSetting("posts_per_day", "3"),
    store.getSetting("tz", process.env.TZ || "America/New_York"),
    store.getSetting("window_start", "06:00"),
    store.getSetting("window_end", "22:00"),
  ]);
  const postsPerDay = Number(ppd) || 3;
  const [sh, sm] = startRaw.split(":").map(Number);
  const [eh, em] = endRaw.split(":").map(Number);
  return {
    postsPerDay,
    tz,
    windowStart: startRaw,
    windowEnd: endRaw,
    startMin: sh * 60 + (sm || 0),
    endMin: eh * 60 + (em || 0),
    schedules: buildSchedule(postsPerDay, sh * 60 + (sm || 0), eh * 60 + (em || 0)),
  };
}

export async function startScheduler() {
  const { tz, schedules } = await getSettings();
  if (!schedules.length) {
    console.log("[scheduler] No schedules (posts_per_day=0)");
    return;
  }
  for (const expr of schedules) {
    cron.schedule(expr, () => {
      console.log(`[scheduler] Trigger ${expr} at ${new Date().toISOString()}`);
      runPipeline({ useAI: true }).catch((err) => console.error("[scheduler] Error:", err.message));
    }, { timezone: tz });
  }
  console.log(`[scheduler] Started ${schedules.length} daily job(s) (timezone: ${tz})`);
  console.log(`[scheduler] Times: ${schedules.join(" ")}`);

  // Fire once for a slot that was missed while this process was down.
  catchUpMissedSlot().catch((err) =>
    console.error("[scheduler] catch-up check failed:", err.message)
  );
}