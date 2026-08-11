import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';

export type StockChangeType = 'ADDITION' | 'DEDUCTION' | 'AUDIT_ADJUSTMENT' | 'RETURN';

export interface StockLogItem {
  id: number | string;
  product_id: number | string;
  product_name?: string;
  quantity: number;
  type: StockChangeType;
  reason?: string;
  user_id?: number | string;
  user_name?: string;
  is_approved?: boolean;
  approved_by?: string;
  created_at: string;
}

export interface LowStockAlert {
  id: number | string;
  product_id: number | string;
  product_name: string;
  current_stock: number;
  threshold: number;
  level: 'LOW' | 'CRITICAL';
  created_at: string;
}

export class StockService {
  /**
   * Update stock count for a product (POST /stock/update)
   */
  static async updateStock(payload: {
    productId: number | string;
    quantity: number;
    type: StockChangeType;
    reason?: string;
  }): Promise<boolean> {
    try {
      const response = await axiosClient.post(ENDPOINTS.STOCK_UPDATE, payload);
      const normalized = normalizeApiResponse(response.data);
      return normalized.success;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update stock');
    }
  }

  /**
   * Fetch stock audit logs (GET /stock/logs)
   */
  static async getStockLogs(params?: {
    productId?: number | string;
    page?: number;
    limit?: number;
  }): Promise<StockLogItem[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.STOCK_LOGS, { params });
      const normalized = normalizeApiResponse<StockLogItem[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Approve a stock adjustment log (PUT /stock/logs/:id/approve)
   */
  static async approveStockLog(logId: number | string, comment?: string): Promise<boolean> {
    try {
      await axiosClient.put(ENDPOINTS.STOCK_LOG_APPROVE(logId), { comment });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to approve stock log');
    }
  }

  /**
   * Fetch low-stock alerts from the stock logs endpoint (GET /stock/logs)
   * NOTE: Backend /alerts endpoint does not exist — we filter from stock logs.
   */
  static async getLowStockAlerts(params?: { page?: number; limit?: number }): Promise<LowStockAlert[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.STOCK_LOGS, { params });
      const normalized = normalizeApiResponse<LowStockAlert[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Approve/dismiss a stock log entry (PUT /stock/logs/:id/approve)
   * NOTE: Backend /alerts/:id DELETE endpoint does not exist.
   */
  static async dismissAlert(alertId: number | string): Promise<boolean> {
    try {
      await axiosClient.put(ENDPOINTS.STOCK_LOG_APPROVE(alertId));
      return true;
    } catch {
      return false;
    }
  }
}
