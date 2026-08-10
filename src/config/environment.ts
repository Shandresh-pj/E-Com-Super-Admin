export interface EnvironmentConfig {
  apiBaseUrl: string;
  isProduction: boolean;
  appVersion: string;
  enableDebugLogs: boolean;
  timeoutMs: number;
  coldStartTimeoutMs: number; // Extra-long timeout for Render.com cold starts
}

// Render.com free-tier backend — cold start can take 25-30 seconds
const PRODUCTION_API_URL = 'https://new-e-commerce-backend-xt4w.onrender.com/api';

export const environment: EnvironmentConfig = {
  apiBaseUrl: PRODUCTION_API_URL,
  isProduction: !__DEV__,
  appVersion: '1.0.0',
  enableDebugLogs: __DEV__,
  timeoutMs: 40000,           // 40s — covers Render cold-start delay
  coldStartTimeoutMs: 60000,  // 60s — first login attempt after long idle
};

export const getApiBaseUrl = (): string => environment.apiBaseUrl;
