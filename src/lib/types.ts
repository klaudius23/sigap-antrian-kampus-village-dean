export type Role = "mahasiswa" | "staf" | "admin";

export interface User {
  id: string;
  name: string;
  role: Role;
  nim?: string;
  email?: string;
  active?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type ApplicationStatus =
  | "draft"
  | "menunggu_verifikasi"
  | "dijadwalkan"
  | "perlu_revisi"
  | "disetujui"
  | "ditolak";

export type ApplicationKind = "baru" | "perpanjangan";
export type HousingType = "keluarga" | "wali" | "kost_putra" | "kost_putri";
export type DistanceCategory = "dekat" | "jauh";

export interface UploadedDocument {
  id: string;
  kind: "domisili" | "pendukung";
  name: string;
  mime: string;
  size: number;
  url?: string;
}

export interface Application {
  id: string;
  student_id: string;
  student_name: string;
  nim: string;
  kind: ApplicationKind;
  housing_type: HousingType;
  address: string;
  kelurahan: string;
  guardian_name: string;
  guardian_phone: string;
  distance_km: number;
  category: DistanceCategory;
  documents: UploadedDocument[];
  status: ApplicationStatus;
  staff_notes?: string;
  decision_reason?: string;
  appointment?: Appointment;
  created_at: string;
  updated_at: string;
}

export type ApplicationInput = Pick<
  Application,
  "kind" | "housing_type" | "address" | "kelurahan" | "guardian_name" | "guardian_phone"
>;

export type EligibilityLabel = "layak" | "perlu_review" | "berpotensi_asrama";

export interface Prescreen {
  documents: { status: "lengkap" | "perlu_perbaikan"; reasons: string[] };
  eligibility: { label: EligibilityLabel; confidence: number; reasons: string[] };
  anomalies: string[];
}

export interface Slot {
  id: string;
  start: string;
  end: string;
  remaining: number;
}

export interface Appointment {
  ticket_id: string;
  queue_no: string;
  qr_payload: string;
  eta_minutes: number;
  counter: number;
  slot_id: string;
  slot_start: string;
}

export type QueueState = "menunggu" | "dilayani" | "selesai" | "tidak_hadir" | "ditunda";

export interface QueueItem {
  id: string;
  queue_no: string;
  application_id: string;
  student_name: string;
  nim: string;
  counter: number;
  state: QueueState;
  checked_in: boolean;
  walk_in: boolean;
  slot_start: string;
  eta_minutes: number;
}

export interface QueueSnapshot {
  items: QueueItem[];
  counters: number;
  avg_service_minutes: number;
}

export interface NextRecommendation {
  queue_id: string;
  queue_no: string;
  student_name: string;
  counter: number;
  reason: string;
}

export type Decision = "setujui" | "revisi" | "tolak";

export interface Settings {
  service_start: string;
  service_end: string;
  counters: number;
  slot_minutes: number;
  walkin_quota: number;
  near_threshold_km: number;
  period_start: string;
  period_end: string;
  reschedule_deadline_hours: number;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  object: string;
  at: string;
}

export interface MlModel {
  name: string;
  version: string;
  metric: string;
  data_source: "nyata" | "sintetis";
}

export interface ReportSummary {
  avg_wait_minutes: { day: string; minutes: number }[];
  utilization: { counter: string; percent: number }[];
  no_show_rate: number;
  rejection_reasons: { reason: string; count: number }[];
  applications_per_day: { day: string; count: number }[];
}
