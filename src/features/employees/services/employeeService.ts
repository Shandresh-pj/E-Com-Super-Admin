import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';

export interface Employee {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  mobilenumber?: string;
  userType?: string;
  role?: string;
  branch_id?: number | string | null;
  branch_name?: string;
  branch?: { id: number; name: string };
  status?: boolean | string;
  shift?: string;
  image?: string;
  avatar?: string;
  created_at?: string;
}

export class EmployeeService {
  /**
   * Fetch all employees (GET /employees)
   */
  static async getEmployees(search?: string): Promise<Employee[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.EMPLOYEES, {
        params: search ? { search } : undefined,
      });
      const normalized = normalizeApiResponse<Employee[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch single employee by ID (GET /employees/:id)
   */
  static async getEmployeeById(id: number | string): Promise<Employee | null> {
    try {
      const response = await axiosClient.get(ENDPOINTS.EMPLOYEE_BY_ID(id));
      const normalized = normalizeApiResponse<Employee>(response.data);
      return normalized.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new employee / staff user (POST /auth/create-user)
   * Backend uses unified user creation with role assignment.
   */
  static async createEmployee(data: {
    name: string;
    email: string;
    password?: string;
    userType: string;
    phone?: string;
    branchId?: number | string;
  }): Promise<Employee> {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password || 'TemporaryPass@123',
      userType: data.userType || 'EMPLOYEE',
      mobilenumber: data.phone || '',
      branchId: data.branchId || undefined,
    };

    const response = await axiosClient.post(ENDPOINTS.AUTH_CREATE_USER, payload);
    const normalized = normalizeApiResponse<Employee>(response.data);
    if (!normalized.data && !normalized.success) {
      throw new Error(normalized.message || 'Failed to create employee');
    }
    return (normalized.data as Employee) || ({ id: Date.now(), ...payload } as Employee);
  }

  /**
   * Update employee profile (PUT /employees/:id)
   */
  static async updateEmployee(id: number | string, data: Partial<Employee>): Promise<Employee> {
    const response = await axiosClient.put(ENDPOINTS.EMPLOYEE_BY_ID(id), {
      name: data.name,
      phone: data.phone || data.mobilenumber,
      mobilenumber: data.mobilenumber || data.phone,
      branch_id: data.branch_id,
      status: data.status,
      shift: data.shift,
    });
    const normalized = normalizeApiResponse<Employee>(response.data);
    return (normalized.data as Employee) || ({ id, ...data } as Employee);
  }

  /**
   * Delete / deactivate an employee (DELETE /employees/:id)
   */
  static async deleteEmployee(id: number | string): Promise<boolean> {
    try {
      await axiosClient.delete(ENDPOINTS.EMPLOYEE_BY_ID(id));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete employee');
    }
  }
}
