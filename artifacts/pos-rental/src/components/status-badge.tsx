import { Badge } from "@/components/ui/badge";

type BadgeProps = React.ComponentProps<typeof Badge>;

export function StatusBadge({ status, className, ...props }: { status: string } & BadgeProps) {
  switch (status) {
    // Vehicles
    case "available":
      return <Badge className={`bg-green-500 hover:bg-green-600 text-white ${className}`} {...props}>Tersedia</Badge>;
    case "rented":
      return <Badge className={`bg-blue-500 hover:bg-blue-600 text-white ${className}`} {...props}>Disewa</Badge>;
    case "maintenance":
      return <Badge className={`bg-orange-500 hover:bg-orange-600 text-white ${className}`} {...props}>Maintenance</Badge>;
    
    // Bookings
    case "pending":
      return <Badge variant="outline" className={`text-orange-600 border-orange-500 ${className}`} {...props}>Menunggu</Badge>;
    case "active":
      return <Badge className={`bg-blue-500 hover:bg-blue-600 text-white ${className}`} {...props}>Aktif</Badge>;
    case "completed":
      return <Badge className={`bg-slate-500 hover:bg-slate-600 text-white ${className}`} {...props}>Selesai</Badge>;
    case "cancelled":
      return <Badge variant="destructive" className={className} {...props}>Dibatalkan</Badge>;

    // Transactions
    case "unpaid":
      return <Badge variant="destructive" className={className} {...props}>Belum Bayar</Badge>;
    case "partial":
      return <Badge className={`bg-yellow-500 hover:bg-yellow-600 text-white ${className}`} {...props}>Sebagian</Badge>;
    case "paid":
      return <Badge className={`bg-green-500 hover:bg-green-600 text-white ${className}`} {...props}>Lunas</Badge>;
      
    // Ownership
    case "internal":
      return <Badge variant="secondary" className={className} {...props}>Internal</Badge>;
    case "external":
      return <Badge variant="outline" className={`border-primary text-primary ${className}`} {...props}>Mitra</Badge>;

    default:
      return <Badge variant="secondary" className={className} {...props}>{status}</Badge>;
  }
}
