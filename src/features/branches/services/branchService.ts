import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';
import { useAuthStore } from '../../../store/authStore';

export interface Branch {
  id: number | string;
  name: string;
  code?: string;
  address?: string;
  location?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  opening_hours?: string;
  status?: boolean | string;
  total_staff?: number;
  total_orders?: number;
  total_revenue?: number;
  created_at?: string;
}

export class BranchService {
  /**
   * Fetch all company branch locations (GET /branches)
   */
  static async getBranches(): Promise<Branch[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.BRANCHES);
      const normalized = normalizeApiResponse<Branch[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch branch details by ID (GET /branches/:id)
   */
  static async getBranchById(id: number | string): Promise<Branch | null> {
    try {
      const response = await axiosClient.get(ENDPOINTS.BRANCH_BY_ID(id));
      const normalized = normalizeApiResponse<Branch>(response.data);
      return normalized.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new company branch (POST /branches)
   * Requires: company_id, name, location, email, phone
   */
  static async createBranch(branchData: Partial<Branch> & { company_id?: number }): Promise<Branch> {
    const authUser = useAuthStore.getState().user;
    const companyId = Number(branchData.company_id || authUser?.company_id || (authUser as any)?.companyId || 1);

    const payload = {
      company_id: companyId,
      name: branchData.name,
      location: branchData.address || branchData.location || '',
      address: branchData.address || '',
      city: branchData.city || '',
      state: branchData.state || '',
      pincode: branchData.pincode || '',
      phone: branchData.phone || '',
      email: branchData.email || '',
      manager_name: branchData.manager_name || '',
      opening_hours: branchData.opening_hours || '09:00 AM - 09:00 PM',
      status: branchData.status !== undefined ? branchData.status : true,
    };

    const response = await axiosClient.post(ENDPOINTS.BRANCHES, payload);
    const normalized = normalizeApiResponse<Branch>(response.data);
    if (!normalized.data) {
      throw new Error(normalized.message || 'Failed to create branch');
    }
    return normalized.data;
  }

  /**
   * Update branch details (PUT /branches/:id)
   */
  static async updateBranch(id: number | string, branchData: Partial<Branch>): Promise<Branch> {
    const response = await axiosClient.put(ENDPOINTS.BRANCH_BY_ID(id), {
      name: branchData.name,
      location: branchData.address || branchData.location,
      address: branchData.address,
      city: branchData.city,
      state: branchData.state,
      pincode: branchData.pincode,
      phone: branchData.phone,
      email: branchData.email,
      manager_name: branchData.manager_name,
      opening_hours: branchData.opening_hours,
      status: branchData.status,
    });
    const normalized = normalizeApiResponse<Branch>(response.data);
    return (normalized.data as Branch) || ({ id, ...branchData } as Branch);
  }

  /**
   * Delete a branch (DELETE /branches/:id)
   */
  static async deleteBranch(id: number | string): Promise<boolean> {
    try {
      await axiosClient.delete(ENDPOINTS.BRANCH_BY_ID(id));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete branch');
    }
  }
}
