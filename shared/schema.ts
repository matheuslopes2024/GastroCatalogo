import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Types
export const UserRole = {
  USER: "user",
  CLIENT: "user", // Alias para USER (compatibilidade)
  SUPPLIER: "supplier",
  ADMIN: "admin",
} as const;

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
