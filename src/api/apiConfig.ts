import { getApiBaseUrl, environment } from '../config/environment';

export const getApiConfig = () => ({
  baseURL: getApiBaseUrl(),
  timeout: environment.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
