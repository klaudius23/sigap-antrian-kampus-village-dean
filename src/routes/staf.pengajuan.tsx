import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileSearch, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageHeader, Pill, StatusBadge } from "@/components/sigap/common";
import { api } from "@/lib/api";
import { HOUSING_LABEL, STATUS_LABEL, fmtDateTime } from "@/lib/labels";
import type { ApplicationStatus } from "@/lib/types";

export const Route = createFileRoute("/staf/pengajuan")({
  head: () => ({
    meta: [
      { title: "Daftar Pengajuan — SIGAP-VD" },
      { name: "description", content: "Cari dan tinjau pengajuan hunian outsider mahasiswa Universitas Klabat." },
      { property: "og:title", content: "Daftar Pengajuan — SIGAP-VD" },
      { property: "og:description", content: "Cari dan tinjau pengajuan hunian outsider mahasiswa Universitas Klabat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplicationList,
});

const STATUSES = (Object.keys(STATUS_LABEL) as ApplicationStatus[]).filter((s) => s !== "draft");

function ApplicationList() {
  const [status, setStatus] = useState<"semua" | ApplicationStatus>("semua");
  const [q, setQ] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["applications", "all"], queryFn: () => api.listApplications() });
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((a) => (status === "semua" || a.status === status) && (!term || a.student_name.toLowerCase().includes(term) || a.nim.toLowerCase().includes(term)));
  }, [data, status, q]);

  return (
    <div className="space-y-6">
      <PageHeader title="Pengajuan" desc="Semua pengajuan hunian outsider yang sudah dikirim mahasiswa." />
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Label htmlFor="cari" className="sr-only">Cari nama atau NIM</Label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="cari" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau NIM…" className="h-11 pl-9" />
        </div>
        <div className="w-full sm:w-64">
          <Label htmlFor="status" className="sr-only">Filter status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger id="status" className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua status</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : isError ? (
        <EmptyState title="Gagal memuat pengajuan" desc="Periksa koneksi lalu coba lagi." action={<Button onClick={() => refetch()}>Coba lagi</Button>} />
      ) : !rows.length ? (
        <EmptyState title="Tidak ada pengajuan" desc="Coba ubah kata kunci atau filter status." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Mahasiswa</TableHead><TableHead>Tipe hunian</TableHead><TableHead>Kategori</TableHead><TableHead>Status</TableHead><TableHead>Diperbarui</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell><p className="font-medium">{a.student_name}</p><p className="font-mono text-xs text-muted-foreground">{a.nim}</p></TableCell>
                  <TableCell className="text-sm">{HOUSING_LABEL[a.housing_type]}</TableCell>
                  <TableCell><Pill tone={a.category === "dekat" ? "info" : "neutral"}>{a.category === "dekat" ? "Dekat" : "Jauh"} · {a.distance_km} km</Pill></TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmtDateTime(a.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild><Link to="/staf/tinjau/$id" params={{ id: a.id }}><FileSearch className="h-4 w-4" />Tinjau</Link></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
