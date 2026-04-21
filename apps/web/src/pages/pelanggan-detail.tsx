import { useParams, Link } from "wouter";
import { useGetCustomer, useListBookings, getGetCustomerQueryKey, getListBookingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatRupiah, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, MapPin, Phone, Mail, CreditCard } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PelangganDetail() {
  const { id } = useParams();
  const customerId = parseInt(id || "0");

  const { data: customer, isLoading: isLoadingCustomer } = useGetCustomer(customerId, {
    query: { enabled: !!customerId, queryKey: getGetCustomerQueryKey(customerId) }
  });

  const { data: bookings, isLoading: isLoadingBookings } = useListBookings(undefined, {
    query: { enabled: !!customerId, queryKey: getListBookingsQueryKey() }
  });
  const bookingItems = Array.isArray(bookings)
    ? bookings
    : Array.isArray((bookings as any)?.items)
      ? (bookings as any).items
      : [];

  if (isLoadingCustomer) {
    return <div className="p-8 text-slate-500">Memuat data pelanggan...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-slate-500">Pelanggan tidak ditemukan.</div>;
  }

  const customerBookings = bookingItems.filter((b: any) => b.customerId === customerId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pelanggan"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {customer.name}
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
              Bergabung sejak {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <Button>Edit Pelanggan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm md:col-span-1 border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-slate-400" /> Profil Pelanggan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Nomor HP</p>
                  <p className="text-sm font-medium text-slate-900">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-900">{customer.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Identitas (<span className="uppercase">{customer.idType}</span>)</p>
                  <p className="text-sm font-medium font-mono text-slate-900">{customer.idNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Alamat Lengkap</p>
                  <p className="text-sm font-medium text-slate-900 leading-relaxed">{customer.address || "-"}</p>
                </div>
              </div>
            </div>

            {customer.notes && (
              <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200">
                <p className="font-semibold mb-1 text-xs">Catatan Internal:</p>
                {customer.notes}
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <p className="text-sm font-medium text-slate-500">Total Transaksi Selesai</p>
              <Badge variant="secondary" className="text-lg px-3">{customer.totalBookings}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-slate-400" /> Riwayat Penyewaan</CardTitle>
            <CardDescription>Semua reservasi oleh {customer.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBookings ? (
              <div className="text-center py-4 text-slate-500">Memuat riwayat...</div>
            ) : customerBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                <Calendar className="h-8 w-8 text-slate-300 mb-3" />
                <p>Belum ada riwayat penyewaan</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/reservasi/tambah">Buat Reservasi Baru</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Kendaraan</TableHead>
                    <TableHead>Periode Sewa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Biaya</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerBookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          <Link href={`/armada/${booking.vehicleId}`} className="hover:underline">{booking.vehicleName}</Link>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{booking.vehiclePlate}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(booking.startDate, true)}</div>
                          <div className="text-slate-500 text-xs">sd {formatDate(booking.endDate, true)}</div>
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
      </div>
    </div>
  );
}
