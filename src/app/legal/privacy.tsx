import { ShieldCheck, Mail } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';

export function PrivacyPolicy() {
  return (
    <div className="py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600">Last Updated: August 28, 2026 | Policy Version: 1.2.0</p>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Information We Collect</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              We collect information you provide directly to us when registering for an account, subscribing to our premium plans, or using our calculators and tools. This may include your name, email address, role, and transaction details. We do not store sensitive payment information directly; all financial transactions are processed securely via our trusted payment provider, Razorpay.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Use of Information</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              The information we collect is used to provide, maintain, and improve our services, to process transactions, to send administrative communications, and to personalize your experience. We do not sell your personal data to third parties.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Data Security</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              We implement appropriate technical and organizational measures designed to protect your personal information from accidental loss, unauthorized access, or disclosure. Our platform utilizes industry-standard 256-bit encryption for data in transit and at rest.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Cookies and Tracking</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              We use cookies to securely manage your authentication sessions and preferences. You can instruct your browser to refuse all cookies, but this may result in certain features of the platform being unavailable (such as accessing secure dashboards).
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Contact Us</h2>
            <p className="text-slate-600 mb-6 leading-relaxed flex items-center gap-2">
              If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:privacy@loanportal.com" className="flex items-center gap-1 text-primary hover:underline"><Mail className="w-4 h-4" /> privacy@loanportal.com</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
