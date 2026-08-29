export type FeatureId =
  | 'emi_calculator'
  | 'company_search'
  | 'part_payment'
  | 'bank_policy'
  | 'saved_calculations'
  | 'team_access'
  | 'priority_tools';

export interface Entitlements {
  emi_calculator: boolean;
  company_search: boolean;
  part_payment: boolean;
  bank_policy: boolean;
  saved_calculations: boolean;
  team_access: boolean;
  priority_tools: boolean;
}

export type PlanSlug = 'free' | 'basic_monthly' | 'basic_yearly' | 'pro_monthly' | 'pro_yearly';

export function getEntitlementsForPlan(planSlug: string | null): Entitlements {
  const base: Entitlements = {
    emi_calculator: true, // Free for all
    company_search: false,
    part_payment: false,
    bank_policy: false,
    saved_calculations: false,
    team_access: false,
    priority_tools: false,
  };

  if (!planSlug || planSlug === 'free') {
    return base;
  }

  const isBasic = planSlug.includes('basic');
  const isPro = planSlug.includes('pro');

  if (isBasic || isPro) {
    base.company_search = true;
    base.part_payment = true;
    base.bank_policy = true;
    base.saved_calculations = true;
  }

  if (isPro) {
    base.team_access = true;
    base.priority_tools = true;
  }

  return base;
}

export function canUseFeature(planSlug: string | null, feature: FeatureId): boolean {
  const entitlements = getEntitlementsForPlan(planSlug);
  return entitlements[feature] === true;
}

export function hasFeature(planSlug: string | null, feature: FeatureId): boolean {
  return canUseFeature(planSlug, feature);
}

export function getUserMaxTeamMembers(planSlug: string | null): number {
  if (!planSlug || planSlug === 'free') return 1;
  if (planSlug.includes('basic')) return 1;
  if (planSlug.includes('pro')) return 10;
  return 1;
}

export function isSubscriptionActive(status: string | null, currentPeriodEnd: string | null): boolean {
  if (!status || status !== 'active') return false;
  if (!currentPeriodEnd) return false;
  const endDate = new Date(currentPeriodEnd);
  return endDate.getTime() > Date.now();
}
