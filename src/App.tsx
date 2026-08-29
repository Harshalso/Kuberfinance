/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './app/layout';
import { Home } from './app/page';
import { AuthProvider } from './components/auth/auth-provider';
import { RequireAuth } from './components/auth/require-auth';
import { RequireSubscription } from './components/auth/require-subscription';
import { RequireAdmin } from './components/auth/require-admin';

import { Login } from './app/auth/login';
import { Register } from './app/auth/register';
import { ForgotPassword } from './app/auth/forgot-password';
import { ResetPassword } from './app/auth/reset-password';

import { Dashboard } from './app/dashboard/page';

// Admin Routes
import { AdminLayout } from './app/admin/layout';
import { AdminDashboard } from './app/admin/page';
import { CompanyImport } from './app/admin/company-import';
import { AdminOffers } from './app/admin/offers';
import { 
  AdminBanks, 
  AdminCompanies, 
  AdminCategories, 
  AdminPolicies, 
  AdminUsers 
} from './app/admin/placeholders';
import { AdminAuditLogs } from './app/admin/audit-logs';

// Public Features
import { EMICalculator } from './app/calculators/emi';
import { PartPaymentCalculator } from './app/calculators/part-payment-calculator';
import { CompanySearch } from './app/search/companies';
import { Policies } from './app/policies/page';
import { PolicyDetail } from './app/policies/policy-detail';
import { Offers } from './app/offers/page';

import { PrivacyPolicy } from "./app/legal/privacy";
import { TermsOfService } from "./app/legal/terms";
import { Disclaimer } from "./app/legal/disclaimer";
import { Contact } from "./app/legal/contact";

import { Pricing } from './app/pricing/page';
import { PaymentHistory } from './app/pricing/payment-history';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Public Features */}
            <Route path="/emi-calculator" element={<EMICalculator />} />
            <Route path="/offers" element={<Offers />} />
            
            <Route path="/pricing" element={<Pricing />} />
            {/* Legal & Contact Routes */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Premium Features (Require Subscription) */}
            <Route element={<RequireSubscription />}>
              <Route path="/part-payment-calculator" element={<PartPaymentCalculator />} />
              <Route path="/company-search" element={<CompanySearch />} />
              <Route path="/bank-policies" element={<Policies />} />
              <Route path="/bank-policies/:bankId" element={<PolicyDetail />} />
            </Route>

            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/payment-history" element={<PaymentHistory />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/banks" element={<AdminBanks />} />
                <Route path="/admin/companies" element={<AdminCompanies />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/policies" element={<AdminPolicies />} />
                <Route path="/admin/company-import" element={<CompanyImport />} />
                <Route path="/admin/offers" element={<AdminOffers />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/audit" element={<AdminAuditLogs />} />
              </Route>
            </Route>

          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
