import React, { ReactNode, Component, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Um componente que captura erros de JavaScript em qualquer lugar na árvore de
 * componentes filhos, registra esses erros e exibe uma UI de fallback.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você também pode registrar o erro em um serviço de relatórios de erros
    this.setState({
      errorInfo,
    });

    // Chama o handler de erro personalizado, se existir
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log the error para fins de depuração
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Error info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI de fallback personalizada
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function" && this.state.error) {
          return this.props.fallback(this.state.error, this.state.errorInfo || {} as ErrorInfo);
        }
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <div className="text-red-500 text-lg font-bold mb-2">Algo deu errado</div>
          <p className="text-gray-600 mb-4 text-center">
            Ocorreu um erro inesperado nesta parte da interface.
          </p>
          <details className="mb-4 text-xs text-gray-500 max-w-xl overflow-auto">
            <summary>Detalhes do erro (para desenvolvedores)</summary>
            <pre className="p-2 bg-gray-100 rounded mt-2 overflow-auto">
              {this.state.error?.toString()}
              {"\n\n"}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            onClick={() => window.location.reload()}
          >
            Recarregar a página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}