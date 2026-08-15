import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';
import { useAuthStore } from '../../../store/authStore';

export interface Employee {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  mobilenumber?: string;
  userType?: string;
  role?: string;
  role_id?: number | string;
  branch_id?: number | string | null;
  branch_name?: string;
  branch?: { id: number; name: string };
  company_id?: number | string;
  employee_code?: string;
  department?: string;
  designation?: string;
  salary?: number | string;
  working_hours?: number;
  joining_date?: string;
  status?: boolean | string;
  isActive?: boolean;
  shift?: string;
  image?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password?: string;
  userType: string;
  phone?: string;
  mobilenumber?: string;
  company_id?: number | string;
  branch_id?: number | string;
  branchId?: number | string;
  role_id?: number | string;
  employee_code?: string;
  department?: string;
  designation?: string;
  salary?: number | string;
  working_hours?: number | string;
  joining_date?: string;
  isActive?: boolean;
}


export class EmployeeService {
  /**
   * Fetch all employees (GET /employees)
   */
  static async getEmployees(search?: string, params?: Record<string, any>): Promise<Employee[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.EMPLOYEES, {
        params: {
          ...(search ? { search } : {}),
          ...params,
        },
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
   * Create a new employee / staff member (POST /employees or POST /auth/create-user)
   */
  static async createEmployee(data: CreateEmployeePayload): Promise<Employee> {
    const authUser = useAuthStore.getState().user;
    const companyId = Number(data.company_id || authUser?.company_id || (authUser as any)?.companyId || 1);
    const branchId = Number(data.branch_id || data.branchId || authUser?.branch_id || (authUser as any)?.branchId || 1);
    const phoneNum = data.mobilenumber || data.phone || '';

    const payload = {
      name: data.name,
      email: data.email,
      password: data.password || 'Staff@12345',
      userType: data.userType || 'Employee',
      mobilenumber: phoneNum,
      mobile: phoneNum,
      company_id: companyId,
      branch_id: branchId,
      role_id: data.role_id || 3,
      employee_code: data.employee_code || `EMP-${Date.now().toString().slice(-4)}`,
      department: data.department || 'Operations',
      designation: data.designation || 'Staff',
      salary: data.salary != null ? parseFloat(String(data.salary)) : 0,
      working_hours: data.working_hours != null ? parseInt(String(data.working_hours), 10) : 8,
      joining_date: data.joining_date || new Date().toISOString().split('T')[0],
    };

    try {
      const response = await axiosClient.post(ENDPOINTS.EMPLOYEES, payload);
      const normalized = normalizeApiResponse<Employee>(response.data);
      if (normalized.data) return normalized.data;
    } catch {
      // Fallback to unified auth user creation endpoint
      const response = await axiosClient.post(ENDPOINTS.AUTH_CREATE_USER, payload);
      const normalized = normalizeApiResponse<Employee>(response.data);
      if (!normalized.data && !normalized.success) {
        throw new Error(normalized.message || 'Failed to create employee');
      }
      return (normalized.data as Employee) || ({ id: Date.now(), ...payload } as Employee);
    }
    return ({ id: Date.now(), ...payload } as Employee);
  }

  /**
   * Update employee profile (PUT /employees/:id)
   */
  static async updateEmployee(id: number | string, data: Partial<Employee>): Promise<Employee> {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.email !== undefined) payload.email = data.email;
    if (data.mobilenumber !== undefined || data.phone !== undefined) payload.mobilenumber = data.mobilenumber || data.phone;
    if (data.userType !== undefined) payload.userType = data.userType;
    if (data.branch_id !== undefined) payload.branch_id = data.branch_id;
    if (data.department !== undefined) payload.department = data.department;
    if (data.designation !== undefined) payload.designation = data.designation;
    if (data.employee_code !== undefined) payload.employee_code = data.employee_code;
    if (data.salary !== undefined) payload.salary = data.salary != null ? parseFloat(String(data.salary)) : null;
    if (data.working_hours !== undefined) payload.working_hours = data.working_hours != null ? parseInt(String(data.working_hours), 10) : null;
    if (data.joining_date !== undefined) payload.joining_date = data.joining_date;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.status !== undefined) payload.status = data.status;

    const response = await axiosClient.put(ENDPOINTS.EMPLOYEE_BY_ID(id), payload);
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

