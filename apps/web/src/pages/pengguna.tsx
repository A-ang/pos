import { useState } from "react";
import { useCreateUser, useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, UserPlus, Users } from "lucide-react";

type UserRole = "admin" | "staff" | "owner";

export default function Pengguna() {
  const { data: users, isLoading } = useListUsers();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createForm, setCreateForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "staff" as UserRole,
  });

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "staff" as UserRole,
    password: "",
    active: true,
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Pengguna berhasil ditambahkan" });
        setCreateForm({ username: "", name: "", password: "", role: "staff" });
      },
    },
  });

  const openEdit = (user: any) => {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name,
      role: user.role,
      password: "",
      active: user.active !== false,
    });
  };

  const handleCreateUser = () => {
    if (!createForm.username || !createForm.name || !createForm.password) {
      toast({ title: "Lengkapi data pengguna", variant: "destructive" });
      return;
    }

    createMutation.mutate({ data: createForm });
  };

  const handleSaveAccess = async () => {
    if (!editingUserId) return;

    const response = await fetch(`/api/users/${editingUserId}`, {
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
    setEditingUserId(null);
    setEditForm({ name: "", role: "staff", password: "", active: true });
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengguna Sistem</h1>
        <p className="text-slate-500 mt-1">Kelola RBAC untuk admin, staff operasional, dan owner</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Tambah Pengguna</CardTitle>
          <CardDescription>Buat akun baru untuk admin, staff, atau owner.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Contoh: Budi Santoso" />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={createForm.username} onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))} placeholder="Contoh: budi.s" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Minimal 6 karakter" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="staff">Staf Operasional</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleCreateUser} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan Pengguna"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Daftar Pengguna & Hak Akses</CardTitle>
          <CardDescription>Edit role dan status akun pengguna langsung dari tabel.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">Nama Lengkap</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar Pada</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
                        {user.role === "admin" ? (
                          <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">Administrator</Badge>
                        ) : user.role === "owner" ? (
                          <Badge variant="outline" className="text-slate-700 border-slate-300">Owner</Badge>
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
                      <TableCell className="text-right pr-6">
                        <Button variant="outline" size="sm" onClick={() => openEdit(user)}>Kelola Akses</Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingUserId && (
        <Card className="border-0 shadow-sm border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle>Kelola Hak Akses Pengguna</CardTitle>
            <CardDescription>Ubah nama, role, status aktif, dan password pengguna.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nama</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm((prev) => ({ ...prev, role: value as UserRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="staff">Staf</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Password Baru (Opsional)</Label>
                <Input type="password" value={editForm.password} onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 mt-6 md:mt-0">
                <div>
                  <p className="font-medium text-slate-900">Status Akun</p>
                  <p className="text-xs text-slate-500">Matikan bila user tidak boleh login lagi</p>
                </div>
                <Switch checked={editForm.active} onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, active: checked }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingUserId(null)}>Batal</Button>
              <Button onClick={handleSaveAccess}>Simpan Perubahan</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
