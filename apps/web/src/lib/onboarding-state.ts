import { UserProfile, ProfileData } from "@/types";

export interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  isComplete: boolean;
}

export function getOnboardingState(
  user: UserProfile | null,
  profile: ProfileData | null
): OnboardingState {
  if (!user) {
    return { currentStep: 1, completedSteps: [], isComplete: false };
  }

  // Step 1 (Account Verified) is automatically completed upon registration/login
  const completedSteps: number[] = [1];

  const hasName = Boolean(profile?.full_name && profile.full_name.trim().length > 0);
  const hasDepartment = Boolean(profile?.department && profile.department.trim().length > 0);

  if (hasName && hasDepartment) {
    completedSteps.push(2);
  }

  const isComplete = Boolean(user.profile_completed);

  let currentStep = 2;
  if (!completedSteps.includes(2)) {
    currentStep = 2;
  } else {
    currentStep = 3;
  }

  return {
    currentStep,
    completedSteps,
    isComplete,
  };
}
