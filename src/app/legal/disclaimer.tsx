import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';

export function Disclaimer() {
  return (
    <div className="py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Financial Disclaimer</h1>
          <p className="text-slate-600">Last Updated: August 28, 2026</p>
        </div>

        <Card className="shadow-sm border-amber-200 bg-white">
          <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">Important Notice Regarding Financial Tools</h2>
            
            <div className="bg-amber-50 p-6 rounded-lg border border-amber-100 mb-8 text-amber-900 leading-relaxed font-medium">
              The calculators, policy documents, company categorizations, and tools provided on Loan Finance Portal are strictly for illustrative, informational, and professional scenario-generation purposes only.
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-3">Not Financial Advice</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              The content and tools on this platform do not constitute professional financial advice, a formal loan offer, or a guarantee of credit approval. Do not make any binding financial decisions or execute loan agreements based solely on the outputs of our calculators.
            </p>

            <h3 className="text-xl font-bold text-slate-800 mb-3">Accuracy of Calculations</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              While we utilize standard mathematical formulas for Amortization (EMI) and Part-Payment reductions, individual lending institutions may use varying compounding frequencies, rounding rules, tax structures, and hidden processing fees that can alter the final figures. 
            </p>

            <h3 className="text-xl font-bold text-slate-800 mb-3">Bank Policies & Categorizations</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Company categories (e.g., CAT A, Super A, CAT B) and bank internal policies are subject to unannounced changes by the respective financial institutions. We cannot guarantee that a company's listing on this portal reflects its current real-time eligibility with a specific bank. Always verify the latest policy revisions directly with your banking relationship manager or underwriter before submitting a loan application.
            </p>

            <h3 className="text-xl font-bold text-slate-800 mb-3">Limitation of Liability</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              By using these tools, you acknowledge that Loan Finance Portal, its developers, and its operators accept no liability for any direct, indirect, incidental, or consequential losses resulting from reliance on the information or calculations provided herein.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
