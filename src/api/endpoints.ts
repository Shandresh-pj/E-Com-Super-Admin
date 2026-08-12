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
  // ── Auth & Users ──────────────────────────────────────────────────────
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_CREATE_USER: '/auth/create-user',
  AUTH_REGISTER: '/auth/register',
  AUTH_ME_PERMISSIONS: '/auth/me/permissions',
  AUTH_ASSIGN_ROLE: '/auth/assign-role',
  AUTH_ADMIN_SET_PASSWORD: (userId: number | string) => `/auth/admin-set-password/${userId}`,
  AUTH_USER_BY_ID: (id: number | string) => `/auth/user/${id}`,
  AUTH_USER_ACCESS: (userId: number | string) => `/auth/user-access/${userId}`,
  AUTH_GET_USERS: '/auth/get-users',
  AUTH_DELETE_USER: (id: number | string) => `/auth/delete/${id}`,
  AUTH_VERIFY_EMAIL: (token: string) => `/auth/verify/${token}`,

  // ── 1. Admin ─────────────────────────────────────────────────────────
  ADMIN: '/admin',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_SYSTEM: '/admin/system',

  // ── 2. Branch ────────────────────────────────────────────────────────
  BRANCHES: '/branches',
  BRANCH_BY_ID: (id: string | number) => `/branches/${id}`,

  // ── 3. Employee ──────────────────────────────────────────────────────
  EMPLOYEES: '/employees',
  EMPLOYEE_BY_ID: (id: string | number) => `/employees/${id}`,

  // ── 4. Role Access & 5. Roles ─────────────────────────────────────────
  ROLES: '/roles',
  ROLE_BY_ID: (id: string | number) => `/roles/${id}`,
  ROLE_ACCESS: '/role-access',
  ROLE_ACCESS_BY_ID: (id: string | number) => `/role-access/${id}`,

  // ── 6. Product Attribute & 7. Attribute Value ─────────────────────────
  PRODUCT_ATTRIBUTES: '/product-attributes',
  PRODUCT_ATTRIBUTE_BY_ID: (id: string | number) => `/product-attributes/${id}`,
  ATTRIBUTE_VALUES: '/attribute-values',

  // ── 8. Category ──────────────────────────────────────────────────────
  CATEGORIES: '/categories',
  CATEGORY_CREATE: '/categories/create',
  CATEGORY_BY_ID: (id: string | number) => `/categories/${id}`,
  CATEGORY_STATUS: (id: string | number) => `/categories/${id}/status`,
  CATEGORY_PARENTS: '/categories/parents/list',
  CATEGORY_CHILDREN: (parentId: string | number) => `/categories/children/${parentId}`,
  CATEGORY_TREE: '/categories/tree/list',

  // ── 9. Product ───────────────────────────────────────────────────────
  PRODUCTS: '/products',
  PRODUCT_ADD: '/products/add',
  PRODUCT_BY_ID: (id: string | number) => `/products/${id}`,
  PRODUCT_STATUS: (id: string | number) => `/products/${id}/status`,
  PRODUCT_RESTORE: (id: string | number) => `/products/${id}/restore`,
  PRODUCT_APPROVE: (id: string | number) => `/products/${id}/approve`,
  PRODUCT_SCAN: '/products/scan',
  BARCODE_SCAN: '/barcode',
  PRODUCT_EXPORT: '/products/export',
  PRODUCT_IMPORT: '/products/import',

  // ── 10. Orders ───────────────────────────────────────────────────────
  ORDERS: '/orders',
  ORDERS_CREATE: '/orders/create',
  ORDER_BY_ID: (id: string | number) => `/orders/${id}`,
  ORDER_STATUS_UPDATE: (id: string | number) => `/orders/${id}/status`,
  ORDER_VERIFY: (id: string | number) => `/orders/verify/${id}`,
  ORDER_INVOICE_PDF: (id: string | number) => `/orders/invoice-pdf/${id}`,
  ORDER_INVOICE: (id: string | number) => `/orders/invoice/${id}`,
  ORDER_SUGGESTIONS: (companyId: string | number) => `/orders/suggestions/${companyId}`,

  // ── 11. Coupons ──────────────────────────────────────────────────────
  COUPONS: '/coupons',
  COUPON_BY_ID: (id: string | number) => `/coupons/${id}`,
  COUPON_VALIDATE: '/coupons/validate',

  // ── 12. Audit Logs ───────────────────────────────────────────────────
  AUDIT_LOGS: '/audit-logs',
  AUDIT_LOG_BY_ID: (id: string | number) => `/audit-logs/${id}`,

  // ── 13. Status ───────────────────────────────────────────────────────
  STATUS_MASTER: '/status-master',
  STATUS_BY_ID: (id: string | number) => `/status-master/${id}`,

  // ── 14. Menu Bar ─────────────────────────────────────────────────────
  MENU_ALL: '/menus',
  MENU_BY_ID: (id: string | number) => `/menus/${id}`,

  // ── 15. Alerts ───────────────────────────────────────────────────────
  ALERTS: '/alerts',
  ALERT_BY_ID: (id: string | number) => `/alerts/${id}`,
  ALERT_DISMISS: (id: string | number) => `/alerts/${id}/dismiss`,

  // ── 16. Attendance ───────────────────────────────────────────────────
  ATTENDANCE: '/attendance',
  ATTENDANCE_CHECKIN: '/attendance/check-in',
  ATTENDANCE_CHECKOUT: (id: string | number) => `/attendance/check-out/${id}`,
  ATTENDANCE_TODAY: '/attendance/today',
  ATTENDANCE_DASHBOARD: '/attendance/dashboard',
  ATTENDANCE_REPORT_DAILY: '/attendance/report/daily',
  ATTENDANCE_REPORT_MONTHLY: '/attendance/report/monthly',

  // ── 17. Branch Stocks & 18. Stocks ───────────────────────────────────
  STOCK: '/stock',
  STOCK_UPDATE: '/stock/update',
  STOCK_LOGS: '/stock/logs',
  STOCK_LOG_APPROVE: (id: string | number) => `/stock/logs/${id}/approve`,
  STOCK_BY_PRODUCT: (productId: string | number) => `/stock/${productId}`,
  BRANCH_STOCK: '/branch-stock',
  BRANCH_STOCK_TRANSFER: '/branch-stock/transfer',

  // ── 19. Payroll ──────────────────────────────────────────────────────
  PAYROLL: '/payroll',
  PAYROLL_BY_ID: (id: string | number) => `/payroll/${id}`,
  PAYROLL_SLIP: (id: string | number) => `/payroll/${id}/slip`,

  // ── 20. Leave ────────────────────────────────────────────────────────
  LEAVE: '/leave',
  LEAVE_REQUEST: '/leave/request',
  LEAVE_BY_ID: (id: string | number) => `/leave/${id}`,
  LEAVE_APPROVE: (id: string | number) => `/leave/${id}/approve`,
  LEAVE_REJECT: (id: string | number) => `/leave/${id}/reject`,

  // ── 21. Delivery Tracking ────────────────────────────────────────────
  DELIVERY_TRACKING: '/delivery-tracking',
  DELIVERY_TRACKING_START: '/delivery-tracking/start',
  DELIVERY_LOCATION: '/delivery-tracking/location',
  DELIVERY_ORDER: (orderId: string | number) => `/delivery-tracking/order/${orderId}`,
  DELIVERY_DELIVERED: (id: string | number) => `/delivery-tracking/delivered/${id}`,
  DELIVERY_DELETE: (id: string | number) => `/delivery-tracking/${id}`,

  // ── 22. Payments ─────────────────────────────────────────────────────
  PAYMENTS: '/payments',
  PAYMENT_BY_ID: (id: string | number) => `/payments/${id}`,
  PAYMENT_VERIFY: '/payments/verify',

  // ── 23. Workforce Console ────────────────────────────────────────────
  WORKFORCE_LIVE: '/workforce/live',
  WORKFORCE_LIVE_DETAILS: '/workforce/live/details',
  WORKFORCE_REPORT_DAILY: '/workforce/report/daily',
  WORKFORCE_REPORT_MONTHLY: '/workforce/report/monthly',
  WORKFORCE_REPORT_EMPLOYEE: (empId: string | number) => `/workforce/report/employee/${empId}`,
  WORKFORCE_NOTIFICATIONS: '/workforce/notifications',
  WORKFORCE_NOTIF_READ: (id: string | number) => `/workforce/notifications/${id}/read`,

  // ── 24. Invoice Generator & 35. POS Billing ──────────────────────────
  INVOICES: '/invoices',
  INVOICE_CREATE: '/invoices/create',
  INVOICE_BY_ID: (id: string | number) => `/invoices/${id}`,
  POS_BILLING: '/pos-billing',
  POS_BILLING_CREATE: '/pos-billing/create',

  // ── 25. Approvals ────────────────────────────────────────────────────
  APPROVALS: '/approvals',
  APPROVAL_ACTION: (id: string | number) => `/approvals/${id}/action`,

  // ── 26. Profit & Loss ────────────────────────────────────────────────
  PROFIT_LOSS: '/profit-loss',
  PROFIT_LOSS_AUTO_CALC: '/profit-loss/auto-calculate',

  // ── 27. Subscriptions, Plans & Checkout (27-31) ──────────────────────
  SUBSCRIPTION_PLANS: '/subscriptions/plans',
  SUBSCRIPTION_UPGRADE: '/subscriptions/upgrade',
  SUBSCRIPTION_HISTORY: '/subscriptions/history',
  SUBSCRIPTION_COUPONS: '/subscriptions/coupons',
  SUBSCRIPTION_CHECKOUT: '/subscriptions/checkout',

  // ── 32. Company Calendar & 33. Document Verification ────────────────
  COMPANY_CALENDAR: '/calendar',
  EMPLOYEE_DOCUMENTS: '/employee-documents',
  EMPLOYEE_DOC_VERIFY: (id: string | number) => `/employee-documents/${id}/verify`,

  // ── 34. Translation Console & 36. Hardware & Devices ─────────────────
  TRANSLATION_KEYS: '/languages',
  HARDWARE_DEVICES: '/devices',
  DEVICE_BY_ID: (id: string | number) => `/devices/${id}`,

  // ── 37. Secure Communications & 38. Team Meetings ────────────────────
  CHAT_ROOMS: '/chat/rooms',
  CHAT_MESSAGES: (roomId: string | number) => `/chat/rooms/${roomId}/messages`,
  TEAM_MEETINGS: '/meetings',
  TEAM_MEETING_BY_ID: (id: string | number) => `/meetings/${id}`,

  // ── 39-46. Mobility Platform (39-46) ──────────────────────────────────
  MOBILITY_COCKPIT: '/mobility/cockpit',
  MOBILITY_NEARBY: '/mobility/vehicles/nearby',
  MOBILITY_FARE_ESTIMATE: '/mobility/fare-estimate',
  MOBILITY_BOOKINGS: '/mobility/bookings',
  MOBILITY_BOOKING_BY_ID: (id: string | number) => `/mobility/bookings/${id}`,
  CAR_RENTALS: '/mobility/rentals',
  PARCEL_LOGISTICS: '/mobility/parcels',
  FLEET_ASSETS: '/mobility/fleet',
  TRANSIT_ROUTES: '/mobility/transit',
  GPS_TELEMETRY: '/mobility/telemetry',
  VEHICLE_KYC: '/mobility/kyc',

  // ── 47. Profile, 48. Password & 49. Notifications ─────────────────────
  PROFILE_ALL: '/profile/all',
  PROFILE_ADD: '/profile/add',
  PROFILE_BY_ID: (id: number | string) => `/profile/${id}`,
  PASSWORD_CHANGE: '/password/change-my-password',
  PASSWORD_RESET_REQUEST: '/password/reset-request',
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_BY_ID: (id: string | number) => `/notifications/${id}`,
  NOTIFICATION_READ: (id: string | number) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',

  // ── 50-54. Workforce Management Details (50-54) ──────────────────────
  SHIFTS: '/shifts',
  BREAK_POLICIES: '/break-policies',
  BIOMETRIC_TERMINALS: '/biometrics',
  GPS_GEOFENCES: '/geofences',
  WORKFORCE_REQUESTS: '/workforce/requests',

  // ── 55. CRM Contacts & Customers ──────────────────────────────────────
  CRM_CONTACTS: '/contacts',
  CRM_CONTACT_BY_ID: (id: string | number) => `/contacts/${id}`,
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id: string | number) => `/customers/${id}`,
} as const;


/*
 * REMOVED (no backend implementation found):
 *   DASHBOARD: '/dashboard'          — no controller handles GET /dashboard
 *   ALERTS / ALERT_BY_ID             — no /alerts controller
 *   AUTH_SELECT_CONTEXT              — no /auth/select-context route
 */
