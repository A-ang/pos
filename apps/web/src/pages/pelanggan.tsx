import { useState } from "react";
import { useListCustomers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Pelanggan() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: customers, isLoading } = useListCustomers({
    search: debouncedSearch || undefined
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pelanggan</h1>
          <p className="text-slate-500 mt-1">Kelola data pelanggan dan riwayat sewa</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/pelanggan/tambah">
            <Plus className="h-4 w-4" />
            Tambah Pelanggan
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari nama, email, atau nomor HP..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                // simple inline debounce for simplicity
                setTimeout(() => setDebouncedSearch(e.target.value), 500);
              }}
              className="pl-9 bg-slate-50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Pelanggan</TableHead>
              <TableHead className="font-semibold text-slate-700">Kontak</TableHead>
              <TableHead className="font-semibold text-slate-700">Identitas</TableHead>
              <TableHead className="text-center font-semibold text-slate-700">Total Sewa</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">Memuat data pelanggan...</TableCell>
              </TableRow>
            ) : customers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Users className="h-8 w-8 mb-2 opacity-20" />
                    <p>Tidak ada pelanggan yang ditemukan</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers?.map((customer) => (
                <TableRow key={customer.id} className="group hover:bg-slate-50/50">
                  <TableCell>
                    <div className="font-medium text-slate-900">{customer.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-sm text-slate-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Mail className="h-3 w-3 mr-2" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{customer.idType}</Badge>
                      <span className="font-mono text-sm text-slate-600">{customer.idNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold">{customer.totalBookings}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/pelanggan/${customer.id}`}>Detail</Link>
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
