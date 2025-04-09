import { users, type User, type InsertUser, categories, type Category, type InsertCategory, products, type Product, type InsertProduct, sales, type Sale, type InsertSale, commissionSettings, type CommissionSetting, type InsertCommissionSetting } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private sales: Map<number, Sale>;
  private commissionSettings: Map<number, CommissionSetting>;
  
  currentUserId: number;
  currentCategoryId: number;
  currentProductId: number;
  currentSaleId: number;
  currentCommissionSettingId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.sales = new Map();
    this.commissionSettings = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.currentSaleId = 1;
    this.currentCommissionSettingId = 1;
    
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
}

export const storage = new MemStorage();
