import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function CheckinForm() {
  const [code, setCode] = useState("");
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (c: string) => api.checkin(c),
    onSuccess: (q) => {
      toast.success(`Check-in berhasil: ${q.queue_no} — ${q.student_name} (Loket ${q.counter})`);
      setCode("");
      qc.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <form
      className="rounded-xl border bg-card p-4 shadow-soft"
      onSubmit={(e) => {
        e.preventDefault();
        if (!code.trim()) return toast.error("Masukkan NIM atau pindai QR terlebih dahulu");
        m.mutate(code);
      }}
    >
      <Label htmlFor="checkin" className="flex items-center gap-2 font-semibold"><QrCode className="h-4 w-4 text-primary" />Check-in mahasiswa</Label>
      <p className="mt-1 text-xs text-muted-foreground">Arahkan pemindai QR ke kolom ini, atau ketik NIM / nomor antrean lalu tekan Enter.</p>
      <div className="mt-3 flex gap-2">
        <Input id="checkin" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: S22410100 atau A08" autoComplete="off" className="h-11" />
        <Button type="submit" className="h-11" disabled={m.isPending}>{m.isPending ? "Memproses…" : "Check-in"}</Button>
      </div>
    </form>
  );
}
