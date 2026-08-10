import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getApiConfig } from './apiConfig';
import { TokenManager } from '../security/tokenManager';
import { normalizeApiError } from './responseNormalizer';
import { useAuthStore } from '../store/authStore';
import { ENDPOINTS } from './endpoints';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

export const axiosClient: AxiosInstance = axios.create(getApiConfig());

// Request Interceptor
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await TokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(normalizeApiError(error));
  }
);

// Response Interceptor with 401 Refresh Handling
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(normalizeApiError(error));
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      // Do not attempt refresh on login or refresh endpoint failures
      if (
        originalRequest.url?.includes(ENDPOINTS.AUTH_LOGIN) ||
        originalRequest.url?.includes(ENDPOINTS.AUTH_REFRESH)
      ) {
        return Promise.reject(normalizeApiError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosClient(originalRequest))
          .catch((err) => Promise.reject(normalizeApiError(err)));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await TokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshConfig = getApiConfig();
        const refreshResponse = await axios.post(
          `${refreshConfig.baseURL}${ENDPOINTS.AUTH_REFRESH}`,
          { refreshToken }
        );

        if (refreshResponse.data?.success && refreshResponse.data?.data?.accessToken) {
          const newAccessToken = refreshResponse.data.data.accessToken;
          const newRefreshToken = refreshResponse.data.data.refreshToken || refreshToken;

          await TokenManager.setTokens(newAccessToken, newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null);
          isRefreshing = false;

          return axiosClient(originalRequest);
        } else {
          throw new Error('Refresh token rejected');
        }
      } catch (refreshErr) {
        processQueue(refreshErr);
        isRefreshing = false;
        
        // Log out user cleanly
        useAuthStore.getState().logout();
        return Promise.reject(normalizeApiError(refreshErr));
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);
