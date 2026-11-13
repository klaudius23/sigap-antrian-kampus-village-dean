import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const NIM_RE = /^[A-Za-z]?\d{6,10}$/;

export function WalkinDialog({ counters }: { counters: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [counter, setCounter] = useState("auto");
  const [touched, setTouched] = useState(false);
  const qc = useQueryClient();
  const quota = useQuery({ queryKey: ["queue", "walkin-quota"], queryFn: api.walkinQuota, enabled: open });
  const full = !!quota.data && quota.data.used >= quota.data.quota;
  const nameErr = name.trim().length < 3 ? "Nama minimal 3 karakter" : "";
  const nimErr = !NIM_RE.test(nim.trim()) ? "Format NIM tidak valid (contoh: S22410100)" : "";

  const m = useMutation({
    mutationFn: () => api.walkin({ name: name.trim(), nim: nim.trim().toUpperCase(), counter: counter === "auto" ? undefined : Number(counter) }),
    onSuccess: (q) => {
      toast.success(`Tiket walk-in ${q.queue_no} dibuat untuk ${q.student_name} (Loket ${q.counter})`);
      qc.invalidateQueries({ queryKey: ["queue"] });
      setOpen(false); setName(""); setNim(""); setCounter("auto"); setTouched(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="lg"><UserPlus className="h-4 w-4" />Daftar walk-in</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pendaftaran walk-in</DialogTitle>
          <DialogDescription>Untuk mahasiswa yang datang langsung tanpa akses internet. Tiket langsung tercatat sudah check-in.</DialogDescription>
        </DialogHeader>
        <form id="walkin-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!nameErr && !nimErr && !full) m.mutate(); }}>
          <div className="rounded-lg bg-muted p-3">
            <div className="flex justify-between text-sm"><span>Kuota walk-in hari ini</span><span className="font-semibold tabular-nums">{quota.data ? `${quota.data.used}/${quota.data.quota}` : "…"}</span></div>
            <Progress className="mt-2 h-2" value={quota.data ? (quota.data.used / quota.data.quota) * 100 : 0} aria-label="Kuota walk-in terpakai" />
            {full && <p className="mt-2 text-sm font-medium text-destructive">Kuota walk-in hari ini sudah habis. Arahkan mahasiswa untuk memesan slot online.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wi-name">Nama lengkap</Label>
            <Input id="wi-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={touched && !!nameErr} className="h-11" />
            {touched && nameErr && <p className="text-sm text-destructive">{nameErr}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wi-nim">NIM</Label>
            <Input id="wi-nim" value={nim} onChange={(e) => setNim(e.target.value)} aria-invalid={touched && !!nimErr} className="h-11 font-mono" />
            {touched && nimErr && <p className="text-sm text-destructive">{nimErr}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wi-counter">Loket</Label>
            <Select value={counter} onValueChange={setCounter}>
              <SelectTrigger id="wi-counter" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Otomatis (paling sedikit antrean)</SelectItem>
                {Array.from({ length: counters }, (_, i) => <SelectItem key={i} value={String(i + 1)}>Loket {i + 1}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button type="submit" form="walkin-form" disabled={m.isPending || full}>{m.isPending ? "Membuat tiket…" : "Buat tiket walk-in"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
