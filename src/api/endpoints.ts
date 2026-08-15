/**
 * All API endpoint paths — Exhaustively mapped and synchronized against 
 * the production backend Swagger specification:
 * https://new-e-commerce-backend-xt4w.onrender.com/pjsv/#/
 *
 * Base URL: see environment.ts
 */

export const ENDPOINTS = {
  // ── 1. Auth, Identity & OTP ──────────────────────────────────────────
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_CREATE_USER: '/auth/create-user',
  AUTH_CREATE_SUPERADMIN: '/auth/create-superadmin',
  AUTH_REGISTER: '/auth/register',
  AUTH_ME_PERMISSIONS: '/auth/me/permissions',
  AUTH_ASSIGN_ROLE: '/auth/assign-role',
  AUTH_ADMIN_SET_PASSWORD: (userId: number | string) => `/auth/admin-set-password/${userId}`,
  AUTH_USER_BY_ID: (id: number | string) => `/auth/user/${id}`,
  AUTH_USER_ACCESS: (userId: number | string) => `/auth/user-access/${userId}`,
  AUTH_REMOVE_USER_ACCESS: '/auth/removeUserAccess',
  AUTH_GET_USERS: '/auth/get-users',
  AUTH_DELETE_USER: (id: number | string) => `/auth/delete/${id}`,
  AUTH_VERIFY_EMAIL: (token: string) => `/auth/verify/${token}`,
  AUTH_SELECT_CONTEXT: '/auth/select-context',
  AUTH_SEND_OTP: '/auth/send-otp',
  AUTH_VERIFY_OTP: '/auth/verify-otp',

  // ── 2. Password Management ───────────────────────────────────────────
  PASSWORD_CHANGE_MY: '/password/change-my-password',
  PASSWORD_CHANGE: '/password/change-password',
  PASSWORD_FORGOT: '/password/forgot-password',
  PASSWORD_RESET: '/password/reset-password',

  // ── 3. Admin & Companies ─────────────────────────────────────────────
  ADMIN: '/admin',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_SYSTEM: '/admin/system',
  COMPANIES: '/companies',
  COMPANY_BY_ID: (id: string | number) => `/companies/${id}`,

  // ── 4. Branch Management ─────────────────────────────────────────────
  BRANCHES: '/branches',
  BRANCH_BY_ID: (id: string | number) => `/branches/${id}`,

  // ── 5. Employees & Verification Documents ────────────────────────────
  EMPLOYEES: '/employees',
  EMPLOYEE_BY_ID: (id: string | number) => `/employees/${id}`,
  EMPLOYEE_DOCUMENTS: '/employee-documents',
  EMPLOYEE_DOC_VERIFY: (id: string | number) => `/employee-documents/${id}/verify`,

  // ── 6. Roles & Role Access Matrix ─────────────────────────────────────
  ROLES: '/roles',
  ROLE_BY_ID: (id: string | number) => `/roles/${id}`,
  ROLE_ACCESS: '/role-access',
  ROLE_ACCESS_BATCH: '/role-access/batch',
  ROLE_ACCESS_BY_ROLE: (roleId: string | number) => `/role-access/role/${roleId}`,
  ROLE_ACCESS_SYNC: '/role-access/sync',
  ROLE_ACCESS_BY_ID: (id: string | number) => `/role-access/${id}`,
  ROLE_ACCESS_APPROVE: (id: string | number) => `/role-access/${id}/approve`,

  // ── 7. Product Attributes & Values ───────────────────────────────────
  PRODUCT_ATTRIBUTES: '/product-attributes',
  PRODUCT_ATTRIBUTE_BY_ID: (id: string | number) => `/product-attributes/${id}`,
  ATTRIBUTE_VALUES: '/attribute-values',

  // ── 8. Categories ────────────────────────────────────────────────────
  CATEGORIES: '/categories',
  CATEGORY_CREATE: '/categories/create',
  CATEGORY_BY_ID: (id: string | number) => `/categories/${id}`,
  CATEGORY_STATUS: (id: string | number) => `/categories/${id}/status`,
  CATEGORY_PARENTS: '/categories/parents/list',
  CATEGORY_CHILDREN: (parentId: string | number) => `/categories/children/${parentId}`,
  CATEGORY_TREE: '/categories/tree/list',

  // ── 9. Product Master ────────────────────────────────────────────────
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

  // ── 10. Cart & Wishlist ──────────────────────────────────────────────
  CART: '/cart',
  CART_ADD: '/cart/add',
  CART_ITEM_DELETE: (id: string | number) => `/cart/${id}`,
  WISHLIST: '/wishlist',
  WISHLIST_CHECK: (productId: string | number) => `/wishlist/check/${productId}`,
  WISHLIST_ITEM: (productId: string | number) => `/wishlist/${productId}`,

  // ── 11. Customer Delivery Addresses ──────────────────────────────────
  ADDRESSES: '/address',
  ADDRESS_BY_ID: (id: string | number) => `/address/${id}`,
  ADDRESS_SET_DEFAULT: (id: string | number) => `/address/${id}/default`,

  // ── 12. Orders & Fulfilment ──────────────────────────────────────────
  ORDERS: '/orders',
  ORDERS_CREATE: '/orders/create',
  ORDER_BY_ID: (id: string | number) => `/orders/${id}`,
  ORDER_STATUS_UPDATE: (id: string | number) => `/orders/${id}/status`,
  ORDER_VERIFY: (id: string | number) => `/orders/verify/${id}`,
  ORDER_INVOICE_PDF: (id: string | number) => `/orders/invoice-pdf/${id}`,
  ORDER_INVOICE: (id: string | number) => `/orders/invoice/${id}`,
  ORDER_SUGGESTIONS: (companyId: string | number) => `/orders/suggestions/${companyId}`,

  // ── 13. Discount & Subscription Coupons ──────────────────────────────
  COUPONS: '/coupons',
  COUPONS_CREATE: '/coupons/create',
  COUPON_BY_ID: (id: string | number) => `/coupons/${id}`,
  COUPON_CALCULATE: '/coupons/calculate',
  COUPON_VALIDATE: '/coupons/validate',
  COUPON_STATUS: (id: string | number) => `/coupons/${id}/status`,

  // ── 14. Audit & Activity Logs ────────────────────────────────────────
  AUDIT_LOGS: '/audit',
  AUDIT_LOG_BY_ID: (id: string | number) => `/audit/${id}`,

  // ── 15. System Status Master ─────────────────────────────────────────
  STATUS_MASTER: '/Status/All',
  STATUS_ALL: '/Status/All',
  STATUS_ADD: '/Status/Add',
  STATUS_UPDATE: (id: string | number) => `/Status/Update/${id}`,
  STATUS_DELETE: (id: string | number) => `/Status/${id}`,

  // ── 16. Dynamic Navigation Menu Bar ──────────────────────────────────
  MENU_ALL: '/menus',
  MENUS: '/menus',
  MENUS_BULK: '/menus/bulk',
  MENU_BY_ID: (id: string | number) => `/menus/${id}`,
  MENU_UPDATE: (id: string | number) => `/menus/update/${id}`,
  MENU_DELETE: (id: string | number) => `/menus/delete/${id}`,

  // ── 17. System Alerts & Notifications ────────────────────────────────
  ALERTS: '/alerts',
  ALERT_BY_ID: (id: string | number) => `/alerts/${id}`,
  ALERT_DISMISS: (id: string | number) => `/alerts/${id}/dismiss`,
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_BY_ID: (id: string | number) => `/notifications/${id}`,
  NOTIFICATION_READ: (id: string | number) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',

  // ── 18. Attendance & Shift Tracking ──────────────────────────────────
  ATTENDANCE: '/attendance',
  ATTENDANCE_CHECKIN: '/attendance/check-in',
  ATTENDANCE_CHECKOUT: (id: string | number) => `/attendance/check-out/${id}`,
  ATTENDANCE_CHECKOUT_ALT: (id: string | number) => `/attendance/checkout/${id}`,
  ATTENDANCE_BREAK_IN: '/attendance/break-in',
  ATTENDANCE_BREAK_OUT: (breakLogId: string | number) => `/attendance/break-out/${breakLogId}`,
  ATTENDANCE_BREAKS: (id: string | number) => `/attendance/breaks/${id}`,
  ATTENDANCE_TODAY: '/attendance/today',
  ATTENDANCE_DASHBOARD: '/attendance/dashboard',
  ATTENDANCE_BY_EMPLOYEE: (employeeId: string | number) => `/attendance/employee/${employeeId}`,
  ATTENDANCE_MANUAL: '/attendance/manual',
  ATTENDANCE_REGULARIZE: (id: string | number) => `/attendance/regularize/${id}`,
  ATTENDANCE_APPROVE: (id: string | number) => `/attendance/approve/${id}`,
  ATTENDANCE_REPORT_DAILY: '/attendance/report/daily',
  ATTENDANCE_REPORT_MONTHLY: '/attendance/report/monthly',
  ATTENDANCE_BY_ID: (id: string | number) => `/attendance/${id}`,

  // ── 19. Inventory & Stock Controls ───────────────────────────────────
  STOCK: '/stock',
  STOCK_UPDATE: '/stock/update',
  STOCK_LOGS: '/stock/logs',
  STOCK_LOG_APPROVE: (id: string | number) => `/stock/logs/${id}/approve`,
  STOCK_BY_PRODUCT: (productId: string | number) => `/stock/${productId}`,
  BRANCH_STOCK: '/branch-stock',
  BRANCH_STOCK_TRANSFER: '/branch-stock/transfer',

  // ── 20. Staff Payroll & Salary Slips ─────────────────────────────────
  PAYROLL: '/payroll',
  PAYROLL_GENERATE: '/payroll/generate',
  PAYROLL_SUMMARY: '/payroll/summary',
  PAYROLL_BY_ID: (id: string | number) => `/payroll/${id}`,
  PAYROLL_SLIP: (id: string | number) => `/payroll/slip/${id}`,
  PAYROLL_APPROVE: (id: string | number) => `/payroll/approve/${id}`,
  PAYROLL_MARK_PAID: (id: string | number) => `/payroll/mark-paid/${id}`,

  // ── 21. Staff Leave Management ───────────────────────────────────────
  LEAVE: '/leave',
  LEAVE_APPLY: '/leave/apply',
  LEAVE_REQUEST: '/leave/apply',
  LEAVE_BALANCE: '/leave/balance',
  LEAVE_HISTORY: '/leave/history',
  LEAVE_BY_ID: (id: string | number) => `/leave/${id}`,
  LEAVE_APPROVE: (id: string | number) => `/leave/approve/${id}`,
  LEAVE_REJECT: (id: string | number) => `/leave/reject/${id}`,

  // ── 22. Delivery & Logistics Tracking ────────────────────────────────
  DELIVERY_TRACKING: '/delivery-tracking',
  DELIVERY_TRACKING_START: '/delivery-tracking/start',
  DELIVERY_LOCATION: '/delivery-tracking/location',
  DELIVERY_ORDER: (orderId: string | number) => `/delivery-tracking/order/${orderId}`,
  DELIVERY_DELIVERED: (id: string | number) => `/delivery-tracking/delivered/${id}`,
  DELIVERY_DELETE: (id: string | number) => `/delivery-tracking/${id}`,

  // ── 23. Payments & Gateway Integration ───────────────────────────────
  PAYMENTS: '/payments',
  PAYMENTS_CREATE: '/payments/create',
  PAYMENT_BY_ID: (id: string | number) => `/payments/${id}`,
  PAYMENT_VERIFY: '/payments/verify',
  PAYMENT_CREATE_ORDER: '/payment/create-order',
  PAYMENT_VERIFY_PAYMENT: '/payment/verify-payment',
  RAZORPAY_CREATE_ORDER: '/payments/razorpay/create-order',
  RAZORPAY_VERIFY: '/payments/razorpay/verify',
  WEBHOOK_RAZORPAY: '/webhooks/razorpay',

  // ── 24. Executive Workforce Console ──────────────────────────────────
  WORKFORCE_LIVE: '/workforce/live',
  WORKFORCE_LIVE_DETAILS: '/workforce/live/details',
  WORKFORCE_REPORT_DAILY: '/workforce/report/daily',
  WORKFORCE_REPORT_MONTHLY: '/workforce/report/monthly',
  WORKFORCE_REPORT_EMPLOYEE: (empId: string | number) => `/workforce/report/employee/${empId}`,
  WORKFORCE_NOTIFICATIONS: '/workforce/notifications',
  WORKFORCE_NOTIF_READ: (id: string | number) => `/workforce/notifications/${id}/read`,

  // ── 25. Invoice Generator & POS Billing Machine ──────────────────────
  INVOICES: '/invoices',
  INVOICE_CREATE: '/invoices/create',
  INVOICE_BY_ID: (id: string | number) => `/invoices/${id}`,
  INVOICES_DOWNLOAD: '/invoices/download',
  INVOICES_PRINT: '/invoices/print',
  INVOICES_SUGGESTIONS: '/invoices/suggestions',
  POS_BILLING: '/pos-billing',
  POS_BILLING_CREATE: '/pos-billing/create',
  POS_ANALYTICS: '/pos/analytics',
  POS_PRODUCTS: '/pos/products',
  POS_ORDERS: '/pos/orders',
  POS_CHECKOUT: '/pos/checkout',

  // ── 26. Workflow Approvals ───────────────────────────────────────────
  APPROVALS: '/approvals',
  APPROVALS_BULK_ACTION: '/approvals/bulk-action',
  APPROVAL_BY_ID: (id: string | number) => `/approvals/${id}`,
  APPROVAL_ACTION: (id: string | number) => `/approvals/${id}/action`,

  // ── 27. Profit & Loss Statement ──────────────────────────────────────
  PROFIT_LOSS: '/profit-loss',
  PROFIT_LOSS_AUTO_CALC: '/profit-loss/auto-calculate',
  PROFIT_LOSS_BY_ID: (id: string | number) => `/profit-loss/${id}`,

  // ── 28. Subscriptions, Plans, Checkout & Billing ─────────────────────
  SUBSCRIPTIONS_CURRENT: '/subscriptions/current',
  SUBSCRIPTION_PLANS: '/subscriptions/plans',
  SUBSCRIPTION_PLAN_BY_ID: (id: string | number) => `/subscriptions/plans/${id}`,
  SUBSCRIPTION_START_TRIAL: '/subscriptions/start-trial',
  SUBSCRIPTION_SUBSCRIBE: '/subscriptions/subscribe',
  SUBSCRIPTION_VERIFY: '/subscriptions/verify',
  SUBSCRIPTION_WEBHOOK: '/subscriptions/webhook',
  SUBSCRIPTION_UPGRADE: '/subscriptions/upgrade',
  SUBSCRIPTION_HISTORY: '/subscriptions/history',
  SUBSCRIPTION_CHECKOUT: '/subscriptions/checkout',
  SUBSCRIPTION_COUPONS: '/subscription-coupons',
  SUBSCRIPTION_COUPONS_VALIDATE: '/subscription-coupons/validate',
  SUBSCRIPTION_INVOICES: '/subscription-invoices',
  SUBSCRIPTION_INVOICE_BY_ID: (id: string | number) => `/subscription-invoices/${id}`,
  BILLING_HISTORY: '/billing/history',
  BILLING_REFUND: '/billing/refund',

  // ── 29. Company Calendar & Holidays ──────────────────────────────────
  COMPANY_CALENDAR: '/calendar/holidays',
  CALENDAR_HOLIDAYS: '/calendar/holidays',
  CALENDAR_HOLIDAY_BY_ID: (id: string | number) => `/calendar/holidays/${id}`,

  // ── 30. Multilingual Translation Console ──────────────────────────────
  TRANSLATION_KEYS: '/languages',
  TRANSLATIONS_MATRIX: '/translations/matrix',
  TRANSLATIONS_BY_LANG: (langCode: string) => `/translations/${langCode}`,
  TRANSLATIONS_VALUES: '/translations/values',
  TRANSLATIONS_IMPORT: '/translations/import',
  TRANSLATIONS_PUBLISH: '/translations/publish',
  LANGUAGES: '/languages',
  LANGUAGE_BY_ID: (id: string | number) => `/languages/${id}`,

  // ── 31. Hardware Devices & Biometric Terminals ───────────────────────
  HARDWARE_DEVICES: '/devices',
  DEVICES: '/devices',
  DEVICES_SCAN_SYNC: '/devices/scan-sync',
  DEVICE_BY_ID: (id: string | number) => `/devices/${id}`,
  DEVICE_TELEMETRY: (id: string | number) => `/devices/${id}/telemetry`,
  BIOMETRIC_TERMINALS: '/biometric/device',
  BIOMETRIC_CHECKIN: '/biometric/checkin',
  BIOMETRIC_CHECKOUT: (attendanceId: string | number) => `/biometric/checkout/${attendanceId}`,
  BIOMETRIC_BREAK_IN: '/biometric/break-in',
  BIOMETRIC_BREAK_OUT: (breakLogId: string | number) => `/biometric/break-out/${breakLogId}`,
  BIOMETRIC_DEVICE_REGISTER: '/biometric/device/register',
  BIOMETRIC_DEVICE_PING: '/biometric/device/ping',
  BIOMETRIC_DEVICE_BY_ID: (id: string | number) => `/biometric/device/${id}`,
  BIOMETRIC_LOGS: '/biometric/logs',

  // ── 32. Shifts & Break Policies ──────────────────────────────────────
  SHIFTS: '/shifts',
  SHIFTS_ASSIGN: '/shifts/assign',
  SHIFTS_ASSIGNMENTS_ALL: '/shifts/assignments/all',
  SHIFTS_BY_EMPLOYEE: (employeeId: string | number) => `/shifts/employee/${employeeId}`,
  SHIFT_BY_ID: (id: string | number) => `/shifts/${id}`,
  BREAK_POLICIES: '/break-policies',
  BREAK_POLICIES_ACTIVE: '/break-policies/active',
  BREAK_POLICY_BY_ID: (id: string | number) => `/break-policies/${id}`,

  // ── 33. Secure Communications & Chat Rooms ────────────────────────────
  CHAT_ROOMS: '/chat/conversations',
  CHAT_CONVERSATIONS: '/chat/conversations',
  CHAT_MESSAGES: (conversationId: string | number) => `/chat/messages/${conversationId}`,
  CHAT_UPLOAD: '/chat/upload',
  CHAT_REACTIONS: '/chat/reactions',
  CHAT_DIRECTORY: '/chat/directory',
  CHAT_CALLS_HISTORY: '/chat/calls/history',
  CHAT_STATUSES: '/chat/statuses',
  CHAT_CLEAR: '/chat/clear',
  CHAT_DELETE_CONVERSATION: '/chat/delete-conversation',
  CHAT_KEYS: '/chat/keys',
  TEAM_MEETINGS: '/meetings',
  TEAM_MEETING_BY_ID: (id: string | number) => `/meetings/${id}`,

  // ── 34. Mobility & Logistics Platform ─────────────────────────────────
  MOBILITY_COCKPIT: '/mobility/fleet/metrics',
  MOBILITY_NEARBY: '/mobility/vehicles/nearby',
  MOBILITY_FARE_ESTIMATE: '/mobility/fare-estimate',
  MOBILITY_BOOKINGS: '/mobility/bookings',
  MOBILITY_BOOKINGS_STATUS: '/mobility/bookings/status',
  MOBILITY_BOOKINGS_ASSIGN_DRIVER: '/mobility/bookings/assign-driver',
  MOBILITY_BOOKING_STATUS_BY_ID: (id: string | number) => `/mobility/bookings/${id}/status`,
  MOBILITY_BOOKING_BY_ID: (id: string | number) => `/mobility/bookings/${id}`,
  MOBILITY_CATEGORIES: '/mobility/categories',
  MOBILITY_CORPORATE_ROSTERS: '/mobility/corporate/rosters',
  MOBILITY_DRIVER_LOCATION: (driverId: string | number) => `/mobility/driver/${driverId}/location`,
  MOBILITY_DRIVERS_LOCATION: '/mobility/drivers/location',
  MOBILITY_FLEET_METRICS: '/mobility/fleet/metrics',
  MOBILITY_KYC_VERIFY: '/mobility/kyc/verify',
  MOBILITY_RENTALS_CATALOG: '/mobility/rentals/catalog',
  MOBILITY_TRIPS_REPLAY: (tripId: string | number) => `/mobility/trips/${tripId}/replay`,
  MOBILITY_TRIPS_TRACK: (tripId: string | number) => `/mobility/trips/${tripId}/track`,
  MOBILITY_VERIFICATION_DRIVERS: '/mobility/verification/drivers',
  MOBILITY_VERIFICATION_VEHICLES: '/mobility/verification/vehicles',
  CAR_RENTALS: '/mobility/rentals',
  PARCEL_LOGISTICS: '/mobility/parcels',
  FLEET_ASSETS: '/mobility/fleet',
  TRANSIT_ROUTES: '/mobility/transit',
  GPS_TELEMETRY: '/mobility/telemetry',
  VEHICLE_KYC: '/mobility/kyc',

  // ── 35. Profile & Notifications ──────────────────────────────────────
  PROFILE_ALL: '/profile/all',
  PROFILE_ADD: '/profile/add',
  PROFILE_BY_ID: (id: number | string) => `/profile/${id}`,

  // ── 36. AI Services & CRM Contacts ───────────────────────────────────
  AI_GENERATE_DESCRIPTION: '/ai/generate-description',
  AI_AUDIT_PRODUCT: '/ai/audit-product',
  CONTACT: '/contact',
  CONTACT_CHECK_DUPLICATE: '/contact/check-duplicate',
  CONTACT_SETUP_PASSWORD: '/contact/setup-password',
  CONTACT_VERIFY_EMAIL: '/contact/verify-email',
  CRM_CONTACTS: '/contacts',
  CONTACTS_EXPORT: '/contacts/export',
  CONTACT_BY_ID: (id: string | number) => `/contacts/${id}`,
  CRM_CONTACT_BY_ID: (id: string | number) => `/contacts/${id}`,
  CONTACT_APPROVE: (id: string | number) => `/contacts/${id}/approve`,
  CONTACT_REJECT: (id: string | number) => `/contacts/${id}/reject`,
  CONTACT_RESTORE: (id: string | number) => `/contacts/${id}/restore`,
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id: string | number) => `/customers/${id}`,

  // ── 37. Additional Alias Maps & Legacy V1 Routes ───────────────────────
  GPS_GEOFENCES: '/geofences',
  WORKFORCE_REQUESTS: '/workforce/requests',
  V1_VERIFICATION_DRIVERS: '/v1/verification/drivers',
  V1_VERIFICATION_VEHICLES: '/v1/verification/vehicles',
} as const;
