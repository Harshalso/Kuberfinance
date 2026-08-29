import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, CartesianGrid } from 'recharts';
import { Save, RotateCcw, Info, CheckCircle2, TrendingDown, Clock, Calculator } from 'lucide-react';
import { useAuth } from '@/src/components/auth/auth-provider';
import { saveCalculation } from '@/src/lib/supabase/calculations';
import { calculatePartPayment } from '@/src/lib/calculators/partPayment';
import { formatINR } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/card';

const partPaymentSchema = z.object({
  originalLoanAmount: z.coerce.number().min(1000, "Minimum amount is ₹1,000").optional(),
  outstandingPrincipal: z.coerce.number().min(1000, "Minimum amount is ₹1,000"),
  interestRate: z.coerce.number().min(0.0000000001, "Minimum rate must be > 0%").max(100, "Maximum rate is 100%"),
  remainingTenure: z.coerce.number().min(1, "Minimum tenure is 1").max(360, "Maximum tenure is 360"),
  partPayment: z.coerce.number().min(0, "Cannot be negative"),
  currentEmi: z.coerce.number().min(0, "Cannot be negative").optional(),
});

type PartPaymentFormValues = z.infer<typeof partPaymentSchema>;

const DEFAULT_VALUES: PartPaymentFormValues = {
  originalLoanAmount: 5000000,
  outstandingPrincipal: 4500000,
  interestRate: 8.5,
  remainingTenure: 180,
  partPayment: 500000,
  currentEmi: 44261,
};

export function PartPaymentCalculator() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [results, setResults] = useState<ReturnType<typeof calculatePartPayment> | null>(null);

  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm<PartPaymentFormValues>({
    // @ts-expect-error - Zod coerce causes type mismatch with hook-form input types
    resolver: zodResolver(partPaymentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    // Initial calculation
    try {
      setResults(calculatePartPayment(DEFAULT_VALUES));
    } catch (e) {
      setResults(null);
    }
  }, []);

  const onCalculate = (data: PartPaymentFormValues) => {
    if (data.partPayment <= data.outstandingPrincipal) {
      try {
        setResults(calculatePartPayment(data));
      } catch (e) {
        setResults(null);
      }
    } else {
      setResults(null);
    }
  };

  const handleSave = async () => {
    const currentValues = getValues();
    const parsed = partPaymentSchema.safeParse(currentValues);
    if (!user || !results || !parsed.success) return;
    
    try {
      setSaving(true);
      await saveCalculation(user.id, 'Part Payment', parsed.data, results);
      setSaveMessage("Calculation saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to save.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const chartData = results ? [
    {
      name: 'Original',
      'Remaining Interest': results.original.remainingInterest,
    },
    {
      name: 'Reduce Tenure',
      'Remaining Interest': results.reduceTenure.remainingInterest,
    },
    {
      name: 'Reduce EMI',
      'Remaining Interest': results.reduceEmi.remainingInterest,
    }
  ] : [];

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Part Payment Calculator</h1>
          <p className="text-slate-600">Analyze the long-term impact of pre-payments. Compare keeping your EMI the same to reduce tenure, versus reducing your EMI to free up cash flow.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Loan Details</CardTitle>
                <CardDescription>Enter your existing loan information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit(onCalculate as any)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="outstandingPrincipal">Outstanding Principal (₹)</Label>
                    <Input 
                      id="outstandingPrincipal" 
                      type="number"
                      {...register('outstandingPrincipal')}
                    />
                    {errors.outstandingPrincipal && <p className="text-xs text-destructive">{errors.outstandingPrincipal.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Input 
                      id="interestRate" 
                      type="number"
                      step="any"
                      {...register('interestRate')}
                    />
                    {errors.interestRate && <p className="text-xs text-destructive">{errors.interestRate.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="remainingTenure">Remaining (Months)</Label>
                      <Input 
                        id="remainingTenure" 
                        type="number"
                        {...register('remainingTenure')}
                      />
                      {errors.remainingTenure && <p className="text-xs text-destructive">{errors.remainingTenure.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentEmi">Current EMI (Optional)</Label>
                      <Input 
                        id="currentEmi" 
                        type="number"
                        {...register('currentEmi')}
                      />
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <Label htmlFor="partPayment" className="text-primary font-bold">Part Payment Amount (₹)</Label>
                      <Input 
                        id="partPayment" 
                        type="number"
                        className="border-primary ring-primary"
                        {...register('partPayment')}
                      />
                      {errors.partPayment && <p className="text-xs text-destructive">{errors.partPayment.message}</p>}
                      {/* Note: Validation for partPayment > principal is handled inside onCalculate, but ideally through Zod superRefine. We'll handle it gracefully by just hiding results. */}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-6 border-t mt-6">
                    <Button type="submit" className="w-full font-bold">
                      <Calculator className="w-4 h-4 mr-2" /> Calculate Analysis
                    </Button>

                    <Button type="button" variant="outline" onClick={() => { reset(DEFAULT_VALUES); onCalculate(DEFAULT_VALUES); }} className="w-full">
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                    
                    {user && (
                      <Button type="button" variant="secondary" onClick={handleSave} disabled={!results || saving} className="w-full">
                        {saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save to Dashboard</>}
                      </Button>
                    )}
                    {saveMessage && (
                      <div className="text-sm font-medium flex items-center justify-center text-primary mt-1">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> {saveMessage}
                      </div>
                    )}
                    {!user && (
                      <p className="text-xs text-slate-500 text-center flex items-center justify-center mt-2">
                        <Info className="w-3.5 h-3.5 mr-1" /> Sign in to save calculations
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Summary */}
          <div className="lg:col-span-8 space-y-6">
            {!results ? (
              <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed">
                <p className="text-slate-400">Please provide valid inputs to see the comparison.</p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strategy 1: Reduce Tenure */}
                  <Card className="border-emerald-500/30 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <CardTitle className="text-lg">Strategy 1: Reduce Tenure</CardTitle>
                      </div>
                      <CardDescription>Keep EMI same, pay off loan faster.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                        <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Total Interest Saved</p>
                        <p className="text-3xl font-extrabold text-emerald-700">{formatINR(results.reduceTenure.interestSaved)}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="text-slate-600">New Tenure</span>
                          <span className="font-bold text-slate-900">{results.reduceTenure.newTenure} months</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="text-slate-600">Tenure Saved</span>
                          <span className="font-bold text-emerald-600">{results.reduceTenure.tenureSaved} months</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-slate-600">Monthly EMI</span>
                          <span className="font-bold text-slate-900">{formatINR(results.reduceTenure.newEmi)} <span className="text-xs text-slate-400 font-normal">(Unchanged)</span></span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t pt-4">
                      <p className="text-xs text-slate-500"><strong className="text-slate-700">Best for:</strong> Borrowers who want to minimize total interest outflow and get debt-free sooner.</p>
                    </CardFooter>
                  </Card>

                  {/* Strategy 2: Reduce EMI */}
                  <Card className="border-blue-500/30 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">Strategy 2: Reduce EMI</CardTitle>
                      </div>
                      <CardDescription>Keep tenure same, lower monthly burden.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Monthly EMI Reduction</p>
                        <p className="text-3xl font-extrabold text-blue-700">{formatINR(results.reduceEmi.emiReduction)}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="text-slate-600">New EMI</span>
                          <span className="font-bold text-blue-600">{formatINR(results.reduceEmi.newEmi)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="text-slate-600">Old EMI</span>
                          <span className="font-bold text-slate-900">{formatINR(results.reduceEmi.oldEmi)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-slate-600">Interest Saved</span>
                          <span className="font-bold text-slate-900">{formatINR(results.reduceEmi.interestSaved)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t pt-4">
                      <p className="text-xs text-slate-500"><strong className="text-slate-700">Best for:</strong> Borrowers looking to free up immediate monthly cash flow for other investments or expenses.</p>
                    </CardFooter>
                  </Card>
                </div>

                {/* Chart Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Remaining Interest Comparison</CardTitle>
                    <CardDescription>Visual breakdown of total interest paid across scenarios.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b' }}
                            tickFormatter={(value) => `₹${(value/100000).toFixed(1)}L`} 
                          />
                          <RechartsTooltip 
                            formatter={(value: number) => formatINR(value)}
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="Remaining Interest" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Disclaimer Text */}
                <div className="bg-white rounded-lg p-4 border text-xs text-slate-500 leading-relaxed">
                  <strong>Note:</strong> Actual lender calculations may differ slightly due to exact payment dates, days-in-month rounding conventions, interest calculation methodology, and applicable part-payment or foreclosure charges. Always consult your bank's final statement.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

