import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Car, 
  Users, 
  CalendarDays, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Wrench,
  Building2,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const navigation = useMemo(() => {
    const items = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Reservasi", href: "/reservasi", icon: CalendarDays },
      { name: "Armada", href: "/armada", icon: Car },
      { name: "Mitra", href: "/mitra", icon: Building2 },
      { name: "Pelanggan", href: "/pelanggan", icon: Users },
      { name: "Transaksi", href: "/transaksi", icon: CreditCard },
      { name: "Laporan", href: "/laporan", icon: BarChart3 },
      { name: "Maintenance", href: "/maintenance", icon: Wrench },
    ];

    if (user?.role === "admin") {
      items.push({ name: "Pengguna", href: "/pengguna", icon: Settings });
    }

    return items;
  }, [user?.role]);

  const navigationLinks = (mobile = false) => (
    <nav className={`space-y-1 ${mobile ? "px-0" : "px-3"}`}>
      {navigation.map((item) => {
        const isActive = location.startsWith(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="font-bold text-slate-900">POS Rental V2</p>
          <p className="text-xs text-slate-500">{user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => logout()}>
            <LogOut className="h-5 w-5" />
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-slate-900 text-slate-200 border-slate-800">
              <SheetHeader>
                <SheetTitle className="text-white">Menu Navigasi</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {navigationLinks(true)}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col fixed inset-y-0 left-0 z-50">
        <div className="h-16 flex items-center px-6 font-bold text-white text-lg tracking-tight bg-slate-950">
          POS Rental V2
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {navigationLinks()}
        </div>
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout()} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex-1 flex flex-col w-full pt-[73px] lg:pt-0">
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
