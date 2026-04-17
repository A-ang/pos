import { useState } from "react";
import { useListVehicles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatRupiah } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Armada() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownershipFilter, setOwnershipFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: vehicles, isLoading } = useListVehicles({
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    ownership: ownershipFilter !== "all" ? (ownershipFilter as any) : undefined,
  });

  const filteredVehicles = vehicles?.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.plateNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Armada Kendaraan</h1>
          <p className="text-slate-500 mt-1">Kelola inventaris unit, status operasional, dan kepemilikan internal/eksternal</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/armada/tambah">
            <Plus className="h-4 w-4" />
            Tambah Armada
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama atau plat nomor..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="available">Tersedia</SelectItem>
                <SelectItem value="rented">Disewa</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50">
                <SelectValue placeholder="Semua Kepemilikan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kepemilikan</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">Eksternal (Mitra)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="w-[300px] font-semibold text-slate-700">Kendaraan</TableHead>
              <TableHead className="font-semibold text-slate-700">Plat Nomor</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Kepemilikan</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Tarif Harian</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">Memuat data armada...</TableCell>
              </TableRow>
            ) : filteredVehicles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Car className="h-8 w-8 mb-2 opacity-20" />
                    <p>Tidak ada kendaraan yang ditemukan</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles?.map((vehicle) => (
                <TableRow key={vehicle.id} className="group hover:bg-slate-50/50 cursor-pointer">
                  <TableCell>
                    <div className="font-medium text-slate-900">{vehicle.name}</div>
                    <div className="text-xs text-slate-500">{vehicle.year} • {vehicle.color}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {vehicle.plateNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={vehicle.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={vehicle.ownership} />
                    {vehicle.ownership === "external" && vehicle.partnerName && (
                      <div className="text-xs text-slate-500 mt-1">{vehicle.partnerName} ({vehicle.profitSharePercent}%)</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-700">
                    {formatRupiah(vehicle.dailyRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/armada/${vehicle.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
