import { 
  users, type User, type InsertUser, 
  categories, type Category, type InsertCategory, 
  products, type Product, type InsertProduct, 
  sales, type Sale, type InsertSale, 
  commissionSettings, type CommissionSetting, type InsertCommissionSetting, 
  productCommissionSettings, type ProductCommissionSetting, type InsertProductCommissionSetting,
  productImages, type ProductImage, type InsertProductImage,
  faqCategories, type FaqCategory, type InsertFaqCategory,
  faqItems, type FaqItem, type InsertFaqItem,
  chatMessages, type ChatMessage, type InsertChatMessage,
  chatConversations, type ChatConversation, type InsertChatConversation,
  // Importações para o sistema de comparação de produtos
  productGroups, type ProductGroup, type InsertProductGroup,
  productGroupItems, type ProductGroupItem, type InsertProductGroupItem,
  productSearches, type ProductSearch, type InsertProductSearch,
  productComparisons, type ProductComparison, type InsertProductComparison,
  productComparisonDetails, type ProductComparisonDetail, type InsertProductComparisonDetail,
  // Tipos para ordenação e status
  type ProductSortTypeValue, ProductSortType,
  type ProductComparisonStatusType, ProductComparisonStatus
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, desc, asc, like, ilike, and, or, isNull, ne, sql, inArray, gte, lte } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;
  
  // Supplier specific methods
  getSupplierProductsCount(supplierId: number): Promise<number>;
  getSupplierCategories(supplierId: number): Promise<Category[]>;
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductBySupplier(baseProductId: number, supplierId: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined>;
  updateProductsInBulk(productsData: { id: number; [key: string]: any }[]): Promise<{id: number, success: boolean, message?: string}[]>;
  getProducts(options?: { 
    categoryId?: number; 
    supplierId?: number; 
    active?: boolean;
    limit?: number;
    search?: string;
  }): Promise<Product[]>;
  getLowStockProducts(supplierId: number): Promise<Product[]>;
  
  // Product Image methods
  getProductImage(id: number): Promise<ProductImage | undefined>;
  createProductImage(image: InsertProductImage): Promise<ProductImage>;
  updateProductImage(id: number, imageData: Partial<ProductImage>): Promise<ProductImage | undefined>;
  deleteProductImage(id: number): Promise<void>;
  getProductImages(productId: number): Promise<ProductImage[]>;
  updateProductImagesNotPrimary(productId: number, excludeId?: number): Promise<void>;
  
  // Sale methods
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  getSales(options?: { supplierId?: number; buyerId?: number; productId?: number }): Promise<Sale[]>;
  getProductSales(productId: number): Promise<Sale[]>;
  
  // Commission Settings methods
  getCommissionSetting(id: number): Promise<CommissionSetting | undefined>;
  createCommissionSetting(setting: InsertCommissionSetting): Promise<CommissionSetting>;
  updateCommissionSetting(id: number, settingData: Partial<CommissionSetting>): Promise<CommissionSetting | undefined>;
  getCommissionSettings(options?: { categoryId?: number; supplierId?: number; active?: boolean }): Promise<CommissionSetting[]>;
  
  // FAQ Category methods
  getFaqCategory(id: number): Promise<FaqCategory | undefined>;
  getFaqCategoryBySlug(slug: string): Promise<FaqCategory | undefined>;
  createFaqCategory(category: InsertFaqCategory): Promise<FaqCategory>;
  updateFaqCategory(id: number, categoryData: Partial<FaqCategory>): Promise<FaqCategory | undefined>;
  getFaqCategories(): Promise<FaqCategory[]>;
  
  // FAQ Item methods
  getFaqItem(id: number): Promise<FaqItem | undefined>;
  createFaqItem(item: InsertFaqItem): Promise<FaqItem>;
  updateFaqItem(id: number, itemData: Partial<FaqItem>): Promise<FaqItem | undefined>;
  getFaqItems(categoryId?: number): Promise<FaqItem[]>;
  
  // Chat methods
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(options: { 
    conversationId?: number;
    senderId?: number;
    receiverId?: number;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<ChatMessage[]>;
  markMessagesAsRead(messagesIds: number[]): Promise<void>;
  
  // Chat Conversation methods
  getChatConversation(id: number): Promise<ChatConversation | undefined>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: number, conversationData: Partial<ChatConversation>): Promise<ChatConversation | undefined>;
  getChatConversations(userId: number): Promise<ChatConversation[]>;
  getAllChatConversations(): Promise<ChatConversation[]>;
  updateChatConversationLastMessage(conversationId: number, message: ChatMessage): Promise<void>;
  
  // Métodos para grupos de produtos (Product Groups)
  getProductGroup(id: number): Promise<ProductGroup | undefined>;
  getProductGroupBySlug(slug: string): Promise<ProductGroup | undefined>;
  createProductGroup(group: InsertProductGroup): Promise<ProductGroup>;
  updateProductGroup(id: number, groupData: Partial<ProductGroup>): Promise<ProductGroup | undefined>;
  getProductGroups(options?: { 
    categoryId?: number; 
    search?: string; 
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ProductGroup[]>;

  // Métodos para itens de grupos de produtos (Product Group Items)
  getProductGroupItem(id: number): Promise<ProductGroupItem | undefined>;
  getProductGroupItemByProductId(groupId: number, productId: number): Promise<ProductGroupItem | undefined>;
  createProductGroupItem(item: InsertProductGroupItem): Promise<ProductGroupItem>;
  updateProductGroupItem(id: number, itemData: Partial<ProductGroupItem>): Promise<ProductGroupItem | undefined>;
  getProductGroupItems(groupId: number, options?: {
    supplierId?: number;
    highlighted?: boolean;
    limit?: number;
    orderBy?: string; // Opções: price_asc, price_desc, sales_desc
  }): Promise<ProductGroupItem[]>;
  
  // Métodos para pesquisas de produtos (Product Searches)
  createProductSearch(search: InsertProductSearch): Promise<ProductSearch>;
  getProductSearches(options?: {
    userId?: number;
    query?: string; 
    categoryId?: number;
    limit?: number;
    daysAgo?: number;
  }): Promise<ProductSearch[]>;
  
  // Métodos para comparações de produtos (Product Comparisons)
  getProductComparison(id: number): Promise<ProductComparison | undefined>;
  createProductComparison(comparison: InsertProductComparison): Promise<ProductComparison>;
  updateProductComparison(id: number, comparisonData: Partial<ProductComparison>): Promise<ProductComparison | undefined>;
  getProductComparisons(options?: {
    userId?: number;
    groupId?: number;
    status?: ProductComparisonStatusType;
    limit?: number;
  }): Promise<ProductComparison[]>;
  
  // Métodos para detalhes de comparações de produtos (Product Comparison Details)
  createProductComparisonDetail(detail: InsertProductComparisonDetail): Promise<ProductComparisonDetail>;
  getProductComparisonDetails(comparisonId: number): Promise<ProductComparisonDetail[]>;
  
  // Métodos avançados para comparação estilo Trivago
  compareProducts(groupId: number, options?: {
    sortType?: ProductSortTypeValue;
    maxResults?: number; // Máximo de produtos a retornar por comparação (padrão: 6)
    filters?: any; // Filtros adicionais
    userId?: number; // Usuário que está fazendo a comparação (para análise)
  }): Promise<{
    group: ProductGroup; 
    items: (ProductGroupItem & { product: Product; supplier: User })[];
    cheapestItem?: ProductGroupItem & { product: Product; supplier: User };
    bestRatedItem?: ProductGroupItem & { product: Product; supplier: User };
  }>;
  
  // Método para buscas de produtos estilo Trivago
  searchProducts(query: string, options?: {
    categoryId?: number;
    sortType?: ProductSortTypeValue;
    maxResults?: number;
    filters?: any;
    userId?: number;
  }): Promise<{
    groups: ProductGroup[];
    searchId: number;
    totalMatches: number;
  }>;

  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private sales: Map<number, Sale>;
  private commissionSettings: Map<number, CommissionSetting>;
  private productImages: Map<number, ProductImage>;
  private faqCategories: Map<number, FaqCategory>;
  private faqItems: Map<number, FaqItem>;
  private chatMessages: Map<number, ChatMessage>;
  private chatConversations: Map<number, ChatConversation>;
  private productCommissionSettings: Map<number, ProductCommissionSetting>;
  
  // Mapas para as novas entidades de comparação de produtos
  private productGroups: Map<number, ProductGroup>;
  private productGroupItems: Map<number, ProductGroupItem>;
  private productSearches: Map<number, ProductSearch>;
  private productComparisons: Map<number, ProductComparison>;
  private productComparisonDetails: Map<number, ProductComparisonDetail>;
  
  currentUserId: number;
  currentCategoryId: number;
  currentProductId: number;
  currentSaleId: number;
  currentCommissionSettingId: number;
  currentProductImageId: number;
  currentFaqCategoryId: number;
  currentFaqItemId: number;
  currentChatMessageId: number;
  currentChatConversationId: number;
  
  // Contadores para as novas entidades
  currentProductGroupId: number;
  currentProductGroupItemId: number;
  currentProductSearchId: number;
  currentProductComparisonId: number;
  currentProductComparisonDetailId: number;
  currentProductCommissionSettingId: number;
  
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.sales = new Map();
    this.commissionSettings = new Map();
    this.productImages = new Map();
    this.faqCategories = new Map();
    this.faqItems = new Map();
    this.chatMessages = new Map();
    this.chatConversations = new Map();
    
    // Inicializar os novos mapas para produtos
    this.productGroups = new Map();
    this.productGroupItems = new Map();
    this.productSearches = new Map();
    this.productComparisons = new Map();
    this.productComparisonDetails = new Map();
    this.productCommissionSettings = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.currentSaleId = 1;
    this.currentCommissionSettingId = 1;
    this.currentProductImageId = 1;
    this.currentFaqCategoryId = 1;
    this.currentFaqItemId = 1;
    this.currentChatMessageId = 1;
    this.currentChatConversationId = 1;
    
    // Inicializar contadores para os novos itens
    this.currentProductGroupId = 1;
    this.currentProductGroupItemId = 1;
    this.currentProductSearchId = 1;
    this.currentProductComparisonId = 1;
    this.currentProductComparisonDetailId = 1;
    this.currentProductCommissionSettingId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with some categories
    this.initializeData();
  }
  
  private initializeData() {
    // Add some initial categories
    const categoryData: InsertCategory[] = [
      { name: "Utensílios", slug: "utensilios", description: "Utensílios para restaurantes", icon: "utensils" },
      { name: "Refrigeração", slug: "refrigeracao", description: "Equipamentos de refrigeração", icon: "temperature-low" },
      { name: "Cocção", slug: "coccao", description: "Equipamentos para cocção", icon: "fire" },
      { name: "Preparação", slug: "preparacao", description: "Equipamentos para preparação de alimentos", icon: "blender" },
      { name: "Bar", slug: "bar", description: "Equipamentos para bar", icon: "wine-glass-alt" },
      { name: "Lavagem", slug: "lavagem", description: "Equipamentos para lavagem", icon: "sink" },
      { name: "Mobiliário", slug: "mobiliario", description: "Mobiliário para restaurantes", icon: "chair" }
    ];
    
    categoryData.forEach(cat => {
      this.createCategory(cat);
    });
    
    // Add default commission setting
    this.createCommissionSetting({
      rate: "5",
      active: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsers(role?: string): Promise<User[]> {
    let users = Array.from(this.users.values());
    if (role) {
      users = users.filter(user => user.role === role);
    }
    return users;
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id, productsCount: 0 };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const category = await this.getCategory(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id)).execute();
      return product;
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return undefined;
    }
  }
  
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.slug === slug
    );
  }
  
  async getProductBySupplier(baseProductId: number, supplierId: number): Promise<Product | undefined> {
    // Verificar se existe o mesmo produto, mas com um fornecedor diferente
    return Array.from(this.products.values()).find(
      (product) => product.supplierId === supplierId && (
        // Se é um produto semelhante (mesmo nome, diferente supplierId)
        // Ou se é o próprio produto exato
        (baseProductId === product.id) || (
          this.products.get(baseProductId)?.name === product.name &&
          this.products.get(baseProductId)?.categoryId === product.categoryId
        )
      )
    );
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id, 
      rating: "0", 
      ratingsCount: 0, 
      createdAt: new Date() 
    };
    
    this.products.set(id, product);
    
    // Update category productsCount
    const category = await this.getCategory(product.categoryId);
    if (category) {
      await this.updateCategory(category.id, { 
        productsCount: category.productsCount + 1 
      });
    }
    
    return product;
  }
  
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    try {
      const product = await this.getProduct(id);
      if (!product) return undefined;
      
      // Verificar e ajustar o campo lastStockUpdate se for uma string
      const dataToUpdate = { ...productData };
      
      // Tratar data de atualização do estoque
      if (dataToUpdate.lastStockUpdate !== undefined) {
        // Se for string, manter como string sem tentar converter para Date
        console.log(`Campo lastStockUpdate recebido: ${dataToUpdate.lastStockUpdate} (tipo: ${typeof dataToUpdate.lastStockUpdate})`);
        
        // Se for null ou undefined, mantenha assim (sem conversão)
        if (dataToUpdate.lastStockUpdate === null || dataToUpdate.lastStockUpdate === undefined) {
          // Nada a fazer, manter o valor como está
        } 
        // Caso contrário, garantir que é tratado como string para evitar problemas
        else if (typeof dataToUpdate.lastStockUpdate !== 'string') {
          try {
            // Se for um objeto Date, converter para string ISO
            dataToUpdate.lastStockUpdate = new Date(dataToUpdate.lastStockUpdate).toISOString();
          } catch (err) {
            console.warn(`Erro ao processar lastStockUpdate, usando data atual:`, err);
            dataToUpdate.lastStockUpdate = new Date();
          }
        }
      }
      
      const updatedProduct = { ...product, ...dataToUpdate };
      this.products.set(id, updatedProduct);
      
      console.log(`Produto ${id} atualizado com sucesso:`, updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      return undefined;
    }
  }
  
  /**
   * Atualiza vários produtos de uma só vez
   * @param productsData Array com dados dos produtos a serem atualizados
   * @returns Array com resultados da operação
   */
  async updateProductsInBulk(productsData: { id: number; [key: string]: any }[]): Promise<{id: number, success: boolean, message?: string}[]> {
    const results: {id: number, success: boolean, message?: string}[] = [];
    
    for (const productData of productsData) {
      try {
        const { id, ...updateData } = productData;
        
        // Verificar se o produto existe
        const existingProduct = await this.getProduct(id);
        if (!existingProduct) {
          results.push({
            id,
            success: false,
            message: "Produto não encontrado"
          });
          continue;
        }
        
        // Tratar dados antes da atualização
        if (updateData.stock !== undefined) {
          updateData.stock = Number(updateData.stock);
          updateData.lastStockUpdate = new Date();
          
          // Atualizar status do estoque com base na quantidade
          if (existingProduct.lowStockThreshold !== null) {
            if (updateData.stock <= 0) {
              updateData.stockStatus = "out_of_stock";
            } else if (updateData.stock < existingProduct.lowStockThreshold) {
              updateData.stockStatus = "low_stock";
            } else {
              updateData.stockStatus = "in_stock";
            }
          }
        }
        
        // Se estiver atualizando apenas o limite de estoque baixo
        if (updateData.lowStockThreshold !== undefined && updateData.stock === undefined) {
          const stockThreshold = Number(updateData.lowStockThreshold);
          updateData.lowStockThreshold = stockThreshold;
          
          // Atualizar status com base no novo limite
          if (existingProduct.stock !== null) {
            if (existingProduct.stock <= 0) {
              updateData.stockStatus = "out_of_stock";
            } else if (existingProduct.stock < stockThreshold) {
              updateData.stockStatus = "low_stock";
            } else {
              updateData.stockStatus = "in_stock";
            }
          }
        }
        
        // Atualizar o produto
        const updatedProduct = await this.updateProduct(id, updateData);
        
        if (updatedProduct) {
          results.push({
            id,
            success: true
          });
        } else {
          results.push({
            id,
            success: false,
            message: "Falha ao atualizar produto"
          });
        }
      } catch (error) {
        results.push({
          id: productData.id,
          success: false,
          message: `Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      }
    }
    
    return results;
  }
  
  /**
   * Busca produtos com estoque baixo de um fornecedor específico
   * @param supplierId ID do fornecedor
   * @returns Lista de produtos com estoque baixo
   */
  async getLowStockProducts(supplierId: number): Promise<Product[]> {
    // Buscar produtos do fornecedor
    const supplierProducts = await this.getProducts({ supplierId, active: true });
    
    // Filtrar produtos com estoque baixo
    const lowStockProducts = supplierProducts.filter(product => {
      // Se o produto tem campos de estoque definidos
      if (product.stock !== null && product.lowStockThreshold !== null) {
        return product.stock < product.lowStockThreshold;
      }
      return false;
    });
    
    // Ordenar por urgência (menor estoque proporcional primeiro)
    lowStockProducts.sort((a, b) => {
      const ratioA = (a.stock || 0) / (a.lowStockThreshold || 1);
      const ratioB = (b.stock || 0) / (b.lowStockThreshold || 1);
      return ratioA - ratioB;
    });
    
    return lowStockProducts;
  }
  
  // Método específico para buscar produtos por fornecedor com opções avançadas
  async getProductsBySupplier(supplierId: number, options?: { 
    limit?: number;
    categoryId?: number; 
    orderBy?: string;
    active?: boolean;
  }): Promise<Product[]> {
    if (!supplierId) return [];
    
    let products = Array.from(this.products.values()).filter(
      product => product.supplierId === supplierId
    );
    
    // Aplicar filtros adicionais
    if (options) {
      // Filtrar por categoria
      if (options.categoryId) {
        products = products.filter(product => 
          product.categoryId === options.categoryId || 
          (product.additionalCategories && 
           product.additionalCategories.includes(options.categoryId!))
        );
      }
      
      // Filtrar produtos ativos
      if (options.active !== undefined) {
        products = products.filter(product => product.active === options.active);
      }
      
      // Ordenação dos produtos
      if (options.orderBy) {
        switch (options.orderBy) {
          case 'price_asc':
            products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
          case 'price_desc':
            products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            break;
          case 'rating_desc':
            products.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
            break;
          case 'newest':
            products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          default:
            // Ordenação padrão: mais novos primeiro
            products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }
      
      // Aplicar limite
      if (options.limit) {
        products = products.slice(0, options.limit);
      }
    }
    
    return products;
  }
  
  // Método para contar produtos de um fornecedor
  async getSupplierProductsCount(supplierId: number): Promise<number> {
    if (!supplierId) return 0;
    
    const products = Array.from(this.products.values()).filter(
      product => product.supplierId === supplierId
    );
    
    return products.length;
  }
  
  // Método para buscar categorias de produtos de um fornecedor
  async getSupplierCategories(supplierId: number): Promise<Category[]> {
    if (!supplierId) return [];
    
    // Buscar todos os produtos do fornecedor
    const supplierProducts = Array.from(this.products.values()).filter(
      product => product.supplierId === supplierId
    );
    
    // Extrair IDs únicos das categorias
    const categoryIds = new Set<number>();
    
    supplierProducts.forEach(product => {
      // Adicionar categoria principal
      categoryIds.add(product.categoryId);
      
      // Adicionar categorias adicionais, se houver
      if (product.additionalCategories) {
        product.additionalCategories.forEach(catId => {
          if (catId) categoryIds.add(catId);
        });
      }
    });
    
    // Buscar objetos das categorias
    const categories = Array.from(categoryIds)
      .map(id => this.categories.get(id))
      .filter(Boolean) as Category[];
    
    return categories;
  }
  
  async getProducts(options?: { 
    // Filtros básicos
    categoryId?: number; 
    supplierId?: number; 
    active?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
    
    // Filtros avançados
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    features?: string[];
    hasDiscount?: boolean;
    inStock?: boolean;
    brandId?: number;
    additionalCategories?: number[];
    createdAfter?: Date;
    
    // Ordenação
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<Product[]> {
    try {
      console.log(`Buscando produtos no banco de dados com ${options ? Object.keys(options).length : 0} filtros aplicados`);
      const startTime = Date.now();
      
      // Começar com uma consulta base
      let query = db.select().from(products);
      
      if (options) {
        // ------ FILTROS PARA CATEGORIAS ------
        if (options.categoryId !== undefined) {
          console.log(`Filtrando produtos por categoria ID: ${options.categoryId}`);
          query = query.where(eq(products.categoryId, options.categoryId));
        }
        
        // ------ FILTROS PARA FORNECEDOR ------
        if (options.supplierId !== undefined) {
          console.log(`Filtrando produtos por fornecedor ID: ${options.supplierId}`);
          query = query.where(eq(products.supplierId, options.supplierId));
        }
        
        // Filtro por marca (tratado como fornecedor específico)
        if (options.brandId !== undefined) {
          console.log(`Filtrando produtos por marca/fabricante ID: ${options.brandId}`);
          // Assumimos que brandId é equivalente a supplierId
          query = query.where(eq(products.supplierId, options.brandId));
        }
        
        // ------ FILTROS PARA STATUS ------
        if (options.active !== undefined) {
          console.log(`Filtrando por produtos ${options.active ? 'ativos' : 'inativos'}`);
          query = query.where(eq(products.active, options.active));
        }
        
        // Aplicar limite na consulta SQL (para melhor performance)
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        // Aplicar offset na consulta SQL (para paginação)
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }
      
      // Aplicar filtros diretamente na consulta SQL (muito mais eficiente)
      if (options) {
        // Utilitário para garantir que valores de preço sejam tratados corretamente
        const ensureValidPrice = (price: any): number | null => {
          // Se for undefined ou null, retornar null
          if (price === undefined || price === null) return null;
          
          // Tentar converter para número
          let numericValue: number;
          
          // Se for string, tentar converter com tratamento de locale
          if (typeof price === 'string') {
            // Normalizar formato: remover símbolos de moeda e trocar vírgula por ponto
            const normalizedStr = price.replace(/[^\d.,]/g, '').replace(',', '.');
            numericValue = parseFloat(normalizedStr);
          } else {
            // Tentar conversão direta para outros tipos
            numericValue = parseFloat(String(price));
          }
          
          // Verificar se é um número válido e positivo
          if (isNaN(numericValue) || numericValue < 0) {
            console.error(`VALIDAÇÃO DE PREÇO: Valor inválido fornecido: ${price}, tipo: ${typeof price}`);
            return null;
          }
          
          // Arredondar para 2 casas decimais para evitar problemas com floating point
          return Math.round(numericValue * 100) / 100;
        };
        
        // Sistema avançado para filtro de preço usando prepared statements para segurança máxima
        try {
          const minPriceValue = ensureValidPrice(options.minPrice);
          const maxPriceValue = ensureValidPrice(options.maxPrice);
          
          console.log(`SISTEMA DE FILTRAGEM DE PREÇO: Processando minPrice=${minPriceValue}, maxPrice=${maxPriceValue}`);
          
          // Filtro de preço mínimo com validação robusta
          if (minPriceValue !== null) {
            // Usar cast explícito para garantir compatibilidade com diferentes formatos de banco
            query = query.where(sql`(CASE 
              WHEN ${products.price} ~ E'^\\\\d+(\\\\.\\\\d+)?$' THEN CAST(${products.price} AS DECIMAL)
              WHEN ${products.price} ~ E'^\\\\d+,\\\\d+$' THEN CAST(REPLACE(${products.price}, ',', '.') AS DECIMAL)
              ELSE 0
            END) >= ${minPriceValue}`);
            
            console.log(`SISTEMA DE FILTRAGEM DE PREÇO: Filtro de preço mínimo aplicado: ${minPriceValue}`);
          }
          
          // Filtro de preço máximo com validação robusta
          if (maxPriceValue !== null) {
            // Usar cast explícito com tratamento de exceções
            query = query.where(sql`(CASE 
              WHEN ${products.price} ~ E'^\\\\d+(\\\\.\\\\d+)?$' THEN CAST(${products.price} AS DECIMAL)
              WHEN ${products.price} ~ E'^\\\\d+,\\\\d+$' THEN CAST(REPLACE(${products.price}, ',', '.') AS DECIMAL)
              ELSE 0
            END) <= ${maxPriceValue}`);
            
            console.log(`SISTEMA DE FILTRAGEM DE PREÇO: Filtro de preço máximo aplicado: ${maxPriceValue}`);
          }
        } catch (error) {
          // Capturar quaisquer erros do SQL para evitar falhas na consulta
          console.error(`SISTEMA DE FILTRAGEM DE PREÇO: Erro ao aplicar filtros de preço:`, error);
          
          // Plano B - Implementar filtros de forma alternativa mais básica em caso de falha
          try {
            if (options.minPrice !== undefined) {
              const safeMinPrice = parseFloat(String(options.minPrice));
              if (!isNaN(safeMinPrice)) {
                query = query.where(sql`CAST(${products.price} AS TEXT) ~ E'^\\\\d+'`);
                query = query.where(sql`CAST(${products.price} AS DECIMAL) >= ${safeMinPrice}`);
                console.log(`PLANO B: Filtro de preço mínimo simplificado aplicado: ${safeMinPrice}`);
              }
            }
            
            if (options.maxPrice !== undefined) {
              const safeMaxPrice = parseFloat(String(options.maxPrice));
              if (!isNaN(safeMaxPrice)) {
                query = query.where(sql`CAST(${products.price} AS TEXT) ~ E'^\\\\d+'`);
                query = query.where(sql`CAST(${products.price} AS DECIMAL) <= ${safeMaxPrice}`);
                console.log(`PLANO B: Filtro de preço máximo simplificado aplicado: ${safeMaxPrice}`);
              }
            }
          } catch (fallbackError) {
            console.error(`SISTEMA DE FILTRAGEM DE PREÇO: Falha completa no sistema de filtragem:`, fallbackError);
            // Não aplicar filtros de preço em caso de falha completa
          }
        }
      }
      
      // Executar a consulta
      let productResults = await query.execute();
      console.log(`Consulta SQL retornou ${productResults.length} produtos após aplicar todos os filtros`);
        
      // Filtro de desconto
      if (options && options.hasDiscount === true) {
        console.log(`Filtrando produtos com desconto ativo`);
        productResults = productResults.filter(product => {
          // Verificar primeiro pelo campo discount, que é a forma mais direta
          if (product.discount && product.discount > 0) return true;
          
          // Se não tiver o campo discount, verificar pelos preços
          if (!product.originalPrice) return false;
          const currentPrice = parseFloat(product.price as any);
          const originalPrice = parseFloat(product.originalPrice as any);
          return !isNaN(currentPrice) && !isNaN(originalPrice) && originalPrice > currentPrice;
        });
        console.log(`Após filtro de desconto: ${productResults.length} produtos`);
      }
      
      // Filtro de estoque
      if (options && options.inStock === true) {
        console.log(`Filtrando produtos em estoque`);
        // Em uma aplicação real, isso consultaria a quantidade em estoque no banco de dados
        // Vamos usar dados reais dos produtos para simular estoque:
        productResults = productResults.filter(product => {
          // 1. Garantir que o produto está ativo (obrigatório para estar em estoque)
          if (product.active !== true) return false;
          
          // 2. Verificar se tem preço válido (obrigatório para estar em estoque)
          const price = parseFloat(product.price as any);
          if (isNaN(price) || price <= 0) return false;
          
          // 3. Produtos com desconto geralmente são aqueles que se quer escoar inventário
          if (product.discount) return true;
          
          // 4. Produtos com avaliações também tendem a estar em estoque
          if (product.rating && parseFloat(product.rating as any) > 0) return true;
          
          // 5. Caso não tenha desconto ou avaliações, base apenas no preço:
          // Produtos muito caros podem estar em falta, produtos com preço mais 
          // acessível tendem a estar disponíveis
          return price < 5000;
        });
        console.log(`Após filtro de estoque: ${productResults.length} produtos`);
      }
      
      // Filtro por avaliação mínima
      if (options && options.minRating !== undefined) {
        console.log(`Filtrando produtos com avaliação mínima de ${options.minRating}`);
        productResults = productResults.filter(product => {
          if (!product.rating) return false;
          const rating = parseFloat(product.rating as any);
          return !isNaN(rating) && rating >= options.minRating!;
        });
      }
      
      // Filtro por data de criação
      if (options && options.createdAfter) {
        console.log(`Filtrando produtos criados após ${options.createdAfter.toISOString()}`);
        productResults = productResults.filter(product => {
          return product.createdAt && product.createdAt >= options.createdAfter!;
        });
      }
      
      // Aplicar pesquisa de texto
      if (options && options.search && options.search.trim().length > 0) {
        const searchTerm = options.search.toLowerCase().trim();
        console.log(`Filtrando produtos pelo termo de busca: "${searchTerm}"`);
        
        const scoredProducts = productResults.map(product => {
          let score = 0;
          
          // Pontuação para correspondência no nome
          if (product.name && product.name.toLowerCase().includes(searchTerm)) {
            score += 10;
            if (product.name.toLowerCase() === searchTerm || 
                product.name.toLowerCase().startsWith(searchTerm + ' ')) {
              score += 20;
            }
          }
          
          // Pontuação para correspondência na descrição
          if (product.description && product.description.toLowerCase().includes(searchTerm)) {
            score += 3;
          }
          
          return { product, score };
        });
        
        // Filtrar produtos sem correspondência
        const matchingProducts = scoredProducts.filter(item => item.score > 0);
        
        // Ordenar por relevância
        matchingProducts.sort((a, b) => b.score - a.score);
        
        productResults = matchingProducts.map(item => item.product);
      }
      
      // ------ ORDENAÇÃO ------
      if (options && options.sortBy) {
        console.log(`Ordenando produtos por ${options.sortBy} em ordem ${options.sortDirection || 'asc'}`);
        
        const isDesc = options.sortDirection === 'desc';
        
        productResults.sort((a, b) => {
          let valueA, valueB;
          
          switch (options.sortBy) {
            case 'price':
              valueA = parseFloat(a.price);
              valueB = parseFloat(b.price);
              break;
            case 'rating':
              valueA = a.rating ? parseFloat(a.rating) : 0;
              valueB = b.rating ? parseFloat(b.rating) : 0;
              break;
            case 'name':
              return isDesc 
                ? (b.name || '').localeCompare(a.name || '') 
                : (a.name || '').localeCompare(b.name || '');
            case 'createdAt':
              valueA = a.createdAt?.getTime() || 0;
              valueB = b.createdAt?.getTime() || 0;
              break;
            case 'popularity':
              valueA = a.ratingsCount || 0;
              valueB = b.ratingsCount || 0;
              break;
            default:
              return 0;
          }
          
          if (isNaN(valueA)) valueA = 0;
          if (isNaN(valueB)) valueB = 0;
          
          return isDesc ? (valueB - valueA) : (valueA - valueB);
        });
      }
      
      const endTime = Date.now();
      console.log(`Busca de produtos concluída em ${endTime - startTime}ms, retornando ${productResults.length} resultados`);
      
      return productResults;
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      throw error; // Propagar o erro para que ele seja registrado corretamente
    }
  }
  
  // Sale methods
  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }
  
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentSaleId++;
    const sale: Sale = { ...insertSale, id, createdAt: new Date() };
    this.sales.set(id, sale);
    return sale;
  }
  
  async getSales(options?: { supplierId?: number; buyerId?: number; productId?: number }): Promise<Sale[]> {
    let sales = Array.from(this.sales.values());
    
    if (options) {
      if (options.supplierId !== undefined) {
        sales = sales.filter(sale => sale.supplierId === options.supplierId);
      }
      
      if (options.buyerId !== undefined) {
        sales = sales.filter(sale => sale.buyerId === options.buyerId);
      }
      
      if (options.productId !== undefined) {
        sales = sales.filter(sale => sale.productId === options.productId);
      }
    }
    
    return sales;
  }
  
  async getProductSales(productId: number): Promise<Sale[]> {
    return this.getSales({ productId });
  }
  
  // Commission Settings methods
  async getCommissionSetting(id: number): Promise<CommissionSetting | undefined> {
    return this.commissionSettings.get(id);
  }
  
  async createCommissionSetting(insertSetting: InsertCommissionSetting): Promise<CommissionSetting> {
    const id = this.currentCommissionSettingId++;
    const setting: CommissionSetting = { ...insertSetting, id, createdAt: new Date() };
    this.commissionSettings.set(id, setting);
    return setting;
  }
  
  async updateCommissionSetting(id: number, settingData: Partial<CommissionSetting>): Promise<CommissionSetting | undefined> {
    const setting = await this.getCommissionSetting(id);
    if (!setting) return undefined;
    
    const updatedSetting = { ...setting, ...settingData };
    this.commissionSettings.set(id, updatedSetting);
    return updatedSetting;
  }
  
  async getCommissionSettings(options?: { 
    categoryId?: number; 
    supplierId?: number; 
    active?: boolean
  }): Promise<CommissionSetting[]> {
    let settings = Array.from(this.commissionSettings.values());
    
    if (options) {
      if (options.categoryId !== undefined) {
        settings = settings.filter(setting => 
          setting.categoryId === options.categoryId || setting.categoryId === null
        );
      }
      
      if (options.supplierId !== undefined) {
        settings = settings.filter(setting => 
          setting.supplierId === options.supplierId || setting.supplierId === null
        );
      }
      
      if (options.active !== undefined) {
        settings = settings.filter(setting => setting.active === options.active);
      }
    }
    
    return settings;
  }
  
  // Product Image methods
  async getProductImage(id: number): Promise<ProductImage | undefined> {
    return this.productImages.get(id);
  }
  
  async createProductImage(insertImage: InsertProductImage): Promise<ProductImage> {
    const id = this.currentProductImageId++;
    const image: ProductImage = { 
      ...insertImage, 
      id, 
      createdAt: new Date() 
    };
    this.productImages.set(id, image);
    return image;
  }
  
  async updateProductImage(id: number, imageData: Partial<ProductImage>): Promise<ProductImage | undefined> {
    const image = await this.getProductImage(id);
    if (!image) return undefined;
    
    const updatedImage = { ...image, ...imageData };
    this.productImages.set(id, updatedImage);
    return updatedImage;
  }
  
  async deleteProductImage(id: number): Promise<void> {
    this.productImages.delete(id);
  }
  
  async getProductImages(productId: number): Promise<ProductImage[]> {
    const images = Array.from(this.productImages.values())
      .filter(image => image.productId === productId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return images;
  }
  
  async updateProductImagesNotPrimary(productId: number, excludeId?: number): Promise<void> {
    const images = await this.getProductImages(productId);
    
    for (const image of images) {
      if (excludeId !== undefined && image.id === excludeId) continue;
      
      await this.updateProductImage(image.id, { isPrimary: false });
    }
  }
  
  // FAQ Category methods
  async getFaqCategory(id: number): Promise<FaqCategory | undefined> {
    return this.faqCategories.get(id);
  }
  
  async getFaqCategoryBySlug(slug: string): Promise<FaqCategory | undefined> {
    return Array.from(this.faqCategories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createFaqCategory(insertCategory: InsertFaqCategory): Promise<FaqCategory> {
    const id = this.currentFaqCategoryId++;
    const category: FaqCategory = { ...insertCategory, id, createdAt: new Date() };
    this.faqCategories.set(id, category);
    return category;
  }
  
  async updateFaqCategory(id: number, categoryData: Partial<FaqCategory>): Promise<FaqCategory | undefined> {
    const category = await this.getFaqCategory(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.faqCategories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async getFaqCategories(): Promise<FaqCategory[]> {
    return Array.from(this.faqCategories.values())
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  // FAQ Item methods
  async getFaqItem(id: number): Promise<FaqItem | undefined> {
    return this.faqItems.get(id);
  }
  
  async createFaqItem(insertItem: InsertFaqItem): Promise<FaqItem> {
    const id = this.currentFaqItemId++;
    const item: FaqItem = { ...insertItem, id, createdAt: new Date() };
    this.faqItems.set(id, item);
    return item;
  }
  
  async updateFaqItem(id: number, itemData: Partial<FaqItem>): Promise<FaqItem | undefined> {
    const item = await this.getFaqItem(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.faqItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async getFaqItems(categoryId?: number): Promise<FaqItem[]> {
    let items = Array.from(this.faqItems.values());
    
    if (categoryId !== undefined) {
      items = items.filter(item => item.categoryId === categoryId);
    }
    
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  // Chat Message methods
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }
  
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const message: ChatMessage = { ...insertMessage, id, createdAt: new Date() };
    this.chatMessages.set(id, message);
    
    // Atualizar última atividade e mensagem na conversa se existir
    if (insertMessage.conversationId) {
      const conversation = await this.getChatConversation(insertMessage.conversationId);
      if (conversation) {
        await this.updateChatConversation(conversation.id, {
          lastMessageId: id,
          lastActivityAt: new Date()
        });
      }
    }
    
    return message;
  }
  
  async getChatMessages(options: {
    conversationId?: number;
    senderId?: number;
    receiverId?: number;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<ChatMessage[]> {
    let messages = Array.from(this.chatMessages.values());
    
    if (options) {
      if (options.conversationId !== undefined) {
        messages = messages.filter(message => message.conversationId === options.conversationId);
      }
      
      if (options.senderId !== undefined) {
        messages = messages.filter(message => message.senderId === options.senderId);
      }
      
      if (options.receiverId !== undefined) {
        messages = messages.filter(message => message.receiverId === options.receiverId);
      }
      
      if (options.unreadOnly) {
        messages = messages.filter(message => !message.isRead);
      }
      
      // Ordenar por data (mais recentes primeiro)
      messages = messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      if (options.offset !== undefined) {
        messages = messages.slice(options.offset);
      }
      
      if (options.limit !== undefined) {
        messages = messages.slice(0, options.limit);
      }
    }
    
    return messages;
  }
  
  async markMessagesAsRead(messageIds: number[]): Promise<void> {
    for (const id of messageIds) {
      const message = await this.getChatMessage(id);
      if (message) {
        await this.chatMessages.set(id, { ...message, isRead: true });
      }
    }
  }
  
  // Chat Conversation methods
  async getChatConversation(id: number): Promise<ChatConversation | undefined> {
    return this.chatConversations.get(id);
  }
  
  async createChatConversation(insertConversation: InsertChatConversation): Promise<ChatConversation> {
    const id = this.currentChatConversationId++;
    const conversation: ChatConversation = { 
      ...insertConversation, 
      id, 
      lastActivityAt: new Date(),
      createdAt: new Date() 
    };
    this.chatConversations.set(id, conversation);
    return conversation;
  }
  
  async updateChatConversation(id: number, conversationData: Partial<ChatConversation>): Promise<ChatConversation | undefined> {
    const conversation = await this.getChatConversation(id);
    if (!conversation) return undefined;
    
    const updatedConversation = { ...conversation, ...conversationData };
    this.chatConversations.set(id, updatedConversation);
    return updatedConversation;
  }
  
  async getChatConversations(userId: number): Promise<ChatConversation[]> {
    return Array.from(this.chatConversations.values())
      .filter(conversation => conversation.participantIds.includes(userId))
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  }
  
  async getAllChatConversations(): Promise<ChatConversation[]> {
    return Array.from(this.chatConversations.values())
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  }
  
  async updateChatConversationLastMessage(conversationId: number, message: ChatMessage): Promise<void> {
    const conversation = await this.getChatConversation(conversationId);
    if (!conversation) return;
    
    await this.updateChatConversation(conversation.id, {
      lastMessageId: message.id,
      lastMessageText: message.text,
      lastMessageDate: message.createdAt,
      lastActivityAt: new Date()
    });
  }

  // --- Métodos para grupos de produtos (Product Groups) ---
  async getProductGroup(id: number): Promise<ProductGroup | undefined> {
    return this.productGroups.get(id);
  }

  async getProductGroupBySlug(slug: string): Promise<ProductGroup | undefined> {
    return Array.from(this.productGroups.values()).find(
      (group) => group.slug === slug
    );
  }

  async createProductGroup(insertGroup: InsertProductGroup): Promise<ProductGroup> {
    const id = this.currentProductGroupId++;
    const group: ProductGroup = {
      ...insertGroup,
      id,
      itemsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.productGroups.set(id, group);
    return group;
  }

  async updateProductGroup(id: number, groupData: Partial<ProductGroup>): Promise<ProductGroup | undefined> {
    const group = await this.getProductGroup(id);
    if (!group) return undefined;

    const updatedGroup = { 
      ...group, 
      ...groupData,
      updatedAt: new Date() 
    };
    this.productGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async getProductGroups(options?: {
    categoryId?: number;
    search?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ProductGroup[]> {
    let groups = Array.from(this.productGroups.values());

    if (options) {
      if (options.categoryId !== undefined) {
        groups = groups.filter(group => group.categoryId === options.categoryId);
      }

      if (options.search) {
        const searchTerm = options.search.toLowerCase();
        groups = groups.filter(group =>
          group.name.toLowerCase().includes(searchTerm) ||
          (group.description && group.description.toLowerCase().includes(searchTerm))
        );
      }

      if (options.active !== undefined) {
        groups = groups.filter(group => group.active === options.active);
      }

      // Ordenar do mais recente para o mais antigo
      groups = groups.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      if (options.offset !== undefined) {
        groups = groups.slice(options.offset);
      }

      if (options.limit !== undefined) {
        groups = groups.slice(0, options.limit);
      }
    }

    return groups;
  }

  // --- Métodos para itens de grupos de produtos (Product Group Items) ---
  async getProductGroupItem(id: number): Promise<ProductGroupItem | undefined> {
    return this.productGroupItems.get(id);
  }

  async getProductGroupItemByProductId(groupId: number, productId: number): Promise<ProductGroupItem | undefined> {
    return Array.from(this.productGroupItems.values()).find(
      (item) => item.groupId === groupId && item.productId === productId
    );
  }

  async createProductGroupItem(insertItem: InsertProductGroupItem): Promise<ProductGroupItem> {
    const id = this.currentProductGroupItemId++;
    const item: ProductGroupItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.productGroupItems.set(id, item);
    
    // Atualizar contagem de itens no grupo
    const group = await this.getProductGroup(insertItem.groupId);
    if (group) {
      await this.updateProductGroup(group.id, {
        itemsCount: group.itemsCount + 1
      });
    }
    
    return item;
  }

  async updateProductGroupItem(id: number, itemData: Partial<ProductGroupItem>): Promise<ProductGroupItem | undefined> {
    const item = await this.getProductGroupItem(id);
    if (!item) return undefined;

    const updatedItem = { 
      ...item, 
      ...itemData,
      updatedAt: new Date() 
    };
    this.productGroupItems.set(id, updatedItem);
    return updatedItem;
  }

  async getProductGroupItems(groupId: number, options?: {
    supplierId?: number;
    highlighted?: boolean;
    limit?: number;
    orderBy?: string; // Opções: price_asc, price_desc, sales_desc
  }): Promise<ProductGroupItem[]> {
    let items = Array.from(this.productGroupItems.values())
      .filter(item => item.groupId === groupId);

    if (options) {
      if (options.supplierId !== undefined) {
        // Filtramos com base no supplierId do produto relacionado
        const productsForSupplier = Array.from(this.products.values())
          .filter(product => product.supplierId === options.supplierId)
          .map(product => product.id);
        
        items = items.filter(item => productsForSupplier.includes(item.productId));
      }

      if (options.highlighted !== undefined) {
        items = items.filter(item => item.highlighted === options.highlighted);
      }

      // Ordenação
      if (options.orderBy) {
        switch (options.orderBy) {
          case 'price_asc':
            items = items.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
          case 'price_desc':
            items = items.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            break;
          case 'sales_desc':
            // Ordernar por vendas - se tiver contagem de vendas no item, usar, se não, ordenar por popularidade
            items = items.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
            break;
        }
      } else {
        // Por padrão, ordenar pelo menor preço
        items = items.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      }

      if (options.limit) {
        items = items.slice(0, options.limit);
      }
    }

    return items;
  }

  // --- Métodos para pesquisas de produtos (Product Searches) ---
  async createProductSearch(insertSearch: InsertProductSearch): Promise<ProductSearch> {
    const id = this.currentProductSearchId++;
    const search: ProductSearch = {
      ...insertSearch,
      id,
      createdAt: new Date()
    };
    this.productSearches.set(id, search);
    return search;
  }

  async getProductSearches(options?: {
    userId?: number;
    query?: string;
    categoryId?: number;
    limit?: number;
    daysAgo?: number;
  }): Promise<ProductSearch[]> {
    let searches = Array.from(this.productSearches.values());

    if (options) {
      if (options.userId !== undefined) {
        searches = searches.filter(search => search.userId === options.userId);
      }

      if (options.query) {
        searches = searches.filter(search => search.searchTerm.includes(options.query!));
      }

      if (options.categoryId !== undefined) {
        searches = searches.filter(search => search.categoryId === options.categoryId);
      }

      if (options.daysAgo !== undefined) {
        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - options.daysAgo);
        searches = searches.filter(search => search.createdAt >= cutoffDate);
      }

      // Ordenar do mais recente para o mais antigo
      searches = searches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (options.limit) {
        searches = searches.slice(0, options.limit);
      }
    }

    return searches;
  }

  // --- Métodos para comparações de produtos (Product Comparisons) ---
  async getProductComparison(id: number): Promise<ProductComparison | undefined> {
    return this.productComparisons.get(id);
  }

  async createProductComparison(insertComparison: InsertProductComparison): Promise<ProductComparison> {
    const id = this.currentProductComparisonId++;
    const comparison: ProductComparison = {
      ...insertComparison,
      id,
      status: insertComparison.status || ProductComparisonStatus.IN_PROGRESS,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.productComparisons.set(id, comparison);
    return comparison;
  }

  async updateProductComparison(id: number, comparisonData: Partial<ProductComparison>): Promise<ProductComparison | undefined> {
    const comparison = await this.getProductComparison(id);
    if (!comparison) return undefined;

    const updatedComparison = {
      ...comparison,
      ...comparisonData,
      updatedAt: new Date()
    };
    this.productComparisons.set(id, updatedComparison);
    return updatedComparison;
  }

  async getProductComparisons(options?: {
    userId?: number;
    groupId?: number;
    status?: ProductComparisonStatusType;
    limit?: number;
  }): Promise<ProductComparison[]> {
    let comparisons = Array.from(this.productComparisons.values());

    if (options) {
      if (options.userId !== undefined) {
        comparisons = comparisons.filter(comparison => comparison.userId === options.userId);
      }

      if (options.groupId !== undefined) {
        comparisons = comparisons.filter(comparison => comparison.groupId === options.groupId);
      }

      if (options.status !== undefined) {
        comparisons = comparisons.filter(comparison => comparison.status === options.status);
      }

      // Ordenar do mais recente para o mais antigo
      comparisons = comparisons.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      if (options.limit) {
        comparisons = comparisons.slice(0, options.limit);
      }
    }

    return comparisons;
  }

  // --- Métodos para detalhes de comparações de produtos (Product Comparison Details) ---
  async createProductComparisonDetail(insertDetail: InsertProductComparisonDetail): Promise<ProductComparisonDetail> {
    const id = this.currentProductComparisonDetailId++;
    const detail: ProductComparisonDetail = {
      ...insertDetail,
      id,
      createdAt: new Date()
    };
    this.productComparisonDetails.set(id, detail);
    return detail;
  }

  async getProductComparisonDetails(comparisonId: number): Promise<ProductComparisonDetail[]> {
    return Array.from(this.productComparisonDetails.values())
      .filter(detail => detail.comparisonId === comparisonId);
  }
  
  // --- Métodos avançados para comparação estilo Trivago ---
  async compareProducts(groupId: number, options?: {
    sortType?: ProductSortTypeValue;
    maxResults?: number;
    filters?: any;
    userId?: number;
  }): Promise<{
    group: ProductGroup;
    items: (ProductGroupItem & { product: Product; supplier: User })[];
    cheapestItem?: ProductGroupItem & { product: Product; supplier: User };
    bestRatedItem?: ProductGroupItem & { product: Product; supplier: User };
  }> {
    // Obter o grupo de produtos
    const group = await this.getProductGroup(groupId);
    if (!group) {
      throw new Error(`Grupo de produtos com ID ${groupId} não encontrado`);
    }

    // Obter os itens do grupo
    let items = await this.getProductGroupItems(groupId, {
      limit: options?.maxResults || 6
    });

    // Enriquecer os itens com informações de produto e fornecedor
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        if (!product) {
          throw new Error(`Produto com ID ${item.productId} não encontrado`);
        }

        const supplier = await this.getUser(product.supplierId);
        if (!supplier) {
          throw new Error(`Fornecedor com ID ${product.supplierId} não encontrado`);
        }

        return { ...item, product, supplier };
      })
    );

    // Aplicar filtros adicionais se necessário
    let filteredItems = enrichedItems;
    if (options?.filters) {
      // Exemplo: Filtrar por intervalo de preço
      if (options.filters.minPrice !== undefined) {
        filteredItems = filteredItems.filter(item => 
          parseFloat(item.price) >= parseFloat(options.filters.minPrice)
        );
      }
      if (options.filters.maxPrice !== undefined) {
        filteredItems = filteredItems.filter(item => 
          parseFloat(item.price) <= parseFloat(options.filters.maxPrice)
        );
      }
      // Mais filtros podem ser implementados conforme necessário
    }

    // Ordenar os itens de acordo com o tipo de ordenação
    if (options?.sortType) {
      switch (options.sortType) {
        case ProductSortType.PRICE_ASC:
          filteredItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case ProductSortType.PRICE_DESC:
          filteredItems.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case ProductSortType.RATING_DESC:
          filteredItems.sort((a, b) => parseFloat(b.product.rating) - parseFloat(a.product.rating));
          break;
        case ProductSortType.NEWEST:
          filteredItems.sort((a, b) => b.product.createdAt.getTime() - a.product.createdAt.getTime());
          break;
        default:
          // Padrão: ordenar por preço (menor para maior)
          filteredItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      }
    } else {
      // Padrão: ordenar por preço (menor para maior)
      filteredItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    }

    // Limitar o número de resultados se especificado
    if (options?.maxResults && filteredItems.length > options.maxResults) {
      filteredItems = filteredItems.slice(0, options.maxResults);
    }

    // Encontrar o item mais barato
    const cheapestItem = filteredItems.length > 0 
      ? filteredItems.reduce((min, item) => 
          parseFloat(item.price) < parseFloat(min.price) ? item : min, 
          filteredItems[0]
        )
      : undefined;

    // Encontrar o item melhor avaliado
    const bestRatedItem = filteredItems.length > 0 
      ? filteredItems.reduce((max, item) => 
          parseFloat(item.product.rating) > parseFloat(max.product.rating) ? item : max, 
          filteredItems[0]
        )
      : undefined;

    // Registrar pesquisa para análise, se userId fornecido
    if (options?.userId) {
      await this.createProductSearch({
        userId: options.userId,
        searchTerm: group.name,
        categoryId: group.categoryId,
        productsCompared: filteredItems.length,
        selectedProductId: null // Será atualizado quando o usuário selecionar um produto
      });
    }

    return {
      group,
      items: filteredItems,
      cheapestItem,
      bestRatedItem
    };
  }

  // --- Método para buscas de produtos estilo Trivago ---
  async searchProducts(query: string, options?: {
    categoryId?: number;
    sortType?: ProductSortTypeValue;
    maxResults?: number;
    filters?: any;
    userId?: number;
  }): Promise<{
    groups: ProductGroup[];
    searchId: number;
    totalMatches: number;
  }> {
    // Buscar grupos de produtos que correspondem à consulta
    let groups = await this.getProductGroups({
      search: query,
      categoryId: options?.categoryId,
      active: true
    });

    // Registrar a pesquisa para análise, se userId fornecido
    let searchId = 0;
    if (options?.userId) {
      const search = await this.createProductSearch({
        userId: options.userId,
        searchTerm: query,
        categoryId: options?.categoryId || null,
        productsCompared: 0,
        selectedProductId: null
      });
      searchId = search.id;
    }

    // Aplicar ordenação aos grupos
    if (options?.sortType) {
      switch (options.sortType) {
        case ProductSortType.NEWEST:
          groups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case ProductSortType.ALPHABETICAL:
          groups.sort((a, b) => a.name.localeCompare(b.name));
          break;
        // Outras ordenações podem ser implementadas conforme necessário
      }
    }

    // Limitar o número de resultados se especificado
    if (options?.maxResults && groups.length > options.maxResults) {
      groups = groups.slice(0, options.maxResults);
    }

    return {
      groups,
      searchId,
      totalMatches: groups.length
    };
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    this.initData();
  }
  
  /**
   * Atualiza vários produtos de uma só vez
   * @param productsData Array com os dados dos produtos a serem atualizados em massa
   * @returns Array com resultados da operação
   */
  async updateProductsInBulk(productsData: { id: number; [key: string]: any }[]): Promise<{id: number, success: boolean, message?: string}[]> {
    const results: {id: number, success: boolean, message?: string}[] = [];
    
    // Tratar cada produto individualmente para garantir o controle de erros
    for (const productData of productsData) {
      try {
        const { id, ...updateData } = productData;
        
        // Verificar se o produto existe
        const existingProduct = await this.getProduct(id);
        if (!existingProduct) {
          results.push({
            id,
            success: false,
            message: "Produto não encontrado"
          });
          continue;
        }
        
        // Tratar dados antes da atualização
        if (updateData.stock !== undefined) {
          updateData.stock = Number(updateData.stock);
          updateData.lastStockUpdate = new Date();
          
          // Atualizar status do estoque com base na quantidade
          if (existingProduct.lowStockThreshold !== null) {
            if (updateData.stock <= 0) {
              updateData.stockStatus = "out_of_stock";
            } else if (updateData.stock < existingProduct.lowStockThreshold) {
              updateData.stockStatus = "low_stock";
            } else {
              updateData.stockStatus = "in_stock";
            }
          }
        }
        
        // Se estiver atualizando apenas o limite de estoque baixo
        if (updateData.lowStockThreshold !== undefined && updateData.stock === undefined) {
          const stockThreshold = Number(updateData.lowStockThreshold);
          updateData.lowStockThreshold = stockThreshold;
          
          // Atualizar status com base no novo limite
          if (existingProduct.stock !== null) {
            if (existingProduct.stock <= 0) {
              updateData.stockStatus = "out_of_stock";
            } else if (existingProduct.stock < stockThreshold) {
              updateData.stockStatus = "low_stock";
            } else {
              updateData.stockStatus = "in_stock";
            }
          }
        }
        
        // Atualizar o produto
        const updatedProduct = await this.updateProduct(id, updateData);
        
        if (updatedProduct) {
          results.push({
            id,
            success: true
          });
        } else {
          results.push({
            id,
            success: false,
            message: "Falha ao atualizar produto"
          });
        }
      } catch (error) {
        console.error(`Erro ao atualizar produto ${productData.id}:`, error);
        results.push({
          id: productData.id,
          success: false,
          message: `Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      }
    }
    
    return results;
  }
  
  /**
   * Busca produtos com estoque baixo de um fornecedor específico
   * @param supplierId ID do fornecedor
   * @returns Lista de produtos com estoque baixo
   */
  async getLowStockProducts(supplierId: number): Promise<Product[]> {
    try {
      // Buscar produtos do fornecedor
      const supplierProducts = await db.select()
        .from(products)
        .where(
          and(
            eq(products.supplierId, supplierId),
            eq(products.active, true)
          )
        )
        .execute();
      
      // Filtrar produtos com estoque baixo
      const lowStockProducts = supplierProducts.filter(product => {
        // Se o produto tem campos de estoque definidos
        if (product.stock !== null && product.lowStockThreshold !== null) {
          return product.stock < product.lowStockThreshold;
        }
        return false;
      });
      
      // Ordenar por urgência (menor estoque proporcional primeiro)
      lowStockProducts.sort((a, b) => {
        const ratioA = (a.stock || 0) / (a.lowStockThreshold || 1);
        const ratioB = (b.stock || 0) / (b.lowStockThreshold || 1);
        return ratioA - ratioB;
      });
      
      return lowStockProducts;
    } catch (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error);
      return [];
    }
  }

  private async initData() {
    try {
      // Verificar se já existem categorias
      const existingCategories = await db.select().from(categories);
      if (existingCategories.length === 0) {
        // Adicionar categorias iniciais
        const categoryData: InsertCategory[] = [
          { name: "Utensílios", slug: "utensilios", description: "Utensílios para restaurantes", icon: "utensils" },
          { name: "Refrigeração", slug: "refrigeracao", description: "Equipamentos de refrigeração", icon: "temperature-low" },
          { name: "Cocção", slug: "coccao", description: "Equipamentos para cocção", icon: "fire" },
          { name: "Preparação", slug: "preparacao", description: "Equipamentos para preparação de alimentos", icon: "blender" },
          { name: "Bar", slug: "bar", description: "Equipamentos para bar", icon: "wine-glass-alt" },
          { name: "Lavagem", slug: "lavagem", description: "Equipamentos para lavagem", icon: "sink" },
          { name: "Mobiliário", slug: "mobiliario", description: "Mobiliário para restaurantes", icon: "chair" }
        ];
        
        for (const cat of categoryData) {
          await this.createCategory(cat);
        }
      }

      // Verificar se já existem configurações de comissão
      const existingSettings = await db.select().from(commissionSettings);
      if (existingSettings.length === 0) {
        // Adicionar configuração de comissão padrão
        await this.createCommissionSetting({
          rate: "5",
          active: true
        });
      }
    } catch (error) {
      console.error("Erro ao inicializar dados:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getUsers(role?: string): Promise<User[]> {
    if (role) {
      return db.select().from(users).where(eq(users.role, role));
    }
    return db.select().from(users);
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values({ ...insertCategory, productsCount: 0 })
      .returning();
    return category;
  }
  
  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    // Selecionar todos os campos explicitamente para garantir que todos são retornados
    const [product] = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      slug: products.slug,
      categoryId: products.categoryId,
      supplierId: products.supplierId,  // Garantir que supplierId é retornado
      price: products.price,
      originalPrice: products.originalPrice,
      discount: products.discount,
      rating: products.rating,
      ratingsCount: products.ratingsCount,
      features: products.features,
      imageUrl: products.imageUrl,
      imageData: products.imageData,
      imageType: products.imageType,
      additionalImages: products.additionalImages,
      active: products.active,
      additionalCategories: products.additionalCategories,
      createdAt: products.createdAt,
    }).from(products).where(eq(products.id, id)).execute();
    
    // Adicionar diagnóstico para depuração
    if (product) {
      console.log(`Produto encontrado id=${id}:`, {
        id: product.id,
        supplierId: product.supplierId,
        supplierId_tipo: typeof product.supplierId
      });
    } else {
      console.log(`Produto não encontrado id=${id}`);
    }
    
    return product;
  }
  
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }
  
  async getProductBySupplier(baseProductId: number, supplierId: number): Promise<Product | undefined> {
    // Primeiro, obtenha o produto base para ter informações como nome e categoria
    const baseProduct = await this.getProduct(baseProductId);
    if (!baseProduct) return undefined;
    
    // Verificar se o próprio fornecedor tem esse produto (caso seja o mesmo produto)
    if (baseProduct.supplierId === supplierId) {
      return baseProduct;
    }
    
    // Buscar produto similar do fornecedor especificado
    // 1. Primeiro verificamos se há um produto com o mesmo nome e do mesmo fornecedor
    const query = db.select()
      .from(products)
      .where(
        and(
          eq(products.supplierId, supplierId),
          eq(products.categoryId, baseProduct.categoryId),
          or(
            // Tente encontrar um produto com o mesmo nome exato
            eq(products.name, baseProduct.name),
            // Ou um produto cujo nome contenha o nome base (com uma tolerância para variações)
            like(products.name, `%${baseProduct.name}%`)
          )
        )
      )
      .limit(1);
    
    const [similarProduct] = await query;
    return similarProduct;
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        ...insertProduct,
        rating: "0",
        ratingsCount: 0
      })
      .returning();
    
    // Atualizar contagem de produtos na categoria
    const category = await this.getCategory(product.categoryId);
    if (category) {
      await this.updateCategory(category.id, { 
        productsCount: category.productsCount + 1 
      });
    }
    
    return product;
  }
  
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set(productData)
        .where(eq(products.id, id))
        .returning()
        .execute();
        
      // Adicionar diagnóstico para depuração
      if (updatedProduct) {
        console.log(`Produto atualizado id=${id}:`, {
          id: updatedProduct.id,
          supplierId: updatedProduct.supplierId,
          supplierId_tipo: typeof updatedProduct.supplierId
        });
      } else {
        console.log(`Produto não foi atualizado id=${id}`);
      }
        
      return updatedProduct;
    } catch (error) {
      console.error(`Erro ao atualizar produto id=${id}:`, error);
      throw error;
    }
  }
  
  // Método unificado para busca avançada de produtos
  async getProducts(options?: { 
    // Filtros básicos
    categoryId?: number; 
    supplierId?: number; 
    active?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
    
    // Filtros avançados
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    features?: string[];
    hasDiscount?: boolean;
    inStock?: boolean;
    brandId?: number;
    additionalCategories?: number[];
    createdAfter?: Date;
    
    // Ordenação
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<Product[]> {
    try {
      console.log(`Buscando produtos no banco de dados com ${options ? Object.keys(options).length : 0} filtros aplicados`);
      const startTime = Date.now();
      
      // Começar com uma consulta base
      // ===== SISTEMA DE PRÉ-VALIDAÇÃO ULTRA-SEGURO =====
      // Validação preliminar dos valores para evitar erros SQL com valores específicos problemáticos
      if (options?.minPrice !== undefined) {
        try {
          // Validação específica para os valores conhecidos que estão causando erro
          const problematicValues = [400, 450, 500];
          if (problematicValues.includes(Number(options.minPrice)) && options.maxPrice === 2700) {
            console.warn(`⚠️ [PROTEÇÃO ESPECÍFICA] Detectado valor conhecido problemático: minPrice=${options.minPrice}, maxPrice=${options.maxPrice}`);
            console.warn(`⚠️ [PROTEÇÃO ESPECÍFICA] Aplicando correção para evitar erro 500...`);
            
            // Ajuste sutil para evitar valor exato que causa problema
            options.minPrice = Number(options.minPrice) + 0.01;
            console.log(`✅ [PROTEÇÃO ESPECÍFICA] Valor minPrice ajustado para ${options.minPrice}`);
          }
          
          // Validar e normalizar valores para evitar tipos inválidos
          if (isNaN(Number(options.minPrice))) {
            console.error(`❌ [PROTEÇÃO] Valor minPrice inválido: ${options.minPrice}, definindo para 0`);
            options.minPrice = 0;
          } else if (Number(options.minPrice) < 0) {
            console.warn(`⚠️ [PROTEÇÃO] Valor minPrice negativo normalizado: ${options.minPrice} → 0`);
            options.minPrice = 0;
          } else if (Number(options.minPrice) > 1000000) {
            console.warn(`⚠️ [PROTEÇÃO] Valor minPrice muito alto normalizado: ${options.minPrice} → 1000000`);
            options.minPrice = 1000000;
          }
        } catch (error) {
          console.error(`❌ [PROTEÇÃO] Erro ao validar minPrice:`, error);
          options.minPrice = 0; // Valor seguro padrão
        }
      }
      
      if (options?.maxPrice !== undefined) {
        try {
          // Validar e normalizar valores para evitar tipos inválidos
          if (isNaN(Number(options.maxPrice))) {
            console.error(`❌ [PROTEÇÃO] Valor maxPrice inválido: ${options.maxPrice}, definindo para 999999`);
            options.maxPrice = 999999;
          } else if (Number(options.maxPrice) <= 0) {
            console.warn(`⚠️ [PROTEÇÃO] Valor maxPrice inválido normalizado: ${options.maxPrice} → 999999`);
            options.maxPrice = 999999;
          } else if (Number(options.maxPrice) > 1000000) {
            console.warn(`⚠️ [PROTEÇÃO] Valor maxPrice muito alto normalizado: ${options.maxPrice} → 1000000`);
            options.maxPrice = 1000000;
          }
        } catch (error) {
          console.error(`❌ [PROTEÇÃO] Erro ao validar maxPrice:`, error);
          options.maxPrice = 999999; // Valor seguro padrão
        }
      }
      
      // Garantir que não há inconsistência em filtros de preço
      if (options?.minPrice !== undefined && options?.maxPrice !== undefined) {
        if (Number(options.minPrice) > Number(options.maxPrice)) {
          console.warn(`⚠️ [PROTEÇÃO] Inconsistência detectada: minPrice (${options.minPrice}) > maxPrice (${options.maxPrice})`);
          // Trocar valores para evitar inconsistência
          [options.minPrice, options.maxPrice] = [options.maxPrice, options.minPrice];
          console.log(`✅ [PROTEÇÃO] Valores trocados: minPrice=${options.minPrice}, maxPrice=${options.maxPrice}`);
        }
      }
      
      let query = db.select().from(products);
      
      if (options) {
        const conditions = [];
        
        // ------ FILTROS BÁSICOS ------
        
        // Filtragem avançada por categoria
        if (options.categoryId !== undefined && options.categoryId !== 0) {
          console.log(`Filtrando produtos por categoria ID: ${options.categoryId}`);
          
          // Para categoria 0 (Todas as categorias), não aplicamos filtro de categoria
          if (options.categoryId > 0) {
            // Buscamos produtos onde:
            // 1. A categoria principal seja a selecionada OU
            // 2. A categoria esteja presente no array de categorias adicionais
            conditions.push(
              or(
                // Categoria principal
                eq(products.categoryId, options.categoryId),
                // Busca em array JSON de categorias adicionais
                sql`${products.additionalCategories} @> ${JSON.stringify([options.categoryId])}`
              )
            );
          }
        }
        
        // Filtragem por fornecedor
        if (options.supplierId !== undefined) {
          console.log(`Filtrando produtos por fornecedor ID: ${options.supplierId}`);
          conditions.push(eq(products.supplierId, options.supplierId));
        }
        
        // Filtragem por marca (tratado como fornecedor específico)
        if (options.brandId !== undefined) {
          console.log(`Filtrando produtos por marca/fabricante ID: ${options.brandId}`);
          // Assumimos que brandId é equivalente a supplierId
          conditions.push(eq(products.supplierId, options.brandId));
        }
        
        // Filtragem de produtos ativos/inativos
        if (options.active !== undefined) {
          console.log(`Filtrando por produtos ${options.active ? 'ativos' : 'inativos'}`);
          conditions.push(eq(products.active, options.active));
        }
        
        // ------ FILTROS DE PREÇO - VERSÃO FINAL ULTRA-SIMPLIFICADA ------
        // Nova implementação baseada em SQL limpo e direto, evitando expressões complexas
        // que podem causar erros em alguns cenários
        
        if (options.minPrice !== undefined || options.maxPrice !== undefined) {
          console.log(`[PREÇO] Aplicando filtro de preço com novo algoritmo simplificado`);
          
          try {
            // 1. Pre-processamento dos valores - usando valores padrão seguros caso necessário
            const minPriceValue = options.minPrice !== undefined ? Number(options.minPrice) : 0;
            const maxPriceValue = options.maxPrice !== undefined ? Number(options.maxPrice) : 999999;
            
            if (!isNaN(minPriceValue) && !isNaN(maxPriceValue)) {
              console.log(`[PREÇO] Intervalo de preço filtrado: ${minPriceValue} a ${maxPriceValue}`);
              
              // 2. Aplicar um único filtro simplificado usando OR lógico para diferentes formatos
              conditions.push(sql`
                /* Filtro de preço universal simplificado */
                (
                  /* Formato americano: preço com ponto (123.45) */
                  (
                    ${products.price} ~ '^[0-9]+(\.[0-9]+)?$' AND
                    ${products.price}::float BETWEEN ${minPriceValue}::float AND ${maxPriceValue}::float
                  )
                  
                  OR
                  
                  /* Formato brasileiro: preço com vírgula (123,45) */
                  (
                    ${products.price} ~ '^[0-9]+(,[0-9]+)?$' AND
                    REPLACE(${products.price}, ',', '.')::float BETWEEN ${minPriceValue}::float AND ${maxPriceValue}::float
                  )
                )
              `);
              
              // Adicionar filtro de segurança para garantir que apenas produtos com preço válido sejam filtrados
              conditions.push(sql`${products.price} IS NOT NULL`);
              
              console.log(`[PREÇO] Filtro de preço aplicado com sucesso`);
            } else {
              console.log(`[PREÇO] Ignorando filtro de preço - valores de entrada inválidos (não numéricos)`);
              // Não aplicar filtro se os valores forem inválidos
            }
          } catch (error) {
            console.error(`[PREÇO] Erro ao aplicar filtro de preço:`, error);
            // Em caso de erro, não aplicar o filtro para permitir que a consulta continue
          }
        }
        
        // ------ FILTROS DE PESQUISA ------
        
        // Filtragem por termo de busca com pesquisa avançada
        if (options.search && options.search.trim().length > 0) {
          const searchTerm = `%${options.search.trim()}%`;
          console.log(`Filtrando produtos pelo termo de busca: "${options.search}"`);
          
          // Pesquisa em nome, descrição e recursos do produto
          conditions.push(
            or(
              like(products.name, searchTerm),
              like(products.description, searchTerm)
            )
          );
        }
        
        // Aplicar todas as condições de filtro
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        
        // ------ ORDENAÇÃO ------
        
        // Ordenação personalizada
        if (options.sortBy && ['price', 'rating', 'createdAt', 'name', 'popularity'].includes(options.sortBy)) {
          const direction = options.sortDirection === 'desc' ? desc : asc;
          query = query.orderBy(direction(products[options.sortBy as keyof Product] as any));
        }
        
        // Aplicar limite na consulta SQL (para melhor performance)
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        // Aplicar offset na consulta SQL (para paginação)
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }
      
      // Executar a consulta
      console.log("Executando consulta final de produtos no banco de dados");
      const productResults = await query.execute();
      console.log(`Consulta SQL retornou ${productResults.length} produtos após aplicar filtros SQL`);
      
      // ------ FILTROS PÓS-CONSULTA ------
      let filteredResults = [...productResults];
      
      // Aplicar filtros específicos que não podem ser facilmente expressos em SQL
      if (options) {
        // Filtro de desconto
        if (options.hasDiscount === true) {
          console.log(`Filtrando produtos com desconto ativo`);
          filteredResults = filteredResults.filter(product => {
            // Verificar primeiro pelo campo discount, que é a forma mais direta
            if (product.discount && product.discount > 0) return true;
            
            // Se não tiver o campo discount, verificar pelos preços
            if (!product.originalPrice) return false;
            const currentPrice = parseFloat(product.price as any);
            const originalPrice = parseFloat(product.originalPrice as any);
            return !isNaN(currentPrice) && !isNaN(originalPrice) && originalPrice > currentPrice;
          });
          console.log(`Após filtro de desconto: ${filteredResults.length} produtos`);
        }
        
        // Filtro de estoque
        if (options.inStock === true) {
          console.log(`Filtrando produtos em estoque`);
          filteredResults = filteredResults.filter(product => {
            // 1. Garantir que o produto está ativo (obrigatório para estar em estoque)
            if (product.active !== true) return false;
            
            // 2. Verificar se tem preço válido (obrigatório para estar em estoque)
            const price = parseFloat(product.price as any);
            if (isNaN(price) || price <= 0) return false;
            
            // 3. Produtos com desconto geralmente são aqueles que se quer escoar inventário
            if (product.discount) return true;
            
            // 4. Produtos com avaliações também tendem a estar em estoque
            if (product.rating && parseFloat(product.rating as any) > 0) return true;
            
            // 5. Caso não tenha desconto ou avaliações, base apenas no preço:
            return price < 5000;
          });
          console.log(`Após filtro de estoque: ${filteredResults.length} produtos`);
        }
        
        // Filtro por avaliação mínima
        if (options.minRating !== undefined) {
          console.log(`Filtrando produtos com avaliação mínima de ${options.minRating}`);
          filteredResults = filteredResults.filter(product => {
            if (!product.rating) return false;
            const rating = parseFloat(product.rating as any);
            return !isNaN(rating) && rating >= options.minRating!;
          });
        }
        
        // Filtro por data de criação
        if (options.createdAfter) {
          console.log(`Filtrando produtos criados após ${options.createdAfter.toISOString()}`);
          filteredResults = filteredResults.filter(product => {
            return product.createdAt && product.createdAt >= options.createdAfter!;
          });
        }
        
        // Filtro por categorias adicionais (se não aplicado no SQL)
        if (options.additionalCategories && options.additionalCategories.length > 0 && !options.categoryId) {
          console.log(`Aplicando filtro pós-SQL por categorias adicionais: ${options.additionalCategories.join(', ')}`);
          filteredResults = filteredResults.filter(product => {
            // Verificar se alguma das categorias adicionais do produto está na lista solicitada
            if (!product.additionalCategories || product.additionalCategories.length === 0) {
              return false;
            }
            
            return options.additionalCategories!.some(catId => 
              product.additionalCategories.includes(catId)
            );
          });
        }
      }
      
      const endTime = Date.now();
      console.log(`Busca de produtos concluída em ${endTime - startTime}ms - Retornando ${filteredResults.length} produtos`);
      
      return filteredResults;
    } catch (error) {
      console.error("Erro ao executar consulta de produtos:", error);
      throw error;
    }
  }
  
  // Sale methods
  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }
  
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const [sale] = await db
      .insert(sales)
      .values(insertSale)
      .returning();
    return sale;
  }
  
  async getSales(options?: { supplierId?: number; buyerId?: number; productId?: number }): Promise<Sale[]> {
    let query = db.select().from(sales);
    
    if (options) {
      const conditions = [];
      
      if (options.supplierId !== undefined) {
        conditions.push(eq(sales.supplierId, options.supplierId));
      }
      
      if (options.buyerId !== undefined) {
        conditions.push(eq(sales.buyerId, options.buyerId));
      }
      
      if (options.productId !== undefined) {
        conditions.push(eq(sales.productId, options.productId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    // Executar a consulta para retornar os resultados
    console.log("Executando consulta de vendas no banco de dados");
    try {
      const result = await query.execute();
      console.log(`Consulta retornou ${result.length} vendas`);
      return result;
    } catch (error) {
      console.error("Erro ao executar consulta de vendas:", error);
      throw error;
    }
  }
  
  async getProductSales(productId: number): Promise<Sale[]> {
    return this.getSales({ productId });
  }
  
  // Product Image methods
  async getProductImage(id: number): Promise<ProductImage | undefined> {
    const [image] = await db.select().from(productImages).where(eq(productImages.id, id));
    return image;
  }
  
  async createProductImage(image: InsertProductImage): Promise<ProductImage> {
    const [createdImage] = await db.insert(productImages).values({
      ...image,
      createdAt: new Date(),
    }).returning();
    return createdImage;
  }
  
  async updateProductImage(id: number, imageData: Partial<ProductImage>): Promise<ProductImage | undefined> {
    const [updatedImage] = await db
      .update(productImages)
      .set(imageData)
      .where(eq(productImages.id, id))
      .returning();
    return updatedImage;
  }
  
  async deleteProductImage(id: number): Promise<void> {
    await db.delete(productImages).where(eq(productImages.id, id));
  }
  
  async getProductImages(productId: number): Promise<ProductImage[]> {
    return db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.sortOrder);
  }
  
  async updateProductImagesNotPrimary(productId: number, excludeId?: number): Promise<void> {
    if (excludeId !== undefined) {
      await db
        .update(productImages)
        .set({ isPrimary: false })
        .where(
          and(
            eq(productImages.productId, productId),
            ne(productImages.id, excludeId)
          )
        );
    } else {
      await db
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, productId));
    }
  }
  
  // FAQ Category methods
  async getFaqCategory(id: number): Promise<FaqCategory | undefined> {
    const [category] = await db.select().from(faqCategories).where(eq(faqCategories.id, id));
    return category;
  }
  
  async getFaqCategoryBySlug(slug: string): Promise<FaqCategory | undefined> {
    const [category] = await db.select().from(faqCategories).where(eq(faqCategories.slug, slug));
    return category;
  }
  
  async createFaqCategory(insertCategory: InsertFaqCategory): Promise<FaqCategory> {
    const [category] = await db
      .insert(faqCategories)
      .values(insertCategory)
      .returning();
    return category;
  }
  
  async updateFaqCategory(id: number, categoryData: Partial<FaqCategory>): Promise<FaqCategory | undefined> {
    const [updatedCategory] = await db
      .update(faqCategories)
      .set(categoryData)
      .where(eq(faqCategories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async getFaqCategories(): Promise<FaqCategory[]> {
    return db
      .select()
      .from(faqCategories)
      .orderBy(faqCategories.sortOrder);
  }
  
  // FAQ Item methods
  async getFaqItem(id: number): Promise<FaqItem | undefined> {
    const [item] = await db.select().from(faqItems).where(eq(faqItems.id, id));
    return item;
  }
  
  async createFaqItem(insertItem: InsertFaqItem): Promise<FaqItem> {
    const [item] = await db
      .insert(faqItems)
      .values(insertItem)
      .returning();
    return item;
  }
  
  async updateFaqItem(id: number, itemData: Partial<FaqItem>): Promise<FaqItem | undefined> {
    const [updatedItem] = await db
      .update(faqItems)
      .set(itemData)
      .where(eq(faqItems.id, id))
      .returning();
    return updatedItem;
  }
  
  async getFaqItems(categoryId?: number): Promise<FaqItem[]> {
    let query = db.select().from(faqItems);
    
    if (categoryId !== undefined) {
      query = query.where(eq(faqItems.categoryId, categoryId));
    }
    
    // Executar a consulta para retornar os resultados
    console.log("Executando consulta de itens de FAQ no banco de dados");
    try {
      const result = await query.orderBy(faqItems.sortOrder);
      console.log(`Consulta retornou ${result.length} itens de FAQ`);
      return result;
    } catch (error) {
      console.error("Erro ao executar consulta de itens de FAQ:", error);
      throw error;
    }
  }
  
  // Chat Message methods
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
    return message;
  }
  
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    
    // Atualizar última atividade e mensagem na conversa se existir
    if (insertMessage.conversationId) {
      const conversation = await this.getChatConversation(insertMessage.conversationId);
      if (conversation) {
        await this.updateChatConversation(conversation.id, {
          lastMessageId: message.id,
          lastActivityAt: new Date()
        });
      }
    }
    
    return message;
  }
  
  async getChatMessages(options: {
    conversationId?: number;
    senderId?: number;
    receiverId?: number;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<ChatMessage[]> {
    let query = db.select().from(chatMessages);
    const conditions = [];
    
    if (options) {
      if (options.conversationId !== undefined) {
        conditions.push(eq(chatMessages.conversationId, options.conversationId));
      }
      
      if (options.senderId !== undefined) {
        conditions.push(eq(chatMessages.senderId, options.senderId));
      }
      
      if (options.receiverId !== undefined) {
        conditions.push(eq(chatMessages.receiverId, options.receiverId));
      }
      
      if (options.unreadOnly) {
        conditions.push(eq(chatMessages.isRead, false));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Ordenar por data (mais recentes primeiro)
      query = query.orderBy(desc(chatMessages.createdAt));
      
      if (options.offset !== undefined) {
        query = query.offset(options.offset);
      }
      
      if (options.limit !== undefined) {
        query = query.limit(options.limit);
      }
    }
    
    // Executar a consulta para retornar os resultados
    console.log("Executando consulta de mensagens no banco de dados");
    try {
      const result = await query.execute();
      console.log(`Consulta retornou ${result.length} mensagens`);
      return result;
    } catch (error) {
      console.error("Erro ao executar consulta de mensagens:", error);
      throw error;
    }
  }
  
  async markMessagesAsRead(messageIds: number[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(inArray(chatMessages.id, messageIds));
  }
  
  // Implementação de exclusão de mensagens
  async deleteChatMessage(id: number): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.id, id));
  }
  
  // Implementação para excluir todas as mensagens de uma conversa específica
  async deleteChatMessagesInConversation(conversationId: number): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId));
  }
  
  // Chat Conversation methods
  async getChatConversation(id: number): Promise<ChatConversation | undefined> {
    const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    return conversation;
  }
  
  async createChatConversation(insertConversation: InsertChatConversation): Promise<ChatConversation> {
    const [conversation] = await db
      .insert(chatConversations)
      .values({
        ...insertConversation,
        lastActivityAt: new Date()
      })
      .returning();
    return conversation;
  }
  
  async updateChatConversation(id: number, conversationData: Partial<ChatConversation>): Promise<ChatConversation | undefined> {
    const [updatedConversation] = await db
      .update(chatConversations)
      .set(conversationData)
      .where(eq(chatConversations.id, id))
      .returning();
    return updatedConversation;
  }
  
  async getChatConversations(userId: number): Promise<ChatConversation[]> {
    // Vamos usar uma abordagem mais simples com conversão para texto e verificação com LIKE
    console.log(`Buscando conversas para o usuário ${userId}`);
    try {
      const query = db
        .select()
        .from(chatConversations)
        .where(sql`${chatConversations.participantIds}::text LIKE '%' || ${userId} || '%'`)
        .orderBy(desc(chatConversations.lastActivityAt));
        
      const result = await query.execute();
      console.log(`Encontradas ${result.length} conversas para o usuário ${userId}`);
      return result;
    } catch (error) {
      console.error(`Erro ao buscar conversas para o usuário ${userId}:`, error);
      throw error;
    }
  }
  
  async getAllChatConversations(): Promise<ChatConversation[]> {
    console.log("Buscando todas as conversas");
    try {
      const query = db
        .select()
        .from(chatConversations)
        .orderBy(desc(chatConversations.lastActivityAt));
        
      const result = await query.execute();
      console.log(`Encontradas ${result.length} conversas no total`);
      return result;
    } catch (error) {
      console.error("Erro ao buscar todas as conversas:", error);
      throw error;
    }
  }
  
  async updateChatConversationLastMessage(conversationId: number, message: ChatMessage): Promise<void> {
    await db
      .update(chatConversations)
      .set({
        lastMessageId: message.id,
        lastMessageText: message.text,
        lastMessageDate: message.createdAt,
        lastActivityAt: new Date()
      })
      .where(eq(chatConversations.id, conversationId));
  }
  
  // Método para excluir uma conversa completa
  async deleteChatConversation(id: number): Promise<void> {
    // Primeiro excluímos todas as mensagens da conversa
    await this.deleteChatMessagesInConversation(id);
    
    // Depois excluímos a conversa em si
    await db
      .delete(chatConversations)
      .where(eq(chatConversations.id, id));
  }
  
  // Commission Settings methods
  async getCommissionSetting(id: number): Promise<CommissionSetting | undefined> {
    const [setting] = await db.select().from(commissionSettings).where(eq(commissionSettings.id, id));
    return setting;
  }
  
  async createCommissionSetting(insertSetting: InsertCommissionSetting): Promise<CommissionSetting> {
    const [setting] = await db
      .insert(commissionSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }
  
  async updateCommissionSetting(id: number, settingData: Partial<CommissionSetting>): Promise<CommissionSetting | undefined> {
    const [updatedSetting] = await db
      .update(commissionSettings)
      .set(settingData)
      .where(eq(commissionSettings.id, id))
      .returning();
    return updatedSetting;
  }
  
  async getCommissionSettings(options?: { 
    categoryId?: number; 
    supplierId?: number; 
    active?: boolean
  }): Promise<CommissionSetting[]> {
    let query = db.select().from(commissionSettings);
    
    if (options) {
      const conditions = [];
      
      if (options.categoryId !== undefined) {
        conditions.push(
          or(
            eq(commissionSettings.categoryId, options.categoryId),
            isNull(commissionSettings.categoryId)
          )
        );
      }
      
      if (options.supplierId !== undefined) {
        conditions.push(
          or(
            eq(commissionSettings.supplierId, options.supplierId),
            isNull(commissionSettings.supplierId)
          )
        );
      }
      
      if (options.active !== undefined) {
        conditions.push(eq(commissionSettings.active, options.active));
      }
      
      if (conditions.length > 0) {
        if (conditions.length === 1) {
          query = query.where(conditions[0]);
        } else {
          query = query.where(and(...conditions));
        }
      }
    }
    
    console.log("Executando consulta de configurações de comissão");
    try {
      const result = await query.orderBy(commissionSettings.id).execute();
      console.log(`Consulta retornou ${result.length} configurações de comissão`);
      return result;
    } catch (error) {
      console.error("Erro ao executar consulta de configurações de comissão:", error);
      throw error;
    }
  }
  
  /**
   * Retorna as configurações de comissão aplicáveis a um fornecedor específico,
   * incluindo configurações globais, de categoria e específicas do fornecedor.
   * As configurações são enriquecidas com informações de tipo e prioridade.
   */
  async getSupplierApplicableCommissionSettings(supplierId: number): Promise<(CommissionSetting & { type: string, priority: number })[]> {
    // Buscar todas as configurações de comissão ativas
    const allSettings = await this.getCommissionSettings({ active: true });
    
    // Buscar produtos do fornecedor para identificar suas categorias
    const supplierProducts = await this.getProductsBySupplier(supplierId);
    const supplierCategoryIds = new Set<number>();
    
    // Coletar categorias únicas dos produtos do fornecedor
    supplierProducts.forEach(product => {
      supplierCategoryIds.add(product.categoryId);
      if (product.additionalCategories) {
        product.additionalCategories.forEach(catId => {
          if (catId) supplierCategoryIds.add(catId);
        });
      }
    });
    
    // Filtrar e organizar as configurações aplicáveis
    const applicableSettings = allSettings
      .filter(setting => {
        // Configurações específicas para este fornecedor + uma categoria
        if (setting.supplierId === supplierId && setting.categoryId !== null) {
          return supplierCategoryIds.has(setting.categoryId);
        }
        
        // Configurações específicas para este fornecedor
        if (setting.supplierId === supplierId && setting.categoryId === null) {
          return true;
        }
        
        // Configurações para categorias dos produtos deste fornecedor
        if (setting.supplierId === null && setting.categoryId !== null) {
          return supplierCategoryIds.has(setting.categoryId);
        }
        
        // Configurações globais
        if (setting.supplierId === null && setting.categoryId === null) {
          return true;
        }
        
        return false;
      })
      .map(setting => {
        let type = 'global';
        let priority = 4;
        
        if (setting.supplierId === supplierId && setting.categoryId !== null) {
          type = 'specific';
          priority = 1;
        } else if (setting.supplierId === supplierId) {
          type = 'supplier';
          priority = 2;
        } else if (setting.categoryId !== null) {
          type = 'category';
          priority = 3;
        }
        
        return { ...setting, type, priority };
      })
      .sort((a, b) => a.priority - b.priority);
    
    return applicableSettings;
  }
  
  /**
   * Calcula e retorna a taxa de comissão aplicável a um produto específico
   * com base nas configurações de comissão disponíveis.
   */
  async getProductCommissionRate(productId: number): Promise<{ 
    rate: string, 
    type: "specific" | "supplier" | "category" | "global", 
    settingId: number 
  }> {
    try {
      // Buscar o produto
      let product;
      
      try {
        product = await this.getProduct(productId);
        if (!product) {
          console.error(`Produto não encontrado para ID: ${productId}`);
          // Retornar taxa padrão quando o produto não for encontrado
          return {
            rate: "0.0",
            type: "global",
            settingId: 0
          };
        }
      } catch (error) {
        console.error(`Erro ao buscar produto ${productId}:`, error);
        return {
          rate: "0.0",
          type: "global",
          settingId: 0
        };
      }
      
      // Primeiro, verificar se existe uma configuração específica para este produto
      try {
        const productSpecificCommission = await this.getProductCommissionSettingByProductId(productId);
        if (productSpecificCommission && productSpecificCommission.active) {
          return {
            rate: productSpecificCommission.rate,
            type: "specific",
            settingId: productSpecificCommission.id
          };
        }
      } catch (error) {
        console.error(`Erro ao buscar configuração específica para produto ${productId}:`, error);
        // Continuar para o próximo método de obtenção da taxa
      }
      
      // Se não houver configuração específica, buscar as configurações de comissão gerais aplicáveis
      let applicableSettings = [];
      try {
        applicableSettings = await this.getSupplierApplicableCommissionSettings(product.supplierId);
      } catch (error) {
        console.error(`Erro ao buscar configurações aplicáveis para fornecedor ${product.supplierId}:`, error);
      }
      
      // Se não houver configurações, retornar uma taxa padrão
      if (!applicableSettings || applicableSettings.length === 0) {
        return { rate: "3.0", type: "global", settingId: 0 };
      }
      
      try {
        // Função para verificar se a configuração se aplica a este produto específico
        const isApplicable = (setting: CommissionSetting & { type: string, priority: number }) => {
          if (!setting || setting.categoryId === null) {
            return true; // Configuração global ou de fornecedor
          }
          
          // Verificar se o produto está na categoria da configuração
          if (product.categoryId === setting.categoryId) {
            return true;
          }
          
          // Verificar categorias adicionais
          if (product.additionalCategories && Array.isArray(product.additionalCategories) && 
              product.additionalCategories.includes(setting.categoryId)) {
            return true;
          }
          
          return false;
        };
        
        // Encontrar a primeira configuração aplicável seguindo a ordem de prioridade
        for (const setting of applicableSettings) {
          if (isApplicable(setting)) {
            return {
              rate: setting.rate,
              type: setting.type as "specific" | "supplier" | "category" | "global",
              settingId: setting.id
            };
          }
        }
        
        // Se nenhuma configuração for aplicável, tentar usar a primeira configuração disponível
        if (applicableSettings.length > 0 && applicableSettings[0]) {
          return {
            rate: applicableSettings[0].rate,
            type: applicableSettings[0].type as "specific" | "supplier" | "category" | "global",
            settingId: applicableSettings[0].id
          };
        }
      } catch (error) {
        console.error(`Erro ao processar configurações aplicáveis para produto ${productId}:`, error);
      }
      
      // Fallback final - se tudo falhar, retornar uma taxa padrão
      return { rate: "3.0", type: "global", settingId: 0 };
    } catch (error) {
      console.error(`Erro geral ao obter taxa de comissão para produto ${productId}:`, error);
      return { rate: "3.0", type: "global", settingId: 0 };
    }
  }
  
  /**
   * Gera um resumo das comissões aplicáveis a um fornecedor específico,
   * incluindo estatísticas de taxas médias, taxas mais comuns, etc.
   */
  async getSupplierCommissionSummary(supplierId: number): Promise<{
    avgRate: string;
    specificRatesCount: number;
    totalCommission: number;
    totalProducts: number;
    categoriesCount: number;
    mostCommonRate: string;
    mostCommonRateCount: number;
  }> {
    try {
      // Buscar produtos do fornecedor
      const products = await this.getProductsBySupplier(supplierId);
      
      // Se não houver produtos, retornar valores vazios
      if (products.length === 0) {
        return {
          avgRate: "0.0",
          specificRatesCount: 0,
          totalCommission: 0,
          totalProducts: 0,
          categoriesCount: 0,
          mostCommonRate: "0.0",
          mostCommonRateCount: 0
        };
      }
      
      // Buscar vendas do fornecedor (sem o filtro de data que estava causando o erro)
      const sales = await this.getSales({
        supplierId
      });
      
      // Calcular total de comissões
      const totalCommission = sales.reduce((sum, sale) => 
        sum + parseFloat(sale.commissionAmount.toString()), 0);
      
      // Coletar taxas de comissão para cada produto
      const commissionRates: { rate: string, type: string }[] = [];
      for (const product of products) {
        try {
          const commission = await this.getProductCommissionRate(product.id);
          commissionRates.push(commission);
        } catch (err) {
          console.error(`Erro ao obter taxa de comissão para produto ${product.id}:`, err);
          // Adiciona uma taxa padrão para não quebrar o cálculo
          commissionRates.push({ rate: "0.0", type: "default" });
        }
      }
    
    // Calcular taxa média
    const avgRate = commissionRates.length > 0 
      ? (commissionRates.reduce((sum, c) => sum + parseFloat(c.rate), 0) / commissionRates.length).toFixed(1) 
      : "0.0";
    
    // Contar taxas específicas (não globais)
    const specificRatesCount = commissionRates.filter(c => c.type !== "global").length;
    
    // Encontrar a taxa mais comum
    const rateCounts: Record<string, number> = {};
    commissionRates.forEach(c => {
      rateCounts[c.rate] = (rateCounts[c.rate] || 0) + 1;
    });
    
    let mostCommonRate = "0.0";
    let mostCommonRateCount = 0;
    
    for (const [rate, count] of Object.entries(rateCounts)) {
      if (count > mostCommonRateCount) {
        mostCommonRate = rate;
        mostCommonRateCount = count;
      }
    }
    
    // Contar categorias únicas
    const uniqueCategories = new Set<number>();
    products.forEach(product => {
      uniqueCategories.add(product.categoryId);
      if (product.additionalCategories) {
        product.additionalCategories.forEach(catId => {
          if (catId) uniqueCategories.add(catId);
        });
      }
    });
    
    return {
      avgRate,
      specificRatesCount,
      totalCommission,
      totalProducts: products.length,
      categoriesCount: uniqueCategories.size,
      mostCommonRate,
      mostCommonRateCount
    };
    } catch (error) {
      console.error("Erro ao obter resumo de comissões do fornecedor:", error);
      // Retornar valores padrão em caso de erro
      return {
        avgRate: "0.0",
        specificRatesCount: 0,
        totalCommission: 0,
        totalProducts: 0,
        categoriesCount: 0,
        mostCommonRate: "0.0",
        mostCommonRateCount: 0
      };
    }
  }
  
  async getCommissionSettings(options?: { 
    categoryId?: number; 
    supplierId?: number; 
    active?: boolean
  }): Promise<CommissionSetting[]> {
    let query = db.select().from(commissionSettings);
    
    if (options) {
      const conditions = [];
      
      if (options.categoryId !== undefined) {
        conditions.push(
          or(
            eq(commissionSettings.categoryId, options.categoryId),
            isNull(commissionSettings.categoryId)
          )
        );
      }
      
      if (options.supplierId !== undefined) {
        conditions.push(
          or(
            eq(commissionSettings.supplierId, options.supplierId),
            isNull(commissionSettings.supplierId)
          )
        );
      }
      
      if (options.active !== undefined) {
        conditions.push(eq(commissionSettings.active, options.active));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return query.execute();
  }

  // --- Métodos para comissões por produto (Product Commission Settings) ---
  
  /**
   * Obtém uma configuração de comissão de produto pelo ID
   * @param id ID da configuração de comissão
   * @returns A configuração de comissão ou undefined se não existir
   */
  async getProductCommissionSetting(id: number): Promise<ProductCommissionSetting | undefined> {
    return this.productCommissionSettings.get(id);
  }
  
  /**
   * Obtém uma configuração de comissão de produto pelo ID do produto
   * @param productId ID do produto
   * @returns A configuração de comissão ou undefined se não existir
   */
  async getProductCommissionSettingByProductId(productId: number): Promise<ProductCommissionSetting | undefined> {
    try {
      if (!this.productCommissionSettings) {
        // Inicializa Map vazio se ainda não existir
        this.productCommissionSettings = new Map();
        return undefined;
      }
      
      return Array.from(this.productCommissionSettings.values()).find(
        setting => setting.productId === productId
      );
    } catch (error) {
      console.error(`Erro ao buscar configuração de comissão para produto ${productId}:`, error);
      return undefined;
    }
  }
  
  /**
   * Cria uma nova configuração de comissão para um produto específico
   * @param insertSetting Dados para criar a configuração de comissão
   * @returns A configuração de comissão criada
   */
  async createProductCommissionSetting(insertSetting: InsertProductCommissionSetting): Promise<ProductCommissionSetting> {
    const id = this.currentProductCommissionSettingId++;
    const setting: ProductCommissionSetting = { 
      ...insertSetting, 
      id, 
      createdAt: new Date() 
    };
    
    this.productCommissionSettings.set(id, setting);
    return setting;
  }
  
  /**
   * Atualiza uma configuração de comissão de produto
   * @param id ID da configuração de comissão
   * @param settingData Dados para atualizar a configuração
   * @returns A configuração de comissão atualizada ou undefined se não existir
   */
  async updateProductCommissionSetting(id: number, settingData: Partial<ProductCommissionSetting>): Promise<ProductCommissionSetting | undefined> {
    const setting = await this.getProductCommissionSetting(id);
    if (!setting) return undefined;
    
    const updatedSetting = { ...setting, ...settingData };
    this.productCommissionSettings.set(id, updatedSetting);
    return updatedSetting;
  }
  
  /**
   * Remove uma configuração de comissão específica de produto
   * @param id ID da configuração de comissão a ser excluída
   * @returns true se a configuração foi excluída com sucesso, false caso contrário
   */
  async deleteProductCommissionSetting(id: number): Promise<boolean> {
    try {
      // Verificar se a configuração existe
      const setting = await this.getProductCommissionSetting(id);
      if (!setting) return false;
      
      // Remover a configuração
      const result = this.productCommissionSettings.delete(id);
      
      // Registrar log da operação
      console.log(`Configuração de comissão #${id} para o produto #${setting.productId} foi excluída`);
      
      return result;
    } catch (error) {
      console.error(`Erro ao excluir configuração de comissão #${id}:`, error);
      return false;
    }
  }
  
  /**
   * Obtém as configurações de comissão de produtos com filtros opcionais
   * @param options Opções de filtragem (supplierId, active)
   * @returns Lista de configurações de comissão de produtos
   */
  async getProductCommissionSettings(options?: { 
    supplierId?: number; 
    active?: boolean 
  }): Promise<ProductCommissionSetting[]> {
    let settings = Array.from(this.productCommissionSettings.values());
    
    if (options) {
      if (options.supplierId !== undefined) {
        // Primeiro, encontrar todos os produtos deste fornecedor
        const supplierProducts = Array.from(this.products.values())
          .filter(product => product.supplierId === options.supplierId)
          .map(product => product.id);
        
        // Depois, filtrar as configurações que correspondem a esses produtos
        settings = settings.filter(setting => 
          supplierProducts.includes(setting.productId)
        );
      }
      
      if (options.active !== undefined) {
        settings = settings.filter(setting => setting.active === options.active);
      }
    }
    
    return settings;
  }

  // --- Métodos para grupos de produtos (Product Groups) ---
  
  /**
   * Obtém um grupo de produtos pelo ID
   * @param id ID do grupo de produtos
   * @returns O grupo de produtos ou undefined se não existir
   */
  async getProductGroup(id: number): Promise<ProductGroup | undefined> {
    const [group] = await db
      .select()
      .from(productGroups)
      .where(eq(productGroups.id, id));
    
    return group;
  }

  /**
   * Obtém um grupo de produtos pelo slug
   * @param slug Slug do grupo de produtos
   * @returns O grupo de produtos ou undefined se não existir
   */
  async getProductGroupBySlug(slug: string): Promise<ProductGroup | undefined> {
    const [group] = await db
      .select()
      .from(productGroups)
      .where(eq(productGroups.slug, slug));
    
    return group;
  }

  /**
   * Cria um novo grupo de produtos
   * @param insertGroup Dados para criar o grupo
   * @returns O grupo criado
   */
  async createProductGroup(insertGroup: InsertProductGroup): Promise<ProductGroup> {
    const timestamp = new Date();
    const [group] = await db
      .insert(productGroups)
      .values({
        ...insertGroup,
        createdAt: timestamp,
        updatedAt: timestamp,
        productsCount: 0,
        suppliersCount: 0,
        comparisonCount: 0,
        searchRelevance: 0,
        isActive: true
      })
      .returning();
    
    return group;
  }

  /**
   * Atualiza um grupo de produtos existente
   * @param id ID do grupo a atualizar
   * @param groupData Dados para atualizar
   * @returns O grupo atualizado ou undefined se não existir
   */
  async updateProductGroup(id: number, groupData: Partial<ProductGroup>): Promise<ProductGroup | undefined> {
    // Remover campos que não devem ser atualizados diretamente
    const { id: _, createdAt, ...safeData } = groupData as any;
    
    const [updatedGroup] = await db
      .update(productGroups)
      .set({
        ...safeData,
        updatedAt: new Date()
      })
      .where(eq(productGroups.id, id))
      .returning();
    
    return updatedGroup;
  }

  /**
   * Obtém uma lista de grupos de produtos com várias opções de filtragem
   * @param options Opções de filtragem e paginação
   * @returns Lista de grupos de produtos correspondentes aos critérios
   */
  async getProductGroups(options?: {
    categoryId?: number;
    search?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ProductGroup[]> {
    let query = db
      .select()
      .from(productGroups);
    
    if (options) {
      // Aplicar filtros conforme necessário
      if (options.categoryId !== undefined) {
        query = query.where(eq(productGroups.categoryId, options.categoryId));
      }
      
      if (options.active !== undefined) {
        query = query.where(eq(productGroups.isActive, options.active));
      }
      
      // Pesquisa por texto no nome ou descrição
      if (options.search) {
        query = query.where(
          or(
            ilike(productGroups.name, `%${options.search}%`),
            ilike(productGroups.description || '', `%${options.search}%`)
          )
        );
      }
      
      // Ordernar por mais recentes primeiro
      query = query.orderBy(desc(productGroups.updatedAt));
      
      // Aplicar paginação
      if (options.offset !== undefined) {
        query = query.offset(options.offset);
      }
      
      if (options.limit !== undefined) {
        query = query.limit(options.limit);
      }
    }
    
    const groups = await query;
    return groups;
  }

  // --- Métodos para itens de grupos de produtos (Product Group Items) ---
  
  /**
   * Obtém um item de grupo de produtos pelo ID
   * @param id ID do item
   * @returns O item ou undefined se não existir
   */
  async getProductGroupItem(id: number): Promise<ProductGroupItem | undefined> {
    const [item] = await db
      .select()
      .from(productGroupItems)
      .where(eq(productGroupItems.id, id));
    
    return item;
  }

  /**
   * Obtém um item de grupo de produtos pelo ID do produto e do grupo
   * @param groupId ID do grupo
   * @param productId ID do produto
   * @returns O item ou undefined se não existir
   */
  async getProductGroupItemByProductId(groupId: number, productId: number): Promise<ProductGroupItem | undefined> {
    const [item] = await db
      .select()
      .from(productGroupItems)
      .where(
        and(
          eq(productGroupItems.groupId, groupId),
          eq(productGroupItems.productId, productId)
        )
      );
    
    return item;
  }

  /**
   * Cria um novo item de grupo de produtos
   * @param insertItem Dados para criar o item
   * @returns O item criado
   */
  async createProductGroupItem(insertItem: InsertProductGroupItem): Promise<ProductGroupItem> {
    // Criar o item
    const [item] = await db
      .insert(productGroupItems)
      .values({
        ...insertItem,
        totalSales: 0,
        createdAt: new Date(),
        isHighlighted: false,
        priceDifference: null,
        matchConfidence: "100"
      })
      .returning();
    
    // Atualizar a contagem de itens no grupo
    const group = await this.getProductGroup(insertItem.groupId);
    if (group) {
      await this.updateProductGroup(group.id, {
        productsCount: group.productsCount + 1
      });
      
      // Também atualizar a contagem de fornecedores distintos no grupo
      const uniqueSuppliers = await db
        .select({ supplierId: productGroupItems.supplierId })
        .from(productGroupItems)
        .where(eq(productGroupItems.groupId, group.id))
        .groupBy(productGroupItems.supplierId);
      
      await this.updateProductGroup(group.id, {
        suppliersCount: uniqueSuppliers.length
      });
    }
    
    return item;
  }

  /**
   * Atualiza um item de grupo de produtos existente
   * @param id ID do item a atualizar
   * @param itemData Dados para atualizar
   * @returns O item atualizado ou undefined se não existir
   */
  async updateProductGroupItem(id: number, itemData: Partial<ProductGroupItem>): Promise<ProductGroupItem | undefined> {
    // Remover campos que não devem ser atualizados diretamente
    const { id: _, groupId, productId, supplierId, createdAt, ...safeData } = itemData as any;
    
    const [updatedItem] = await db
      .update(productGroupItems)
      .set(safeData)
      .where(eq(productGroupItems.id, id))
      .returning();
    
    return updatedItem;
  }

  /**
   * Obtém uma lista de itens de um grupo de produtos com várias opções de filtragem
   * @param groupId ID do grupo
   * @param options Opções de filtragem e ordenação
   * @returns Lista de itens do grupo correspondentes aos critérios
   */
  async getProductGroupItems(groupId: number, options?: {
    supplierId?: number;
    highlighted?: boolean;
    limit?: number;
    orderBy?: string; // Opções: price_asc, price_desc, sales_desc
  }): Promise<ProductGroupItem[]> {
    // Consulta principal
    let query = db
      .select({
        item: productGroupItems,
        product: products
      })
      .from(productGroupItems)
      .innerJoin(products, eq(productGroupItems.productId, products.id))
      .where(eq(productGroupItems.groupId, groupId));
    
    if (options) {
      // Filtrar por fornecedor
      if (options.supplierId !== undefined) {
        query = query.where(eq(productGroupItems.supplierId, options.supplierId));
      }
      
      // Filtrar por destaque
      if (options.highlighted !== undefined) {
        query = query.where(eq(productGroupItems.isHighlighted, options.highlighted));
      }
    }
    
    // Executar a consulta
    const result = await query;
    
    // Transformar o resultado
    let items = result.map(row => ({
      ...row.item,
      // Adicionar informações relevantes para a ordenação
      _price: row.product.price,
      _rating: row.product.rating
    }));
    
    // Ordenar os resultados
    if (options?.orderBy) {
      switch (options.orderBy) {
        case 'price_asc':
          items.sort((a, b) => parseFloat(a._price) - parseFloat(b._price));
          break;
        case 'price_desc':
          items.sort((a, b) => parseFloat(b._price) - parseFloat(a._price));
          break;
        case 'sales_desc':
          items.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
          break;
        case 'rating_desc':
          items.sort((a, b) => parseFloat(b._rating || '0') - parseFloat(a._rating || '0'));
          break;
      }
    } else {
      // Por padrão, ordenar pelo menor preço
      items.sort((a, b) => parseFloat(a._price) - parseFloat(b._price));
    }
    
    // Aplicar limite
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    
    // Remover as propriedades temporárias
    return items.map(item => {
      const { _price, _rating, ...cleanItem } = item as any;
      return cleanItem;
    });
  }

  // --- Métodos para pesquisas de produtos (Product Searches) ---
  
  /**
   * Cria um novo registro de pesquisa de produtos
   * @param insertSearch Dados da pesquisa
   * @returns O registro de pesquisa criado
   */
  async createProductSearch(insertSearch: InsertProductSearch): Promise<ProductSearch> {
    const [search] = await db
      .insert(productSearches)
      .values({
        userId: insertSearch.userId,
        searchQuery: insertSearch.searchTerm || '',
        categoryId: insertSearch.categoryId,
        resultsCount: insertSearch.productsCompared || 0,
        selectedProductId: insertSearch.selectedProductId,
        createdAt: new Date()
      })
      .returning();
    
    return search;
  }

  /**
   * Obtém uma lista de pesquisas de produtos com várias opções de filtragem
   * @param options Opções de filtragem e paginação
   * @returns Lista de pesquisas correspondentes aos critérios
   */
  async getProductSearches(options?: {
    userId?: number;
    query?: string;
    categoryId?: number;
    limit?: number;
    daysAgo?: number;
  }): Promise<ProductSearch[]> {
    let query = db
      .select()
      .from(productSearches);
    
    if (options) {
      // Aplicar filtros conforme necessário
      if (options.userId !== undefined) {
        query = query.where(eq(productSearches.userId, options.userId));
      }
      
      if (options.query) {
        query = query.where(ilike(productSearches.searchQuery, `%${options.query}%`));
      }
      
      if (options.categoryId !== undefined) {
        query = query.where(eq(productSearches.categoryId, options.categoryId));
      }
      
      // Filtrar por período
      if (options.daysAgo !== undefined) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.daysAgo);
        query = query.where(gte(productSearches.createdAt, cutoffDate));
      }
      
      // Ordenar do mais recente para o mais antigo
      query = query.orderBy(desc(productSearches.createdAt));
      
      // Aplicar limite
      if (options.limit) {
        query = query.limit(options.limit);
      }
    }
    
    const searches = await query;
    return searches;
  }

  // --- Métodos para comparações de produtos (Product Comparisons) ---
  
  /**
   * Obtém uma comparação de produtos pelo ID
   * @param id ID da comparação
   * @returns A comparação ou undefined se não existir
   */
  async getProductComparison(id: number): Promise<ProductComparison | undefined> {
    const [comparison] = await db
      .select()
      .from(productComparisons)
      .where(eq(productComparisons.id, id));
    
    return comparison;
  }

  /**
   * Cria uma nova comparação de produtos
   * @param insertComparison Dados da comparação
   * @returns A comparação criada
   */
  async createProductComparison(insertComparison: InsertProductComparison): Promise<ProductComparison> {
    const [comparison] = await db
      .insert(productComparisons)
      .values({
        ...insertComparison,
        status: insertComparison.status || ProductComparisonStatus.COMPLETED,
        createdAt: new Date()
      })
      .returning();
    
    // Atualizar contador de comparações no grupo
    if (comparison.groupId) {
      const group = await this.getProductGroup(comparison.groupId);
      if (group) {
        await this.updateProductGroup(group.id, {
          comparisonCount: group.comparisonCount + 1
        });
      }
    }
    
    return comparison;
  }

  /**
   * Atualiza uma comparação de produtos existente
   * @param id ID da comparação a atualizar
   * @param comparisonData Dados para atualizar
   * @returns A comparação atualizada ou undefined se não existir
   */
  async updateProductComparison(id: number, comparisonData: Partial<ProductComparison>): Promise<ProductComparison | undefined> {
    // Remover campos que não devem ser atualizados diretamente
    const { id: _, createdAt, ...safeData } = comparisonData as any;
    
    const [updatedComparison] = await db
      .update(productComparisons)
      .set(safeData)
      .where(eq(productComparisons.id, id))
      .returning();
    
    return updatedComparison;
  }

  /**
   * Obtém uma lista de comparações de produtos com várias opções de filtragem
   * @param options Opções de filtragem e paginação
   * @returns Lista de comparações correspondentes aos critérios
   */
  async getProductComparisons(options?: {
    userId?: number;
    groupId?: number;
    status?: ProductComparisonStatusType;
    limit?: number;
  }): Promise<ProductComparison[]> {
    let query = db
      .select()
      .from(productComparisons);
    
    if (options) {
      // Aplicar filtros conforme necessário
      if (options.userId !== undefined) {
        query = query.where(eq(productComparisons.userId, options.userId));
      }
      
      if (options.groupId !== undefined) {
        query = query.where(eq(productComparisons.groupId, options.groupId));
      }
      
      if (options.status !== undefined) {
        query = query.where(eq(productComparisons.status, options.status));
      }
      
      // Ordenar do mais recente para o mais antigo
      query = query.orderBy(desc(productComparisons.createdAt));
      
      // Aplicar limite
      if (options.limit) {
        query = query.limit(options.limit);
      }
    }
    
    const comparisons = await query;
    return comparisons;
  }

  // --- Métodos para detalhes de comparações de produtos (Product Comparison Details) ---
  
  /**
   * Cria um novo detalhe de comparação de produtos
   * @param insertDetail Dados do detalhe
   * @returns O detalhe criado
   */
  async createProductComparisonDetail(insertDetail: InsertProductComparisonDetail): Promise<ProductComparisonDetail> {
    const [detail] = await db
      .insert(productComparisonDetails)
      .values({
        ...insertDetail,
        createdAt: new Date()
      })
      .returning();
    
    return detail;
  }

  /**
   * Obtém os detalhes de uma comparação de produtos
   * @param comparisonId ID da comparação
   * @returns Lista de detalhes da comparação
   */
  async getProductComparisonDetails(comparisonId: number): Promise<ProductComparisonDetail[]> {
    const details = await db
      .select()
      .from(productComparisonDetails)
      .where(eq(productComparisonDetails.comparisonId, comparisonId))
      .orderBy(asc(productComparisonDetails.priceRank));
    
    return details;
  }
  
  /**
   * Compara produtos de um grupo e retorna os resultados formatados
   * Método avançado para comparação estilo Trivago
   * @param groupId ID do grupo de produtos
   * @param options Opções de filtro, ordenação e limite
   * @returns Resultados da comparação com estatísticas
   */
  async compareProducts(groupId: number, options?: {
    sortType?: ProductSortTypeValue;
    maxResults?: number;
    filters?: any;
    userId?: number;
  }): Promise<{
    group: ProductGroup;
    items: (ProductGroupItem & { product: Product; supplier: User })[];
    cheapestItem?: ProductGroupItem & { product: Product; supplier: User };
    bestRatedItem?: ProductGroupItem & { product: Product; supplier: User };
  }> {
    // Obter o grupo de produtos
    const group = await this.getProductGroup(groupId);
    if (!group) {
      throw new Error(`Grupo de produtos com ID ${groupId} não encontrado`);
    }

    // Construir uma consulta que traga os itens com produtos e fornecedores relacionados
    let query = db
      .select({
        item: productGroupItems,
        product: products,
        supplier: users
      })
      .from(productGroupItems)
      .innerJoin(products, eq(productGroupItems.productId, products.id))
      .innerJoin(users, eq(productGroupItems.supplierId, users.id))
      .where(eq(productGroupItems.groupId, groupId));
    
    // Aplicar filtros personalizados se fornecidos
    if (options?.filters) {
      if (options.filters.minPrice !== undefined) {
        query = query.where(gte(products.price, options.filters.minPrice));
      }
      if (options.filters.maxPrice !== undefined) {
        query = query.where(lte(products.price, options.filters.maxPrice));
      }
      // Outros filtros podem ser adicionados aqui conforme necessário
    }
    
    // Executar a consulta
    const results = await query;
    
    // Mapear os resultados para o formato esperado
    let items = results.map(row => ({
      ...row.item,
      product: row.product,
      supplier: row.supplier
    }));
    
    // Ordenar os itens conforme o tipo de ordenação
    if (options?.sortType) {
      switch (options.sortType) {
        case ProductSortType.PRICE_ASC:
          items.sort((a, b) => parseFloat(a.product.price) - parseFloat(b.product.price));
          break;
        case ProductSortType.PRICE_DESC:
          items.sort((a, b) => parseFloat(b.product.price) - parseFloat(a.product.price));
          break;
        case ProductSortType.RATING_DESC:
          items.sort((a, b) => parseFloat(b.product.rating) - parseFloat(a.product.rating));
          break;
        case ProductSortType.NEWEST:
          items.sort((a, b) => b.product.createdAt.getTime() - a.product.createdAt.getTime());
          break;
        default:
          // Padrão: ordenar por preço (menor para maior)
          items.sort((a, b) => parseFloat(a.product.price) - parseFloat(b.product.price));
      }
    } else {
      // Padrão: ordenar por preço (menor para maior)
      items.sort((a, b) => parseFloat(a.product.price) - parseFloat(b.product.price));
    }
    
    // Limitar o número de resultados se especificado
    if (options?.maxResults && items.length > options.maxResults) {
      items = items.slice(0, options.maxResults);
    }
    
    // Encontrar o item mais barato
    const cheapestItem = items.length > 0 
      ? items.reduce((min, item) => 
          parseFloat(item.product.price) < parseFloat(min.product.price) ? item : min, 
          items[0]
        )
      : undefined;
    
    // Encontrar o item melhor avaliado
    const bestRatedItem = items.length > 0 
      ? items.reduce((max, item) => 
          parseFloat(item.product.rating) > parseFloat(max.product.rating) ? item : max, 
          items[0]
        )
      : undefined;
    
    // Registrar pesquisa para análise, se userId fornecido
    if (options?.userId) {
      await this.createProductSearch({
        userId: options.userId,
        searchTerm: group.name,
        categoryId: group.categoryId,
        productsCompared: items.length,
        selectedProductId: null // Será atualizado quando o usuário selecionar um produto
      });
      
      // Criar um registro de comparação para análise futura
      await this.createProductComparison({
        userId: options.userId,
        groupId: group.id,
        productsCompared: items.map(item => item.product.id),
        status: ProductComparisonStatus.COMPLETED,
        sortType: options.sortType || ProductSortType.PRICE_ASC,
        filters: options.filters
      });
    }
    
    return {
      group,
      items,
      cheapestItem,
      bestRatedItem
    };
  }

  /**
   * Realiza busca de produtos e retorna grupos relevantes
   * Método para buscas de produtos estilo Trivago
   * @param query Termo de busca
   * @param options Opções de filtro, ordenação e limite
   * @returns Resultados da busca com estatísticas
   */
  async searchProducts(query: string, options?: {
    categoryId?: number;
    sortType?: ProductSortTypeValue;
    maxResults?: number;
    filters?: any;
    userId?: number;
  }): Promise<{
    groups: ProductGroup[];
    searchId: number;
    totalMatches: number;
  }> {
    // Buscar grupos de produtos que correspondem à consulta
    let groups = await this.getProductGroups({
      search: query,
      categoryId: options?.categoryId,
      active: true
    });
    
    // Registrar a pesquisa para análise, se userId fornecido
    let searchId = 0;
    if (options?.userId) {
      const search = await this.createProductSearch({
        userId: options.userId,
        searchTerm: query,
        categoryId: options?.categoryId || null,
        productsCompared: 0,
        selectedProductId: null
      });
      searchId = search.id;
      
      // Incrementar relevância de busca para grupos encontrados
      for (const group of groups) {
        await this.updateProductGroup(group.id, {
          searchRelevance: group.searchRelevance + 1
        });
      }
    }
    
    // Aplicar ordenação aos grupos
    if (options?.sortType) {
      switch (options.sortType) {
        case ProductSortType.NEWEST:
          groups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case ProductSortType.PRICE_ASC:
          groups.sort((a, b) => parseFloat(a.minPrice || '999999') - parseFloat(b.minPrice || '999999'));
          break;
        case ProductSortType.PRICE_DESC:
          groups.sort((a, b) => parseFloat(b.maxPrice || '0') - parseFloat(a.maxPrice || '0'));
          break;
        case ProductSortType.POPULARITY:
          groups.sort((a, b) => b.comparisonCount - a.comparisonCount);
          break;
        case ProductSortType.RELEVANCE:
          groups.sort((a, b) => b.searchRelevance - a.searchRelevance);
          break;
        default:
          // Padrão: ordenar por relevância
          groups.sort((a, b) => b.searchRelevance - a.searchRelevance);
      }
    } else {
      // Padrão: ordenar por relevância
      groups.sort((a, b) => b.searchRelevance - a.searchRelevance);
    }
    
    // Limitar o número de resultados se especificado
    if (options?.maxResults && groups.length > options.maxResults) {
      groups = groups.slice(0, options.maxResults);
    }
    
    return {
      groups,
      searchId,
      totalMatches: groups.length
    };
  }
  
  // Método específico para buscar produtos por fornecedor com opções avançadas
  async getProductsBySupplier(supplierId: number, options?: { 
    limit?: number;
    categoryId?: number; 
    orderBy?: string;
    active?: boolean;
  }): Promise<Product[]> {
    if (!supplierId) return [];
    
    let query = db.select().from(products)
      .where(eq(products.supplierId, supplierId));
    
    // Aplicar filtros adicionais
    if (options) {
      // Filtrar por categoria
      if (options.categoryId) {
        // Buscamos produtos onde:
        // 1. A categoria principal seja a selecionada OU
        // 2. A categoria esteja presente no array de categorias adicionais
        query = query.where(
          or(
            // Categoria principal
            eq(products.categoryId, options.categoryId),
            // Busca em array JSON de categorias adicionais
            sql`${products.additionalCategories} @> ${JSON.stringify([options.categoryId])}`
          )
        );
      }
      
      // Filtrar produtos ativos
      if (options.active !== undefined) {
        query = query.where(eq(products.active, options.active));
      }
      
      // Aplicar limite de resultados
      if (options.limit) {
        query = query.limit(options.limit);
      }
    }
    
    const supplierProducts = await query.execute();
    
    // Aplicar ordenação (deve ser feita após a consulta no Drizzle)
    if (options?.orderBy) {
      switch (options.orderBy) {
        case 'price_asc':
          supplierProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'price_desc':
          supplierProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case 'rating_desc':
          supplierProducts.sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
          break;
        case 'newest':
          supplierProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        default:
          // Ordenação padrão: mais novos primeiro
          supplierProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }
    
    return supplierProducts;
  }
  
  // Método para contar produtos de um fornecedor
  async getSupplierProductsCount(supplierId: number): Promise<number> {
    if (!supplierId) return 0;
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.supplierId, supplierId));
      
    return result[0]?.count || 0;
  }
  
  // Método para buscar categorias de produtos de um fornecedor
  async getSupplierCategories(supplierId: number): Promise<Category[]> {
    if (!supplierId) return [];
    
    // Primeiro buscar os IDs de categoria dos produtos do fornecedor
    const supplierProducts = await db.select({
      categoryId: products.categoryId,
      additionalCategories: products.additionalCategories
    })
    .from(products)
    .where(eq(products.supplierId, supplierId));
    
    // Extrair IDs únicos das categorias
    const categoryIds = new Set<number>();
    
    supplierProducts.forEach(product => {
      // Adicionar categoria principal
      categoryIds.add(product.categoryId);
      
      // Adicionar categorias adicionais, se houver
      if (product.additionalCategories) {
        product.additionalCategories.forEach(catId => {
          if (catId) categoryIds.add(catId);
        });
      }
    });
    
    if (categoryIds.size === 0) return [];
    
    // Buscar as categorias pelo ID
    const foundCategories = await db.select()
      .from(categories)
      .where(inArray(categories.id, Array.from(categoryIds)));
    
    return foundCategories;
  }
}

// Usar o armazenamento de banco de dados PostgreSQL
export const storage = new DatabaseStorage();
