import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SupplierLayout } from "@/components/layouts/supplier-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BulkInventoryUpdate } from "@/components/supplier/bulk-inventory-update";
import { InventoryAlerts } from "@/components/supplier/inventory-alerts";
import { InventoryHistory } from "@/components/supplier/inventory-history";
import { StockStatusSummary } from "@/components/dashboard/stock-status-summary";
import { 
  ArrowUpDown, 
  BarChart3, 
  Bell, 
  Clock, 
  Database, 
  LayoutGrid, 
  Layers, 
  LineChart, 
  PackageOpen, 
  RefreshCw, 
  FileDown,
  FileUp,
  History
} from "lucide-react";

export default function InventarioPage() {
  const { user } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [activeAlertTab, setActiveAlertTab] = useState("pending");
  
  // Buscar estatísticas de estoque
  const { 
    data: inventoryStats, 
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ["/api/supplier/inventory/stats"],
    enabled: !!user?.id,
  });

  return (
    <SupplierLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Inventário</h1>
            <p className="text-muted-foreground">
              Monitore e gerencie o estoque de todos os seus produtos
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetchStats()}
              className="h-9"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            
            <Button 
              variant="default" 
              className="h-9"
              onClick={() => window.location.href = "/supplier/product-management?action=create"}
            >
              <PackageOpen className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StockStatusSummary isLoading={isLoadingStats} stats={inventoryStats} />
        </div>
        
        <Tabs 
          defaultValue="overview" 
          value={activeMainTab} 
          onValueChange={setActiveMainTab}
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-full max-w-xl grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline-block">Visão Geral</span>
                <span className="sm:hidden">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="bulk-update" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline-block">Atualização em Massa</span>
                <span className="sm:hidden">Atualizar</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline-block">Histórico</span>
                <span className="sm:hidden">Histórico</span>
              </TabsTrigger>
            </TabsList>
            
            {activeMainTab === "overview" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
                
                <Button variant="outline" size="sm" className="h-9">
                  <FileUp className="mr-2 h-4 w-4" />
                  Importar CSV
                </Button>
              </div>
            )}
          </div>
          
          <TabsContent value="overview" className="space-y-6">
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[600px] rounded-lg border"
            >
              <ResizablePanel defaultSize={65} minSize={40}>
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold">Resumo de Produtos</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowUpDown className="h-4 w-4" />
                        <span className="sr-only">Ordenar</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Layers className="h-4 w-4" />
                        <span className="sr-only">Filtrar</span>
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      {/* Aqui entraria uma tabela com produtos e níveis de estoque */}
                      <div className="rounded-lg border bg-muted/50 p-8 text-center">
                        <h3 className="mb-2 text-lg font-medium">
                          Visualização de Produtos
                        </h3>
                        <p className="text-muted-foreground">
                          A visualização completa dos produtos e níveis de estoque está disponível na página de gerenciamento de produtos
                        </p>
                        <Button 
                          variant="default" 
                          className="mt-4"
                          onClick={() => window.location.href = "/supplier/product-management"}
                        >
                          Ver Produtos
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={35} minSize={30}>
                <Tabs 
                  defaultValue="pending" 
                  value={activeAlertTab}
                  onValueChange={setActiveAlertTab}
                  className="h-full flex flex-col"
                >
                  <div className="border-b px-4 py-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">Alertas de Inventário</h3>
                      <Button variant="ghost" size="sm" className="h-8 gap-1">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline-block">Configurações</span>
                      </Button>
                    </div>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="pending">Pendentes</TabsTrigger>
                      <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="pending" className="flex-1 p-0">
                    <InventoryAlerts embedded />
                  </TabsContent>
                  <TabsContent value="resolved" className="flex-1 p-0">
                    <InventoryAlerts embedded />
                  </TabsContent>
                </Tabs>
              </ResizablePanel>
            </ResizablePanelGroup>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-muted-foreground" />
                    Produtos com Baixo Estoque
                  </CardTitle>
                  <CardDescription>
                    Produtos que estão próximos ou abaixo do limite mínimo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] rounded-lg border bg-muted/50 p-6 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">
                        Dados de estoque disponíveis na aba de alertas
                      </p>
                      <Button
                        variant="link"
                        onClick={() => {
                          document.getElementById("alertas-tab")?.click();
                        }}
                      >
                        Ver Alertas de Estoque
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <LineChart className="mr-2 h-5 w-5 text-muted-foreground" />
                    Movimentação Recente
                  </CardTitle>
                  <CardDescription>
                    Alterações recentes no inventário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] rounded-lg border bg-muted/50 p-6 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">
                        Dados de movimentação disponíveis na aba de histórico
                      </p>
                      <Button
                        variant="link"
                        onClick={() => setActiveMainTab("history")}
                      >
                        Ver Histórico de Movimentação
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="bulk-update">
            <BulkInventoryUpdate />
          </TabsContent>
          
          <TabsContent value="history">
            <InventoryHistory />
          </TabsContent>
        </Tabs>
        
        <Separator className="my-8" />
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight" id="alertas-tab">Alertas de Inventário</h2>
          <InventoryAlerts />
        </div>
      </div>
    </SupplierLayout>
  );
}