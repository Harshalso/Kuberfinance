import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './require-auth';
import { RequireAdmin } from './require-admin';
import * as AuthProvider from './auth-provider';

// Mock Supabase
vi.mock('@/src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    }
  }
}));

describe('Auth Routing & Access', () => {
  it('should redirect to login for unauthorized route', () => {
    vi.spyOn(AuthProvider, 'useAuth').mockReturnValue({ user: null, loading: false } as any);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should allow access to user route when authenticated', () => {
    vi.spyOn(AuthProvider, 'useAuth').mockReturnValue({ 
      user: { id: '123', email: 'test@test.com' }, 
      loading: false 
    } as any);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should block user from admin route', () => {
    vi.spyOn(AuthProvider, 'useAuth').mockReturnValue({ 
      user: { id: '123', email: 'test@test.com' }, 
      isAdmin: false,
      loading: false 
    } as any);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<div>Admin Panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('should allow admin to access admin route', () => {
    vi.spyOn(AuthProvider, 'useAuth').mockReturnValue({ 
      user: { id: '123', email: 'admin@test.com' }, 
      isAdmin: true,
      loading: false 
    } as any);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<div>Admin Panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });
});
