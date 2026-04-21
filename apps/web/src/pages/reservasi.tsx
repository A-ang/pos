import { useState } from "react";
import { useListBookings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Reservasi() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: bookings, isLoading } = useListBookings({
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
  });
  const bookingItems = Array.isArray(bookings)
    ? bookings
    : Array.isArray((bookings as any)?.items)
      ? (bookings as any).items
      : [];

  const filteredBookings = bookingItems.filter((b: any) => 
    b.customerName.toLowerCase().includes(search.toLowerCase()) || 
    b.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
    b.id.toString().includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reservasi</h1>
          <p className="text-slate-500 mt-1">Kelola jadwal penyewaan kendaraan</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/reservasi/tambah">
            <Plus className="h-4 w-4" />
            Buat Reservasi
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari ID, nama pelanggan, atau kendaraan..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-slate-50">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="active">Aktif (Sedang Disewa)</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="font-semibold text-slate-700 w-[100px]">ID</TableHead>
              <TableHead className="font-semibold text-slate-700">Pelanggan</TableHead>
              <TableHead className="font-semibold text-slate-700">Kendaraan</TableHead>
              <TableHead className="font-semibold text-slate-700">Jadwal Sewa</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">Memuat data reservasi...</TableCell>
              </TableRow>
            ) : filteredBookings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <CalendarDays className="h-8 w-8 mb-2 opacity-20" />
                    <p>Tidak ada reservasi yang ditemukan</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings?.map((booking: any) => (
                <TableRow key={booking.id} className="group hover:bg-slate-50/50">
                  <TableCell className="font-mono text-slate-600 font-medium">#{booking.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{booking.customerName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{booking.vehicleName}</div>
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                      <span className="bg-slate-100 px-1 rounded">{booking.vehiclePlate}</span>
                      {booking.rentalType === 'with_driver' && <Badge variant="outline" className="text-[10px] h-4">+Sopir</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatDate(booking.startDate, true)}</div>
                      <div className="text-slate-500 text-xs mt-0.5">sd {formatDate(booking.endDate, true)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/reservasi/${booking.id}`}>Kelola</Link>
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
