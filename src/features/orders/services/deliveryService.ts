import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';

export interface DeliveryTrackingRecord {
  id: number | string;
  order_id: number | string;
  order_number?: string;
  delivery_boy_id?: number | string;
  delivery_boy_name?: string;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | string;
  current_lat?: number;
  current_lng?: number;
  notes?: string;
  receiver_name?: string;
  receiver_phone?: string;
  delivery_address?: string;
  created_at: string;
  updated_at?: string;
}

export class DeliveryService {
  /**
   * Start delivery for an order (POST /delivery-tracking/start)
   */
  static async startDelivery(orderId: number | string, deliveryBoyId?: number | string, notes?: string): Promise<DeliveryTrackingRecord> {
    const response = await axiosClient.post(ENDPOINTS.DELIVERY_TRACKING_START, {
      order_id: orderId,
      delivery_boy_id: deliveryBoyId,
      notes,
    });
    const normalized = normalizeApiResponse<DeliveryTrackingRecord>(response.data);
    if (!normalized.data) {
      throw new Error(normalized.message || 'Failed to start delivery tracking');
    }
    return normalized.data;
  }

  /**
   * Ping driver live location (POST /delivery-tracking/location)
   */
  static async pingLocation(trackingId: number | string, lat: number, lng: number, heading?: number): Promise<boolean> {
    try {
      await axiosClient.post(ENDPOINTS.DELIVERY_LOCATION, {
        tracking_id: trackingId,
        lat,
        lng,
        heading,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetch tracking record for an order (GET /delivery-tracking/order/:order_id)
   */
  static async getTrackingByOrder(orderId: number | string): Promise<DeliveryTrackingRecord | null> {
    try {
      const response = await axiosClient.get(ENDPOINTS.DELIVERY_ORDER(orderId));
      const normalized = normalizeApiResponse<DeliveryTrackingRecord>(response.data);
      return normalized.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Mark delivery as delivered with proof notes (POST /delivery-tracking/delivered/:id)
   */
  static async markDelivered(trackingId: number | string, proofNotes?: string, signatureImage?: string): Promise<boolean> {
    try {
      await axiosClient.post(ENDPOINTS.DELIVERY_DELIVERED(trackingId), {
        proof_notes: proofNotes || 'Delivered to customer',
        signature_image: signatureImage,
      });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to mark delivery as completed');
    }
  }

  /**
   * Fetch all active delivery trackings (GET /delivery-tracking)
   */
  static async getAllDeliveries(params?: {
    status?: string;
    delivery_boy_id?: number | string;
    page?: number;
    limit?: number;
  }): Promise<DeliveryTrackingRecord[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.DELIVERY_TRACKING, { params });
      const normalized = normalizeApiResponse<DeliveryTrackingRecord[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }
}
