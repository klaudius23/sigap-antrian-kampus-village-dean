import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/sigap/common";
import { api } from "@/lib/api";
import { downloadCsv, reportToRows } from "@/lib/staff";

export const Route = createFileRoute("/staf/laporan")({
  head: () => ({
    meta: [
      { title: "Laporan Layanan — SIGAP-VD" },
      { name: "description", content: "Grafik waktu tunggu, utilisasi loket, tingkat tidak hadir, alasan penolakan, dan pengajuan per hari." },
      { property: "og:title", content: "Laporan Layanan — SIGAP-VD" },
      { property: "og:description", content: "Grafik waktu tunggu, utilisasi loket, tingkat tidak hadir, alasan penolakan, dan pengajuan per hari." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reports,
});

const cfg = {
  minutes: { label: "Menit", color: "var(--chart-1)" },
  percent: { label: "Utilisasi (%)", color: "var(--chart-2)" },
  count: { label: "Jumlah", color: "var(--chart-1)" },
  rejected: { label: "Jumlah", color: "var(--chart-5)" },
} satisfies ChartConfig;

function Reports() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["reports", "summary"], queryFn: api.reportSummary });

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`laporan-sigap-vd-${new Date().toISOString().slice(0, 10)}.csv`, reportToRows(data));
    toast.success("Laporan CSV berhasil diunduh");
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div></div>;
  if (isError || !data) return <EmptyState title="Gagal memuat laporan" desc="Periksa koneksi lalu coba lagi." action={<Button onClick={() => refetch()}>Coba lagi</Button>} />;

  const avgWait = Math.round((data.avg_wait_minutes.reduce((s, x) => s + x.minutes, 0) / Math.max(1, data.avg_wait_minutes.length)) * 10) / 10;
  const avgUtil = Math.round(data.utilization.reduce((s, x) => s + x.percent, 0) / Math.max(1, data.utilization.length));
  const totalApps = data.applications_per_day.reduce((s, x) => s + x.count, 0);
  const rejections = data.rejection_reasons.map((r) => ({ ...r, rejected: r.count }));

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan" desc="Ringkasan layanan Village Dean minggu ini." action={<Button size="lg" onClick={exportCsv}><Download className="h-4 w-4" />Ekspor CSV</Button>} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Rata-rata waktu tunggu" value={`${avgWait.toLocaleString("id-ID")} mnt`} />
        <Kpi label="Rata-rata utilisasi loket" value={`${avgUtil}%`} />
        <Kpi label="Total pengajuan" value={totalApps} />
        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Tingkat tidak hadir</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">{data.no_show_rate.toLocaleString("id-ID")}%</p>
          <Progress value={data.no_show_rate} className="mt-2 h-2" aria-label="Tingkat tidak hadir" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Rata-rata waktu tunggu per hari (menit)">
          <ChartContainer config={cfg} className="aspect-auto h-64 w-full">
            <LineChart data={data.avg_wait_minutes} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="minutes" type="monotone" stroke="var(--color-minutes)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Utilisasi per loket (%)">
          <ChartContainer config={cfg} className="aspect-auto h-64 w-full">
            <BarChart data={data.utilization} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="counter" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="percent" fill="var(--color-percent)" radius={8} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Pengajuan per hari">
          <ChartContainer config={cfg} className="aspect-auto h-64 w-full">
            <BarChart data={data.applications_per_day} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={8} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Alasan penolakan">
          <ChartContainer config={cfg} className="aspect-auto h-64 w-full">
            <BarChart data={rejections} layout="vertical" margin={{ left: 8, right: 16, top: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="reason" tickLine={false} axisLine={false} width={130} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="rejected" fill="var(--color-rejected)" radius={8} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl border bg-card p-4 shadow-soft"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{value}</p></div>;
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="shadow-soft"><CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}
