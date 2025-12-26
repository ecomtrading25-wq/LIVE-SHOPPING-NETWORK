/**
 * Live Shopping Network - Multi-Channel Marketplace Adapters
 * Base adapter interface and types for platform integrations
 */

export interface ChannelCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  shopId?: string;
  storeUrl?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  imageUrl?: string;
  variants?: ProductVariant[];
  inventory?: number;
  status: "active" | "draft" | "archived";
  metadata?: Record<string, any>;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name?: string;
  price?: string;
  inventory?: number;
  options?: Record<string, string>;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  items: OrderItem[];
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: string;
  total: string;
}

export interface Address {
  name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  provinceCode?: string;
  country: string;
  countryCode: string;
  zip: string;
  phone?: string;
}

export interface Shipment {
  orderId: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrier: string;
  service?: string;
  items: Array<{
    sku: string;
    quantity: number;
  }>;
}

export interface InventoryUpdate {
  sku: string;
  quantity: number;
  locationId?: string;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

/**
 * Base adapter interface that all platform adapters must implement
 */
export abstract class MarketplaceAdapter {
  protected credentials: ChannelCredentials;
  protected channelId: string;

  constructor(channelId: string, credentials: ChannelCredentials) {
    this.channelId = channelId;
    this.credentials = credentials;
  }

  /**
   * Test the connection and credentials
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Sync products from the platform
   */
  abstract syncProducts(): Promise<Product[]>;

  /**
   * Get a single product by platform ID
   */
  abstract getProduct(platformProductId: string): Promise<Product | null>;

  /**
   * Create a new product on the platform
   */
  abstract createProduct(product: Omit<Product, "id">): Promise<Product>;

  /**
   * Update an existing product on the platform
   */
  abstract updateProduct(platformProductId: string, updates: Partial<Product>): Promise<Product>;

  /**
   * Update inventory levels on the platform
   */
  abstract updateInventory(updates: InventoryUpdate[]): Promise<void>;

  /**
   * Sync orders from the platform
   */
  abstract syncOrders(since?: Date): Promise<Order[]>;

  /**
   * Get a single order by platform ID
   */
  abstract getOrder(platformOrderId: string): Promise<Order | null>;

  /**
   * Update order status on the platform
   */
  abstract updateOrderStatus(platformOrderId: string, status: string): Promise<void>;

  /**
   * Create a shipment and push tracking to the platform
   */
  abstract createShipment(shipment: Shipment): Promise<void>;

  /**
   * Process a webhook from the platform
   */
  abstract processWebhook(payload: WebhookPayload): Promise<void>;

  /**
   * Verify webhook signature
   */
  abstract verifyWebhookSignature(payload: string, signature: string): boolean;
}

/**
 * Adapter registry for managing platform adapters
 */
export class AdapterRegistry {
  private static adapters = new Map<string, typeof MarketplaceAdapter>();

  static register(platform: string, adapter: typeof MarketplaceAdapter) {
    this.adapters.set(platform, adapter);
  }

  static get(platform: string): typeof MarketplaceAdapter | undefined {
    return this.adapters.get(platform);
  }

  static create(
    platform: string,
    channelId: string,
    credentials: ChannelCredentials
  ): MarketplaceAdapter {
    const AdapterClass = this.adapters.get(platform);
    if (!AdapterClass) {
      throw new Error(`No adapter registered for platform: ${platform}`);
    }
    return new AdapterClass(channelId, credentials);
  }
}
