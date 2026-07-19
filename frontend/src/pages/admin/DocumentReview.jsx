import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import adminApi from '../../api/adminApi';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/client/StatusBadge';
import { Loader } from '../../components/common/Loader';

export function DocumentReview() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const fetchDocuments = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getDocuments(params);
      setDocuments(res.data || res.documents || []);
      setPagination((prev) => ({ ...prev, page, total: res.pagination?.total ?? 0 }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.limit]);

  useEffect(() => { fetchDocuments(1); }, [fetchDocuments]);

  const handleApprove = async (docId) => {
    setActionLoading(true);
    setError('');
    try {
      await adminApi.approveDocument(docId, '');
      setSuccess('Document approved');
      setDocuments((prev) => prev.map((d) => d._id === docId ? { ...d, verificationStatus: 'approved' } : d));
      if (selectedDoc?._id === docId) setSelectedDoc({ ...selectedDoc, verificationStatus: 'approved' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (docId) => {
    if (!rejectReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await adminApi.rejectDocument(docId, rejectReason);
      setSuccess('Document rejected');
      setDocuments((prev) => prev.map((d) => d._id === docId ? { ...d, verificationStatus: 'rejected' } : d));
      if (selectedDoc?._id === docId) setSelectedDoc({ ...selectedDoc, verificationStatus: 'rejected' });
      setShowReject(false);
      setRejectReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingDocs = documents.filter((d) => d.verificationStatus === 'pending');
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Review and verify client-uploaded documents</p>
        </div>
        <button onClick={() => fetchDocuments(pagination.page)} className="p-2 text-gray-500 hover:text-primary-600">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto">&times;</button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500">
          <option value="">All Documents</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="text-sm text-gray-500">
          {pendingDocs.length} pending review
        </span>
      </div>

      {loading ? (
        <Loader size="md" className="py-12" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents</h3>
            {documents.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No documents found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {documents.map((doc) => (
                  <button
                    key={doc._id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedDoc?._id === doc._id
                        ? 'bg-primary-50 border-primary-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.originalFileName || doc.fileName}</p>
                      <StatusBadge status={doc.verificationStatus} size="sm" />
                    </div>
                    <p className="text-xs text-gray-500 capitalize">{doc.category} &middot; {doc.ownerId?.name || 'Unknown'}</p>
                  </button>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => fetchDocuments(pagination.page - 1)} disabled={pagination.page <= 1}
                  className="text-sm text-gray-600 disabled:text-gray-300"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-xs text-gray-500">{pagination.page}/{totalPages}</span>
                <button onClick={() => fetchDocuments(pagination.page + 1)} disabled={pagination.page >= totalPages}
                  className="text-sm text-gray-600 disabled:text-gray-300"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedDoc ? (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedDoc.originalFileName || selectedDoc.fileName}</h3>
                    <p className="text-sm text-gray-500">
                      Uploaded by {selectedDoc.ownerId?.name || 'Unknown'} &middot;{' '}
                      {new Date(selectedDoc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={selectedDoc.verificationStatus} size="md" />
                </div>

                <div className="p-4">
                  <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
                    {selectedDoc.cloudinaryUrl ? (
                      selectedDoc.fileType?.includes('pdf') ? (
                        <iframe src={selectedDoc.cloudinaryUrl} className="w-full h-full border-0" title="Document" />
                      ) : (
                        <img src={selectedDoc.cloudinaryUrl} alt={selectedDoc.fileName} className="w-full h-full object-contain" />
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <Eye className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                          <p>Document preview not available</p>
                          {selectedDoc.cloudinaryPublicId && (
                            <p className="text-xs text-gray-400 mt-1">ID: {selectedDoc.cloudinaryPublicId}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedDoc.verificationStatus === 'pending' && (
                  <div className="p-4 border-t border-gray-200">
                    {showReject ? (
                      <div className="space-y-3">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:ring-red-500"
                          placeholder="Provide a reason for rejection..."
                        />
                        <div className="flex gap-2">
                          <Button variant="danger" onClick={() => handleReject(selectedDoc._id)} loading={actionLoading}>
                            Confirm Rejection
                          </Button>
                          <Button variant="ghost" onClick={() => { setShowReject(false); setRejectReason(''); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button onClick={() => handleApprove(selectedDoc._id)} loading={actionLoading}
                          className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button variant="danger" onClick={() => setShowReject(true)}>
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Eye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm font-medium text-gray-700">Select a document to review</p>
                <p className="text-xs text-gray-500 mt-1">Click on a document from the list to view and verify it.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentReview;
