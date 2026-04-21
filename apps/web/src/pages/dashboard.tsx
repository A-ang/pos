import { useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah, formatDate } from "@/lib/format";
import { Car, CheckCircle2, AlertCircle, Clock, Wallet, Users, Activity, Building2, ShieldCheck, FileText } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const extendedSummary = (summary ?? {}) as any;
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity({ limit: 10 });
  const activityItems = Array.isArray(activity)
    ? activity
    : Array.isArray((activity as any)?.items)
      ? (activity as any).items
      : [];

  if (isLoadingSummary) {
    return <div className="p-8">Memuat dashboard...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Operasional</h1>
        <p className="text-slate-500 mt-1">Ringkasan status bisnis rental, kesiapan armada, dan workflow POS sesuai PRD V2</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pendapatan Bulan Ini</CardTitle>
            <Wallet className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatRupiah(summary?.totalRevenueThisMonth)}</div>
            <p className="text-xs text-slate-500 mt-1">
              Hari ini: <span className="font-medium text-slate-700">{formatRupiah(summary?.totalRevenueToday)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pendapatan Unit Internal</CardTitle>
            <Wallet className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatRupiah(extendedSummary.internalRevenueThisMonth)}</div>
            <p className="text-xs text-slate-500 mt-1">Pendapatan penuh dari armada milik perusahaan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Hak Perusahaan dari Mitra</CardTitle>
            <Building2 className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatRupiah(extendedSummary.partnerCompanyRevenueThisMonth)}</div>
            <p className="text-xs text-slate-500 mt-1">Nett share perusahaan dari unit titipan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Hak Mitra Bulan Ini</CardTitle>
            <FileText className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatRupiah(extendedSummary.partnerOwnerRevenueThisMonth)}</div>
            <p className="text-xs text-slate-500 mt-1">Kewajiban payout untuk pemilik unit titipan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Armada Tersedia</CardTitle>
            <Car className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary?.availableVehicles} <span className="text-sm font-normal text-slate-500">/ {summary?.totalVehicles} total</span></div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-blue-600">{summary?.rentedVehicles} disewa</span> · <span className="text-orange-500">{summary?.maintenanceVehicles} maintenance</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Reservasi Aktif & Tertunda</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary?.activeBookings}</div>
            <p className="text-xs text-slate-500 mt-1">
              {summary?.pendingBookings} reservasi menunggu
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tagihan Belum Lunas</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary?.unpaidInvoices}</div>
            <p className="text-xs text-slate-500 mt-1">
              Perlu ditagihkan
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Activity className="h-5 w-5 mr-2 text-slate-500" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="py-4 text-center text-sm text-slate-500">Memuat aktivitas...</div>
            ) : (
              <div className="space-y-6">
                {activityItems.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Belum ada aktivitas</p>
                ) : (
                  activityItems.map((item: any) => (
                    <div key={item.id} className="flex items-start">
                      <div className="mr-4 mt-0.5">
                        {item.type === 'booking_created' && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                        {item.type === 'payment' && <Wallet className="h-5 w-5 text-green-500" />}
                        {item.type === 'checkin' && <Car className="h-5 w-5 text-slate-500" />}
                        {item.type === 'checkout' && <Car className="h-5 w-5 text-orange-500" />}
                        {item.type === 'maintenance' && <AlertCircle className="h-5 w-5 text-red-500" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none text-slate-900">{item.description}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(item.createdAt, true)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Sorotan Kebutuhan Sistem</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center gap-2 font-medium text-slate-900"><Building2 className="h-4 w-4 text-blue-600" /> Mitra Eksternal</div>
              <p className="text-sm text-slate-500 mt-2">Kelola unit titipan, bagi hasil, dan transparansi laporan pemilik kendaraan.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center gap-2 font-medium text-slate-900"><FileText className="h-4 w-4 text-emerald-600" /> Invoice & Report</div>
              <p className="text-sm text-slate-500 mt-2">Siapkan alur cetak invoice pelanggan dan laporan mitra berdasarkan periode.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center gap-2 font-medium text-slate-900"><Users className="h-4 w-4 text-orange-600" /> Operasional Harian</div>
              <p className="text-sm text-slate-500 mt-2">Reservasi, verifikasi dokumen pelanggan, check-in, dan check-out armada.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center gap-2 font-medium text-slate-900"><ShieldCheck className="h-4 w-4 text-violet-600" /> RBAC</div>
              <p className="text-sm text-slate-500 mt-2">Akses admin, staff, dan owner dipisahkan untuk keamanan dan kontrol data.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan Struktur Pendapatan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4 bg-emerald-50 border-emerald-200">
            <p className="text-sm text-emerald-700 font-medium">Unit Internal</p>
            <p className="text-2xl font-bold text-emerald-900 mt-2">{formatRupiah(extendedSummary.internalRevenueThisMonth)}</p>
            <p className="text-xs text-emerald-700 mt-2">Masuk 100% ke perusahaan</p>
          </div>
          <div className="rounded-xl border p-4 bg-violet-50 border-violet-200">
            <p className="text-sm text-violet-700 font-medium">Bagian Perusahaan dari Mitra</p>
            <p className="text-2xl font-bold text-violet-900 mt-2">{formatRupiah(extendedSummary.partnerCompanyRevenueThisMonth)}</p>
            <p className="text-xs text-violet-700 mt-2">Pendapatan setelah dipisah dari porsi owner unit</p>
          </div>
          <div className="rounded-xl border p-4 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-700 font-medium">Kewajiban Pembayaran Mitra</p>
            <p className="text-2xl font-bold text-amber-900 mt-2">{formatRupiah(extendedSummary.partnerOwnerRevenueThisMonth)}</p>
            <p className="text-xs text-amber-700 mt-2">Dasar untuk cetak laporan payout mitra</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
