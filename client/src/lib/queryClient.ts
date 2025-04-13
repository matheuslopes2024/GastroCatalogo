import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {},
  };
  
  // Detectar se estamos no dashboard do fornecedor
  const isSupplierDashboard = window.location.pathname.includes('/fornecedor/') || 
                            window.location.pathname.includes('/supplier/');
  
  // Adicionar header para dashboard de fornecedor
  if (isSupplierDashboard) {
    options.headers = {
      ...options.headers,
      'x-supplier-dashboard': 'true'
    };
  }

  // Se data for FormData, não definir Content-Type (o navegador define com boundary)
  if (data) {
    if (data instanceof FormData) {
      options.body = data;
    } else {
      options.headers = { 
        ...options.headers,
        "Content-Type": "application/json" 
      };
      options.body = JSON.stringify(data);
    }
  }
  
  // Adicionar headers extras se fornecidos
  if (extraHeaders) {
    options.headers = {
      ...options.headers,
      ...extraHeaders
    };
  }

  console.log("Enviando request para:", url, "com método:", method, 
              "e corpo do tipo:", data instanceof FormData ? "FormData" : typeof data);

  const res = await fetch(url, options);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Detectar se estamos no dashboard do fornecedor
    const isSupplierDashboard = window.location.pathname.includes('/fornecedor/') || 
                             window.location.pathname.includes('/supplier/');
    
    // Configurar headers padrão
    const headers: Record<string, string> = {};
    
    // Adicionar header para dashboard de fornecedor
    if (isSupplierDashboard) {
      headers['x-supplier-dashboard'] = 'true';
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
