import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';
import { ProductService, Product, Category } from '../../products/services/productService';
import { OrderService, Order } from '../../orders/services/orderService';
import { BranchService, Branch } from '../../branches/services/branchService';
import { EmployeeService, Employee } from '../../employees/services/employeeService';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalBranches: number;
  totalEmployees: number;
  totalCategories: number;
  recentOrders: Order[];
  productsList: Product[];
  branchesList: Branch[];
  employeesList: Employee[];
  categoriesList: Category[];
  // Backend-provided stats if available
  todayOrders?: number;
  todayRevenue?: number;
  pendingOrders?: number;
  activeProducts?: number;
}

export class DashboardService {
  /**
   * Try to fetch from the backend /dashboard endpoint first.
   * If that endpoint isn't available, aggregate from individual service calls.
   */
  static async fetchAggregatedData(): Promise<DashboardMetrics> {
    // Try backend dashboard endpoint first
    try {
      const dashResponse = await axiosClient.get(ENDPOINTS.DASHBOARD);
      const dashNorm = normalizeApiResponse<any>(dashResponse.data);
      if (dashNorm.data && typeof dashNorm.data === 'object') {
        const d = dashNorm.data;
        // Map backend dashboard format to our DashboardMetrics
        return {
          totalRevenue: parseFloat(String(d.totalRevenue || d.revenue || d.total_revenue || 0)),
          totalOrders: Number(d.totalOrders || d.orders || d.total_orders || 0),
          totalProducts: Number(d.totalProducts || d.products || d.total_products || 0),
          totalBranches: Number(d.totalBranches || d.branches || d.total_branches || 0),
          totalEmployees: Number(d.totalEmployees || d.employees || d.total_employees || 0),
          totalCategories: Number(d.totalCategories || d.categories || d.total_categories || 0),
          todayOrders: Number(d.todayOrders || d.today_orders || 0),
          todayRevenue: parseFloat(String(d.todayRevenue || d.today_revenue || 0)),
          pendingOrders: Number(d.pendingOrders || d.pending_orders || 0),
          activeProducts: Number(d.activeProducts || d.active_products || 0),
          recentOrders: Array.isArray(d.recentOrders || d.recent_orders) ? (d.recentOrders || d.recent_orders).slice(0, 5) : [],
          productsList: Array.isArray(d.products) ? d.products : [],
          branchesList: Array.isArray(d.branches) ? d.branches : [],
          employeesList: Array.isArray(d.employees) ? d.employees : [],
          categoriesList: Array.isArray(d.categories) ? d.categories : [],
        };
      }
    } catch {
      // Dashboard endpoint not available, fall through to aggregation
    }

    // Aggregate from individual endpoints
    const results = await Promise.allSettled([
      ProductService.getProducts(),
      OrderService.getOrders(),
      BranchService.getBranches(),
      EmployeeService.getEmployees(),
      ProductService.getCategories(),
    ]);

    const productsList: Product[] = results[0].status === 'fulfilled' ? results[0].value : [];
    const ordersList: Order[]     = results[1].status === 'fulfilled' ? results[1].value : [];
    const branchesList: Branch[]  = results[2].status === 'fulfilled' ? results[2].value : [];
    const employeesList: Employee[]= results[3].status === 'fulfilled' ? results[3].value : [];
    const categoriesList: Category[]= results[4].status === 'fulfilled' ? results[4].value : [];

    const totalRevenue = ordersList.reduce((sum, ord) => {
      const amt = parseFloat(String(ord.total_amount || 0));
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const pendingOrders = ordersList.filter(
      (o) => (o.status || '').toUpperCase() === 'PENDING'
    ).length;

    return {
      totalRevenue,
      totalOrders: ordersList.length,
      totalProducts: productsList.length,
      totalBranches: branchesList.length,
      totalEmployees: employeesList.length,
      totalCategories: categoriesList.length,
      pendingOrders,
      recentOrders: ordersList.slice(0, 5),
      productsList,
      branchesList,
      employeesList,
      categoriesList,
    };
  }
}
