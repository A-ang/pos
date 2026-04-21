import { useMemo, useState } from "react";
import { useGetRevenueReport, useGetVehicleUtilizationReport, useGetPartnerReport, useListBookings, useListVehicles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRupiah } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Laporan() {
  const [dateRange, setDateRange] = useState("this_month");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const [printConfigOpen, setPrintConfigOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    companyName: "POS Rental Mobil",
    headerNote: "Laporan operasional rental mobil",
    signerName: "Administrator",
    signerTitle: "Kepala Operasional",
    footerNote: "Dokumen ini dihasilkan dari sistem dan dapat digunakan untuk kebutuhan audit internal.",
  });
  
  const getDates = () => {
    const today = new Date();
    if (dateRange === "this_month") {
      return {
        startDate: format(startOfMonth(today), "yyyy-MM-dd"),
        endDate: format(endOfMonth(today), "yyyy-MM-dd")
      };
    } else {
      const lastMonth = subMonths(today, 1);
      return {
        startDate: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        endDate: format(endOfMonth(lastMonth), "yyyy-MM-dd")
      };
    }
  };

  const [customDates, setCustomDates] = useState(getDates());

  const dates = useMemo(() => {
    if (dateRange === "custom") return customDates;
    return getDates();
  }, [dateRange, customDates]);

  const { data: revenueData, isLoading: isLoadingRevenue } = useGetRevenueReport({
    startDate: dates.startDate,
    endDate: dates.endDate,
    groupBy: "day"
  });

  const { data: utilizationData, isLoading: isLoadingUtil } = useGetVehicleUtilizationReport({
    startDate: dates.startDate,
    endDate: dates.endDate,
  });

  const { data: partnerData, isLoading: isLoadingPartner } = useGetPartnerReport({
    startDate: dates.startDate,
    endDate: dates.endDate,
  });
  const { data: bookingsData } = useListBookings();
  const { data: vehiclesData } = useListVehicles();
  const revenueItems = Array.isArray(revenueData)
    ? revenueData
    : Array.isArray((revenueData as any)?.items)
      ? (revenueData as any).items
      : [];
  const utilizationItems = Array.isArray(utilizationData)
    ? utilizationData
    : Array.isArray((utilizationData as any)?.items)
      ? (utilizationData as any).items
      : [];
  const partnerItems = Array.isArray(partnerData)
    ? partnerData
    : Array.isArray((partnerData as any)?.items)
      ? (partnerData as any).items
      : [];
  const bookingItems = Array.isArray(bookingsData)
    ? bookingsData
    : Array.isArray((bookingsData as any)?.items)
      ? (bookingsData as any).items
      : [];
  const vehicleItems = Array.isArray(vehiclesData)
    ? vehiclesData
    : Array.isArray((vehiclesData as any)?.items)
      ? (vehiclesData as any).items
      : [];
  const internalVehicleItems = utilizationItems.filter((item: any) => item.ownership === "internal");
  const partnerOptions: string[] = Array.from(
    new Set(
      partnerItems
        .map((item: any) => item.partnerName)
        .filter((partnerName: unknown): partnerName is string => typeof partnerName === "string" && partnerName.length > 0),
    ),
  );

  const isWithinRange = (dateValue: string) => {
    const current = new Date(dateValue).getTime();
    const start = new Date(`${dates.startDate}T00:00:00`).getTime();
    const end = new Date(`${dates.endDate}T23:59:59`).getTime();
    return current >= start && current <= end;
  };

  const detailedBookings = bookingItems.filter((booking: any) => isWithinRange(booking.startDate));
  const partnerDetailedRows = detailedBookings
    .map((booking: any) => {
      const vehicle = vehicleItems.find((item: any) => item.id === booking.vehicleId);
      return { booking, vehicle };
    })
    .filter(({ vehicle }: any) => vehicle?.ownership === "external")
    .filter(({ vehicle }: any) => selectedPartner === "all" ? true : vehicle?.partnerName === selectedPartner);
  const internalDetailedRows = detailedBookings
    .map((booking: any) => {
      const vehicle = vehicleItems.find((item: any) => item.id === booking.vehicleId);
      return { booking, vehicle };
    })
    .filter(({ vehicle }: any) => vehicle?.ownership === "internal");

  const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printHtml = (title: string, html: string) => {
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) return;
    w.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#f8fafc}.meta{color:#64748b;font-size:12px;margin-top:4px}.signature{margin-top:32px;text-align:right}</style></head><body><h1>${printConfig.companyName}</h1><div class="meta">${printConfig.headerNote}</div><div class="meta">Periode: ${dates.startDate} s/d ${dates.endDate}</div><h2 style="margin-top:16px">${title}</h2>${html}<div class="signature"><p>${printConfig.signerName}</p><p class="meta">${printConfig.signerTitle}</p></div><p class="meta" style="margin-top:24px">${printConfig.footerNote}</p></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-semibold text-slate-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-500">{entry.name}:</span>
              <span className="font-medium text-slate-900">
                {entry.name === 'Pendapatan' || entry.name === 'Total Revenue' ? formatRupiah(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Laporan</h1>
          <p className="text-slate-500 mt-1">Analisis performa bisnis, order pelanggan, utilisasi armada, dan laporan mitra</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Bulan Ini</SelectItem>
              <SelectItem value="last_month">Bulan Lalu</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === "custom" && (
            <>
              <Input type="date" value={customDates.startDate} onChange={(e) => setCustomDates((prev) => ({ ...prev, startDate: e.target.value }))} className="w-[170px] bg-white" />
              <Input type="date" value={customDates.endDate} onChange={(e) => setCustomDates((prev) => ({ ...prev, endDate: e.target.value }))} className="w-[170px] bg-white" />
            </>
          )}
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger className="w-[220px] bg-white">
              <SelectValue placeholder="Status Pembayaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status Pembayaran</SelectItem>
              <SelectItem value="unpaid">Belum Bayar</SelectItem>
              <SelectItem value="partial">Bayar Sebagian</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={printConfigOpen} onOpenChange={setPrintConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Kustomisasi Cetak</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Kustomisasi Cetak Laporan</DialogTitle>
                <DialogDescription>Atur nama perusahaan, catatan header, penanda tangan, dan footer pada laporan.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nama Perusahaan</Label>
                  <Input value={printConfig.companyName} onChange={(e) => setPrintConfig((prev) => ({ ...prev, companyName: e.target.value }))} />
                </div>
                <div>
                  <Label>Catatan Header</Label>
                  <Textarea value={printConfig.headerNote} onChange={(e) => setPrintConfig((prev) => ({ ...prev, headerNote: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nama Penanda Tangan</Label>
                    <Input value={printConfig.signerName} onChange={(e) => setPrintConfig((prev) => ({ ...prev, signerName: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Jabatan</Label>
                    <Input value={printConfig.signerTitle} onChange={(e) => setPrintConfig((prev) => ({ ...prev, signerTitle: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Catatan Footer</Label>
                  <Textarea value={printConfig.footerNote} onChange={(e) => setPrintConfig((prev) => ({ ...prev, footerNote: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPrintConfigOpen(false)}>Tutup</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => downloadCsv("laporan-order-pelanggan.csv", [["Periode", "Pendapatan", "Jumlah Reservasi"], ...revenueItems.map((item: any) => [item.period, item.revenue, item.bookingCount])])}>Ekspor PDF/CSV</Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Tanggal Mulai</p>
            <p className="font-semibold text-slate-900 mt-1">{dates.startDate}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Tanggal Akhir</p>
            <p className="font-semibold text-slate-900 mt-1">{dates.endDate}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Filter Pembayaran</p>
            <p className="font-semibold text-slate-900 mt-1">{paymentStatus === "all" ? "Semua Status" : paymentStatus}</p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-600">Workflow PRD</p>
            <p className="font-semibold text-blue-900 mt-1">Cetak laporan mitra & order pelanggan</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6">
          <TabsTrigger value="revenue" className="data-[state=active]:bg-white">Order Pelanggan</TabsTrigger>
          <TabsTrigger value="utilization" className="data-[state=active]:bg-white">Utilisasi Armada</TabsTrigger>
          <TabsTrigger value="partners" className="data-[state=active]:bg-white">Unit Titipan / Mitra</TabsTrigger>
          <TabsTrigger value="internal" className="data-[state=active]:bg-white">Mobil Internal</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle>Laporan Order Pelanggan</CardTitle>
              <CardDescription>Total order dan pendapatan harian berdasarkan periode yang dipilih</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={() => printHtml("Laporan Order Pelanggan", `<table><thead><tr><th>Periode</th><th>Pendapatan</th><th>Jumlah Reservasi</th></tr></thead><tbody>${revenueItems.map((item: any) => `<tr><td>${item.period}</td><td>${formatRupiah(item.revenue)}</td><td>${item.bookingCount}</td></tr>`).join("")}</tbody></table>`)}>Cetak Laporan Order</Button>
              </div>
              {isLoadingRevenue ? (
                <div className="h-[400px] flex items-center justify-center text-slate-500">Memuat grafik...</div>
              ) : revenueItems.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-slate-500">Tidak ada data untuk periode ini</div>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueItems} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="period" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        yAxisId="left"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => `Rp${value / 1000000}M`}
                        dx={-10}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" name="Pendapatan" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      <Line yAxisId="right" type="monotone" dataKey="bookingCount" name="Jml Reservasi" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle>Laporan Utilisasi Kendaraan</CardTitle>
              <CardDescription>Persentase hari disewa dibandingkan total hari dalam periode</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUtil ? (
                <div className="text-center py-8 text-slate-500">Memuat laporan...</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Kendaraan</TableHead>
                      <TableHead>Kepemilikan</TableHead>
                      <TableHead className="text-center">Jml Reservasi</TableHead>
                      <TableHead className="text-center">Hari Disewa</TableHead>
                      <TableHead className="text-center">Utilisasi (%)</TableHead>
                      <TableHead className="text-right">Total Pendapatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utilizationItems.map((item: any) => (
                      <TableRow key={item.vehicleId}>
                        <TableCell>
                          <div className="font-medium">{item.vehicleName}</div>
                          <div className="text-xs text-slate-500 font-mono">{item.plateNumber}</div>
                        </TableCell>
                        <TableCell className="capitalize">{item.ownership}</TableCell>
                        <TableCell className="text-center">{item.totalBookings}</TableCell>
                        <TableCell className="text-center font-medium">{item.utilizationDays} hari</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${item.utilizationPercent > 70 ? 'bg-green-500' : item.utilizationPercent > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${Math.min(item.utilizationPercent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-9 text-right">{item.utilizationPercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(item.totalRevenue)}</TableCell>
                      </TableRow>
                    ))}
                    {utilizationItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">Tidak ada data utilisasi</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle>Laporan Unit Titipan (Partner Report)</CardTitle>
              <CardDescription>Rincian nett profit sharing per unit eksternal sesuai periode laporan dan siap dicetak untuk mitra.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="text-sm text-slate-500">
                  Periode laporan: <span className="font-medium text-slate-800">{dates.startDate}</span> s/d <span className="font-medium text-slate-800">{dates.endDate}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                    <SelectTrigger className="w-[220px] bg-white">
                      <SelectValue placeholder="Pilih mitra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Mitra</SelectItem>
                      {partnerOptions.map((partner) => (
                        <SelectItem key={partner} value={partner}>{partner}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => printHtml("Laporan Mitra", `<table><thead><tr><th>Tanggal Sewa</th><th>Kendaraan</th><th>Plat</th><th>Pelanggan</th><th>Tipe Sewa</th><th>Antar Jemput</th><th>Total Tagihan</th></tr></thead><tbody>${partnerDetailedRows.map(({ booking, vehicle }: any) => `<tr><td>${format( new Date(booking.startDate), 'yyyy-MM-dd')}</td><td>${vehicle?.name ?? booking.vehicleName}</td><td>${vehicle?.plateNumber ?? booking.vehiclePlate}</td><td>${booking.customerName}</td><td>${booking.rentalType}</td><td>${formatRupiah(booking.pickupDropoffFee ?? 0)}</td><td>${formatRupiah(booking.totalAmount)}</td></tr>`).join("")}</tbody></table><br/><table><thead><tr><th>Kendaraan</th><th>Mitra</th><th>Pendapatan Kotor</th><th>Biaya Operasional</th><th>Pendapatan Bersih</th><th>% Mitra</th><th>Hak Mitra</th><th>Hak Perusahaan</th></tr></thead><tbody>${partnerItems.filter((item: any) => selectedPartner === 'all' ? true : item.partnerName === selectedPartner).map((item: any) => `<tr><td>${item.vehicleName} (${item.plateNumber})</td><td>${item.partnerName}</td><td>${formatRupiah(item.totalRevenue)}</td><td>${formatRupiah(item.operationalCost)}</td><td>${formatRupiah(item.netRevenue)}</td><td>${item.profitSharePercent}%</td><td>${formatRupiah(item.partnerShare)}</td><td>${formatRupiah(item.companyShare)}</td></tr>`).join("")}</tbody></table>`)}>Cetak Laporan Mitra</Button>
                </div>
              </div>
              {isLoadingPartner ? (
                <div className="text-center py-8 text-slate-500">Memuat laporan...</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Detail Unit Keluar Per Mitra</h3>
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Tanggal Sewa</TableHead>
                          <TableHead>Kendaraan</TableHead>
                          <TableHead>Plat</TableHead>
                          <TableHead>Pelanggan</TableHead>
                          <TableHead>Tipe Sewa</TableHead>
                          <TableHead className="text-right">Antar Jemput</TableHead>
                          <TableHead className="text-right">Total Tagihan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partnerDetailedRows.map(({ booking, vehicle }: any) => (
                          <TableRow key={`partner-booking-${booking.id}`}>
                            <TableCell>{format(new Date(booking.startDate), "yyyy-MM-dd")}</TableCell>
                            <TableCell>{vehicle?.name ?? booking.vehicleName}</TableCell>
                            <TableCell className="font-mono text-xs">{vehicle?.plateNumber ?? booking.vehiclePlate}</TableCell>
                            <TableCell>{booking.customerName}</TableCell>
                            <TableCell>{booking.rentalType}</TableCell>
                            <TableCell className="text-right">{formatRupiah(booking.pickupDropoffFee ?? 0)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(booking.totalAmount)}</TableCell>
                          </TableRow>
                        ))}
                        {partnerDetailedRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">Tidak ada detail transaksi mitra pada periode ini</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Ringkasan Bagi Hasil</h3>
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Kendaraan</TableHead>
                          <TableHead>Mitra</TableHead>
                          <TableHead className="text-right">Pendapatan Kotor</TableHead>
                          <TableHead className="text-right">Biaya Operasional</TableHead>
                          <TableHead className="text-right">Pendapatan Bersih</TableHead>
                          <TableHead className="text-center">Persentase Mitra</TableHead>
                          <TableHead className="text-right font-semibold text-blue-700">Hak Mitra</TableHead>
                          <TableHead className="text-right font-semibold text-green-700">Hak Perusahaan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partnerItems.filter((item: any) => selectedPartner === "all" ? true : item.partnerName === selectedPartner).map((item: any) => (
                          <TableRow key={item.vehicleId}>
                            <TableCell>
                              <div className="font-medium">{item.vehicleName}</div>
                              <div className="text-xs text-slate-500 font-mono">{item.plateNumber}</div>
                            </TableCell>
                            <TableCell className="font-medium">{item.partnerName}</TableCell>
                            <TableCell className="text-right">{formatRupiah(item.totalRevenue)}</TableCell>
                            <TableCell className="text-right text-red-600">{item.operationalCost > 0 ? `-${formatRupiah(item.operationalCost)}` : "Rp 0"}</TableCell>
                            <TableCell className="text-right font-medium">{formatRupiah(item.netRevenue)}</TableCell>
                            <TableCell className="text-center font-medium">{item.profitSharePercent}%</TableCell>
                            <TableCell className="text-right font-bold text-blue-700">{formatRupiah(item.partnerShare)}</TableCell>
                            <TableCell className="text-right font-bold text-green-700">{formatRupiah(item.companyShare)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internal">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle>Laporan Mobil Internal</CardTitle>
              <CardDescription>Kinerja armada internal untuk operasional perusahaan tanpa skema bagi hasil mitra.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4 gap-3">
                <Button variant="outline" onClick={() => downloadCsv("laporan-mobil-internal.csv", [["Kendaraan", "Plat", "Reservasi", "Hari Disewa", "Utilisasi", "Pendapatan"], ...internalVehicleItems.map((item: any) => [item.vehicleName, item.plateNumber, item.totalBookings, item.utilizationDays, `${item.utilizationPercent}%`, item.totalRevenue])])}>Ekspor CSV Internal</Button>
                 <Button variant="outline" onClick={() => printHtml("Laporan Mobil Internal", `<table><thead><tr><th>Tanggal Sewa</th><th>Kendaraan</th><th>Plat</th><th>Pelanggan</th><th>Tipe Sewa</th><th>Antar Jemput</th><th>Total Tagihan</th></tr></thead><tbody>${internalDetailedRows.map(({ booking, vehicle }: any) => `<tr><td>${format(new Date(booking.startDate), 'yyyy-MM-dd')}</td><td>${vehicle?.name ?? booking.vehicleName}</td><td>${vehicle?.plateNumber ?? booking.vehiclePlate}</td><td>${booking.customerName}</td><td>${booking.rentalType}</td><td>${formatRupiah(booking.pickupDropoffFee ?? 0)}</td><td>${formatRupiah(booking.totalAmount)}</td></tr>`).join("")}</tbody></table><br/><table><thead><tr><th>Kendaraan</th><th>Plat</th><th>Reservasi</th><th>Hari Disewa</th><th>Utilisasi</th><th>Pendapatan</th></tr></thead><tbody>${internalVehicleItems.map((item: any) => `<tr><td>${item.vehicleName}</td><td>${item.plateNumber}</td><td>${item.totalBookings}</td><td>${item.utilizationDays} hari</td><td>${item.utilizationPercent}%</td><td>${formatRupiah(item.totalRevenue)}</td></tr>`).join("")}</tbody></table>`)}>Cetak Laporan Internal</Button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Detail Unit Internal Keluar</h3>
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Tanggal Sewa</TableHead>
                        <TableHead>Kendaraan</TableHead>
                        <TableHead>Plat Nomor</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Tipe Sewa</TableHead>
                        <TableHead className="text-right">Antar Jemput</TableHead>
                        <TableHead className="text-right">Total Tagihan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {internalDetailedRows.map(({ booking, vehicle }: any) => (
                        <TableRow key={`internal-booking-${booking.id}`}>
                          <TableCell>{format(new Date(booking.startDate), "yyyy-MM-dd")}</TableCell>
                          <TableCell className="font-medium">{vehicle?.name ?? booking.vehicleName}</TableCell>
                          <TableCell className="font-mono text-sm">{vehicle?.plateNumber ?? booking.vehiclePlate}</TableCell>
                          <TableCell>{booking.customerName}</TableCell>
                          <TableCell>{booking.rentalType}</TableCell>
                          <TableCell className="text-right">{formatRupiah(booking.pickupDropoffFee ?? 0)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatRupiah(booking.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                      {internalDetailedRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-500">Belum ada unit internal keluar pada periode ini</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Ringkasan Armada Internal</h3>
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Kendaraan</TableHead>
                        <TableHead>Plat Nomor</TableHead>
                        <TableHead className="text-center">Reservasi</TableHead>
                        <TableHead className="text-center">Hari Disewa</TableHead>
                        <TableHead className="text-center">Utilisasi</TableHead>
                        <TableHead className="text-right">Pendapatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {internalVehicleItems.map((item: any) => (
                        <TableRow key={item.vehicleId}>
                          <TableCell className="font-medium">{item.vehicleName}</TableCell>
                          <TableCell className="font-mono text-sm">{item.plateNumber}</TableCell>
                          <TableCell className="text-center">{item.totalBookings}</TableCell>
                          <TableCell className="text-center">{item.utilizationDays} hari</TableCell>
                          <TableCell className="text-center">{item.utilizationPercent}%</TableCell>
                          <TableCell className="text-right font-semibold">{formatRupiah(item.totalRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
