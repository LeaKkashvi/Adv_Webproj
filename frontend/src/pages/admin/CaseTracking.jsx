import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Filter,
  LayoutList,
  Columns3,
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import { StatusBadge } from '../../components/client/StatusBadge';
import { Loader } from '../../components/common/Loader';

const kanbanColumns = [
  { key: 'submitted', label: 'Submitted', color: 'bg-blue-50 border-blue-200' },
  { key: 'under_review', label: 'Under Review', color: 'bg-indigo-50 border-indigo-200' },
  { key: 'assigned', label: 'Assigned', color: 'bg-violet-50 border-violet-200' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-primary-50 border-primary-200' },
  { key: 'awaiting_client', label: 'Awaiting Client', color: 'bg-amber-50 border-amber-200' },
  { key: 'resolved', label: 'Resolved', color: 'bg-green-50 border-green-200' },
];

export function CaseTracking() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('kanban');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (priorityFilter) params.priority = priorityFilter;
      const res = await adminApi.getCases(params);
      setCases(res.data || res.cases || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [priorityFilter]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const getCasesByStatus = (status) =>
    cases.filter((c) => c.status === status);

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cases Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Track deadlines and milestones across all active cases</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}
            className="p-2 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-gray-100"
            title={viewMode === 'kanban' ? 'Switch to list' : 'Switch to kanban'}>
            {viewMode === 'kanban' ? <LayoutList className="w-5 h-5" /> : <Columns3 className="w-5 h-5" />}
          </button>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <button onClick={fetchCases} className="p-2 text-gray-500 hover:text-primary-600">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <Loader size="md" className="py-12" />
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colCases = getCasesByStatus(col.key);
            return (
              <div key={col.key} className={`flex-shrink-0 w-72 rounded-lg border ${col.color}`}>
                <div className="p-3 border-b border-inherit">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                    <span className="text-xs font-medium text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
                      {colCases.length}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[100px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  {colCases.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No cases</p>
                  ) : (
                    colCases.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => setSelectedCase(selectedCase?._id === c._id ? null : c)}
                        className={`bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm ${
                          selectedCase?._id === c._id ? 'ring-2 ring-primary-500 shadow-sm' : 'border-gray-200'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{c.title}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            c.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            c.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {c.priority}
                          </span>
                          <span className="text-[10px] text-gray-400 capitalize">
                            {c.serviceCategory?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {c.deadline && (
                          <div className={`flex items-center gap-1 text-xs ${isOverdue(c.deadline) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {formatDate(c.deadline)}
                            {isOverdue(c.deadline) && <span className="text-red-500 ml-1">Overdue</span>}
                          </div>
                        )}
                        {c.clientId?.name && (
                          <p className="text-[10px] text-gray-400 mt-1">{c.clientId.name}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cases.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No cases found</td></tr>
                ) : cases.map((c) => (
                  <tr key={c._id} className={`hover:bg-gray-50 ${selectedCase?._id === c._id ? 'bg-primary-50' : ''}`}
                    onClick={() => setSelectedCase(selectedCase?._id === c._id ? null : c)}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[200px] truncate">{c.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.clientId?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        c.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        c.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>{c.priority}</span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                    <td className={`px-6 py-4 text-sm ${isOverdue(c.deadline) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {formatDate(c.deadline)}
                      {isOverdue(c.deadline) && <span className="ml-1 text-red-500">!</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCase && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedCase.title}</h3>
              <p className="text-sm text-gray-500 capitalize">{selectedCase.serviceCategory?.replace(/_/g, ' ')}</p>
            </div>
            <StatusBadge status={selectedCase.status} size="md" />
          </div>
          <p className="text-sm text-gray-600 mb-4">{selectedCase.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Priority</p>
              <p className="font-medium capitalize">{selectedCase.priority}</p>
            </div>
            <div>
              <p className="text-gray-500">Client</p>
              <p className="font-medium">{selectedCase.clientId?.name || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Deadline</p>
              <p className={`font-medium ${isOverdue(selectedCase.deadline) ? 'text-red-600' : ''}`}>
                {formatDate(selectedCase.deadline)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium">{formatDate(selectedCase.createdAt)}</p>
            </div>
          </div>
          {selectedCase.statusHistory?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Status History</h4>
              <div className="space-y-2">
                {selectedCase.statusHistory.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700 capitalize">{h.status?.replace(/_/g, ' ')}</span>
                    <span className="text-gray-400">&middot;</span>
                    <span className="text-gray-500">{formatDate(h.changedAt)}</span>
                    {h.notes && <span className="text-gray-400 italic">&mdash; {h.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CaseTracking;
