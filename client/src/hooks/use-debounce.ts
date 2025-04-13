import { useState, useEffect } from "react";

/**
 * Hook personalizado para debounce de valores.
 * 
 * @param value O valor a ser debounced
 * @param delay O tempo de espera em ms (padrão: 500ms)
 * @returns O valor após o período de debounce
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configurar o timer para atualizar o valor após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar o timer se o valor mudar antes do delay terminar
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}