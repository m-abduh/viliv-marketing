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
      runPipeline().catch((err) => console.error("[scheduler] Error:", err.message));
    }, { timezone: tz });
  }
  console.log(`[scheduler] Started ${schedules.length} daily job(s) (timezone: ${tz})`);
  console.log(`[scheduler] Times: ${schedules.join(" ")}`);
}