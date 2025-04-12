import { 
  users, type User, type InsertUser, 
  categories, type Category, type InsertCategory, 
  products, type Product, type InsertProduct, 
  sales, type Sale, type InsertSale, 
  commissionSettings, type CommissionSetting, type InsertCommissionSetting, 
  productImages, type ProductImage, type InsertProductImage,
  faqCategories, type FaqCategory, type InsertFaqCategory,
  faqItems, type FaqItem, type InsertFaqItem,
  chatMessages, type ChatMessage, type InsertChatMessage,
  chatConversations, type ChatConversation, type InsertChatConversation
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, desc, like, and, or, isNull, ne, sql, inArray } from "drizzle-orm";
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
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined>;
  getProducts(options?: { 
    categoryId?: number; 
    supplierId?: number; 
    active?: boolean;
    limit?: number;
    search?: string;
  }): Promise<Product[]>;
  
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
  getSales(options?: { supplierId?: number; buyerId?: number }): Promise<Sale[]>;
  
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
    return this.products.get(id);
  }
  
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.slug === slug
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
    const product = await this.getProduct(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async getProducts(options?: { 
    categoryId?: number; 
    supplierId?: number; 
    active?: boolean;
    limit?: number;
    search?: string;
  }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (options) {
      // Aplicação avançada de filtro por categoria
      if (options.categoryId !== undefined) {
        console.log(`Filtrando produtos por categoria ID: ${options.categoryId}`);
        products = products.filter(product => {
          // Garantir que o produto pertence exatamente à categoria especificada
          const categoryMatch = product.categoryId === options.categoryId;
          
          if (categoryMatch) {
            console.log(`Produto "${product.name}" (ID: ${product.id}) corresponde à categoria ${options.categoryId}`);
          }
          
          return categoryMatch;
        });
      }
      
      // Aplicação de filtro por fornecedor
      if (options.supplierId !== undefined) {
        console.log(`Filtrando produtos por fornecedor ID: ${options.supplierId}`);
        products = products.filter(product => product.supplierId === options.supplierId);
      }
      
      // Filtro de produtos ativos/inativos
      if (options.active !== undefined) {
        products = products.filter(product => product.active === options.active);
      }
      
      // Aplicação de filtro por termo de busca
      if (options.search) {
        const searchTerm = options.search.toLowerCase();
        console.log(`Filtrando produtos pelo termo de busca: "${searchTerm}"`);
        products = products.filter(product => 
          product.name.toLowerCase().includes(searchTerm) || 
          product.description.toLowerCase().includes(searchTerm)
        );
      }
      
      if (options.limit) {
        products = products.slice(0, options.limit);
      }
    }
    
    return products;
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
  
  async getSales(options?: { supplierId?: number; buyerId?: number }): Promise<Sale[]> {
    let sales = Array.from(this.sales.values());
    
    if (options) {
      if (options.supplierId !== undefined) {
        sales = sales.filter(sale => sale.supplierId === options.supplierId);
      }
      
      if (options.buyerId !== undefined) {
        sales = sales.filter(sale => sale.buyerId === options.buyerId);
      }
    }
    
    return sales;
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
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
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
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }
  
  async getProducts(options?: { 
    categoryId?: number; 
    supplierId?: number; 
    active?: boolean;
    limit?: number;
    search?: string;
  }): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (options) {
      const conditions = [];
      
      // Filtragem avançada por categoria
      if (options.categoryId !== undefined && options.categoryId !== 0) {
        console.log(`Filtrando produtos no banco de dados por categoria ID: ${options.categoryId}`);
        
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
        console.log(`Filtrando produtos no banco de dados por fornecedor ID: ${options.supplierId}`);
        conditions.push(eq(products.supplierId, options.supplierId));
      }
      
      // Filtragem de produtos ativos/inativos
      if (options.active !== undefined) {
        conditions.push(eq(products.active, options.active));
      }
      
      // Filtragem por termo de busca com pesquisa avançada
      if (options.search) {
        const searchTerm = `%${options.search}%`;
        console.log(`Filtrando produtos no banco de dados pelo termo de busca: "${options.search}"`);
        
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
      
      // Aplicar limite de resultados, se especificado
      if (options.limit) {
        query = query.limit(options.limit);
      }
    }
    
    return query;
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
  
  async getSales(options?: { supplierId?: number; buyerId?: number }): Promise<Sale[]> {
    let query = db.select().from(sales);
    
    if (options) {
      const conditions = [];
      
      if (options.supplierId !== undefined) {
        conditions.push(eq(sales.supplierId, options.supplierId));
      }
      
      if (options.buyerId !== undefined) {
        conditions.push(eq(sales.buyerId, options.buyerId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return query;
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
    
    return query.orderBy(faqItems.sortOrder);
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
    
    return query;
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
    return db
      .select()
      .from(chatConversations)
      .where(sql`${chatConversations.participantIds}::text LIKE '%' || ${userId} || '%'`)
      .orderBy(desc(chatConversations.lastActivityAt));
  }
  
  async getAllChatConversations(): Promise<ChatConversation[]> {
    return db
      .select()
      .from(chatConversations)
      .orderBy(desc(chatConversations.lastActivityAt));
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
        query = query.where(and(...conditions));
      }
    }
    
    return query;
  }
}

// Usar o armazenamento de banco de dados PostgreSQL
export const storage = new DatabaseStorage();
