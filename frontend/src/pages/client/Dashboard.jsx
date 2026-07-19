import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FolderOpen, Bell, Scale, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clientApi from '../../api/clientApi';
import { StatusBadge } from '../../components/client/StatusBadge';
import { Loader } from '../../components/common/Loader';

export function ClientDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await clientApi.getDashboardSummary();
        setSummary(response.data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <Loader size="md" className="py-12" />;

  const stats = [
    {
      label: 'Active Cases',
      value: summary?.stats?.activeCases ?? 0,
      icon: Scale,
      color: 'bg-primary-100 text-primary-600',
      link: '/client/cases',
    },
    {
      label: 'Total Cases',
      value: summary?.stats?.totalCases ?? 0,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
      link: '/client/cases',
    },
    {
      label: 'Pending Documents',
      value: summary?.stats?.pendingDocuments ?? 0,
      icon: FolderOpen,
      color: 'bg-amber-100 text-amber-600',
      link: '/client/documents',
    },
    {
      label: 'Notifications',
      value: summary?.notifications?.filter((n) => !n.read).length ?? 0,
      icon: Bell,
      color: 'bg-red-100 text-red-600',
      link: '/client/notifications',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-primary-900 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name?.split(' ')[0] || 'Client'}
          </h1>
          <p className="text-primary-300 mt-1 text-sm">
            Here's an overview of your legal matters.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Cases</h2>
            <Link to="/client/cases" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {summary?.recentCases?.length > 0 ? (
            <div className="space-y-3">
              {summary.recentCases.slice(0, 3).map((c) => (
                <div key={c._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{c.serviceCategory?.replace(/_/g, ' ')}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">No cases yet</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            <Link to="/client/notifications" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {summary?.notifications?.length > 0 ? (
            <div className="space-y-3">
              {summary.notifications.slice(0, 3).map((n) => (
                <div key={n.id} className={`p-3 rounded-lg ${!n.read ? 'bg-primary-50' : 'bg-gray-50'}`}>
                  <p className="text-sm font-medium text-gray-900">{n.title || n.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">No notifications</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;
