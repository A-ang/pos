import { useParams, Link } from "wouter";
import { useGetBooking, useCheckinBooking, useCheckoutBooking, useGetTransaction, getListBookingsQueryKey, getListVehiclesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatRupiah, formatDate, calculateRentalDays, formatDateTimeWIB } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Car, User, Calendar, Receipt, LogIn, LogOut, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetBookingQueryKey } from "@workspace/api-client-react";

export default function ReservasiDetail() {
  const { id } = useParams();
  const bookingId = parseInt(id || "0");
  const queryClient = useQueryClient();

  const [startKm, setStartKm] = useState("");
  const [startFuelBar, setStartFuelBar] = useState("0");
  const [estimatedKm, setEstimatedKm] = useState("0");
  const [endKm, setEndKm] = useState("");
  const [lateFee, setLateFee] = useState("0");
  const [damageFee, setDamageFee] = useState("0");
  const [washFee, setWashFee] = useState("0");

  const { data: booking, isLoading: isLoadingBooking } = useGetBooking(bookingId, {
    query: { enabled: !!bookingId, queryKey: getGetBookingQueryKey(bookingId) }
  });

  const rentalDays = calculateRentalDays(booking?.startDate, booking?.endDate);

  const checkinMutation = useCheckinBooking({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetBookingQueryKey(bookingId), data);
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
      }
    }
  });

  const checkoutMutation = useCheckoutBooking({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetBookingQueryKey(bookingId), data);
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
      }
    }
  });

  if (isLoadingBooking) {
    return <div className="p-8 text-slate-500">Memuat detail reservasi...</div>;
  }

  if (!booking) {
    return <div className="p-8 text-slate-500">Reservasi tidak ditemukan.</div>;
  }

  const bookingWithPickup = booking as typeof booking & { pickupDropoffFee?: number | null };

  const handleCheckin = () => {
    checkinMutation.mutate({ id: bookingId, data: { startKm: parseInt(startKm) || 0, startFuelBar: parseInt(startFuelBar) || 0, estimatedKm: parseInt(estimatedKm) || 0 } as any });
  };

  const handleCheckout = () => {
    checkoutMutation.mutate({ 
      id: bookingId, 
      data: { 
        endKm: parseInt(endKm) || 0,
        lateFee: parseInt(lateFee) || 0,
        damageFee: parseInt(damageFee) || 0,
        washFee: parseInt(washFee) || 0
      } 
    });
  };

  const isCheckinReady = booking.status === 'pending';
  const isCheckoutReady = booking.status === 'active';

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reservasi"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Reservasi #{booking.id}
              </h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
              Dibuat pada {formatDate(booking.createdAt, true)}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/transaksi?search=${booking.id}`}>Lihat Invoice Pelanggan</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-slate-400" /> Detail Penyewaan</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Tanggal Pengambilan</p>
                  <div className="text-base font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {formatDateTimeWIB(booking.startDate)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Tanggal Pengembalian</p>
                  <div className="text-base font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {formatDateTimeWIB(booking.endDate)}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800 mb-3">Jadwal Sewa</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-white border border-slate-200 p-3">
                    <p className="text-slate-500">Waktu Pengambilan</p>
                    <p className="font-semibold text-slate-900 mt-1">{formatDateTimeWIB(booking.startDate)}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-3">
                    <p className="text-slate-500">Waktu Pengembalian</p>
                    <p className="font-semibold text-slate-900 mt-1">{formatDateTimeWIB(booking.endDate)}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-3">
                    <p className="text-slate-500">Total Durasi</p>
                    <p className="font-semibold text-slate-900 mt-1">{rentalDays} Hari</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="flex items-start gap-3">
                  <User className="h-10 w-10 text-blue-500 bg-blue-50 p-2 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pelanggan</p>
                    <p className="text-base font-medium text-slate-900">
                      <Link href={`/pelanggan/${booking.customerId}`} className="hover:text-blue-600 hover:underline">{booking.customerName}</Link>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="h-10 w-10 text-orange-500 bg-orange-50 p-2 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Kendaraan</p>
                    <p className="text-base font-medium text-slate-900">
                      <Link href={`/armada/${booking.vehicleId}`} className="hover:text-blue-600 hover:underline">{booking.vehicleName}</Link>
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{booking.vehiclePlate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5 text-slate-400" /> Rincian Biaya</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Biaya Sewa Dasar</span>
                  <span className="font-medium text-slate-900">{formatRupiah(booking.baseAmount)}</span>
                </div>
                {!!bookingWithPickup.pickupDropoffFee && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Biaya Antar Jemput</span>
                    <span className="font-medium text-slate-900">+{formatRupiah(bookingWithPickup.pickupDropoffFee)}</span>
                  </div>
                )}
                
                {(booking.lateFee || booking.damageFee || booking.washFee || booking.otherFee) ? (
                  <>
                    <div className="w-full h-px bg-slate-100 my-2"></div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Biaya Tambahan</div>
                    {booking.lateFee ? (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-red-600">Denda Keterlambatan</span>
                        <span className="font-medium text-red-700">+{formatRupiah(booking.lateFee)}</span>
                      </div>
                    ) : null}
                    {booking.damageFee ? (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-red-600">Biaya Kerusakan</span>
                        <span className="font-medium text-red-700">+{formatRupiah(booking.damageFee)}</span>
                      </div>
                    ) : null}
                    {booking.washFee ? (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-orange-600">Biaya Cuci</span>
                        <span className="font-medium text-orange-700">+{formatRupiah(booking.washFee)}</span>
                      </div>
                    ) : null}
                    {booking.otherFee ? (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Biaya Lainnya</span>
                        <span className="font-medium text-slate-900">+{formatRupiah(booking.otherFee)}</span>
                      </div>
                    ) : null}
                  </>
                ) : null}
                
                <div className="w-full h-px bg-slate-200 mt-4 mb-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-900">Total Keseluruhan</span>
                  <span className="text-xl font-bold text-blue-600">{formatRupiah(booking.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-t-4 border-t-indigo-500 bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Operasional</CardTitle>
              <CardDescription className="text-slate-300">Proses check-in/check-out kendaraan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {booking.status === 'completed' && (
                <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-2 border border-slate-700">
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                  <p className="font-medium text-slate-200">Reservasi Selesai</p>
                  <div className="grid grid-cols-2 w-full text-sm mt-4 pt-4 border-t border-slate-700 gap-4 text-left">
                    <div>
                      <p className="text-slate-400 text-xs">KM Keluar</p>
                      <p className="font-mono text-slate-200">{booking.startKm} km</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">KM Masuk</p>
                      <p className="font-mono text-slate-200">{booking.endKm} km</p>
                    </div>
                  </div>
                </div>
              )}

              {isCheckinReady && (
                <div className="space-y-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 text-indigo-400 font-medium mb-2">
                    <LogOut className="h-4 w-4" /> Proses Check-in (Keluar)
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Kilometer Awal (Odometer)</Label>
                    <Input 
                      type="number" 
                      placeholder="Contoh: 45000" 
                      value={startKm} 
                      onChange={(e) => setStartKm(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Bensin Saat Keluar (bar)</Label>
                      <Input type="number" min="0" max="8" value={startFuelBar} onChange={(e) => setStartFuelBar(e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Estimasi KM Pemakaian</Label>
                      <Input type="number" min="0" value={estimatedKm} onChange={(e) => setEstimatedKm(e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700" 
                    onClick={handleCheckin}
                    disabled={!startKm || checkinMutation.isPending}
                  >
                    {checkinMutation.isPending ? "Memproses..." : "Konfirmasi Kendaraan Keluar"}
                  </Button>
                </div>
              )}

              {isCheckoutReady && (
                <div className="space-y-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-teal-400 font-medium">
                      <LogIn className="h-4 w-4" /> Proses Check-out (Masuk)
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-900/50 p-3 rounded-md mb-4">
                    <div>
                      <p className="text-slate-400 text-xs">KM Keluar</p>
                      <p className="font-mono text-slate-200">{booking.startKm} km</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Bensin Keluar</p>
                      <p className="font-mono text-slate-200">{(booking as any).startFuelBar ?? 0} bar</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Estimasi KM</p>
                      <p className="font-mono text-slate-200">{(booking as any).estimatedKm ?? 0} km</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Kilometer Akhir</Label>
                      <Input 
                        type="number" 
                        value={endKm} 
                        onChange={(e) => setEndKm(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    
                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-xs font-semibold text-slate-400 mb-3">BIAYA TAMBAHAN (OPSIONAL)</p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3 items-center">
                          <Label className="text-slate-300 text-xs col-span-1">Denda Waktu</Label>
                          <Input 
                            type="number" 
                            value={lateFee} 
                            onChange={(e) => setLateFee(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white h-8 col-span-2"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3 items-center">
                          <Label className="text-slate-300 text-xs col-span-1">Denda Rusak</Label>
                          <Input 
                            type="number" 
                            value={damageFee} 
                            onChange={(e) => setDamageFee(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white h-8 col-span-2"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3 items-center">
                          <Label className="text-slate-300 text-xs col-span-1">Biaya Cuci</Label>
                          <Input 
                            type="number" 
                            value={washFee} 
                            onChange={(e) => setWashFee(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white h-8 col-span-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-4" 
                    onClick={handleCheckout}
                    disabled={!endKm || checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? "Memproses..." : "Konfirmasi Pengembalian"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
