import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FolderOpen,
  FileSearch,
  Columns3,
  Settings,
} from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'User Management', icon: Users },
  { to: '/admin/cases', label: 'Case Management', icon: FolderOpen },
  { to: '/admin/cases-tracking', label: 'Cases Tracking', icon: Columns3 },
  { to: '/admin/documents', label: 'Document Review', icon: FileSearch },
  { to: '/admin/verification', label: 'Verification Queue', icon: ShieldCheck },
  { to: '/admin/roles', label: 'Role Management', icon: Settings },
];

export function AdminLayout({ children }) {
  return (
    <DashboardLayout navItems={adminNavItems} portalName="Admin Portal">
      {children}
    </DashboardLayout>
  );
}

export default AdminLayout;
