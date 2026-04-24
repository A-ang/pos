import { useMemo, useState } from "react";
import { useListVehicles } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Car, CreditCard, Landmark, Phone, UsersRound } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Mitra() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", address: "", bankAccount: "", notes: "" });
  const { data: vehicles, isLoading } = useListVehicles({ ownership: "external" as any });
  const { data: partners = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const response = await fetch("/api/partners", { credentials: "include" });
      if (!response.ok) throw new Error("Gagal memuat mitra");
      return response.json();
    },
  });

  const createPartner = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/partners", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Gagal menyimpan mitra");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Mitra berhasil ditambahkan" });
      setOpen(false);
      setForm({ name: "", contact: "", address: "", bankAccount: "", notes: "" });
    },
  });
  const vehicleItems = Array.isArray(vehicles)
    ? vehicles
    : Array.isArray((vehicles as any)?.items)
      ? (vehicles as any).items
      : [];

  const partnerSummary = useMemo(() => {
    type PartnerAggregate = {
      name: string;
      unitCount: number;
      avgShare: number;
      potentialRevenue: number;
      plates: string[];
    };
    const grouped = new Map<string, PartnerAggregate>();

    (partners as any[]).forEach((partner) => {
      grouped.set(partner.name, {
        name: partner.name,
        unitCount: 0,
        avgShare: 0,
        potentialRevenue: 0,
        plates: [],
      });
    });

    vehicleItems.forEach((vehicle: any) => {
      const partnerName = vehicle.partnerName || "Mitra Belum Diisi";
      const current: PartnerAggregate = grouped.get(partnerName) || {
        name: partnerName,
        unitCount: 0,
        avgShare: 0,
        potentialRevenue: 0,
        plates: [],
      };

      current.unitCount += 1;
      current.potentialRevenue += vehicle.dailyRate;
      current.avgShare += vehicle.profitSharePercent || 0;
      current.plates.push(vehicle.plateNumber);

      grouped.set(partnerName, current);
    });

    return Array.from(grouped.values()).map((item: PartnerAggregate) => ({
      ...item,
      avgShare: item.unitCount ? Math.round(item.avgShare / item.unitCount) : 0,
    }));
  }, [vehicleItems, partners]);

  const partnerDirectory = useMemo(() => {
    return partnerSummary.map((partner) => {
      const matchedPartner = (partners as any[]).find((item) => item.name === partner.name);
      return {
        ...partner,
        id: matchedPartner?.id,
        active: matchedPartner?.active ?? true,
        contact: matchedPartner?.contact || "-",
        address: matchedPartner?.address || "-",
        bankAccount: matchedPartner?.bankAccount || "-",
        notes: matchedPartner?.notes || null,
      };
    });
  }, [partnerSummary, partners]);

  const totalUnits = vehicleItems.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Mitra Eksternal</h1>
          <p className="text-slate-500 mt-1">Ringkasan mitra pemilik unit titipan, pembagian hasil, dan unit yang terhubung.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs">UI menyesuaikan PRD V2</Badge>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Tambah Mitra</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Mitra Eksternal</DialogTitle>
                <DialogDescription>Masukkan data pemilik unit eksternal untuk kebutuhan titipan dan bagi hasil.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nama Mitra</Label>
                  <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Kontak</Label>
                  <Input value={form.contact} onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))} />
                </div>
                <div>
                  <Label>Alamat</Label>
                  <Textarea value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
                <div>
                  <Label>Rekening Bank</Label>
                  <Input value={form.bankAccount} onChange={(e) => setForm((prev) => ({ ...prev, bankAccount: e.target.value }))} />
                </div>
                <div>
                  <Label>Catatan</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button onClick={() => createPartner.mutate()} disabled={createPartner.isPending || !form.name || !form.contact}>Simpan Mitra</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardContent className="p-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Core Feature A</p>
            <h2 className="text-2xl font-bold mt-2">Database Mitra & Integrasi Armada</h2>
            <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-6">
              Halaman ini disiapkan untuk input dan monitoring data pemilik unit eksternal: nama mitra, kontak,
              alamat, rekening bank, serta koneksi langsung ke unit armada titipan untuk proses bagi hasil.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Phone className="h-4 w-4 text-blue-300" /> Kontak Mitra</div>
              <p className="text-xs text-slate-300 mt-2">Siap untuk nomor telepon/WhatsApp PIC pemilik unit.</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Landmark className="h-4 w-4 text-emerald-300" /> Rekening Bank</div>
              <p className="text-xs text-slate-300 mt-2">Untuk transparansi pembayaran hak mitra per periode laporan.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Mitra</p>
              <p className="text-2xl font-bold text-slate-900">{partnerSummary.length}</p>
            </div>
            <UsersRound className="h-9 w-9 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Unit Titipan</p>
              <p className="text-2xl font-bold text-slate-900">{totalUnits}</p>
            </div>
            <Car className="h-9 w-9 text-emerald-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Rata-rata Share Mitra</p>
              <p className="text-2xl font-bold text-slate-900">
                {partnerSummary.length ? Math.round(partnerSummary.reduce((a, b) => a + b.avgShare, 0) / partnerSummary.length) : 0}%
              </p>
            </div>
            <CreditCard className="h-9 w-9 text-orange-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Potensi Revenue/Hari</p>
              <p className="text-2xl font-bold text-slate-900">{formatRupiah(partnerSummary.reduce((a, b) => a + b.potentialRevenue, 0))}</p>
            </div>
            <Building2 className="h-9 w-9 text-violet-500" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Database Mitra</CardTitle>
          <CardDescription>Draft UI untuk data nama, kontak, alamat, rekening bank, dan integrasi unit mitra sesuai PRD.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Nama Mitra</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Rekening Bank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jumlah Unit</TableHead>
                <TableHead>Rata-rata Bagi Hasil</TableHead>
                <TableHead>Integrasi Armada</TableHead>
                <TableHead className="text-right">Potensi Tarif / Hari</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-slate-500">Memuat data mitra...</TableCell>
                </TableRow>
              ) : partnerDirectory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-slate-500">Belum ada data mitra.</TableCell>
                </TableRow>
              ) : (
                partnerDirectory.map((partner) => (
                  <TableRow key={partner.name}>
                    <TableCell className="font-medium text-slate-900">{partner.name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{partner.contact}</TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-[220px]">{partner.address}</TableCell>
                    <TableCell className="text-sm text-slate-600">{partner.bankAccount}</TableCell>
                     <TableCell>
                       <Badge variant={partner.active ? "default" : "secondary"} className={partner.active ? "bg-green-600" : ""}>{partner.active ? "Aktif" : "Nonaktif"}</Badge>
                     </TableCell>
                    <TableCell>{partner.unitCount} unit</TableCell>
                    <TableCell>{partner.avgShare}%</TableCell>
                    <TableCell className="text-sm text-slate-600">{partner.plates.join(", ")}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(partner.potentialRevenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}