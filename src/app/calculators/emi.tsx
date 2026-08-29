import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Save, RotateCcw, Info, CheckCircle2, Calculator } from 'lucide-react';
import { useAuth } from '@/src/components/auth/auth-provider';
import { saveCalculation } from '@/src/lib/supabase/calculations';
import { calculateEMIDetails } from '@/src/lib/calculators/emi';
import { formatINR } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';

const emiSchema = z.object({
  principal: z.coerce.number().min(1000, "Minimum amount is ₹1,000"),
  interestRate: z.coerce.number().min(0.0000000001, "Minimum rate must be > 0%").max(100, "Maximum rate is 100%"),
  tenure: z.coerce.number().min(1, "Minimum tenure is 1").max(360, "Maximum tenure is 360"),
  tenureUnit: z.enum(["months", "years"])
});

type EMIFormValues = z.infer<typeof emiSchema>;

const DEFAULT_VALUES: EMIFormValues = {
  principal: 1000000,
  interestRate: 8.5,
  tenure: 10,
  tenureUnit: "years"
};

const COLORS = ['#3b82f6', '#f59e0b']; // Blue for Principal, Amber for Interest

export function EMICalculator() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [results, setResults] = useState<ReturnType<typeof calculateEMIDetails> | null>(null);

  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm<EMIFormValues>({
    // @ts-expect-error - Zod coerce causes type mismatch with hook-form input types
    resolver: zodResolver(emiSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    // Initial calculation on mount
    const months = DEFAULT_VALUES.tenureUnit === 'years' ? DEFAULT_VALUES.tenure * 12 : DEFAULT_VALUES.tenure;
    setResults(calculateEMIDetails(DEFAULT_VALUES.principal, DEFAULT_VALUES.interestRate, months));
  }, []);

  const onCalculate = (data: EMIFormValues) => {
    const months = data.tenureUnit === 'years' ? data.tenure * 12 : data.tenure;
    setResults(calculateEMIDetails(data.principal, data.interestRate, months));
  };

  const handleSave = async () => {
    const currentValues = getValues();
    const parsed = emiSchema.safeParse(currentValues);
    if (!user || !results || !parsed.success) return;
    
    try {
      setSaving(true);
      await saveCalculation(user.id, 'EMI', parsed.data, {
        emi: results.emi,
        totalInterest: results.totalInterest,
        totalPayment: results.totalPayment
      });
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
    { name: 'Principal', value: results.principal },
    { name: 'Total Interest', value: results.totalInterest }
  ] : [];

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">EMI Calculator</h1>
          <p className="text-slate-600">Calculate your Equated Monthly Installment and view the full amortization schedule.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
                <CardDescription>Enter your loan details to calculate EMI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onCalculate as any)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="principal">Loan Amount (₹)</Label>
                    <Input 
                      id="principal" 
                      type="number"
                      placeholder="1000000"
                      {...register('principal')}
                    />
                    {errors.principal && <p className="text-xs text-destructive">{errors.principal.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                    <Input 
                      id="interestRate" 
                      type="number"
                      step="any"
                      placeholder="8.5"
                      {...register('interestRate')}
                    />
                    {errors.interestRate && <p className="text-xs text-destructive">{errors.interestRate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenure">Loan Tenure</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input 
                          id="tenure" 
                          type="number"
                          placeholder="10"
                          {...register('tenure')}
                        />
                      </div>
                      <select 
                        className="flex h-10 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('tenureUnit')}
                      >
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                    {errors.tenure && <p className="text-xs text-destructive">{errors.tenure.message}</p>}
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <Button type="submit" className="w-full font-bold">
                      <Calculator className="w-4 h-4 mr-2" /> Calculate EMI
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
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Summary Card */}
              <Card className="h-full flex flex-col justify-center shadow-md border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="text-center mb-8">
                    <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Monthly EMI</p>
                    <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                      {results ? formatINR(results.emi) : '₹0'}
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-primary/10">
                      <span className="text-slate-600 font-medium">Principal Amount</span>
                      <span className="font-bold text-slate-900">{results ? formatINR(results.principal) : '₹0'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-primary/10">
                      <span className="text-slate-600 font-medium">Total Interest</span>
                      <span className="font-bold text-slate-900">{results ? formatINR(results.totalInterest) : '₹0'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-slate-600 font-medium">Total Payment</span>
                      <span className="font-bold text-primary">{results ? formatINR(results.totalPayment) : '₹0'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart Card */}
              <Card className="h-full min-h-[300px] flex items-center justify-center shadow-sm">
                <CardContent className="pt-6 w-full h-full">
                  {results ? (
                    <div className="w-full h-full flex flex-col items-center">
                      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Breakdown</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: number) => formatINR(value)}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      Invalid input parameters
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Amortization Schedule */}
            {results && results.schedule.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amortization Schedule</CardTitle>
                  <CardDescription>Month-by-month breakdown of your loan repayment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b">
                        <tr>
                          <th className="px-6 py-4 font-medium">Month</th>
                          <th className="px-6 py-4 font-medium text-right">Opening Bal</th>
                          <th className="px-6 py-4 font-medium text-right">EMI</th>
                          <th className="px-6 py-4 font-medium text-right">Principal</th>
                          <th className="px-6 py-4 font-medium text-right">Interest</th>
                          <th className="px-6 py-4 font-medium text-right">Closing Bal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.schedule.map((row) => (
                          <tr key={row.month} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3 font-medium text-slate-900">{row.month}</td>
                            <td className="px-6 py-3 text-right text-slate-600">{formatINR(row.openingBalance)}</td>
                            <td className="px-6 py-3 text-right font-medium text-primary">{formatINR(row.emi)}</td>
                            <td className="px-6 py-3 text-right text-slate-600">{formatINR(row.principal)}</td>
                            <td className="px-6 py-3 text-right text-slate-600">{formatINR(row.interest)}</td>
                            <td className="px-6 py-3 text-right font-medium text-slate-900">{formatINR(row.closingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
