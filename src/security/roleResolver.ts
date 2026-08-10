export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  BRANCH = 'BRANCH',
  EMPLOYEE = 'EMPLOYEE',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  SHOPKEEPER = 'SHOPKEEPER',
  DELIVERY_BOY = 'DELIVERY_BOY',
  UNSUPPORTED = 'UNSUPPORTED',
}

export function resolveRole(userType: string | undefined | null): UserRole {
  if (!userType || typeof userType !== 'string') {
    return UserRole.UNSUPPORTED;
  }

  const normalized = userType.trim();

  switch (normalized) {
    case 'Super_Admin':
    case 'SUPER_ADMIN':
    case 'super_admin':
      return UserRole.SUPER_ADMIN;

    case 'Admin':
    case 'ADMIN':
    case 'admin':
      return UserRole.ADMIN;

    case 'Branch':
    case 'BRANCH':
    case 'branch':
      return UserRole.BRANCH;

    case 'Employee':
    case 'EMPLOYEE':
    case 'employee':
      return UserRole.EMPLOYEE;

    case 'Branch_Manager':
    case 'BRANCH_MANAGER':
    case 'branch_manager':
      return UserRole.BRANCH_MANAGER;

    case 'Shopkeeper':
    case 'SHOPKEEPER':
    case 'shopkeeper':
      return UserRole.SHOPKEEPER;

    case 'Delivery_Boy':
    case 'DELIVERY_BOY':
    case 'delivery_boy':
      return UserRole.DELIVERY_BOY;

    default:
      return UserRole.UNSUPPORTED;
  }
}
