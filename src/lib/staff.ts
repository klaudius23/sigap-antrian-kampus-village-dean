import type { Decision, EligibilityLabel, QueueItem, QueueState, ReportSummary } from "./types";

/* ---------- Keputusan vs rekomendasi ML ---------- */

/** Keputusan yang sejalan dengan label rekomendasi sistem. */
export const ML_DECISION: Record<EligibilityLabel, Decision> = {
  layak: "setujui",
  perlu_review: "revisi",
  berpotensi_asrama: "tolak",
};

export const DECISION_LABEL: Record<Decision, string> = {
  setujui: "Setujui",
  revisi: "Minta revisi",
  tolak: "Tolak (arahkan ke asrama)",
};

/** True bila keputusan staf berbeda dari rekomendasi sistem. */
export function isOverride(label: EligibilityLabel | undefined, decision: Decision | undefined): boolean {
  if (!label || !decision) return false;
  return ML_DECISION[label] !== decision;
}

export const MIN_REASON_LENGTH = 10;
export const isReasonValid = (reason: string) => reason.trim().length >= MIN_REASON_LENGTH;

/* ---------- Papan antrean ---------- */

export type BoardColumn = "menunggu" | "dilayani" | "selesai";

export function columnOf(state: QueueState): BoardColumn {
  if (state === "dilayani") return "dilayani";
  if (state === "selesai" || state === "tidak_hadir") return "selesai";
  return "menunggu";
}

/** Urutan tunggu: yang menunggu (slot paling awal dulu), lalu yang ditunda. */
export function sortWaiting(items: QueueItem[]): QueueItem[] {
  return [...items].sort(
    (a, b) => Number(a.state === "ditunda") - Number(b.state === "ditunda") || a.slot_start.localeCompare(b.slot_start),
  );
}

/** Estimasi menit sampai giliran tiap item menunggu, dihitung per loket. */
export function waitingEta(items: QueueItem[], avgServiceMinutes: number): Record<string, number> {
  const out: Record<string, number> = {};
  const counters = new Set(items.map((i) => i.counter));
  for (const c of counters) {
    const atCounter = items.filter((i) => i.counter === c);
    const busy = atCounter.some((i) => i.state === "dilayani") ? 1 : 0;
    sortWaiting(atCounter.filter((i) => columnOf(i.state) === "menunggu")).forEach((q, idx) => {
      out[q.id] = (idx + busy) * avgServiceMinutes;
    });
  }
  return out;
}

export interface CounterStat { counter: number; waiting: number; serving?: QueueItem; remainingMinutes: number }

export function counterStats(items: QueueItem[], counters: number, avgServiceMinutes: number): CounterStat[] {
  return Array.from({ length: counters }, (_, i) => {
    const counter = i + 1;
    const atCounter = items.filter((q) => q.counter === counter);
    const waiting = atCounter.filter((q) => columnOf(q.state) === "menunggu").length;
    return {
      counter,
      waiting,
      serving: atCounter.find((q) => q.state === "dilayani"),
      remainingMinutes: waiting * avgServiceMinutes,
    };
  });
}

export function boardSummary(items: QueueItem[], counters: number, avgServiceMinutes: number) {
  const stats = counterStats(items, counters, avgServiceMinutes);
  return {
    waiting: items.filter((q) => columnOf(q.state) === "menunggu").length,
    serving: items.filter((q) => q.state === "dilayani").length,
    done: items.filter((q) => q.state === "selesai").length,
    noShow: items.filter((q) => q.state === "tidak_hadir").length,
    /** Waktu sampai seluruh antrean selesai = loket dengan antrean terpanjang. */
    remainingMinutes: Math.max(0, ...stats.map((s) => s.remainingMinutes)),
  };
}

/* ---------- CSV ---------- */

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell);
          return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
}

export function reportToRows(r: ReportSummary): (string | number)[][] {
  return [
    ["Bagian", "Label", "Nilai"],
    ...r.avg_wait_minutes.map((x) => ["Rata-rata waktu tunggu (menit)", x.day, x.minutes]),
    ...r.utilization.map((x) => ["Utilisasi loket (%)", x.counter, x.percent]),
    ["Tingkat tidak hadir (%)", "Semua", r.no_show_rate],
    ...r.rejection_reasons.map((x) => ["Alasan penolakan (jumlah)", x.reason, x.count]),
    ...r.applications_per_day.map((x) => ["Pengajuan per hari", x.day, x.count]),
  ];
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
