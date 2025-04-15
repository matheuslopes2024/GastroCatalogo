import React, { ReactNode } from "react";
import { SupplierSidebar } from "@/components/supplier/supplier-sidebar";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SupplierLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function SupplierLayout({ children, className, fullWidth = false }: SupplierLayoutProps) {
  const { user } = useAuth();

  // Se não estiver autenticado ou não for um fornecedor, podemos mostrar um estado de erro ou redirecionamento
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 text-lg font-semibold mb-2">Acesso não autorizado</div>
        <p className="text-muted-foreground mb-4">Você precisa estar logado como fornecedor para acessar esta página.</p>
        <Button onClick={() => window.location.href = "/auth"}>
          Fazer Login
        </Button>
      </div>
    );
  }

  // Layout para dashboard de fornecedor com sidebar
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex flex-1 pt-16">
        <SupplierSidebar />
        <div className={cn(
          "flex-1 ml-0 lg:ml-64 transition-all duration-300 ease-in-out",
          fullWidth ? "px-0" : "px-4 md:px-6 py-4",
          className
        )}>
          <main className="h-full">{children}</main>
        </div>
      </div>
    </div>
  );
}