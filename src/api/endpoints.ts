/**
 * All API endpoint paths — verified against backend route files
 * Base URL: https://new-e-commerce-backend-xt4w.onrender.com/api
 */
export const ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────
  AUTH_LOGIN:            '/auth/login',
  AUTH_LOGOUT:           '/auth/logout',
  AUTH_REFRESH:          '/auth/refresh',
  AUTH_CREATE_USER:      '/auth/create-user',
  AUTH_REGISTER:         '/auth/create-user',
  AUTH_ME_PERMISSIONS:   '/auth/me/permissions',
  AUTH_SELECT_CONTEXT:   '/auth/select-context',
  AUTH_ASSIGN_ROLE:      '/auth/assign-role',
  AUTH_USER_BY_ID:       (id: number | string) => `/auth/user/${id}`,
  AUTH_USER_ACCESS:      (userId: number | string) => `/auth/user-access/${userId}`,
  AUTH_GET_USERS:        '/auth/get-users',
  AUTH_VERIFY_EMAIL:     (token: string) => `/auth/verify/${token}`,

  // ── Profile ────────────────────────────────────────────────────────────
  PROFILE_ALL:           '/profile/all',
  PROFILE_ADD:           '/profile/add',
  PROFILE_BY_ID:         (id: number | string) => `/profile/${id}`,

  // ── Products ───────────────────────────────────────────────────────────
  PRODUCTS:              '/products',
  PRODUCT_ADD:           '/products/add',
  PRODUCT_BY_ID:         (id: string | number) => `/products/${id}`,
  PRODUCT_EXPORT:        '/products/export',
  PRODUCT_IMPORT:        '/products/import',
  CATEGORIES:            '/categories',
  CATEGORY_BY_ID:        (id: string | number) => `/categories/${id}`,

  // ── Orders ────────────────────────────────────────────────────────────
  ORDERS:                '/orders',
  ORDERS_CREATE:         '/orders/create',
  ORDER_BY_ID:           (id: string | number) => `/orders/${id}`,
  ORDER_STATUS_UPDATE:   (id: string | number) => `/orders/${id}/status`,
  ORDER_VERIFY:          (id: string | number) => `/orders/verify/${id}`,
  ORDER_INVOICE_PDF:     (id: string | number) => `/orders/invoice-pdf/${id}`,
  ORDER_INVOICE:         (id: string | number) => `/orders/invoice/${id}`,
  ORDER_SUGGESTIONS:     (companyId: string | number) => `/orders/suggestions/${companyId}`,

  // ── Branches ──────────────────────────────────────────────────────────
  BRANCHES:              '/branches',
  BRANCH_BY_ID:          (id: string | number) => `/branches/${id}`,

  // ── Employees ─────────────────────────────────────────────────────────
  EMPLOYEES:             '/employees',
  EMPLOYEE_BY_ID:        (id: string | number) => `/employees/${id}`,

  // ── Customers ─────────────────────────────────────────────────────────
  CUSTOMERS:             '/customers',
  CUSTOMER_BY_ID:        (id: string | number) => `/customers/${id}`,
  CART:                  '/cart',

  // ── Dashboard / Workforce ─────────────────────────────────────────────
  DASHBOARD:             '/dashboard',
  WORKFORCE_LIVE:        '/workforce/live',
  WORKFORCE_LIVE_DETAILS:  '/workforce/live/details',
  WORKFORCE_REPORT_DAILY:  '/workforce/report/daily',
  WORKFORCE_REPORT_MONTHLY:'/workforce/report/monthly',
  WORKFORCE_NOTIFICATIONS: '/workforce/notifications',

  // ── Attendance ────────────────────────────────────────────────────────
  ATTENDANCE:                '/attendance',
  ATTENDANCE_CHECKIN:        '/attendance/check-in',
  ATTENDANCE_CHECKOUT:       (id: string | number) => `/attendance/check-out/${id}`,
  ATTENDANCE_TODAY:          '/attendance/today',
  ATTENDANCE_DASHBOARD:      '/attendance/dashboard',
  ATTENDANCE_REPORT_DAILY:   '/attendance/report/daily',
  ATTENDANCE_REPORT_MONTHLY: '/attendance/report/monthly',

  // ── Notifications & Alerts ────────────────────────────────────────────
  NOTIFICATIONS:          '/notifications',
  NOTIFICATION_BY_ID:     (id: string | number) => `/notifications/${id}`,
  NOTIFICATION_READ:      (id: string | number) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',
  ALERTS:                 '/alerts',
  ALERTS_SEND:            '/alerts/send',

  // ── Payments ──────────────────────────────────────────────────────────
  PAYMENTS:               '/payments',

  // ── Subscriptions ─────────────────────────────────────────────────────
  SUBSCRIPTION_PLANS:     '/subscriptions/plans',
  SUBSCRIPTION_CURRENT:   '/subscriptions/current',

  // ── Delivery Tracking ─────────────────────────────────────────────────
  DELIVERY_TRACKING:        '/delivery-tracking',
  DELIVERY_TRACKING_START:  '/delivery-tracking/start',
  DELIVERY_ORDER:           (orderId: string | number) => `/delivery-tracking/order/${orderId}`,

  // ── Wishlist ──────────────────────────────────────────────────────────
  WISHLIST:               '/wishlist',
  WISHLIST_CHECK:         (productId: string | number) => `/wishlist/check/${productId}`,

  // ── Address ───────────────────────────────────────────────────────────
  ADDRESS:                '/address',
  ADDRESS_BY_ID:          (id: string | number) => `/address/${id}`,

  // ── Roles, Menus & Access ─────────────────────────────────────────────
  ROLES:                  '/roles',
  MENU_ALL:               '/menu',
  ROLE_ACCESS:            '/role-access',

  // ── Stock ─────────────────────────────────────────────────────────────
  STOCK:                  '/stock',
  STOCK_BY_PRODUCT:       (productId: string | number) => `/stock/${productId}`,

  // ── Audit ─────────────────────────────────────────────────────────────
  AUDIT:                  '/audit',

  // ── Password ──────────────────────────────────────────────────────────
  PASSWORD_CHANGE:        '/password/change-my-password',
  PASSWORD_RESET_REQUEST: '/password/reset-request',
} as const;
