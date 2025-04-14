const { db } = require('../db');
const { eq, sql, desc, and, gte, count } = require('drizzle-orm');
const { 
  products, 
  productGroups, 
  categories,
  users,
} = require('@shared/schema');

/**
 * Obtém kits pré-configurados para diferentes tipos de estabelecimentos
 * Este é um endpoint simulado para mostrar kits recomendados
 */
const getKitPresets = async (req, res) => {
  try {
    // Buscar categorias para referência
    const categories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug
      })
      .from(categories)
      .limit(10);
    
    // Buscar alguns grupos de produtos que têm mais produtos
    const groups = await db
      .select({
        id: productGroups.id,
        name: productGroups.name,
        slug: productGroups.slug,
        displayName: productGroups.displayName,
        minPrice: productGroups.minPrice,
        maxPrice: productGroups.maxPrice,
        categoryId: productGroups.categoryId,
        productsCount: productGroups.productsCount
      })
      .from(productGroups)
      .orderBy(desc(productGroups.productsCount))
      .limit(5);
    
    // Criar kits com base em grupos existentes
    // Em um sistema real, esses kits seriam armazenados em uma tabela própria
    const kits = [
      {
        id: 1,
        name: "Kit Cafeteria Completa",
        slug: "kit-cafeteria-completa",
        itemsCount: 12,
        totalInvestment: "29800.00",
        estimatedSavings: "8200.00",
        savingsPercentage: 22,
        imageUrl: "https://i.imgur.com/random-cafe.jpg",
        mainCategories: ["Máquinas de Café", "Mesas e Cadeiras", "Vitrines Refrigeradas"]
      },
      {
        id: 2,
        name: "Kit Restaurante Inicial",
        slug: "kit-restaurante-inicial",
        itemsCount: 18,
        totalInvestment: "68500.00",
        estimatedSavings: "15700.00",
        savingsPercentage: 19,
        imageUrl: "https://i.imgur.com/random-restaurant.jpg",
        mainCategories: ["Fogões Industriais", "Fornos Combinados", "Refrigeradores"]
      },
      {
        id: 3,
        name: "Kit Padaria Essencial",
        slug: "kit-padaria-essencial",
        itemsCount: 14,
        totalInvestment: "42300.00",
        estimatedSavings: "9800.00",
        savingsPercentage: 23,
        imageUrl: "https://i.imgur.com/random-bakery.jpg",
        mainCategories: ["Fornos de Padaria", "Batedeiras", "Refrigeradores"]
      }
    ];
    
    // Adicionar kits baseados em dados reais
    if (groups.length > 0) {
      const realKits = groups.map((group, index) => {
        // Escolher algumas categorias aleatórias para simular os componentes do kit
        const randomCategories = categories
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(cat => cat.name);
        
        // Calcular valores simulados baseados nos dados reais do grupo
        const minPrice = parseFloat(group.minPrice || "0");
        const maxPrice = parseFloat(group.maxPrice || "0");
        const avgPrice = (minPrice + maxPrice) / 2;
        const itemsCount = Math.round(group.productsCount * 1.5);
        const totalInvestment = (avgPrice * itemsCount).toFixed(2);
        const estimatedSavings = ((maxPrice - minPrice) * itemsCount).toFixed(2);
        const savingsPercentage = maxPrice > 0 
          ? Math.round(((maxPrice - minPrice) / maxPrice) * 100)
          : 0;
        
        return {
          id: 10 + index,
          name: `Kit ${group.displayName || group.name}`,
          slug: `kit-${group.slug}`,
          itemsCount,
          totalInvestment,
          estimatedSavings,
          savingsPercentage,
          imageUrl: "https://i.imgur.com/default-kit.jpg",
          mainCategories: randomCategories
        };
      });
      
      // Combinar kits simulados com os reais (baseados em grupos existentes)
      kits.push(...realKits);
    }
    
    res.json(kits);
  } catch (error) {
    console.error('Erro ao obter kits pré-configurados:', error);
    res.status(500).json({ error: 'Erro ao obter kits pré-configurados' });
  }
};

module.exports = {
  getKitPresets
};