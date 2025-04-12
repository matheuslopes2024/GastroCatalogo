import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import Stripe from "stripe";
import { WebSocketServer, WebSocket } from 'ws';
import { 
  insertCategorySchema, 
  insertProductSchema, 
  insertSaleSchema, 
  insertCommissionSettingSchema, 
  insertProductImageSchema, 
  insertFaqCategorySchema,
  insertFaqItemSchema,
  insertChatMessageSchema,
  insertChatConversationSchema,
  UserRole, 
  productImages 
} from "@shared/schema";
import { eq, and, or, like, ne } from "drizzle-orm";
import bodyParser from "body-parser";
import multer from "multer";

// Inicialização do Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" }) 
  : null;
  
// Configuração para armazenamento das imagens usando multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceita apenas imagens
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos") as any);
    }
  },
});

// Helper for checking user roles
const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });
  
  app.get("/api/categories/:idOrSlug", async (req, res) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      
      // Caso especial para "Todas as categorias" (ID 0)
      if (idOrSlug === "0") {
        return res.json({
          id: 0,
          name: "Todas as categorias",
          slug: "todas-categorias",
          description: "Exibe produtos de todas as categorias",
          icon: "grid",
          productsCount: -1  // valor especial para indicar "todos os produtos"
        });
      }
      
      let category;
      
      // Verifica se é um ID (número) ou slug (string)
      if (!isNaN(Number(idOrSlug))) {
        console.log(`Buscando categoria pelo ID: ${idOrSlug}`);
        category = await storage.getCategory(parseInt(idOrSlug));
      } else {
        console.log(`Buscando categoria pelo slug: ${idOrSlug}`);
        category = await storage.getCategoryBySlug(idOrSlug);
      }
      
      if (!category) {
        console.log(`Categoria não encontrada: ${idOrSlug}`);
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      console.log(`Categoria encontrada: ${category.name} (ID: ${category.id})`);
      res.json(category);
    } catch (error) {
      console.error("Erro ao buscar categoria:", error);
      res.status(500).json({ message: "Erro ao buscar categoria" });
    }
  });
  
  app.post("/api/categories", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar categoria" });
    }
  });
  
  app.patch("/api/categories/:id", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      const updatedCategory = await storage.updateCategory(id, req.body);
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar categoria" });
    }
  });
  
  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, supplierId, search, limit } = req.query;
      
      const options: any = { active: true };
      
      if (categoryId) options.categoryId = parseInt(categoryId as string);
      if (supplierId) options.supplierId = parseInt(supplierId as string);
      if (search) options.search = search as string;
      if (limit) options.limit = parseInt(limit as string);
      
      const products = await storage.getProducts(options);
      res.json(products);
    } catch (error) {
      console.error("Erro detalhado ao buscar produtos:", error);
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });
  
  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar produto" });
    }
  });
  
  // Endpoint para buscar o mesmo produto de diferentes fornecedores
  app.get("/api/products/:slug/suppliers", async (req, res) => {
    try {
      // Buscar o produto principal
      const baseProduct = await storage.getProductBySlug(req.params.slug);
      if (!baseProduct) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Buscar produtos similares com base no nome do produto
      const similarProducts = await storage.getProducts({
        search: baseProduct.name,
        active: true
      });
      
      // Filtrar para incluir apenas produtos que correspondam exatamente ao nome
      // e sejam de fornecedores diferentes
      const matchingProducts = similarProducts.filter(product => 
        product.name.toLowerCase().trim() === baseProduct.name.toLowerCase().trim() &&
        product.id !== baseProduct.id
      );
      
      // Adicionar o produto base à lista
      const allProducts = [baseProduct, ...matchingProducts];
      
      // Ordenar por preço (do menor para o maior)
      const sortedProducts = allProducts.sort((a, b) => 
        parseFloat(a.price.toString()) - parseFloat(b.price.toString())
      );
      
      // Obter IDs dos fornecedores
      const supplierIds = [...new Set(sortedProducts.map(p => p.supplierId))];
      
      // Buscar informações dos fornecedores
      const suppliers = await Promise.all(
        supplierIds.map(id => storage.getUser(id))
      );
      
      // Criar mapa de fornecedores para acesso rápido
      const supplierMap = new Map();
      suppliers.forEach(supplier => {
        if (supplier) {
          // Remove a senha antes de enviar
          const { password, ...safeSupplier } = supplier;
          supplierMap.set(supplier.id, safeSupplier);
        }
      });
      
      // Adicionar informações do fornecedor a cada produto
      const productsWithSuppliers = sortedProducts.map(product => ({
        ...product,
        supplier: supplierMap.get(product.supplierId) || null,
        isBestPrice: false // Será atualizado abaixo
      }));
      
      // Marcar o produto com melhor preço
      if (productsWithSuppliers.length > 0) {
        productsWithSuppliers[0].isBestPrice = true;
      }
      
      res.json(productsWithSuppliers);
    } catch (error) {
      console.error("Erro ao buscar produto de diferentes fornecedores:", error);
      res.status(500).json({ message: "Erro ao buscar produto de diferentes fornecedores" });
    }
  });
  
  app.post("/api/products", checkRole([UserRole.SUPPLIER, UserRole.ADMIN]), async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      
      // If user is a supplier, force supplierId to be their user ID
      if (req.user?.role === UserRole.SUPPLIER) {
        validatedData.supplierId = req.user.id;
      }
      
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar produto" });
    }
  });
  
  app.patch("/api/products/:id", checkRole([UserRole.SUPPLIER, UserRole.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Suppliers can only update their own products
      if (req.user?.role === UserRole.SUPPLIER && product.supplierId !== req.user.id) {
        return res.status(403).json({ message: "Sem permissão para editar este produto" });
      }
      
      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar produto" });
    }
  });
  
  // Product Comparison API
  app.get("/api/compare-products", async (req, res) => {
    try {
      const { name, category, limit } = req.query;
      
      if (!name && !category) {
        return res.status(400).json({ message: "É necessário fornecer o nome do produto ou a categoria para comparação" });
      }
      
      // Buscar produtos semelhantes com base no nome ou categoria
      const options: any = { active: true };
      const limitNum = limit ? parseInt(limit as string) : 5; // Padrão: 5 melhores ofertas
      
      if (category) {
        const categorySlug = category as string;
        const categoryObj = await storage.getCategoryBySlug(categorySlug);
        if (categoryObj) {
          options.categoryId = categoryObj.id;
        }
      }
      
      if (name) {
        options.search = name as string;
      }
      
      const products = await storage.getProducts(options);
      
      // Agrupar produtos por nome para comparar preços entre fornecedores
      const productGroups: { [key: string]: any[] } = {};
      
      products.forEach(product => {
        // Normalizar nome do produto para agrupar
        const normalizedName = product.name.toLowerCase().trim();
        if (!productGroups[normalizedName]) {
          productGroups[normalizedName] = [];
        }
        productGroups[normalizedName].push(product);
      });
      
      // Criar resultado de comparação
      const comparisonResults = Object.values(productGroups)
        .map(group => {
          // Ordenar por preço (do menor para o maior)
          return group.sort((a, b) => 
            parseFloat(a.price.toString()) - parseFloat(b.price.toString())
          );
        })
        // Filtrar apenas grupos que têm mais de um fornecedor
        .filter(group => group.length > 1)
        // Limitar a quantidade de grupos retornados
        .slice(0, limitNum);
      
      res.json(comparisonResults);
    } catch (error) {
      console.error("Erro ao comparar produtos:", error);
      res.status(500).json({ message: "Erro ao comparar produtos" });
    }
  });
  
  // Product Groups API (Comparação estilo Trivago)
  app.get("/api/product-groups", async (req, res) => {
    try {
      const { categoryId, search, active, limit } = req.query;
      
      const options: any = {};
      
      if (categoryId) options.categoryId = parseInt(categoryId as string);
      if (search) options.search = search as string;
      if (active !== undefined) options.active = active === 'true';
      if (limit) options.limit = parseInt(limit as string);
      
      const groups = await storage.getProductGroups(options);
      res.json(groups);
    } catch (error) {
      console.error("Erro ao buscar grupos de produtos:", error);
      res.status(500).json({ message: "Erro ao buscar grupos de produtos" });
    }
  });
  
  app.get("/api/product-groups/:idOrSlug", async (req, res) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      let group;
      
      // Verifica se é um ID (número) ou slug (string)
      if (!isNaN(Number(idOrSlug))) {
        group = await storage.getProductGroup(parseInt(idOrSlug));
      } else {
        group = await storage.getProductGroupBySlug(idOrSlug);
      }
      
      if (!group) {
        return res.status(404).json({ message: "Grupo de produtos não encontrado" });
      }
      
      // Buscar os itens do grupo (produtos de diferentes fornecedores)
      let groupItems = await storage.getProductGroupItems(group.id, { includeProducts: true });
      
      // Buscar produtos detalhados para cada item do grupo
      const productIds = groupItems.map(item => item.productId);
      const products = await Promise.all(
        productIds.map(id => storage.getProduct(id))
      );
      
      // Mapear produtos por ID para fácil acesso
      const productsMap = new Map();
      products.forEach(product => {
        if (product) {
          productsMap.set(product.id, product);
        }
      });
      
      // Adicionar informações detalhadas do produto em cada item
      groupItems = groupItems.map(item => ({
        ...item,
        product: productsMap.get(item.productId) || null
      }));
      
      // Ordenar os itens por preço (do menor para o maior)
      groupItems.sort((a, b) => {
        const priceA = parseFloat((a.product?.price || 0).toString());
        const priceB = parseFloat((b.product?.price || 0).toString());
        return priceA - priceB;
      });
      
      // Destacar automaticamente o item com menor preço se nenhum estiver marcado
      if (groupItems.length > 0 && !groupItems.some(item => item.isHighlighted)) {
        groupItems[0].isHighlighted = true;
        
        // Atualizar no banco de dados
        await storage.updateProductGroupItem(groupItems[0].id, { 
          isHighlighted: true 
        });
      }
      
      // Calcular diferenças de preço em relação ao item destacado
      const highlightedItem = groupItems.find(item => item.isHighlighted);
      if (highlightedItem && highlightedItem.product) {
        const basePrice = parseFloat(highlightedItem.product.price.toString());
        
        groupItems = groupItems.map(item => {
          if (item.id !== highlightedItem.id && item.product) {
            const itemPrice = parseFloat(item.product.price.toString());
            const difference = itemPrice - basePrice;
            const percentageDiff = (difference / basePrice) * 100;
            
            return {
              ...item,
              priceDifference: difference.toFixed(2),
              percentageDifference: percentageDiff.toFixed(1) + '%',
              isMoreExpensive: difference > 0
            };
          }
          return item;
        });
      }
      
      // Buscar fornecedores
      const supplierIds = [...new Set(groupItems.map(item => item.supplierId))];
      const suppliers = await Promise.all(
        supplierIds.map(id => storage.getUser(id))
      );
      
      // Mapear fornecedores por ID
      const supplierMap = new Map();
      suppliers.forEach(supplier => {
        if (supplier) {
          // Remove informações sensíveis
          const { password, ...safeSupplier } = supplier;
          supplierMap.set(supplier.id, safeSupplier);
        }
      });
      
      // Adicionar informações do fornecedor a cada item
      groupItems = groupItems.map(item => ({
        ...item,
        supplier: supplierMap.get(item.supplierId) || null
      }));
      
      // Adicionar os itens ao resultado
      const result = {
        ...group,
        items: groupItems
      };
      
      res.json(result);
    } catch (error) {
      console.error("Erro ao buscar grupo de produtos:", error);
      res.status(500).json({ message: "Erro ao buscar grupo de produtos" });
    }
  });
  
  app.get("/api/product-groups/:id/items", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.getProductGroup(id);
      
      if (!group) {
        return res.status(404).json({ message: "Grupo de produtos não encontrado" });
      }
      
      // Buscar os itens do grupo (produtos de diferentes fornecedores)
      let groupItems = await storage.getProductGroupItems(group.id, { includeProducts: true });
      
      // Buscar produtos detalhados para cada item do grupo
      const productIds = groupItems.map(item => item.productId);
      const products = await Promise.all(
        productIds.map(id => storage.getProduct(id))
      );
      
      // Mapear produtos por ID para fácil acesso
      const productsMap = new Map();
      products.forEach(product => {
        if (product) {
          productsMap.set(product.id, product);
        }
      });
      
      // Adicionar informações detalhadas do produto em cada item
      groupItems = groupItems.map(item => ({
        ...item,
        product: productsMap.get(item.productId) || null
      }));
      
      // Ordenar os itens por preço (do menor para o maior)
      groupItems.sort((a, b) => {
        const priceA = parseFloat((a.product?.price || 0).toString());
        const priceB = parseFloat((b.product?.price || 0).toString());
        return priceA - priceB;
      });
      
      // Buscar fornecedores
      const supplierIds = [...new Set(groupItems.map(item => item.supplierId))];
      const suppliers = await Promise.all(
        supplierIds.map(id => storage.getUser(id))
      );
      
      // Mapear fornecedores por ID
      const supplierMap = new Map();
      suppliers.forEach(supplier => {
        if (supplier) {
          // Remove informações sensíveis
          const { password, ...safeSupplier } = supplier;
          supplierMap.set(supplier.id, safeSupplier);
        }
      });
      
      // Adicionar informações do fornecedor a cada item
      groupItems = groupItems.map(item => ({
        ...item,
        supplier: supplierMap.get(item.supplierId) || null
      }));
      
      res.json(groupItems);
    } catch (error) {
      console.error("Erro ao buscar itens do grupo de produtos:", error);
      res.status(500).json({ message: "Erro ao buscar itens do grupo de produtos" });
    }
  });
  
  // Sales API
  app.get("/api/sales", checkRole([UserRole.SUPPLIER, UserRole.ADMIN]), async (req, res) => {
    try {
      const options: any = {};
      
      // Suppliers can only see their own sales
      if (req.user?.role === UserRole.SUPPLIER) {
        options.supplierId = req.user.id;
      } else if (req.query.supplierId) {
        options.supplierId = parseInt(req.query.supplierId as string);
      }
      
      if (req.query.buyerId) {
        options.buyerId = parseInt(req.query.buyerId as string);
      }
      
      const sales = await storage.getSales(options);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar vendas" });
    }
  });
  
  app.post("/api/sales", async (req, res) => {
    try {
      const validatedData = insertSaleSchema.parse(req.body);
      
      // Set buyer ID if user is authenticated
      if (req.isAuthenticated()) {
        validatedData.buyerId = req.user.id;
      }
      
      const sale = await storage.createSale(validatedData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao registrar venda" });
    }
  });
  
  // Commission Settings API
  app.get("/api/commission-settings", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const { categoryId, supplierId, active } = req.query;
      
      const options: any = {};
      
      if (categoryId) options.categoryId = parseInt(categoryId as string);
      if (supplierId) options.supplierId = parseInt(supplierId as string);
      if (active !== undefined) options.active = active === 'true';
      
      const settings = await storage.getCommissionSettings(options);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar configurações de comissão" });
    }
  });
  
  app.post("/api/commission-settings", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const validatedData = insertCommissionSettingSchema.parse(req.body);
      const setting = await storage.createCommissionSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar configuração de comissão" });
    }
  });
  
  app.patch("/api/commission-settings/:id", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const setting = await storage.getCommissionSetting(id);
      
      if (!setting) {
        return res.status(404).json({ message: "Configuração não encontrada" });
      }
      
      const updatedSetting = await storage.updateCommissionSetting(id, req.body);
      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar configuração de comissão" });
    }
  });
  
  // Users API (admin only)
  app.get("/api/users", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const { role } = req.query;
      const users = await storage.getUsers(role as string | undefined);
      
      // Remove passwords before sending response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });
  
  // Get user by ID
  app.get("/api/users/:id", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remove password before sending response
      const { password, ...sanitizedUser } = user;
      
      res.json(sanitizedUser);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });
  
  // Update user
  app.patch("/api/users/:id", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Update user data
      const updatedUser = await storage.updateUser(id, req.body);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao atualizar usuário" });
      }
      
      // Remove password before sending response
      const { password, ...sanitizedUser } = updatedUser;
      
      res.json(sanitizedUser);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });
  
  // Suppliers info API (for checkout)
  app.get("/api/suppliers-info", async (req, res) => {
    try {
      const { ids } = req.query;
      
      if (!ids) {
        return res.status(400).json({ message: "IDs dos fornecedores são obrigatórios" });
      }
      
      const supplierIds = (ids as string).split(',').map(id => parseInt(id));
      const suppliers = await storage.getUsers(UserRole.SUPPLIER);
      
      // Filter suppliers by IDs and remove sensitive information
      const filteredSuppliers = suppliers
        .filter(supplier => supplierIds.includes(supplier.id))
        .map(({ password, email, ...supplier }) => supplier);
      
      res.json(filteredSuppliers);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar informações dos fornecedores" });
    }
  });
  
  // Get all suppliers for listing
  app.get("/api/suppliers", async (req, res) => {
    try {
      const { category, search, sortBy = "rating" } = req.query;
      
      // Get all suppliers
      const suppliers = await storage.getUsers(UserRole.SUPPLIER);
      
      // Remove sensitive data
      let processedSuppliers = suppliers.map(({ password, ...supplier }) => {
        // Calculate metrics for each supplier
        return {
          ...supplier,
          productsCount: 0, // Will be calculated
          avgRating: 0,     // Will be calculated
          categories: []    // Will be populated
        };
      });
      
      // Get all products to calculate metrics
      const allProducts = await storage.getProducts({ active: true });
      
      // Create a map to store supplier metrics
      const supplierMetrics = new Map();
      const supplierCategories = new Map();
      
      // Calculate metrics for each supplier
      allProducts.forEach(product => {
        const supplierId = product.supplierId;
        
        // Initialize supplier metrics if not exists
        if (!supplierMetrics.has(supplierId)) {
          supplierMetrics.set(supplierId, { 
            productsCount: 0, 
            ratingsSum: 0, 
            ratingsCount: 0 
          });
        }
        
        // Initialize supplier categories if not exists
        if (!supplierCategories.has(supplierId)) {
          supplierCategories.set(supplierId, new Set());
        }
        
        // Update metrics
        const metrics = supplierMetrics.get(supplierId);
        metrics.productsCount++;
        
        // Update categories
        supplierCategories.get(supplierId).add(product.categoryId);
        
        // Update ratings sum
        if (product.rating) {
          const ratingValue = parseFloat(product.rating.toString());
          if (!isNaN(ratingValue)) {
            metrics.ratingsSum += ratingValue;
            metrics.ratingsCount++;
          }
        }
      });
      
      // Get all categories for category names
      const allCategories = await storage.getCategories();
      const categoryMap = new Map();
      allCategories.forEach(category => {
        categoryMap.set(category.id, category);
      });
      
      // Apply metrics to suppliers
      processedSuppliers = processedSuppliers.map(supplier => {
        const metrics = supplierMetrics.get(supplier.id) || { productsCount: 0, ratingsSum: 0, ratingsCount: 0 };
        const categoriesSet = supplierCategories.get(supplier.id) || new Set();
        
        // Calculate average rating
        const avgRating = metrics.ratingsCount > 0 
          ? metrics.ratingsSum / metrics.ratingsCount 
          : 0;
        
        // Get category names
        const categoryNames = Array.from(categoriesSet)
          .map(categoryId => {
            const category = categoryMap.get(categoryId);
            return category ? category.name : null;
          })
          .filter(Boolean);
        
        return {
          ...supplier,
          productsCount: metrics.productsCount,
          rating: avgRating.toFixed(1),
          categories: categoryNames,
          verified: true, // All suppliers on platform are verified
          joinedDate: supplier.createdAt.toISOString().split('T')[0]
        };
      });
      
      // Apply filters if provided
      let filteredSuppliers = processedSuppliers;
      
      // Filter by category
      if (category) {
        const categoryLower = (category as string).toLowerCase();
        filteredSuppliers = filteredSuppliers.filter(supplier => 
          supplier.categories.some(cat => 
            cat.toLowerCase().includes(categoryLower)
          )
        );
      }
      
      // Filter by search term
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredSuppliers = filteredSuppliers.filter(supplier => 
          supplier.name.toLowerCase().includes(searchLower) || 
          supplier.companyName?.toLowerCase().includes(searchLower) ||
          supplier.categories.some(cat => cat.toLowerCase().includes(searchLower))
        );
      }
      
      // Sort by specified field
      if (sortBy === "rating") {
        filteredSuppliers.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      } else if (sortBy === "products") {
        filteredSuppliers.sort((a, b) => b.productsCount - a.productsCount);
      } else if (sortBy === "newest") {
        filteredSuppliers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      res.json(filteredSuppliers);
    } catch (error) {
      console.error("Erro ao listar fornecedores:", error);
      res.status(500).json({ message: "Erro ao listar fornecedores" });
    }
  });
  
  // Stripe Payment API
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ 
        message: "Stripe não configurado. Adicione suas chaves de API nas variáveis de ambiente." 
      });
    }
    
    try {
      const { amount } = req.body;
      
      if (!amount || isNaN(amount)) {
        return res.status(400).json({ message: "Valor inválido" });
      }
      
      // Criar PaymentIntent no Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Converter para centavos
        currency: "brl", // Moeda brasileira
        metadata: {
          integration_check: "accept_a_payment",
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Erro ao criar payment intent:", error);
      res.status(500).json({ 
        message: "Erro ao processar pagamento", 
        error: error.message 
      });
    }
  });
  
  // Configurando o limite de tamanho do payload para suportar uploads maiores
  app.use(bodyParser.json({ limit: '10mb' }));
  
  // Rota para upload de imagem de produto
  app.post("/api/upload-product-image", checkRole([UserRole.SUPPLIER, UserRole.ADMIN]), upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "Nenhum arquivo enviado" 
        });
      }
      
      const productId = parseInt(req.body.productId);
      const isPrimary = req.body.isPrimary === "true";
      const sortOrder = parseInt(req.body.sortOrder) || 0;
      
      if (!productId) {
        return res.status(400).json({ 
          success: false, 
          message: "ID do produto é obrigatório" 
        });
      }
      
      // Verificar se o produto existe
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Verificar se o fornecedor tem permissão para editar este produto
      if (req.user?.role === UserRole.SUPPLIER && product.supplierId !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: "Você não tem permissão para adicionar imagens a este produto" 
        });
      }

      // Se isPrimary, define todas as outras imagens como não primárias
      if (isPrimary) {
        await storage.updateProductImagesNotPrimary(productId);
      }

      // Converte a imagem para base64
      const imageData = req.file.buffer.toString('base64');
      const imageType = req.file.mimetype;
      
      console.log("Processando imagem:", {
        productId,
        mimetype: req.file.mimetype,
        filename: req.file.originalname,
        size: req.file.size,
        isPrimary
      });

      // Cria o registro da imagem no banco
      const productImage = await storage.createProductImage({
        productId,
        imageData,
        imageType,
        imageUrl: null, // Não usamos URL, armazenamos diretamente no banco
        isPrimary,
        sortOrder
      });
      
      res.json({ 
        success: true, 
        message: "Imagem adicionada com sucesso",
        image: productImage
      });
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      res.status(500).json({ message: "Erro ao fazer upload da imagem" });
    }
  });
  
  // Rota para recuperar imagem do produto
  app.get("/api/product-image/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      
      // Buscar o produto
      const product = await storage.getProduct(productId);
      if (!product || !product.imageData || !product.imageType) {
        return res.status(404).json({ message: "Imagem não encontrada" });
      }
      
      // Enviar dados da imagem
      res.set('Content-Type', product.imageType);
      res.send(Buffer.from(product.imageData, 'base64'));
    } catch (error) {
      console.error("Erro ao buscar imagem do produto:", error);
      res.status(500).json({ message: "Erro ao buscar imagem do produto" });
    }
  });
  
  // API para gerenciar imagens de produtos (múltiplas imagens)
  app.get("/api/products/:productId/images", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const images = await storage.getProductImages(productId);
      res.json(images);
    } catch (error) {
      console.error("Erro ao buscar imagens do produto:", error);
      res.status(500).json({ message: "Erro ao buscar imagens do produto" });
    }
  });

  app.post("/api/products/:productId/images", checkRole([UserRole.SUPPLIER, UserRole.ADMIN]), async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Fornecedores só podem adicionar imagens aos seus próprios produtos
      if (req.user?.role === UserRole.SUPPLIER && product.supplierId !== req.user.id) {
        return res.status(403).json({ message: "Sem permissão para adicionar imagens a este produto" });
      }
      
      // Validar dados
      const validatedData = insertProductImageSchema.parse({
        ...req.body,
        productId
      });
      
      // Verificar se esta imagem está marcada como principal
      if (validatedData.isPrimary) {
        // Atualizar todas as outras imagens deste produto para não serem principais
        await storage.updateProductImagesNotPrimary(productId, undefined);
      }
      
      // Criar a imagem do produto
      const image = await storage.createProductImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Erro ao adicionar imagem ao produto:", error);
      res.status(500).json({ message: "Erro ao adicionar imagem ao produto" });
    }
  });

  app.get("/api/products/images/:imageId", async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const image = await storage.getProductImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Imagem não encontrada" });
      }
      
      // Se a imagem contém dados brutos, enviá-los como imagem
      if (image.imageData && image.imageType) {
        res.set('Content-Type', image.imageType);
        return res.send(Buffer.from(image.imageData, 'base64'));
      }
      
      res.json(image);
    } catch (error) {
      console.error("Erro ao buscar imagem:", error);
      res.status(500).json({ message: "Erro ao buscar imagem" });
    }
  });

  app.patch("/api/products/images/:imageId", checkRole([UserRole.SUPPLIER, UserRole.ADMIN]), async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const image = await storage.getProductImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Imagem não encontrada" });
      }
      
      // Buscar o produto para verificar permissões
      const product = await storage.getProduct(image.productId);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Fornecedores só podem atualizar imagens de seus próprios produtos
      if (req.user?.role === UserRole.SUPPLIER && product.supplierId !== req.user.id) {
        return res.status(403).json({ message: "Sem permissão para atualizar esta imagem" });
      }
      
      // Verificar se está sendo marcada como principal
      if (req.body.isPrimary) {
        // Atualizar todas as outras imagens deste produto para não serem principais
        await storage.updateProductImagesNotPrimary(image.productId, imageId);
      }
      
      const updatedImage = await storage.updateProductImage(imageId, req.body);
      res.json(updatedImage);
    } catch (error) {
      console.error("Erro ao atualizar imagem do produto:", error);
      res.status(500).json({ message: "Erro ao atualizar imagem do produto" });
    }
  });

  // Rota específica para definir uma imagem como principal
  app.put("/api/products/images/:imageId", checkRole([UserRole.SUPPLIER, UserRole.ADMIN]), async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const image = await storage.getProductImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Imagem não encontrada" });
      }
      
      // Buscar o produto para verificar permissões
      const product = await storage.getProduct(image.productId);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Fornecedores só podem atualizar imagens de seus próprios produtos
      if (req.user?.role === UserRole.SUPPLIER && product.supplierId !== req.user.id) {
        return res.status(403).json({ message: "Sem permissão para atualizar esta imagem" });
      }
      
      // Atualizar todas as outras imagens deste produto para não serem principais
      await storage.updateProductImagesNotPrimary(image.productId, imageId);
      
      // Definir esta imagem como principal
      const updatedImage = await storage.updateProductImage(imageId, { 
        isPrimary: true,
        ...req.body  // Permitir outras atualizações enviadas no corpo
      });
      
      res.json(updatedImage);
    } catch (error) {
      console.error("Erro ao definir imagem principal:", error);
      res.status(500).json({ message: "Erro ao definir imagem principal" });
    }
  });

  app.delete("/api/products/images/:imageId", checkRole([UserRole.SUPPLIER, UserRole.ADMIN]), async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const image = await storage.getProductImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Imagem não encontrada" });
      }
      
      // Buscar o produto para verificar permissões
      const product = await storage.getProduct(image.productId);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Fornecedores só podem excluir imagens de seus próprios produtos
      if (req.user?.role === UserRole.SUPPLIER && product.supplierId !== req.user.id) {
        return res.status(403).json({ message: "Sem permissão para excluir esta imagem" });
      }
      
      await storage.deleteProductImage(imageId);
      
      // Se a imagem excluída era principal, definir outra imagem como principal
      if (image.isPrimary) {
        const remainingImages = await storage.getProductImages(image.productId);
        if (remainingImages.length > 0) {
          await storage.updateProductImage(remainingImages[0].id, { isPrimary: true });
        }
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir imagem do produto:", error);
      res.status(500).json({ message: "Erro ao excluir imagem do produto" });
    }
  });

  // FAQ API
  
  // FAQ Categories
  app.get("/api/faq/categories", async (req, res) => {
    try {
      const categories = await storage.getFaqCategories();
      res.json(categories);
    } catch (error) {
      console.error("Erro ao buscar categorias de FAQ:", error);
      res.status(500).json({ message: "Erro ao buscar categorias de FAQ" });
    }
  });
  
  app.get("/api/faq/categories/:idOrSlug", async (req, res) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      let category;
      
      // Verifica se é um ID (número) ou slug (string)
      if (!isNaN(Number(idOrSlug))) {
        category = await storage.getFaqCategory(parseInt(idOrSlug));
      } else {
        category = await storage.getFaqCategoryBySlug(idOrSlug);
      }
      
      if (!category) {
        return res.status(404).json({ message: "Categoria de FAQ não encontrada" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Erro ao buscar categoria de FAQ:", error);
      res.status(500).json({ message: "Erro ao buscar categoria de FAQ" });
    }
  });
  
  app.post("/api/faq/categories", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const validatedData = insertFaqCategorySchema.parse(req.body);
      const category = await storage.createFaqCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Erro ao criar categoria de FAQ:", error);
      res.status(500).json({ message: "Erro ao criar categoria de FAQ" });
    }
  });
  
  app.patch("/api/faq/categories/:id", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getFaqCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Categoria de FAQ não encontrada" });
      }
      
      const updatedCategory = await storage.updateFaqCategory(id, req.body);
      res.json(updatedCategory);
    } catch (error) {
      console.error("Erro ao atualizar categoria de FAQ:", error);
      res.status(500).json({ message: "Erro ao atualizar categoria de FAQ" });
    }
  });
  
  // FAQ Items
  app.get("/api/faq/items", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const items = await storage.getFaqItems(
        categoryId ? parseInt(categoryId as string) : undefined
      );
      res.json(items);
    } catch (error) {
      console.error("Erro ao buscar itens de FAQ:", error);
      res.status(500).json({ message: "Erro ao buscar itens de FAQ" });
    }
  });
  
  app.get("/api/faq/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getFaqItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item de FAQ não encontrado" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Erro ao buscar item de FAQ:", error);
      res.status(500).json({ message: "Erro ao buscar item de FAQ" });
    }
  });
  
  app.post("/api/faq/items", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const validatedData = insertFaqItemSchema.parse(req.body);
      const item = await storage.createFaqItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Erro ao criar item de FAQ:", error);
      res.status(500).json({ message: "Erro ao criar item de FAQ" });
    }
  });
  
  app.patch("/api/faq/items/:id", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getFaqItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item de FAQ não encontrado" });
      }
      
      const updatedItem = await storage.updateFaqItem(id, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Erro ao atualizar item de FAQ:", error);
      res.status(500).json({ message: "Erro ao atualizar item de FAQ" });
    }
  });
  
  // Chat API
  
  // Chat Conversations
  app.get("/api/chat/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autorizado" });
      }
      
      const conversations = await storage.getChatConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
      res.status(500).json({ message: "Erro ao buscar conversas" });
    }
  });
  
  app.post("/api/chat/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autorizado" });
      }
      
      const validatedData = insertChatConversationSchema.parse(req.body);
      
      // Garantir que o usuário atual seja um participante da conversa
      if (!validatedData.participantIds.includes(req.user.id)) {
        validatedData.participantIds.push(req.user.id);
      }
      
      const conversation = await storage.createChatConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Erro ao criar conversa:", error);
      res.status(500).json({ message: "Erro ao criar conversa" });
    }
  });
  
  // Chat Messages
  app.get("/api/chat/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autorizado" });
      }
      
      const { conversationId, limit, offset, unreadOnly } = req.query;
      
      const options: any = {};
      
      if (conversationId) options.conversationId = parseInt(conversationId as string);
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      if (unreadOnly) options.unreadOnly = unreadOnly === 'true';
      
      // Verificar se o usuário tem acesso às mensagens
      if (options.conversationId) {
        const conversation = await storage.getChatConversation(options.conversationId);
        if (!conversation || !conversation.participantIds.includes(req.user.id)) {
          return res.status(403).json({ message: "Sem permissão para acessar esta conversa" });
        }
      } else {
        // Se não houver conversationId, buscar apenas mensagens onde o usuário é remetente ou destinatário
        options.senderId = req.user.id;
        options.receiverId = req.user.id;
      }
      
      const messages = await storage.getChatMessages(options);
      res.json(messages);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });
  
  app.post("/api/chat/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autorizado" });
      }
      
      const validatedData = insertChatMessageSchema.parse(req.body);
      
      // Definir o remetente como o usuário atual
      validatedData.senderId = req.user.id;
      
      // Verificar se o usuário tem acesso à conversa, se houver
      if (validatedData.conversationId) {
        const conversation = await storage.getChatConversation(validatedData.conversationId);
        if (!conversation || !conversation.participantIds.includes(req.user.id)) {
          return res.status(403).json({ message: "Sem permissão para enviar mensagens nesta conversa" });
        }
      }
      
      const message = await storage.createChatMessage(validatedData);
      
      // Obter nome do remetente para notificações
      const sender = req.user;
      const senderName = sender.name || sender.username;
      
      // Encontrar o outro participante da conversa (destinatário)
      let recipientId = validatedData.receiverId;
      if (validatedData.conversationId) {
        const conversation = await storage.getChatConversation(validatedData.conversationId);
        if (conversation) {
          recipientId = conversation.participantIds.find(id => id !== req.user.id);
        }
      }
      
      // Distribuir mensagem em tempo real para todos os destinatários
      distributeRealTimeMessage(
        {
          type: 'new_message_received',
          message,
          senderId: req.user.id,
        },
        {
          recipientId,
          senderId: req.user.id,
          conversationId: validatedData.conversationId,
          senderName,
          skipSender: false, // Enviar ao remetente também para confirmar envio
          notifyAdmins: true // Notificar administradores
        }
      );
      
      // Atualizar a última atividade da conversa se houver
      if (validatedData.conversationId) {
        await storage.updateChatConversation(validatedData.conversationId, {
          lastMessageId: message.id,
          lastMessageText: message.text,
          lastMessageDate: message.createdAt,
          lastActivityAt: new Date()
        });
        
        // Notificar atualizações nas listas de conversas
        const updatedConversations = await storage.getChatConversations(req.user.id);
        const senderClient = clients.get(req.user.id);
        if (senderClient && senderClient.ws && senderClient.ws.readyState === WebSocket.OPEN) {
          sendWebSocketMessage(senderClient.ws, {
            type: 'conversations_update',
            conversations: updatedConversations
          });
        }
        
        // Notificar o destinatário sobre a atualização da lista de conversas
        if (recipientId) {
          const recipientConversations = await storage.getChatConversations(recipientId);
          const recipientClient = clients.get(recipientId);
          if (recipientClient && recipientClient.ws && recipientClient.ws.readyState === WebSocket.OPEN) {
            sendWebSocketMessage(recipientClient.ws, {
              type: 'conversations_update',
              conversations: recipientConversations
            });
          }
        }
      }
      
      // Retornar mensagem criada ao cliente
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Erro ao enviar mensagem:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });
  
  // Marcar mensagens como lidas
  app.post("/api/chat/messages/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autorizado" });
      }
      
      const { messageIds } = req.body;
      
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ message: "IDs de mensagens inválidos" });
      }
      
      // Verificar se o usuário tem permissão para marcar essas mensagens como lidas
      // (deve ser o destinatário)
      const messages = await Promise.all(
        messageIds.map(id => storage.getChatMessage(id))
      );
      
      // Filtrar mensagens válidas e onde o usuário é o destinatário
      const validMessageIds = messages
        .filter(msg => msg && msg.receiverId === req.user.id)
        .map(msg => msg!.id);
      
      if (validMessageIds.length === 0) {
        return res.status(403).json({ message: "Sem permissão para marcar estas mensagens como lidas" });
      }
      
      await storage.markMessagesAsRead(validMessageIds);
      
      // Notificar os remetentes originais que suas mensagens foram lidas
      // Agrupar por remetente para enviar uma única notificação por remetente
      const senderMap = new Map();
      messages.forEach(msg => {
        if (!msg) return;
        
        if (!senderMap.has(msg.senderId)) {
          senderMap.set(msg.senderId, []);
        }
        
        senderMap.get(msg.senderId).push(msg.id);
      });
      
      // Enviar notificações para cada remetente usando a distribuição em tempo real
      for (const [senderId, ids] of senderMap.entries()) {
        distributeRealTimeMessage(
          {
            type: 'messages_read_by_recipient',
            messageIds: ids,
            readBy: req.user.id,
            timestamp: new Date().toISOString()
          },
          {
            recipientId: senderId,
            senderId: req.user.id,
            skipSender: false,
            notifyAdmins: false // Não precisa notificar todos os admins, só o remetente
          }
        );
      }
      
      // Atualizar as conversas para mostrar contadores corretos
      for (const message of messages) {
        if (message && message.conversationId) {
          // Obter a conversa para acessar seus participantes
          const conversation = await storage.getChatConversation(message.conversationId);
          
          if (conversation && conversation.participantIds) {
            // Notificar todos os participantes sobre a atualização na conversa
            for (const participantId of conversation.participantIds) {
              const participantConversations = await storage.getChatConversations(participantId);
              const participantClient = clients.get(Number(participantId));
              
              if (participantClient && participantClient.ws && participantClient.ws.readyState === WebSocket.OPEN) {
                sendWebSocketMessage(participantClient.ws, {
                  type: 'conversations_update',
                  conversations: participantConversations
                });
              }
            }
          }
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erro ao marcar mensagens como lidas:", error);
      res.status(500).json({ message: "Erro ao marcar mensagens como lidas" });
    }
  });
  
  const httpServer = createServer(app);
  
  // Configuração do WebSocket Server para chat em tempo real
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Mapa para rastrear conexões de usuários
  const clients = new Map();
  
  // Mapa para rastrear conexões de administradores
  const adminClients = new Map();
  
  // Mapa para rastrear status online dos usuários
  const onlineStatus = new Map();
  
  // Função utilitária para enviar mensagens via WebSocket com melhor confiabilidade
  const sendWebSocketMessage = (ws, message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        // Adicionar timestamp para evitar duplicação
        if (!message.timestamp) {
          message.timestamp = new Date().toISOString();
        }
        
        ws.send(JSON.stringify(message));
        return true;
      } catch (wsError) {
        console.error(`Erro ao enviar mensagem WebSocket: ${wsError.message}`);
        return false;
      }
    }
    return false;
  };
  
  // Função para distribuir mensagens do chat em tempo real
  const distributeRealTimeMessage = (message, options = {}) => {
    const { 
      recipientId, 
      senderId, 
      conversationId, 
      skipSender = false,
      notifyAdmins = true,
      senderName
    } = options;
    
    let recipientCount = 0;
    let adminCount = 0;
    
    try {
      // 1. Enviar para o destinatário específico
      if (recipientId) {
        const recipientClient = clients.get(Number(recipientId));
        if (recipientClient && recipientClient.ws && recipientClient.ws.readyState === WebSocket.OPEN) {
          sendWebSocketMessage(recipientClient.ws, {
            ...message,
            activeConversationId: conversationId
          });
          recipientCount++;
        }
      }
      
      // 2. Enviar para o remetente (caso não seja para pular)
      if (senderId && !skipSender) {
        const senderClient = clients.get(Number(senderId));
        if (senderClient && senderClient.ws && senderClient.ws.readyState === WebSocket.OPEN) {
          sendWebSocketMessage(senderClient.ws, {
            ...message,
            activeConversationId: conversationId,
            // Marcar como mensagem própria para interface
            isSelfMessage: true
          });
          recipientCount++;
        }
      }
      
      // 3. Notificar todos os administradores
      if (notifyAdmins) {
        adminClients.forEach((adminClient) => {
          if (adminClient.ws && adminClient.ws.readyState === WebSocket.OPEN) {
            sendWebSocketMessage(adminClient.ws, {
              ...message,
              senderName: senderName || 'Usuário',
              // Admin pode estar vendo outra conversa
              activeConversationId: null
            });
            adminCount++;
          }
        });
      }
      
      if (recipientCount > 0 || adminCount > 0) {
        console.log(`Mensagem distribuída em tempo real: ${message.type} | Enviada para ${recipientCount} destinatários e ${adminCount} administradores`);
      }
      return true;
    } catch (error) {
      console.error('Erro ao distribuir mensagem em tempo real:', error);
      return false;
    }
  };
  
  // Função auxiliar para notificar outros clientes sobre status online
  const broadcastUserStatus = (userId, isOnline) => {
    // Obter todas as conversas do usuário
    storage.getChatConversations(userId)
      .then(conversations => {
        // Para cada conversa, notificar os outros participantes
        conversations.forEach(conv => {
          conv.participantIds.forEach(participantId => {
            if (participantId !== userId) {
              const client = clients.get(participantId);
              if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                  type: 'user_status_change',
                  userId: userId,
                  isOnline: isOnline,
                  conversationId: conv.id,
                  timestamp: new Date().toISOString()
                }));
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('Erro ao obter conversas para transmitir status:', error);
      });
  };
  
  // Verifica se uma conversa envolve um administrador
  async function isAdminConversation(conversationId: number): Promise<boolean> {
    try {
      const conversation = await storage.getChatConversation(conversationId);
      if (!conversation) return false;
      
      // Verificar se algum participante é administrador
      const participantIds = conversation.participantIds || [];
      
      for (const participantId of participantIds) {
        const participant = await storage.getUser(participantId);
        if (participant && participant.role === UserRole.ADMIN) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Erro ao verificar se a conversa envolve um administrador:", error);
      return false;
    }
  }

  // Verificar quais administradores estão online
  const getOnlineAdmins = () => {
    const onlineAdmins = [];
    clients.forEach((client, userId) => {
      if (client.userRole === UserRole.ADMIN && client.ws.readyState === WebSocket.OPEN) {
        onlineAdmins.push(userId);
      }
    });
    return onlineAdmins;
  };
  
  wss.on('connection', (ws) => {
    console.log('Nova conexão WebSocket estabelecida');
    
    // Armazenar informações da conexão
    let userId = null;
    let userRole = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Mensagem recebida via WebSocket:', data);
        
        // Autenticação da conexão
        if (data.type === 'auth') {
          userId = data.userId;
          userRole = data.userRole;
          
          // Armazenar cliente no mapa com userId como chave
          clients.set(userId, { ws, userId, userRole });
          
          // Se for admin, adicionar também no mapa de administradores
          if (userRole === UserRole.ADMIN) {
            adminClients.set(userId, { ws, userId, userRole });
            console.log(`Admin ${userId} adicionado ao mapa de adminClients`);
          }
          
          // Marcar usuário como online
          onlineStatus.set(userId, true);
          
          console.log(`Usuário ${userId} (${userRole}) autenticado via WebSocket`);
          
          // Notificar outros usuários sobre o status online
          broadcastUserStatus(userId, true);
          
          // Enviar confirmação para o cliente
          ws.send(JSON.stringify({ 
            type: 'auth_success', 
            userId, 
            userRole,
            timestamp: new Date().toISOString()
          }));
          
          // Se for um usuário regular, enviar status dos administradores online
          if (userRole !== UserRole.ADMIN) {
            const onlineAdmins = getOnlineAdmins();
            ws.send(JSON.stringify({
              type: 'admin_status',
              onlineAdmins,
              timestamp: new Date().toISOString()
            }));
          }
          
          // Buscar conversas existentes para o usuário
          try {
            const conversations = await storage.getChatConversations(userId);
            ws.send(JSON.stringify({ 
              type: 'conversations_update', 
              conversations,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            console.error('Erro ao buscar conversas:', error);
          }
        } 
        // Envio de nova mensagem via WebSocket
        else if (data.type === 'new_message' && userId) {
          console.log('Recebida nova mensagem via WebSocket:', {
            userId,
            data: {
              ...data,
              message: data.message ? `${data.message.substring(0, 30)}...` : "vazia"
            }
          });
          const { receiverId, message: messageText, conversationId, attachment } = data;
          
          // Validar que temos informações necessárias
          if (!receiverId || !messageText) {
            console.error("Dados da mensagem incompletos:", { receiverId, messageText });
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Destinatário e mensagem são obrigatórios',
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          try {
            // Verificar se já existe uma conversa ou criar uma nova
            let actualConversationId = conversationId;
            
            if (!actualConversationId) {
              // Verificar se já existe uma conversa entre esses usuários
              const conversations = await storage.getChatConversations(userId);
              const existingConversation = conversations.find(conv => 
                conv.participantIds.includes(Number(receiverId))
              );
              
              if (existingConversation) {
                actualConversationId = existingConversation.id;
              } else {
                // Criar nova conversa
                console.log("Criando nova conversa entre usuários:", userId, "e", receiverId);
                const newConversation = await storage.createChatConversation({
                  participantIds: [Number(userId), Number(receiverId)],
                  subject: `Conversa entre ${userId} e ${receiverId}`,
                  isActive: true
                });
                
                actualConversationId = newConversation.id;
                console.log("Conversa criada com ID:", actualConversationId);
              }
            }
            
            console.log("Salvando mensagem no banco de dados:", {
              senderId: Number(userId),
              receiverId: Number(receiverId),
              conversationId: actualConversationId,
              message: messageText.substring(0, 30) + '...',
              hasAttachment: !!attachment
            });
            
            // Salvar a mensagem no banco de dados
            const newMessage = await storage.createChatMessage({
              senderId: Number(userId),
              receiverId: Number(receiverId),
              conversationId: actualConversationId,
              message: messageText,
              text: messageText, // Campo text obrigatório pelo schema
              isRead: false,
              attachmentUrl: attachment?.data || null,
              attachmentType: attachment?.type || null,
              attachmentData: attachment?.data || null,
              attachmentSize: attachment?.size || null
            });
            
            console.log("Mensagem criada com sucesso, ID:", newMessage.id);
            
            // Atualizar a última atividade da conversa
            await storage.updateChatConversation(actualConversationId, {
              lastMessageId: newMessage.id,
              lastMessageText: messageText, // Adicionar o texto da mensagem aqui
              lastActivityAt: new Date()
            });
            
            // Enviar confirmação para o remetente
            ws.send(JSON.stringify({
              type: 'message_sent',
              message: newMessage,
              conversationId: actualConversationId,
              timestamp: new Date().toISOString()
            }));
            
            // Enviar a mensagem para o destinatário se estiver online
            const recipientClient = clients.get(Number(receiverId));
            if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
              console.log("Notificando destinatário sobre nova mensagem:", receiverId);
              recipientClient.ws.send(JSON.stringify({
                type: 'new_message_received',
                message: newMessage,
                conversationId: actualConversationId,
                senderId: Number(userId),
                timestamp: new Date().toISOString()
              }));
            } else {
              console.log("Destinatário não está online:", receiverId);
            }
            
            // Notificar todos os administradores, se o destinatário for um admin
            // ou se for uma mensagem destinada a/de um administrador
            const isAdminMessage = await isAdminConversation(actualConversationId);
            if (isAdminMessage) {
              console.log("Notificando administradores sobre nova mensagem");
              console.log("Tamanho do mapa adminClients:", adminClients.size);
              
              // Notificar todos os admins conectados
              adminClients.forEach((adminClient, adminId) => {
                if (adminClient.ws.readyState === WebSocket.OPEN && adminId !== Number(userId)) {
                  console.log(`Enviando notificação para admin ${adminId}`);
                  adminClient.ws.send(JSON.stringify({
                    type: 'new_message_received',
                    message: newMessage,
                    conversationId: actualConversationId,
                    senderId: Number(userId),
                    timestamp: new Date().toISOString()
                  }));
                }
              });
            }
            
            // Atualizar conversas para ambas as partes
            const updatedConversations = await storage.getChatConversations(userId);
            ws.send(JSON.stringify({ 
              type: 'conversations_update', 
              conversations: updatedConversations,
              timestamp: new Date().toISOString()
            }));
            
            if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
              const recipientConversations = await storage.getChatConversations(Number(receiverId));
              recipientClient.ws.send(JSON.stringify({ 
                type: 'conversations_update', 
                conversations: recipientConversations,
                timestamp: new Date().toISOString()
              }));
            }
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Erro ao enviar mensagem',
              timestamp: new Date().toISOString()
            }));
          }
        }
        // Marcar mensagens como lidas
        else if (data.type === 'mark_as_read' && userId) {
          const { messageIds } = data;
          
          if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'IDs de mensagens inválidos',
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          try {
            await storage.markMessagesAsRead(messageIds);
            
            ws.send(JSON.stringify({
              type: 'messages_marked_read',
              messageIds,
              timestamp: new Date().toISOString()
            }));
            
            // Notificar o remetente original que suas mensagens foram lidas
            // Primeiro, buscar as mensagens para saber quem é o remetente
            const messages = await Promise.all(
              messageIds.map(id => storage.getChatMessage(id))
            );
            
            // Agrupar por remetente para enviar uma única notificação por remetente
            const senderMap = new Map();
            messages.forEach(msg => {
              if (!msg) return;
              
              if (!senderMap.has(msg.senderId)) {
                senderMap.set(msg.senderId, []);
              }
              
              senderMap.get(msg.senderId).push(msg.id);
            });
            
            // Enviar notificações para cada remetente usando a função otimizada
            for (const [senderId, ids] of senderMap.entries()) {
              distributeRealTimeMessage(
                {
                  type: 'messages_read_by_recipient',
                  messageIds: ids,
                  readBy: userId,
                  timestamp: new Date().toISOString()
                },
                {
                  recipientId: senderId,
                  senderId: userId,
                  skipSender: false,
                  notifyAdmins: false // Não precisa notificar todos os admins, só o remetente específico
                }
              );
            }
            
            // Atualizar contadores de não lidas nas conversas afetadas
            const conversationIds = new Set<number>();
            messages.forEach(msg => {
              if (msg && msg.conversationId) {
                conversationIds.add(msg.conversationId);
              }
            });
            
            // Para cada conversa afetada, notificar participantes sobre a atualização
            for (const conversationId of conversationIds) {
              // Obter a conversa para acessar seus participantes
              const conversation = await storage.getChatConversation(conversationId);
              
              if (conversation && conversation.participantIds) {
                for (const participantId of conversation.participantIds) {
                  const participantConversations = await storage.getChatConversations(participantId);
                  const participantClient = clients.get(Number(participantId));
                  
                  if (participantClient && participantClient.ws && participantClient.ws.readyState === WebSocket.OPEN) {
                    sendWebSocketMessage(participantClient.ws, {
                      type: 'conversations_update',
                      conversations: participantConversations
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error('Erro ao marcar mensagens como lidas:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Erro ao marcar mensagens como lidas',
              timestamp: new Date().toISOString()
            }));
          }
        }
        // Solicitar histórico de conversa
        else if (data.type === 'get_conversation_history' && userId) {
          const { conversationId, limit, offset } = data;
          
          if (!conversationId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'ID da conversa é obrigatório',
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          try {
            const messages = await storage.getChatMessages({
              conversationId: Number(conversationId),
              limit: limit || 50,
              offset: offset || 0
            });
            
            ws.send(JSON.stringify({
              type: 'conversation_history',
              conversationId,
              messages,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            console.error('Erro ao buscar histórico de conversa:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Erro ao buscar histórico de conversa',
              timestamp: new Date().toISOString()
            }));
          }
        }
        // Verificar digitação
        else if (data.type === 'typing' && userId) {
          const { conversationId, receiverId, isTyping } = data;
          
          if (!conversationId || !receiverId) {
            return; // Silenciosamente ignoramos eventos de digitação inválidos
          }
          
          const recipientClient = clients.get(Number(receiverId));
          if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
            recipientClient.ws.send(JSON.stringify({
              type: 'user_typing',
              conversationId,
              userId,
              isTyping,
              timestamp: new Date().toISOString()
            }));
          }
        }
        // Admin registra recebimento de chat
        else if (data.type === 'admin_chat_register' && userId && userRole === UserRole.ADMIN) {
          console.log(`Administrador ${userId} registrado para receber chats`);
          
          // Registrar admin no mapa adminClients se ainda não estiver
          if (!adminClients.has(userId)) {
            adminClients.set(userId, { ws, userId, userRole });
            console.log(`Admin ${userId} adicionado ao mapa de adminClients (via admin_chat_register)`);
          }
          
          // Não precisamos fazer nada especial aqui, apenas registrar que o admin está online
          // e disponível para receber mensagens
        }
        
        // Admin solicita todas as conversas
        else if (data.type === 'admin_request_conversations' && userId && userRole === UserRole.ADMIN) {
          try {
            // Adicionando log para depuração
            console.log(`Admin ${userId} solicitou todas as conversas - início da busca`);
            
            // Buscar todas as conversas com informações expandidas 
            // (participantes, mensagens recentes, contagem não lida)
            const allConversations = await storage.getAllChatConversations();
            
            // Log para verificar as conversas retornadas
            console.log(`Encontradas ${allConversations.length} conversas para o admin`);
            
            // Para cada conversa, calcular informações adicionais
            const enhancedConversations = await Promise.all(allConversations.map(async (conv) => {
              try {
                // Buscar informações do participante (não admin)
                const participantIds = conv.participantIds.filter(id => id !== Number(userId));
                const participantId = participantIds.length > 0 ? participantIds[0] : null;
                
                // Buscar última mensagem
                const recentMessages = await storage.getChatMessages({
                  conversationId: conv.id,
                  limit: 1
                });
                
                const lastMessage = recentMessages.length > 0 ? recentMessages[0] : null;
                
                // Contar mensagens não lidas manualmente
                // Implementação rápida para contornar a falta do método na interface
                const unreadCount = await (async () => {
                  try {
                    // Buscar mensagens da conversa
                    const messages = await storage.getChatMessages({
                      conversationId: conv.id,
                      limit: 50 // Limitar para evitar sobrecarga
                    });
                    
                    // Filtrar mensagens não lidas onde o admin é o destinatário
                    return messages.filter(msg => 
                      !msg.read && msg.receiverId === Number(userId)
                    ).length;
                  } catch (err) {
                    console.error(`Erro ao calcular mensagens não lidas para conversa ${conv.id}:`, err);
                    return 0;
                  }
                })();
                
                // Buscar informações do participante
                let participantName = "Usuário";
                let participantRole = UserRole.CLIENT;
                
                if (participantId) {
                  const user = await storage.getUser(participantId);
                  if (user) {
                    participantName = user.name || user.username;
                    participantRole = user.role;
                  }
                }
                
                // Retornar conversa com informações adicionais
                return {
                  ...conv,
                  participantId,
                  participantName,
                  participantRole,
                  unreadCount,
                  lastMessageText: lastMessage?.text || "",
                  lastMessageDate: lastMessage?.createdAt || null
                };
              } catch (error) {
                console.error(`Erro ao processar conversa ${conv.id}:`, error);
                return conv; // Retorna conversa original em caso de erro
              }
            }));
            
            // Enviar conversas para o cliente admin
            ws.send(JSON.stringify({
              type: 'admin_conversations_list',
              conversations: enhancedConversations,
              timestamp: new Date().toISOString()
            }));
            
            console.log(`Admin ${userId} - lista de conversas enviada com sucesso`);
          } catch (error) {
            console.error('Erro ao buscar todas as conversas para admin:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Erro ao buscar conversas',
              timestamp: new Date().toISOString()
            }));
          }
        }
        
        // Administrador aceita uma conversa
        else if (data.type === 'admin_accept_conversation' && userId && userRole === UserRole.ADMIN) {
          const { conversationId } = data;
          
          if (!conversationId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'ID da conversa é obrigatório',
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          try {
            // Buscar a conversa
            const conversation = await storage.getChatConversation(conversationId);
            
            if (!conversation) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Conversa não encontrada',
                timestamp: new Date().toISOString()
              }));
              return;
            }
            
            // Marcar a conversa como aceita pelo administrador
            await storage.updateChatConversation(conversationId, {
              isActive: true,
              lastActivityAt: new Date()
            });
            
            // Enviar mensagem de sistema para a conversa
            const systemMessage = await storage.createChatMessage({
              senderId: Number(userId),
              receiverId: conversation.participantIds[0],
              conversationId: conversationId,
              message: "Administrador aceitou a conversa e agora está online para ajudar você.",
              text: "Administrador aceitou a conversa e agora está online para ajudar você.",
              isRead: false,
              isSystemMessage: true
            });
            
            // Atualizar a conversa com a última mensagem
            await storage.updateChatConversationLastMessage(conversationId, systemMessage);
            
            // Enviar confirmação para o administrador
            ws.send(JSON.stringify({
              type: 'admin_conversation_accepted',
              conversationId,
              timestamp: new Date().toISOString()
            }));
            
            // Notificar o participante que o administrador aceitou a conversa
            conversation.participantIds.forEach(participantId => {
              if (participantId !== Number(userId)) {
                const participantClient = clients.get(participantId);
                if (participantClient && participantClient.ws.readyState === WebSocket.OPEN) {
                  participantClient.ws.send(JSON.stringify({
                    type: 'conversation_accepted_by_admin',
                    conversationId,
                    adminId: userId,
                    message: systemMessage,
                    timestamp: new Date().toISOString()
                  }));
                  
                  // Atualizar a lista de conversas para o participante
                  storage.getChatConversations(participantId)
                    .then(participantConversations => {
                      participantClient.ws.send(JSON.stringify({
                        type: 'conversations_update',
                        conversations: participantConversations,
                        timestamp: new Date().toISOString()
                      }));
                    });
                }
              }
            });
            
            // Atualizar a lista de conversas para todos os administradores
            clients.forEach((client, clientUserId) => {
              if (client.userRole === UserRole.ADMIN && client.ws.readyState === WebSocket.OPEN) {
                storage.getAllChatConversations()
                  .then(adminConversations => {
                    client.ws.send(JSON.stringify({
                      type: 'admin_conversations_list',
                      conversations: adminConversations,
                      timestamp: new Date().toISOString()
                    }));
                  });
              }
            });
          } catch (error) {
            console.error('Erro ao aceitar conversa:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Erro ao aceitar conversa',
              timestamp: new Date().toISOString()
            }));
          }
        }
        
        // Excluir conversa de chat (apenas administradores podem fazer isso)
        else if (data.type === 'admin_delete_conversation' && userId && userRole === UserRole.ADMIN) {
          const { conversationId } = data;
          
          if (!conversationId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'ID da conversa é obrigatório',
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          try {
            console.log(`Admin ${userId} solicitou exclusão da conversa ${conversationId}`);
            
            // Buscar a conversa para obter os participantes
            const conversation = await storage.getChatConversation(Number(conversationId));
            
            if (!conversation) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Conversa não encontrada',
                timestamp: new Date().toISOString()
              }));
              return;
            }
            
            // Excluir a conversa e todas as suas mensagens (o método já exclui as mensagens)
            await storage.deleteChatConversation(Number(conversationId));
            
            // Enviar confirmação para o administrador
            ws.send(JSON.stringify({
              type: 'admin_conversation_deleted',
              conversationId,
              success: true,
              timestamp: new Date().toISOString()
            }));
            
            // Notificar o participante que a conversa foi excluída
            conversation.participantIds.forEach(participantId => {
              if (participantId !== Number(userId)) {
                const participantClient = clients.get(participantId);
                if (participantClient && participantClient.ws && participantClient.ws.readyState === WebSocket.OPEN) {
                  participantClient.ws.send(JSON.stringify({
                    type: 'conversation_deleted',
                    conversationId,
                    deletedBy: userId,
                    timestamp: new Date().toISOString()
                  }));
                }
              }
            });
            
            // Atualizar as listas de conversas para todos os administradores
            broadcastToAdmins(async (adminId, adminClient) => {
              // Atualizar a lista de conversas para o administrador
              const adminConversations = await storage.getAllChatConversations();
              
              if (adminClient.ws && adminClient.ws.readyState === WebSocket.OPEN) {
                adminClient.ws.send(JSON.stringify({
                  type: 'conversations_update',
                  conversations: adminConversations,
                  timestamp: new Date().toISOString()
                }));
              }
            });
          } catch (error) {
            console.error('Erro ao excluir conversa:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Erro ao excluir conversa',
              timestamp: new Date().toISOString()
            }));
          }
        }
        
        // Ping/Pong para manter a conexão ativa
        else if (data.type === 'ping') {
          ws.send(JSON.stringify({ 
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });
    
    // Lidar com fechamento da conexão
    ws.on('close', () => {
      console.log(`Conexão WebSocket fechada ${userId ? `para usuário ${userId}` : ''}`);
      
      if (userId) {
        // Remover cliente do mapa de conexões
        clients.delete(Number(userId));
        
        // Se for admin, remover também do mapa de administradores
        if (userRole === UserRole.ADMIN) {
          adminClients.delete(Number(userId));
          console.log(`Admin ${userId} removido do mapa de adminClients`);
        }
        
        // Marcar usuário como offline
        onlineStatus.set(userId, false);
        
        // Notificar outros usuários que este usuário está offline
        broadcastUserStatus(userId, false);
        
        // Se era um administrador, enviar notificação de administrador offline
        // para todos os usuários ativos
        if (userRole === UserRole.ADMIN) {
          clients.forEach((client) => {
            if (client.userRole !== UserRole.ADMIN && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'admin_status',
                onlineAdmins: getOnlineAdmins(),
                timestamp: new Date().toISOString()
              }));
            }
          });
        }
      }
    });
    
    // Enviar heartbeat para manter a conexão ativa
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }));
      } else {
        clearInterval(interval);
      }
    }, 30000);
  });
  
  // ======== ROTAS DO ADMINISTRADOR DE CHAT ========
  
  // Middleware para verificar se o usuário é administrador
  const checkAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    next();
  };
  
  // Obter todas as conversas (para administradores)
  app.get("/api/admin/chat/conversations", checkAdmin, async (req, res) => {
    try {
      // Limitar o número de conversas para evitar ERR_INSUFFICIENT_RESOURCES
      const conversations = await storage.getAllChatConversations();
      
      // Garantir que todas as conversas tenham participantRole e participantName definidos
      const processedConversations = conversations.map(conv => {
        if (conv.participantId && !conv.participantRole) {
          // Tentar determinar o papel do participante com base no ID
          if (conv.participantId >= 100) {
            conv.participantRole = UserRole.SUPPLIER;
          } else {
            conv.participantRole = UserRole.CLIENT;
          }
        }
        
        // Garantir que participantName seja definido
        if (!conv.participantName && conv.participantId) {
          conv.participantName = 'Usuário ' + conv.participantId;
        }
        
        return conv;
      });
      
      res.json(processedConversations);
    } catch (error) {
      console.error("Erro ao buscar conversas para admin:", error);
      res.status(500).json({ message: "Erro ao buscar conversas" });
    }
  });
  
  // Obter mensagens de uma conversa específica (para administradores)
  app.get("/api/admin/chat/messages", checkAdmin, async (req, res) => {
    try {
      const { conversationId, limit, offset } = req.query;
      
      if (!conversationId) {
        return res.status(400).json({ message: "ID da conversa é obrigatório" });
      }
      
      const options: any = {
        conversationId: parseInt(conversationId as string),
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      };
      
      const messages = await storage.getChatMessages(options);
      res.json(messages);
    } catch (error) {
      console.error("Erro ao buscar mensagens para admin:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });
  
  // Enviar mensagem como administrador
  app.post("/api/admin/chat/messages", checkAdmin, async (req, res) => {
    try {
      let messageData = req.body;
      
      // Garantir que o campo text e message sejam sincronizados
      if (messageData.text && !messageData.message) {
        messageData.message = messageData.text;
      } else if (messageData.message && !messageData.text) {
        messageData.text = messageData.message;
      }
      
      // Validação dos dados
      try {
        messageData = insertChatMessageSchema.parse(messageData);
      } catch (e) {
        console.log("Erro de validação:", e);
        // Se falhar a validação, tenta um formato alternativo para compatibilidade
        if (!messageData.message && messageData.text) {
          messageData.message = messageData.text;
        }
        if (!messageData.text && messageData.message) {
          messageData.text = messageData.message;
        }
      }
      
      // Definir o remetente como o administrador
      messageData.senderId = req.user?.id || 1;
      
      // Garantir que a mensagem tenha conteúdo
      if (!messageData.message && !messageData.text && !messageData.attachments) {
        return res.status(400).json({ message: "Mensagem ou anexo é obrigatório" });
      }
      
      console.log("Enviando mensagem como admin:", messageData);
      
      // Salvar a mensagem no banco de dados
      const message = await storage.createChatMessage(messageData);
      
      // Atualizar a última mensagem na conversa
      if (messageData.conversationId) {
        await storage.updateChatConversationLastMessage(messageData.conversationId, message);
        
        // Emitir via WebSocket para o destinatário
        const conversation = await storage.getChatConversation(messageData.conversationId);
        // Obter dados do destinatário e enviar mensagem em tempo real
        let recipientId = null;
        
        // Obter destinatário através do conversation.participantId ou dos participantes da conversa
        if (conversation) {
          if (conversation.participantId) {
            recipientId = conversation.participantId;
          } else if (conversation.participantIds && conversation.participantIds.length > 0) {
            // Encontrar o participante que não é o administrador atual
            recipientId = conversation.participantIds.find(id => id !== req.user.id);
          }
          
          // Obter informações do administrador para a notificação
          const admin = req.user;
          const adminName = admin.name || admin.username || 'Administrador';
          
          // Distribuir mensagem em tempo real usando nossa função otimizada
          distributeRealTimeMessage(
            {
              type: 'new_message_received',
              message,
              senderId: req.user.id,
            },
            {
              recipientId,
              senderId: req.user.id,
              conversationId: messageData.conversationId,
              senderName: adminName,
              skipSender: false, // Enviar ao remetente também para confirmar envio
              notifyAdmins: true // Notificar outros administradores
            }
          );
          
          // Atualizar a lista de conversas para o destinatário
          if (recipientId) {
            const recipientConversations = await storage.getChatConversations(recipientId);
            const recipientClient = clients.get(Number(recipientId));
            if (recipientClient && recipientClient.ws && recipientClient.ws.readyState === WebSocket.OPEN) {
              sendWebSocketMessage(recipientClient.ws, {
                type: 'conversations_update',
                conversations: recipientConversations
              });
            }
          }
        }
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Erro ao enviar mensagem como admin:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });
  
  // Marcar mensagens como lidas (para administradores)
  app.post("/api/admin/chat/mark-read", checkAdmin, async (req, res) => {
    try {
      const { messageIds } = req.body;
      
      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ message: "IDs de mensagens são obrigatórios" });
      }
      
      // Obter as mensagens para determinar participantes
      const messages = await Promise.all(
        messageIds.map(id => storage.getChatMessage(id))
      );
      
      // Filtrar mensagens válidas
      const validMessages = messages.filter(msg => msg !== undefined);
      const validMessageIds = validMessages.map(msg => msg!.id);
      
      // Marcar mensagens como lidas
      await storage.markMessagesAsRead(validMessageIds);
      
      // Agrupar por remetente para enviar uma única notificação por remetente
      const senderMap = new Map();
      validMessages.forEach(msg => {
        if (!msg) return;
        
        if (!senderMap.has(msg.senderId)) {
          senderMap.set(msg.senderId, []);
        }
        
        senderMap.get(msg.senderId).push(msg.id);
      });
      
      // Notificar cada remetente que suas mensagens foram lidas pelo admin
      for (const [senderId, ids] of senderMap.entries()) {
        distributeRealTimeMessage(
          {
            type: 'messages_read_by_admin',
            messageIds: ids,
            readBy: req.user?.id, // ID do admin
            adminName: req.user?.username || 'Administrador',
            timestamp: new Date().toISOString()
          },
          {
            recipientId: senderId,
            senderId: req.user?.id,
            skipSender: false,
            notifyAdmins: true // Notificar outros admins também
          }
        );
      }
      
      // Atualizar contadores de não lidas nas conversas e notificar participantes
      const conversationIds = new Set<number>();
      validMessages.forEach(msg => {
        if (msg && msg.conversationId) {
          conversationIds.add(msg.conversationId);
        }
      });
      
      // Para cada conversa afetada, notificar participantes sobre a atualização
      for (const conversationId of conversationIds) {
        // Obter a conversa para acessar seus participantes
        const conversation = await storage.getChatConversation(conversationId);
        
        if (conversation && conversation.participantIds) {
          for (const participantId of conversation.participantIds) {
            const participantConversations = await storage.getChatConversations(participantId);
            const participantClient = clients.get(Number(participantId));
            
            if (participantClient && participantClient.ws && participantClient.ws.readyState === WebSocket.OPEN) {
              sendWebSocketMessage(participantClient.ws, {
                type: 'conversations_update',
                conversations: participantConversations
              });
            }
          }
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erro ao marcar mensagens como lidas:", error);
      res.status(500).json({ message: "Erro ao marcar mensagens como lidas" });
    }
  });
  
  return httpServer;
}
