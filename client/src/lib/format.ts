/**
 * Funções utilitárias para formatação de dados
 */

/**
 * Formata um valor numérico para moeda brasileira (BRL)
 * @param value - valor a ser formatado, pode ser string ou número
 * @returns string formatada como moeda (ex: R$ 1.234,56)
 */
export function formatCurrency(value: string | number): string {
  // Converter para número se for string
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Se não for um número válido, retornar formatação padrão
  if (isNaN(numericValue)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

/**
 * Formata uma data para o formato brasileiro (dd/mm/yyyy)
 * @param value - data a ser formatada
 * @returns string formatada (ex: 01/01/2025)
 */
export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  
  // Se não for uma data válida, retornar string vazia
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data com opções personalizadas
 * @param value - data a ser formatada
 * @param options - opções de formatação do Intl.DateTimeFormat
 * @returns string formatada de acordo com as opções
 */
export function formatDateLong(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  const date = value instanceof Date ? value : new Date(value);
  
  // Se não for uma data válida, retornar string vazia
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleDateString('pt-BR', options);
}

/**
 * Formata um número como porcentagem
 * @param value - valor a ser formatado
 * @param decimalPlaces - número de casas decimais
 * @returns string formatada como porcentagem (ex: 12,34%)
 */
export function formatPercent(value: string | number, decimalPlaces: number = 2): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Se não for um número válido, retornar 0%
  if (isNaN(numericValue)) {
    return '0%';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(numericValue / 100);
}