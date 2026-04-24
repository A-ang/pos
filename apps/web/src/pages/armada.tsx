import { useMemo, useState } from "react";
import { useListVehicles, useListBookings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDate, formatRupiah } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Car, CalendarDays, ChevronLeft, ChevronRight, Clock3, User, CarFront } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Armada() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownershipFilter, setOwnershipFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const { data: vehicles, isLoading } = useListVehicles({
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    ownership: ownershipFilter !== "all" ? (ownershipFilter as any) : undefined,
  });
  const { data: bookings = [] } = useListBookings();

  const filteredVehicles = vehicles?.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.plateNumber.toLowerCase().includes(search.toLowerCase())
  );

  const vehicleCalendar = useMemo(() => {
    return (filteredVehicles || []).map((vehicle) => {
      const related = (bookings as any[]).filter((booking) => booking.vehicleId === vehicle.id && booking.status !== "completed" && booking.status !== "cancelled");
      const nextBooking = related.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
      return { vehicle, nextBooking };
    });
  }, [filteredVehicles, bookings]);

  const calendarDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, []);

  const bookingMap = useMemo(() => {
    const activeBookings = (bookings as any[]).filter(
      (booking) => booking.status !== "completed" && booking.status !== "cancelled"
    );

    return (filteredVehicles || []).map((vehicle) => {
      const vehicleBookings = activeBookings.filter((booking) => booking.vehicleId === vehicle.id);
      const days = calendarDays.map((day) => {
        const dayStart = new Date(day);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const matchedBooking = vehicleBookings.find((booking) => {
          const bookingStart = new Date(booking.startDate);
          const bookingEnd = new Date(booking.endDate);
          return bookingStart <= dayEnd && bookingEnd >= dayStart;
        });

        return {
          day,
          booking: matchedBooking || null,
        };
      });

      return { vehicle, days };
    });
  }, [bookings, filteredVehicles, calendarDays]);

  const fullCalendarDays = useMemo(() => {
    const startOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const endOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const startGrid = new Date(startOfMonth);
    startGrid.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    const endGrid = new Date(endOfMonth);
    endGrid.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

    const days: Date[] = [];
    const cursor = new Date(startGrid);
    while (cursor <= endGrid) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [calendarMonth]);

  const fullCalendarData = useMemo(() => {
    const activeBookings = (bookings as any[]).filter(
      (booking) => booking.status !== "completed" && booking.status !== "cancelled"
    );

    return fullCalendarDays.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayBookings = activeBookings.filter((booking) => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        return bookingStart <= dayEnd && bookingEnd >= dayStart;
      });

      const occupiedVehicleIds = new Set(dayBookings.map((booking) => booking.vehicleId));
      const totalVehicles = (filteredVehicles || []).length;
      const occupiedCount = (filteredVehicles || []).filter((vehicle) => occupiedVehicleIds.has(vehicle.id)).length;
      const availableCount = Math.max(0, totalVehicles - occupiedCount);

      return {
        day,
        bookings: dayBookings,
        occupiedCount,
        availableCount,
        totalVehicles,
      };
    });
  }, [bookings, fullCalendarDays, filteredVehicles]);

  const weekdayHeaders = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const selectedDayData = useMemo(() => {
    return fullCalendarData.find((item) => item.day.toDateString() === selectedDate.toDateString()) || null;
  }, [fullCalendarData, selectedDate]);

  const selectedDayBookings = useMemo(() => {
    if (!selectedDayData) return [];
    return selectedDayData.bookings.sort(
      (a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [selectedDayData]);

  const selectedDayAvailableVehicles = useMemo(() => {
    const occupiedIds = new Set(selectedDayBookings.map((booking: any) => booking.vehicleId));
    return (filteredVehicles || []).filter((vehicle) => !occupiedIds.has(vehicle.id));
  }, [filteredVehicles, selectedDayBookings]);

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

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2"><CalendarDays className="h-5 w-5 text-blue-300" /> Kalender Ketersediaan Armada</h2>
              <p className="text-sm text-slate-300 mt-1">Pantau booking per tanggal, lihat armada yang dipakai, tersedia, dan kapan kembali siap disewa.</p>
            </div>
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[220px] text-center rounded-md bg-white/10 px-4 py-2 font-semibold">
                {calendarMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Armada Tersaring</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{filteredVehicles?.length || 0}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Tersedia Hari Ini</p>
              <p className="text-2xl font-bold text-emerald-900 mt-2">{selectedDayAvailableVehicles.length}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700">Booking Hari Ini</p>
              <p className="text-2xl font-bold text-amber-900 mt-2">{selectedDayBookings.length}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-700">Tanggal Terpilih</p>
              <p className="text-sm font-bold text-blue-900 mt-2">{formatDate(selectedDate.toISOString())}</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekdayHeaders.map((day) => (
              <div key={day} className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {fullCalendarData.map(({ day, bookings: dayBookings, occupiedCount, availableCount, totalVehicles }) => {
              const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
              const isToday = new Date().toDateString() === day.toDateString();
              const isSelected = selectedDate.toDateString() === day.toDateString();

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(new Date(day))}
                  className={[
                    "min-h-[165px] rounded-2xl border p-3 text-left transition-all",
                    isCurrentMonth ? "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm" : "bg-slate-50 border-slate-100 text-slate-400",
                    isToday ? "ring-2 ring-blue-400" : "",
                    isSelected ? "border-blue-500 shadow-md bg-blue-50/40" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">{day.getDate()}</div>
                    <div className="text-[10px] text-slate-500">{totalVehicles} armada</div>
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] text-emerald-700">
                      Tersedia <span className="font-semibold">{availableCount}</span>
                    </div>
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] text-amber-700">
                      Booking <span className="font-semibold">{occupiedCount}</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 max-h-[82px] overflow-auto pr-1">
                    {dayBookings.length > 0 ? (
                      dayBookings.slice(0, 2).map((booking: any) => (
                        <div key={`${day.toISOString()}-${booking.id}`} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-700">
                          <div className="font-semibold truncate">{booking.vehicleName}</div>
                          <div className="truncate">{booking.customerName}</div>
                          <div className="text-slate-500 truncate">s/d {formatDate(booking.endDate, true)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-slate-400">Belum ada booking</div>
                    )}
                    {dayBookings.length > 2 && (
                      <div className="text-[10px] text-slate-500">+{dayBookings.length - 2} booking lain</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mt-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Booking pada {formatDate(selectedDate.toISOString())}</h3>
                  <p className="text-sm text-slate-500">Nama mobil, penyewa, dan batas akhir sewa pada tanggal terpilih.</p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedDayBookings.length > 0 ? (
                  selectedDayBookings.map((booking: any) => (
                    <div key={booking.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-amber-900 font-semibold">
                            <CarFront className="h-4 w-4" />
                            {booking.vehicleName}
                          </div>
                          <p className="text-xs text-amber-800 font-mono mt-1">{booking.vehiclePlate}</p>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-3 mt-4 text-sm">
                        <div className="rounded-lg bg-white/70 px-3 py-2 border border-amber-100">
                          <div className="flex items-center gap-2 text-slate-700 font-medium"><User className="h-4 w-4" /> Penyewa</div>
                          <p className="mt-1 text-slate-900 font-semibold">{booking.customerName}</p>
                        </div>
                        <div className="rounded-lg bg-white/70 px-3 py-2 border border-amber-100">
                          <div className="flex items-center gap-2 text-slate-700 font-medium"><Clock3 className="h-4 w-4" /> Mulai</div>
                          <p className="mt-1 text-slate-900 font-semibold">{formatDate(booking.startDate, true)}</p>
                        </div>
                        <div className="rounded-lg bg-white/70 px-3 py-2 border border-amber-100">
                          <div className="flex items-center gap-2 text-slate-700 font-medium"><Clock3 className="h-4 w-4" /> Sampai</div>
                          <p className="mt-1 text-slate-900 font-semibold">{formatDate(booking.endDate, true)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    Tidak ada booking pada tanggal ini.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-900">Armada Tersedia</h3>
              <p className="text-sm text-slate-500 mb-4">Daftar armada yang masih bisa dipakai pada tanggal terpilih.</p>

              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {selectedDayAvailableVehicles.length > 0 ? (
                  selectedDayAvailableVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-emerald-900">{vehicle.name}</p>
                          <p className="text-xs text-emerald-800 font-mono mt-1">{vehicle.plateNumber}</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={vehicle.status} />
                          <p className="text-xs text-emerald-800 mt-1">{formatRupiah(vehicle.dailyRate)}/hari</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    Semua armada sedang terpakai / dibooking.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
