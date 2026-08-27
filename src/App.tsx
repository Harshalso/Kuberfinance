/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './app/layout';
import { Home } from './app/page';
import { AuthProvider } from './components/auth/auth-provider';
import { RequireAuth } from './components/auth/require-auth';
import { RequireAdmin } from './components/auth/require-admin';

import { Login } from './app/auth/login';
import { Register } from './app/auth/register';
import { ForgotPassword } from './app/auth/forgot-password';
import { ResetPassword } from './app/auth/reset-password';
import { Dashboard } from './app/dashboard/page';
import { AdminDashboard } from './app/admin/page';

import { EMICalculator } from './app/calculators/emi';
import { PartPaymentCalculator } from './app/calculators/part-payment-calculator';
import { CompanySearch } from './app/search/companies';
import { Policies } from './app/policies/page';
import { Offers } from './app/offers/page';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Public Features */}
            <Route path="/emi-calculator" element={<EMICalculator />} />
            <Route path="/part-payment-calculator" element={<PartPaymentCalculator />} />
            <Route path="/company-search" element={<CompanySearch />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/offers" element={<Offers />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
