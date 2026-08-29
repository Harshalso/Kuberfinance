import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';

export function Contact() {
  return (
    <div className="py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Contact Us</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Have questions about our tools, need support with your subscription, or want to report an outdated bank policy? Our team is here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4 text-sm">For general inquiries, account support, and billing questions.</p>
              <a href="mailto:support@loanportal.com" className="font-semibold text-primary hover:underline">
                support@loanportal.com
              </a>
            </CardContent>
          </Card>

          <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <CardTitle>Phone Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4 text-sm">Available Monday through Friday, 9:00 AM to 6:00 PM (IST).</p>
              <a href="tel:1-800-FINANCE" className="font-semibold text-emerald-600 hover:underline">
                1-800-FINANCE
              </a>
            </CardContent>
          </Card>

          <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <CardTitle>Office Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm leading-relaxed">
                Loan Finance Portal Inc.<br />
                Financial District, Sector 4<br />
                Mumbai, Maharashtra, 400001
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 bg-white rounded-2xl shadow-sm border p-8 md:p-12 text-center max-w-3xl mx-auto">
          <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Update Requests & Contributions</h2>
          <p className="text-slate-600 mb-6">
            Are you an underwriter or a financial institution representative? If you notice outdated internal policies or wish to add your bank's latest LTV guidelines and company categorizations to our portal, please contact our data team directly.
          </p>
          <a href="mailto:data@loanportal.com" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-slate-900 text-white hover:bg-slate-900/90 h-10 px-6 py-2">
            Email Data Team
          </a>
        </div>
      </div>
    </div>
  );
}
