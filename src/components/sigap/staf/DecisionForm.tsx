import { useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from "../common";
import { ELIGIBILITY_LABEL } from "@/lib/labels";
import { DECISION_LABEL, MIN_REASON_LENGTH, ML_DECISION, isOverride, isReasonValid } from "@/lib/staff";
import type { Decision, EligibilityLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Decision; icon: typeof CheckCircle2; tone: string }[] = [
  { value: "setujui", icon: CheckCircle2, tone: "text-success" },
  { value: "revisi", icon: RotateCcw, tone: "text-warning-foreground" },
  { value: "tolak", icon: XCircle, tone: "text-destructive" },
];

export function DecisionForm({ mlLabel, pending, onSubmit }: { mlLabel?: EligibilityLabel; pending?: boolean; onSubmit: (d: Decision, reason: string, override: boolean) => void }) {
  const [decision, setDecision] = useState<Decision | undefined>();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const override = isOverride(mlLabel, decision);
  const reasonErr = !isReasonValid(reason) ? `Alasan wajib diisi (minimal ${MIN_REASON_LENGTH} karakter)` : "";

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3"><CardTitle className="text-lg">Keputusan staf</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (decision && !reasonErr) onSubmit(decision, reason.trim(), override); }}>
          {mlLabel && (
            <p className="text-sm text-muted-foreground">Rekomendasi sistem: <span className="font-semibold text-foreground">{ELIGIBILITY_LABEL[mlLabel]}</span> → {DECISION_LABEL[ML_DECISION[mlLabel]]}</p>
          )}
          <RadioGroup value={decision ?? ""} onValueChange={(v) => setDecision(v as Decision)} aria-label="Pilih keputusan" className="gap-2">
            {OPTIONS.map((o) => (
              <Label key={o.value} htmlFor={`d-${o.value}`}
                className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-3 font-medium hover:bg-muted", decision === o.value && "border-primary bg-secondary")}>
                <RadioGroupItem id={`d-${o.value}`} value={o.value} />
                <o.icon className={cn("h-4 w-4", o.tone)} />{DECISION_LABEL[o.value]}
              </Label>
            ))}
          </RadioGroup>
          {touched && !decision && <p className="text-sm text-destructive">Pilih salah satu keputusan.</p>}
          {override && (
            <div className="rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm text-warning-foreground" role="status">
              <Pill tone="warning" className="mb-1"><AlertTriangle className="h-3 w-3" />Override</Pill>
              <p>Keputusan Anda berbeda dari rekomendasi sistem. Jelaskan alasannya — alasan ini dicatat di log audit.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="reason">{override ? "Alasan override (wajib)" : "Alasan keputusan (wajib)"}</Label>
            <Textarea id="reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={touched && !!reasonErr}
              placeholder={decision === "revisi" ? "Contoh: Surat domisili buram, mohon unggah ulang." : "Tuliskan alasan keputusan…"} />
            {touched && reasonErr && <p className="text-sm text-destructive">{reasonErr}</p>}
            {decision === "revisi" && <p className="text-xs text-muted-foreground">Alasan ini akan ditampilkan ke mahasiswa sebagai catatan revisi.</p>}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Menyimpan…" : "Simpan keputusan"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
