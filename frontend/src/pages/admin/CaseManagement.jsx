import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Calendar,
  User,
  ChevronDown,
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/client/StatusBadge';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';

const serviceCategories = [
  'property_registration',
  'land_documentation',
  'property_dispute',
  'power_of_attorney',
  'legal_documentation',
  'general_legal_assistance',
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
];

export function CaseManagement() {
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    serviceCategory: 'property_registration',
    priority: 'normal',
    clientId: '',
  });
  const [caseUpdate, setCaseUpdate] = useState({ status: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await adminApi.getCases(params);
      setCases(res.data || res.cases || []);
      setPagination((prev) => ({ ...prev, page, total: res.pagination?.total ?? 0 }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, pagination.limit]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminApi.getAllUsers({ limit: 200, role: 'client' });
      setUsers(res.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCases(1); }, [fetchCases]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreateCase = async () => {
    if (!newCase.title.trim() || !newCase.description.trim()) {
      setError('Title and description are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await adminApi.createCase(newCase);
      setShowCreateModal(false);
      setNewCase({ title: '', description: '', serviceCategory: 'property_registration', priority: 'normal', clientId: '' });
      await fetchCases(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!caseUpdate.status) {
      setError('Please select a status');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await adminApi.addCaseUpdate(selectedCase._id, caseUpdate);
      setShowUpdateModal(false);
      setCaseUpdate({ status: '', notes: '' });
      setSelectedCase(null);
      await fetchCases(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update case');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create, assign, and manage legal cases</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchCases(pagination.page)} className="p-2 text-gray-500 hover:text-primary-600">
            <RefreshCw className="w-5 h-5" />
          </button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Case
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto">&times;</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <Loader size="md" className="py-12" />
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No cases found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cases.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[200px] truncate">{c.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.clientId?.name || c.clientId || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{c.serviceCategory?.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        c.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        c.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setSelectedCase(c); setShowUpdateModal(true); }}
                        className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <button onClick={() => fetchCases(pagination.page - 1)} disabled={pagination.page <= 1}
                className="text-sm text-gray-600 disabled:text-gray-300">← Previous</button>
              <span className="text-sm text-gray-500">Page {pagination.page} of {totalPages}</span>
              <button onClick={() => fetchCases(pagination.page + 1)} disabled={pagination.page >= totalPages}
                className="text-sm text-gray-600 disabled:text-gray-300">Next →</button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Case" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={newCase.title} onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Case title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={newCase.description} onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
              rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the case details" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={newCase.serviceCategory} onChange={(e) => setNewCase({ ...newCase, serviceCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                {serviceCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={newCase.priority} onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Client</label>
            <select value={newCase.clientId} onChange={(e) => setNewCase({ ...newCase, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">Select a client</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateCase} loading={submitting}>Create Case</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title={`Update: ${selectedCase?.title || ''}`} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
            <select value={caseUpdate.status} onChange={(e) => setCaseUpdate({ ...caseUpdate, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">Select status</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_client">Awaiting Client</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={caseUpdate.notes} onChange={(e) => setCaseUpdate({ ...caseUpdate, notes: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Add notes about this update" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>Cancel</Button>
            <Button onClick={handleAddUpdate} loading={submitting}>Save Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CaseManagement;
