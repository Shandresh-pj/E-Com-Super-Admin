import { UserProfile } from '../../../store/authStore';

export interface CompletionStep {
  key: string;
  label: string;
  category: 'identity' | 'contact' | 'enterprise' | 'location';
  weight: number; // Percentage contribution (total = 100)
  isCompleted: boolean;
  actionHint: string;
  iconName: string;
}

export interface ProfileCompletionResult {
  score: number; // 0 to 100
  level: {
    tier: number;
    title: string;
    badge: string;
    color: string;
    description: string;
  };
  steps: CompletionStep[];
  completedCount: number;
  totalCount: number;
  nextStep: CompletionStep | null;
}

/**
 * Calculates real-time weighted profile completion score and actionable roadmap.
 */
export const calculateProfileCompletion = (user: Partial<UserProfile> | null | undefined): ProfileCompletionResult => {
  const steps: CompletionStep[] = [
    {
      key: 'name',
      label: 'Full Legal Name',
      category: 'identity',
      weight: 15,
      isCompleted: Boolean(user?.name && user.name.trim().length >= 2),
      actionHint: 'Add your display name',
      iconName: 'User',
    },
    {
      key: 'avatar',
      label: 'Profile Photo / 3D Avatar',
      category: 'identity',
      weight: 15,
      isCompleted: Boolean(user?.avatar && user.avatar.trim().length > 0),
      actionHint: 'Choose an avatar or take photo',
      iconName: 'Camera',
    },
    {
      key: 'email',
      label: 'Official Email Address',
      category: 'contact',
      weight: 10,
      isCompleted: Boolean(user?.email && user.email.includes('@')),
      actionHint: 'Verify your business email',
      iconName: 'Mail',
    },
    {
      key: 'phone',
      label: 'Direct Contact Mobile Number',
      category: 'contact',
      weight: 15,
      isCompleted: Boolean((user?.phone || user?.mobilenumber) && String(user?.phone || user?.mobilenumber).trim().length >= 7),
      actionHint: 'Add your mobile number for SMS alerts',
      iconName: 'Phone',
    },
    {
      key: 'bio',
      label: 'Professional Bio / Summary',
      category: 'identity',
      weight: 10,
      isCompleted: Boolean(user?.bio && user.bio.trim().length >= 5),
      actionHint: 'Write a brief executive summary',
      iconName: 'FileText',
    },
    {
      key: 'department',
      label: 'Department & Functional Role',
      category: 'enterprise',
      weight: 10,
      isCompleted: Boolean(user?.department && user.department.trim().length > 0),
      actionHint: 'Specify your operational department',
      iconName: 'Briefcase',
    },
    {
      key: 'staffId',
      label: 'Staff ID / Employee Code',
      category: 'enterprise',
      weight: 10,
      isCompleted: Boolean(user?.staffId && user.staffId.trim().length > 0),
      actionHint: 'Assign your official employee code',
      iconName: 'BadgeCheck',
    },
    {
      key: 'emergencyContact',
      label: 'Emergency Contact Phone',
      category: 'contact',
      weight: 5,
      isCompleted: Boolean(user?.emergencyContact && user.emergencyContact.trim().length >= 7),
      actionHint: 'Add an emergency contact line',
      iconName: 'ShieldAlert',
    },
    {
      key: 'officeBranch',
      label: 'Primary Office / Branch Assignment',
      category: 'enterprise',
      weight: 5,
      isCompleted: Boolean((user?.officeBranch || user?.branch?.name) && String(user?.officeBranch || user?.branch?.name).trim().length > 0),
      actionHint: 'Select your operational branch',
      iconName: 'Building2',
    },
    {
      key: 'address',
      label: 'Registered Street Address & Location',
      category: 'location',
      weight: 5,
      isCompleted: Boolean((user?.address || user?.cityStatePincode) && String(user?.address || user?.cityStatePincode).trim().length >= 3),
      actionHint: 'Add your workplace address and city',
      iconName: 'MapPin',
    },
  ];

  // Calculate weighted total score
  const score = steps.reduce((sum, step) => (step.isCompleted ? sum + step.weight : sum), 0);
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const nextStep = steps.find((s) => !s.isCompleted) || null;

  // Determine Level / Tier based on score
  let level = {
    tier: 1,
    title: 'Seed Member',
    badge: '🌱 Starter',
    color: '#F59E0B',
    description: 'Complete basic identity and contact details to unlock higher security clearance.',
  };

  if (score === 100) {
    level = {
      tier: 4,
      title: 'Master Executive',
      badge: '👑 Master Executive',
      color: '#10B981',
      description: 'Profile 100% complete with full enterprise verification and clearance.',
    };
  } else if (score >= 75) {
    level = {
      tier: 3,
      title: 'Advanced Specialist',
      badge: '💎 Advanced Pro',
      color: '#6366F1',
      description: 'Great progress! Almost completely verified across all operational metrics.',
    };
  } else if (score >= 40) {
    level = {
      tier: 2,
      title: 'Verified Member',
      badge: '⚡ Verified',
      color: '#3B82F6',
      description: 'Core details active. Add emergency contact, bio, and branch to reach Pro tier.',
    };
  }

  return {
    score,
    level,
    steps,
    completedCount,
    totalCount: steps.length,
    nextStep,
  };
};
