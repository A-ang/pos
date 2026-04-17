import { ReactNode } from "react";
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
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
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
    navigation.push({ name: "Pengguna", href: "/pengguna", icon: Settings });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="h-16 flex items-center px-6 font-bold text-white text-lg tracking-tight bg-slate-950">
          POS Rental V2
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = location.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
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
      <div className="pl-64 flex-1 flex flex-col w-full">
        <main className="flex-1 w-full p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
