import { describe, expect, it } from "vitest";
import { boardSummary, columnOf, isOverride, isReasonValid, toCsv, waitingEta } from "@/lib/staff";
import type { QueueItem } from "@/lib/types";

const q = (id: string, counter: number, state: QueueItem["state"], slot = "2026-11-13T08:00:00"): QueueItem => ({
  id, queue_no: id, application_id: `app-${id}`, student_name: id, nim: "S1", counter, state,
  checked_in: true, walk_in: false, slot_start: slot, eta_minutes: 0,
});

describe("override rekomendasi ML", () => {
  it("bukan override bila keputusan sama dengan rekomendasi", () => {
    expect(isOverride("layak", "setujui")).toBe(false);
    expect(isOverride("berpotensi_asrama", "tolak")).toBe(false);
  });
  it("override bila keputusan berbeda", () => {
    expect(isOverride("layak", "tolak")).toBe(true);
    expect(isOverride("berpotensi_asrama", "setujui")).toBe(true);
  });
  it("alasan wajib minimal 10 karakter", () => {
    expect(isReasonValid("   singkat ")).toBe(false);
    expect(isReasonValid("Dokumen sudah valid")).toBe(true);
  });
});

describe("papan antrean", () => {
  it("ditunda masuk kolom Menunggu, tidak hadir masuk kolom Selesai", () => {
    expect(columnOf("ditunda")).toBe("menunggu");
    expect(columnOf("tidak_hadir")).toBe("selesai");
  });
  it("estimasi sisa waktu = loket dengan antrean terpanjang × rata-rata layanan", () => {
    const items = [q("a", 1, "menunggu"), q("b", 1, "menunggu"), q("c", 1, "menunggu"), q("d", 2, "menunggu"), q("e", 3, "selesai"), q("f", 3, "tidak_hadir")];
    const s = boardSummary(items, 3, 7);
    expect(s.waiting).toBe(4);
    expect(s.noShow).toBe(1);
    expect(s.remainingMinutes).toBe(21);
  });
  it("estimasi giliran memperhitungkan yang sedang dilayani di loket yang sama", () => {
    const eta = waitingEta([q("s", 1, "dilayani"), q("a", 1, "menunggu", "2026-11-13T08:00:00"), q("b", 1, "menunggu", "2026-11-13T08:30:00")], 7);
    expect(eta).toEqual({ a: 7, b: 14 });
  });
});

describe("ekspor CSV", () => {
  it("mengapit sel yang berisi koma atau tanda kutip", () => {
    expect(toCsv([["Bagian", "Nilai"], ['Alasan "x", y', 3]])).toBe('Bagian,Nilai\r\n"Alasan ""x"", y",3');
  });
});
