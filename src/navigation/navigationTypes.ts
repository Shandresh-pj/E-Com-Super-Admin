import { UserRole } from '../security/roleResolver';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  App: undefined;
  UnsupportedRole: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
};

export type MainTabParamList = {
  // ── Dashboards ────────────────────────────────
  Dashboard: undefined;

  // ── Commerce & Products ───────────────────────
  Products: undefined;
  Categories: undefined;
  Coupons: undefined;

  // ── Orders & Fulfilment ───────────────────────
  Orders: undefined;
  DeliveryTracking: undefined;
  Invoices: undefined;
  POSBilling: undefined;

  // ── Branches & Customers ─────────────────────
  Branches: undefined;
  Customers: undefined;

  // ── Inventory & Stock ─────────────────────────
  Stocks: undefined;

  // ── Workforce & HR ───────────────────────────
  Employees: undefined;
  Attendance: undefined;
  Payroll: undefined;
  Leave: undefined;
  Shifts: undefined;
  WorkforceConsole: undefined;
  BreakPolicies: undefined;
  Geofencing: undefined;
  WorkforceRequests: undefined;

  // ── Finance ───────────────────────────────────────
  Payments: undefined;
  ProfitLoss: undefined;

  // ── Admin & System ────────────────────────────────────
  RoleAccess: undefined;
  AuditLogs: undefined;
  Approvals: undefined;

  // ── Subscriptions ─────────────────────────────────────
  Subscription: undefined;

  // ── Communication ─────────────────────────────────────
  Notifications: undefined;
  SecureChat: undefined;
  TeamMeetings: undefined;

  // ── Mobility Platform ─────────────────────────────────
  MobilityCockpit: undefined;

  // ── Profile ───────────────────────────────────────────
  Profile: undefined;

  // ── CRM ───────────────────────────────────────────────
  CRMContacts: undefined;

  // ── Commerce & Products Extended ─────────────
  ProductAttributes: undefined;
  AttributeValues: undefined;

  // ── Admin & System Masters ────────────────────
  StatusMaster: undefined;
  MenuBar: undefined;
  HardwareDevices: undefined;
  TranslationKeys: undefined;
  CompanyCalendar: undefined;

  // ── Workforce Extended ────────────────────────
  Biometrics: undefined;
  EmployeeDocuments: undefined;

  // ── Mobility Platform Extended ────────────────
  VehicleNearby: undefined;
  MobilityBookings: undefined;
  CarRentals: undefined;
  ParcelLogistics: undefined;
  FleetAssets: undefined;
  TransitRoutes: undefined;
  GPSTelemetry: undefined;
  VehicleKYC: undefined;

  // ── Dynamic fallback for all 55 modules ───────
  DynamicModule: { title: string; path: string; category?: string };
};
