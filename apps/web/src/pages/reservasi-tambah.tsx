import { useCreateBooking, useListCustomers, useListVehicles, getListBookingsQueryKey, getListVehiclesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMemo } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/format";

const bookingSchema = z.object({
  customerId: z.coerce.number().min(1, "Pilih pelanggan"),
  vehicleId: z.coerce.number().min(1, "Pilih kendaraan"),
  rentalType: z.enum(["self_drive", "with_driver"]),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  pickupDropoffFee: z.coerce.number().min(0, "Biaya antar jemput tidak boleh negatif").default(0),
  notes: z.string().optional().nullable(),
});

export default function ReservasiTambah() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: customers, isLoading: isLoadingCustomers } = useListCustomers();
  const { data: vehicles, isLoading: isLoadingVehicles } = useListVehicles({ status: "available" });
  const customerItems = Array.isArray(customers)
    ? customers
    : Array.isArray((customers as any)?.items)
      ? (customers as any).items
      : [];
  const vehicleItems = Array.isArray(vehicles)
    ? vehicles
    : Array.isArray((vehicles as any)?.items)
      ? (vehicles as any).items
      : [];

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerId: 0,
      vehicleId: 0,
      rentalType: "self_drive",
      startDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      pickupDropoffFee: 0,
      notes: "",
    },
  });

  const selectedVehicleId = form.watch("vehicleId");
  const selectedStartDate = form.watch("startDate");
  const selectedEndDate = form.watch("endDate");
  const pickupDropoffFee = form.watch("pickupDropoffFee");

  const selectedVehicle = useMemo(
    () => vehicleItems.find((vehicle: any) => vehicle.id === selectedVehicleId),
    [vehicleItems, selectedVehicleId],
  );

  const rentalSummary = useMemo(() => {
    if (!selectedStartDate || !selectedEndDate) {
      return { totalDays: 0, baseAmount: 0, totalAmount: 0, invalid: false };
    }

    const start = new Date(selectedStartDate);
    const end = new Date(selectedEndDate);
    const diff = end.getTime() - start.getTime();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || diff < 0) {
      return { totalDays: 0, baseAmount: 0, totalAmount: 0, invalid: true };
    }

    const totalDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const baseAmount = (selectedVehicle?.dailyRate || 0) * totalDays;
    const totalAmount = baseAmount + (pickupDropoffFee || 0);

    return { totalDays, baseAmount, totalAmount, invalid: false };
  }, [selectedStartDate, selectedEndDate, selectedVehicle, pickupDropoffFee]);

  const createMutation = useCreateBooking({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
        toast({ title: "Reservasi berhasil dibuat" });
        setLocation(`/reservasi/${data.id}`);
      }
    }
  });

  const onSubmit = (values: z.infer<typeof bookingSchema>) => {
    createMutation.mutate({ 
      data: {
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
      } 
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reservasi"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Buat Reservasi Baru</h1>
          <p className="text-slate-500 mt-1">Jadwalkan penyewaan kendaraan, verifikasi pelanggan, dan siapkan invoice transaksi</p>
        </div>
      </div>

      <Card className="shadow-sm border-0 border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5 text-slate-400" /> Detail Penyewaan</CardTitle>
          <CardDescription>Pilih pelanggan, kendaraan, dan jadwal sewa. Hanya kendaraan berstatus "Tersedia" yang dapat dipilih. Dokumen pelanggan diverifikasi melalui data identitas pada profil pelanggan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Pelanggan</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingCustomers ? "Memuat pelanggan..." : "Pilih pelanggan"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customerItems.map((c: any) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name} — {c.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Kendaraan</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingVehicles ? "Memuat kendaraan..." : "Pilih kendaraan yang tersedia"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicleItems.map((v: any) => (
                            <SelectItem key={v.id} value={v.id.toString()}>
                              {v.name} ({v.plateNumber}) — {formatRupiah(v.dailyRate)}/hari
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rentalType"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tipe Layanan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe layanan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="self_drive">Lepas Kunci (Self Drive)</SelectItem>
                          <SelectItem value="with_driver">Dengan Supir (With Driver)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Pengambilan</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Pengembalian</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-1 md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Ringkasan Durasi Sewa</p>
                      <p className="text-xs text-blue-700 mt-1">Jumlah hari sewa dihitung otomatis dari waktu pengambilan sampai pengembalian.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">Durasi</p>
                      <p className="text-2xl font-bold text-blue-950">{rentalSummary.invalid ? "-" : `${rentalSummary.totalDays} hari`}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-white/80 border border-blue-100 p-3">
                      <p className="text-xs text-slate-500">Tarif Kendaraan</p>
                      <p className="font-semibold text-slate-900 mt-1">{selectedVehicle ? formatRupiah(selectedVehicle.dailyRate) : "Pilih kendaraan"}</p>
                    </div>
                    <div className="rounded-lg bg-white/80 border border-blue-100 p-3">
                      <p className="text-xs text-slate-500">Biaya Antar Jemput</p>
                      <p className="font-semibold text-slate-900 mt-1">{formatRupiah(pickupDropoffFee || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-white/80 border border-blue-100 p-3 md:col-span-2">
                      <p className="text-xs text-slate-500">Estimasi Biaya Sewa Dasar</p>
                      <p className="font-semibold text-slate-900 mt-1">{rentalSummary.invalid ? "Tanggal tidak valid" : formatRupiah(rentalSummary.baseAmount)}</p>
                      <p className="text-xs text-slate-500 mt-2">Total Estimasi + Antar Jemput</p>
                      <p className="font-semibold text-blue-700 mt-1">{rentalSummary.invalid ? "Tanggal tidak valid" : formatRupiah(rentalSummary.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="pickupDropoffFee"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Biaya Antar Jemput (Opsional)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="Contoh: 50000" {...field} />
                      </FormControl>
                      <p className="text-xs text-slate-500">Biaya ini akan otomatis ditambahkan ke total reservasi, invoice, dan laporan.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Keperluan sewa, tujuan, permintaan khusus, dll." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" asChild>
                  <Link href="/reservasi">Batal</Link>
                </Button>
                <Button type="submit" disabled={createMutation.isPending || !form.formState.isValid}>
                  {createMutation.isPending ? "Memproses..." : "Buat Reservasi"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
