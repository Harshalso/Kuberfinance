import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBankPolicy, BankPolicy } from '@/src/lib/supabase/policies';
import { Loader2, Printer, ChevronLeft, Calendar, FileText, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';

export function PolicyDetail() {
  const { bankId } = useParams();
  const [policy, setPolicy] = useState<BankPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPolicy() {
      if (!bankId) return;
      try {
        setLoading(true);
        const data = await getBankPolicy(bankId);
        if (!data) {
          setError('Policy not found or is currently inactive.');
        } else {
          setPolicy(data);
        }
      } catch (err: any) {
        console.error("Failed to load policy:", err);
        setError('An error occurred while loading the policy.');
      } finally {
        setLoading(false);
      }
    }
    loadPolicy();
  }, [bankId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg mb-6 flex flex-col items-center">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Policy Unavailable</h2>
          <p>{error}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/bank-policies">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Bank Policies
          </Link>
        </Button>
      </div>
    );
  }

  // Helper to render JSONB lists/objects gracefully
  const renderList = (data: any, title: string, icon?: React.ReactNode) => {
    if (!data) return null;
    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (typeof data === 'object') {
      items = Object.entries(data).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
    } else {
      items = [String(data)];
    }

    if (items.length === 0) return null;

    return (
      <Card className="shadow-sm border-slate-200 break-inside-avoid print:shadow-none print:border-slate-300">
        <CardHeader className="bg-slate-50 border-b py-3 print:bg-transparent">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-700 capitalize">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 print:bg-white print:py-0">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header Actions - hidden on print */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/bank-policies">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <Button onClick={() => window.print()} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print / Save PDF
          </Button>
        </div>

        {/* Main Document Body */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden print:shadow-none print:rounded-none border border-slate-200">
          
          {/* Policy Header */}
          <div className="bg-slate-900 text-white p-8 print:bg-slate-100 print:text-black print:border-b-2 print:border-black">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{policy.bank?.name}</h1>
                <h2 className="text-xl text-slate-300 font-medium print:text-slate-700">{policy.policy_title}</h2>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-primary/20 text-primary-foreground print:border print:border-black print:bg-transparent print:text-black">
                  Version: {policy.version || '1.0'}
                </span>
                <div className="text-sm text-slate-400 print:text-slate-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Effective: {policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-xs text-slate-500 print:text-slate-600 font-mono mt-1">
                  Last Updated: {new Date(policy.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            
            {/* Overview Section */}
            {policy.policy_content && (
              <section>
                <h3 className="text-lg font-bold border-b pb-2 mb-4 text-slate-900 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-primary" /> Bank Overview
                </h3>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {policy.policy_content}
                </div>
              </section>
            )}

            {/* Grid Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Eligibility & Income */}
              {renderList(policy.eligibility, "Eligibility & Income Criteria")}
              
              {/* Loan Parameters */}
              {renderList(policy.loan_parameters, "Loan Amount & Tenure")}
              
              {/* Part Payment */}
              {renderList(policy.part_payment_rules, "Part Payment Rules")}
              
              {/* Foreclosure */}
              {renderList(policy.foreclosure_rules, "Foreclosure Rules")}
              
              {/* Documentation */}
              {renderList(policy.documentation_requirements, "Documentation Requirements")}

            </div>

            {/* Disclaimer */}
            <div className="mt-12 pt-6 border-t border-slate-200">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 print:border-slate-300 print:bg-transparent">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="text-sm text-amber-900 print:text-slate-700">
                  <strong>Important Disclaimer:</strong> Bank policies may change without prior notice. 
                  Always verify the latest applicable policy directly with the lender before making a financial decision. 
                  This document is for general reference purposes only.
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
