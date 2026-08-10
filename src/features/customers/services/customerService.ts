import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';

export interface Customer {
  id: number | string;
  name: string;
  phone?: string;
  mobilenumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  total_orders?: number;
  total_spent?: number | string;
  loyalty_points?: number;
  status?: boolean | string;
  created_at?: string;
}

export class CustomerService {
  /**
   * Fetch customer directory with optional search (GET /customers)
   */
  static async getCustomers(search?: string): Promise<Customer[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.CUSTOMERS, {
        params: search ? { search } : undefined,
      });
      const normalized = normalizeApiResponse<Customer[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch single customer by ID (GET /customers/:id)
   */
  static async getCustomerById(id: number | string): Promise<Customer | null> {
    try {
      const response = await axiosClient.get(ENDPOINTS.CUSTOMER_BY_ID(id));
      const normalized = normalizeApiResponse<Customer>(response.data);
      return normalized.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Register a new customer (POST /customers)
   */
  static async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const payload = {
      name: data.name,
      phone: data.phone || data.mobilenumber || '',
      mobilenumber: data.mobilenumber || data.phone || '',
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
    };

    const response = await axiosClient.post(ENDPOINTS.CUSTOMERS, payload);
    const normalized = normalizeApiResponse<Customer>(response.data);
    if (!normalized.success && !normalized.data) {
      throw new Error(normalized.message || 'Failed to create customer');
    }
    return (normalized.data as Customer) || ({ id: Date.now(), ...payload } as Customer);
  }

  /**
   * Update customer details (PUT /customers/:id)
   */
  static async updateCustomer(id: number | string, data: Partial<Customer>): Promise<Customer> {
    const response = await axiosClient.put(ENDPOINTS.CUSTOMER_BY_ID(id), {
      name: data.name,
      phone: data.phone || data.mobilenumber,
      mobilenumber: data.mobilenumber || data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    });
    const normalized = normalizeApiResponse<Customer>(response.data);
    return (normalized.data as Customer) || ({ id, ...data } as Customer);
  }

  /**
   * Delete a customer (DELETE /customers/:id)
   */
  static async deleteCustomer(id: number | string): Promise<boolean> {
    try {
      await axiosClient.delete(ENDPOINTS.CUSTOMER_BY_ID(id));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete customer');
    }
  }
}
