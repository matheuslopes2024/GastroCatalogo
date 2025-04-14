const { db } = require('../db');
const { eq, sql, desc, and, gte, count } = require('drizzle-orm');
const { 
  products, 
  productGroups, 
  productComparisons, 
  productGroupItems,
  categories,
  users,
  searchLogs
} = require('@shared/schema');

/**
 * Obtém estatísticas gerais do marketplace
 */
const getMarketplaceStats = async (req, res) => {
  try {
    // Buscar total de comparações
    const [totalComparisonsResult] = await db
      .select({ count: count() })
      .from(productComparisons);
    
    const totalComparisons = totalComparisonsResult?.count || 0;
    
    // Buscar total de produtos comparados
    const [totalProductsResult] = await db
      .select({
        count: count(productGroupItems.productId, { distinct: true })
      })
      .from(productGroupItems);
    
    const totalProductsCompared = totalProductsResult?.count || 0;
    
    // Calcular a economia total (diferença entre menor e maior preço nos grupos)
    const [totalSavingsResult] = await db
      .select({
        savings: sql`SUM((${productGroups.maxPrice}::numeric - ${productGroups.minPrice}::numeric))`
      })
      .from(productGroups);
    
    const totalSavings = totalSavingsResult?.savings || "0";
    
    // Calcular percentual médio de economia
    const [avgSavingsResult] = await db
      .select({
        percentage: sql`AVG(((${productGroups.maxPrice}::numeric - ${productGroups.minPrice}::numeric) / NULLIF(${productGroups.maxPrice}::numeric, 0)) * 100)`
      })
      .from(productGroups)
      .where(sql`${productGroups.maxPrice}::numeric > 0`);
    
    const avgSavingsPercentage = Math.round(avgSavingsResult?.percentage || 0);
    
    // Buscar categorias mais populares
    const topCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        count: count(searchLogs.id).as('searchCount')
      })
      .from(categories)
      .leftJoin(searchLogs, eq(searchLogs.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(desc(sql`searchCount`))
      .limit(8);
    
    // Simular economias recentes (em uma implementação real, isso viria de uma tabela de histórico de comparações)
    // Em um sistema real, esses dados viriam do banco de dados a partir de comparações salvas pelos usuários
    // Aqui estamos simulando com dados de produtos reais do sistema
    const recentComparisonProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        maxPrice: productGroups.maxPrice,
        createdAt: productComparisons.createdAt
      })
      .from(productComparisons)
      .leftJoin(productGroups, eq(productComparisons.groupId, productGroups.id))
      .leftJoin(productGroupItems, eq(productGroupItems.groupId, productGroups.id))
      .leftJoin(products, eq(products.id, productGroupItems.productId))
      .where(sql`${productComparisons.createdAt} >= NOW() - INTERVAL '30 days'`)
      .orderBy(desc(productComparisons.createdAt))
      .limit(5);
    
    const recentSavings = recentComparisonProducts.map(product => {
      const price = parseFloat(product.price);
      const maxPrice = parseFloat(product.maxPrice);
      const savings = maxPrice - price;
      const percentage = Math.round((savings / maxPrice) * 100);
      
      return {
        amount: savings.toString(),
        percentage,
        product: product.name,
        productSlug: product.slug,
        date: new Date(product.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      };
    });
    
    res.json({
      totalSavings,
      avgSavingsPercentage,
      totalProductsCompared,
      totalComparisons,
      topCategories,
      recentSavings
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do marketplace:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas do marketplace' });
  }
};

/**
 * Obtém estatísticas dos fornecedores
 */
const getSupplierStats = async (req, res) => {
  try {
    const supplierId = req.query.supplierId ? parseInt(req.query.supplierId) : null;
    
    if (!supplierId) {
      return res.status(400).json({ error: 'ID do fornecedor é obrigatório' });
    }
    
    // Total de produtos do fornecedor
    const [productsCount] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.supplierId, supplierId));
    
    // Dados do fornecedor
    const [supplier] = await db
      .select()
      .from(users)
      .where(eq(users.id, supplierId));
    
    if (!supplier) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    
    res.json({
      supplierId,
      productsCount: productsCount.count,
      supplierName: supplier.name,
      joinedDate: new Date(supplier.createdAt).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
      })
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do fornecedor:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas do fornecedor' });
  }
};

/**
 * Obtém estatísticas de preços de um grupo de produtos
 */
const getProductGroupStats = async (req, res) => {
  try {
    const groupId = req.params.id ? parseInt(req.params.id) : null;
    
    if (!groupId) {
      return res.status(400).json({ error: 'ID do grupo é obrigatório' });
    }
    
    // Buscar grupo
    const [group] = await db
      .select()
      .from(productGroups)
      .where(eq(productGroups.id, groupId));
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    // Buscar produtos do grupo com detalhes de preço
    const productsInGroup = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        supplierId: products.supplierId,
        supplierName: users.name
      })
      .from(productGroupItems)
      .leftJoin(products, eq(products.id, productGroupItems.productId))
      .leftJoin(users, eq(users.id, products.supplierId))
      .where(eq(productGroupItems.groupId, groupId));
    
    // Calcular diferenças de preço em relação ao preço mínimo
    const minPrice = parseFloat(group.minPrice);
    
    const priceStats = productsInGroup.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      supplier: product.supplierName,
      difference: parseFloat(product.price) - minPrice,
      percentageDifference: minPrice > 0 
        ? Math.round(((parseFloat(product.price) - minPrice) / minPrice) * 100) 
        : 0
    }));
    
    res.json({
      group,
      products: priceStats,
      avgPrice: parseFloat(group.avgPrice),
      minPrice: parseFloat(group.minPrice),
      maxPrice: parseFloat(group.maxPrice),
      totalSavings: parseFloat(group.maxPrice) - parseFloat(group.minPrice),
      savingsPercentage: parseFloat(group.maxPrice) > 0 
        ? Math.round(((parseFloat(group.maxPrice) - parseFloat(group.minPrice)) / parseFloat(group.maxPrice)) * 100)
        : 0
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do grupo:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas do grupo' });
  }
};

module.exports = {
  getMarketplaceStats,
  getSupplierStats,
  getProductGroupStats
};