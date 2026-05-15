#!/usr/bin/env node
// Interactive ASCII growth chart.
// Usage: node scripts/growth-chart-tui.mjs
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Keys: [s] signups   [p] paid   [d] day   [w] week   [m] month   [q] quit

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(here, "..", ".env.local"),
  resolve(here, "..", "..", "..", "..", ".env.local"),
  resolve(process.cwd(), ".env.local"),
];
const envPath = candidates.find(existsSync);
if (!envPath) { console.error("No .env.local found in:", candidates); process.exit(1); }
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("Missing supabase env"); process.exit(1); }

async function sb(path) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

function bucketKey(d, g) {
  if (g === "day") return d.toISOString().slice(0, 10);
  if (g === "week") {
    const m = new Date(d);
    const dow = (m.getUTCDay() + 6) % 7;
    m.setUTCDate(m.getUTCDate() - dow);
    return m.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 7);
}

function buildBuckets(g, lookback) {
  const now = new Date();
  const start = new Date(now);
  if (g === "day") start.setUTCDate(now.getUTCDate() - lookback + 1);
  else if (g === "week") start.setUTCDate(now.getUTCDate() - lookback * 7 + 1);
  else start.setUTCMonth(now.getUTCMonth() - lookback + 1);
  start.setUTCHours(0, 0, 0, 0);
  const buckets = [];
  const final = bucketKey(now, g);
  const cur = new Date(start);
  while (true) {
    const k = bucketKey(cur, g);
    if (!buckets.length || buckets[buckets.length - 1] !== k) buckets.push(k);
    if (k === final) break;
    if (g === "day") cur.setUTCDate(cur.getUTCDate() + 1);
    else if (g === "week") cur.setUTCDate(cur.getUTCDate() + 7);
    else cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return { start, buckets };
}

async function loadData(g, lookback) {
  const { start, buckets } = buildBuckets(g, lookback);
  const iso = start.toISOString();
  const [signups, paid] = await Promise.all([
    sb(`users?created_at=gte.${iso}&select=created_at&limit=20000`),
    sb(`users?subscription_tier=eq.pro&subscription_started_at=gte.${iso}&select=subscription_started_at&limit=20000`),
  ]);
  const signupCount = new Map(buckets.map(b => [b, 0]));
  const paidCount = new Map(buckets.map(b => [b, 0]));
  for (const r of signups) {
    const k = bucketKey(new Date(r.created_at), g);
    if (signupCount.has(k)) signupCount.set(k, signupCount.get(k) + 1);
  }
  for (const r of paid) {
    if (!r.subscription_started_at) continue;
    const k = bucketKey(new Date(r.subscription_started_at), g);
    if (paidCount.has(k)) paidCount.set(k, paidCount.get(k) + 1);
  }
  return {
    buckets,
    signups: buckets.map(b => signupCount.get(b)),
    paid: buckets.map(b => paidCount.get(b)),
  };
}

// Vertical bar chart: x = time, y = activity.
function renderVertical(labels, values, title, color) {
  const W = Math.max(60, Math.min(process.stdout.columns - 4 || 80, 160));
  const H = Math.max(10, Math.min(process.stdout.rows - 10 || 20, 28));
  const max = Math.max(1, ...values);
  // Each x-tick gets some columns. If too many labels, sample.
  const n = values.length;
  const colW = Math.max(2, Math.floor((W - 8) / n));
  const barW = Math.max(1, colW - 1);
  const yAxisW = 6;

  const grid = [];
  for (let r = 0; r < H; r++) grid.push(new Array(yAxisW + colW * n).fill(" "));

  // Y-axis: gridline on every row, labels only at 5 evenly-spaced ticks.
  const tickRows = new Set();
  for (let i = 0; i < 5; i++) tickRows.add(Math.round(i * (H - 1) / 4));
  for (let r = 0; r < H; r++) {
    let label;
    if (tickRows.has(r)) {
      const v = Math.round(max * (1 - r / (H - 1)));
      label = String(v).padStart(yAxisW - 2, " ") + " │";
    } else {
      label = " ".repeat(yAxisW - 2) + " │";
    }
    for (let i = 0; i < label.length; i++) grid[r][i] = label[i];
  }
  // Bars
  const reset = "\x1b[0m";
  for (let i = 0; i < n; i++) {
    const h = Math.round((values[i] / max) * (H - 1));
    for (let r = 0; r < h; r++) {
      const row = H - 1 - r;
      for (let c = 0; c < barW; c++) {
        grid[row][yAxisW + i * colW + c] = `${color}█${reset}`;
      }
    }
  }

  const lines = [title];
  for (const row of grid) lines.push(row.join(""));
  // X-axis baseline
  lines.push(" ".repeat(yAxisW - 1) + "└" + "─".repeat(colW * n));
  // X labels: show first, mid, last
  const xrow = new Array(yAxisW + colW * n).fill(" ");
  const place = (idx, txt, align = "left") => {
    let start = yAxisW + idx * colW;
    if (align === "right") start = start + colW - 1 - (txt.length - 1);
    if (align === "center") start = start + Math.floor(colW / 2) - Math.floor(txt.length / 2);
    start = Math.max(0, Math.min(start, xrow.length - txt.length));
    for (let k = 0; k < txt.length && start + k < xrow.length; k++) xrow[start + k] = txt[k];
  };
  const fmt = (s) => s.length >= 7 ? s.slice(5) : s;
  place(0, fmt(labels[0]), "left");
  if (n > 2) place(Math.floor(n / 2), fmt(labels[Math.floor(n / 2)]), "center");
  if (n > 1) place(n - 1, fmt(labels[n - 1]), "right");
  lines.push(xrow.join(""));
  return lines.join("\n");
}

let series = "signups"; // or "paid"
let gran = "day";       // or "week" / "month"
let oneShot = false;
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--series=")) series = a.slice(9);
  else if (a.startsWith("--gran=")) gran = a.slice(7);
  else if (a === "--once") oneShot = true;
}
let cache = {};         // keyed by gran

function lookbackFor(g) { return g === "day" ? 30 : 12; }

async function ensure(g) {
  if (!cache[g]) cache[g] = await loadData(g, lookbackFor(g));
  return cache[g];
}

function clear() { process.stdout.write("\x1b[2J\x1b[H"); }

async function render() {
  const data = await ensure(gran);
  const values = series === "signups" ? data.signups : data.paid;
  const color = series === "signups" ? "\x1b[34m" : "\x1b[32m";
  const total = values.reduce((a, b) => a + b, 0);
  const totalSignups = data.signups.reduce((a, b) => a + b, 0);
  const totalPaid = data.paid.reduce((a, b) => a + b, 0);
  const conv = totalSignups ? ((totalPaid / totalSignups) * 100).toFixed(1) : "0.0";
  const seriesLabel = series === "signups" ? "SIGNUPS" : "PAID (subscription_tier=pro)";
  const title = `${seriesLabel} — ${gran} (last ${data.buckets.length}) — total ${total} | ${totalSignups} signups, ${totalPaid} paid, ${conv}% conv`;
  clear();
  console.log(renderVertical(data.buckets, values, title, color));
  console.log("");
  console.log(`↑/↓ toggle series  |  ←/→ cycle day/week/month  |  [q] quit   `
    + `(now: series=${series}, unit=${gran})`);
}

await render();

if (oneShot) process.exit(0);

const GRAN_CYCLE = ["day", "week", "month"];
function cycleGran(dir) {
  const i = GRAN_CYCLE.indexOf(gran);
  gran = GRAN_CYCLE[(i + dir + GRAN_CYCLE.length) % GRAN_CYCLE.length];
}
function toggleSeries() { series = series === "signups" ? "paid" : "signups"; }

if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", async (chunk) => {
  let changed = false;
  let quit = false;
  let i = 0;
  while (i < chunk.length) {
    const key = chunk[i];
    // Arrow escape sequences: ESC [ A/B/C/D
    if (key === "\x1b" && chunk[i + 1] === "[" && i + 2 < chunk.length) {
      const arrow = chunk[i + 2];
      if (arrow === "A") { toggleSeries(); changed = true; }       // up
      else if (arrow === "B") { toggleSeries(); changed = true; }  // down
      else if (arrow === "C") { cycleGran(1); changed = true; }    // right
      else if (arrow === "D") { cycleGran(-1); changed = true; }   // left
      i += 3; continue;
    }
    if (key === "q" || key === "\x03") { quit = true; break; }
    if (key === "s") { series = "signups"; changed = true; }
    else if (key === "p") { series = "paid"; changed = true; }
    else if (key === "d") { gran = "day"; changed = true; }
    else if (key === "w") { gran = "week"; changed = true; }
    else if (key === "m") { gran = "month"; changed = true; }
    i++;
  }
  if (changed) await render();
  if (quit) { clear(); process.exit(0); }
});