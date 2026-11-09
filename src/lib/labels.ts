import type { ApplicationStatus, EligibilityLabel, HousingType, QueueState } from "./types";

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  menunggu_verifikasi: "Menunggu verifikasi",
  dijadwalkan: "Dijadwalkan",
  perlu_revisi: "Perlu revisi",
  disetujui: "Disetujui",
  ditolak: "Ditolak / diarahkan ke asrama",
};

export const STATUS_TONE: Record<ApplicationStatus, "neutral" | "info" | "primary" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  menunggu_verifikasi: "info",
  dijadwalkan: "primary",
  perlu_revisi: "warning",
  disetujui: "success",
  ditolak: "danger",
};

export const HOUSING_LABEL: Record<HousingType, string> = {
  keluarga: "Tinggal dengan keluarga",
  wali: "Tinggal dengan wali",
  kost_putra: "Kost putra",
  kost_putri: "Kost putri",
};

export const ELIGIBILITY_LABEL: Record<EligibilityLabel, string> = {
  layak: "Layak",
  perlu_review: "Perlu review",
  berpotensi_asrama: "Berpotensi ke asrama",
};

export const QUEUE_LABEL: Record<QueueState, string> = {
  menunggu: "Menunggu",
  dilayani: "Sedang dilayani",
  selesai: "Selesai",
  tidak_hadir: "Tidak hadir",
  ditunda: "Ditunda",
};

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
