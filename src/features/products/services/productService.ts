import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';

export interface Product {
  id: number | string;
  name: string;
  description?: string;
  price: string | number;
  compare_at_price?: string | number | null;
  purchase_cost?: string | number | null;
  wholesale_price?: string | number | null;
  dealer_price?: string | number | null;
  stock?: number;
  stock_in_hand?: number;
  sku?: string | null;
  barcode?: string | null;
  category?: string;
  category_id?: number | string | null;
  sub_category?: string | null;
  brand?: string | null;
  unit?: string | null;
  image?: string | null;
  image_url?: string | null;
  images?: string[];
  video_url?: string | null;
  status?: string | boolean;
  featured?: boolean;
  tax_rate?: number | string | null;
  product_type?: 'simple' | 'variant';
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number | string;
  name: string;
  description?: string;
  image?: string | null;
  parent_id?: number | string | null;
  status?: boolean;
}

export class ProductService {
  /**
   * Fetch all products with optional filters (GET /products)
   */
  static async getProducts(search?: string, params?: Record<string, any>): Promise<Product[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.PRODUCTS, {
        params: {
          ...(search ? { search } : {}),
          ...params,
        },
      });
      const normalized = normalizeApiResponse<Product[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch product details by ID (GET /products/:id)
   */
  static async getProductById(id: number | string): Promise<Product | null> {
    try {
      const response = await axiosClient.get(ENDPOINTS.PRODUCT_BY_ID(id));
      const normalized = normalizeApiResponse<Product>(response.data);
      return normalized.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new product (POST /products/add)
   * Backend expects multipart/form-data for image/video uploads.
   * When imageUrl is an http URL (not a local file), we send JSON.
   * For local file uploads, caller must pass a FormData object.
   */
  static async createProduct(productData: Partial<Product>, formData?: FormData): Promise<Product> {
    let response: any;

    if (formData) {
      // Binary file upload via multipart/form-data
      response = await axiosClient.post(ENDPOINTS.PRODUCT_ADD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      // URL-based or text-only product creation
      const payload = {
        name: productData.name,
        description: productData.description || '',
        price: parseFloat(String(productData.price || 0)),
        compare_at_price: productData.compare_at_price != null ? parseFloat(String(productData.compare_at_price)) : null,
        purchase_cost: productData.purchase_cost != null ? parseFloat(String(productData.purchase_cost)) : null,
        wholesale_price: productData.wholesale_price != null ? parseFloat(String(productData.wholesale_price)) : null,
        dealer_price: productData.dealer_price != null ? parseFloat(String(productData.dealer_price)) : null,
        stock: parseInt(String(productData.stock || 0), 10),
        sku: productData.sku || '',
        barcode: productData.barcode || '',
        category: productData.category || '',
        sub_category: productData.sub_category || '',
        brand: productData.brand || '',
        unit: productData.unit || 'Pcs',
        image: productData.image || productData.image_url || '',
        image_url: productData.image_url || productData.image || '',
        images: productData.images || [],
        video_url: productData.video_url || '',
        status: productData.status || 'active',
        featured: Boolean(productData.featured),
        tax_rate: productData.tax_rate != null ? parseFloat(String(productData.tax_rate)) : 0,
        product_type: productData.product_type || 'simple',
      };
      response = await axiosClient.post(ENDPOINTS.PRODUCT_ADD, payload);
    }

    const normalized = normalizeApiResponse<Product>(response.data);
    if (!normalized.success && !normalized.data) {
      throw new Error(normalized.message || 'Failed to create product');
    }
    return (normalized.data as Product) || ({ id: Date.now(), ...productData } as Product);
  }

  /**
   * Update existing product (PUT /products/:id)
   */
  static async updateProduct(id: number | string, productData: Partial<Product>, formData?: FormData): Promise<Product> {
    let response: any;

    if (formData) {
      response = await axiosClient.put(ENDPOINTS.PRODUCT_BY_ID(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      const payload: Record<string, any> = {};
      if (productData.name !== undefined)           payload.name = productData.name;
      if (productData.description !== undefined)    payload.description = productData.description;
      if (productData.price !== undefined)          payload.price = parseFloat(String(productData.price));
      if (productData.compare_at_price !== undefined) payload.compare_at_price = productData.compare_at_price != null ? parseFloat(String(productData.compare_at_price)) : null;
      if (productData.purchase_cost !== undefined)  payload.purchase_cost = productData.purchase_cost != null ? parseFloat(String(productData.purchase_cost)) : null;
      if (productData.wholesale_price !== undefined) payload.wholesale_price = productData.wholesale_price != null ? parseFloat(String(productData.wholesale_price)) : null;
      if (productData.dealer_price !== undefined)   payload.dealer_price = productData.dealer_price != null ? parseFloat(String(productData.dealer_price)) : null;
      if (productData.stock !== undefined)          payload.stock = parseInt(String(productData.stock), 10);
      if (productData.sku !== undefined)            payload.sku = productData.sku;
      if (productData.barcode !== undefined)        payload.barcode = productData.barcode;
      if (productData.category !== undefined)       payload.category = productData.category;
      if (productData.sub_category !== undefined)   payload.sub_category = productData.sub_category;
      if (productData.brand !== undefined)          payload.brand = productData.brand;
      if (productData.unit !== undefined)           payload.unit = productData.unit;
      if (productData.image !== undefined)          payload.image = productData.image;
      if (productData.image_url !== undefined)      payload.image_url = productData.image_url;
      if (productData.images !== undefined)         payload.images = productData.images;
      if (productData.video_url !== undefined)      payload.video_url = productData.video_url;
      if (productData.status !== undefined)         payload.status = productData.status;
      if (productData.featured !== undefined)       payload.featured = productData.featured;
      if (productData.tax_rate !== undefined)       payload.tax_rate = productData.tax_rate != null ? parseFloat(String(productData.tax_rate)) : null;
      if (productData.product_type !== undefined)   payload.product_type = productData.product_type;

      response = await axiosClient.put(ENDPOINTS.PRODUCT_BY_ID(id), payload);
    }

    const normalized = normalizeApiResponse<Product>(response.data);
    return (normalized.data as Product) || ({ id, ...productData } as Product);
  }

  /**
   * Delete / archive product (DELETE /products/:id)
   */
  static async deleteProduct(id: number | string): Promise<boolean> {
    try {
      await axiosClient.delete(ENDPOINTS.PRODUCT_BY_ID(id));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete product');
    }
  }

  /**
   * Fetch all product categories (GET /categories)
   */
  static async getCategories(): Promise<Category[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.CATEGORIES);
      const normalized = normalizeApiResponse<Category[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }
}
