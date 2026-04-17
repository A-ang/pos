import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Armada from "@/pages/armada";
import ArmadaTambah from "@/pages/armada-tambah";
import ArmadaDetail from "@/pages/armada-detail";
import Mitra from "@/pages/mitra";
import Pelanggan from "@/pages/pelanggan";
import PelangganTambah from "@/pages/pelanggan-tambah";
import PelangganDetail from "@/pages/pelanggan-detail";
import Reservasi from "@/pages/reservasi";
import ReservasiTambah from "@/pages/reservasi-tambah";
import ReservasiDetail from "@/pages/reservasi-detail";
import Transaksi from "@/pages/transaksi";
import TransaksiDetail from "@/pages/transaksi-detail";
import Laporan from "@/pages/laporan";
import Pengguna from "@/pages/pengguna";
import Maintenance from "@/pages/maintenance";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Memuat...</div>;
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes */}
      <Route path="/">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      
      <Route path="/armada">
        {() => <ProtectedRoute component={Armada} />}
      </Route>
      <Route path="/armada/tambah">
        {() => <ProtectedRoute component={ArmadaTambah} />}
      </Route>
      <Route path="/armada/:id">
        {() => <ProtectedRoute component={ArmadaDetail} />}
      </Route>

      <Route path="/mitra">
        {() => <ProtectedRoute component={Mitra} />}
      </Route>
      
      <Route path="/pelanggan">
        {() => <ProtectedRoute component={Pelanggan} />}
      </Route>
      <Route path="/pelanggan/tambah">
        {() => <ProtectedRoute component={PelangganTambah} />}
      </Route>
      <Route path="/pelanggan/:id">
        {() => <ProtectedRoute component={PelangganDetail} />}
      </Route>
      
      <Route path="/reservasi">
        {() => <ProtectedRoute component={Reservasi} />}
      </Route>
      <Route path="/reservasi/tambah">
        {() => <ProtectedRoute component={ReservasiTambah} />}
      </Route>
      <Route path="/reservasi/:id">
        {() => <ProtectedRoute component={ReservasiDetail} />}
      </Route>
      
      <Route path="/transaksi">
        {() => <ProtectedRoute component={Transaksi} />}
      </Route>
      <Route path="/transaksi/:id">
        {() => <ProtectedRoute component={TransaksiDetail} />}
      </Route>
      
      <Route path="/laporan">
        {() => <ProtectedRoute component={Laporan} />}
      </Route>
      
      <Route path="/pengguna">
        {() => <ProtectedRoute component={Pengguna} />}
      </Route>
      
      <Route path="/maintenance">
        {() => <ProtectedRoute component={Maintenance} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
