import { useState } from "react";
import { useListTransactions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CreditCard, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Transaksi() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: transactions, isLoading } = useListTransactions({
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
  });

  const filteredTransactions = transactions?.filter(t => 
    t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || 
    t.customerName.toLowerCase().includes(search.toLowerCase()) ||
    t.bookingId.toString().includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Transaksi & Tagihan</h1>
          <p className="text-slate-500 mt-1">Kelola pembayaran, invoice pelanggan, dan kesiapan cetak bukti transaksi</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Menunggu Pembayaran</p>
              <h3 className="text-2xl font-bold text-blue-900">
                {transactions?.filter(t => t.status === 'unpaid' || t.status === 'partial').length || 0}
              </h3>
            </div>
            <Receipt className="h-8 w-8 text-blue-300" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari no invoice, pelanggan, atau ID reservasi..." 
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
                <SelectItem value="unpaid">Belum Bayar</SelectItem>
                <SelectItem value="partial">Bayar Sebagian</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">No. Invoice</TableHead>
              <TableHead className="font-semibold text-slate-700">Reservasi</TableHead>
              <TableHead className="font-semibold text-slate-700">Pelanggan</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Total Tagihan</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Sisa Bayar</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">Memuat data transaksi...</TableCell>
              </TableRow>
            ) : filteredTransactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <CreditCard className="h-8 w-8 mb-2 opacity-20" />
                    <p>Tidak ada transaksi yang ditemukan</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions?.map((transaction) => (
                <TableRow key={transaction.id} className="group hover:bg-slate-50/50">
                  <TableCell>
                    <div className="font-mono text-slate-700 font-medium">{transaction.invoiceNumber}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{formatDate(transaction.createdAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-600">
                      <Link href={`/reservasi/${transaction.bookingId}`} className="hover:underline text-blue-600">#{transaction.bookingId}</Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{transaction.customerName}</div>
                    <div className="text-xs text-slate-500">{transaction.vehicleName}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={transaction.status} />
                    {transaction.paymentMethod && (
                      <Badge variant="outline" className="ml-2 uppercase text-[10px]">{transaction.paymentMethod}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(transaction.amount)}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {transaction.status !== 'paid' ? formatRupiah(transaction.amount - transaction.paidAmount) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/transaksi/${transaction.id}`}>Proses Bayar</Link>
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
