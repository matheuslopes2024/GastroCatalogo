import { useState, useEffect } from 'react';

/**
 * Custom hook para verificar se um media query está ativo
 * @param query A media query a ser verificada (ex: "(min-width: 768px)")
 * @returns Boolean indicando se a media query combina atualmente
 */
export function useMediaQuery(query: string): boolean {
  // Estado inicial baseado na correspondência atual
  const getMatches = (): boolean => {
    // Verifica se estamos no navegador
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches());

  useEffect(() => {
    // Função para atualizar o estado
    const handleChange = () => {
      setMatches(getMatches());
    };

    // Cria o objeto MediaQueryList
    const mediaQuery = window.matchMedia(query);
    
    // Adiciona o listener e atualiza imediatamente
    mediaQuery.addEventListener('change', handleChange);
    handleChange();

    // Cleanup: remove o listener quando o componente for desmontado
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}