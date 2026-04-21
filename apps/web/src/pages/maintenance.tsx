import { useListVehicles, useListMaintenanceLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, CheckCircle2, AlertCircle } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Link } from "wouter";

export default function Maintenance() {
  const { data: vehicles, isLoading: isLoadingVehicles } = useListVehicles();
  const vehicleItems = Array.isArray(vehicles)
    ? vehicles
    : Array.isArray((vehicles as any)?.items)
      ? (vehicles as any).items
      : [];
  
  const vehiclesInMaintenance = vehicleItems.filter((v: any) => v.status === 'maintenance');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Maintenance Armada</h1>
          <p className="text-slate-500 mt-1">Pantau kendaraan yang sedang dalam perbaikan dan kebutuhan servis berkala</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-sm border-0 border-t-4 border-t-orange-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" /> 
              Kendaraan Dalam Status Maintenance
            </CardTitle>
            <CardDescription>Kendaraan yang saat ini tidak dapat disewa karena dalam perbaikan atau perawatan</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 py-4">Kendaraan</TableHead>
                  <TableHead>Plat Nomor</TableHead>
                  <TableHead>Kepemilikan</TableHead>
                  <TableHead className="text-right px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingVehicles ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">Memuat data armada...</TableCell>
                  </TableRow>
                ) : vehiclesInMaintenance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <CheckCircle2 className="h-8 w-8 mb-2 text-green-500 opacity-50" />
                        <p>Tidak ada kendaraan yang sedang maintenance.</p>
                        <p className="text-sm mt-1">Semua armada siap beroperasi.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  vehiclesInMaintenance.map((vehicle: any) => (
                    <TableRow key={vehicle.id} className="hover:bg-slate-50">
                      <TableCell className="px-6 font-medium text-slate-900">
                        <Link href={`/armada/${vehicle.id}`} className="hover:underline">{vehicle.name}</Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm text-slate-700 border border-slate-200">{vehicle.plateNumber}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={vehicle.ownership} />
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Link href={`/armada/${vehicle.id}`} className="text-sm text-blue-600 font-medium hover:underline">
                          Lihat Detail & Riwayat
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 mt-6 bg-slate-50 border border-slate-200">
          <CardContent className="p-6 text-center text-slate-500">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-slate-400" />
            <p className="font-medium text-slate-700">Notifikasi Jadwal Maintenance Berkala</p>
            <p className="text-sm mt-1 max-w-md mx-auto">
              UI ini disiapkan untuk kebutuhan PRD notifikasi servis berkala. Untuk melihat seluruh riwayat perbaikan spesifik, silakan buka halaman detail pada masing-masing kendaraan di menu <Link href="/armada" className="text-blue-600 hover:underline">Armada</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
