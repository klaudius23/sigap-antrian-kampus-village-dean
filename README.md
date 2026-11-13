# Sigap Antrian Kampus Village Dean

Build a mobile-first responsive web app called "SIGAP-VD" (Smart Queue & Approval System for Village Dean) for Universitas Klabat. It replaces a manual, long queue for off-campus ("outsider") student housing registration with online registration, a virtual ticket, and ML-assisted pre-screening. ALL UI TEXT MUST BE IN INDONESIAN.

TECH & STRUCTURE

- React + TypeScript + Tailwind + shadcn/ui, React Router, TanStack Query.

- Put every API call in one file `src/lib/api.ts`. The base URL comes from `VITE_API_BASE_URL`. Add a `USE_MOCK` flag (env `VITE_USE_MOCK`, default true). When true, the same functions return realistic mock data with a small artificial delay, so the whole app is demoable without a backend. Use only fake data, never real student data.

- Typed models in `src/lib/types.ts`.

ROLES (simple login screen with NIM/email + password; in mock mode provide a quick "Masuk sebagai Mahasiswa / Staf / Admin" switch). Route guards by role.

1) STUDENT PORTAL (mobile-first)

- Dashboard: current application status as a stepper with statuses: Draft, Menunggu verifikasi, Dijadwalkan, Perlu revisi, Disetujui, Ditolak/diarahkan ke asrama. Show application history.

- Application form (multi-step wizard with validation):

  a. Jenis pengajuan: Baru / Perpanjangan.

  b. Tipe hunian: Tinggal dengan keluarga, Tinggal dengan wali, Kost putra, Kost putri. (No "kost campur" option; show a helper text explaining campus rules: must live with family/guardian or in a single-gender boarding house, otherwise student is directed to the dormitory.)

  c. Alamat lengkap, kelurahan, kontak wali (nama + nomor HP).

  d. Jarak ke kampus (read-only, auto-filled from API) and kategori Outsider Dekat / Jauh (read-only badge, staff can correct later).

  e. Upload dokumen: surat domisili kelurahan (required for new applicants) + dokumen pendukung. Allow only PDF/JPG/PNG, max 5 MB, show preview, replace file before submit.

  f. Consent checkbox for personal data processing (UU PDP) and summary page before submit.

- After submit: "Pra-verifikasi" result card showing (1) document completeness: Lengkap / Perlu perbaikan with specific reasons, and (2) eligibility recommendation: Layak / Perlu review / Berpotensi ke asrama with a confidence bar and a list of reasons. Always show the disclaimer "Ini rekomendasi sistem, keputusan akhir ada pada staf Village Dean."

- Slot booking: date picker + list of available time slots with remaining capacity; after booking show a virtual ticket with QR code, queue number, estimated service time (minutes), and counter. Allow reschedule/cancel until a configurable deadline.

- Revision flow: if status is "Perlu revisi", show staff notes and let the student fix fields/documents and resubmit.

2) STAFF DASHBOARD (desktop-first, still usable on tablet)

- Live queue board: columns/cards for "Menunggu", "Sedang dilayani", "Selesai", with per-counter view, waiting count, estimated remaining time, and no-show markers. Auto-refresh every few seconds (polling is fine).

- Queue actions: Panggil, Lewati, Tunda, Check-in (scan QR input field or manual NIM entry). Show a "Rekomendasi urutan berikutnya" suggestion banner from the scheduler; staff can accept or ignore it (log the choice).

- Walk-in registration form for students without internet (creates a walk-in ticket, respects walk-in quota).

- Application review panel (opens when a student is called): student summary, housing type, address, distance/category, documents viewer, ML pre-verification summary (document check, eligibility recommendation + reasons, anomaly flags such as "alamat sama dengan N mahasiswa lain"), and a decision form: Setujui / Minta revisi / Tolak (arahkan ke asrama) with mandatory reason. If the decision differs from the ML recommendation, show an "Override" indicator and require a reason.

- Reports page: charts for average waiting time, utilization per counter, no-show rate, rejection reasons, applications per day; export CSV.

3) ADMIN PAGE

- Settings form: jam layanan, jumlah loket, panjang slot (menit), kuota walk-in, ambang jarak dekat/jauh (km), periode pendaftaran, batas waktu reschedule.

- User & role management table (mahasiswa/staf/admin).

- Read-only "Audit log" table (siapa, aksi, kapan, objek) with filters.

- Read-only "Model ML" table showing model name (Durasi, Triase kelayakan, Penjadwal), version, metric, and data source (nyata/sintetis).

API CONTRACT (implement in api.ts; mock returns the same shapes)

- POST /auth/login -> {token, user:{id, name, role}}

- POST /applications ; GET /applications?mine=true ; GET /applications/{id} ; POST /applications/{id}/submit

- POST /applications/{id}/documents (multipart)

- GET /applications/{id}/prescreen -> {documents:{status, reasons[]}, eligibility:{label, confidence, reasons[]}, anomalies[]}

- GET /slots?date=YYYY-MM-DD -> [{id, start, end, remaining}]

- POST /appointments {application_id, slot_id} -> {ticket_id, queue_no, qr_payload, eta_minutes, counter}

- PATCH /appointments/{id} (reschedule) ; DELETE /appointments/{id}

- GET /queue ; POST /queue/{id}/call|skip|defer ; POST /queue/checkin ; POST /queue/walkin ; GET /queue/next-recommendation

- POST /applications/{id}/decision {decision, reason}

- GET/PUT /settings ; GET /users ; GET /audit-logs ; GET /models

- GET /reports/summary

DESIGN

- Clean, trustworthy university look: calm blue/teal primary, white background, generous spacing, large touch targets, clear status badges (colors for each status), skeleton loaders, friendly empty states and error toasts in Indonesian. Light mode first, dark mode optional.

- Accessibility: good contrast, labeled inputs, keyboard navigable.

DO NOT implement the real backend, real authentication, WhatsApp/email sending, or OCR. Keep components small and reusable. Use mock data of about 30 dummy students and 3 counters.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/555c4884-d5bd-566a-ab5e-bb5ca54c26fb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
