import {
  MarketplaceAdapter,
  Product,
  Order,
  Shipment,
  InventoryUpdate,
  WebhookPayload,
  ChannelCredentials,
  AdapterRegistry,
} from "./base";
import crypto from "crypto";

/**
 * Shopify Marketplace Adapter
 * Integrates with Shopify Admin API
 */
export class ShopifyAdapter extends MarketplaceAdapter {
  private apiVersion = "2024-01";
  private baseUrl: string;

  constructor(channelId: string, credentials: ChannelCredentials) {
    super(channelId, credentials);
    this.baseUrl = `https://${credentials.storeUrl}/admin/api/${this.apiVersion}`;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": this.credentials.accessToken || "",
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request("/shop.json");
      return true;
    } catch (error) {
      console.error("Shopify connection test failed:", error);
      return false;
    }
  }

  async syncProducts(): Promise<Product[]> {
    const response = await this.request("/products.json?limit=250");
    const shopifyProducts = response.products || [];

    return shopifyProducts.map((p: any) => this.mapShopifyProduct(p));
  }

  async getProduct(platformProductId: string): Promise<Product | null> {
    try {
      const response = await this.request(`/products/${platformProductId}.json`);
      return this.mapShopifyProduct(response.product);
    } catch (error) {
      return null;
    }
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const shopifyProduct = {
      title: product.name,
      body_html: product.description,
      vendor: "Live Shopping Network",
      product_type: "Live Commerce",
      status: product.status === "active" ? "active" : "draft",
      variants: [
        {
          sku: product.sku,
          price: product.price,
          compare_at_price: product.compareAtPrice,
          inventory_management: "shopify",
        },
      ],
      images: product.imageUrl ? [{ src: product.imageUrl }] : [],
    };

    const response = await this.request("/products.json", {
      method: "POST",
      body: JSON.stringify({ product: shopifyProduct }),
    });

    return this.mapShopifyProduct(response.product);
  }

  async updateProduct(platformProductId: string, updates: Partial<Product>): Promise<Product> {
    const shopifyUpdates: any = {};

    if (updates.name) shopifyUpdates.title = updates.name;
    if (updates.description) shopifyUpdates.body_html = updates.description;
    if (updates.status) shopifyUpdates.status = updates.status === "active" ? "active" : "draft";

    const response = await this.request(`/products/${platformProductId}.json`, {
      method: "PUT",
      body: JSON.stringify({ product: shopifyUpdates }),
    });

    return this.mapShopifyProduct(response.product);
  }

  async updateInventory(updates: InventoryUpdate[]): Promise<void> {
    // Shopify requires inventory_item_id, which we'd need to fetch first
    // For now, this is a simplified implementation
    for (const update of updates) {
      // In production, you'd:
      // 1. Get variant by SKU
      // 2. Get inventory_item_id from variant
      // 3. Update inventory level
      console.log(`Updating inventory for SKU ${update.sku} to ${update.quantity}`);
    }
  }

  async syncOrders(since?: Date): Promise<Order[]> {
    let endpoint = "/orders.json?status=any&limit=250";
    if (since) {
      endpoint += `&created_at_min=${since.toISOString()}`;
    }

    const response = await this.request(endpoint);
    const shopifyOrders = response.orders || [];

    return shopifyOrders.map((o: any) => this.mapShopifyOrder(o));
  }

  async getOrder(platformOrderId: string): Promise<Order | null> {
    try {
      const response = await this.request(`/orders/${platformOrderId}.json`);
      return this.mapShopifyOrder(response.order);
    } catch (error) {
      return null;
    }
  }

  async updateOrderStatus(platformOrderId: string, status: string): Promise<void> {
    // Shopify doesn't have a direct "status" field update
    // Status is determined by fulfillment and financial status
    console.log(`Updating order ${platformOrderId} status to ${status}`);
  }

  async createShipment(shipment: Shipment): Promise<void> {
    const fulfillment = {
      location_id: null, // Would need to be configured
      tracking_number: shipment.trackingNumber,
      tracking_url: shipment.trackingUrl,
      tracking_company: shipment.carrier,
      notify_customer: true,
      line_items: shipment.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
      })),
    };

    await this.request(`/orders/${shipment.orderId}/fulfillments.json`, {
      method: "POST",
      body: JSON.stringify({ fulfillment }),
    });
  }

  async processWebhook(payload: WebhookPayload): Promise<void> {
    switch (payload.event) {
      case "orders/create":
      case "orders/updated":
        console.log("Processing order webhook:", payload.data.id);
        // Trigger order sync
        break;

      case "products/create":
      case "products/update":
        console.log("Processing product webhook:", payload.data.id);
        // Trigger product sync
        break;

      case "inventory_levels/update":
        console.log("Processing inventory webhook");
        // Trigger inventory sync
        break;

      default:
        console.log("Unhandled webhook event:", payload.event);
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = crypto
      .createHmac("sha256", this.credentials.apiSecret || "")
      .update(payload, "utf8")
      .digest("base64");

    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  }

  private mapShopifyProduct(shopifyProduct: any): Product {
    const mainVariant = shopifyProduct.variants?.[0] || {};

    return {
      id: shopifyProduct.id.toString(),
      sku: mainVariant.sku || "",
      name: shopifyProduct.title,
      description: shopifyProduct.body_html,
      price: mainVariant.price,
      compareAtPrice: mainVariant.compare_at_price,
      imageUrl: shopifyProduct.images?.[0]?.src,
      status: shopifyProduct.status === "active" ? "active" : "draft",
      variants: shopifyProduct.variants?.map((v: any) => ({
        id: v.id.toString(),
        sku: v.sku,
        name: v.title,
        price: v.price,
        inventory: v.inventory_quantity,
        options: {
          option1: v.option1,
          option2: v.option2,
          option3: v.option3,
        },
      })),
      metadata: {
        shopifyId: shopifyProduct.id,
        vendor: shopifyProduct.vendor,
        productType: shopifyProduct.product_type,
      },
    };
  }

  private mapShopifyOrder(shopifyOrder: any): Order {
    return {
      id: shopifyOrder.id.toString(),
      orderNumber: shopifyOrder.name || shopifyOrder.order_number.toString(),
      customerName: shopifyOrder.customer
        ? `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`
        : undefined,
      customerEmail: shopifyOrder.email,
      shippingAddress: this.mapShopifyAddress(shopifyOrder.shipping_address),
      billingAddress: shopifyOrder.billing_address
        ? this.mapShopifyAddress(shopifyOrder.billing_address)
        : undefined,
      items: shopifyOrder.line_items.map((item: any) => ({
        id: item.id.toString(),
        productId: item.product_id?.toString() || "",
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: (parseFloat(item.price) * item.quantity).toFixed(2),
      })),
      subtotal: shopifyOrder.subtotal_price,
      tax: shopifyOrder.total_tax,
      shipping: shopifyOrder.total_shipping_price_set?.shop_money?.amount || "0.00",
      total: shopifyOrder.total_price,
      currency: shopifyOrder.currency,
      status: this.mapShopifyOrderStatus(shopifyOrder),
      paymentStatus: shopifyOrder.financial_status,
      createdAt: new Date(shopifyOrder.created_at),
      metadata: {
        shopifyId: shopifyOrder.id,
        fulfillmentStatus: shopifyOrder.fulfillment_status,
        tags: shopifyOrder.tags,
      },
    };
  }

  private mapShopifyAddress(addr: any): any {
    if (!addr) return null;

    return {
      name: addr.name,
      company: addr.company,
      address1: addr.address1,
      address2: addr.address2,
      city: addr.city,
      province: addr.province,
      provinceCode: addr.province_code,
      country: addr.country,
      countryCode: addr.country_code,
      zip: addr.zip,
      phone: addr.phone,
    };
  }

  private mapShopifyOrderStatus(order: any): string {
    if (order.cancelled_at) return "cancelled";
    if (order.fulfillment_status === "fulfilled") return "delivered";
    if (order.fulfillment_status === "partial") return "shipped";
    if (order.financial_status === "refunded") return "refunded";
    if (order.financial_status === "paid") return "processing";
    return "pending";
  }
}

// Register the adapter
AdapterRegistry.register("shopify", ShopifyAdapter);
