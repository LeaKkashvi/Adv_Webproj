import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  CheckCircle,
  FileWarning,
  Users,
  Shield,
  ArrowRight,
  FolderOpen,
  FileSearch,
  Columns3,
  Settings,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import StatCard from '../../components/admin/StatCard';
import ChartCard from '../../components/admin/ChartCard';
import { StatusBadge } from '../../components/client/StatusBadge';
import { getDashboardOverview, getCaseAnalytics } from '../../api/analyticsApi';

const COLORS = ['#0B192C', '#D97706', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#06B6D4'];

const mockOverview = {
  activeCases: 24,
  pendingRequests: 8,
  completedCases: 156,
  pendingDocumentVerifications: 12,
  totalClients: 89,
  verifiedAdvocates: 18,
};

const mockCaseVolume = [
  { month: 'Jan', count: 12 },
  { month: 'Feb', count: 18 },
  { month: 'Mar', count: 15 },
  { month: 'Apr', count: 22 },
  { month: 'May', count: 28 },
  { month: 'Jun', count: 24 },
  { month: 'Jul', count: 32 },
];

const mockStatusBreakdown = [
  { _id: 'In Progress', count: 14 },
  { _id: 'Submitted', count: 8 },
  { _id: 'Resolved', count: 22 },
  { _id: 'Assigned', count: 6 },
  { _id: 'Awaiting Client', count: 4 },
];

const mockRecentCases = [
  { _id: '1', title: 'Property Dispute - Mumbai', status: 'in_progress', serviceCategory: 'property_dispute', priority: 'urgent' },
  { _id: '2', title: 'NRI Land Registration', status: 'assigned', serviceCategory: 'property_registration', priority: 'normal' },
  { _id: '3', title: 'Power of Attorney - Delhi', status: 'submitted', serviceCategory: 'power_of_attorney', priority: 'normal' },
  { _id: '4', title: 'Legal Documentation - Chennai', status: 'resolved', serviceCategory: 'legal_documentation', priority: 'low' },
  { _id: '5', title: 'Land Title Verification', status: 'in_progress', serviceCategory: 'land_documentation', priority: 'urgent' },
];

const quickLinks = [
  { to: '/advocate/cases', label: 'Case Management', icon: FolderOpen, desc: 'Create and manage cases' },
  { to: '/advocate/cases-tracking', label: 'Cases Tracking', icon: Columns3, desc: 'Track milestones & deadlines' },
  { to: '/advocate/documents', label: 'Document Review', icon: FileSearch, desc: 'Verify client documents' },
  { to: '/advocate/roles', label: 'Role Management', icon: Settings, desc: 'Manage permissions' },
];

export default function AdvocateDashboard() {
  const [overview, setOverview] = useState(mockOverview);
  const [caseData, setCaseData] = useState({ caseVolumeTrend: mockCaseVolume, caseStatusBreakdown: mockStatusBreakdown });
  const [recentCases, setRecentCases] = useState(mockRecentCases);
  const [usingMock, setUsingMock] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [overviewRes, caseRes] = await Promise.allSettled([
          getDashboardOverview(),
          getCaseAnalytics(),
        ]);

        if (overviewRes.status === 'fulfilled' && overviewRes.value?.data) {
          setOverview(overviewRes.value.data);
          setUsingMock(false);
        }
        if (caseRes.status === 'fulfilled' && caseRes.value?.data) {
          const cd = caseRes.value.data;
          if (cd.caseVolumeTrend?.length > 0) {
            setCaseData((prev) => ({ ...prev, caseVolumeTrend: cd.caseVolumeTrend }));
          }
          if (cd.caseStatusBreakdown?.length > 0) {
            setCaseData((prev) => ({ ...prev, caseStatusBreakdown: cd.caseStatusBreakdown }));
          }
          if (cd.recentCases?.length > 0) {
            setRecentCases(cd.recentCases);
          }
        }
      } catch {
        // Keep mock data on failure
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#0B192C] rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D97706]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Advocate Dashboard</h1>
          <p className="text-slate-300 mt-1 text-sm">
            Manage your cases, track client documents, and monitor your practice performance.
          </p>
          {usingMock && !loading && (
            <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Showing demo data
            </span>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Active Cases"
          value={overview.activeCases}
          icon={Briefcase}
          color="blue"
          trend={12}
        />
        <StatCard
          title="Pending Requests"
          value={overview.pendingRequests}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Completed Cases"
          value={overview.completedCases}
          icon={CheckCircle}
          color="green"
          trend={8}
        />
        <StatCard
          title="Pending Verifications"
          value={overview.pendingDocumentVerifications}
          icon={FileWarning}
          color="orange"
        />
        <StatCard
          title="Total NRI Clients"
          value={overview.totalClients}
          icon={Users}
          color="purple"
          trend={15}
        />
        <StatCard
          title="Verified Advocates"
          value={overview.verifiedAdvocates}
          icon={Shield}
          color="emerald"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Case Volume Trend">
          {caseData.caseVolumeTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={caseData.caseVolumeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0B192C"
                  strokeWidth={2}
                  dot={{ fill: '#D97706', strokeWidth: 0 }}
                  activeDot={{ fill: '#D97706', r: 6 }}
                  name="Cases"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-center py-12">No case data available</p>
          )}
        </ChartCard>

        <ChartCard title="Case Status Breakdown">
          {caseData.caseStatusBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={caseData.caseStatusBreakdown}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ _id, count }) => `${_id}: ${count}`}
                >
                  {caseData.caseStatusBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-center py-12">No status data available</p>
          )}
        </ChartCard>
      </div>

      {/* Recent Cases + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Cases</h3>
            <Link
              to="/advocate/cases-tracking"
              className="text-sm text-[#D97706] hover:text-[#B45309] font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentCases.slice(0, 5).map((c) => (
              <div key={c._id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400 capitalize">{c.serviceCategory?.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {c.priority === 'urgent' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                      Urgent
                    </span>
                  )}
                  <StatusBadge status={c.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-[#D97706]/30 hover:bg-[#D97706]/5 transition-all group"
                >
                  <div className="p-2 bg-[#0B192C]/5 rounded-lg group-hover:bg-[#D97706]/10 transition-colors">
                    <Icon className="w-4 h-4 text-[#0B192C] group-hover:text-[#D97706] transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{link.label}</p>
                    <p className="text-xs text-slate-400">{link.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-[#D97706] transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#D97706]" />
          <h3 className="text-lg font-semibold text-slate-900">Performance Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[#0B192C]/[0.03] rounded-lg">
            <p className="text-2xl font-bold text-[#0B192C]">{overview.activeCases}</p>
            <p className="text-xs text-slate-500 mt-1">Active Cases</p>
          </div>
          <div className="text-center p-4 bg-[#D97706]/[0.05] rounded-lg">
            <p className="text-2xl font-bold text-[#D97706]">{overview.pendingRequests}</p>
            <p className="text-xs text-slate-500 mt-1">Pending Review</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{overview.completedCases}</p>
            <p className="text-xs text-slate-500 mt-1">Completed</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{overview.totalClients}</p>
            <p className="text-xs text-slate-500 mt-1">Total Clients</p>
          </div>
        </div>
      </div>
    </div>
  );
}
