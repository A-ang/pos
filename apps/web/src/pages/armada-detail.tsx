import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetVehicle, useListMaintenanceLogs, useListBookings, getGetVehicleQueryKey, getListMaintenanceLogsQueryKey, getListBookingsQueryKey, useUpdateVehicle, getListVehiclesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { formatRupiah, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, Calendar, Settings, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Ownership = "internal" | "external";
type VehicleStatus = "available" | "rented" | "maintenance";

export default function ArmadaDetail() {
  const { id } = useParams();
  const vehicleId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    plateNumber: string;
    year: number;
    color: string;
    dailyRate: number;
    ownership: Ownership;
    status: VehicleStatus;
    partnerName: string;
    profitSharePercent: number | "";
    notes: string;
  }>({
    name: "",
    plateNumber: "",
    year: new Date().getFullYear(),
    color: "",
    dailyRate: 0,
    ownership: "internal",
    status: "available",
    partnerName: "",
    profitSharePercent: "",
    notes: "",
  });

  const { data: vehicle, isLoading: isLoadingVehicle } = useGetVehicle(vehicleId, {
    query: { enabled: !!vehicleId, queryKey: getGetVehicleQueryKey(vehicleId) }
  });

  const { data: maintenanceLogs, isLoading: isLoadingMaintenance } = useListMaintenanceLogs(vehicleId, {
    query: { enabled: !!vehicleId, queryKey: getListMaintenanceLogsQueryKey(vehicleId) }
  });

  const { data: bookings, isLoading: isLoadingBookings } = useListBookings(
    { vehicleId },
    { query: { enabled: !!vehicleId, queryKey: getListBookingsQueryKey({ vehicleId }) } }
  );
  useEffect(() => {
    if (!vehicle) return;
    setForm({
      name: vehicle.name,
      plateNumber: vehicle.plateNumber,
      year: vehicle.year,
      color: vehicle.color,
      dailyRate: vehicle.dailyRate,
      ownership: vehicle.ownership as Ownership,
      status: vehicle.status as VehicleStatus,
      partnerName: vehicle.partnerName || "",
      profitSharePercent: vehicle.profitSharePercent ?? "",
      notes: vehicle.notes || "",
    });
  }, [vehicle]);

  const updateMutation = useUpdateVehicle({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetVehicleQueryKey(vehicleId), data);
        queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
        toast({ title: "Armada berhasil diperbarui" });
        setOpen(false);
      },
    },
  });

  if (isLoadingVehicle) {
    return <div className="p-8 text-slate-500">Memuat data kendaraan...</div>;
  }

  if (!vehicle) {
    return <div className="p-8 text-slate-500">Kendaraan tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/armada"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              {vehicle.name}
              <StatusBadge status={vehicle.status} className="text-sm" />
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">{vehicle.plateNumber}</span>
              • {vehicle.year} • {vehicle.color}
            </p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)}>Edit Armada</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Armada</DialogTitle>
            <DialogDescription>Perbarui informasi kendaraan, kepemilikan, dan tarif sewa.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nama Kendaraan</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>Plat Nomor</Label>
              <Input value={form.plateNumber} onChange={(e) => setForm((prev) => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <Label>Tahun</Label>
              <Input type="number" value={form.year} onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) || new Date().getFullYear() }))} />
            </div>
            <div>
              <Label>Warna</Label>
              <Input value={form.color} onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))} />
            </div>
            <div>
              <Label>Tarif Harian</Label>
              <Input type="number" value={form.dailyRate} onChange={(e) => setForm((prev) => ({ ...prev, dailyRate: Number(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as VehicleStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Tersedia</SelectItem>
                  <SelectItem value="rented">Disewa</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kepemilikan</Label>
              <Select value={form.ownership} onValueChange={(value) => setForm((prev) => ({ ...prev, ownership: value as Ownership, partnerName: value === "external" ? prev.partnerName : "", profitSharePercent: value === "external" ? prev.profitSharePercent : "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">Eksternal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.ownership === "external" && (
              <>
                <div>
                  <Label>Nama Mitra</Label>
                  <Input value={form.partnerName} onChange={(e) => setForm((prev) => ({ ...prev, partnerName: e.target.value }))} placeholder="Masukkan nama mitra" />
                </div>
                <div>
                  <Label>Bagi Hasil Mitra (%)</Label>
                  <Input type="number" value={form.profitSharePercent} onChange={(e) => setForm((prev) => ({ ...prev, profitSharePercent: e.target.value === "" ? "" : Number(e.target.value) }))} />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <Label>Catatan</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button
              onClick={() => updateMutation.mutate({
                id: vehicleId,
                data: {
                  name: form.name,
                  plateNumber: form.plateNumber,
                  year: form.year,
                  color: form.color,
                  dailyRate: form.dailyRate,
                  status: form.status,
                  ownership: form.ownership,
                  partnerName: form.ownership === "external" ? (form.partnerName || null) : null,
                  profitSharePercent: form.ownership === "external" && form.profitSharePercent !== "" ? Number(form.profitSharePercent) : null,
                  notes: form.notes || null,
                },
              })}
              disabled={updateMutation.isPending || !form.name || !form.plateNumber || !form.color}
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="info" className="data-[state=active]:bg-white">Informasi Umum</TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-white">Riwayat Maintenance</TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-white">Riwayat Sewa</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Car className="h-5 w-5 text-slate-400" /> Detail Kendaraan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Nama Kendaraan</p>
                    <p className="text-slate-900 font-medium">{vehicle.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Plat Nomor</p>
                    <p className="text-slate-900 font-medium font-mono">{vehicle.plateNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Tahun</p>
                    <p className="text-slate-900">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Warna</p>
                    <p className="text-slate-900">{vehicle.color}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Tarif Sewa Harian</p>
                    <p className="text-slate-900 font-semibold">{formatRupiah(vehicle.dailyRate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Status</p>
                    <div className="mt-1"><StatusBadge status={vehicle.status} /></div>
                  </div>
                </div>
                {vehicle.notes && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Catatan</p>
                    <p className="text-slate-700 text-sm mt-1 whitespace-pre-wrap">{vehicle.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-slate-400" /> Kepemilikan & Mitra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Tipe Kepemilikan</p>
                    <div className="mt-1"><StatusBadge status={vehicle.ownership} /></div>
                  </div>
                  
                  {vehicle.ownership === "external" && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Nama Mitra</p>
                        <p className="text-slate-900 font-medium">{vehicle.partnerName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Bagi Hasil (Mitra)</p>
                        <p className="text-slate-900 font-semibold">{vehicle.profitSharePercent}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Bagi Hasil (Perusahaan)</p>
                        <p className="text-slate-900 font-semibold">{100 - (vehicle.profitSharePercent || 0)}%</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="maintenance" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5 text-slate-400" /> Riwayat Maintenance</CardTitle>
                <CardDescription>Log perawatan, servis, dan perpanjangan pajak</CardDescription>
              </div>
              <Button size="sm" variant="outline">Tambah Catatan</Button>
            </CardHeader>
            <CardContent>
              {isLoadingMaintenance ? (
                <div className="text-center py-4 text-slate-500">Memuat data maintenance...</div>
              ) : maintenanceLogs?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                  <CheckCircle2 className="h-8 w-8 text-slate-300 mb-2" />
                  <p>Belum ada catatan maintenance untuk kendaraan ini</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Biaya</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{formatDate(log.createdAt)}</TableCell>
                        <TableCell className="capitalize">{log.type.replace('_', ' ')}</TableCell>
                        <TableCell>{log.description}</TableCell>
                        <TableCell>{formatRupiah(log.cost)}</TableCell>
                        <TableCell>
                          {log.completedAt ? (
                            <span className="text-green-600 flex items-center text-sm font-medium"><CheckCircle2 className="w-4 h-4 mr-1"/> Selesai</span>
                          ) : (
                            <span className="text-orange-600 flex items-center text-sm font-medium"><AlertCircle className="w-4 h-4 mr-1"/> Tertunda {log.dueDate && `(Batas: ${formatDate(log.dueDate)})`}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-slate-400" /> Riwayat Penyewaan</CardTitle>
              <CardDescription>Daftar reservasi untuk kendaraan ini</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="text-center py-4 text-slate-500">Memuat data penyewaan...</div>
              ) : bookings?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                  <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                  <p>Belum ada riwayat penyewaan untuk kendaraan ini</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>ID Reservasi</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Tanggal Sewa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total Biaya</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-slate-600">#{booking.id}</TableCell>
                        <TableCell className="font-medium text-slate-900">
                          <Link href={`/pelanggan/${booking.customerId}`} className="hover:underline">{booking.customerName}</Link>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(booking.startDate, true)}</div>
                            <div className="text-slate-500">{formatDate(booking.endDate, true)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status} />
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(booking.totalAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/reservasi/${booking.id}`}>Detail</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
