import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { insertUserSchema, UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Extend the insertUserSchema for registration with password confirmation
const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Get role from query params (if coming from supplier CTA)
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const roleFromParams = searchParams.get("role");
  
  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      role: roleFromParams === "supplier" ? UserRole.SUPPLIER : UserRole.USER,
      companyName: "",
      cnpj: "",
      phone: "",
    },
  });

  // Watch for role changes to handle conditional fields
  const selectedRole = registerForm.watch("role");
  const isSupplier = selectedRole === UserRole.SUPPLIER;

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    // Remove confirmPassword as it's not part of the API schema
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  useEffect(() => {
    // If roleFromParams is supplier, switch to register tab and set role
    if (roleFromParams === "supplier") {
      setActiveTab("register");
      registerForm.setValue("role", UserRole.SUPPLIER);
    }
  }, [roleFromParams, registerForm]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            {/* Auth Forms */}
            <Card className="w-full">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Cadastro</TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="login">
                  <CardHeader>
                    <CardTitle>Bem-vindo(a) de volta</CardTitle>
                    <CardDescription>
                      Faça login para acessar sua conta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome de usuário</FormLabel>
                              <FormControl>
                                <Input placeholder="seu.usuario" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Entrar
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </TabsContent>

                {/* Register Form */}
                <TabsContent value="register">
                  <CardHeader>
                    <CardTitle>Crie sua conta</CardTitle>
                    <CardDescription>
                      {isSupplier
                        ? "Cadastre sua empresa para começar a vender"
                        : "Cadastre-se para comparar e encontrar os melhores equipamentos"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={registerForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de conta</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo de conta" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={UserRole.USER}>
                                    Cliente
                                  </SelectItem>
                                  <SelectItem value={UserRole.SUPPLIER}>
                                    Fornecedor
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome completo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Seu nome" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome de usuário</FormLabel>
                              <FormControl>
                                <Input placeholder="seu.usuario" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {isSupplier && (
                          <>
                            <FormField
                              control={registerForm.control}
                              name="companyName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome da empresa</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Sua Empresa Ltda."
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={registerForm.control}
                                name="cnpj"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CNPJ</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="00.000.000/0000-00"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={registerForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Telefone</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="(00) 00000-0000"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar senha</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Criar conta
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>

            {/* App Intro */}
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Encontre os melhores equipamentos para seu negócio
              </h2>
              <p className="text-gray-600 mb-6">
                O Gastro Compare é a maior plataforma de comparação de preços
                para equipamentos e produtos de restaurantes e hotéis do Brasil.
              </p>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-full mr-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Compare preços de diversos fornecedores
                    </h3>
                    <p className="text-gray-600">
                      Encontre o melhor preço para cada item da sua cozinha.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-full mr-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Economize tempo na busca por equipamentos
                    </h3>
                    <p className="text-gray-600">
                      Todas as informações que você precisa em um só lugar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-full mr-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Fornecedores verificados e confiáveis
                    </h3>
                    <p className="text-gray-600">
                      Trabalhamos apenas com fornecedores de qualidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
