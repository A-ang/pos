import { useState } from "react";
import { useListUsers, useCreateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, UserPlus, ShieldAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const userSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  name: z.string().min(1, "Nama wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "staff", "owner"]),
});

export default function Pengguna() {
  const { data: users, isLoading } = useListUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "staff", password: "", active: true });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      name: "",
      password: "",
      role: "staff",
    },
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Pengguna berhasil ditambahkan" });
        setIsDialogOpen(false);
        form.reset();
      }
    }
  });

  const onSubmit = (values: z.infer<typeof userSchema>) => {
    createMutation.mutate({ data: values });
  };

  const saveUserAccess = async () => {
    if (!editingUser) return;
    const response = await fetch(`/api/users/${editingUser.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!response.ok) {
      toast({ title: "Gagal memperbarui pengguna", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    toast({ title: "Hak akses pengguna diperbarui" });
    setEditingUser(null);
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-2" />
        <h1 className="text-2xl font-bold text-slate-900">Akses Ditolak</h1>
        <p className="text-slate-500 max-w-md">Hanya administrator yang memiliki akses ke halaman manajemen pengguna ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengguna Sistem</h1>
          <p className="text-slate-500 mt-1">Kelola RBAC untuk admin, staff operasional, dan owner</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Buat akun baru untuk memberikan akses ke sistem POS Rental.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Budi Santoso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: budi.s" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimal 6 karakter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peran (Role)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih peran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="staff">Staf (Kasir/Operasional)</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="owner">Pemilik (Laporan Saja)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">Nama Lengkap</TableHead>
                <TableHead className="font-semibold text-slate-700">Username</TableHead>
                <TableHead className="font-semibold text-slate-700">Peran (Role)</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Terdaftar Pada</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">Memuat data pengguna...</TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Users className="h-8 w-8 mb-2 opacity-20" />
                      <p>Belum ada pengguna terdaftar</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => {
                  const isActive = (user as any).active !== false;

                  return (
                    <TableRow key={user.id} className="hover:bg-slate-50">
                      <TableCell className="px-6 font-medium text-slate-900">{user.name}</TableCell>
                      <TableCell className="text-slate-600">{user.username}</TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">Administrator</Badge>
                        ) : user.role === 'owner' ? (
                          <Badge variant="outline" className="text-slate-700 border-slate-300">Pemilik</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Staf</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-600 hover:bg-green-700" : ""}>
                          {isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user);
                                setEditForm({ name: user.name, role: user.role, password: "", active: isActive });
                              }}
                            >
                              Kelola Akses
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kelola Hak Akses Pengguna</AlertDialogTitle>
                              <AlertDialogDescription>
                                Administrator dapat mengubah nama, role, status aktif, dan reset password pengguna.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4 py-2">
                              <div>
                                <FormLabel>Nama</FormLabel>
                                <Input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
                              </div>
                              <div>
                                <FormLabel>Role</FormLabel>
                                <Select value={editForm.role} onValueChange={(value) => setEditForm((prev) => ({ ...prev, role: value }))}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="staff">Staf</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <FormLabel>Password Baru (opsional)</FormLabel>
                                <Input type="password" value={editForm.password} onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))} />
                              </div>
                              <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                  <p className="font-medium text-slate-900">Status Akun</p>
                                  <p className="text-xs text-slate-500">Matikan bila user tidak boleh login lagi</p>
                                </div>
                                <Switch checked={editForm.active} onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, active: checked }))} />
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={saveUserAccess}>Simpan Perubahan</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
