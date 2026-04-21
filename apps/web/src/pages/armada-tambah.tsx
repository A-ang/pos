import { useMemo } from "react";
import { useCreateVehicle, getListVehiclesQueryKey } from "@workspace/api-client-react";
import { useListVehicles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Car } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const vehicleSchema = z.object({
  name: z.string().min(1, "Nama kendaraan wajib diisi"),
  plateNumber: z.string().min(1, "Plat nomor wajib diisi"),
  year: z.coerce.number().min(1900, "Tahun tidak valid"),
  color: z.string().min(1, "Warna wajib diisi"),
  ownership: z.enum(["internal", "external"]),
  status: z.enum(["available", "rented", "maintenance"]),
  partnerName: z.string().optional().nullable(),
  dailyRate: z.coerce.number().min(0, "Tarif harian tidak valid"),
  profitSharePercent: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export default function ArmadaTambah() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: vehicles } = useListVehicles({ ownership: "external" as any });
  const { data: partners = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const response = await fetch("/api/partners", { credentials: "include" });
      if (!response.ok) throw new Error("Gagal memuat partner");
      return response.json();
    },
  });

  const partnerOptions = useMemo(() => {
    const uniqueNames = Array.from(new Set((partners as any[]).map((partner) => partner.name).filter(Boolean))) as string[];

    return uniqueNames.length ? uniqueNames : Array.from(
      new Set((vehicles || []).map((vehicle) => vehicle.partnerName).filter(Boolean))
    ) as string[];
  }, [partners, vehicles]);

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      plateNumber: "",
      year: new Date().getFullYear(),
      color: "",
      ownership: "internal",
      status: "available",
      partnerName: "",
      dailyRate: 0,
      profitSharePercent: null,
      notes: "",
    },
  });

  const watchOwnership = form.watch("ownership");

  const createMutation = useCreateVehicle({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
        toast({ title: "Armada berhasil ditambahkan" });
        setLocation("/armada");
      }
    }
  });

  const onSubmit = (values: z.infer<typeof vehicleSchema>) => {
    createMutation.mutate({ 
      data: {
        ...values,
        partnerName: values.ownership === 'external' ? values.partnerName : null,
        profitSharePercent: values.ownership === 'external' ? values.profitSharePercent : null,
      } 
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/armada"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tambah Armada</h1>
          <p className="text-slate-500 mt-1">Registrasi unit baru dengan opsi kepemilikan internal atau mitra eksternal</p>
        </div>
      </div>

      <Card className="shadow-sm border-0 border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Car className="h-5 w-5 text-slate-400" /> Informasi Kendaraan</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Kendaraan / Merk</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Toyota Avanza 1.5 G" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plat Nomor</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: B 1234 CD" className="uppercase font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun Kendaraan</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warna</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Hitam Metalik" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dailyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarif Sewa Harian (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Contoh: 350000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Awal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Tersedia (Siap Sewa)</SelectItem>
                          <SelectItem value="maintenance">Maintenance (Perbaikan)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Informasi Kepemilikan</h3>
                </div>

                <FormField
                  control={form.control}
                  name="ownership"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Kepemilikan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kepemilikan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internal">Internal (Milik Sendiri)</SelectItem>
                          <SelectItem value="external">Eksternal (Mitra Titipan)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchOwnership === "external" && (
                  <>
                    <FormField
                      control={form.control}
                      name="partnerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Mitra</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={partnerOptions.length ? "Pilih mitra terdaftar" : "Belum ada mitra terdaftar"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {partnerOptions.map((partnerName) => (
                                <SelectItem key={partnerName} value={partnerName}>{partnerName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {partnerOptions.length === 0 && (
                            <p className="text-xs text-slate-500">Daftar mitra diambil dari unit eksternal yang sudah terhubung pada sistem.</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="profitSharePercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Persentase Bagi Hasil (Untuk Mitra %)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Contoh: 70" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Catatan kondisi awal, kelengkapan, dll." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" asChild>
                  <Link href="/armada">Batal</Link>
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Menyimpan..." : "Simpan Armada"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
