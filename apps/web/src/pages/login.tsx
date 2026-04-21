import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Redirect } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export default function Login() {
  const { user, login, isLoggingIn } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  function onSubmit(values: z.infer<typeof loginSchema>) {
    login({ data: values });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center bg-slate-900 text-white rounded-t-xl pb-8 pt-10">
          <CardTitle className="text-3xl font-bold tracking-tight">RentalPro</CardTitle>
          <CardDescription className="text-slate-300">
            Sistem Manajemen Operasional Rental Mobil
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-8 px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan username" className="h-12 bg-slate-50" {...field} />
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
                    <FormLabel className="text-slate-700 font-semibold">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Masukkan password" className="h-12 bg-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isLoggingIn}>
                {isLoggingIn ? "Memproses..." : "Masuk"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
