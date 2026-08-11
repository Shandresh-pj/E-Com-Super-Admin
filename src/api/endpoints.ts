/**
 * All API endpoint paths — verified against actual backend route files.
 *
 * Base URL: see environment.ts (local or production Render URL)
 *
 * IMPORTANT:
 *  - Only list endpoints that ACTUALLY exist in the backend controllers.
 *  - Do NOT invent endpoints — if a backend route doesn't exist, don't add it here.
 *  - Media/upload URLs are served WITHOUT /api — use resolveMediaUrl() from utils/mediaUrl.ts.
 */
export const ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────
  AUTH_LOGIN:              '/auth/login',
  AUTH_LOGOUT:             '/auth/logout',
  AUTH_REFRESH:            '/auth/refresh',
  AUTH_CREATE_USER:        '/auth/create-user',
  AUTH_REGISTER:           '/auth/register',
  AUTH_ME_PERMISSIONS:     '/auth/me/permissions',  // GET — fetch logged-in user's permissions
  AUTH_ASSIGN_ROLE:        '/auth/assign-role',
  AUTH_ADMIN_SET_PASSWORD: (userId: number | string) => `/auth/admin-set-password/${userId}`,
  AUTH_USER_BY_ID:         (id: number | string) => `/auth/user/${id}`,
  AUTH_USER_ACCESS:        (userId: number | string) => `/auth/user-access/${userId}`,
  AUTH_GET_USERS:          '/auth/get-users',
  AUTH_DELETE_USER:        (id: number | string) => `/auth/delete/${id}`,
  AUTH_VERIFY_EMAIL:       (token: string) => `/auth/verify/${token}`,

  // ── Profile ────────────────────────────────────────────────────────────
  PROFILE_ALL:             '/profile/all',
  PROFILE_ADD:             '/profile/add',
  PROFILE_BY_ID:           (id: number | string) => `/profile/${id}`,

  // ── Products ───────────────────────────────────────────────────────────
  PRODUCTS:                '/products',
  PRODUCT_ADD:             '/products/add',
  PRODUCT_BY_ID:           (id: string | number) => `/products/${id}`,
  PRODUCT_STATUS:          (id: string | number) => `/products/${id}/status`,
  PRODUCT_RESTORE:         (id: string | number) => `/products/${id}/restore`,
  PRODUCT_APPROVE:         (id: string | number) => `/products/${id}/approve`,
  PRODUCT_SCAN:            '/products/scan',
  BARCODE_SCAN:            '/barcode',
  PRODUCT_EXPORT:          '/products/export',
  PRODUCT_IMPORT:          '/products/import',

  // ── Categories ─────────────────────────────────────────────────────────
  CATEGORIES:              '/categories',
  CATEGORY_CREATE:         '/categories/create',
  CATEGORY_BY_ID:          (id: string | number) => `/categories/${id}`,
  CATEGORY_STATUS:         (id: string | number) => `/categories/${id}/status`,
  CATEGORY_PARENTS:        '/categories/parents/list',
  CATEGORY_CHILDREN:       (parentId: string | number) => `/categories/children/${parentId}`,
  CATEGORY_TREE:           '/categories/tree/list',

  // ── Orders ────────────────────────────────────────────────────────────
  ORDERS:                  '/orders',
  ORDERS_CREATE:           '/orders/create',
  ORDER_BY_ID:             (id: string | number) => `/orders/${id}`,
  ORDER_STATUS_UPDATE:     (id: string | number) => `/orders/${id}/status`,
  ORDER_VERIFY:            (id: string | number) => `/orders/verify/${id}`,
  ORDER_INVOICE_PDF:       (id: string | number) => `/orders/invoice-pdf/${id}`,
  ORDER_INVOICE:           (id: string | number) => `/orders/invoice/${id}`,
  ORDER_SUGGESTIONS:       (companyId: string | number) => `/orders/suggestions/${companyId}`,

  // ── Branches ──────────────────────────────────────────────────────────
  BRANCHES:                '/branches',
  BRANCH_BY_ID:            (id: string | number) => `/branches/${id}`,

  // ── Employees ─────────────────────────────────────────────────────────
  EMPLOYEES:               '/employees',
  EMPLOYEE_BY_ID:          (id: string | number) => `/employees/${id}`,

  // ── Customers & Cart ──────────────────────────────────────────────────
  CUSTOMERS:               '/customers',
  CUSTOMER_BY_ID:          (id: string | number) => `/customers/${id}`,
  CART:                    '/cart',
  CART_UPDATE:             (id: string | number) => `/cart/${id}`,

  // ── Profit & Loss ─────────────────────────────────────────────────────
  PROFIT_LOSS:             '/profit-loss',
  PROFIT_LOSS_AUTO_CALC:   '/profit-loss/auto-calculate',

  // ── Workforce & Attendance ────────────────────────────────────────────
  WORKFORCE_LIVE:           '/workforce/live',
  WORKFORCE_LIVE_DETAILS:   '/workforce/live/details',
  WORKFORCE_REPORT_DAILY:   '/workforce/report/daily',
  WORKFORCE_REPORT_MONTHLY: '/workforce/report/monthly',
  WORKFORCE_REPORT_EMPLOYEE: (empId: string | number) => `/workforce/report/employee/${empId}`,
  WORKFORCE_NOTIFICATIONS:  '/workforce/notifications',
  WORKFORCE_NOTIF_READ:     (id: string | number) => `/workforce/notifications/${id}/read`,

  ATTENDANCE:                '/attendance',
  ATTENDANCE_CHECKIN:        '/attendance/check-in',
  ATTENDANCE_CHECKOUT:       (id: string | number) => `/attendance/check-out/${id}`,
  ATTENDANCE_TODAY:          '/attendance/today',
  ATTENDANCE_DASHBOARD:      '/attendance/dashboard',
  ATTENDANCE_REPORT_DAILY:   '/attendance/report/daily',
  ATTENDANCE_REPORT_MONTHLY: '/attendance/report/monthly',

  // ── Notifications ─────────────────────────────────────────────────────
  NOTIFICATIONS:           '/notifications',
  NOTIFICATION_BY_ID:      (id: string | number) => `/notifications/${id}`,
  NOTIFICATION_READ:       (id: string | number) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL:  '/notifications/read-all',

  // ── Stock & Inventory ─────────────────────────────────────────────────
  STOCK:                   '/stock',
  STOCK_UPDATE:            '/stock/update',
  STOCK_LOGS:              '/stock/logs',
  STOCK_LOG_APPROVE:       (id: string | number) => `/stock/logs/${id}/approve`,
  STOCK_BY_PRODUCT:        (productId: string | number) => `/stock/${productId}`,

  // ── Delivery & Tracking ───────────────────────────────────────────────
  DELIVERY_TRACKING:        '/delivery-tracking',
  DELIVERY_TRACKING_START:  '/delivery-tracking/start',
  DELIVERY_LOCATION:        '/delivery-tracking/location',
  DELIVERY_ORDER:           (orderId: string | number) => `/delivery-tracking/order/${orderId}`,
  DELIVERY_DELIVERED:       (id: string | number) => `/delivery-tracking/delivered/${id}`,
  DELIVERY_DELETE:          (id: string | number) => `/delivery-tracking/${id}`,

  // ── Mobility ──────────────────────────────────────────────────────────
  MOBILITY_NEARBY:          '/mobility/vehicles/nearby',
  MOBILITY_FARE_ESTIMATE:   '/mobility/fare-estimate',
  MOBILITY_BOOKINGS:        '/mobility/bookings',
  MOBILITY_BOOKING_BY_ID:   (id: string | number) => `/mobility/bookings/${id}`,

  // ── Roles, Menus & Access ─────────────────────────────────────────────
  ROLES:                   '/roles',
  MENU_ALL:                '/menu',
  ROLE_ACCESS:             '/role-access',

  // ── Password ──────────────────────────────────────────────────────────
  PASSWORD_CHANGE:         '/password/change-my-password',
  PASSWORD_RESET_REQUEST:  '/password/reset-request',

  // ── Branch Stock ──────────────────────────────────────────────────────
  BRANCH_STOCK:            '/branch-stock',
  BRANCH_STOCK_TRANSFER:   '/branch-stock/transfer',
} as const;

/*
 * REMOVED (no backend implementation found):
 *   DASHBOARD: '/dashboard'          — no controller handles GET /dashboard
 *   ALERTS / ALERT_BY_ID             — no /alerts controller
 *   AUTH_SELECT_CONTEXT              — no /auth/select-context route
 */
