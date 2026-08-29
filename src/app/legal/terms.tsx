import { Scale } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';

export function TermsOfService() {
  return (
    <div className="py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Scale className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-600">Last Updated: August 28, 2026 | Policy Version: 1.1.0</p>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              By accessing and using Loan Finance Portal ("Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Professional Use Only</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              This Platform is intended primarily for finance professionals, agents, and institutions. The tools provided (EMI Calculators, Part Payment projections, Company Category databases, and Bank Policies) are strictly for illustrative scenario generation and should not be presented to end-consumers as guaranteed offers.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Accuracy of Information</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              While we strive to keep internal bank policies and company categorizations up-to-date, lending institutions modify their criteria frequently. We do not warrant or guarantee the absolute accuracy, completeness, or timeliness of the information. Users must cross-verify critical information directly with the respective financial institutions.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. User Accounts and Security</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Subscription & Billing</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Premium features require an active subscription. Payments are processed securely via Razorpay. Subscriptions are billed in advance on a billing cycle basis and are non-refundable unless required by applicable consumer law.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Limitation of Liability</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              In no event shall Loan Finance Portal, nor its directors, employees, partners, or agents, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Platform.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
