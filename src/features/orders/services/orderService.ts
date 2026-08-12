import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';

export interface OrderItem {
  id: number | string;
  product_id?: number | string;
  product_name: string;
  quantity: number;
  price: number | string;
  total?: number | string;
  image?: string;
}

export interface Order {
  id: number | string;
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: number | string;
  shipping_address?: string;
  payment_method?: string;
  payment_status?: string;
  total_amount: number | string;
  subtotal?: number | string;
  tax_amount?: number | string;
  discount_amount?: number | string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'DELIVERED' | string;
  branch_id?: number | string | null;
  branch_name?: string;
  delivery_person_id?: number | string | null;
  notes?: string;
  items?: OrderItem[];
  items_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderPayload {
  company_id?: number;
  branch_id?: number | null;
  customer_id?: number | null;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  total_amount?: number | string;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  requested_invoice_no?: string;
  payment?: {
    method: 'CASH' | 'CARD' | 'UPI' | 'RAZORPAY' | 'NETBANKING' | string;
    status?: 'PENDING' | 'PAID' | 'FAILED' | string;
    transaction_id?: string;
  };
  items?: {
    product_id: number | string;
    quantity: number;
    price: number;
  }[];
  notes?: string;
}


/**
 * Deeply maps and normalizes raw backend order payloads (supporting camelCase, snake_case, nested structures).
 */
export function normalizeOrder(raw: any): Order {
  if (!raw || typeof raw !== 'object') {
    return {
      id: String(Date.now()),
      total_amount: 0,
      status: 'PENDING',
    };
  }

  const id = raw.id ?? raw.order_id ?? raw.orderId ?? raw._id ?? '';
  
  const orderNumber =
    raw.order_number ||
    raw.orderNumber ||
    raw.order_no ||
    raw.orderNo ||
    raw.invoice_no ||
    raw.invoiceNo ||
    raw.invoice_number ||
    (id ? `ORD-${id}` : 'ORD-PENDING');

  const customerName =
    raw.customer_name ||
    raw.customerName ||
    raw.customer?.name ||
    raw.user?.name ||
    raw.shipping_address?.name ||
    raw.billing_address?.name ||
    raw.customer?.email?.split('@')[0] ||
    raw.user?.email?.split('@')[0] ||
    'Customer';

  const customerPhone =
    raw.customer_phone ||
    raw.customerPhone ||
    raw.customer?.mobilenumber ||
    raw.customer?.phone ||
    raw.user?.mobilenumber ||
    raw.user?.phone ||
    raw.phone ||
    raw.shipping_address?.phone ||
    '';

  const customerEmail =
    raw.customer_email ||
    raw.customerEmail ||
    raw.customer?.email ||
    raw.user?.email ||
    raw.email ||
    '';

  const totalAmount =
    raw.total_amount ??
    raw.totalAmount ??
    raw.grand_total ??
    raw.grandTotal ??
    raw.total ??
    raw.amount ??
    raw.net_amount ??
    raw.subtotal ??
    0;

  const status = (
    raw.status ||
    raw.order_status ||
    raw.orderStatus ||
    'PENDING'
  ).toString().toUpperCase();

  // Normalize order items
  const rawItems =
    raw.items ||
    raw.order_items ||
    raw.orderItems ||
    raw.OrderItems ||
    raw.products ||
    raw.OrderProducts ||
    [];

  const items: OrderItem[] = Array.isArray(rawItems)
    ? rawItems.map((it: any, idx: number) => ({
        id: it.id ?? it.product_id ?? it.productId ?? idx + 1,
        product_id: it.product_id ?? it.productId ?? it.product?.id,
        product_name:
          it.product_name ||
          it.productName ||
          it.product?.name ||
          it.name ||
          it.title ||
          `Product #${idx + 1}`,
        quantity: parseInt(String(it.quantity ?? it.qty ?? it.count ?? 1), 10),
        price: parseFloat(String(it.price ?? it.unit_price ?? it.unitPrice ?? 0)),
        total: parseFloat(String(it.total ?? it.total_price ?? ((it.quantity || 1) * (it.price || 0)))),
        image: it.image || it.product?.image || it.image_url || '',
      }))
    : [];

  const paymentMethod =
    raw.payment_method ||
    raw.paymentMethod ||
    raw.payment?.method ||
    raw.payment?.payment_method ||
    raw.payment_type ||
    'CASH';

  const paymentStatus =
    raw.payment_status ||
    raw.paymentStatus ||
    raw.payment?.status ||
    'PENDING';

  let shippingAddress = '';
  if (typeof raw.shipping_address === 'string') {
    shippingAddress = raw.shipping_address;
  } else if (typeof raw.shippingAddress === 'string') {
    shippingAddress = raw.shippingAddress;
  } else if (typeof raw.address === 'string') {
    shippingAddress = raw.address;
  } else if (raw.shipping_address && typeof raw.shipping_address === 'object') {
    shippingAddress = [
      raw.shipping_address.address_line,
      raw.shipping_address.street,
      raw.shipping_address.city,
      raw.shipping_address.pincode || raw.shipping_address.postal_code,
    ].filter(Boolean).join(', ');
  } else if (raw.address && typeof raw.address === 'object') {
    shippingAddress = [
      raw.address.address_line,
      raw.address.street,
      raw.address.city,
      raw.address.pincode || raw.address.postal_code,
    ].filter(Boolean).join(', ');
  }

  const createdAt =
    raw.created_at ||
    raw.createdAt ||
    raw.date ||
    raw.order_date ||
    raw.orderDate ||
    new Date().toISOString();

  return {
    id,
    order_number: orderNumber,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    customer_id: raw.customer_id ?? raw.customerId ?? raw.user_id ?? raw.userId,
    shipping_address: shippingAddress,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    total_amount: totalAmount,
    subtotal: raw.subtotal,
    tax_amount: raw.tax_amount ?? raw.taxAmount,
    discount_amount: raw.discount_amount ?? raw.discountAmount,
    status,
    branch_id: raw.branch_id ?? raw.branchId,
    branch_name: raw.branch_name ?? raw.branchName ?? raw.branch?.name,
    delivery_person_id: raw.delivery_person_id ?? raw.deliveryPersonId,
    notes: raw.notes || raw.order_notes || '',
    items,
    items_count: items.length || parseInt(String(raw.total_items || raw.item_count || 0), 10),
    created_at: createdAt,
    updated_at: raw.updated_at || raw.updatedAt,
  };
}

export class OrderService {
  /**
   * Fetch all orders from backend API (GET /orders) with deep normalization
   */
  static async getOrders(statusFilter?: string): Promise<Order[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.ORDERS, {
        params: statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : undefined,
      });

      const normalized = normalizeApiResponse<any>(response.data);
      const rawList = Array.isArray(normalized.data)
        ? normalized.data
        : Array.isArray(response.data?.orders)
        ? response.data.orders
        : Array.isArray(response.data)
        ? response.data
        : [];

      const list: Order[] = rawList.map(normalizeOrder);

      // Client-side filter as a safety net if backend doesn't filter
      if (statusFilter && statusFilter !== 'ALL') {
        const target = statusFilter.toUpperCase();
        return list.filter((ord) => (ord.status || '').toUpperCase() === target);
      }
      return list;
    } catch (err: any) {
      console.warn('Failed to fetch orders:', err.message);
      return [];
    }
  }

  /**
   * Fetch single order by ID (GET /orders/:id)
   */
  static async getOrderById(id: number | string): Promise<Order | null> {
    try {
      const response = await axiosClient.get(ENDPOINTS.ORDER_BY_ID(id));
      const normalized = normalizeApiResponse<any>(response.data);
      const raw = normalized.data || response.data?.order || response.data;
      return raw ? normalizeOrder(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new order (POST /orders/create)
   */
  static async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const response = await axiosClient.post(ENDPOINTS.ORDERS_CREATE, payload);
    const normalized = normalizeApiResponse<any>(response.data);
    const raw = normalized.data || response.data?.order || response.data;
    if (!raw) {
      throw new Error(normalized.message || 'Failed to create order');
    }
    return normalizeOrder(raw);
  }

  /**
   * Update order status with multi-fallback API calls & deep error diagnostic extraction
   */
  static async updateOrderStatus(id: number | string, status: string): Promise<Order> {
    const targetStatus = status.toUpperCase();
    const payload = {
      status: targetStatus,
      order_status: targetStatus,
      orderStatus: targetStatus,
    };

    let lastError = 'Failed to update order status';

    // 1. Try PATCH /orders/:id/status
    try {
      const response = await axiosClient.patch(ENDPOINTS.ORDER_STATUS_UPDATE(id), payload);
      const normalized = normalizeApiResponse<any>(response.data);
      const raw = normalized.data || response.data?.order || response.data;
      if (raw) return normalizeOrder(raw);
    } catch (err: any) {
      lastError = err.response?.data?.message || err.message || lastError;
    }

    // 2. Try PUT /orders/:id/status
    try {
      const response = await axiosClient.put(ENDPOINTS.ORDER_STATUS_UPDATE(id), payload);
      const normalized = normalizeApiResponse<any>(response.data);
      const raw = normalized.data || response.data?.order || response.data;
      if (raw) return normalizeOrder(raw);
    } catch (err: any) {
      lastError = err.response?.data?.message || err.message || lastError;
    }

    // 3. Try PUT /orders/:id
    try {
      const response = await axiosClient.put(ENDPOINTS.ORDER_BY_ID(id), payload);
      const normalized = normalizeApiResponse<any>(response.data);
      const raw = normalized.data || response.data?.order || response.data;
      if (raw) return normalizeOrder(raw);
    } catch (err: any) {
      lastError = err.response?.data?.message || err.message || lastError;
    }

    // 4. Try POST /orders/:id/status
    try {
      const response = await axiosClient.post(ENDPOINTS.ORDER_STATUS_UPDATE(id), payload);
      const normalized = normalizeApiResponse<any>(response.data);
      const raw = normalized.data || response.data?.order || response.data;
      if (raw) return normalizeOrder(raw);
    } catch (err: any) {
      lastError = err.response?.data?.message || err.message || lastError;
    }

    throw new Error(lastError);
  }

  /**
   * Delete an order (DELETE /orders/:id)
   */
  static async deleteOrder(id: number | string): Promise<boolean> {
    try {
      await axiosClient.delete(ENDPOINTS.ORDER_BY_ID(id));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete order');
    }
  }

  /**
   * Get invoice PDF stream URL for an order
   */
  static getInvoicePdfUrl(id: number | string, theme = 'premium'): string {
    return `${ENDPOINTS.ORDER_INVOICE_PDF(id)}?theme=${theme}`;
  }

  /**
   * Verify an order invoice by ID (GET /orders/verify/:id)
   */
  static async verifyOrder(id: number | string): Promise<Order | null> {
    try {
      const response = await axiosClient.get(ENDPOINTS.ORDER_VERIFY(id));
      const normalized = normalizeApiResponse<any>(response.data);
      const raw = normalized.data || response.data;
      return raw ? normalizeOrder(raw) : null;
    } catch {
      return null;
    }
  }
}
