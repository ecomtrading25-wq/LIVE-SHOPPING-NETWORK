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
 * TikTok Shop Marketplace Adapter
 * Integrates with TikTok Shop Open API
 */
export class TikTokShopAdapter extends MarketplaceAdapter {
  private apiVersion = "202312";
  private baseUrl = "https://open-api.tiktokglobalshop.com";

  constructor(channelId: string, credentials: ChannelCredentials) {
    super(channelId, credentials);
  }

  private generateSignature(path: string, params: Record<string, any>, timestamp: number): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join("");

    const signString = `${this.credentials.apiSecret}${path}${timestamp}${sortedParams}${this.credentials.apiSecret}`;

    return crypto.createHmac("sha256", this.credentials.apiSecret || "").update(signString).digest("hex");
  }

  private async request(path: string, params: Record<string, any> = {}, method = "GET") {
    const timestamp = Math.floor(Date.now() / 1000);

    const requestParams = {
      app_key: this.credentials.apiKey,
      timestamp: timestamp.toString(),
      shop_id: this.credentials.shopId,
      version: this.apiVersion,
      access_token: this.credentials.accessToken,
      ...params,
    };

    const signature = this.generateSignature(path, requestParams, timestamp);
    requestParams.sign = signature;

    const url = new URL(`${this.baseUrl}${path}`);
    Object.keys(requestParams).forEach((key) => {
      url.searchParams.append(key, requestParams[key]);
    });

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TikTok Shop API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    if (result.code !== 0) {
      throw new Error(`TikTok Shop API error: ${result.message}`);
    }

    return result.data;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request("/api/shop/get_authorized_shop");
      return true;
    } catch (error) {
      console.error("TikTok Shop connection test failed:", error);
      return false;
    }
  }

  async syncProducts(): Promise<Product[]> {
    const data = await this.request("/api/products/search", {
      page_size: 100,
    });

    const tiktokProducts = data.products || [];
    return tiktokProducts.map((p: any) => this.mapTikTokProduct(p));
  }

  async getProduct(platformProductId: string): Promise<Product | null> {
    try {
      const data = await this.request("/api/products/details", {
        product_id: platformProductId,
      });

      return this.mapTikTokProduct(data);
    } catch (error) {
      return null;
    }
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const tiktokProduct = {
      product_name: product.name,
      description: product.description,
      category_id: "0", // Would need to be mapped
      brand_id: "",
      main_images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      skus: [
        {
          seller_sku: product.sku,
          sales_attributes: [],
          price: {
            amount: product.price,
            currency: "USD",
          },
          inventory: [
            {
              warehouse_id: "default",
              quantity: 0,
            },
          ],
        },
      ],
    };

    const data = await this.request("/api/products/create", tiktokProduct, "POST");

    return {
      id: data.product_id,
      ...product,
    };
  }

  async updateProduct(platformProductId: string, updates: Partial<Product>): Promise<Product> {
    const tiktokUpdates: any = {
      product_id: platformProductId,
    };

    if (updates.name) tiktokUpdates.product_name = updates.name;
    if (updates.description) tiktokUpdates.description = updates.description;

    await this.request("/api/products/update", tiktokUpdates, "PUT");

    const updated = await this.getProduct(platformProductId);
    if (!updated) {
      throw new Error("Failed to fetch updated product");
    }

    return updated;
  }

  async updateInventory(updates: InventoryUpdate[]): Promise<void> {
    for (const update of updates) {
      await this.request(
        "/api/products/stocks/update",
        {
          sku_id: update.sku,
          available_stock: update.quantity,
          warehouse_id: update.locationId || "default",
        },
        "POST"
      );
    }
  }

  async syncOrders(since?: Date): Promise<Order[]> {
    const params: any = {
      page_size: 100,
      sort_type: 1, // Create time descending
    };

    if (since) {
      params.create_time_from = Math.floor(since.getTime() / 1000);
      params.create_time_to = Math.floor(Date.now() / 1000);
    }

    const data = await this.request("/api/orders/search", params);

    const tiktokOrders = data.orders || [];
    const orders: Order[] = [];

    // Fetch full order details for each order
    for (const orderSummary of tiktokOrders) {
      const order = await this.getOrder(orderSummary.order_id);
      if (order) {
        orders.push(order);
      }
    }

    return orders;
  }

  async getOrder(platformOrderId: string): Promise<Order | null> {
    try {
      const data = await this.request("/api/orders/detail/query", {
        order_id_list: platformOrderId,
      });

      const tiktokOrder = data.order_list?.[0];
      if (!tiktokOrder) return null;

      return this.mapTikTokOrder(tiktokOrder);
    } catch (error) {
      return null;
    }
  }

  async updateOrderStatus(platformOrderId: string, status: string): Promise<void> {
    // TikTok Shop manages order status automatically based on fulfillment
    console.log(`TikTok Shop order ${platformOrderId} status: ${status}`);
  }

  async createShipment(shipment: Shipment): Promise<void> {
    await this.request(
      "/api/fulfillment/ship",
      {
        order_id: shipment.orderId,
        tracking_number: shipment.trackingNumber,
        shipping_provider_id: this.mapCarrierToTikTok(shipment.carrier),
      },
      "POST"
    );
  }

  async processWebhook(payload: WebhookPayload): Promise<void> {
    switch (payload.event) {
      case "ORDER_STATUS_CHANGE":
        console.log("Processing TikTok order webhook:", payload.data.order_id);
        // Trigger order sync
        break;

      case "PRODUCT_CHANGE":
        console.log("Processing TikTok product webhook:", payload.data.product_id);
        // Trigger product sync
        break;

      case "INVENTORY_UPDATE":
        console.log("Processing TikTok inventory webhook");
        // Trigger inventory sync
        break;

      default:
        console.log("Unhandled TikTok webhook event:", payload.event);
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = crypto
      .createHmac("sha256", this.credentials.apiSecret || "")
      .update(payload, "utf8")
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  }

  private mapTikTokProduct(tiktokProduct: any): Product {
    const mainSku = tiktokProduct.skus?.[0] || {};

    return {
      id: tiktokProduct.id,
      sku: mainSku.seller_sku || "",
      name: tiktokProduct.product_name,
      description: tiktokProduct.description,
      price: mainSku.price?.amount || "0.00",
      compareAtPrice: mainSku.original_price?.amount,
      imageUrl: tiktokProduct.main_images?.[0]?.url_list?.[0],
      status: tiktokProduct.status === "LIVE" ? "active" : "draft",
      variants: tiktokProduct.skus?.map((sku: any) => ({
        id: sku.id,
        sku: sku.seller_sku,
        price: sku.price?.amount,
        inventory: sku.stock_infos?.[0]?.available_stock || 0,
      })),
      metadata: {
        tiktokId: tiktokProduct.id,
        categoryId: tiktokProduct.category_id,
        brandId: tiktokProduct.brand_id,
      },
    };
  }

  private mapTikTokOrder(tiktokOrder: any): Order {
    const recipient = tiktokOrder.recipient_address || {};
    const payment = tiktokOrder.payment || {};

    return {
      id: tiktokOrder.id,
      orderNumber: tiktokOrder.id,
      customerName: recipient.name,
      customerEmail: tiktokOrder.buyer_email,
      shippingAddress: {
        name: recipient.name,
        address1: recipient.address_line1 || "",
        address2: recipient.address_line2,
        city: recipient.city || "",
        province: recipient.state,
        provinceCode: recipient.region_code,
        country: recipient.region,
        countryCode: recipient.region_code,
        zip: recipient.zipcode || "",
        phone: recipient.phone,
      },
      items: tiktokOrder.item_list?.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        sku: item.seller_sku,
        name: item.product_name,
        quantity: item.quantity,
        price: item.sale_price,
        total: (parseFloat(item.sale_price) * item.quantity).toFixed(2),
      })) || [],
      subtotal: payment.sub_total,
      tax: payment.taxes || "0.00",
      shipping: payment.shipping_fee || "0.00",
      total: payment.total_amount,
      currency: payment.currency,
      status: this.mapTikTokOrderStatus(tiktokOrder.order_status),
      paymentStatus: tiktokOrder.payment_method_name ? "paid" : "pending",
      createdAt: new Date(tiktokOrder.create_time * 1000),
      metadata: {
        tiktokId: tiktokOrder.id,
        orderStatus: tiktokOrder.order_status,
        fulfillmentType: tiktokOrder.fulfillment_type,
      },
    };
  }

  private mapTikTokOrderStatus(tiktokStatus: string): string {
    const statusMap: Record<string, string> = {
      UNPAID: "pending",
      AWAITING_SHIPMENT: "processing",
      AWAITING_COLLECTION: "processing",
      IN_TRANSIT: "shipped",
      DELIVERED: "delivered",
      COMPLETED: "delivered",
      CANCELLED: "cancelled",
    };

    return statusMap[tiktokStatus] || "pending";
  }

  private mapCarrierToTikTok(carrier: string): string {
    const carrierMap: Record<string, string> = {
      USPS: "USPS",
      UPS: "UPS",
      FedEx: "FEDEX",
      DHL: "DHL",
    };

    return carrierMap[carrier] || carrier;
  }
}

// Register the adapter
AdapterRegistry.register("tiktok", TikTokShopAdapter);
