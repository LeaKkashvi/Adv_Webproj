import { useState, useEffect } from "react";
import {
  Briefcase,
  Clock,
  CheckCircle,
  FileWarning,
  Users,
  Shield,
} from "lucide-react";
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
} from "recharts";
import StatCard from "../../components/admin/StatCard";
import ChartCard from "../../components/admin/ChartCard";
import Loader from "../../components/common/Loader";
import {
  getDashboardOverview,
  getCaseAnalytics,
  getUserAnalytics,
  getDocumentAnalytics,
  getAdvocateAnalytics,
} from "../../api/analyticsApi";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [advocateData, setAdvocateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [overviewRes, caseRes, userRes, docRes, advRes] =
          await Promise.all([
            getDashboardOverview(),
            getCaseAnalytics(),
            getUserAnalytics(),
            getDocumentAnalytics(),
            getAdvocateAnalytics(),
          ]);
        setOverview(overviewRes.data);
        setCaseData(caseRes.data);
        setUserData(userRes.data);
        setDocumentData(docRes.data);
        setAdvocateData(advRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Active Cases"
          value={overview?.activeCases ?? 0}
          icon={Briefcase}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={overview?.pendingRequests ?? 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Completed Cases"
          value={overview?.completedCases ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Doc Verifications"
          value={overview?.pendingDocumentVerifications ?? 0}
          icon={FileWarning}
          color="orange"
        />
        <StatCard
          title="Active Clients"
          value={overview?.totalClients ?? 0}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Verified Advocates"
          value={overview?.verifiedAdvocates ?? 0}
          icon={Shield}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Case Volume Trend">
          {caseData?.caseVolumeTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={caseData.caseVolumeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6" }}
                  name="Cases"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No case data available
            </p>
          )}
        </ChartCard>

        <ChartCard title="Case Status Breakdown">
          {caseData?.caseStatusBreakdown?.length > 0 ? (
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
            <p className="text-gray-500 text-center py-12">
              No case status data available
            </p>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Case Category Distribution">
          {caseData?.caseCategoryBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={caseData.caseCategoryBreakdown}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="_id"
                  stroke="#6B7280"
                  fontSize={12}
                  width={150}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No category data available
            </p>
          )}
        </ChartCard>

        <ChartCard title="Platform User Distribution">
          {userData?.userDistribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userData.userDistribution}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ _id, count }) => `${_id}: ${count}`}
                >
                  {userData.userDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No user data available
            </p>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Registration Trend">
          {userData?.registrationTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userData.registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: "#10B981" }}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No registration data available
            </p>
          )}
        </ChartCard>

        <ChartCard title="Document Verification Status">
          {documentData?.documentVerificationStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentData.documentVerificationStatus}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ _id, count }) => `${_id}: ${count}`}
                >
                  {documentData.documentVerificationStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No document data available
            </p>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Top Performing Advocates">
        {advocateData?.topAdvocates?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Cases Completed
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Average Rating
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Avg Response Time (hrs)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {advocateData.topAdvocates.map((adv) => (
                  <tr key={adv._id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {adv.userId?.name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {adv.userId?.email || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {adv.casesCompleted ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {adv.averageRating
                        ? adv.averageRating.toFixed(1)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {adv.averageResponseTimeHours
                        ? adv.averageResponseTimeHours.toFixed(1)
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            No advocate data available
          </p>
        )}
      </ChartCard>
    </div>
  );
}
