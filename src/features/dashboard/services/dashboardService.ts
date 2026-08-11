import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';
import { ProductService, Product, Category } from '../../products/services/productService';
import { OrderService, Order } from '../../orders/services/orderService';
import { BranchService, Branch } from '../../branches/services/branchService';
import { EmployeeService, Employee } from '../../employees/services/employeeService';
import { StockService, LowStockAlert } from '../../products/services/stockService';
import { AttendanceService, WorkforceLiveStatus } from '../../attendance/services/attendanceService';
import { DeliveryService, DeliveryTrackingRecord } from '../../orders/services/deliveryService';

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
  lowStockAlerts: LowStockAlert[];
  lowStockCount: number;
  workforceLive?: WorkforceLiveStatus;
  activeDeliveries: DeliveryTrackingRecord[];
  // Backend-provided stats if available
  todayOrders?: number;
  todayRevenue?: number;
  pendingOrders?: number;
  activeProducts?: number;
}

export class DashboardService {
  /**
   * Aggregate real data from backend endpoints for all dashboards.
   */
  static async fetchAggregatedData(): Promise<DashboardMetrics> {
    const results = await Promise.allSettled([
      ProductService.getProducts(),
      OrderService.getOrders(),
      BranchService.getBranches(),
      EmployeeService.getEmployees(),
      ProductService.getCategories(),
      StockService.getLowStockAlerts(),
      AttendanceService.getWorkforceLive(),
      DeliveryService.getAllDeliveries(),
    ]);

    const productsList: Product[]         = results[0].status === 'fulfilled' ? results[0].value : [];
    const ordersList: Order[]             = results[1].status === 'fulfilled' ? results[1].value : [];
    const branchesList: Branch[]          = results[2].status === 'fulfilled' ? results[2].value : [];
    const employeesList: Employee[]       = results[3].status === 'fulfilled' ? results[3].value : [];
    const categoriesList: Category[]      = results[4].status === 'fulfilled' ? results[4].value : [];
    const lowStockAlerts: LowStockAlert[] = results[5].status === 'fulfilled' ? results[5].value : [];
    const workforceLive: WorkforceLiveStatus | undefined = results[6].status === 'fulfilled' ? results[6].value : undefined;
    const activeDeliveries: DeliveryTrackingRecord[] = results[7].status === 'fulfilled' ? results[7].value : [];

    const totalRevenue = ordersList.reduce((sum, ord) => {
      const amt = parseFloat(String(ord.total_amount || 0));
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const pendingOrders = ordersList.filter(
      (o) => (o.status || '').toUpperCase() === 'PENDING'
    ).length;

    // Filter today's orders
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrdersList = ordersList.filter((o) => (o.created_at || '').startsWith(todayStr));
    const todayRevenue = todayOrdersList.reduce((sum, ord) => {
      const amt = parseFloat(String(ord.total_amount || 0));
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    return {
      totalRevenue,
      totalOrders: ordersList.length,
      totalProducts: productsList.length,
      totalBranches: branchesList.length,
      totalEmployees: employeesList.length,
      totalCategories: categoriesList.length,
      pendingOrders,
      todayOrders: todayOrdersList.length,
      todayRevenue,
      recentOrders: ordersList.slice(0, 8),
      productsList,
      branchesList,
      employeesList,
      categoriesList,
      lowStockAlerts,
      lowStockCount: lowStockAlerts.length,
      workforceLive,
      activeDeliveries,
    };
  }
}

