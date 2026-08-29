import React from 'react';
import { Settings, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';

function PlaceholderModule({ title, description }: { title: string, description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card className="border-dashed border-2 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <Settings className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Module Under Construction</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            The {title} module is currently being built. It will provide full CRUD capabilities according to the system specification.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const AdminBanks = () => <PlaceholderModule title="Bank Management" description="Create, edit, and activate/deactivate banks." />;
export const AdminCompanies = () => <PlaceholderModule title="Company Management" description="Manage unified company records." />;
export const AdminCategories = () => <PlaceholderModule title="Company Categories" description="Manage category mappings between banks and companies." />;
export const AdminPolicies = () => <PlaceholderModule title="Bank Policies" description="Create, edit, and version bank policy documents." />;
export const AdminUsers = () => <PlaceholderModule title="User Management" description="View user roles and manage access." />;
