import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';

export interface AttendanceRecord {
  id: number | string;
  user_id: number | string;
  user_name?: string;
  user_email?: string;
  check_in: string;
  check_out?: string | null;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | string;
  branch_name?: string;
  working_hours?: string | number;
}

export interface WorkforceLiveStatus {
  totalActive: number;
  onDuty: number;
  onBreak: number;
  offDuty: number;
  recentLogs: AttendanceRecord[];
}

export class AttendanceService {
  /**
   * Fetch today's attendance logs (GET /attendance/today)
   */
  static async getTodayAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.ATTENDANCE_TODAY);
      const normalized = normalizeApiResponse<AttendanceRecord[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch all attendance records with optional date filter (GET /attendance)
   */
  static async getAttendance(params?: { date?: string; userId?: string }): Promise<AttendanceRecord[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.ATTENDANCE, { params });
      const normalized = normalizeApiResponse<AttendanceRecord[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Log employee attendance check-in (POST /attendance/check-in)
   */
  static async checkIn(): Promise<AttendanceRecord> {
    const response = await axiosClient.post(ENDPOINTS.ATTENDANCE_CHECKIN, {
      timestamp: new Date().toISOString(),
    });
    const normalized = normalizeApiResponse<AttendanceRecord>(response.data);
    if (!normalized.data) {
      throw new Error(normalized.message || 'Check-in failed');
    }
    return normalized.data;
  }

  /**
   * Log employee check-out (PUT /attendance/check-out/:id)
   */
  static async checkOut(attendanceId: number | string): Promise<boolean> {
    try {
      await axiosClient.put(ENDPOINTS.ATTENDANCE_CHECKOUT(attendanceId), {
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Check-out failed');
    }
  }

  /**
   * Fetch live workforce distribution metrics (GET /workforce/live)
   * Returns zeros on failure — no static fallback data.
   */
  static async getWorkforceLive(): Promise<WorkforceLiveStatus> {
    try {
      const response = await axiosClient.get(ENDPOINTS.WORKFORCE_LIVE);
      const normalized = normalizeApiResponse<WorkforceLiveStatus>(response.data);
      if (normalized.data) return normalized.data;
    } catch {}

    // Return a clean zero-state — no hardcoded fake numbers
    return {
      totalActive: 0,
      onDuty: 0,
      onBreak: 0,
      offDuty: 0,
      recentLogs: [],
    };
  }

  /**
   * Get attendance dashboard summary (GET /attendance/dashboard)
   */
  static async getAttendanceDashboard(): Promise<any> {
    try {
      const response = await axiosClient.get(ENDPOINTS.ATTENDANCE_DASHBOARD);
      const normalized = normalizeApiResponse<any>(response.data);
      return normalized.data || null;
    } catch {
      return null;
    }
  }
}
