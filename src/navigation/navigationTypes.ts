import { UserRole } from '../security/roleResolver';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  App: undefined;
  UnsupportedRole: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Branches: undefined;
  Employees: undefined;
  Customers: undefined;
  Attendance: undefined;
  RoleAccess: undefined;
  Notifications: undefined;
  Profile: undefined;
  DynamicModule: { title: string; path: string; category?: string };
};

