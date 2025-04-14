const { db } = require('../db');
const { sql } = require('drizzle-orm');

// Obter certificações de um produto
async function getProductCertifications(req, res) {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }

    const certifications = await db.query.product_certifications.findMany({
      where: (certifications, { eq }) => eq(certifications.product_id, parseInt(productId))
    });

    return res.json(certifications);
  } catch (error) {
    console.error('Erro ao buscar certificações:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar certificações' });
  }
}

// Obter avaliações de um produto
async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }

    const reviews = await db.execute(sql`
      SELECT 
        pr.id, 
        pr.product_id,
        pr.user_id,
        pr.rating,
        pr.title,
        pr.comment,
        pr.verified_purchase,
        pr.created_at,
        u.username,
        u.name as user_name
      FROM product_reviews pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = ${parseInt(productId)}
      ORDER BY pr.created_at DESC
    `);

    return res.json(reviews.rows);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar avaliações' });
  }
}

// Obter detalhes técnicos de produtos comparáveis
async function getComparableProductDetails(req, res) {
  try {
    const { groupId } = req.params;
    
    if (!groupId) {
      return res.status(400).json({ error: 'ID do grupo é obrigatório' });
    }

    const productsInfo = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.original_price,
        p.discount,
        p.rating,
        p.ratings_count,
        p.features,
        p.image_url,
        p.supplier_id,
        u.name as supplier_name,
        u.company_name,
        pgi.is_highlighted,
        pgi.match_confidence,
        pgi.total_sales
      FROM product_group_items pgi
      JOIN products p ON pgi.product_id = p.id
      JOIN users u ON p.supplier_id = u.id
      WHERE pgi.group_id = ${parseInt(groupId)}
      ORDER BY p.price ASC
    `);

    return res.json(productsInfo.rows);
  } catch (error) {
    console.error('Erro ao buscar detalhes dos produtos:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhes dos produtos' });
  }
}

// Obter estatísticas de economia para comparação
async function getProductComparisonStats(req, res) {
  try {
    const { groupId } = req.params;
    
    if (!groupId) {
      return res.status(400).json({ error: 'ID do grupo é obrigatório' });
    }

    const stats = await db.execute(sql`
      SELECT 
        MAX(p.price) - MIN(p.price) as max_savings,
        MAX(p.price) as max_price,
        MIN(p.price) as min_price,
        AVG(p.price) as avg_price,
        COUNT(DISTINCT pgi.product_id) as products_count,
        COUNT(DISTINCT p.supplier_id) as suppliers_count,
        MAX(pgi.total_sales) as max_sales
      FROM product_group_items pgi
      JOIN products p ON pgi.product_id = p.id
      WHERE pgi.group_id = ${parseInt(groupId)}
    `);

    return res.json(stats.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de comparação:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar estatísticas' });
  }
}

module.exports = {
  getProductCertifications,
  getProductReviews,
  getComparableProductDetails,
  getProductComparisonStats
};