import React from 'react';
import { useAuth } from '../auth/auth-provider';
import { canUseFeature, FeatureId, isSubscriptionActive } from '../../lib/subscriptions/entitlements';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

interface FeatureGateProps {
  feature: FeatureId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FEATURE_MESSAGES: Record<FeatureId, { title: string; required: string }> = {
  emi_calculator: { title: 'EMI Calculator', required: 'Free' },
  company_search: { title: 'Company Category Search', required: 'Basic or Pro' },
  part_payment: { title: 'Part Payment Calculator', required: 'Basic or Pro' },
  bank_policy: { title: 'Bank Policies', required: 'Basic or Pro' },
  saved_calculations: { title: 'Saved Calculations', required: 'Basic or Pro' },
  team_access: { title: 'Team Management', required: 'Pro' },
  priority_tools: { title: 'Priority Tools', required: 'Pro' }
};

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { subscription } = useAuth();
  
  let hasAccess = false;
  if (feature === 'emi_calculator') {
    hasAccess = true;
  } else if (subscription && isSubscriptionActive(subscription.status, subscription.current_period_end)) {
    hasAccess = canUseFeature(subscription.plan_id, feature);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const message = FEATURE_MESSAGES[feature];

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 border-dashed">
      <CardHeader>
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-slate-500" />
        </div>
        <CardTitle>{message.title}</CardTitle>
        <CardDescription>Available with the {message.required} plan.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/pricing">Upgrade Now</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
