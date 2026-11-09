import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Info, Loader2, MapPin, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, Pill } from "@/components/sigap/common";
import { FileDrop } from "@/components/sigap/FileDrop";
import { api } from "@/lib/api";
import { HOUSING_LABEL } from "@/lib/labels";
import type { ApplicationInput, ApplicationKind, DistanceCategory, HousingType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mahasiswa/pengajuan")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({ meta: [{ title: "Formulir Pengajuan — SIGAP-VD" }, { name: "description", content: "Isi formulir pengajuan hunian outsider langkah demi langkah." }, { property: "og:title", content: "Formulir Pengajuan — SIGAP-VD" }, { property: "og:description", content: "Formulir pengajuan hunian outsider." }] }),
  component: Wizard,
});

const STEPS = ["Jenis & hunian", "Alamat & wali", "Dokumen", "Ringkasan"];

const addrSchema = z.object({
  address: z.string().trim().min(10, "Alamat minimal 10 karakter").max(200),
  kelurahan: z.string().trim().min(3, "Kelurahan wajib diisi").max(60),
  guardian_name: z.string().trim().min(3, "Nama wali wajib diisi").max(80),
  guardian_phone: z.string().trim().regex(/^08\d{8,11}$/, "Nomor HP harus diawali 08, 10–13 digit"),
});

function Wizard() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const existing = useQuery({ queryKey: ["application", id], queryFn: () => api.getApplication(id!), enabled: !!id });

  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<ApplicationKind | "">("");
  const [housing, setHousing] = useState<HousingType | "">("");
  const [f, setF] = useState({ address: "", kelurahan: "", guardian_name: "", guardian_phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dist, setDist] = useState<{ distance_km: number; category: DistanceCategory } | null>(null);
  const [distLoading, setDistLoading] = useState(false);
  const [domisili, setDomisili] = useState<File | null>(null);
  const [pendukung, setPendukung] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const app = existing.data;
  useEffect(() => {
    if (!app) return;
    setKind(app.kind); setHousing(app.housing_type);
    setF({ address: app.address, kelurahan: app.kelurahan, guardian_name: app.guardian_name, guardian_phone: app.guardian_phone });
    setDist({ distance_km: app.distance_km, category: app.category });
  }, [app]);

  const existingDomisili = app?.documents.find((d) => d.kind === "domisili")?.name;

  const next = async () => {
    if (step === 0) {
      const e: Record<string, string> = {};
      if (!kind) e.kind = "Pilih jenis pengajuan";
      if (!housing) e.housing = "Pilih tipe hunian";
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    if (step === 1) {
      const r = addrSchema.safeParse(f);
      if (!r.success) {
        setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
        return;
      }
      setErrors({});
      setDistLoading(true);
      try { setDist(await api.estimateDistance(f.address, f.kelurahan)); } catch { toast.error("Gagal menghitung jarak"); } finally { setDistLoading(false); }
    }
    if (step === 2 && kind === "baru" && !domisili && !existingDomisili) {
      setErrors({ domisili: "Surat domisili wajib untuk pendaftar baru" });
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!consent) return setErrors({ consent: "Anda harus menyetujui pemrosesan data pribadi" });
    setSubmitting(true);
    try {
      const input: ApplicationInput = { kind: kind as ApplicationKind, housing_type: housing as HousingType, ...f };
      const a = app ? await api.updateApplication(app.id, input) : await api.createApplication(input);
      if (domisili) await api.uploadDocument(a.id, domisili, "domisili");
      if (pendukung) await api.uploadDocument(a.id, pendukung, "pendukung");
      await api.submitApplication(a.id);
      await qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Pengajuan berhasil dikirim");
      navigate({ to: "/mahasiswa/hasil/$id", params: { id: a.id } });
    } catch (e) {
      toast.error((e as Error).message || "Gagal mengirim pengajuan");
    } finally {
      setSubmitting(false);
    }
  };

  if (id && existing.isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={app?.status === "perlu_revisi" ? "Perbaiki pengajuan" : "Pengajuan hunian outsider"} desc={`Langkah ${step + 1} dari ${STEPS.length}: ${STEPS[step]}`} />
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Langkah formulir">
        {STEPS.map((s, i) => <li key={s} className={cn("h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-border")} aria-label={s} />)}
      </ol>

      {app?.status === "perlu_revisi" && app.staff_notes && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm text-warning-foreground">
          <p className="flex items-center gap-2 font-semibold"><MessageSquareWarning className="h-4 w-4" />Catatan staf</p>
          <p className="mt-1">{app.staff_notes}</p>
        </div>
      )}

      <Card><CardContent className="space-y-6 p-5 sm:p-6">
        {step === 0 && (
          <>
            <fieldset className="space-y-3">
              <legend className="mb-2 font-semibold">Jenis pengajuan</legend>
              <RadioGroup value={kind} onValueChange={(v) => setKind(v as ApplicationKind)} className="grid grid-cols-2 gap-3">
                {(["baru", "perpanjangan"] as const).map((k) => (
                  <Choice key={k} value={k} id={`kind-${k}`} label={k === "baru" ? "Baru" : "Perpanjangan"} selected={kind === k} />
                ))}
              </RadioGroup>
              {errors.kind && <p className="text-sm text-destructive">{errors.kind}</p>}
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-2 font-semibold">Tipe hunian</legend>
              <RadioGroup value={housing} onValueChange={(v) => setHousing(v as HousingType)} className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(HOUSING_LABEL) as HousingType[]).map((h) => (
                  <Choice key={h} value={h} id={`h-${h}`} label={HOUSING_LABEL[h]} selected={housing === h} />
                ))}
              </RadioGroup>
              {errors.housing && <p className="text-sm text-destructive">{errors.housing}</p>}
              <p className="flex gap-2 rounded-lg bg-info-soft p-3 text-sm text-info"><Info className="mt-0.5 h-4 w-4 shrink-0" />Sesuai aturan kampus, mahasiswa outsider wajib tinggal bersama keluarga/wali atau di kost khusus satu jenis kelamin. Kost campur tidak diizinkan — jika tidak memenuhi, mahasiswa akan diarahkan ke asrama.</p>
            </fieldset>
          </>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field id="address" label="Alamat lengkap" error={errors.address}>
              <Textarea id="address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Jl. ..., No. ..., Lingkungan ..." />
            </Field>
            <Field id="kelurahan" label="Kelurahan" error={errors.kelurahan}>
              <Input id="kelurahan" className="h-12" value={f.kelurahan} onChange={(e) => setF({ ...f, kelurahan: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="gname" label="Nama wali / keluarga" error={errors.guardian_name}>
                <Input id="gname" className="h-12" value={f.guardian_name} onChange={(e) => setF({ ...f, guardian_name: e.target.value })} />
              </Field>
              <Field id="gphone" label="Nomor HP wali" error={errors.guardian_phone}>
                <Input id="gphone" className="h-12" inputMode="tel" value={f.guardian_phone} onChange={(e) => setF({ ...f, guardian_phone: e.target.value })} placeholder="08xxxxxxxxxx" />
              </Field>
            </div>
            {dist && <DistanceBox dist={dist} />}
            <p className="text-xs text-muted-foreground">Jarak ke kampus dan kategori dihitung otomatis setelah Anda lanjut.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {dist && <DistanceBox dist={dist} />}
            <FileDrop id="domisili" label="Surat domisili kelurahan" required={kind === "baru"} file={domisili} existingName={existingDomisili} onChange={setDomisili} />
            {errors.domisili && <p className="text-sm text-destructive">{errors.domisili}</p>}
            <FileDrop id="pendukung" label="Dokumen pendukung (opsional)" file={pendukung} onChange={setPendukung} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <dl className="divide-y rounded-xl border text-sm">
              {[
                ["Jenis pengajuan", kind === "baru" ? "Baru" : "Perpanjangan"],
                ["Tipe hunian", housing ? HOUSING_LABEL[housing] : "-"],
                ["Alamat", `${f.address}, Kel. ${f.kelurahan}`],
                ["Wali", `${f.guardian_name} (${f.guardian_phone})`],
                ["Jarak / kategori", dist ? `${dist.distance_km} km · Outsider ${dist.category === "dekat" ? "Dekat" : "Jauh"}` : "-"],
                ["Surat domisili", domisili?.name ?? existingDomisili ?? "—"],
                ["Dokumen pendukung", pendukung?.name ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-2 p-3"><dt className="text-muted-foreground">{k}</dt><dd className="col-span-2 font-medium">{v}</dd></div>
              ))}
            </dl>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
                Saya menyetujui pemrosesan data pribadi saya oleh Village Dean Universitas Klabat untuk keperluan verifikasi hunian, sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
              </Label>
            </div>
            {errors.consent && <p className="text-sm text-destructive">{errors.consent}</p>}
          </div>
        )}

        <div className="flex justify-between gap-3 pt-2">
          <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || submitting}><ArrowLeft className="h-4 w-4" />Kembali</Button>
          {step < 3 ? (
            <Button size="lg" onClick={next} disabled={distLoading}>{distLoading && <Loader2 className="h-4 w-4 animate-spin" />}Lanjut<ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button size="lg" onClick={submit} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Kirim pengajuan</Button>
          )}
        </div>
      </CardContent></Card>
    </div>
  );
}

function Choice({ value, id, label, selected }: { value: string; id: string; label: string; selected: boolean }) {
  return (
    <Label htmlFor={id} className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 font-medium", selected && "border-primary bg-secondary")}>
      <RadioGroupItem value={value} id={id} />{label}
    </Label>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}

function DistanceBox({ dist }: { dist: { distance_km: number; category: DistanceCategory } }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-4">
      <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />Jarak ke kampus: <strong>{dist.distance_km} km</strong></div>
      <Pill tone={dist.category === "dekat" ? "success" : "info"}>Outsider {dist.category === "dekat" ? "Dekat" : "Jauh"}</Pill>
    </div>
  );
}
