import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';

export interface ProductVariant {
  id?: number | string;
  sku: string;
  price: number;
  stock: number;
  options: Record<string, string>;
  image?: string | null;
}

export interface ProductUnitConversion {
  id?: number | string;
  from_unit: string;
  to_unit: string;
  multiplier: number;
}

export interface Product {
  id: number | string;
  name: string;
  description?: string;
  price: string | number;
  purchase_cost?: string | number | null;
  retail_price?: string | number | null;
  wholesale_price?: string | number | null;
  dealer_price?: string | number | null;
  compare_at_price?: string | number | null;
  stock?: number;
  stock_in_hand?: number;
  base_unit?: string;
  unit?: string;
  sku?: string | null;
  barcode?: string | null;
  category?: string;
  category_id?: number | string | null;
  sub_category?: string | null;
  brand?: string | null;
  image?: string | null;
  image_url?: string | null;
  images?: string[];
  video?: string | null;
  video_url?: string | null;
  status?: string | boolean;
  approval_status?: 'Draft' | 'Pending Approval' | 'Approved' | 'Published' | 'Rejected' | string;
  product_type?: 'single' | 'variant' | 'simple';
  low_stock_threshold?: number;
  critical_stock_threshold?: number;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  featured?: boolean;
  tax_rate?: number | string | null;
  variants?: ProductVariant[];
  unitConversions?: ProductUnitConversion[];
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number | string;
  name: string;
  description?: string;
  image?: string | null;
  parent_id?: number | string | null;
  parent?: Category | null;
  children?: Category[];
  status?: boolean;
  created_at?: string;
  updated_at?: string;
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
   * Supports both multipart/form-data for image/video upload and standard JSON payloads.
   */
  static async createProduct(productData: Partial<Product>, formData?: FormData): Promise<Product> {
    let response: any;

    if (formData) {
      response = await axiosClient.post(ENDPOINTS.PRODUCT_ADD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      const payload = {
        name: productData.name,
        description: productData.description || '',
        price: parseFloat(String(productData.price || 0)),
        purchase_cost: productData.purchase_cost != null ? parseFloat(String(productData.purchase_cost)) : null,
        retail_price: productData.retail_price != null ? parseFloat(String(productData.retail_price)) : null,
        wholesale_price: productData.wholesale_price != null ? parseFloat(String(productData.wholesale_price)) : null,
        dealer_price: productData.dealer_price != null ? parseFloat(String(productData.dealer_price)) : null,
        stock: parseInt(String(productData.stock || productData.stock_in_hand || 0), 10),
        base_unit: productData.base_unit || productData.unit || 'Piece',
        barcode: productData.barcode || undefined,
        category: productData.category || '',
        product_type: productData.product_type || 'single',
        stock_in_hand: parseInt(String(productData.stock_in_hand || productData.stock || 0), 10),
        status: typeof productData.status === 'string' ? productData.status : productData.status ? 'active' : 'inactive',
        low_stock_threshold: productData.low_stock_threshold != null ? parseInt(String(productData.low_stock_threshold), 10) : 5,
        critical_stock_threshold: productData.critical_stock_threshold != null ? parseInt(String(productData.critical_stock_threshold), 10) : 2,
        manufacture_date: productData.manufacture_date || undefined,
        expiry_date: productData.expiry_date || undefined,
        image: productData.image || productData.image_url || '',
        images: productData.images || [],
        video: productData.video || productData.video_url || '',
        variants: productData.variants,
        unitConversions: productData.unitConversions,
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
      if (productData.name !== undefined)                     payload.name = productData.name;
      if (productData.description !== undefined)              payload.description = productData.description;
      if (productData.price !== undefined)                    payload.price = parseFloat(String(productData.price));
      if (productData.purchase_cost !== undefined)            payload.purchase_cost = productData.purchase_cost != null ? parseFloat(String(productData.purchase_cost)) : null;
      if (productData.retail_price !== undefined)             payload.retail_price = productData.retail_price != null ? parseFloat(String(productData.retail_price)) : null;
      if (productData.wholesale_price !== undefined)          payload.wholesale_price = productData.wholesale_price != null ? parseFloat(String(productData.wholesale_price)) : null;
      if (productData.dealer_price !== undefined)             payload.dealer_price = productData.dealer_price != null ? parseFloat(String(productData.dealer_price)) : null;
      if (productData.stock !== undefined)                    payload.stock = parseInt(String(productData.stock), 10);
      if (productData.stock_in_hand !== undefined)            payload.stock_in_hand = parseInt(String(productData.stock_in_hand), 10);
      if (productData.base_unit !== undefined || productData.unit !== undefined) payload.base_unit = productData.base_unit || productData.unit;
      if (productData.barcode !== undefined)                  payload.barcode = productData.barcode;
      if (productData.category !== undefined)                 payload.category = productData.category;
      if (productData.product_type !== undefined)             payload.product_type = productData.product_type;
      if (productData.status !== undefined)                   payload.status = productData.status;
      if (productData.low_stock_threshold !== undefined)      payload.low_stock_threshold = parseInt(String(productData.low_stock_threshold), 10);
      if (productData.critical_stock_threshold !== undefined) payload.critical_stock_threshold = parseInt(String(productData.critical_stock_threshold), 10);
      if (productData.manufacture_date !== undefined)         payload.manufacture_date = productData.manufacture_date;
      if (productData.expiry_date !== undefined)              payload.expiry_date = productData.expiry_date;
      if (productData.image !== undefined)                    payload.image = productData.image;
      if (productData.images !== undefined)                   payload.images = productData.images;
      if (productData.video !== undefined)                    payload.video = productData.video;

      response = await axiosClient.put(ENDPOINTS.PRODUCT_BY_ID(id), payload);
    }

    const normalized = normalizeApiResponse<Product>(response.data);
    return (normalized.data as Product) || ({ id, ...productData } as Product);
  }

  /**
   * Delete / Soft-delete product (DELETE /products/:id)
   */
  static async deleteProduct(id: number | string, permanent = false): Promise<boolean> {
    try {
      await axiosClient.delete(ENDPOINTS.PRODUCT_BY_ID(id), {
        params: permanent ? { permanent: 'true' } : undefined,
      });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete product');
    }
  }

  /**
   * Restore soft-deleted product (PUT /products/:id/restore)
   */
  static async restoreProduct(id: number | string): Promise<boolean> {
    try {
      await axiosClient.put(ENDPOINTS.PRODUCT_RESTORE(id));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to restore product');
    }
  }

  /**
   * Toggle product active status (PUT /products/:id/status)
   */
  static async toggleProductStatus(id: number | string, status: string): Promise<boolean> {
    try {
      await axiosClient.put(ENDPOINTS.PRODUCT_STATUS(id), { status });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update status');
    }
  }

  /**
   * Approve or reject product (PUT /products/:id/approve)
   */
  static async approveProduct(id: number | string, approvalStatus: string, remarks?: string): Promise<boolean> {
    try {
      await axiosClient.put(ENDPOINTS.PRODUCT_APPROVE(id), {
        status: approvalStatus,
        remarks,
      });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to approve product');
    }
  }

  /**
   * Scan product by barcode (POST /products/scan or GET /barcode)
   */
  static async scanBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await axiosClient.post(ENDPOINTS.PRODUCT_SCAN, { barcode });
      const normalized = normalizeApiResponse<Product>(response.data);
      return normalized.data || null;
    } catch {
      try {
        const fallback = await axiosClient.get(ENDPOINTS.BARCODE_SCAN, { params: { barcode } });
        const normalized = normalizeApiResponse<Product>(fallback.data);
        return normalized.data || null;
      } catch {
        return null;
      }
    }
  }

  // ── Category Methods ───────────────────────────────────────────────────

  /**
   * Fetch all categories (GET /categories)
   */
  static async getCategories(params?: { search?: string; parent_id?: number | string; status?: boolean }): Promise<Category[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.CATEGORIES, { params });
      const normalized = normalizeApiResponse<Category[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch category details by ID (GET /categories/:id)
   */
  static async getCategoryById(id: number | string): Promise<Category | null> {
    try {
      const response = await axiosClient.get(ENDPOINTS.CATEGORY_BY_ID(id));
      const normalized = normalizeApiResponse<Category>(response.data);
      return normalized.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new category (POST /categories/create)
   */
  static async createCategory(categoryData: Partial<Category>, formData?: FormData): Promise<Category> {
    let response: any;
    if (formData) {
      response = await axiosClient.post(ENDPOINTS.CATEGORY_CREATE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      response = await axiosClient.post(ENDPOINTS.CATEGORY_CREATE, {
        name: categoryData.name,
        description: categoryData.description || '',
        parent_id: categoryData.parent_id || null,
        image: categoryData.image || null,
        status: categoryData.status !== undefined ? categoryData.status : true,
      });
    }
    const normalized = normalizeApiResponse<Category>(response.data);
    if (!normalized.data) {
      throw new Error(normalized.message || 'Failed to create category');
    }
    return normalized.data;
  }

  /**
   * Update category (PUT /categories/:id)
   */
  static async updateCategory(id: number | string, categoryData: Partial<Category>, formData?: FormData): Promise<Category> {
    let response: any;
    if (formData) {
      response = await axiosClient.put(ENDPOINTS.CATEGORY_BY_ID(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      response = await axiosClient.put(ENDPOINTS.CATEGORY_BY_ID(id), categoryData);
    }
    const normalized = normalizeApiResponse<Category>(response.data);
    return (normalized.data as Category) || ({ id, ...categoryData } as Category);
  }

  /**
   * Delete category (DELETE /categories/:id)
   */
  static async deleteCategory(id: number | string): Promise<boolean> {
    try {
      await axiosClient.delete(ENDPOINTS.CATEGORY_BY_ID(id));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete category');
    }
  }

  /**
   * Toggle category status (PUT /categories/:id/status)
   */
  static async toggleCategoryStatus(id: number | string, status: boolean): Promise<boolean> {
    try {
      await axiosClient.put(ENDPOINTS.CATEGORY_STATUS(id), { status });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update category status');
    }
  }

  /**
   * Fetch hierarchical category tree (GET /categories/tree/list)
   */
  static async getCategoryTree(): Promise<Category[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.CATEGORY_TREE);
      const normalized = normalizeApiResponse<Category[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }
}

