import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Types
export const UserRole = {
  USER: "user",
  CLIENT: "user", // Alias para USER (compatibilidade)
  SUPPLIER: "supplier",
  ADMIN: "admin",
} as const;

// Status de comparação de produtos
export const ProductComparisonStatus = {
  PENDING: "pending",            // Aguardando processamento de comparação
  PROCESSING: "processing",      // Em processamento
  COMPLETED: "completed",        // Comparação concluída
  FAILED: "failed",              // Falha na comparação
} as const;

// Status de comparação de produtos como um tipo
export type ProductComparisonStatusType = (typeof ProductComparisonStatus)[keyof typeof ProductComparisonStatus];

// Tipo de classificação para produtos
export const ProductSortType = {
  PRICE_ASC: "price_asc",        // Preço crescente
  PRICE_DESC: "price_desc",      // Preço decrescente  
  RATING_DESC: "rating_desc",    // Melhor avaliação
  NEWEST: "newest",              // Mais recentes
  POPULARITY: "popularity",      // Mais populares (baseado em vendas)
  RELEVANCE: "relevance",        // Relevância (baseado em pesquisa)
} as const;

// Tipo de classificação como um tipo TypeScript
export type ProductSortTypeValue = (typeof ProductSortType)[keyof typeof ProductSortType];

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").$type<UserRoleType>().notNull().default(UserRole.USER),
  companyName: text("company_name"),
  cnpj: text("cnpj"),
  phone: text("phone"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Categories Table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  productsCount: integer("products_count").notNull().default(0),
});

// Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: integer("category_id").notNull(), // Categoria principal (para retrocompatibilidade)
  supplierId: integer("supplier_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  discount: integer("discount"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  ratingsCount: integer("ratings_count").notNull().default(0),
  features: jsonb("features").$type<string[]>(),
  imageUrl: text("image_url").notNull(),
  imageData: text("image_data"), // Imagem principal em base64
  imageType: text("image_type"), // Tipo MIME da imagem principal
  additionalImages: jsonb("additional_images").$type<{url?: string, data?: string, type?: string}[]>(), // Lista de até 8 imagens adicionais
  active: boolean("active").notNull().default(true),
  // Armazenar categorias múltiplas como uma matriz de IDs
  additionalCategories: jsonb("additional_categories").$type<number[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tabela de imagens de produto (para suportar múltiplas imagens por produto)
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  imageUrl: text("image_url"),
  imageData: text("image_data"), // Armazenamento de imagem em base64
  imageType: text("image_type"), // Tipo MIME da imagem 
  isPrimary: boolean("is_primary").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sales Table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  supplierId: integer("supplier_id").notNull(),
  buyerId: integer("buyer_id"),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Commission Settings
export const commissionSettings = pgTable("commission_settings", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id"),
  supplierId: integer("supplier_id"),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Configurações de comissão por produto específico
export const productCommissionSettings = pgTable("product_commission_settings", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  supplierId: integer("supplier_id").notNull(), // Redundante com o produto, mas facilita consultas
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  productsCount: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  rating: true,
  ratingsCount: true,
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
  createdAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});

export const insertCommissionSettingSchema = createInsertSchema(commissionSettings).omit({
  id: true,
  createdAt: true,
});

export const insertProductCommissionSettingSchema = createInsertSchema(productCommissionSettings).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type CommissionSetting = typeof commissionSettings.$inferSelect;
export type InsertCommissionSetting = z.infer<typeof insertCommissionSettingSchema>;

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;

export type ProductCommissionSetting = typeof productCommissionSettings.$inferSelect;
export type InsertProductCommissionSetting = z.infer<typeof insertProductCommissionSettingSchema>;

// FAQ Categories Table (para organizar as perguntas frequentes em categorias)
export const faqCategories = pgTable("faq_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// FAQ Items Table (perguntas e respostas)
export const faqItems = pgTable("faq_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => faqCategories.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat Conversations (para agrupar conversas)
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  participantIds: jsonb("participant_ids").$type<number[]>().notNull(), // Array com IDs dos usuários na conversa
  participantId: integer("participant_id"), // ID do participante principal (para uso no admin)
  participantName: text("participant_name"), // Nome do participante principal
  participantRole: text("participant_role").$type<UserRoleType>(), // Papel do participante principal
  lastMessageId: integer("last_message_id"), // Referência à última mensagem
  lastMessageText: text("last_message_text"), // Texto da última mensagem
  lastMessageDate: timestamp("last_message_date"), // Data da última mensagem
  unreadCount: integer("unread_count").notNull().default(0), // Contador de mensagens não lidas
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  subject: text("subject"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  conversationId: integer("conversation_id").references(() => chatConversations.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  text: text("text").notNull(), // Texto da mensagem
  isRead: boolean("is_read").notNull().default(false),
  read: boolean("read").notNull().default(false), // Alias para isRead (compatibilidade)
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type"),
  attachmentData: text("attachment_data"), // Base64 do arquivo (para arquivos menores)
  attachmentSize: integer("attachment_size"), // Tamanho em bytes
  attachments: jsonb("attachments").$type<string[]>(), // Lista de anexos
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas para as novas tabelas
export const insertFaqCategorySchema = createInsertSchema(faqCategories).omit({
  id: true,
  createdAt: true,
});

export const insertFaqItemSchema = createInsertSchema(faqItems).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  lastActivityAt: true,
});

// Types para as novas tabelas
export type FaqCategory = typeof faqCategories.$inferSelect;
export type InsertFaqCategory = z.infer<typeof insertFaqCategorySchema>;

export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

// Tabela de produtos semelhantes (para agrupar produtos do mesmo tipo mas de fornecedores diferentes - essencial para o modelo Trivago)
export const productGroups = pgTable("product_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),          // Nome do grupo de produtos (ex: "Geladeira comercial 4 portas")
  displayName: text("display_name").notNull(), // Nome formatado para exibição
  slug: text("slug").notNull().unique(), // URL amigável
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  description: text("description"),      // Descrição que se aplica a todos os produtos do grupo
  features: jsonb("features").$type<string[]>(), // Características comuns a todos os produtos do grupo
  minPrice: decimal("min_price", { precision: 10, scale: 2 }),  // Menor preço encontrado (atualizado automaticamente)
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),  // Maior preço encontrado (atualizado automaticamente)
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }),  // Preço médio (atualizado automaticamente)
  comparisonCount: integer("comparison_count").notNull().default(0), // Número de vezes que este grupo foi comparado
  searchRelevance: integer("search_relevance").notNull().default(0), // Relevância para buscas (usado para ordenação)
  productsCount: integer("products_count").notNull().default(0),     // Número de produtos no grupo
  suppliersCount: integer("suppliers_count").notNull().default(0),   // Número de fornecedores distintos
  thumbnailUrl: text("thumbnail_url"),    // URL da imagem representativa do grupo
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    // Índices para pesquisa rápida
    categoryIdx: index("product_groups_category_idx").on(table.categoryId),
    priceIdx: index("product_groups_price_idx").on(table.minPrice),
    nameSearchIdx: index("product_groups_name_search_idx").on(table.name),
    slugIdx: uniqueIndex("product_groups_slug_idx").on(table.slug),
  };
});

// Tabela de associação entre grupos de produtos e produtos individuais
export const productGroupItems = pgTable("product_group_items", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => productGroups.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  supplierId: integer("supplier_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  priceDifference: decimal("price_difference", { precision: 10, scale: 2 }), // Diferença do preço em relação à média do grupo (%)
  isHighlighted: boolean("is_highlighted").notNull().default(false), // Se deve ser destacado na comparação
  matchConfidence: decimal("match_confidence", { precision: 5, scale: 2 }).notNull().default("100"), // Confiança no agrupamento (%)
  totalSales: integer("total_sales").notNull().default(0), // Total de vendas deste produto
  sortOrder: integer("sort_order").notNull().default(0), // Ordem de exibição no grupo
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    // Índices para pesquisa rápida
    groupIdx: index("product_group_items_group_idx").on(table.groupId),
    productIdx: index("product_group_items_product_idx").on(table.productId),
    supplierIdx: index("product_group_items_supplier_idx").on(table.supplierId),
    groupProductUniq: uniqueIndex("product_group_items_group_product_uniq").on(table.groupId, table.productId),
  };
});

// Tabela de buscas de produtos para análise e melhoria contínua do sistema de busca
export const productSearches = pgTable("product_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),  // Usuário que realizou a busca (se estiver logado)
  searchQuery: text("search_query").notNull(),            // Texto da busca realizada
  categoryId: integer("category_id"),                     // Categoria filtrada (se houver)
  filtersApplied: jsonb("filters_applied"),               // Filtros aplicados na busca
  resultsCount: integer("results_count").notNull(),       // Número de resultados encontrados
  resultGroupIds: jsonb("result_group_ids").$type<number[]>(), // IDs dos grupos de produtos nos resultados
  resultProductIds: jsonb("result_product_ids").$type<number[]>(), // IDs dos produtos nos resultados
  selectedProductId: integer("selected_product_id"),      // ID do produto selecionado após a busca
  selectedGroupId: integer("selected_group_id"),          // ID do grupo selecionado após a busca
  leadToSale: boolean("lead_to_sale").notNull().default(false), // Se a busca levou a uma venda
  searchDuration: integer("search_duration"),             // Duração da busca em milissegundos
  clientIp: text("client_ip"),                            // IP do cliente (para estatísticas)
  userAgent: text("user_agent"),                          // User agent do cliente
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    // Índices para análise de busca
    queryIdx: index("product_searches_query_idx").on(table.searchQuery),
    userIdx: index("product_searches_user_idx").on(table.userId),
    categoryIdx: index("product_searches_category_idx").on(table.categoryId),
    dateIdx: index("product_searches_date_idx").on(table.createdAt),
  };
});

// Tabela para armazenar comparações de produtos feitas pelos usuários
export const productComparisons = pgTable("product_comparisons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),           // Usuário que fez a comparação (se estiver logado)
  groupId: integer("group_id").references(() => productGroups.id), // Grupo de produtos comparados
  productsCompared: jsonb("products_compared").$type<number[]>().notNull(), // IDs dos produtos comparados
  status: text("status").$type<ProductComparisonStatusType>().notNull().default(ProductComparisonStatus.COMPLETED),
  sortType: text("sort_type").$type<ProductSortTypeValue>().notNull().default(ProductSortType.PRICE_ASC),
  filters: jsonb("filters"),                              // Filtros aplicados nesta comparação
  selectedProductId: integer("selected_product_id"),      // ID do produto selecionado após comparação
  sessionId: text("session_id"),                          // ID da sessão (para análise)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),                     // Quando esta comparação expira (para cache)
}, (table) => {
  return {
    userIdx: index("product_comparisons_user_idx").on(table.userId),
    groupIdx: index("product_comparisons_group_idx").on(table.groupId),
    dateIdx: index("product_comparisons_date_idx").on(table.createdAt),
  };
});

// Tabela para armazenar comparações específicas entre produtos (análise detalhada)
export const productComparisonDetails = pgTable("product_comparison_details", {
  id: serial("id").primaryKey(),
  comparisonId: integer("comparison_id").notNull().references(() => productComparisons.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  supplierId: integer("supplier_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceRank: integer("price_rank").notNull(),           // Classificação por preço (1 = mais barato)
  deliveryDays: integer("delivery_days"),               // Tempo de entrega estimado
  deliveryCost: decimal("delivery_cost", { precision: 10, scale: 2 }),
  stockStatus: text("stock_status"),                    // Disponibilidade em estoque
  highlighedFeatures: jsonb("highlighed_features").$type<string[]>(), // Características destacadas
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    comparisonIdx: index("product_comparison_details_comparison_idx").on(table.comparisonId),
    productIdx: index("product_comparison_details_product_idx").on(table.productId),
    supplierIdx: index("product_comparison_details_supplier_idx").on(table.supplierId),
  };
});

// Schema de inserção para as novas tabelas
export const insertProductGroupSchema = createInsertSchema(productGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  productsCount: true,
  suppliersCount: true,
  minPrice: true,
  maxPrice: true,
  avgPrice: true,
  comparisonCount: true,
});

export const insertProductGroupItemSchema = createInsertSchema(productGroupItems).omit({
  id: true,
  createdAt: true,
  totalSales: true,
});

export const insertProductSearchSchema = createInsertSchema(productSearches).omit({
  id: true,
  createdAt: true,
});

export const insertProductComparisonSchema = createInsertSchema(productComparisons).omit({
  id: true,
  createdAt: true,
});

export const insertProductComparisonDetailSchema = createInsertSchema(productComparisonDetails).omit({
  id: true,
  createdAt: true,
});

// Tipos para as novas tabelas
export type ProductGroup = typeof productGroups.$inferSelect;
export type InsertProductGroup = z.infer<typeof insertProductGroupSchema>;

export type ProductGroupItem = typeof productGroupItems.$inferSelect;
export type InsertProductGroupItem = z.infer<typeof insertProductGroupItemSchema>;

export type ProductSearch = typeof productSearches.$inferSelect;
export type InsertProductSearch = z.infer<typeof insertProductSearchSchema>;

export type ProductComparison = typeof productComparisons.$inferSelect;
export type InsertProductComparison = z.infer<typeof insertProductComparisonSchema>;

export type ProductComparisonDetail = typeof productComparisonDetails.$inferSelect;
export type InsertProductComparisonDetail = z.infer<typeof insertProductComparisonDetailSchema>;
