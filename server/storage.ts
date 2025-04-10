import { users, type User, type InsertUser, categories, type Category, type InsertCategory, products, type Product, type InsertProduct, sales, type Sale, type InsertSale, commissionSettings, type CommissionSetting, type InsertCommissionSetting } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, desc, like, and, or, isNull } from "drizzle-orm";
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
  
  currentUserId: number;
  currentCategoryId: number;
  currentProductId: number;
  currentSaleId: number;
  currentCommissionSettingId: number;
  currentProductImageId: number;
  
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.sales = new Map();
    this.commissionSettings = new Map();
    this.productImages = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.currentSaleId = 1;
    this.currentCommissionSettingId = 1;
    this.currentProductImageId = 1;
    
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
      if (options.categoryId !== undefined) {
        products = products.filter(product => product.categoryId === options.categoryId);
      }
      
      if (options.supplierId !== undefined) {
        products = products.filter(product => product.supplierId === options.supplierId);
      }
      
      if (options.active !== undefined) {
        products = products.filter(product => product.active === options.active);
      }
      
      if (options.search) {
        const searchTerm = options.search.toLowerCase();
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
      
      if (options.categoryId !== undefined) {
        conditions.push(eq(products.categoryId, options.categoryId));
      }
      
      if (options.supplierId !== undefined) {
        conditions.push(eq(products.supplierId, options.supplierId));
      }
      
      if (options.active !== undefined) {
        conditions.push(eq(products.active, options.active));
      }
      
      if (options.search) {
        const searchTerm = `%${options.search}%`;
        conditions.push(
          or(
            like(products.name, searchTerm),
            like(products.description, searchTerm)
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
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
    let query = db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId));
    
    if (excludeId !== undefined) {
      query = query.where(ne(productImages.id, excludeId));
    }
    
    await query;
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
