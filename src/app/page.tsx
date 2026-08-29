import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, PieChart, Building2, FileText, CheckCircle2, TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/card';
import { HotOffers } from '@/src/components/home/hot-offers';

export function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden border-b">
        <div className="absolute inset-0 bg-slate-50/50 -z-10"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-6">
            The Professional Standard
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6">
            Smart Tools for <span className="text-primary">Smarter Loan Decisions</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
            The ultimate utility portal for finance professionals. Calculate precise EMIs, evaluate part payment benefits, search company categories, and access single-pager bank policies instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="rounded-full px-8 text-base h-12">
              <Link to="/emi-calculator">
                Calculate EMI <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base h-12 bg-white">
              <Link to="/policies">Explore Policies</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Hot Offers Section */}
      <HotOffers />

      {/* Four Primary Tools */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Core Utility Suite</h2>
            <p className="text-slate-600">Everything you need to analyze, quote, and convert leads in a single professional toolkit.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "EMI Calculator",
                description: "Generate precise amortization schedules with advanced compounding factors.",
                icon: Calculator,
                link: "/emi-calculator",
                color: "text-blue-500",
                bg: "bg-blue-500/10"
              },
              {
                title: "Part Payment",
                description: "Analyze the long-term impact of pre-payments on interest savings and tenure reduction.",
                icon: PieChart,
                link: "/part-payment-calculator",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10"
              },
              {
                title: "Company Search",
                description: "Instantly lookup corporate categorizations to determine accurate loan eligibility.",
                icon: Building2,
                link: "/company-search",
                color: "text-indigo-500",
                bg: "bg-indigo-500/10"
              },
              {
                title: "Bank Policies",
                description: "Access curated, single-pager internal credit policies and LTV guidelines.",
                icon: FileText,
                link: "/policies",
                color: "text-amber-500",
                bg: "bg-amber-500/10"
              }
            ].map((tool, idx) => (
              <Card key={idx} className="group hover:border-primary/50 transition-all hover:shadow-lg flex flex-col h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.bg}`}>
                    <tool.icon className={`w-6 h-6 ${tool.color}`} />
                  </div>
                  <CardTitle>{tool.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-slate-600 leading-relaxed">{tool.description}</p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                    <Link to={tool.link}>Launch Tool</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits / How It Works */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Streamline your financial advisory workflow.</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                We've digitized the manual processes of loan consultation. No more flipping through outdated PDFs or running excel macros to answer basic client questions.
              </p>
              
              <div className="space-y-4">
                {[
                  "Cloud-synced calculations saved to your profile.",
                  "Real-time bank policy updates managed by admins.",
                  "Instant ROI and interest savings generation.",
                  "Enterprise-grade data security and privacy."
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mr-3" />
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl relative">
              <h3 className="text-xl font-bold mb-6">How it works</h3>
              <div className="space-y-8">
                <div className="flex gap-4 relative">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 z-10 outline outline-8 outline-slate-800 text-primary font-bold">1</div>
                  <div className="absolute left-5 top-10 bottom-[-30px] w-px bg-slate-700"></div>
                  <div>
                    <h4 className="font-semibold mb-1">Search the Client's Profile</h4>
                    <p className="text-sm text-slate-400">Use the Company Search tool to define their corporate category.</p>
                  </div>
                </div>
                <div className="flex gap-4 relative">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 z-10 outline outline-8 outline-slate-800 text-primary font-bold">2</div>
                  <div className="absolute left-5 top-10 bottom-[-30px] w-px bg-slate-700"></div>
                  <div>
                    <h4 className="font-semibold mb-1">Verify Policies</h4>
                    <p className="text-sm text-slate-400">Check the active Bank Single-Pager Policy to confirm exact eligibility.</p>
                  </div>
                </div>
                <div className="flex gap-4 relative">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 z-10 outline outline-8 outline-slate-800 text-white font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Generate Scenarios</h4>
                    <p className="text-sm text-slate-400">Run the EMI and Part Payment calculators to structure the perfect deal.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-slate-100 py-8 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <p className="text-xs text-slate-500 text-center max-w-4xl mx-auto leading-relaxed">
            <strong>Disclaimer:</strong> The calculators and tools provided on this portal are designed for illustrative and informational purposes only. The results generated do not constitute a formal loan offer, financial advice, or a guarantee of credit approval from any specific banking institution. Bank policies, interest rates, and eligibility criteria are subject to change without notice. Always verify final figures directly with the respective lending institution before executing any financial agreements.
          </p>
        </div>
      </section>
    </div>
  );
}
