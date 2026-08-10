export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ecommerce_sec_access_token',
  REFRESH_TOKEN: 'ecommerce_sec_refresh_token',
  USER_DATA: 'ecommerce_user_profile',
  THEME_MODE: 'ecommerce_theme_mode',
  APP_LOCK_ENABLED: 'ecommerce_app_lock_enabled',
  APP_LOCK_TIMEOUT: 'ecommerce_app_lock_timeout',
  LAST_ACTIVE_TIMESTAMP: 'ecommerce_last_active_time',
} as const;

export const SECURITY_TIMEOUTS = {
  IMMEDIATELY: 0,
  THIRTY_SECONDS: 30,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
} as const;

export type SecurityTimeoutKey = keyof typeof SECURITY_TIMEOUTS;

export const API_TIMEOUT_MS = 15000;
