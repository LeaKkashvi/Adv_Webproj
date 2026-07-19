import {
  LayoutDashboard,
  User,
  BadgeCheck,
  FileUp,
  FolderOpen,
  Columns3,
  FileSearch,
  Settings,
} from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';

const advocateNavItems = [
  { to: '/advocate', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/advocate/cases', label: 'Case Management', icon: FolderOpen },
  { to: '/advocate/cases-tracking', label: 'Cases Tracking', icon: Columns3 },
  { to: '/advocate/documents', label: 'Document Review', icon: FileSearch },
  { to: '/advocate/profile', label: 'My Profile', icon: User },
  { to: '/advocate/verification', label: 'Verification Status', icon: BadgeCheck },
  { to: '/advocate/credentials/submit', label: 'Submit Credentials', icon: FileUp },
  { to: '/advocate/roles', label: 'Role Management', icon: Settings },
];

export function AdvocateLayout({ children }) {
  return (
    <DashboardLayout navItems={advocateNavItems} portalName="Advocate Portal">
      {children}
    </DashboardLayout>
  );
}

export default AdvocateLayout;
