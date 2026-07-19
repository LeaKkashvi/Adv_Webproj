import { CheckCircle, Clock, XCircle, AlertTriangle, FileText } from 'lucide-react';

const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pending',
  },
  under_review: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: AlertTriangle,
    label: 'Under Review',
  },
  approved: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Approved',
  },
  verified: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Verified',
  },
  rejected: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Rejected',
  },
  submitted: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: FileText,
    label: 'Submitted',
  },
  assigned: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: CheckCircle,
    label: 'Assigned',
  },
  in_progress: {
    color: 'bg-primary-100 text-primary-800 border-primary-200',
    icon: Clock,
    label: 'In Progress',
  },
  resolved: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Resolved',
  },
  closed: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: CheckCircle,
    label: 'Closed',
  },
};

export function StatusBadge({ status, size = 'sm', className = '' }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${config.color} ${sizes[size]} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

export default StatusBadge;
