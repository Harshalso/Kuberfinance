import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Briefcase, 
  Tags, 
  FileText, 
  Upload, 
  Gift, 
  Users, 
  ClipboardList 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function AdminLayout() {
  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Banks', path: '/admin/banks', icon: Building2 },
    { label: 'Companies', path: '/admin/companies', icon: Briefcase },
    { label: 'Company Categories', path: '/admin/categories', icon: Tags },
    { label: 'Bank Policies', path: '/admin/policies', icon: FileText },
    { label: 'Excel Imports', path: '/admin/company-import', icon: Upload },
    { label: 'Offers', path: '/admin/offers', icon: Gift },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Audit Logs', path: '/admin/audit', icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-slate-200 bg-white">
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Admin Console</h2>
          <p className="text-sm text-slate-500">Manage platform data</p>
        </div>
        <nav className="space-y-1 px-3 pb-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              <item.icon className={cn("flex-shrink-0 -ml-1 mr-3 h-5 w-5")} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
