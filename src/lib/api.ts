import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  Appointment,
  AuditLog,
  Decision,
  LoginResponse,
  MlModel,
  NextRecommendation,
  Prescreen,
  QueueItem,
  QueueSnapshot,
  ReportSummary,
  Role,
  Settings,
  Slot,
  UploadedDocument,
  User,
} from "./types";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

/* ---------------- Real HTTP ---------------- */

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sigap_token");
}

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (!(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) throw new Error((await res.text()) || `Permintaan gagal (${res.status})`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ---------------- Mock DB (fake data only) ---------------- */

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms + Math.random() * 250));
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => new Date().toISOString().slice(0, 10);

const FIRST = ["Andre", "Bella", "Christo", "Debora", "Elia", "Febri", "Gita", "Hans", "Ivana", "Jonathan", "Kezia", "Lukas", "Maria", "Nathan", "Olivia", "Petrus", "Queen", "Rio", "Sarah", "Timotius", "Ursula", "Vino", "Wulan", "Xaverius", "Yohana", "Zefanya", "Abel", "Brigita", "Calvin", "Dinda"];
const LAST = ["Mamahit", "Runtu", "Pangemanan", "Sondakh", "Lumingkewas", "Wenas", "Tumbelaka", "Rumengan", "Kaunang", "Lengkong"];
const KEL = ["Airmadidi Atas", "Airmadidi Bawah", "Sarongsong", "Sukur", "Rap-Rap", "Sawangan", "Tanggari"];
const HOUSING = ["keluarga", "wali", "kost_putra", "kost_putri"] as const;
const STATUSES: Application["status"][] = ["menunggu_verifikasi", "dijadwalkan", "dijadwalkan", "perlu_revisi", "disetujui", "ditolak", "dijadwalkan"];

interface DB {
  users: User[];
  applications: Application[];
  queue: QueueItem[];
  settings: Settings;
  audit: AuditLog[];
  bookings: Record<string, number>;
  walkins: number;
}

function seed(): DB {
  const users: User[] = [
    { id: "u-mhs", name: "Mahasiswa Demo", role: "mahasiswa", nim: "S22410001", email: "demo@student.unklab.test", active: true },
    { id: "u-staf", name: "Staf Village Dean", role: "staf", email: "staf@unklab.test", active: true },
    { id: "u-admin", name: "Admin Sistem", role: "admin", email: "admin@unklab.test", active: true },
  ];
  const applications: Application[] = [];
  const queue: QueueItem[] = [];
  for (let i = 0; i < 30; i++) {
    const name = `${FIRST[i]} ${LAST[i % LAST.length]}`;
    const nim = `S2241${pad(10 + i)}${i % 10}`;
    const id = `u-${i}`;
    users.push({ id, name, role: "mahasiswa", nim, email: `${FIRST[i].toLowerCase()}@student.unklab.test`, active: i !== 7 });
    const dist = Math.round((0.6 + ((i * 7) % 23) / 2.3) * 10) / 10;
    const status = STATUSES[i % STATUSES.length];
    const appId = `app-${i}`;
    const created = new Date(Date.now() - (i % 7) * 86400000).toISOString();
    applications.push({
      id: appId, student_id: id, student_name: name, nim,
      kind: i % 3 === 0 ? "perpanjangan" : "baru",
      housing_type: HOUSING[i % 4],
      address: `Jl. Contoh No. ${10 + i}, Lingkungan ${1 + (i % 4)}`,
      kelurahan: KEL[i % KEL.length],
      guardian_name: `Bpk/Ibu ${LAST[(i + 3) % LAST.length]}`,
      guardian_phone: `0812000${pad(i)}${pad(i + 11)}`,
      distance_km: dist, category: dist <= 3 ? "dekat" : "jauh",
      documents: [{ id: uid(), kind: "domisili", name: "surat-domisili.pdf", mime: "application/pdf", size: 240000 }],
      status, staff_notes: status === "perlu_revisi" ? "Surat domisili buram, mohon unggah ulang." : undefined,
      created_at: created, updated_at: created,
    });
    if (i < 18) {
      const counter = (i % 3) + 1;
      const h = 8 + Math.floor(i / 4);
      queue.push({
        id: `q-${i}`, queue_no: `A${pad(i + 1)}`, application_id: appId, student_name: name, nim, counter,
        state: i < 4 ? "selesai" : i < 7 ? (i === 5 ? "tidak_hadir" : i === 4 ? "dilayani" : "dilayani") : "menunggu",
        checked_in: i < 12, walk_in: i % 6 === 5,
        slot_start: `${todayStr()}T${pad(h)}:${i % 2 ? "30" : "00"}:00`, eta_minutes: Math.max(0, (i - 6) * 6),
      });
    }
  }
  const audit: AuditLog[] = Array.from({ length: 24 }, (_, i) => ({
    id: uid(),
    actor: ["Staf Village Dean", "Admin Sistem", "Sistem"][i % 3],
    action: ["Memanggil antrean", "Mengubah pengaturan", "Menerima rekomendasi", "Menyetujui pengajuan", "Mengabaikan rekomendasi", "Check-in"][i % 6],
    object: i % 2 ? `Antrean A${pad(i + 1)}` : `Pengajuan app-${i}`,
    at: new Date(Date.now() - i * 3600_000 * 3).toISOString(),
  }));
  return {
    users, applications, queue, audit, bookings: {}, walkins: 1,
    settings: {
      service_start: "08:00", service_end: "15:00", counters: 3, slot_minutes: 15, walkin_quota: 10,
      near_threshold_km: 3, period_start: todayStr(), period_end: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
      reschedule_deadline_hours: 12,
    },
  };
}

const KEY = "sigap_mock_db_v1";
let db: DB | null = null;
function getDB(): DB {
  if (db) return db;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(KEY);
    if (raw) { try { db = JSON.parse(raw); return db!; } catch { /* reseed */ } }
  }
  db = seed();
  save();
  return db;
}
function save() {
  if (typeof window !== "undefined" && db) localStorage.setItem(KEY, JSON.stringify(db));
}
export function resetMock() {
  db = seed();
  save();
}
function log(action: string, object: string) {
  const d = getDB();
  const u = currentUser();
  d.audit.unshift({ id: uid(), actor: u?.name ?? "Sistem", action, object, at: new Date().toISOString() });
}
function currentUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("sigap_user");
  return raw ? (JSON.parse(raw) as User) : null;
}
function findApp(id: string) {
  const a = getDB().applications.find((x) => x.id === id);
  if (!a) throw new Error("Pengajuan tidak ditemukan");
  return a;
}

function computePrescreen(a: Application): Prescreen {
  const d = getDB();
  const docReasons: string[] = [];
  if (a.kind === "baru" && !a.documents.some((x) => x.kind === "domisili")) docReasons.push("Surat domisili kelurahan belum diunggah (wajib untuk pendaftar baru).");
  if (!/^08\d{8,11}$/.test(a.guardian_phone)) docReasons.push("Format nomor HP wali tidak valid.");
  if (a.address.length < 15) docReasons.push("Alamat kurang lengkap.");
  const same = d.applications.filter((x) => x.id !== a.id && x.address === a.address).length;
  const anomalies: string[] = [];
  if (same > 0) anomalies.push(`Alamat sama dengan ${same} mahasiswa lain`);
  if (a.distance_km > 12) anomalies.push("Jarak ke kampus sangat jauh (> 12 km)");
  const reasons: string[] = [];
  let score = 0.85;
  if (a.housing_type === "keluarga" || a.housing_type === "wali") reasons.push("Tinggal bersama keluarga/wali sesuai aturan kampus.");
  else reasons.push("Kost satu jenis kelamin sesuai aturan kampus."), (score -= 0.1);
  if (a.category === "jauh") reasons.push(`Kategori Outsider Jauh (${a.distance_km} km).`), (score -= 0.15);
  else reasons.push(`Kategori Outsider Dekat (${a.distance_km} km).`);
  if (docReasons.length) reasons.push("Dokumen belum lengkap."), (score -= 0.25);
  if (anomalies.length) score -= 0.2;
  const label = score >= 0.7 ? "layak" : score >= 0.45 ? "perlu_review" : "berpotensi_asrama";
  return {
    documents: { status: docReasons.length ? "perlu_perbaikan" : "lengkap", reasons: docReasons },
    eligibility: { label, confidence: Math.round(Math.min(0.97, Math.max(0.35, label === "layak" ? score : 1 - score + 0.3)) * 100) / 100, reasons },
    anomalies,
  };
}

const mock = {
  async login(identifier: string, _password: string, role?: Role): Promise<LoginResponse> {
    await delay();
    const d = getDB();
    const user = role
      ? d.users.find((u) => u.id === `u-${role === "mahasiswa" ? "mhs" : role}`)
      : d.users.find((u) => u.nim === identifier || u.email === identifier);
    if (!user) throw new Error("NIM/email atau kata sandi salah");
    return { token: `mock-${uid()}`, user };
  },
  async createApplication(input: ApplicationInput): Promise<Application> {
    await delay();
    const d = getDB();
    const u = currentUser()!;
    const seedN = input.address.length + input.kelurahan.length;
    const dist = Math.round((1 + (seedN % 90) / 10) * 10) / 10;
    const now = new Date().toISOString();
    const a: Application = {
      ...input, id: `app-${uid()}`, student_id: u.id, student_name: u.name, nim: u.nim ?? "-",
      distance_km: dist, category: dist <= d.settings.near_threshold_km ? "dekat" : "jauh",
      documents: [], status: "draft", created_at: now, updated_at: now,
    };
    d.applications.unshift(a);
    save();
    return a;
  },
  async updateApplication(id: string, input: ApplicationInput): Promise<Application> {
    await delay(200);
    const a = findApp(id);
    Object.assign(a, input, { updated_at: new Date().toISOString() });
    save();
    return a;
  },
  async estimateDistance(address: string, kelurahan: string) {
    await delay(300);
    const n = address.length + kelurahan.length;
    const km = Math.round((1 + (n % 90) / 10) * 10) / 10;
    return { distance_km: km, category: (km <= getDB().settings.near_threshold_km ? "dekat" : "jauh") as "dekat" | "jauh" };
  },
  async myApplications(): Promise<Application[]> {
    await delay();
    const u = currentUser();
    return getDB().applications.filter((a) => a.student_id === u?.id);
  },
  async listApplications(status?: ApplicationStatus): Promise<Application[]> {
    await delay();
    return structuredClone(
      getDB().applications
        .filter((a) => a.status !== "draft" && (!status || a.status === status))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    );
  },
  async getApplication(id: string): Promise<Application> {
    await delay();
    return structuredClone(findApp(id));
  },
  async submitApplication(id: string): Promise<Application> {
    await delay();
    const a = findApp(id);
    a.status = "menunggu_verifikasi";
    a.staff_notes = undefined;
    a.updated_at = new Date().toISOString();
    log("Mengirim pengajuan", `Pengajuan ${id}`);
    save();
    return a;
  },
  async uploadDocument(id: string, file: File, kind: UploadedDocument["kind"]): Promise<UploadedDocument> {
    await delay(500);
    const a = findApp(id);
    const doc: UploadedDocument = { id: uid(), kind, name: file.name, mime: file.type, size: file.size };
    a.documents = a.documents.filter((x) => !(x.kind === "domisili" && kind === "domisili"));
    a.documents.push(doc);
    save();
    return doc;
  },
  async prescreen(id: string): Promise<Prescreen> {
    await delay(700);
    return computePrescreen(findApp(id));
  },
  async slots(date: string): Promise<Slot[]> {
    await delay();
    const d = getDB();
    const s = d.settings;
    const [sh, sm] = s.service_start.split(":").map(Number);
    const [eh, em] = s.service_end.split(":").map(Number);
    const out: Slot[] = [];
    const day = new Date(date).getDay();
    if (day === 0 || day === 6) return [];
    for (let m = sh * 60 + sm; m + s.slot_minutes <= eh * 60 + em; m += s.slot_minutes) {
      if (m >= 12 * 60 && m < 13 * 60) continue;
      const id = `${date}-${m}`;
      const base = (m * 7 + date.charCodeAt(9)) % (s.counters + 1);
      out.push({
        id,
        start: `${date}T${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`,
        end: `${date}T${pad(Math.floor((m + s.slot_minutes) / 60))}:${pad((m + s.slot_minutes) % 60)}:00`,
        remaining: Math.max(0, s.counters - base - (d.bookings[id] ?? 0)),
      });
    }
    return out;
  },
  async book(application_id: string, slot_id: string): Promise<Appointment> {
    await delay();
    const d = getDB();
    const a = findApp(application_id);
    const slot = (await mock.slots(slot_id.slice(0, 10))).find((s) => s.id === slot_id);
    if (!slot || slot.remaining <= 0) throw new Error("Slot sudah penuh, pilih slot lain");
    d.bookings[slot_id] = (d.bookings[slot_id] ?? 0) + 1;
    const n = d.queue.length + 1;
    const appt: Appointment = {
      ticket_id: `T-${uid().toUpperCase()}`, queue_no: `A${pad(n)}`, qr_payload: `SIGAP:${a.nim}:${slot_id}`,
      eta_minutes: 5 + (n % 4) * 5, counter: (n % d.settings.counters) + 1, slot_id, slot_start: slot.start,
    };
    a.appointment = appt;
    a.status = "dijadwalkan";
    d.queue.push({
      id: `q-${uid()}`, queue_no: appt.queue_no, application_id, student_name: a.student_name, nim: a.nim,
      counter: appt.counter, state: "menunggu", checked_in: false, walk_in: false, slot_start: slot.start, eta_minutes: appt.eta_minutes,
    });
    log("Memesan slot", `Pengajuan ${application_id}`);
    save();
    return appt;
  },
  async reschedule(application_id: string, slot_id: string): Promise<Appointment> {
    await mock.cancel(application_id);
    return mock.book(application_id, slot_id);
  },
  async cancel(application_id: string): Promise<void> {
    await delay(200);
    const d = getDB();
    const a = findApp(application_id);
    if (a.appointment) {
      d.bookings[a.appointment.slot_id] = Math.max(0, (d.bookings[a.appointment.slot_id] ?? 1) - 1);
      d.queue = d.queue.filter((q) => q.queue_no !== a.appointment!.queue_no);
    }
    a.appointment = undefined;
    a.status = "menunggu_verifikasi";
    save();
  },
  async queue(): Promise<QueueSnapshot> {
    await delay(150);
    const d = getDB();
    return { items: structuredClone(d.queue), counters: d.settings.counters, avg_service_minutes: 7 };
  },
  async queueAction(id: string, action: "call" | "skip" | "defer" | "finish"): Promise<QueueItem> {
    await delay(200);
    const d = getDB();
    const q = d.queue.find((x) => x.id === id);
    if (!q) throw new Error("Antrean tidak ditemukan");
    if (action === "call") {
      d.queue.forEach((x) => { if (x.counter === q.counter && x.state === "dilayani") x.state = "selesai"; });
      q.state = "dilayani";
    } else if (action === "skip") q.state = "tidak_hadir";
    else if (action === "defer") q.state = "ditunda";
    else q.state = "selesai";
    log({ call: "Memanggil antrean", skip: "Melewati antrean", defer: "Menunda antrean", finish: "Menyelesaikan layanan" }[action], `Antrean ${q.queue_no}`);
    save();
    return q;
  },
  async checkin(code: string): Promise<QueueItem> {
    await delay(200);
    const d = getDB();
    const c = code.trim().toUpperCase();
    const q = d.queue.find((x) => x.nim.toUpperCase() === c || c.includes(x.nim.toUpperCase()) || x.queue_no === c);
    if (!q) throw new Error("NIM atau QR tidak ditemukan di antrean hari ini");
    q.checked_in = true;
    if (q.state === "ditunda" || q.state === "tidak_hadir") q.state = "menunggu";
    log("Check-in", `Antrean ${q.queue_no}`);
    save();
    return q;
  },
  async walkin(input: { name: string; nim: string; counter?: number }): Promise<QueueItem> {
    await delay();
    const d = getDB();
    if (d.walkins >= d.settings.walkin_quota) throw new Error("Kuota walk-in hari ini sudah habis");
    d.walkins++;
    const n = d.queue.length + 1;
    let app = d.applications.find((a) => a.nim === input.nim);
    if (!app) {
      const now = new Date().toISOString();
      app = {
        id: `app-${uid()}`, student_id: `u-${uid()}`, student_name: input.name, nim: input.nim, kind: "baru", housing_type: "keluarga",
        address: "(diisi di loket)", kelurahan: "-", guardian_name: "-", guardian_phone: "-", distance_km: 0, category: "dekat",
        documents: [], status: "menunggu_verifikasi", created_at: now, updated_at: now,
      };
      d.applications.push(app);
    }
    const q: QueueItem = {
      id: `q-${uid()}`, queue_no: `W${pad(d.walkins)}`, application_id: app.id, student_name: input.name, nim: input.nim,
      counter: input.counter ?? (n % d.settings.counters) + 1, state: "menunggu", checked_in: true, walk_in: true,
      slot_start: new Date().toISOString(), eta_minutes: 15,
    };
    d.queue.push(q);
    log("Registrasi walk-in", `Antrean ${q.queue_no}`);
    save();
    return q;
  },
  async walkinQuota() {
    await delay(100);
    const d = getDB();
    return { used: d.walkins, quota: d.settings.walkin_quota };
  },
  async nextRecommendation(): Promise<NextRecommendation | null> {
    await delay(150);
    const w = getDB().queue.filter((q) => q.state === "menunggu").sort((a, b) => Number(b.checked_in) - Number(a.checked_in) || a.slot_start.localeCompare(b.slot_start));
    const q = w[0];
    if (!q) return null;
    return {
      queue_id: q.id, queue_no: q.queue_no, student_name: q.student_name, counter: q.counter,
      reason: q.checked_in ? "Sudah check-in dan jadwal slot paling awal; estimasi durasi layanan singkat." : "Jadwal slot paling awal di antrean.",
    };
  },
  async logRecommendation(queue_no: string, accepted: boolean) {
    await delay(50);
    log(accepted ? "Menerima rekomendasi" : "Mengabaikan rekomendasi", `Antrean ${queue_no}`);
    save();
  },
  async decide(id: string, decision: Decision, reason: string, override: boolean): Promise<Application> {
    await delay();
    const a = findApp(id);
    a.status = decision === "setujui" ? "disetujui" : decision === "revisi" ? "perlu_revisi" : "ditolak";
    a.decision_reason = reason;
    if (decision === "revisi") a.staff_notes = reason;
    a.updated_at = new Date().toISOString();
    getDB().queue.forEach((q) => { if (q.application_id === id && q.state === "dilayani") q.state = "selesai"; });
    log(`Keputusan: ${decision}${override ? " (override ML)" : ""}`, `Pengajuan ${id}`);
    save();
    return a;
  },
  async getSettings(): Promise<Settings> {
    await delay();
    return { ...getDB().settings };
  },
  async putSettings(s: Settings): Promise<Settings> {
    await delay();
    getDB().settings = s;
    log("Mengubah pengaturan", "Pengaturan sistem");
    save();
    return s;
  },
  async users(): Promise<User[]> {
    await delay();
    return structuredClone(getDB().users);
  },
  async updateUser(id: string, patch: Partial<User>): Promise<User> {
    await delay(200);
    const u = getDB().users.find((x) => x.id === id)!;
    Object.assign(u, patch);
    log("Mengubah pengguna", `Pengguna ${u.name}`);
    save();
    return u;
  },
  async auditLogs(): Promise<AuditLog[]> {
    await delay();
    return structuredClone(getDB().audit);
  },
  async models(): Promise<MlModel[]> {
    await delay();
    return [
      { name: "Durasi", version: "v1.2.0", metric: "MAE 2,4 menit", data_source: "sintetis" },
      { name: "Triase kelayakan", version: "v0.9.1", metric: "F1 0,87", data_source: "sintetis" },
      { name: "Penjadwal", version: "v1.0.3", metric: "Waktu tunggu −18%", data_source: "sintetis" },
    ];
  },
  async reportSummary(): Promise<ReportSummary> {
    await delay();
    const days = ["Sen", "Sel", "Rab", "Kam", "Jum"];
    const d = getDB();
    return {
      avg_wait_minutes: days.map((day, i) => ({ day, minutes: [14, 11, 9, 12, 8][i] })),
      utilization: Array.from({ length: d.settings.counters }, (_, i) => ({ counter: `Loket ${i + 1}`, percent: [82, 74, 66, 58, 50][i] ?? 50 })),
      no_show_rate: Math.round((d.queue.filter((q) => q.state === "tidak_hadir").length / Math.max(1, d.queue.length)) * 1000) / 10,
      rejection_reasons: [
        { reason: "Kost campur", count: 6 },
        { reason: "Dokumen tidak valid", count: 4 },
        { reason: "Tidak ada wali", count: 3 },
        { reason: "Alamat fiktif", count: 1 },
      ],
      applications_per_day: days.map((day, i) => ({ day, count: [22, 18, 25, 15, 12][i] })),
    };
  },
};

/* ---------------- Public API ---------------- */

export const api = {
  login: (identifier: string, password: string, role?: Role) =>
    USE_MOCK ? mock.login(identifier, password, role) : http<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) }),
  createApplication: (input: ApplicationInput) =>
    USE_MOCK ? mock.createApplication(input) : http<Application>("/applications", { method: "POST", body: JSON.stringify(input) }),
  updateApplication: (id: string, input: ApplicationInput) =>
    USE_MOCK ? mock.updateApplication(id, input) : http<Application>(`/applications/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  estimateDistance: (address: string, kelurahan: string) =>
    USE_MOCK ? mock.estimateDistance(address, kelurahan) : http<{ distance_km: number; category: "dekat" | "jauh" }>(`/distance?address=${encodeURIComponent(address)}&kelurahan=${encodeURIComponent(kelurahan)}`),
  myApplications: () => (USE_MOCK ? mock.myApplications() : http<Application[]>("/applications?mine=true")),
  listApplications: (status?: ApplicationStatus) =>
    USE_MOCK ? mock.listApplications(status) : http<Application[]>(`/applications${status ? `?status=${status}` : ""}`),
  getApplication: (id: string) => (USE_MOCK ? mock.getApplication(id) : http<Application>(`/applications/${id}`)),
  submitApplication: (id: string) => (USE_MOCK ? mock.submitApplication(id) : http<Application>(`/applications/${id}/submit`, { method: "POST" })),
  uploadDocument: (id: string, file: File, kind: UploadedDocument["kind"]) => {
    if (USE_MOCK) return mock.uploadDocument(id, file, kind);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    return http<UploadedDocument>(`/applications/${id}/documents`, { method: "POST", body: fd });
  },
  prescreen: (id: string) => (USE_MOCK ? mock.prescreen(id) : http<Prescreen>(`/applications/${id}/prescreen`)),
  slots: (date: string) => (USE_MOCK ? mock.slots(date) : http<Slot[]>(`/slots?date=${date}`)),
  book: (application_id: string, slot_id: string) =>
    USE_MOCK ? mock.book(application_id, slot_id) : http<Appointment>("/appointments", { method: "POST", body: JSON.stringify({ application_id, slot_id }) }),
  reschedule: (application_id: string, ticket_id: string, slot_id: string) =>
    USE_MOCK ? mock.reschedule(application_id, slot_id) : http<Appointment>(`/appointments/${ticket_id}`, { method: "PATCH", body: JSON.stringify({ slot_id }) }),
  cancel: (application_id: string, ticket_id: string) =>
    USE_MOCK ? mock.cancel(application_id) : http<void>(`/appointments/${ticket_id}`, { method: "DELETE" }),
  queue: () => (USE_MOCK ? mock.queue() : http<QueueSnapshot>("/queue")),
  queueAction: (id: string, action: "call" | "skip" | "defer" | "finish") =>
    USE_MOCK ? mock.queueAction(id, action) : http<QueueItem>(`/queue/${id}/${action}`, { method: "POST" }),
  checkin: (code: string) => (USE_MOCK ? mock.checkin(code) : http<QueueItem>("/queue/checkin", { method: "POST", body: JSON.stringify({ code }) })),
  walkin: (input: { name: string; nim: string; counter?: number }) =>
    USE_MOCK ? mock.walkin(input) : http<QueueItem>("/queue/walkin", { method: "POST", body: JSON.stringify(input) }),
  walkinQuota: () => (USE_MOCK ? mock.walkinQuota() : http<{ used: number; quota: number }>("/queue/walkin")),
  nextRecommendation: () => (USE_MOCK ? mock.nextRecommendation() : http<NextRecommendation | null>("/queue/next-recommendation")),
  logRecommendation: (queue_no: string, accepted: boolean) =>
    USE_MOCK ? mock.logRecommendation(queue_no, accepted) : http<void>("/queue/next-recommendation/log", { method: "POST", body: JSON.stringify({ queue_no, accepted }) }),
  decide: (id: string, decision: Decision, reason: string, override: boolean) =>
    USE_MOCK ? mock.decide(id, decision, reason, override) : http<Application>(`/applications/${id}/decision`, { method: "POST", body: JSON.stringify({ decision, reason, override }) }),
  getSettings: () => (USE_MOCK ? mock.getSettings() : http<Settings>("/settings")),
  putSettings: (s: Settings) => (USE_MOCK ? mock.putSettings(s) : http<Settings>("/settings", { method: "PUT", body: JSON.stringify(s) })),
  users: () => (USE_MOCK ? mock.users() : http<User[]>("/users")),
  updateUser: (id: string, patch: Partial<User>) =>
    USE_MOCK ? mock.updateUser(id, patch) : http<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  auditLogs: () => (USE_MOCK ? mock.auditLogs() : http<AuditLog[]>("/audit-logs")),
  models: () => (USE_MOCK ? mock.models() : http<MlModel[]>("/models")),
  reportSummary: () => (USE_MOCK ? mock.reportSummary() : http<ReportSummary>("/reports/summary")),
};
