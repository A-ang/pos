import { useParams, Link } from "wouter";
import { useGetTransaction, useUpdateTransaction, getGetTransactionQueryKey } from "@workspace/api-client-react";
import { useGetBooking, getGetBookingQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatRupiah, formatDate, formatDateTimeWIB, calculateRentalDays } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Receipt, CheckCircle2, CreditCard, Banknote, QrCode } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function TransaksiDetail() {
  const { id } = useParams();
  const transactionId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "qris">("transfer");
  const [printConfigOpen, setPrintConfigOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    businessName: "POS Rental Mobil",
    businessAddress: "Jl. Operasional Rental No. 1, Jakarta",
    businessPhone: "0812-0000-0000",
    footerNote: "Terima kasih telah menggunakan layanan kami.",
    paymentNote: "Invoice ini sah sebagai bukti transaksi.",
    termsAndConditions: `BBM: Kendaraan dikembalikan dengan level BBM yang sama saat pengambilan.

Overtime: Keterlambatan dikenakan denda 10% per jam dari harga harian.

Kerusakan: Segala kerusakan kecil/besar selama masa sewa menjadi tanggung jawab penyewa sesuai kesepakatan.

Dokumen: E-Resi ini adalah bukti sah dan wajib ditunjukkan saat pengambilan unit.`,
    showPaidStamp: true,
  });

  const { data: transaction, isLoading: isLoadingTransaction } = useGetTransaction(transactionId, {
    query: { enabled: !!transactionId, queryKey: getGetTransactionQueryKey(transactionId) }
  });
  const { data: relatedBooking } = useGetBooking(transaction?.bookingId || 0, {
    query: { enabled: !!transaction?.bookingId, queryKey: getGetBookingQueryKey(transaction?.bookingId || 0) }
  });

  const updateMutation = useUpdateTransaction({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetTransactionQueryKey(transactionId), data);
        toast({
          title: "Pembayaran berhasil dicatat",
          description: `Tagihan telah diperbarui.`,
        });
        setPaymentAmount("");
      }
    }
  });

  if (isLoadingTransaction) {
    return <div className="p-8 text-slate-500">Memuat detail tagihan...</div>;
  }

  if (!transaction) {
    return <div className="p-8 text-slate-500">Tagihan tidak ditemukan.</div>;
  }

  const effectiveEditAmount = editAmount || String(transaction.amount ?? 0);

  const relatedBookingWithPickup = relatedBooking as (typeof relatedBooking & { pickupDropoffFee?: number | null }) | undefined;

  const remainingAmount = transaction.amount - transaction.paidAmount;
  const isFullyPaid = transaction.status === 'paid';
  const rentalDays = relatedBooking ? calculateRentalDays(relatedBooking.startDate, relatedBooking.endDate) : null;
  const termsAndConditions = printConfig.termsAndConditions
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const printableHtml = `
    <html>
      <head>
        <title>${transaction.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1,h2,p { margin: 0; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
          .card { border:1px solid #cbd5e1; border-radius:12px; padding:16px; margin-top:16px; }
          .row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0; }
          .row:last-child { border-bottom:none; }
          .muted { color:#64748b; font-size:12px; }
          .total { font-weight:bold; font-size:20px; }
          .stamp { margin-top: 16px; display:inline-block; border:2px solid #16a34a; color:#16a34a; padding:8px 12px; border-radius:8px; font-weight:bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; vertical-align: top; }
          th { background: #f8fafc; }
          ul { margin: 8px 0 0 18px; padding: 0; }
          li { margin: 6px 0; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; }
          .footer-list p { margin: 0 0 10px 0; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Resi / Invoice Pelanggan</h1>
            <p class="muted">${printConfig.businessName}</p>
            <p class="muted">${printConfig.businessAddress}</p>
            <p class="muted">${printConfig.businessPhone}</p>
          </div>
          <div style="text-align:right">
            <h2>${transaction.invoiceNumber}</h2>
            <p class="muted">Tanggal: ${formatDate(transaction.createdAt, true)}</p>
          </div>
        </div>
        <div class="card">
          <div class="row"><span>Pelanggan</span><strong>${transaction.customerName}</strong></div>
          <div class="row"><span>Kendaraan</span><strong>${transaction.vehicleName}</strong></div>
          <div class="row"><span>ID Reservasi</span><strong>#${transaction.bookingId}</strong></div>
          <div class="row"><span>Durasi Sewa</span><strong>${rentalDays ? `${rentalDays} hari` : "-"}</strong></div>
          <div class="row"><span>Status</span><strong>${transaction.status}</strong></div>
          <div class="row"><span>Biaya Sewa Dasar</span><strong>${formatRupiah(relatedBooking?.baseAmount)}</strong></div>
          <div class="row"><span>Biaya Antar Jemput</span><strong>${formatRupiah(relatedBookingWithPickup?.pickupDropoffFee)}</strong></div>
          <div class="row"><span>Total Tagihan</span><strong>${formatRupiah(transaction.amount)}</strong></div>
          <div class="row"><span>Total Dibayar</span><strong>${formatRupiah(transaction.paidAmount)}</strong></div>
          <div class="row total"><span>Sisa Tagihan</span><span>${formatRupiah(remainingAmount)}</span></div>
        </div>
        <div class="card">
          <div class="section-title">Jadwal Sewa</div>
          <table>
            <tbody>
              <tr>
                <td style="width: 35%; font-weight: bold; background: #f8fafc;">Waktu Pengambilan</td>
                <td>${formatDateTimeWIB(relatedBooking?.startDate)}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #f8fafc;">Waktu Pengembalian</td>
                <td>${formatDateTimeWIB(relatedBooking?.endDate)}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #f8fafc;">Total Durasi</td>
                <td>${rentalDays ? `${rentalDays} Hari` : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card">
          <p class="muted">Metode pembayaran: ${transaction.paymentMethod ?? "-"}</p>
          <p class="muted" style="margin-top:8px;">Catatan: ${transaction.notes ?? "-"}</p>
          <p class="muted" style="margin-top:8px;">${printConfig.paymentNote}</p>
          ${isFullyPaid && printConfig.showPaidStamp ? '<div class="stamp">LUNAS</div>' : ''}
        </div>
        <div class="card footer-list">
          <div class="section-title">Syarat & Ketentuan</div>
          ${termsAndConditions.map((item) => `<p>${item}</p>`).join("")}
        </div>
        <p class="muted" style="margin-top:20px;">${printConfig.footerNote}</p>
      </body>
    </html>
  `;

  const handlePrintInvoice = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(printableHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handlePayment = () => {
    const amountToPay = parseInt(paymentAmount) || 0;
    if (amountToPay <= 0) return;

    const newPaidAmount = transaction.paidAmount + amountToPay;
    const newStatus = newPaidAmount >= transaction.amount ? 'paid' : 'partial';

    updateMutation.mutate({
      id: transactionId,
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paymentMethod: paymentMethod
      }
    });
  };

  const handlePayFull = () => {
    setPaymentAmount(remainingAmount.toString());
  };

  const handleUpdateAmount = () => {
    const parsed = parseInt(effectiveEditAmount) || 0;
    if (parsed <= 0) return;
    updateMutation.mutate({
      id: transactionId,
      data: {
        amount: parsed,
      } as any,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/transaksi"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
                {transaction.invoiceNumber}
              </h1>
              <StatusBadge status={transaction.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={printConfigOpen} onOpenChange={setPrintConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Kustomisasi Invoice</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Kustomisasi Cetak Invoice</DialogTitle>
                <DialogDescription>Atur identitas perusahaan dan catatan yang tampil pada resi pelanggan.</DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                  <Label>Nama Bisnis</Label>
                  <Input value={printConfig.businessName} onChange={(e) => setPrintConfig((prev) => ({ ...prev, businessName: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Telepon / WhatsApp</Label>
                    <Input value={printConfig.businessPhone} onChange={(e) => setPrintConfig((prev) => ({ ...prev, businessPhone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Alamat</Label>
                  <Textarea value={printConfig.businessAddress} onChange={(e) => setPrintConfig((prev) => ({ ...prev, businessAddress: e.target.value }))} />
                </div>
                <div>
                  <Label>Catatan Pembayaran</Label>
                  <Textarea value={printConfig.paymentNote} onChange={(e) => setPrintConfig((prev) => ({ ...prev, paymentNote: e.target.value }))} />
                </div>
                <div>
                  <Label>Footer Invoice</Label>
                  <Textarea value={printConfig.footerNote} onChange={(e) => setPrintConfig((prev) => ({ ...prev, footerNote: e.target.value }))} />
                </div>
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold text-slate-900">Syarat & Ketentuan</Label>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    Isi default footer invoice. Pisahkan tiap poin dengan baris kosong seperti contoh yang Anda kirim.
                  </p>
                  <Textarea
                    rows={10}
                    className="bg-white min-h-[220px]"
                    value={printConfig.termsAndConditions}
                    onChange={(e) => setPrintConfig((prev) => ({ ...prev, termsAndConditions: e.target.value }))}
                  />
                  <div className="mt-3 rounded-md bg-slate-50 border p-3 text-xs text-slate-600 whitespace-pre-line">
                    {printConfig.termsAndConditions}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-slate-900">Tampilkan Stempel Lunas</p>
                    <p className="text-xs text-slate-500">Muncul jika transaksi sudah paid</p>
                  </div>
                  <Switch checked={printConfig.showPaidStamp} onCheckedChange={(checked) => setPrintConfig((prev) => ({ ...prev, showPaidStamp: checked }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPrintConfigOpen(false)}>Tutup</Button>
                <Button onClick={() => { setPrintConfigOpen(false); handlePrintInvoice(); }}>Simpan & Cetak</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handlePrintInvoice}>Cetak Resi Pelanggan</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-0 border-t-4 border-t-slate-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5 text-slate-400" /> Detail Tagihan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Tanggal Diterbitkan</span>
                <span className="font-medium">{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">ID Reservasi</span>
                <Link href={`/reservasi/${transaction.bookingId}`} className="font-medium text-blue-600 hover:underline">
                  #{transaction.bookingId}
                </Link>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Pelanggan</span>
                <span className="font-medium">{transaction.customerName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Kendaraan</span>
                <span className="font-medium">{transaction.vehicleName}</span>
              </div>
              {relatedBooking && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Waktu Pengambilan</span>
                    <span className="font-medium">{formatDateTimeWIB(relatedBooking.startDate)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Waktu Pengembalian</span>
                    <span className="font-medium">{formatDateTimeWIB(relatedBooking.endDate)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Durasi</span>
                    <span className="font-medium">{rentalDays} Hari</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-amber-900">Koreksi Harga Transaksi</span>
                  <span className="text-xs text-amber-700">Jika salah input</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                  <Input className="pl-10" type="number" value={effectiveEditAmount} onChange={(e) => setEditAmount(e.target.value)} />
                </div>
                <Button variant="outline" className="w-full" onClick={handleUpdateAmount} disabled={updateMutation.isPending}>Simpan Harga Baru</Button>
              </div>
              {relatedBooking && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Biaya Sewa Dasar</span>
                    <span className="font-medium text-slate-900">{formatRupiah(relatedBooking.baseAmount)}</span>
                  </div>
                  {!!relatedBookingWithPickup?.pickupDropoffFee && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Biaya Antar Jemput</span>
                      <span className="font-medium text-slate-900">+{formatRupiah(relatedBookingWithPickup?.pickupDropoffFee)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <span className="text-base font-semibold text-slate-700">Total Tagihan</span>
                <span className="text-xl font-bold text-slate-900">{formatRupiah(transaction.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-green-700 pb-2">
                <span className="text-sm font-medium">Telah Dibayar</span>
                <span className="text-base font-semibold">-{formatRupiah(transaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                <span className="text-base font-bold text-red-800">Sisa Tagihan</span>
                <span className="text-xl font-bold text-red-600">{formatRupiah(remainingAmount)}</span>
              </div>
            </div>
            
            {transaction.notes && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">CATATAN</p>
                <p className="text-sm text-slate-700">{transaction.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">SYARAT & KETENTUAN</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {termsAndConditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-500" /> Proses Pembayaran</CardTitle>
            <CardDescription>Catat pembayaran dari pelanggan</CardDescription>
          </CardHeader>
          <CardContent>
            {isFullyPaid ? (
              <div className="bg-green-50 text-green-800 p-8 rounded-xl border border-green-200 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Tagihan Lunas</h3>
                <p className="text-sm opacity-90">Pembayaran terakhir: {formatDate(transaction.paidAt, true)}</p>
                <p className="text-sm opacity-90 capitalize mt-1">Metode: {transaction.paymentMethod}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <Label className="text-slate-700 font-semibold">Jumlah Pembayaran</Label>
                    <Button variant="link" size="sm" className="h-auto p-0 text-blue-600" onClick={handlePayFull}>
                      Bayar Penuh (Lunas)
                    </Button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                    <Input 
                      type="number" 
                      className="pl-10 text-lg font-semibold h-12"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold">Metode Pembayaran</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-3 gap-4">
                    <div>
                      <RadioGroupItem value="transfer" id="transfer" className="peer sr-only" />
                      <Label
                        htmlFor="transfer"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-slate-100 bg-white p-4 hover:bg-slate-50 hover:text-slate-900 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                      >
                        <CreditCard className="mb-2 h-6 w-6 text-slate-500 peer-data-[state=checked]:text-blue-600" />
                        <span className="text-sm font-medium">Transfer</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                      <Label
                        htmlFor="cash"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-slate-100 bg-white p-4 hover:bg-slate-50 hover:text-slate-900 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                      >
                        <Banknote className="mb-2 h-6 w-6 text-slate-500 peer-data-[state=checked]:text-blue-600" />
                        <span className="text-sm font-medium">Tunai</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="qris" id="qris" className="peer sr-only" />
                      <Label
                        htmlFor="qris"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-slate-100 bg-white p-4 hover:bg-slate-50 hover:text-slate-900 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                      >
                        <QrCode className="mb-2 h-6 w-6 text-slate-500 peer-data-[state=checked]:text-blue-600" />
                        <span className="text-sm font-medium">QRIS</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  className="w-full h-12 text-lg mt-6" 
                  size="lg"
                  onClick={handlePayment}
                  disabled={!paymentAmount || parseInt(paymentAmount) <= 0 || updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Memproses..." : "Konfirmasi Pembayaran"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
