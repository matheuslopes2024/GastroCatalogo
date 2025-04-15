/**
 * Arquivo centralizado de definições de tipos para o projeto Gastro.
 * Este arquivo contém todos os tipos compartilhados usados em toda a aplicação.
 */

/**
 * Tipos de usuário suportados no sistema
 */
export enum UserRole {
  USER = "user",
  SUPPLIER = "supplier",
  ADMIN = "admin"
}

export type UserRoleType = "user" | "supplier" | "admin";

/**
 * Interface básica para usuários
 */
export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  name: string;
  role: UserRoleType;
  companyName: string | null;
  cnpj: string | null;
  phone: string | null;
  active: boolean;
  createdAt: Date;
  avatarUrl?: string; // URL para a imagem de avatar do usuário
  stripeCustomerId?: string; // ID do cliente no Stripe
  stripeSubscriptionId?: string; // ID da assinatura no Stripe
}

/**
 * Interface para uso do carrinho de compras
 */
export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  supplierId: number;
  supplierName?: string;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

/**
 * Interface para produtos
 */
export interface Product {
  id: number;
  name: string;
  description: string;
  slug: string;
  categoryId: number;
  supplierId: number;
  price: string;
  originalPrice?: string;
  discount?: number;
  rating?: string;
  ratingsCount?: number;
  features?: string;
  imageUrl?: string;
  imageData?: string | null;
  imageType?: string | null;
  additionalImages?: string[];
  active: boolean;
  additionalCategories?: number[];
  createdAt: Date;
  inventory?: ProductInventory;
  category?: Category;
  supplier?: Supplier;
}

/**
 * Interface para categoria de produtos
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: number;
  active: boolean;
  createdAt: Date;
}

/**
 * Interface para fornecedor
 */
export interface Supplier {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  userId: number;
  active: boolean;
  rating?: string;
  ratingsCount?: number;
  createdAt: Date;
}

/**
 * Interface para inventário de produto
 */
export interface ProductInventory {
  id: number;
  productId: number;
  quantity: number;
  lowStockThreshold?: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastRestocked?: Date;
  updatedAt: Date;
}

/**
 * Interface para conversas de chat
 */
export interface ChatConversation {
  id: number;
  userId: number;
  adminId?: number;
  supplierId?: number;
  subject: string;
  status: 'new' | 'active' | 'closed';
  lastMessageAt: Date;
  createdAt: Date;
  unreadCount?: number;
  messages?: ChatMessage[];
  user?: User;
  supplier?: Supplier;
}

/**
 * Interface para mensagens de chat
 */
export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderType: 'user' | 'admin' | 'supplier' | 'system';
  content: string;
  read: boolean;
  createdAt: Date;
  attachmentUrl?: string;
}

/**
 * Interface para comissões
 */
export interface Commission {
  id: number;
  orderId: number;
  productId: number;
  supplierId: number;
  amount: string;
  percentage: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: Date;
  createdAt: Date;
  order?: Order;
  product?: Product;
  supplier?: Supplier;
}

/**
 * Interface para pedidos
 */
export interface Order {
  id: number;
  userId: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: string;
  createdAt: Date;
  updatedAt?: Date;
  items?: OrderItem[];
  user?: User;
}

/**
 * Interface para itens de pedido
 */
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  supplierId: number;
  createdAt: Date;
  product?: Product;
  supplier?: Supplier;
}

/**
 * Interface para avaliações
 */
export interface Review {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
  user?: User;
  product?: Product;
}

/**
 * Interface para notificações
 */
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

/**
 * Interface para kits (montagem de estabelecimentos)
 */
export interface Kit {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  establishmentType: string;
  totalPrice: string;
  discount?: number;
  active: boolean;
  createdAt: Date;
  items: KitItem[];
}

/**
 * Interface para itens de kits
 */
export interface KitItem {
  id: number;
  kitId: number;
  productId: number;
  quantity: number;
  product?: Product;
}

/**
 * Interface para respostas de API paginadas
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}